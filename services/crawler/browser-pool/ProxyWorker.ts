// services/crawler/browser-pool/ProxyWorker.ts
// ── Web Worker: Proxies fetch() Through the User's Browser ─────────
//
// This file is a Web Worker script (not a standard ES module).
// It is loaded via `new Worker(new URL('./ProxyWorker.ts', import.meta.url))`.
//
// The worker:
//   1. Receives fetch requests via postMessage
//   2. Executes fetch() in the browser context (with the user's cookies)
//   3. Serialises the response body as text and posts it back
//   4. Enforces a configurable timeout (default 30 s)
//   5. Handles redirect chains transparently
//
// Posts back:
//   { type: 'fetch-result', id, response }  on success
//   { type: 'fetch-error',   id, error }   on failure

// ── Types ───────────────────────────────────────────────────────────

export interface WorkerFetchMessage {
  type: 'fetch';
  /** Unique ID that correlates request -> response */
  id: string;
  /** Target URL to fetch */
  url: string;
  /** Standard RequestInit options (minus body for GET) */
  options: RequestInit;
  /** Override timeout in ms (default 30 000) */
  timeoutMs?: number;
}

export interface WorkerAbortMessage {
  type: 'abort';
  /** Correlation ID of the in-flight request to cancel */
  id: string;
}

export type WorkerMessage = WorkerFetchMessage | WorkerAbortMessage;

export interface WorkerFetchResult {
  type: 'fetch-result';
  id: string;
  response: {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: string;
    finalUrl: string;
    redirectChain: string[];
  };
}

export interface WorkerFetchError {
  type: 'fetch-error';
  id: string;
  error: string;
  status?: number;
}

export type WorkerResponseMessage = WorkerFetchResult | WorkerFetchError;

// ── Implementation ──────────────────────────────────────────────────

const DEFAULT_TIMEOUT_MS = 30_000;
const MAX_REDIRECTS = 10;

/** Map of in-flight requests so they can be aborted. */
const pending = new Map<string, AbortController>();

/**
 * Execute a single fetch within the worker context.
 * Transparently follows redirects and serialises the body.
 */
async function executeFetch(
  id: string,
  url: string,
  options: RequestInit,
  timeoutMs: number,
): Promise<void> {
  const controller = new AbortController();
  pending.set(id, controller);

  const timer = window.setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  const redirectChain: string[] = [];
  let currentUrl = url;

  try {
    // Manual redirect following so we can capture the chain.
    let response: Response | undefined;
    let redirects = 0;

    while (redirects <= MAX_REDIRECTS) {
      response = await fetch(currentUrl, {
        ...options,
        signal: controller.signal,
        redirect: 'manual', // We handle redirects ourselves
      });

      if (
        response.status >= 300 &&
        response.status < 400 &&
        redirects < MAX_REDIRECTS
      ) {
        const location = response.headers.get('Location');
        if (!location) {
          break; // No Location header — treat as final response
        }

        redirectChain.push(currentUrl);

        // Resolve relative redirects against the current URL
        currentUrl = new URL(location, currentUrl).href;
        redirects += 1;
        continue;
      }

      break; // Non-redirect response
    }

    if (!response) {
      throw new Error('No response received after redirect chain');
    }

    // Collect response headers
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    // Read body as text
    const body = await response.text();

    const result: WorkerFetchResult = {
      type: 'fetch-result',
      id,
      response: {
        status: response.status,
        statusText: response.statusText,
        headers,
        body,
        finalUrl: currentUrl,
        redirectChain,
      },
    };

    self.postMessage(result);
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : String(err);

    // Distinguish abort from other errors
    const isAbort =
      err instanceof DOMException && err.name === 'AbortError';

    const result: WorkerFetchError = {
      type: 'fetch-error',
      id,
      error: isAbort ? `Timeout after ${timeoutMs}ms` : errorMessage,
      status: undefined,
    };

    self.postMessage(result);
  } finally {
    window.clearTimeout(timer);
    pending.delete(id);
  }
}

/**
 * Abort an in-flight request by its correlation ID.
 */
function abortFetch(id: string): void {
  const controller = pending.get(id);
  if (controller) {
    controller.abort();
    pending.delete(id);
  }
}

// ── Message Handler ─────────────────────────────────────────────────

self.addEventListener('message', (event: MessageEvent<WorkerMessage>) => {
  const msg = event.data;

  switch (msg.type) {
    case 'fetch': {
      executeFetch(
        msg.id,
        msg.url,
        msg.options ?? {},
        msg.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      );
      break;
    }

    case 'abort': {
      abortFetch(msg.id);
      break;
    }

    default: {
      // Unknown message type — ignore
      break;
    }
  }
});

// Signal that the worker is ready
self.postMessage({ type: 'worker-ready' } as const);
