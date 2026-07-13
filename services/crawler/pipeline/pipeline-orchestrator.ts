// services/crawler/pipeline/pipeline-orchestrator.ts
// ── L0-L8 Pipeline Orchestrator ──────────────────────────────────────
// Orchestrates the 9-layer crawler pipeline with fingerprint-first rule:
// L0 -> L5 (probe) -> L1 -> L2 -> L3 -> L4 -> L6 -> L7 -> L8

import type { CrawlConfig } from '@seesby/types';
import type { FingerprintResult } from '@seesby/fingerprint';

import { discoverUrls, type DiscoveryResult } from './L0-discovery';
import { fetchPageBatch, type FetchResult } from './L1-fetch';
import { extractPageBatch, type ExtractionResult } from './L2-extract';
import { enrichPageBatch, type EnrichmentResult } from './L3-enrich';
import { enrichSite, type SiteEnrichmentResult } from './L4-site-enrich';
import { detectFingerprint } from './L5-fingerprint';
import { runL6Score, type ScoreResult } from './L6-score';
import { runL7Action, type ActionResult } from './L7-action';
import { runL8Emit, type EmitResult } from './L8-emit';
import { storageRouter } from '../../StorageRouter';

// ── Pipeline Event Types ───────────────────────────────────────────

export type PipelineLayer =
  | 'L0:discovery'
  | 'L5:fingerprint'
  | 'L1:fetch'
  | 'L2:extract'
  | 'L3:enrich'
  | 'L4:site-enrich'
  | 'L6:score'
  | 'L7:action'
  | 'L8:emit';

export type PipelinePhase = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

export interface PipelineProgress {
  layer: PipelineLayer;
  phase: PipelinePhase;
  message: string;
  current?: number;
  total?: number;
  elapsed?: number; // ms since layer started
  percentComplete?: number; // 0-100
}

export type PipelineEventListener = (progress: PipelineProgress) => void;

// ── Layer Results ───────────────────────────────────────────────────

export interface LayerOutcome<T = unknown> {
  ok: boolean;
  data: T | null;
  error?: string;
  durationMs: number;
}

// ── Pipeline Result ─────────────────────────────────────────────────

export interface PipelineResult {
  /** Pipeline run ID */
  runId: string;
  /** ISO timestamp when pipeline started */
  startedAt: string;
  /** ISO timestamp when pipeline completed */
  completedAt: string;
  /** Total wall-clock time in ms */
  totalDurationMs: number;

  // Layer outputs
  discovery: LayerOutcome<DiscoveryResult>;
  fingerprint: LayerOutcome<FingerprintResult>;
  fetch: LayerOutcome<FetchResult[]>;
  extraction: LayerOutcome<ExtractionResult[]>;
  enrichment: LayerOutcome<EnrichmentResult[]>;
  siteEnrichment: LayerOutcome<SiteEnrichmentResult>;
  scoring: LayerOutcome<ScoreResult>;
  actions: LayerOutcome<ActionResult>;
  emit: LayerOutcome<EmitResult>;

  /** Summary of which layers succeeded/failed */
  layerStatus: Record<PipelineLayer, PipelinePhase>;
}

// ── Pipeline Orchestrator ───────────────────────────────────────────

export class PipelineOrchestrator {
  private listeners: PipelineEventListener[] = [];
  private layerStatus: Record<PipelineLayer, PipelinePhase> = {
    'L0:discovery': 'pending',
    'L5:fingerprint': 'pending',
    'L1:fetch': 'pending',
    'L2:extract': 'pending',
    'L3:enrich': 'pending',
    'L4:site-enrich': 'pending',
    'L6:score': 'pending',
    'L7:action': 'pending',
    'L8:emit': 'pending',
  };

  /** Subscribe to progress events */
  onProgress(listener: PipelineEventListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private emit(progress: PipelineProgress): void {
    this.layerStatus[progress.layer] = progress.phase;
    for (const listener of this.listeners) {
      try {
        listener(progress);
      } catch {
        // Never let listener errors break the pipeline
      }
    }
  }

  /**
   * Run the full L0-L8 pipeline.
   *
   * Execution order:
   *   L0 (discovery) -> L5 (fingerprint on probe) -> L1 (fetch) -> L2 (extract)
   *   -> L3 (per-page enrich) -> L4 (site enrich) -> L6 (score) -> L7 (actions)
   *   -> L8 (emit)
   */
  async runPipeline(config: CrawlConfig): Promise<PipelineResult> {
    const runId = `pipeline-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const startedAt = new Date();
    const results: Partial<PipelineResult> = { runId, startedAt: startedAt.toISOString() };

    const wrap = async <T>(
      layer: PipelineLayer,
      fn: () => Promise<T>,
    ): Promise<LayerOutcome<T>> => {
      this.emit({
        layer,
        phase: 'running',
        message: `Starting ${layer}`,
      });
      const t0 = performance.now();
      try {
        const data = await fn();
        const durationMs = Math.round(performance.now() - t0);
        this.emit({
          layer,
          phase: 'completed',
          message: `Completed ${layer}`,
          durationMs,
        });
        return { ok: true, data, durationMs };
      } catch (err: any) {
        const durationMs = Math.round(performance.now() - t0);
        const message = err?.message ?? String(err);
        this.emit({
          layer,
          phase: 'failed',
          message: `Failed ${layer}: ${message}`,
          durationMs,
        });
        // Error isolation: layer failure does NOT kill the pipeline
        return { ok: false, data: null, error: message, durationMs };
      }
    };

    // ── L0: Discovery ───────────────────────────────────────────────
    results.discovery = await wrap('L0:discovery', () => discoverUrls(config));

    // ── L5: Fingerprint (PROBE - before L1) ─────────────────────────
    // Runs on a small probe sample (robots + homepage + 10 random + sitemap)
    // BEFORE the full crawl. Every later layer reads this fingerprint.
    results.fingerprint = await wrap('L5:fingerprint', () =>
      detectFingerprint(config, results.discovery!.data),
    );

    // Build the fingerprint object from L5 result (or a minimal fallback)
    const fingerprint = buildFingerprint(results.fingerprint!.data);

    // ── L1: Fetch (full crawl) ──────────────────────────────────────
    const urls = results.discovery?.data?.urls ?? [];
    if (urls.length === 0) {
      // No URLs to crawl - skip L1-L4, go straight to scoring with empty data
      this.emit({
        layer: 'L1:fetch',
        phase: 'skipped',
        message: 'No URLs discovered, skipping fetch',
      });
      this.emit({
        layer: 'L2:extract',
        phase: 'skipped',
        message: 'No pages to extract, skipping',
      });
      this.emit({
        layer: 'L3:enrich',
        phase: 'skipped',
        message: 'No pages to enrich, skipping',
      });
      this.emit({
        layer: 'L4:site-enrich',
        phase: 'skipped',
        message: 'No pages for site enrichment, skipping',
      });

      results.fetch = { ok: true, data: [], durationMs: 0 };
      results.extraction = { ok: true, data: [], durationMs: 0 };
      results.enrichment = { ok: true, data: [], durationMs: 0 };
      results.siteEnrichment = { ok: true, data: createEmptySiteEnrichment(), durationMs: 0 };
    } else {
      results.fetch = await wrap('L1:fetch', () =>
        fetchPageBatch(urls, config, fingerprint),
      );

      // ── L2: Extract ─────────────────────────────────────────────
      const fetchedPages = results.fetch?.data ?? [];
      results.extraction = await wrap('L2:extract', () =>
        extractPageBatch(fetchedPages, fingerprint),
      );

      // ── L3: Per-page Enrichment ─────────────────────────────────
      const extractedPages = results.extraction?.data ?? [];
      results.enrichment = await wrap('L3:enrich', () =>
        enrichPageBatch(extractedPages, fingerprint, config),
      );

      // ── L4: Site-level Enrichment ───────────────────────────────
      const enrichedPages = results.enrichment?.data ?? [];
      results.siteEnrichment = await wrap('L4:site-enrich', () =>
        enrichSite(enrichedPages, fingerprint, extractedPages),
      );
    }

    // ── Convert enriched pages to the Map-based format L6/L7/L8 expect ──
    const pageMap = buildPageMap(results.enrichment?.data ?? []);
    const siteData = buildSiteData(results.siteEnrichment?.data ?? createEmptySiteEnrichment());

    // ── L6: Score ──────────────────────────────────────────────────
    results.scoring = await wrap('L6:score', () =>
      runL6Score({
        fingerprint,
        mode: config.mode ?? 'fullAudit',
        pages: pageMap,
        siteData,
      }),
    );

    // ── L7: Actions ────────────────────────────────────────────────
    results.actions = await wrap('L7:action', () =>
      runL7Action({
        fingerprint,
        pages: pageMap,
        siteData,
      }),
    );

    // ── L8: Emit ───────────────────────────────────────────────────
    results.emit = await wrap('L8:emit', () =>
      runL8Emit({
        mode: config.mode ?? 'fullAudit',
        fingerprint,
        pages: pageMap,
        siteData,
        scoreResult: results.scoring!.data!,
        actionResult: results.actions!.data!,
      }),
    );

    const completedAt = new Date();
    const pipelineResult: PipelineResult = {
      runId,
      startedAt: startedAt.toISOString(),
      completedAt: completedAt.toISOString(),
      totalDurationMs: Math.round(completedAt.getTime() - startedAt.getTime()),
      discovery: results.discovery!,
      fingerprint: results.fingerprint!,
      fetch: results.fetch!,
      extraction: results.extraction!,
      enrichment: results.enrichment!,
      siteEnrichment: results.siteEnrichment!,
      scoring: results.scoring!,
      actions: results.actions!,
      emit: results.emit!,
      layerStatus: { ...this.layerStatus },
    };

    // ── L9: Persist (post-pipeline) ────────────────────────────────
    // Stream enriched data through StorageRouter for tiered persistence.
    // This runs after the pipeline completes so it doesn't block scoring/emit.
    try {
      const enrichedPages = results.enrichment?.data;
      const extractedPages = results.extraction?.data;
      const fetchedPages = results.fetch?.data;
      if (enrichedPages && Array.isArray(enrichedPages) && enrichedPages.length > 0) {
        this.emit({
          layer: 'L8:emit',
          phase: 'running',
          message: `Persisting ${enrichedPages.length} pages through StorageRouter`,
        });

        // Use a pipeline-specific session ID to avoid colliding with GhostCrawler's
        // active session (which has its own dedup state).
        const sessionId = `pipeline-${runId}`;
        // Build lookups from L1 fetch and L2 extraction results
        const fetchByUrl = new Map(
          (fetchedPages ?? []).map(f => [f.url, f])
        );
        const extractionByUrl = new Map(
          (extractedPages ?? []).map(e => [e.url, e])
        );
        const storablePages = enrichedPages.map(enrichment =>
          enrichmentToStorable(
            enrichment,
            extractionByUrl.get(enrichment.url) ?? null,
            fetchByUrl.get(enrichment.url) ?? null,
            sessionId,
          )
        );

        storageRouter.startSession(sessionId);
        const persistResult = await storageRouter.persistPages(storablePages as any, sessionId);

        this.emit({
          layer: 'L8:emit',
          phase: 'completed',
          message: `Persisted: ${persistResult.hotWrites} hot, ${persistResult.warmQueued} queued for cloud sync, ${persistResult.dedup.duplicates} deduped`,
        });
      }
    } catch (persistErr: any) {
      this.emit({
        layer: 'L8:emit',
        phase: 'failed',
        message: `Persist failed: ${persistErr?.message}`,
      });
      // Don't fail the pipeline — persistence failure is non-fatal
    }

    return pipelineResult;
  }
}

// ── L9 Helper: EnrichmentResult -> storable page object ──────────────

/**
 * Convert a single EnrichmentResult from L3 into a flat object compatible
 * with CrawledPage / IndexedDB / StorageRouter. Avoids duplicating field
 * mappings inline in the orchestrator.
 */
function enrichmentToStorable(
  enrichment: EnrichmentResult,
  extraction: ExtractionResult | null,
  fetch: FetchResult | null,
  crawlId: string,
): Record<string, unknown> {
  return {
    url: enrichment.url,
    crawlId,
    finalUrl: fetch?.finalUrl ?? enrichment.url,
    // Core SEO fields from L2 extraction
    title: extraction?.content?.title ?? '',
    metaDesc: extraction?.content?.metaDescription ?? '',
    h1_1: extraction?.content?.h1?.[0] ?? '',
    canonical: extraction?.robots?.canonical ?? '',
    metaRobots: extraction?.robots?.metaRobots ?? '',
    statusCode: fetch?.statusCode ?? 0,
    contentType: fetch?.contentType ?? '',
    loadTime: fetch?.timingMs ?? 0,
    wordCount: extraction?.content?.wordCount ?? 0,
    crawlDepth: 0,
    indexable: extraction?.robots?.isIndexable ?? true,
    internalOutlinks: extraction?.links?.internalLinks?.length ?? 0,
    externalOutlinks: extraction?.links?.externalLinks?.length ?? 0,
    isHtmlPage: true,
    timestamp: Date.now(),
    // Content hash for dedup (top-level ContentHashData on ExtractionResult)
    hash: extraction?.contentHash?.simhash ?? null,
    // GSC enrichment (L3)
    gscClicks: enrichment.gsc?.clicks ?? null,
    gscImpressions: enrichment.gsc?.impressions ?? null,
    gscCtr: enrichment.gsc?.ctr ?? null,
    gscPosition: enrichment.gsc?.position ?? null,
    // GA4 enrichment (L3)
    ga4Sessions: enrichment.ga4?.sessions ?? null,
    ga4Users: enrichment.ga4?.users ?? null,
    // Backlink data (L3)
    urlRating: enrichment.backlinks?.urlRating ?? null,
    referringDomains: enrichment.backlinks?.referringDomains ?? null,
    backlinks: enrichment.backlinks?.totalBacklinks ?? null,
    // AI analysis (L3)
    contentQualityScore: enrichment.ai?.contentQuality ?? null,
    eeatScore: enrichment.ai?.eeatScore ?? null,
    sentiment: enrichment.ai?.sentiment ?? null,
    // Null fields required by CrawledPage interface
    mainKeywordSource: null,
    bestKeywordSource: null,
    mainKwSearchVolume: null,
    bestKwSearchVolume: null,
    mainKwEstimatedVolume: null,
    bestKwEstimatedVolume: null,
    volumeEstimationMethod: null,
    sessionsDeltaAbsolute: null,
    sessionsDeltaPct: null,
    ga4EngagementTimePerPage: null,
    ga4EngagementRate: null,
    backlinkSource: null,
    backlinkUploadOverride: false,
    gscEnrichedAt: null,
    ga4EnrichedAt: null,
    backlinkEnrichedAt: null,
    searchIntent: null,
    inSitemap: null,
    mainKeyword: null,
    mainKwVolume: null,
    mainKwPosition: null,
    bestKeyword: null,
    bestKwVolume: null,
    bestKwPosition: null,
    ga4Views: null,
    ga4BounceRate: null,
    ga4AvgSessionDuration: null,
    ga4Conversions: null,
    ga4ConversionRate: null,
    ga4GoalCompletions: null,
    ga4GoalConversionRate: null,
    ga4EcommerceRevenue: null,
    ga4EcommerceConversionRate: null,
    ga4Transactions: null,
    ga4AddtoCart: null,
    ga4Checkouts: null,
    ga4Revenue: null,
    sessionsDelta: null,
    isLosingTraffic: null,
    opportunityScore: null,
    businessValueScore: null,
    authorityScore: null,
    recommendedAction: null,
    recommendedActionReason: null,
    recommendedActionFactors: null,
    techHealthScore: null,
    searchVisibilityScore: null,
    engagementScore: null,
    authorityComputedScore: null,
    businessComputedScore: null,
    cmsType: null,
    bingClicks: null,
    bingImpressions: null,
    bingPosition: null,
    bingCtr: null,
    bingCrawlErrors: null,
    bingEnrichedAt: null,
    wpPostType: null,
    wpCategories: null,
    wpTags: null,
    wpAuthor: null,
    wpPublishDate: null,
    wpModifiedDate: null,
    shopifyProductType: null,
    shopifyVendor: null,
    shopifyTags: null,
    gbpName: null,
    gbpAddress: null,
    gbpPhone: null,
    gbpCategories: null,
    gbpHours: null,
    gbpReviewCount: null,
    gbpAvgRating: null,
    gbpEnrichedAt: null,
    botResponseTime: null,
  };
}

// ── Bridge Helpers (L3/L4 arrays -> Map format for L6/L7/L8) ────────

/**
 * Convert the L3 enriched page array into the Map<string, Record<string, unknown>>
 * format that L6, L7, and L8 expect.
 */
function buildPageMap(
  enrichedPages: EnrichmentResult[],
): Map<string, Record<string, unknown>> {
  const map = new Map<string, Record<string, unknown>>();
  for (const page of enrichedPages) {
    const flat: Record<string, unknown> = { url: page.url };

    // Flatten GSC data
    if (page.gsc) {
      flat['p.search.clicks'] = page.gsc.clicks;
      flat['p.search.impressions'] = page.gsc.impressions;
      flat['p.search.ctr'] = page.gsc.ctr;
      flat['p.search.position'] = page.gsc.position;
      flat['p.search.positionTrend'] = page.gsc.positionTrend;
    }

    // Flatten GA4 data
    if (page.ga4) {
      flat['p.ga.sessions'] = page.ga4.sessions;
      flat['p.ga.users'] = page.ga4.users;
      flat['p.ga.engagementRate'] = page.ga4.engagementRate;
      flat['p.ga.conversions'] = page.ga4.conversions;
      flat['p.ga.revenue'] = page.ga4.revenue;
      flat['p.ga.bounceRate'] = page.ga4.bounceRate;
    }

    // Flatten CrUX data
    if (page.crux) {
      flat['p.tech.lcp'] = page.crux.lcp.p75;
      flat['p.tech.cls'] = page.crux.cls.p75;
      flat['p.tech.inp'] = page.crux.inp.p75;
      flat['p.tech.ttfb'] = page.crux.ttfb.p75;
      flat['p.tech.fcp'] = page.crux.fcp.p75;
      flat['p.tech.cwvGood'] = page.crux.overallGood;
    }

    // Flatten backlink data
    if (page.backlinks) {
      flat['p.links.refDomains'] = page.backlinks.referringDomains;
      flat['p.links.urlRating'] = page.backlinks.urlRating;
      flat['p.links.totalBacklinks'] = page.backlinks.totalBacklinks;
      flat['p.links.toxicScore'] = page.backlinks.toxicScore;
    }

    // Flatten AI data
    if (page.ai) {
      flat['p.content.contentQuality'] = page.ai.contentQuality;
      flat['p.identity.eeat'] = page.ai.eeatScore;
      flat['p.content.languageComplexity'] = page.ai.languageComplexity;
      flat['p.ai.topicAuthority'] = page.ai.topicAuthority;
    }

    map.set(page.url, flat);
  }
  return map;
}

/**
 * Convert the L4 site enrichment result into a flat Record for L6/L7/L8.
 */
function buildSiteData(
  siteEnrichment: SiteEnrichmentResult,
): Record<string, unknown> {
  return {
    totalPages: siteEnrichment.siteAggregations.totalPages,
    indexablePages: siteEnrichment.siteAggregations.indexablePages,
    avgWordCount: siteEnrichment.siteAggregations.avgWordCount,
    avgResponseMs: siteEnrichment.siteAggregations.avgResponseMs,
    avgInternalLinks: siteEnrichment.siteAggregations.avgInternalLinks,
    avgExternalLinks: siteEnrichment.siteAggregations.avgExternalLinks,
    schemaTypesPresent: siteEnrichment.siteAggregations.schemaTypesPresent,
    orphanPages: siteEnrichment.siteAggregations.orphanPages,
    duplicateGroups: siteEnrichment.duplicateGroups.length,
    cannibalizationPairs: siteEnrichment.cannibalization.length,
    topicClusters: siteEnrichment.topicClusters.length,
    linkGraphNodes: siteEnrichment.linkGraph.nodes.length,
    linkGraphEdges: siteEnrichment.linkGraph.edges.length,
  };
}

// ── Helpers ─────────────────────────────────────────────────────────

/**
 * Build a fingerprint object from L5 result or create a minimal fallback.
 * This object is passed to every subsequent layer to gate metrics,
 * pick scrapers, pick schemas, and pick actions.
 */
function buildFingerprint(
  fpResult: FingerprintResult | null | undefined,
): FingerprintResult {
  if (fpResult) return fpResult;

  // Minimal fallback when fingerprint detection fails
  return {
    projectId: '',
    industry: { value: 'general', confidence: 0, source: { tier: 'T8', provider: 'pipeline.fallback', observedAt: new Date().toISOString(), tags: ['default'] } },
    cms: { value: 'custom', confidence: 0, source: { tier: 'T8', provider: 'pipeline.fallback', observedAt: new Date().toISOString(), tags: ['default'] } },
    languagePrimary: { value: 'en', confidence: 0, source: { tier: 'T8', provider: 'pipeline.fallback', observedAt: new Date().toISOString(), tags: ['default'] } },
    languageSet: [{ code: 'en', ratio: 1 }],
    stack: {},
    geo: { primary: { value: 'unknown', confidence: 0, source: { tier: 'T8', provider: 'pipeline.fallback', observedAt: new Date().toISOString(), tags: ['default'] } }, locales: { value: [], confidence: 0, source: { tier: 'T8', provider: 'pipeline.fallback', observedAt: new Date().toISOString(), tags: ['default'] } } },
    intent: { value: 'mixed', confidence: 0, source: { tier: 'T8', provider: 'pipeline.fallback', observedAt: new Date().toISOString(), tags: ['default'] } },
    size: { urls: { value: 0, confidence: 0, source: { tier: 'T8', provider: 'pipeline.fallback', observedAt: new Date().toISOString(), tags: ['default'] } } },
    readiness: { score: 0, missing: ['all'] },
    probedAt: new Date().toISOString(),
  };
}

function createEmptySiteEnrichment(): SiteEnrichmentResult {
  return {
    linkGraph: { nodes: [], edges: [], pageRank: {} },
    topicClusters: [],
    entityResolution: [],
    siteAggregations: {
      totalPages: 0,
      indexablePages: 0,
      statusCodes: {},
      avgWordCount: 0,
      avgResponseMs: 0,
      internalLinksTotal: 0,
      externalLinksTotal: 0,
    },
    duplicateGroups: [],
    cannibalization: [],
  };
}

// ── Convenience factory ─────────────────────────────────────────────

let defaultInstance: PipelineOrchestrator | null = null;

/** Get or create the default pipeline orchestrator singleton */
export function getPipelineOrchestrator(): PipelineOrchestrator {
  if (!defaultInstance) {
    defaultInstance = new PipelineOrchestrator();
  }
  return defaultInstance;
}
