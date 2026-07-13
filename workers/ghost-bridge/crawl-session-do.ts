// workers/ghost-bridge/crawl-session-do.ts
// ── Crawl Session Durable Object ──────────────────────────────────────
// Manages crawl job state server-side: URL queue, per-URL leasing with
// heartbeat, per-domain rate limiting, and resume capability.
//
// The browser (GhostCrawler) acts as the crawler worker — it leases URLs
// from this DO, fetches them via ghost-bridge, and reports back results.
// This enables resumable crawls (browser can close/reopen) and enforces
// polite rate limits centrally.

interface LeasedUrl {
  url: string;
  depth: number;
  leasedAt: number;
  expiresAt: number;
  attempts: number;
}

interface CompletedUrl {
  url: string;
  statusCode: number;
  completedAt: number;
}

interface CrawlSession {
  id: string;
  startUrl: string;
  config: {
    maxDepth: number;
    maxPages: number;
    maxConcurrent: number;
    boostMode: boolean;
    userAgent: string;
  };
  status: 'queued' | 'running' | 'paused' | 'completed' | 'failed';
  pending: Array<{ url: string; depth: number }>;
  leased: Map<string, LeasedUrl>;
  completed: Map<string, CompletedUrl>;
  failed: Map<string, { url: string; error: string; attempts: number }>;
  domainLastHit: Map<string, number>; // domain → last request timestamp
  discoveredUrls: Set<string>;
  startedAt: number;
  completedAt: number | null;
  stats: {
    totalDiscovered: number;
    totalCompleted: number;
    totalFailed: number;
    totalLeased: number;
  };
}

const LEASE_TIMEOUT_MS = 30_000;       // 30s per URL lease
const MAX_ATTEMPTS = 3;                 // retry failed URLs up to 3 times
const MIN_DOMAIN_DELAY_MS = 500;        // 500ms between requests to same domain
const BOOST_DOMAIN_DELAY_MS = 100;      // 100ms in boost mode
const MAX_QUEUE_SIZE = 100_000;         // safety cap

export class CrawlSessionDO {
  private state: DurableObjectState;
  private session: CrawlSession | null = null;
  private leaseCheckTimer: ReturnType<typeof setInterval> | null = null;

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // ── Create Session ──────────────────────────────────────────
      if (path === '/create' && request.method === 'POST') {
        return this.handleCreate(request);
      }

      // ── Lease URLs ──────────────────────────────────────────────
      if (path === '/lease' && request.method === 'POST') {
        return this.handleLease(request);
      }

      // ── Complete URLs (report results + discovered links) ───────
      if (path === '/complete' && request.method === 'POST') {
        return this.handleComplete(request);
      }

      // ── Fail URL ────────────────────────────────────────────────
      if (path === '/fail' && request.method === 'POST') {
        return this.handleFail(request);
      }

      // ── Heartbeat (extend lease) ────────────────────────────────
      if (path === '/heartbeat' && request.method === 'POST') {
        return this.handleHeartbeat(request);
      }

      // ── Status ──────────────────────────────────────────────────
      if (path === '/status' && request.method === 'GET') {
        return this.handleStatus();
      }

      // ── Pause ───────────────────────────────────────────────────
      if (path === '/pause' && request.method === 'POST') {
        return this.handlePause();
      }

      // ── Resume ──────────────────────────────────────────────────
      if (path === '/resume' && request.method === 'POST') {
        return this.handleResume();
      }

      return json({ error: 'Not found' }, 404);
    } catch (err: any) {
      return json({ error: err.message || 'Internal error' }, 500);
    }
  }

  // ── Handlers ────────────────────────────────────────────────────────

  private async handleCreate(request: Request): Promise<Response> {
    const body = await request.json() as any;
    if (!body.sessionId || !body.startUrl) {
      return json({ error: 'Missing sessionId or startUrl' }, 400);
    }

    const session: CrawlSession = {
      id: body.sessionId,
      startUrl: body.startUrl,
      config: {
        maxDepth: body.maxDepth ?? 5,
        maxPages: body.maxPages ?? 10000,
        maxConcurrent: body.maxConcurrent ?? 5,
        boostMode: body.boostMode ?? false,
        userAgent: body.userAgent ?? 'Seesby-Ghost/1.0',
      },
      status: 'running',
      pending: [{ url: body.startUrl, depth: 0 }],
      leased: new Map(),
      completed: new Map(),
      failed: new Map(),
      domainLastHit: new Map(),
      discoveredUrls: new Set([body.startUrl]),
      startedAt: Date.now(),
      completedAt: null,
      stats: {
        totalDiscovered: 1,
        totalCompleted: 0,
        totalFailed: 0,
        totalLeased: 0,
      },
    };

    this.session = session;
    await this.persistSession();
    this.startLeaseChecker();

    // Schedule an alarm so the DO wakes up if evicted from memory
    // (e.g. after 5 minutes of inactivity)
    await this.state.storage.setAlarm(Date.now() + 5 * 60 * 1000);

    return json({ ok: true, sessionId: session.id, config: session.config });
  }

  private async handleLease(request: Request): Promise<Response> {
    if (!this.session) {
      return json({ error: 'No active session' }, 404);
    }
    if (this.session.status !== 'running') {
      return json({ error: `Session is ${this.session.status}`, urls: [] });
    }

    const body = await request.json() as any;
    const count = Math.min(body.count ?? 5, this.session.config.maxConcurrent);
    const domainDelay = this.session.config.boostMode
      ? BOOST_DOMAIN_DELAY_MS
      : MIN_DOMAIN_DELAY_MS;

    const now = Date.now();
    const leased: Array<{ url: string; depth: number }> = [];

    // Reclaim expired leases first
    this.reclaimExpiredLeases(now);

    // Find leaseable URLs (respect domain rate limits and concurrency)
    const leaseable: typeof this.session.pending = [];
    for (const item of this.session.pending) {
      if (leased.length + leaseable.length >= count) break;

      const domain = extractDomain(item.url);
      const lastHit = this.session.domainLastHit.get(domain) ?? 0;
      if (now - lastHit < domainDelay) continue;

      // Don't lease URLs already in-flight
      if (this.session.leased.has(item.url)) continue;

      leaseable.push(item);
    }

    // Move from pending to leased
    for (const item of leaseable) {
      const idx = this.session.pending.indexOf(item);
      if (idx !== -1) this.session.pending.splice(idx, 1);

      const lease: LeasedUrl = {
        url: item.url,
        depth: item.depth,
        leasedAt: now,
        expiresAt: now + LEASE_TIMEOUT_MS,
        attempts: (this.session.failed.get(item.url)?.attempts ?? 0) + 1,
      };

      this.session.leased.set(item.url, lease);
      this.session.domainLastHit.set(extractDomain(item.url), now);
      this.session.stats.totalLeased++;
      leased.push(item);
    }

    if (leased.length > 0) {
      await this.persistSession();
    }

    return json({
      urls: leased,
      queueRemaining: this.session.pending.length,
      activeLeases: this.session.leased.size,
    });
  }

  private async handleComplete(request: Request): Promise<Response> {
    if (!this.session) return json({ error: 'No active session' }, 404);

    const body = await request.json() as any;
    const results: Array<{ url: string; statusCode: number; discoveredLinks?: string[] }> =
      body.results ?? [];

    const newlyDiscovered: string[] = [];

    for (const result of results) {
      // Move from leased to completed
      this.session.leased.delete(result.url);
      this.session.completed.set(result.url, {
        url: result.url,
        statusCode: result.statusCode,
        completedAt: Date.now(),
      });
      this.session.stats.totalCompleted++;

      // Process discovered links
      if (result.discoveredLinks) {
        const currentDepth = this.getCurrentDepth(result.url);
        for (const link of result.discoveredLinks) {
          if (this.session.discoveredUrls.has(link)) continue;
          if (this.session.discoveredUrls.size >= MAX_QUEUE_SIZE) break;

          this.session.discoveredUrls.add(link);
          const domain = extractDomain(link);

          // Only enqueue same-domain links
          if (domain === extractDomain(this.session.startUrl)) {
            this.session.pending.push({ url: link, depth: currentDepth + 1 });
            this.session.stats.totalDiscovered++;
            newlyDiscovered.push(link);
          }
        }
      }
    }

    // Check if crawl is complete
    if (this.session.leased.size === 0 && this.session.pending.length === 0) {
      this.session.status = 'completed';
      this.session.completedAt = Date.now();
    }

    // Check page limit
    if (this.session.stats.totalCompleted >= this.session.config.maxPages) {
      this.session.status = 'completed';
      this.session.completedAt = Date.now();
    }

    await this.persistSession();

    return json({
      ok: true,
      newlyDiscovered: newlyDiscovered.length,
      queueRemaining: this.session.pending.length,
      status: this.session.status,
      stats: { ...this.session.stats },
    });
  }

  private async handleFail(request: Request): Promise<Response> {
    if (!this.session) return json({ error: 'No active session' }, 404);

    const body = await request.json() as any;
    const url = body.url as string;
    const error = body.error ?? 'Unknown error';

    this.session.leased.delete(url);
    const existing = this.session.failed.get(url);
    const attempts = (existing?.attempts ?? 0) + 1;

    if (attempts < MAX_ATTEMPTS) {
      // Re-queue for retry
      this.session.failed.set(url, { url, error, attempts });
      const depth = this.getCurrentDepth(url);
      this.session.pending.push({ url, depth });
    } else {
      // Permanently failed
      this.session.failed.set(url, { url, error, attempts });
      this.session.stats.totalFailed++;
    }

    await this.persistSession();

    return json({
      ok: true,
      willRetry: attempts < MAX_ATTEMPTS,
      attempts,
      queueRemaining: this.session.pending.length,
    });
  }

  private async handleHeartbeat(request: Request): Promise<Response> {
    if (!this.session) return json({ error: 'No active session' }, 404);

    const body = await request.json() as any;
    const urls: string[] = body.urls ?? [];

    let extended = 0;
    for (const url of urls) {
      const lease = this.session.leased.get(url);
      if (lease) {
        lease.expiresAt = Date.now() + LEASE_TIMEOUT_MS;
        extended++;
      }
    }

    if (extended > 0) {
      await this.persistSession();
    }

    return json({ ok: true, extended });
  }

  private async handleStatus(): Promise<Response> {
    if (!this.session) {
      return json({ error: 'No active session' }, 404);
    }

    return json({
      id: this.session.id,
      status: this.session.status,
      config: this.session.config,
      stats: { ...this.session.stats },
      queueSize: this.session.pending.length,
      activeLeases: this.session.leased.size,
      completedCount: this.session.completed.size,
      failedCount: this.session.failed.size,
      startedAt: this.session.startedAt,
      completedAt: this.session.completedAt,
      elapsed: this.session.completedAt
        ? this.session.completedAt - this.session.startedAt
        : Date.now() - this.session.startedAt,
    });
  }

  private async handlePause(): Promise<Response> {
    if (!this.session) return json({ error: 'No active session' }, 404);
    this.session.status = 'paused';
    await this.persistSession();
    return json({ ok: true, status: 'paused' });
  }

  private async handleResume(): Promise<Response> {
    if (!this.session) return json({ error: 'No active session' }, 404);
    this.session.status = 'running';
    await this.persistSession();
    return json({ ok: true, status: 'running' });
  }

  // ── Helpers ──────────────────────────────────────────────────────────

  private reclaimExpiredLeases(now: number): void {
    if (!this.session) return;
    for (const [url, lease] of this.session.leased) {
      if (now > lease.expiresAt) {
        // Lease expired — re-queue if under attempt limit
        this.session.leased.delete(url);
        if (lease.attempts < MAX_ATTEMPTS) {
          this.session.pending.push({ url, depth: lease.depth });
        } else {
          this.session.failed.set(url, {
            url,
            error: 'Lease expired (no heartbeat)',
            attempts: lease.attempts,
          });
          this.session.stats.totalFailed++;
        }
      }
    }
  }

  private getCurrentDepth(url: string): number {
    if (!this.session) return 0;
    // Check leased
    const lease = this.session.leased.get(url);
    if (lease) return lease.depth;
    // Check completed
    const completed = this.session.completed.get(url);
    if (completed) return 0; // we don't store depth in completed
    return 0;
  }

  private startLeaseChecker(): void {
    if (this.leaseCheckTimer) return;
    this.leaseCheckTimer = setInterval(() => {
      this.reclaimExpiredLeases(Date.now());
    }, 10_000); // check every 10s
  }

  private async persistSession(): Promise<void> {
    if (!this.session) return;

    // Serialize Maps and Sets for durable storage
    const serializable = {
      ...this.session,
      leased: Object.fromEntries(this.session.leased),
      completed: Object.fromEntries(this.session.completed),
      failed: Object.fromEntries(this.session.failed),
      domainLastHit: Object.fromEntries(this.session.domainLastHit),
      discoveredUrls: [...this.session.discoveredUrls],
    };

    await this.state.storage.put('session', serializable);
  }

  // Called when DO is activated (woken up from hibernation)
  async alarm(): Promise<void> {
    // Load persisted session
    const saved = await this.state.storage.get<any>('session');
    if (saved) {
      this.session = {
        ...saved,
        leased: new Map(Object.entries(saved.leased ?? {})),
        completed: new Map(Object.entries(saved.completed ?? {})),
        failed: new Map(Object.entries(saved.failed ?? {})),
        domainLastHit: new Map(Object.entries(saved.domainLastHit ?? {})),
        discoveredUrls: new Set(saved.discoveredUrls ?? []),
      };
      this.startLeaseChecker();
    }
  }
}

// ── Utilities ─────────────────────────────────────────────────────────

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
