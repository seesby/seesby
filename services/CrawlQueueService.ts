// services/CrawlQueueService.ts
// ── Crawl Queue Service (Client) ──────────────────────────────────────
// Browser-side client that communicates with the CrawlSessionDO Durable
// Object via the ghost-bridge worker. GhostCrawler delegates queue
// management to this service instead of maintaining its own queue array.
//
// This enables:
// - Resumable crawls (queue survives browser close/reopen)
// - Server-side rate limiting (polite crawling enforced centrally)
// - Multi-device crawl continuation

const BRIDGE_BASE = () => {
  const env = (import.meta as any).env?.VITE_GHOST_BRIDGE_URL;
  return env ? env.replace(/\/$/, '') : '';
};

export interface QueueConfig {
  sessionId: string;
  startUrl: string;
  maxDepth?: number;
  maxPages?: number;
  maxConcurrent?: number;
  boostMode?: boolean;
  userAgent?: string;
}

export interface LeasedUrl {
  url: string;
  depth: number;
}

export interface LeaseResult {
  urls: LeasedUrl[];
  queueRemaining: number;
  activeLeases: number;
}

export interface CompleteResult {
  ok: boolean;
  newlyDiscovered: number;
  queueRemaining: number;
  status: string;
  stats: {
    totalDiscovered: number;
    totalCompleted: number;
    totalFailed: number;
    totalLeased: number;
  };
}

export interface SessionStatus {
  id: string;
  status: string;
  config: Record<string, any>;
  stats: {
    totalDiscovered: number;
    totalCompleted: number;
    totalFailed: number;
    totalLeased: number;
  };
  queueSize: number;
  activeLeases: number;
  completedCount: number;
  failedCount: number;
  startedAt: number;
  completedAt: number | null;
  elapsed: number;
}

export class CrawlQueueService {
  private sessionId: string;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private activeUrls: Set<string> = new Set();
  private bridgeBase: string;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
    this.bridgeBase = BRIDGE_BASE();
  }

  // ── Session Lifecycle ───────────────────────────────────────────────

  /** Create a new crawl session in the DO */
  async createSession(config: QueueConfig): Promise<{ ok: boolean; config?: any }> {
    const response = await this.doRequest('/create', 'POST', config);
    return response;
  }

  /** Get current session status */
  async getStatus(): Promise<SessionStatus> {
    return this.doRequest('/status', 'GET');
  }

  /** Pause the crawl */
  async pause(): Promise<void> {
    await this.doRequest('/pause', 'POST');
  }

  /** Resume a paused crawl */
  async resume(): Promise<void> {
    await this.doRequest('/resume', 'POST');
  }

  // ── URL Leasing ─────────────────────────────────────────────────────

  /**
   * Lease a batch of URLs for processing.
   * GhostCrawler calls this in its run loop instead of shifting from its own queue.
   */
  async leaseUrls(count = 5): Promise<LeaseResult> {
    const result = await this.doRequest<LeaseResult>('/lease', 'POST', { count });

    // Track active URLs for heartbeat
    for (const item of result.urls) {
      this.activeUrls.add(item.url);
    }

    return result;
  }

  /**
   * Report completed URLs back to the DO.
   * Each result can include discovered links for BFS expansion.
   */
  async completeUrls(
    results: Array<{ url: string; statusCode: number; discoveredLinks?: string[] }>
  ): Promise<CompleteResult> {
    // Remove from active tracking
    for (const r of results) {
      this.activeUrls.delete(r.url);
    }

    return this.doRequest<CompleteResult>('/complete', 'POST', { results });
  }

  /**
   * Report a failed URL.
   */
  async failUrl(url: string, error: string): Promise<{ willRetry: boolean; attempts: number }> {
    this.activeUrls.delete(url);
    return this.doRequest('/fail', 'POST', { url, error });
  }

  // ── Heartbeat ───────────────────────────────────────────────────────

  /**
   * Start periodic heartbeat to keep active leases alive.
   * Call this when the crawl begins.
   */
  startHeartbeat(intervalMs = 10_000): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      this.sendHeartbeat().catch(err => {
        console.warn('[CrawlQueue] Heartbeat failed:', err.message);
      });
    }, intervalMs);
  }

  /**
   * Stop heartbeat. Call when crawl pauses or ends.
   */
  stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private async sendHeartbeat(): Promise<void> {
    if (this.activeUrls.size === 0) return;
    await this.doRequest('/heartbeat', 'POST', {
      urls: [...this.activeUrls],
    });
  }

  // ── HTTP Transport ──────────────────────────────────────────────────

  private async doRequest<T = any>(
    path: string,
    method: 'GET' | 'POST',
    body?: unknown,
  ): Promise<T> {
    const url = `${this.bridgeBase}/api/crawl-queue/${this.sessionId}${path}`;
    const opts: RequestInit = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (body && method === 'POST') {
      opts.body = JSON.stringify(body);
    }

    const response = await fetch(url, opts);
    if (!response.ok) {
      const errBody: any = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(errBody.error || `Queue request failed: ${response.status}`);
    }
    return response.json() as Promise<T>;
  }

  // ── Cleanup ─────────────────────────────────────────────────────────

  dispose(): void {
    this.stopHeartbeat();
    this.activeUrls.clear();
  }
}
