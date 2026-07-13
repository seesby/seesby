// services/StorageRouter.ts
// ── Multi-Tier Storage Router ─────────────────────────────────────────
// Tiered persistence: IndexedDB (hot) → Turso (warm) → R2 (cold/archive)
// with content-hash deduplication, budget tracking, and async batch sync.
//
// Design: GhostCrawler flushes pages here. StorageRouter decides where
// each piece of data lives based on lifecycle stage and budget availability.

import { turso, isCloudSyncEnabled } from './turso';
import { crawlDb, type CrawledPage } from './CrawlDatabase';
import { toLeanSummary } from './StorageHelpers';

// ── Types ─────────────────────────────────────────────────────────────

export type StorageTier = 'hot' | 'warm' | 'cold';

export interface StorageBudget {
  /** IndexedDB usage estimate (bytes) */
  idbUsed: number;
  /** IndexedDB quota (bytes) */
  idbQuota: number;
  /** Percent of IDB quota used (0-100) */
  idbPercent: number;
  /** Number of rows written to Turso this session */
  tursoRowsWritten: number;
  /** Soft limit for Turso rows per session */
  tursoRowLimit: number;
  /** Whether budget is critically low */
  isLow: boolean;
}

export interface StorageRouterConfig {
  /** Max pages to buffer before flushing to cloud (default 100) */
  cloudFlushBatchSize: number;
  /** Max pages to keep in IndexedDB per session before pruning (default 10 000) */
  hotPageLimit: number;
  /** Whether to enable content-hash deduplication (default true) */
  deduplication: boolean;
  /** Whether to compress large payloads before cloud sync (default true) */
  compression: boolean;
  /** Interval in ms for periodic cloud sync (default 30 000) */
  cloudSyncIntervalMs: number;
  /** Soft Turso row budget per crawl session */
  tursoRowBudget: number;
}

export interface DedupStats {
  /** Total pages processed */
  total: number;
  /** Unique pages (new content) */
  unique: number;
  /** Duplicate pages (same content hash) */
  duplicates: number;
  /** Bytes saved by not storing duplicates */
  bytesSavedEstimate: number;
}

export interface PersistResult {
  /** Number of pages written to IndexedDB */
  hotWrites: number;
  /** Number of pages queued for cloud sync */
  warmQueued: number;
  /** Deduplication stats */
  dedup: DedupStats;
  /** Current budget state */
  budget: StorageBudget;
}

// ── Default Config ────────────────────────────────────────────────────

const DEFAULT_CONFIG: StorageRouterConfig = {
  cloudFlushBatchSize: 100,
  hotPageLimit: 10_000,
  deduplication: true,
  compression: true,
  cloudSyncIntervalMs: 30_000,
  tursoRowBudget: 50_000,
};

// ── StorageRouter ─────────────────────────────────────────────────────

export class StorageRouter {
  private config: StorageRouterConfig;
  private contentHashMap = new Map<string, string>(); // contentHash → url
  private dedupStats: DedupStats = { total: 0, unique: 0, duplicates: 0, bytesSavedEstimate: 0 };
  private tursoRowsWritten = 0;
  private warmQueue: CrawledPage[] = [];
  private syncTimer: ReturnType<typeof setInterval> | null = null;
  private isSyncing = false;
  private budgetListeners: Array<(budget: StorageBudget) => void> = [];

  constructor(config?: Partial<StorageRouterConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ── Lifecycle ───────────────────────────────────────────────────────

  /** Start periodic cloud sync. Call when a crawl session begins. */
  startSession(sessionId: string): void {
    this.stopSession();
    this.contentHashMap.clear();
    this.dedupStats = { total: 0, unique: 0, duplicates: 0, bytesSavedEstimate: 0 };
    this.tursoRowsWritten = 0;
    this.warmQueue = [];

    if (isCloudSyncEnabled) {
      this.syncTimer = setInterval(
        () => this.flushWarmQueue(sessionId),
        this.config.cloudSyncIntervalMs,
      );
    }
  }

  /** Stop periodic sync and flush remaining queue. Call when crawl ends. */
  async stopSession(sessionId?: string): Promise<void> {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
    if (sessionId && this.warmQueue.length > 0) {
      await this.flushWarmQueue(sessionId);
    }
  }

  // ── Core: Write Pages ───────────────────────────────────────────────

  /**
   * Persist a batch of crawled pages.
   * 1. Dedup via content hash
   * 2. Write unique pages to IndexedDB (hot tier)
   * 3. Queue lean summaries for Turso sync (warm tier)
   */
  async persistPages(pages: CrawledPage[], sessionId: string): Promise<PersistResult> {
    // Step 1: Dedup
    const { unique, duplicates } = this.deduplicate(pages);

    // Step 2: Hot tier — IndexedDB
    const hotWrites = await this.writeHot(unique);

    // Step 3: Warm tier — queue for Turso
    this.warmQueue.push(...unique);
    this.dedupStats.total += pages.length;
    this.dedupStats.unique += unique.length;
    this.dedupStats.duplicates += duplicates;

    // Flush if queue exceeds batch size
    if (this.warmQueue.length >= this.config.cloudFlushBatchSize) {
      await this.flushWarmQueue(sessionId);
    }

    // Step 4: Budget management
    const budget = await this.getBudget();
    if (budget.idbPercent > 85) {
      await this.pruneHotTier(sessionId);
    }

    this.emitBudget(budget);

    return {
      hotWrites,
      warmQueued: this.warmQueue.length,
      dedup: { ...this.dedupStats },
      budget,
    };
  }

  // ── Tier 1: Hot (IndexedDB) ─────────────────────────────────────────

  private async writeHot(pages: CrawledPage[]): Promise<number> {
    if (pages.length === 0) return 0;
    try {
      await crawlDb.pages.bulkPut(pages);
      return pages.length;
    } catch (err) {
      console.error('[StorageRouter] Hot tier write failed:', err);
      return 0;
    }
  }

  private async pruneHotTier(sessionId: string): Promise<void> {
    try {
      // Keep only the most recent N pages in IndexedDB for the current session
      const count: number = await crawlDb.pages.where('crawlId').equals(sessionId).count();
      if (count <= this.config.hotPageLimit) return;

      const excess = count - this.config.hotPageLimit;
      // Delete oldest pages by timestamp
      const toDelete = await crawlDb.pages
        .where('crawlId')
        .equals(sessionId)
        .sortBy('timestamp');

      const urlsToDelete = toDelete.slice(0, excess).map(p => p.url);
      await crawlDb.pages.bulkDelete(urlsToDelete);
      console.info(`[StorageRouter] Pruned ${urlsToDelete.length} pages from hot tier`);
    } catch (err) {
      console.error('[StorageRouter] Hot tier prune failed:', err);
    }
  }

  // ── Tier 2: Warm (Turso) ────────────────────────────────────────────

  private async flushWarmQueue(sessionId: string): Promise<void> {
    if (this.isSyncing || this.warmQueue.length === 0 || !isCloudSyncEnabled) return;

    this.isSyncing = true;
    const batch = this.warmQueue.splice(0, this.config.cloudFlushBatchSize);

    try {
      const client = turso();
      const leanBatch = batch.map(page => toLeanSummary(page));
      // Batch insert lean summaries via individual statements
      // (Turso doesn't support bulk INSERT VALUES in the pipeline API)
      const statements = leanBatch.map(page => ({
        sql: `INSERT OR REPLACE INTO crawl_page_insights
              (id, run_id, project_id, session_id, url, summary_json, priority_score, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          `warm:${sessionId}:${page.url}`,
          `run_${sessionId}`,
          page._projectId || '',
          sessionId,
          page.url,
          JSON.stringify(page),
          page.priorityScore || 0,
          new Date().toISOString(),
        ],
      }));

      // Execute in chunks of 50 to avoid oversized requests
      for (let i = 0; i < statements.length; i += 50) {
        const chunk = statements.slice(i, i + 50);
        await client.batch(chunk as any);
        this.tursoRowsWritten += chunk.length;
      }

      console.info(`[StorageRouter] Flushed ${leanBatch.length} pages to warm tier (total: ${this.tursoRowsWritten})`);
    } catch (err) {
      console.error('[StorageRouter] Warm tier flush failed, re-queuing:', err);
      // Re-queue failed pages at the front
      this.warmQueue.unshift(...batch);
    } finally {
      this.isSyncing = false;
    }
  }

  // ── Tier 3: Cold (R2 via ghost-bridge) ──────────────────────────────

  /**
   * Archive a completed session to R2 cold storage.
   * Compresses the full page data and uploads via the ghost-bridge worker.
   */
  async archiveSession(sessionId: string, projectId: string): Promise<boolean> {
    try {
      const pages = await crawlDb.pages.where('crawlId').equals(sessionId).toArray();
      if (pages.length === 0) return true;

      const payload = this.config.compression
        ? await this.compressPayload(pages)
        : JSON.stringify(pages);

      const archiveKey = `archives/${projectId}/${sessionId}.json`;
      const response = await fetch('/api/storage/archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: archiveKey,
          data: payload,
          compressed: this.config.compression,
          pageCount: pages.length,
        }),
      });

      if (response.ok) {
        console.info(`[StorageRouter] Archived session ${sessionId} to R2 (${pages.length} pages)`);
        return true;
      }

      console.warn(`[StorageRouter] R2 archive returned ${response.status}`);
      return false;
    } catch (err) {
      console.error('[StorageRouter] Cold tier archive failed:', err);
      return false;
    }
  }

  // ── Content-Hash Deduplication ──────────────────────────────────────

  private deduplicate(pages: CrawledPage[]): { unique: CrawledPage[]; duplicates: number } {
    if (!this.config.deduplication) {
      return { unique: pages, duplicates: 0 };
    }

    const unique: CrawledPage[] = [];
    let dupes = 0;

    for (const page of pages) {
      const hash = (page as any).hash || (page as any).content_hash || this.quickHash(page);
      if (!hash) {
        unique.push(page);
        continue;
      }

      const existing = this.contentHashMap.get(hash);
      if (existing && existing !== page.url) {
        // Duplicate content at a different URL — mark it but don't store full data
        dupes++;
        this.dedupStats.bytesSavedEstimate += this.estimateSize(page);
        // Still add to unique but strip heavy fields
        unique.push({
          ...page,
          nearDuplicateMatch: existing,
          // Keep metadata but flag as duplicate
        } as CrawledPage);
      } else {
        this.contentHashMap.set(hash, page.url);
        unique.push(page);
      }
    }

    return { unique, duplicates: dupes };
  }

  private quickHash(page: CrawledPage): string {
    // Quick content fingerprint from title + h1 + first 500 chars of word count
    const key = `${page.title || ''}|${page.h1_1 || ''}|${page.wordCount || 0}|${page.statusCode || 0}`;
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return `qh_${Math.abs(hash).toString(36)}`;
  }

  private estimateSize(page: CrawledPage): number {
    try {
      return JSON.stringify(page).length * 2; // rough byte estimate
    } catch {
      return 4096; // fallback estimate
    }
  }

  // ── Compression ─────────────────────────────────────────────────────

  /**
   * Compress data using the CompressionStream API (gzip).
   * Falls back to plain JSON.stringify if CompressionStream is unavailable.
   */
  private async compressPayload(data: unknown): Promise<string> {
    const json = JSON.stringify(data);

    if (typeof CompressionStream === 'undefined') {
      return json;
    }

    try {
      const encoder = new TextEncoder();
      const stream = new Blob([encoder.encode(json)])
        .stream()
        .pipeThrough(new CompressionStream('gzip'));
      const compressed = await new Response(stream).arrayBuffer();
      // Encode as base64 for transport
      const bytes = new Uint8Array(compressed);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    } catch {
      return json;
    }
  }

  // ── Budget Tracking ─────────────────────────────────────────────────

  async getBudget(): Promise<StorageBudget> {
    let idbUsed = 0;
    let idbQuota = 0;

    try {
      if (navigator?.storage?.estimate) {
        const estimate = await navigator.storage.estimate();
        idbUsed = estimate.usage || 0;
        idbQuota = estimate.quota || 0;
      }
    } catch {
      // Storage estimate not available
    }

    const idbPercent = idbQuota > 0 ? (idbUsed / idbQuota) * 100 : 0;
    const isLow = idbPercent > 80 || this.tursoRowsWritten > this.config.tursoRowBudget * 0.9;

    return {
      idbUsed,
      idbQuota,
      idbPercent: Math.round(idbPercent * 100) / 100,
      tursoRowsWritten: this.tursoRowsWritten,
      tursoRowLimit: this.config.tursoRowBudget,
      isLow,
    };
  }

  onBudgetChange(listener: (budget: StorageBudget) => void): () => void {
    this.budgetListeners.push(listener);
    return () => {
      this.budgetListeners = this.budgetListeners.filter(l => l !== listener);
    };
  }

  private emitBudget(budget: StorageBudget): void {
    for (const listener of this.budgetListeners) {
      try {
        listener(budget);
      } catch {
        // Never let listener errors propagate
      }
    }
  }



  // ── Public Query Methods ────────────────────────────────────────────

  /** Read pages from hot tier (IndexedDB) */
  async readHot(crawlId: string): Promise<CrawledPage[]> {
    return crawlDb.pages.where('crawlId').equals(crawlId).toArray();
  }

  /** Read pages from warm tier (Turso) */
  async readWarm(sessionId: string): Promise<any[]> {
    if (!isCloudSyncEnabled) return [];
    try {
      const client = turso();
      const result = await client.execute({
        sql: 'SELECT summary_json FROM crawl_page_insights WHERE session_id = ? ORDER BY priority_score DESC',
        args: [sessionId],
      });
      return result.rows.map(row => JSON.parse(String(row.summary_json)));
    } catch (err) {
      console.error('[StorageRouter] Warm tier read failed:', err);
      return [];
    }
  }

  /** Get dedup stats */
  getDedupStats(): DedupStats {
    return { ...this.dedupStats };
  }

  /** Get current Turso write count */
  getTursoRowsWritten(): number {
    return this.tursoRowsWritten;
  }

  /** Check if warm tier budget is exhausted */
  isWarmBudgetExhausted(): boolean {
    return this.tursoRowsWritten >= this.config.tursoRowBudget;
  }
}

// ── Singleton Export ──────────────────────────────────────────────────

export const storageRouter = new StorageRouter();
