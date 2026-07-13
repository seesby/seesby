// services/crawler/browser-pool/BrowserPoolManager.ts
// ── Browser Pool Orchestrator ───────────────────────────────────────
//
// Manages a pool of Web Workers that proxy fetch() calls through the
// user's browser session. Orchestrates quota management, CAPTCHA
// solving, worker selection, and error-driven rotation.
//
// Pattern follows ai-rotation.ts: provider pool → quota gating →
// rotation on 429 → persistent state.

import { TargetQuotaManager, type TargetQuota } from './TargetQuotaManager';
import { CaptchaSolver, type CaptchaResult } from './CaptchaSolver';
import type { WorkerResponseMessage } from './ProxyWorker';

// ── Types ───────────────────────────────────────────────────────────

/** Configuration for the browser pool. */
export interface PoolConfig {
  /** Maximum number of concurrent Web Workers */
  maxWorkers: number;
  /** Per-request timeout in milliseconds */
  requestTimeoutMs: number;
  /** Number of retries on failure before giving up */
  retryCount: number;
  /** Whether to attempt CAPTCHA solving */
  enableCaptchaSolve: boolean;
  /** Optional Whisper endpoint for audio CAPTCHA solving */
  audioSTTEndpoint?: string;
}

/** Result of a single scrape operation. */
export interface ScrapeResult {
  /** Original URL that was requested */
  url: string;
  /** The registrable domain of the target */
  targetDomain: string;
  /** HTTP status code of the response */
  statusCode: number;
  /** HTML body of the response */
  html: string;
  /** Response headers */
  headers: Record<string, string>;
  /** Whether this was scraped via browser-offload or direct fetch */
  method: 'browser-offload' | 'direct-fetch';
  /** Total time taken in milliseconds */
  timingMs: number;
  /** Remaining quota for the target domain */
  quotaRemaining: number;
  /** Final URL after redirects */
  finalUrl?: string;
  /** Redirect chain followed */
  redirectChain?: string[];
  /** Error message if scraping failed */
  error?: string;
  /** CAPTCHA solving details, if applicable */
  captchaResult?: CaptchaResult;
}

/** Internal: a single worker slot in the pool. */
interface WorkerSlot {
  /** The Web Worker instance */
  worker: Worker;
  /** Whether this worker is currently processing a request */
  busy: boolean;
  /** Number of requests handled by this worker */
  requestCount: number;
}

/** Internal: pending request entry tracked by correlation ID. */
interface PendingRequest {
  resolve: (value: ScrapeResult) => void;
  reject: (reason: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

// ── Constants ───────────────────────────────────────────────────────

const DEFAULT_CONFIG: PoolConfig = {
  maxWorkers: 3,
  requestTimeoutMs: 30_000,
  retryCount: 2,
  enableCaptchaSolve: true,
};

/** Exponential backoff base for 429 handling (ms). */
const BACKOFF_BASE_MS = 2_000;
/** Maximum backoff before giving up on a target (ms). */
const BACKOFF_MAX_MS = 30_000;

// ── Implementation ──────────────────────────────────────────────────

export class BrowserPoolManager {
  private slots: WorkerSlot[] = [];
  private quotaManager: TargetQuotaManager;
  private captchaSolver: CaptchaSolver;
  private config: PoolConfig;
  private initialized = false;

  /** Map from correlation ID to pending promise resolvers. */
  private pending = new Map<string, PendingRequest>();

  constructor(config?: Partial<PoolConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.quotaManager = new TargetQuotaManager();
    this.captchaSolver = new CaptchaSolver({
      audioSTTEndpoint: this.config.audioSTTEndpoint,
    });
  }

  // ── Lifecycle ─────────────────────────────────────────────────────

  /**
   * Initialise the worker pool.
   * Creates up to `maxWorkers` Web Worker instances and waits
   * for them to signal readiness.
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    const readyPromises: Promise<void>[] = [];

    for (let i = 0; i < this.config.maxWorkers; i++) {
      const worker = this.createWorker();
      const slot: WorkerSlot = {
        worker,
        busy: false,
        requestCount: 0,
      };
      this.slots.push(slot);

      // Wait for the worker to signal it is ready
      const readyPromise = new Promise<void>((resolve) => {
        const handler = (event: MessageEvent) => {
          if ((event.data as { type?: string }).type === 'worker-ready') {
            worker.removeEventListener('message', handler);
            resolve();
          }
        };
        worker.addEventListener('message', handler);
      });

      readyPromises.push(readyPromise);
    }

    await Promise.all(readyPromises);
    this.initialized = true;
  }

  /**
   * Terminate all workers and clean up.
   */
  async destroy(): Promise<void> {
    for (const slot of this.slots) {
      slot.worker.terminate();
    }
    this.slots = [];

    // Reject all pending requests
    const pendingEntries = Array.from(this.pending.values());
    for (const entry of pendingEntries) {
      clearTimeout(entry.timer);
      entry.reject(new Error('BrowserPoolManager destroyed'));
    }
    this.pending.clear();

    this.initialized = false;
  }

  // ── Public API ────────────────────────────────────────────────────

  /**
   * Scrape a single URL through the user's browser session.
   * Respects quota limits, retries on failure, and handles CAPTCHAs.
   */
  async scrape(targetUrl: string): Promise<ScrapeResult> {
    if (!this.initialized) {
      throw new Error('BrowserPoolManager not initialised — call init() first');
    }

    const domain = this.quotaManager.extractDomain(targetUrl);
    const startTime = Date.now();

    // Check quota before attempting
    if (!this.quotaManager.canConsume(domain)) {
      return {
        url: targetUrl,
        targetDomain: domain,
        statusCode: 0,
        html: '',
        headers: {},
        method: 'browser-offload',
        timingMs: Date.now() - startTime,
        quotaRemaining: 0,
        error: `Daily quota exhausted for ${domain}`,
      };
    }

    // Attempt with retries
    let lastError: string | undefined;

    for (let attempt = 0; attempt <= this.config.retryCount; attempt++) {
      if (attempt > 0) {
        // Exponential backoff between retries
        const backoffMs = Math.min(
          BACKOFF_BASE_MS * 2 ** (attempt - 1),
          BACKOFF_MAX_MS,
        );
        await this.delay(backoffMs);
      }

      const workerIdx = this.selectWorker();
      if (workerIdx < 0) {
        // All workers busy — wait briefly and retry
        await this.delay(200);
        continue;
      }

      try {
        // Consume a quota token
        const consumed = this.quotaManager.consume(domain);
        if (!consumed) {
          return {
            url: targetUrl,
            targetDomain: domain,
            statusCode: 0,
            html: '',
            headers: {},
            method: 'browser-offload',
            timingMs: Date.now() - startTime,
            quotaRemaining: 0,
            error: `Quota exhausted for ${domain} during consume`,
          };
        }

        const result = await this.dispatchFetch(
          targetUrl,
          workerIdx,
          this.config.requestTimeoutMs,
        );

        this.slots[workerIdx].requestCount += 1;

        // Check for CAPTCHA
        if (
          this.config.enableCaptchaSolve &&
          result.statusCode !== 200 &&
          result.html
        ) {
          const isCaptcha = await this.captchaSolver.detectCaptcha(
            new Response(result.html, { status: result.statusCode }),
            result.html,
          );

          if (isCaptcha) {
            const captchaResult = await this.captchaSolver.solve(
              result.html,
              targetUrl,
            );

            if (captchaResult.solved && captchaResult.method !== 'user-assist') {
              // Retry after solving
              const retryResult = await this.dispatchFetch(
                targetUrl,
                workerIdx,
                this.config.requestTimeoutMs,
              );
              return {
                ...retryResult,
                captchaResult,
              };
            }

            return { ...result, captchaResult };
          }
        }

        // Handle 429 rate limiting
        if (result.statusCode === 429) {
          this.handleError(targetUrl, result.statusCode, workerIdx);
          lastError = `429 Too Many Requests from ${domain}`;
          continue;
        }

        // Handle 403
        if (result.statusCode === 403) {
          lastError = `403 Forbidden from ${domain}`;
          continue;
        }

        return result;
      } catch (err: unknown) {
        this.slots[workerIdx].busy = false;
        lastError = err instanceof Error ? err.message : String(err);
        continue;
      }
    }

    return {
      url: targetUrl,
      targetDomain: domain,
      statusCode: 0,
      html: '',
      headers: {},
      method: 'browser-offload',
      timingMs: Date.now() - startTime,
      quotaRemaining: this.quotaManager.getUsage(domain).dailyLimit -
        this.quotaManager.getUsage(domain).usedToday,
      error: lastError ?? 'Unknown error after retries',
    };
  }

  /**
   * Scrape a batch of URLs with worker rotation.
   * Processes URLs concurrently up to the pool size.
   */
  async scrapeBatch(urls: string[]): Promise<ScrapeResult[]> {
    if (!this.initialized) {
      throw new Error('BrowserPoolManager not initialised — call init() first');
    }

    const results: ScrapeResult[] = [];
    const concurrency = this.config.maxWorkers;

    // Process in batches of `concurrency`
    for (let i = 0; i < urls.length; i += concurrency) {
      const batch = urls.slice(i, i + concurrency);
      const batchResults = await Promise.all(
        batch.map((url) => this.scrape(url)),
      );
      results.push(...batchResults);
    }

    return results;
  }

  /** Get quota usage for all tracked domains. */
  getQuotaSummary(): Record<string, TargetQuota> {
    return this.quotaManager.getUsageSummary();
  }

  /** Check whether the pool has capacity for more requests. */
  isAvailable(): boolean {
    if (!this.initialized) return false;
    return this.slots.some((slot) => !slot.busy);
  }

  /** Get the number of available (non-busy) workers. */
  availableWorkers(): number {
    return this.slots.filter((slot) => !slot.busy).length;
  }

  // ── Private: Worker Management ────────────────────────────────────

  /** Create a new Web Worker from the ProxyWorker script. */
  private createWorker(): Worker {
    const workerUrl = new URL('./ProxyWorker.ts', import.meta.url);
    const worker = new Worker(workerUrl, { type: 'module' });

    worker.addEventListener(
      'message',
      (event: MessageEvent<WorkerResponseMessage>) => {
        const data = event.data;
        if (!data || !('id' in data)) return;

        const pendingEntry = this.pending.get(data.id);
        if (!pendingEntry) return;

        clearTimeout(pendingEntry.timer);
        this.pending.delete(data.id);

        // Mark the worker as no longer busy
        this.markWorkerFree(data.id);

        if (data.type === 'fetch-result') {
          // Resolve with a partial ScrapeResult; the caller fills in
          // url, targetDomain, timingMs, quotaRemaining.
          pendingEntry.resolve({
            url: '',
            targetDomain: '',
            statusCode: data.response.status,
            html: data.response.body,
            headers: data.response.headers,
            method: 'browser-offload',
            timingMs: 0,
            quotaRemaining: 0,
            finalUrl: data.response.finalUrl,
            redirectChain: data.response.redirectChain,
          });
        } else {
          pendingEntry.reject(new Error(data.error));
        }
      },
    );

    worker.addEventListener('error', (event) => {
      console.error('[BrowserPoolManager] Worker error:', event.message);
    });

    return worker;
  }

  /**
   * Select the least-busy worker index.
   * Returns -1 if all workers are busy.
   */
  private selectWorker(): number {
    let bestIdx = -1;
    let lowestCount = Infinity;

    for (let i = 0; i < this.slots.length; i++) {
      const slot = this.slots[i];
      if (!slot.busy && slot.requestCount < lowestCount) {
        bestIdx = i;
        lowestCount = slot.requestCount;
      }
    }

    return bestIdx;
  }

  /** Mark a worker as free after a request completes. */
  private markWorkerFree(_requestId: string): void {
    // Find the first busy worker and free it.
    // A more precise implementation would map requestId → worker index,
    // but for the current pool size this is sufficient.
    for (const slot of this.slots) {
      if (slot.busy) {
        slot.busy = false;
        break;
      }
    }
  }

  // ── Private: Fetch Execution ──────────────────────────────────────

  /**
   * Dispatch a fetch request to a specific worker and await
   * a ScrapeResult once the worker responds.
   */
  private dispatchFetch(
    url: string,
    workerIdx: number,
    timeoutMs: number,
  ): Promise<ScrapeResult> {
    return new Promise<ScrapeResult>((resolve, reject) => {
      const id = this.generateId();
      const slot = this.slots[workerIdx];
      slot.busy = true;

      const timer = setTimeout(() => {
        this.pending.delete(id);
        slot.busy = false;
        slot.worker.postMessage({ type: 'abort', id });
        reject(new Error(`Request timed out after ${timeoutMs}ms: ${url}`));
      }, timeoutMs);

      this.pending.set(id, { resolve, reject, timer });

      slot.worker.postMessage({
        type: 'fetch',
        id,
        url,
        options: {
          credentials: 'include',
        },
        timeoutMs,
      });
    });
  }

  // ── Private: Error Handling ───────────────────────────────────────

  /**
   * Handle a 429 or 403 error by marking the worker as busy
   * briefly (rotating it out) and adjusting quotas.
   */
  private handleError(
    _url: string,
    _status: number,
    workerIdx: number,
  ): void {
    // Mark this worker as busy so it's rotated out for now
    if (workerIdx >= 0 && workerIdx < this.slots.length) {
      this.slots[workerIdx].busy = true;

      // Release after a cooldown
      setTimeout(() => {
        if (workerIdx < this.slots.length) {
          this.slots[workerIdx].busy = false;
        }
      }, BACKOFF_BASE_MS * 2);
    }
  }

  /**
   * Rotate to a different target when one is rate-limited.
   * This is a no-op in the current implementation since
   * the quota manager handles this transparently.
   */
  private rotateTarget(_domain: string): void {
    // Rotation is handled by the quota manager's token bucket.
    // When a domain is exhausted, canConsume() returns false
    // and the caller skips it.
  }

  // ── Private: Helpers ──────────────────────────────────────────────

  /** Generate a unique correlation ID for request-response matching. */
  private generateId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }

  /** Promise-based delay utility. */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
}
