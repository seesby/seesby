// apps/server/src/services/CrawlOrchestrator.ts
// ── Server-Side Crawl Pipeline Orchestrator ──────────────────────────
// Mirrors the client-side PipelineOrchestrator but runs on the server.
// Manages concurrent crawl jobs with progress tracking, layer execution,
// and database persistence.

import { randomUUID } from 'node:crypto';
import {
  createCrawlSession,
  updateCrawlSession,
  getCrawlSession,
  upsertCrawlStatus,
  insertCrawlRun,
  insertCrawlPagesBatch,
  insertCrawlIssue,
  insertPageInsight,
} from '../db/turso';

// ── Types ────────────────────────────────────────────────────────────

/** Subset of CrawlerConfig used by the orchestrator (avoids coupling to full config shape). */
export interface CrawlOrchestratorConfig {
  /** Start URLs for the crawl */
  startUrls: string[];
  /** Audit modes to run (e.g., ['fullAudit', 'wqa']) */
  auditModes?: string[];
  /** Industry filter */
  industryFilter?: string;
  /** Max pages to crawl (default: 100) */
  limit?: number;
  /** Max crawl depth (default: 10) */
  maxDepth?: number;
  /** Concurrent requests (default: 5) */
  concurrent?: number;
  /** Request timeout in seconds (default: 30) */
  requestTimeout?: number;
  /** User agent string */
  userAgent?: string;
  /** Respect robots.txt */
  respectRobots?: boolean;
  /** Enable JS rendering */
  jsRendering?: boolean;
  /** Enable AI enrichment */
  aiEnabled?: boolean;
  /** AI batch size */
  aiBatchSize?: number;
}

export type CrawlJobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface CrawlJobProgress {
  /** Total URLs discovered */
  total: number;
  /** URLs completed (fetched + processed) */
  completed: number;
  /** URLs that failed */
  errors: number;
  /** Current URL being processed */
  currentUrl?: string;
  /** Current pipeline layer */
  currentLayer?: string;
  /** Percentage complete (0-100) */
  percentComplete: number;
}

export interface CrawlJob {
  /** Unique job identifier */
  id: string;
  /** Associated crawl session ID */
  sessionId: string;
  /** Primary start URL */
  startUrl: string;
  /** Full crawl configuration */
  config: CrawlOrchestratorConfig;
  /** Current job status */
  status: CrawlJobStatus;
  /** Progress tracking */
  progress: CrawlJobProgress;
  /** ISO timestamp when job was created */
  createdAt: string;
  /** ISO timestamp when job started running */
  startedAt?: string;
  /** ISO timestamp when job completed or failed */
  completedAt?: string;
  /** Error message if status is 'failed' */
  error?: string;
}

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
  elapsed?: number;
  percentComplete?: number;
}

export type PipelineEventListener = (progress: PipelineProgress) => void;

/** Result emitted by L8 at end of pipeline. */
export interface CrawlEmitResult {
  sessionId: string;
  pagesInserted: number;
  issuesInserted: number;
  insightsInserted: number;
  runInserted: boolean;
  durationMs: number;
}

// ── Default Configuration ────────────────────────────────────────────

const DEFAULT_CONFIG: Required<Pick<CrawlOrchestratorConfig,
  'limit' | 'maxDepth' | 'concurrent' | 'requestTimeout' | 'respectRobots' | 'jsRendering' | 'aiEnabled' | 'aiBatchSize'
>> = {
  limit: 100,
  maxDepth: 10,
  concurrent: 5,
  requestTimeout: 30,
  respectRobots: true,
  jsRendering: false,
  aiEnabled: false,
  aiBatchSize: 20,
};

// ── CrawlOrchestrator ────────────────────────────────────────────────

class CrawlOrchestratorImpl {
  /** Active and recently completed crawl jobs (in-memory state). */
  private jobs: Map<string, CrawlJob> = new Map();

  /** Active AbortControllers keyed by job ID for cancellation. */
  private abortControllers: Map<string, AbortController> = new Map();

  /** Event listeners for pipeline progress updates. */
  private listeners: PipelineEventListener[] = [];

  /** Default orchestrator-level config. */
  private defaultConfig: Partial<CrawlOrchestratorConfig>;

  constructor(defaultConfig?: Partial<CrawlOrchestratorConfig>) {
    this.defaultConfig = defaultConfig ?? {};
  }

  // ── Public API ───────────────────────────────────────────────────

  /**
   * Subscribe to pipeline progress events.
   * Returns an unsubscribe function.
   */
  onProgress(listener: PipelineEventListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Start a new crawl. Creates a session in the DB and kicks off
   * the pipeline asynchronously.
   *
   * @returns The session ID (same as job ID for simplicity).
   */
  async startCrawl(
    startUrl: string,
    config: CrawlOrchestratorConfig,
  ): Promise<{ sessionId: string; jobId: string }> {
    const sessionId = randomUUID();
    const jobId = sessionId;

    // Merge defaults
    const mergedConfig: CrawlOrchestratorConfig = {
      ...this.defaultConfig,
      ...config,
      startUrls: config.startUrls?.length ? config.startUrls : [startUrl],
    };

    // Create DB session
    await createCrawlSession({
      id: sessionId,
      url: startUrl,
      status: 'starting',
      metadata: { config: mergedConfig },
      auditModes: mergedConfig.auditModes,
      industryFilter: mergedConfig.industryFilter,
    });

    // Create in-memory job
    const job: CrawlJob = {
      id: jobId,
      sessionId,
      startUrl,
      config: mergedConfig,
      status: 'pending',
      progress: {
        total: 0,
        completed: 0,
        errors: 0,
        percentComplete: 0,
      },
      createdAt: new Date().toISOString(),
    };
    this.jobs.set(jobId, job);

    // Create abort controller for cancellation
    const ac = new AbortController();
    this.abortControllers.set(jobId, ac);

    // Update DB status
    await upsertCrawlStatus({
      projectId: sessionId,
      status: 'pending',
      sessionId,
    });

    // Run pipeline asynchronously (fire-and-forget)
    this.runPipeline(job, ac.signal).catch((err) => {
      job.status = 'failed';
      job.error = (err as Error).message;
      job.completedAt = new Date().toISOString();
      this.updateJob(job).catch(() => {});
    });

    return { sessionId, jobId };
  }

  /**
   * Stop a running crawl by job ID.
   * Sends an abort signal and updates status.
   */
  async stopCrawl(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    if (job.status !== 'running' && job.status !== 'pending') {
      throw new Error(`Job ${jobId} is not running (status: ${job.status})`);
    }

    // Signal abort
    const ac = this.abortControllers.get(jobId);
    if (ac) {
      ac.abort();
    }

    job.status = 'cancelled';
    job.completedAt = new Date().toISOString();
    await this.updateJob(job);

    await updateCrawlSession(job.sessionId, { status: 'cancelled' });
    await upsertCrawlStatus({
      projectId: job.sessionId,
      status: 'cancelled',
      sessionId: job.sessionId,
    });
  }

  /**
   * Get current job status and progress.
   */
  getStatus(jobId: string): CrawlJob | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * List all jobs (optionally filtered by status).
   */
  listJobs(status?: CrawlJobStatus): CrawlJob[] {
    const all = Array.from(this.jobs.values());
    if (status) {
      return all.filter((j) => j.status === status);
    }
    return all;
  }

  // ── Pipeline Execution ─────────────────────────────────────────

  /**
   * Run the full L0-L8 pipeline for a job.
   * Each layer is executed in sequence; progress is tracked and persisted.
   *
   * Pipeline order: L0 -> L5 -> L1 -> L2 -> L3 -> L4 -> L6 -> L7 -> L8
   */
  private async runPipeline(job: CrawlJob, signal: AbortSignal): Promise<void> {
    const startTime = Date.now();
    job.status = 'running';
    job.startedAt = new Date().toISOString();
    await this.updateJob(job);

    await updateCrawlSession(job.sessionId, { status: 'running' });
    await upsertCrawlStatus({
      projectId: job.sessionId,
      status: 'running',
      progress: 0,
      currentUrl: job.startUrl,
      urlsCrawled: 0,
      sessionId: job.sessionId,
      eventType: 'pipeline_start',
      eventMessage: `Pipeline started for ${job.startUrl}`,
    });

    /** Mutable pipeline context passed between layers. */
    const ctx: Record<string, unknown> = {
      jobId: job.id,
      sessionId: job.sessionId,
      startUrl: job.startUrl,
      config: job.config,
      startUrls: job.config.startUrls ?? [job.startUrl],
    };

    try {
      // L0: Discovery - Find all candidate URLs
      const discovery = await this.executeLayer('L0:discovery', ctx, job, signal);
      ctx.urls = discovery?.urls ?? [];
      job.progress.total = (discovery?.urls as string[] | undefined)?.length ?? 0;

      // L5: Fingerprint - Probe the site before fetch
      const fingerprint = await this.executeLayer('L5:fingerprint', ctx, job, signal);
      ctx.fingerprint = fingerprint;

      // L1: Fetch - HTTP fetch all discovered URLs
      const fetchResult = await this.executeLayer('L1:fetch', ctx, job, signal);
      ctx.fetchedPages = fetchResult?.pages ?? [];
      job.progress.completed = (ctx.fetchedPages as unknown[] | undefined)?.length ?? 0;

      // L2: Extract - Parse HTML and extract structured data
      const extraction = await this.executeLayer('L2:extract', ctx, job, signal);
      ctx.extractedPages = extraction?.pages ?? [];

      // L3: Enrich - Add calculated metrics
      const enrichment = await this.executeLayer('L3:enrich', ctx, job, signal);
      ctx.enrichedPages = enrichment?.pages ?? [];

      // L4: Site Enrich - Site-level metrics
      const siteEnrich = await this.executeLayer('L4:site-enrich', ctx, job, signal);
      ctx.siteEnrichment = siteEnrich;

      // L6: Score - Compute quality scores
      const scoring = await this.executeLayer('L6:score', ctx, job, signal);
      ctx.scoring = scoring;

      // L7: Action - Generate recommended actions
      const actions = await this.executeLayer('L7:action', ctx, job, signal);
      ctx.actions = actions;

      // L8: Emit - Persist to database
      const emitResult = await this.executeLayer('L8:emit', ctx, job, signal);
      ctx.emit = emitResult;

      // Mark complete
      job.status = 'completed';
      job.progress.percentComplete = 100;
      job.completedAt = new Date().toISOString();
      await this.updateJob(job);

      await updateCrawlSession(job.sessionId, { status: 'completed' });
      await upsertCrawlStatus({
        projectId: job.sessionId,
        status: 'completed',
        progress: 100,
        urlsCrawled: job.progress.completed,
        sessionId: job.sessionId,
        eventType: 'pipeline_complete',
        eventMessage: `Pipeline completed in ${Date.now() - startTime}ms`,
      });
    } catch (err) {
      if (signal.aborted) {
        job.status = 'cancelled';
        job.completedAt = new Date().toISOString();
        await updateCrawlSession(job.sessionId, { status: 'cancelled' });
      } else {
        job.status = 'failed';
        job.error = (err as Error).message;
        job.completedAt = new Date().toISOString();
        await updateCrawlSession(job.sessionId, { status: 'failed' });
        await upsertCrawlStatus({
          projectId: job.sessionId,
          status: 'failed',
          progress: job.progress.percentComplete,
          sessionId: job.sessionId,
          eventType: 'pipeline_error',
          eventMessage: (err as Error).message,
        });
      }
      await this.updateJob(job);
    } finally {
      this.abortControllers.delete(job.id);
    }
  }

  /**
   * Execute a single pipeline layer with progress tracking.
   * In a production deployment, this would call into the actual layer
   * implementations from services/crawler/pipeline/. For now, it
   * provides the execution scaffold with hooks.
   */
  private async executeLayer(
    layer: PipelineLayer,
    ctx: Record<string, unknown>,
    job: CrawlJob,
    signal: AbortSignal,
  ): Promise<unknown> {
    // Check for abort before each layer
    if (signal.aborted) {
      throw new Error('Pipeline aborted');
    }

    const layerStart = Date.now();
    job.progress.currentLayer = layer;

    this.emitProgress({
      layer,
      phase: 'running',
      message: `Starting ${layer}`,
      current: 0,
      total: job.progress.total,
    });

    await upsertCrawlStatus({
      projectId: job.sessionId,
      status: 'running',
      progress: job.progress.percentComplete,
      currentUrl: job.progress.currentUrl,
      urlsCrawled: job.progress.completed,
      sessionId: job.sessionId,
      eventType: `layer_start`,
      eventMessage: layer,
    });

    let result: unknown = null;

    try {
      switch (layer) {
        case 'L0:discovery':
          result = await this.runDiscovery(ctx, signal);
          break;
        case 'L5:fingerprint':
          result = await this.runFingerprint(ctx, signal);
          break;
        case 'L1:fetch':
          result = await this.runFetch(ctx, signal);
          break;
        case 'L2:extract':
          result = await this.runExtract(ctx, signal);
          break;
        case 'L3:enrich':
          result = await this.runEnrich(ctx, signal);
          break;
        case 'L4:site-enrich':
          result = await this.runSiteEnrich(ctx, signal);
          break;
        case 'L6:score':
          result = await this.runScore(ctx, signal);
          break;
        case 'L7:action':
          result = await this.runAction(ctx, signal);
          break;
        case 'L8:emit':
          result = await this.runEmit(ctx, signal);
          break;
      }

      this.emitProgress({
        layer,
        phase: 'completed',
        message: `Completed ${layer}`,
        current: job.progress.total,
        total: job.progress.total,
        elapsed: Date.now() - layerStart,
        percentComplete: 100,
      });

      return result;
    } catch (err) {
      this.emitProgress({
        layer,
        phase: 'failed',
        message: `Failed ${layer}: ${(err as Error).message}`,
        elapsed: Date.now() - layerStart,
      });
      throw err;
    }
  }

  // ── Layer Implementations (scaffold) ───────────────────────────

  /**
   * L0: Discovery - Find all candidate URLs for the site.
   * Checks sitemaps, robots.txt, and seed URLs.
   */
  private async runDiscovery(
    ctx: Record<string, unknown>,
    signal: AbortSignal,
  ): Promise<{ urls: string[] }> {
    const config = ctx.config as CrawlOrchestratorConfig;
    const urls = new Set<string>();

    // Add seed URLs
    for (const url of config.startUrls) {
      urls.add(url);
    }

    // In production, this would:
    // 1. Fetch and parse sitemap.xml
    // 2. Check robots.txt for sitemap references
    // 3. Optionally query GSC/GA4 for additional URLs
    // 4. Run CommonCrawl/backlinks lookup

    return { urls: Array.from(urls) };
  }

  /**
   * L5: Fingerprint - Probe the site to detect CMS, industry, language.
   * Runs before L1 so the fingerprint can guide fetch decisions.
   */
  private async runFingerprint(
    ctx: Record<string, unknown>,
    signal: AbortSignal,
  ): Promise<unknown> {
    // In production, this would call into FingerprintProbe
    // to detect: industry, CMS, language, stack, geo, intent
    return null;
  }

  /**
   * L1: Fetch - HTTP fetch all discovered URLs.
   * Uses the fingerprint to decide render method (static vs browser).
   */
  private async runFetch(
    ctx: Record<string, unknown>,
    signal: AbortSignal,
  ): Promise<{ pages: unknown[] }> {
    // In production, this would call fetchPageBatch()
    return { pages: [] };
  }

  /**
   * L2: Extract - Parse HTML and extract structured data.
   * Title, meta tags, headings, schema markup, links, etc.
   */
  private async runExtract(
    ctx: Record<string, unknown>,
    signal: AbortSignal,
  ): Promise<{ pages: unknown[] }> {
    // In production, this would call extractPageBatch()
    return { pages: [] };
  }

  /**
   * L3: Enrich - Add calculated metrics to each page.
   * Word count, readability, internal links, depth, etc.
   */
  private async runEnrich(
    ctx: Record<string, unknown>,
    signal: AbortSignal,
  ): Promise<{ pages: unknown[] }> {
    // In production, this would call enrichPageBatch()
    return { pages: [] };
  }

  /**
   * L4: Site Enrich - Compute site-level metrics.
   * Average scores, issue counts, thematic breakdowns.
   */
  private async runSiteEnrich(
    ctx: Record<string, unknown>,
    signal: AbortSignal,
  ): Promise<unknown> {
    // In production, this would call enrichSite()
    return null;
  }

  /**
   * L6: Score - Compute quality scores for each page.
   * Uses the metric registry and scoring pipeline.
   */
  private async runScore(
    ctx: Record<string, unknown>,
    signal: AbortSignal,
  ): Promise<unknown> {
    // In production, this would call runL6Score()
    return null;
  }

  /**
   * L7: Action - Generate recommended actions for pages.
   * Uses the action engine with triggers from L6.
   */
  private async runAction(
    ctx: Record<string, unknown>,
    signal: AbortSignal,
  ): Promise<unknown> {
    // In production, this would call runL7Action()
    return null;
  }

  /**
   * L8: Emit - Persist all results to the database.
   * Writes pages, issues, insights, and run summary.
   */
  private async runEmit(
    ctx: Record<string, unknown>,
    signal: AbortSignal,
  ): Promise<CrawlEmitResult> {
    const startTime = Date.now();
    const sessionId = ctx.sessionId as string;
    const enrichedPages = (ctx.enrichedPages as unknown[]) ?? [];
    const actions = ctx.actions as Record<string, unknown> | undefined;
    const scoring = ctx.scoring as Record<string, unknown> | undefined;

    let pagesInserted = 0;
    let issuesInserted = 0;
    let insightsInserted = 0;

    // Persist pages
    if (enrichedPages.length > 0) {
      const pageRows = enrichedPages.map((page: unknown, idx: number) => {
        const p = page as Record<string, unknown>;
        return {
          id: randomUUID(),
          sessionId,
          url: (p.url as string) ?? '',
          title: (p.title as string) ?? undefined,
          statusCode: (p.statusCode as number) ?? undefined,
          loadTime: (p.loadTime as number) ?? undefined,
          healthScore: (p.qualityScore as number) ?? (p.healthScore as number) ?? undefined,
          metadata: p as Record<string, unknown>,
        };
      });

      await insertCrawlPagesBatch(pageRows);
      pagesInserted = pageRows.length;
    }

    // Persist issues from L7
    const issueList = (actions as Record<string, unknown> | undefined)?.issues as Array<Record<string, unknown>> | undefined;
    if (issueList?.length) {
      for (const issue of issueList) {
        if (signal.aborted) break;
        await insertCrawlIssue({
          id: randomUUID(),
          runId: ctx.runId as string ?? sessionId,
          projectId: sessionId,
          category: (issue.category as string) ?? 'general',
          title: (issue.title as string) ?? 'Untitled Issue',
          description: (issue.description as string) ?? '',
          priority: (issue.priority as string) ?? 'medium',
          issueType: (issue.type as string) ?? 'quality',
          affectedCount: (issue.affectedCount as number) ?? 0,
          affectedUrls: (issue.affectedUrls as string[]) ?? [],
          effort: (issue.effort as string) ?? 'medium',
          scoreImpact: (issue.scoreImpact as number) ?? 0,
          aiFix: (issue.aiFix as string) ?? '',
          evidence: (issue.evidence as Record<string, unknown>) ?? {},
        });
        issuesInserted++;
      }
    }

    // Persist page insights
    const pageInsights = (ctx as Record<string, unknown>).pageInsights as Array<Record<string, unknown>> | undefined;
    if (pageInsights?.length) {
      for (const insight of pageInsights) {
        if (signal.aborted) break;
        await insertPageInsight({
          id: randomUUID(),
          runId: ctx.runId as string ?? sessionId,
          projectId: sessionId,
          sessionId,
          url: (insight.url as string) ?? '',
          isChanged: (insight.isChanged as boolean) ?? false,
          isTopPage: (insight.isTopPage as boolean) ?? false,
          hasSevereIssues: (insight.hasSevereIssues as boolean) ?? false,
          severityRank: (insight.severityRank as number) ?? 0,
          priorityScore: (insight.priorityScore as number) ?? 0,
          evidenceSources: (insight.evidenceSources as Record<string, unknown>) ?? {},
          summary: (insight.summary as Record<string, unknown>) ?? {},
          fullData: (insight.fullData as Record<string, unknown>) ?? undefined,
        });
        insightsInserted++;
      }
    }

    // Persist run summary
    const runId = randomUUID();
    await insertCrawlRun({
      id: runId,
      projectId: sessionId,
      sessionId,
      jobId: ctx.jobId as string,
      status: 'completed',
      crawlMode: 'full',
      executionMode: 'server',
      policy: 'standard',
      retentionPolicy: 'default',
      urlCrawled: (ctx.startUrl as string) ?? '',
      summary: (scoring?.summary as Record<string, unknown>) ?? {},
      thematicScores: (scoring?.thematicScores as Record<string, unknown>) ?? {},
      evidenceSources: {},
      runtime: { durationMs: Date.now() - startTime },
      topPages: {},
      issueOverview: { total: issuesInserted },
      completedAt: new Date().toISOString(),
    });

    return {
      sessionId,
      pagesInserted,
      issuesInserted,
      insightsInserted,
      runInserted: true,
      durationMs: Date.now() - startTime,
    };
  }

  // ── Helpers ────────────────────────────────────────────────────

  /** Broadcast progress to all listeners. */
  private emitProgress(progress: PipelineProgress): void {
    for (const listener of this.listeners) {
      try {
        listener(progress);
      } catch {
        // Listener errors should not crash the pipeline
      }
    }
  }

  /** Persist job state to the in-memory map. */
  private async updateJob(job: CrawlJob): Promise<void> {
    this.jobs.set(job.id, job);
  }
}

// ── Singleton ────────────────────────────────────────────────────────

let _instance: CrawlOrchestratorImpl | null = null;

/**
 * Get or create the singleton CrawlOrchestrator instance.
 * @param config - Optional default configuration (only used on first call).
 */
export function getCrawlOrchestrator(
  config?: Partial<CrawlOrchestratorConfig>,
): CrawlOrchestratorImpl {
  if (!_instance) {
    _instance = new CrawlOrchestratorImpl(config);
  }
  return _instance;
}

export { CrawlOrchestratorImpl };
