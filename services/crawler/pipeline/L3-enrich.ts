// services/crawler/pipeline/L3-enrich.ts
// ── L3 Enrich: Per-page enrichment from external data sources ───────
//
// GSC, GA4, CrUX, backlinks, AI enrichment — all gated by fingerprint

import type { CrawlConfig } from '@seesby/types';
import type { FingerprintResult } from '@seesby/fingerprint';
import type { ExtractionResult } from './L2-extract';
import type { SourceTier } from '@seesby/types';

// ── Types ───────────────────────────────────────────────────────────

export interface EnrichmentResult {
  url: string;

  // GSC enrichment
  gsc: GscData | null;

  // GA4 enrichment
  ga4: Ga4Data | null;

  // CrUX (Chrome UX Report) enrichment
  crux: CruxData | null;

  // Backlink enrichment
  backlinks: BacklinkData | null;

  // AI enrichment
  ai: AiData | null;

  // Enrichment metadata
  enrichmentTier: SourceTier;
  enrichedAt: string;
  enrichmentTimeMs: number;
}

export interface GscData {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  topQueries: { keyword: string; clicks: number; impressions: number; position: number }[];
  clicksDelta30d: number; // Change vs previous 30 days
  impressionsDelta30d: number;
  avgCTRDelta30d: number;
  positionTrend: 'improving' | 'declining' | 'stable';
  sampleDate: string;
}

export interface Ga4Data {
  sessions: number;
  users: number;
  newUsers: number;
  engagementRate: number; // 0-1
  avgSessionDuration: number; // seconds
  conversions: number;
  revenue: number;
  bounceRate: number;
  events: { name: string; count: number }[];
  acquisitionSource: string;
  acquisitionMedium: string;
  sampleDate: string;
}

export interface CruxData {
  // Core Web Vitals
  lcp: { p75: number; p50: number; good: number; poor: number };
  fid: { p75: number; p50: number; good: number; poor: number };
  cls: { p75: number; p50: number; good: number; poor: number };
  inp: { p75: number; p50: number; good: number; poor: number };
  // Supplementary metrics
  ttfb: { p75: number; p50: number };
  fcp: { p75: number; p50: number };
  // Overall score
  overallGood: number; // % of sessions with good CWV
  // Data availability
  validFieldData: boolean;
  formFactor: 'phone' | 'desktop' | 'tablet';
  sampleDate: string;
}

export interface BacklinkData {
  referringDomains: number;
  totalBacklinks: number;
  domainRating: number; // 0-100
  urlRating: number; // 0-100
  topAnchors: { text: string; count: number; domainRating: number }[];
  referringDomainsTrend: 'growing' | 'declining' | 'stable';
  toxicScore: number; // 0-1, higher = more toxic
  sampleDate: string;
}

export interface AiData {
  contentQuality: number; // 0-100, AI-estimated
  eeatScore: number; // 0-100, Experience/Expertise/Authority/Trust
  topicAuthority: number; // 0-100
  entities: { name: string; type: string; salience: number }[];
  sentiment: 'positive' | 'negative' | 'neutral';
  languageComplexity: number; // 0-100, higher = more complex
  contentGaps: string[];
  sampleDate: string;
}

// ── Main Entry ──────────────────────────────────────────────────────

export async function enrichPage(
  extraction: ExtractionResult,
  fingerprint: FingerprintResult,
  config: CrawlConfig,
  onProgress?: (current: number) => void,
): Promise<EnrichmentResult> {
  const t0 = performance.now();

  // All enrichments run in parallel — each is gated by fingerprint
  const [gsc, ga4, crux, backlinks, ai] = await Promise.all([
    enrichGsc(extraction, fingerprint, config),
    enrichGa4(extraction, fingerprint, config),
    enrichCrux(extraction, fingerprint, config),
    enrichBacklinks(extraction, fingerprint, config),
    enrichAi(extraction, fingerprint, config),
  ]);

  // Determine overall enrichment tier (highest available)
  const enrichmentTier = determineEnrichmentTier(gsc, ga4, crux, backlinks, ai);

  onProgress?.(1);

  return {
    url: extraction.url,
    gsc,
    ga4,
    crux,
    backlinks,
    ai,
    enrichmentTier,
    enrichedAt: new Date().toISOString(),
    enrichmentTimeMs: Math.round(performance.now() - t0),
  };
}

/**
 * Batch enrichment for multiple extracted pages.
 */
export async function enrichPageBatch(
  extractions: ExtractionResult[],
  fingerprint: FingerprintResult,
  config: CrawlConfig,
  onProgress?: (enriched: number, total: number) => void,
): Promise<EnrichmentResult[]> {
  const results: EnrichmentResult[] = [];

  // Process in batches to avoid overwhelming external APIs
  const batchSize = 20;
  for (let i = 0; i < extractions.length; i += batchSize) {
    const batch = extractions.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((ext) => enrichPage(ext, fingerprint, config)),
    );
    results.push(...batchResults);
    onProgress?.(Math.min(i + batchSize, extractions.length), extractions.length);
  }

  return results;
}

// ── Per-Source Enrichment ───────────────────────────────────────────

/**
 * GSC enrichment — gated by:
 * - config.connections.gsc must be true
 * - fingerprint.size.urls >= 10 (meaningful site)
 */
async function enrichGsc(
  extraction: ExtractionResult,
  fingerprint: FingerprintResult,
  config: CrawlConfig,
): Promise<GscData | null> {
  if (!config.connections?.gsc) return null;

  // Gate: skip for very small sites
  const urlCount = fingerprint.size?.urls?.value ?? 0;
  if (urlCount < 10) return null;

  try {
    const response = await fetch('/api/connectors/gsc/page', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: extraction.url,
        startDate: getDateDaysAgo(28),
        endDate: getDateDaysAgo(3),
        prevStartDate: getDateDaysAgo(56),
        prevEndDate: getDateDaysAgo(31),
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();

    return {
      clicks: data.clicks ?? 0,
      impressions: data.impressions ?? 0,
      ctr: data.ctr ?? 0,
      position: data.position ?? 0,
      topQueries: data.topQueries ?? [],
      clicksDelta30d: (data.clicks ?? 0) - (data.prevClicks ?? 0),
      impressionsDelta30d: (data.impressions ?? 0) - (data.prevImpressions ?? 0),
      avgCTRDelta30d: (data.ctr ?? 0) - (data.prevCtr ?? 0),
      positionTrend: computeTrend(data.position, data.prevPosition),
      sampleDate: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

/**
 * GA4 enrichment — gated by config.connections.ga4
 */
async function enrichGa4(
  extraction: ExtractionResult,
  fingerprint: FingerprintResult,
  config: CrawlConfig,
): Promise<Ga4Data | null> {
  if (!config.connections?.ga4) return null;

  try {
    const response = await fetch('/api/connectors/ga4/page', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pagePath: new URL(extraction.url).pathname,
        startDate: getDateDaysAgo(28),
        endDate: getDateDaysAgo(3),
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();

    return {
      sessions: data.sessions ?? 0,
      users: data.users ?? 0,
      newUsers: data.newUsers ?? 0,
      engagementRate: data.engagementRate ?? 0,
      avgSessionDuration: data.avgSessionDuration ?? 0,
      conversions: data.conversions ?? 0,
      revenue: data.revenue ?? 0,
      bounceRate: data.bounceRate ?? 0,
      events: data.events ?? [],
      acquisitionSource: data.acquisitionSource ?? 'unknown',
      acquisitionMedium: data.acquisitionMedium ?? 'unknown',
      sampleDate: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

/**
 * CrUX enrichment — gated by:
 * - fingerprint.size.urls >= 10 (CrUX requires field data)
 * - URL must have sufficient Chrome usage
 */
async function enrichCrux(
  extraction: ExtractionResult,
  fingerprint: FingerprintResult,
  config: CrawlConfig,
): Promise<CruxData | null> {
  const urlCount = fingerprint.size?.urls?.value ?? 0;
  if (urlCount < 10) return null;

  try {
    const response = await fetch('/api/crux', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: extraction.url }),
    });

    if (!response.ok) return null;
    const data = await response.json();

    return {
      lcp: data.lcp ?? { p75: 0, p50: 0, good: 0, poor: 0 },
      fid: data.fid ?? { p75: 0, p50: 0, good: 0, poor: 0 },
      cls: data.cls ?? { p75: 0, p50: 0, good: 0, poor: 0 },
      inp: data.inp ?? { p75: 0, p50: 0, good: 0, poor: 0 },
      ttfb: data.ttfb ?? { p75: 0, p50: 0 },
      fcp: data.fcp ?? { p75: 0, p50: 0 },
      overallGood: data.overallGood ?? 0,
      validFieldData: data.validFieldData ?? false,
      formFactor: data.formFactor ?? 'phone',
      sampleDate: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

/**
 * Backlink enrichment — gated by:
 * - config.connections.backlinks must be true
 */
async function enrichBacklinks(
  extraction: ExtractionResult,
  fingerprint: FingerprintResult,
  config: CrawlConfig,
): Promise<BacklinkData | null> {
  if (!config.connections?.backlinks) return null;

  try {
    const response = await fetch('/api/connectors/backlinks/page', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: extraction.url }),
    });

    if (!response.ok) return null;
    const data = await response.json();

    return {
      referringDomains: data.referringDomains ?? 0,
      totalBacklinks: data.totalBacklinks ?? 0,
      domainRating: data.domainRating ?? 0,
      urlRating: data.urlRating ?? 0,
      topAnchors: data.topAnchors ?? [],
      referringDomainsTrend: data.referringDomainsTrend ?? 'stable',
      toxicScore: data.toxicScore ?? 0,
      sampleDate: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

/**
 * AI enrichment — gated by:
 * - config.aiEnabled must be true
 * - fingerprint.size.urls >= 5 (meaningful content to analyze)
 */
async function enrichAi(
  extraction: ExtractionResult,
  fingerprint: FingerprintResult,
  config: CrawlConfig,
): Promise<AiData | null> {
  if (!config.aiEnabled) return null;

  const urlCount = fingerprint.size?.urls?.value ?? 0;
  if (urlCount < 5) return null;

  try {
    const response = await fetch('/api/crawler/ai/enrich', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: extraction.url,
        title: extraction.content.title,
        metaDescription: extraction.content.metaDescription,
        wordCount: extraction.content.wordCount,
        schemaTypes: extraction.schema.schemaTypes,
        language: fingerprint.languagePrimary?.value ?? 'en',
        industry: fingerprint.industry?.value ?? 'general',
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();

    return {
      contentQuality: data.contentQuality ?? 50,
      eeatScore: data.eeatScore ?? 50,
      topicAuthority: data.topicAuthority ?? 50,
      entities: data.entities ?? [],
      sentiment: data.sentiment ?? 'neutral',
      languageComplexity: data.languageComplexity ?? 50,
      contentGaps: data.contentGaps ?? [],
      sampleDate: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

// ── Helpers ─────────────────────────────────────────────────────────

function determineEnrichmentTier(
  gsc: GscData | null,
  ga4: Ga4Data | null,
  crux: CruxData | null,
  backlinks: BacklinkData | null,
  ai: AiData | null,
): SourceTier {
  // T0 = Source (GSC/GA4 direct APIs)
  // T2 = Verified (CrUX = Chrome field data)
  // T5 = Crawled (backlinks API)
  // T6 = AI (AI enrichment)
  // T8 = Default (no enrichment)
  if (gsc || ga4) return 'T0';
  if (crux) return 'T2';
  if (backlinks) return 'T5';
  if (ai) return 'T6';
  return 'T8';
}

function computeTrend(current: number, previous: number): 'improving' | 'declining' | 'stable' {
  if (!current || !previous) return 'stable';
  const diff = current - previous;
  if (Math.abs(diff) < 0.5) return 'stable';
  // For position, lower is better
  return diff < 0 ? 'improving' : 'declining';
}

function getDateDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}
