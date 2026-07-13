// services/StorageTieringService.ts
// ── Storage Tiering Service ───────────────────────────────────────────
// Manages the lifecycle of crawl data across tiers:
// - Hot (IndexedDB): Active crawl session data, fast local reads
// - Warm (Turso): Recent session summaries, cross-device sync
// - Cold (R2): Archived sessions older than 30 days
//
// Handles: compression, smart archival, retention enforcement,
// budget-aware eviction, and cross-tier promotion/demotion.

import { turso, isCloudSyncEnabled } from './turso';
import { crawlDb } from './CrawlDatabase';
import { toLeanSummary } from './StorageHelpers';

// ── Types ─────────────────────────────────────────────────────────────

export interface TieringPolicy {
  /** Days before a session is eligible for cold archival (default 30) */
  coldArchiveDays: number;
  /** Number of recent runs to keep in warm tier per project (default 5) */
  warmRetentionRuns: number;
  /** Max pages in hot tier per session before pruning (default 10 000) */
  hotPageLimit: number;
  /** Whether to compress before archival (default true) */
  compressBeforeArchive: boolean;
  /** Minimum free IDB quota % before forced eviction (default 15) */
  minFreeIdbPercent: number;
}

export interface TierStats {
  hotPages: number;
  warmInsights: number;
  coldArchives: number;
  totalSessions: number;
  idbUsageEstimate: number;
  idbQuotaEstimate: number;
}

export type TierTransition = 'hot→warm' | 'warm→cold' | 'hot→evict' | 'warm→evict';

export interface TieringEvent {
  transition: TierTransition;
  sessionId: string;
  pageCount: number;
  timestamp: string;
  reason: string;
}

// ── Default Policy ────────────────────────────────────────────────────

const DEFAULT_POLICY: TieringPolicy = {
  coldArchiveDays: 30,
  warmRetentionRuns: 5,
  hotPageLimit: 10_000,
  compressBeforeArchive: true,
  minFreeIdbPercent: 15,
};

// ── StorageTieringService ─────────────────────────────────────────────

export class StorageTieringService {
  private policy: TieringPolicy;
  private eventLog: TieringEvent[] = [];
  private eventListeners: Array<(event: TieringEvent) => void> = [];

  constructor(policy?: Partial<TieringPolicy>) {
    this.policy = { ...DEFAULT_POLICY, ...policy };
  }

  // ── Tier Statistics ─────────────────────────────────────────────────

  /**
   * Get a snapshot of data distribution across tiers.
   */
  async getStats(projectId?: string): Promise<TierStats> {
    let hotPages = 0;
    let totalSessions = 0;
    let idbUsage = 0;
    let idbQuota = 0;

    // Hot tier (IndexedDB)
    try {
      hotPages = await crawlDb.pages.count();
      totalSessions = await crawlDb.sessions.count();

      if (navigator?.storage?.estimate) {
        const estimate = await navigator.storage.estimate();
        idbUsage = estimate.usage ?? 0;
        idbQuota = estimate.quota ?? 0;
      }
    } catch {
      // IndexedDB not available
    }

    // Warm tier (Turso)
    let warmInsights = 0;
    if (isCloudSyncEnabled && projectId) {
      try {
        const client = turso();
        const result = await client.execute({
          sql: 'SELECT COUNT(*) as cnt FROM crawl_page_insights WHERE project_id = ?',
          args: [projectId],
        });
        warmInsights = Number(result.rows[0]?.cnt ?? 0);
      } catch {
        // Turso unavailable
      }
    }

    // Cold tier count (we track this via metadata, not a direct R2 listing)
    let coldArchives = 0;
    if (isCloudSyncEnabled && projectId) {
      try {
        const client = turso();
        const result = await client.execute({
          sql: `SELECT COUNT(*) as cnt FROM crawl_sessions
                WHERE project_id = ? AND metadata LIKE '%isArchived":true%'`,
          args: [projectId],
        });
        coldArchives = Number(result.rows[0]?.cnt ?? 0);
      } catch {
        // Turso unavailable
      }
    }

    return {
      hotPages,
      warmInsights,
      coldArchives,
      totalSessions,
      idbUsageEstimate: idbUsage,
      idbQuotaEstimate: idbQuota,
    };
  }

  // ── Hot → Warm: Flush Enriched Summaries ────────────────────────────

  /**
   * Promote pages from IndexedDB to Turso warm tier.
   * Called automatically at end of crawl session, or on budget pressure.
   */
  async flushHotToWarm(sessionId: string, projectId: string): Promise<number> {
    if (!isCloudSyncEnabled) return 0;

    try {
      const pages = await crawlDb.pages.where('crawlId').equals(sessionId).toArray();
      if (pages.length === 0) return 0;

      const client = turso();
      const now = new Date().toISOString();

      // Build lean summaries (strip heavy fields)
      const statements = pages.map((page, i) => ({
        sql: `INSERT OR REPLACE INTO crawl_page_insights
              (id, run_id, project_id, session_id, url, summary_json, priority_score, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          `tier:${sessionId}:${i}`,
          `run_${sessionId}`,
          projectId,
          sessionId,
          page.url,
          JSON.stringify(toLeanSummary(page)),
          page.opportunityScore ?? page.businessValueScore ?? 0,
          now,
        ],
      }));

      // Execute in batches of 50
      let flushed = 0;
      for (let i = 0; i < statements.length; i += 50) {
        const chunk = statements.slice(i, i + 50);
        await client.batch(chunk as any);
        flushed += chunk.length;
      }

      this.emitEvent({
        transition: 'hot→warm',
        sessionId,
        pageCount: flushed,
        timestamp: now,
        reason: 'Session completed or budget pressure',
      });

      return flushed;
    } catch (err) {
      console.error('[StorageTiering] Hot→Warm flush failed:', err);
      return 0;
    }
  }

  // ── Warm → Cold: Archive Old Sessions ───────────────────────────────

  /**
   * Archive sessions older than the cold threshold to R2.
   * After successful archive, removes page data from Turso to save space.
   */
  async archiveOldSessions(projectId: string): Promise<number> {
    if (!isCloudSyncEnabled) return 0;

    const client = turso();
    const cutoffDate = new Date(
      Date.now() - this.policy.coldArchiveDays * 24 * 60 * 60 * 1000
    ).toISOString();

    try {
      // Find old, non-archived sessions
      const oldSessions = await client.execute({
        sql: `SELECT id FROM crawl_sessions
              WHERE created_at < ?
              AND (metadata IS NULL OR metadata NOT LIKE '%isArchived":true%')
              AND id IN (SELECT session_id FROM crawl_runs WHERE project_id = ?)`,
        args: [cutoffDate, projectId],
      });

      let archived = 0;

      for (const row of oldSessions.rows) {
        const sessionId = String(row.id);

        // Fetch all page insights for this session
        const pages = await client.execute({
          sql: 'SELECT * FROM crawl_page_insights WHERE session_id = ?',
          args: [sessionId],
        });

        if (pages.rows.length === 0) continue;

        // Upload to R2 via ghost-bridge
        const archiveKey = `archives/${projectId}/${sessionId}.json`;
        const payload = this.policy.compressBeforeArchive
          ? await this.compress(JSON.stringify(pages.rows))
          : JSON.stringify(pages.rows);

        const response = await fetch('/api/storage/archive', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: archiveKey,
            data: payload,
            compressed: this.policy.compressBeforeArchive,
            pageCount: pages.rows.length,
          }),
        });

        if (response.ok) {
          // Remove page data from Turso (keep metadata)
          await client.batch([
            { sql: 'DELETE FROM crawl_page_insights WHERE session_id = ?', args: [sessionId] },
            { sql: 'DELETE FROM crawl_issue_clusters WHERE run_id IN (SELECT id FROM crawl_runs WHERE session_id = ?)', args: [sessionId] },
            {
              sql: `UPDATE crawl_sessions SET metadata = JSON_SET(COALESCE(metadata, '{}'), '$.isArchived', true, '$.archiveKey', ?) WHERE id = ?`,
              args: [archiveKey, sessionId],
            },
          ]);

          archived++;
          this.emitEvent({
            transition: 'warm→cold',
            sessionId,
            pageCount: pages.rows.length,
            timestamp: new Date().toISOString(),
            reason: `Session older than ${this.policy.coldArchiveDays} days`,
          });

          console.info(`[StorageTiering] Archived session ${sessionId} to R2 (${pages.rows.length} pages)`);
        }
      }

      return archived;
    } catch (err) {
      console.error('[StorageTiering] Warm→Cold archival failed:', err);
      return 0;
    }
  }

  // ── Retention Enforcement ───────────────────────────────────────────

  /**
   * Enforce retention policy: keep only N most recent runs per project.
   * Older runs are either archived (if cold-eligible) or evicted.
   */
  async enforceRetentionPolicy(projectId: string): Promise<number> {
    if (!isCloudSyncEnabled) return 0;

    const client = turso();

    try {
      // Find runs beyond retention window
      const allRuns = await client.execute({
        sql: `SELECT id, session_id, created_at FROM crawl_runs
              WHERE project_id = ? ORDER BY created_at DESC`,
        args: [projectId],
      });

      const runsToEvict = allRuns.rows.slice(this.policy.warmRetentionRuns);
      if (runsToEvict.length === 0) return 0;

      let evicted = 0;

      for (const run of runsToEvict) {
        const runId = String(run.id);
        const sessionId = String(run.session_id);

        // Delete associated data
        await client.batch([
          { sql: 'DELETE FROM crawl_page_insights WHERE run_id = ?', args: [runId] },
          { sql: 'DELETE FROM crawl_issue_clusters WHERE run_id = ?', args: [runId] },
          { sql: 'DELETE FROM trend_snapshots WHERE run_id = ?', args: [runId] },
        ]);

        evicted++;
        this.emitEvent({
          transition: 'warm→evict',
          sessionId,
          pageCount: 0,
          timestamp: new Date().toISOString(),
          reason: `Beyond retention window (keep ${this.policy.warmRetentionRuns} runs)`,
        });
      }

      console.info(`[StorageTiering] Evicted ${evicted} old runs from warm tier`);
      return evicted;
    } catch (err) {
      console.error('[StorageTiering] Retention enforcement failed:', err);
      return 0;
    }
  }

  // ── Budget-Aware Hot Tier Eviction ──────────────────────────────────

  /**
   * Check IndexedDB budget and evict old sessions if quota is critically low.
   * Returns the number of sessions evicted.
   */
  async evictHotIfUnderPressure(): Promise<number> {
    try {
      if (!navigator?.storage?.estimate) return 0;

      const estimate = await navigator.storage.estimate();
      const usage = estimate.usage ?? 0;
      const quota = estimate.quota ?? 1;
      const freePercent = ((quota - usage) / quota) * 100;

      if (freePercent >= this.policy.minFreeIdbPercent) return 0;

      // Under pressure — evict oldest sessions
      const sessions = await crawlDb.sessions.orderBy('startedAt').toArray();
      let evicted = 0;

      for (const session of sessions.slice(0, Math.max(1, Math.floor(sessions.length / 3)))) {
        await crawlDb.pages.where('crawlId').equals(session.id).delete();
        await crawlDb.queries.where('crawlId').equals(session.id).delete();
        await crawlDb.sessions.delete(session.id);
        evicted++;

        this.emitEvent({
          transition: 'hot→evict',
          sessionId: session.id,
          pageCount: 0,
          timestamp: new Date().toISOString(),
          reason: `IDB quota pressure (free: ${freePercent.toFixed(1)}%)`,
        });
      }

      console.warn(`[StorageTiering] Evicted ${evicted} sessions from hot tier due to IDB pressure`);
      return evicted;
    } catch (err) {
      console.error('[StorageTiering] Hot eviction failed:', err);
      return 0;
    }
  }

  // ── Cold → Warm: Restore Archived Session ───────────────────────────

  /**
   * Restore an archived session from R2 back to Turso warm tier.
   * Used when a user requests to view historical session data.
   */
  async restoreFromArchive(
    projectId: string,
    sessionId: string,
  ): Promise<boolean> {
    if (!isCloudSyncEnabled) return false;

    try {
      const client = turso();

      // Get the archive key from session metadata
      const result = await client.execute({
        sql: `SELECT metadata FROM crawl_sessions WHERE id = ?`,
        args: [sessionId],
      });

      if (result.rows.length === 0) return false;

      const rawMetadata = result.rows[0].metadata;
      const metadata = typeof rawMetadata === 'string'
        ? JSON.parse(rawMetadata)
        : (rawMetadata as any) ?? {};
      const archiveKey = metadata.archiveKey ?? `archives/${projectId}/${sessionId}.json`;

      // Fetch from R2 via ghost-bridge
      const response = await fetch(`/api/storage/restore?key=${encodeURIComponent(archiveKey)}`);
      if (!response.ok) return false;

      const data = await response.json() as any;
      if (!data.pages || !Array.isArray(data.pages)) return false;

      // Re-insert into Turso warm tier
      const now = new Date().toISOString();
      const statements = data.pages.map((page: any, i: number) => ({
        sql: `INSERT OR REPLACE INTO crawl_page_insights
              (id, run_id, project_id, session_id, url, summary_json, priority_score, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          `restore:${sessionId}:${i}`,
          `run_${sessionId}`,
          projectId,
          sessionId,
          page.url ?? '',
          JSON.stringify(page),
          page.priorityScore ?? 0,
          now,
        ],
      }));

      for (let i = 0; i < statements.length; i += 50) {
        const chunk = statements.slice(i, i + 50);
        await client.batch(chunk as any);
      }

      // Update metadata to reflect restore
      await client.execute({
        sql: `UPDATE crawl_sessions SET metadata = JSON_SET(COALESCE(metadata, '{}'), '$.isArchived', false, '$.restoredAt', ?) WHERE id = ?`,
        args: [now, sessionId],
      });

      return true;
    } catch (err) {
      console.error('[StorageTiering] Cold→Warm restore failed:', err);
      return false;
    }
  }

  // ── Event System ────────────────────────────────────────────────────

  onTierTransition(listener: (event: TieringEvent) => void): () => void {
    this.eventListeners.push(listener);
    return () => {
      this.eventListeners = this.eventListeners.filter(l => l !== listener);
    };
  }

  getEventLog(): TieringEvent[] {
    return [...this.eventLog];
  }

  private emitEvent(event: TieringEvent): void {
    this.eventLog.push(event);
    // Keep only last 100 events
    if (this.eventLog.length > 100) {
      this.eventLog = this.eventLog.slice(-100);
    }
    for (const listener of this.eventListeners) {
      try {
        listener(event);
      } catch {
        // Never let listener errors propagate
      }
    }
  }

  // ── Helpers ──────────────────────────────────────────────────────────

  /**
   * Compress data using CompressionStream API (gzip).
   * Falls back to plain string if unavailable.
   */
  private async compress(data: string): Promise<string> {
    if (typeof CompressionStream === 'undefined') {
      return data;
    }

    try {
      const encoder = new TextEncoder();
      const stream = new Blob([encoder.encode(data)])
        .stream()
        .pipeThrough(new CompressionStream('gzip'));
      const compressed = await new Response(stream).arrayBuffer();
      const bytes = new Uint8Array(compressed);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    } catch {
      return data;
    }
  }


}

// ── Singleton Export ──────────────────────────────────────────────────

export const storageTiering = new StorageTieringService();
