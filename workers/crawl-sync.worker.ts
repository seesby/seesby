// workers/crawl-sync.worker.ts
// ── Background Crawl Sync Worker ─────────────────────────────────────
// Runs Turso cloud sync off the main thread so the UI stays responsive
// during large crawl sessions. Receives page batches via postMessage,
// builds lean summaries, and sends them to Turso via the ghost-bridge
// worker's Turso proxy.
//
// Usage:
//   const syncWorker = new Worker(new URL('./crawl-sync.worker.ts', import.meta.url), { type: 'module' });
//   syncWorker.postMessage({ type: 'flush', sessionId, projectId, pages });

// ── Types ───────────────────────────────────────────────────────────

interface SyncMessage {
  type: 'flush' | 'archive' | 'ping';
  sessionId?: string;
  projectId?: string;
  pages?: any[];
  archiveKey?: string;
}

interface SyncResult {
  type: 'flush-result' | 'archive-result' | 'pong' | 'error';
  sessionId?: string;
  flushed?: number;
  archived?: boolean;
  error?: string;
}

// ── Lean Summary Builder ────────────────────────────────────────────

function toLeanSummary(page: any): Record<string, any> {
  return {
    url: page.url,
    finalUrl: page.finalUrl ?? page.url,
    title: page.title ?? null,
    metaDesc: page.metaDesc ?? null,
    h1_1: page.h1_1 ?? null,
    statusCode: page.statusCode ?? 0,
    contentType: page.contentType ?? null,
    crawlDepth: page.crawlDepth ?? 0,
    indexable: page.indexable !== false,
    loadTime: page.loadTime ?? 0,
    wordCount: page.wordCount ?? 0,
    inlinks: page.inlinks ?? 0,
    outlinks: (page.internalOutlinks ?? 0) + (page.externalOutlinks ?? 0),
    hash: page.hash ?? page.content_hash ?? null,
    inSitemap: page.inSitemap ?? false,
    canonical: page.canonical ?? null,
    cmsType: page.cmsType ?? null,
    isHtmlPage: page.isHtmlPage ?? true,
    gscClicks: page.gscClicks ?? null,
    gscImpressions: page.gscImpressions ?? null,
    ga4Sessions: page.ga4Sessions ?? null,
    ga4Users: page.ga4Users ?? null,
    urlRating: page.urlRating ?? null,
    referringDomains: page.referringDomains ?? null,
    opportunityScore: page.opportunityScore ?? null,
    businessValueScore: page.businessValueScore ?? null,
    recommendedAction: page.recommendedAction ?? null,
    summary: page.summary ?? null,
    contentQualityScore: page.contentQualityScore ?? null,
    eeatScore: page.eeatScore ?? null,
    searchIntent: page.searchIntent ?? null,
    geoScore: page.geoScore ?? null,
    lcp: page.fieldLcp ?? page.lcp ?? null,
    cls: page.fieldCls ?? page.cls ?? null,
    nearDuplicateMatch: page.nearDuplicateMatch ?? null,
    priorityScore: page.opportunityScore ?? page.businessValueScore ?? 0,
    timestamp: page.timestamp ?? Date.now(),
  };
}

// ── Message Handler ─────────────────────────────────────────────────

self.addEventListener('message', async (event: MessageEvent<SyncMessage>) => {
  const msg = event.data;

  switch (msg.type) {
    case 'ping': {
      self.postMessage({ type: 'pong' } as SyncResult);
      break;
    }

    case 'flush': {
      if (!msg.sessionId || !msg.projectId || !msg.pages?.length) {
        self.postMessage({ type: 'error', error: 'Missing sessionId, projectId, or pages' } as SyncResult);
        return;
      }

      try {
        const leanBatch = msg.pages.map(toLeanSummary);
        const now = new Date().toISOString();

        // Build batch statements for Turso via ghost-bridge
        const statements = leanBatch.map((page, i) => ({
          sql: `INSERT OR REPLACE INTO crawl_page_insights
                (id, run_id, project_id, session_id, url, summary_json, priority_score, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            `sync:${msg.sessionId}:${i}`,
            `run_${msg.sessionId}`,
            msg.projectId,
            msg.sessionId,
            page.url,
            JSON.stringify(page),
            page.priorityScore ?? 0,
            now,
          ],
        }));

        // Execute in chunks of 50 via the ghost-bridge Turso proxy
        let flushed = 0;
        for (let i = 0; i < statements.length; i += 50) {
          const chunk = statements.slice(i, i + 50);
          try {
            const resp = await fetch('/api/crawler/sync/batch', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ statements: chunk }),
            });
            if (resp.ok) {
              flushed += chunk.length;
            } else {
              console.warn(`[crawl-sync] Batch ${i} returned ${resp.status}`);
            }
          } catch (batchErr) {
            console.warn(`[crawl-sync] Batch ${i} failed:`, batchErr);
          }
        }

        self.postMessage({
          type: 'flush-result',
          sessionId: msg.sessionId,
          flushed,
        } as SyncResult);
      } catch (err: any) {
        self.postMessage({
          type: 'error',
          sessionId: msg.sessionId,
          error: err.message ?? String(err),
        } as SyncResult);
      }
      break;
    }

    case 'archive': {
      if (!msg.sessionId || !msg.projectId || !msg.archiveKey) {
        self.postMessage({ type: 'error', error: 'Missing archive params' } as SyncResult);
        return;
      }

      try {
        // Archive is handled by the main thread via StorageTieringService
        // since it requires IndexedDB access. This message is a signal.
        self.postMessage({
          type: 'archive-result',
          sessionId: msg.sessionId,
          archived: true,
        } as SyncResult);
      } catch (err: any) {
        self.postMessage({
          type: 'error',
          error: err.message ?? String(err),
        } as SyncResult);
      }
      break;
    }

    default: {
      self.postMessage({ type: 'error', error: `Unknown message type: ${(msg as any).type}` } as SyncResult);
    }
  }
});

// Signal ready
self.postMessage({ type: 'ready' });
