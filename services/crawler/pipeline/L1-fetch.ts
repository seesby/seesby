// services/crawler/pipeline/L1-fetch.ts
// ── L1 Fetch: Fetch each URL's HTML content ─────────────────────────
//
// fastFetch -> browserRender decision logic:
// 1. Start with fastFetch (simple HTTP GET)
// 2. If JS-heavy markers detected, switch to browser render
// 3. If fingerprint.cms is JS-heavy, prefer browser render

import type { CrawlConfig } from '@seesby/types';
import type { FingerprintResult } from '@seesby/fingerprint';
import { BrowserPoolManager, type ScrapeResult } from '../browser-pool';

// ── Types ───────────────────────────────────────────────────────────

export type RenderMethod = 'fastFetch' | 'browserRender';

export interface FetchResult {
  url: string;
  finalUrl: string; // After redirects
  html: string;
  statusCode: number;
  headers: Record<string, string>;
  timingMs: number;
  renderMethod: RenderMethod;
  contentLength: number;
  contentType: string;
  redirectChain: string[];
  error?: string;
}

export interface FetchConfig {
  /** Force browser rendering for all pages */
  forceBrowserRender?: boolean;
  /** Force fast fetch for all pages */
  forceFastFetch?: boolean;
  /** Timeout for fast fetch in ms */
  fastFetchTimeoutMs?: number;
  /** Timeout for browser render in ms */
  browserRenderTimeoutMs?: number;
  /** Concurrency limit for fetching */
  concurrency?: number;
  /** User agent string */
  userAgent?: string;
}

// ── JS Framework Markers ────────────────────────────────────────────
// HTML markers that indicate a page is heavily JS-rendered

const JS_FRAMEWORK_MARKERS = [
  '__NEXT_DATA__',           // Next.js
  '__NUXT__',                // Nuxt.js
  '__GATSBY',                // Gatsby
  '__APP_DATA__',            // Remix / general SSR
  '__remixContext',          // Remix
  'root.__remixContext',     // Remix v2
  'window.__INITIAL_STATE__', // Various SSR frameworks
  'id="__svelte"',           // SvelteKit
  'data-reactroot',          // React (older)
  'data-reactroot',          // React
  'ng-app',                  // Angular
  'ng-version',              // Angular
  'id="app"',                // Generic SPA
  'id="root"',               // Generic SPA
];

const JS_HEAVY_CMS = new Set([
  'react',
  'nextjs-headless',
  'gatsby',
  'nuxt',
  'angular',
  'vue',
  'svelte',
]);

// ── Browser Pool (lazy singleton) ──────────────────────────────────

let _browserPool: BrowserPoolManager | null = null;

function getBrowserPool(config?: FetchConfig): BrowserPoolManager {
  if (!_browserPool) {
    _browserPool = new BrowserPoolManager({
      maxWorkers: config?.concurrency ?? 3,
      requestTimeoutMs: config?.browserRenderTimeoutMs ?? 30000,
      retryCount: 2,
      enableCaptchaSolve: true,
    });
  }
  return _browserPool;
}

export async function destroyBrowserPool(): Promise<void> {
  if (_browserPool) {
    await _browserPool.destroy();
    _browserPool = null;
  }
}

// ── Main Entry ──────────────────────────────────────────────────────

export async function fetchPage(
  url: string,
  config: CrawlConfig,
  fingerprint?: FingerprintResult | null,
  fetchConfig?: FetchConfig,
): Promise<FetchResult> {
  const cfg: Required<FetchConfig> = {
    forceBrowserRender: false,
    forceFastFetch: false,
    fastFetchTimeoutMs: 10000,
    browserRenderTimeoutMs: 30000,
    concurrency: 10,
    userAgent: 'SeesbyBot/1.0 (+https://seesby.dev)',
    ...fetchConfig,
  };

  // Decision: fast fetch or browser render?
  const renderMethod = decideRenderMethod(url, config, fingerprint, cfg);

  if (renderMethod === 'fastFetch') {
    return await fastFetch(url, cfg);
  }

  // Use BrowserPoolManager for browser-offload rendering when available
  try {
    const pool = getBrowserPool(cfg);
    if (!pool.isAvailable()) {
      await pool.init();
    }
    const scrapeResult: ScrapeResult = await pool.scrape(url);
    return scrapeResultToFetchResult(scrapeResult, cfg);
  } catch {
    // Fallback to server-side browser render
    return await browserRender(url, cfg);
  }
}

/** Convert a BrowserPool ScrapeResult to a pipeline FetchResult. */
function scrapeResultToFetchResult(result: ScrapeResult, cfg: Required<FetchConfig>): FetchResult {
  return {
    url: result.url,
    finalUrl: result.finalUrl ?? result.url,
    html: result.html,
    statusCode: result.statusCode,
    headers: result.headers,
    timingMs: result.timingMs,
    renderMethod: 'browserRender',
    contentLength: result.html.length,
    contentType: result.headers['content-type'] ?? 'text/html',
    redirectChain: result.redirectChain ?? [],
    error: result.error,
  };
}

/**
 * Fetch a batch of URLs with concurrency control.
 */
export async function fetchPageBatch(
  urls: string[],
  config: CrawlConfig,
  fingerprint?: FingerprintResult | null,
  fetchConfig?: FetchConfig,
  onProgress?: (fetched: number, total: number, currentUrl: string) => void,
): Promise<FetchResult[]> {
  const cfg: Required<FetchConfig> = {
    forceBrowserRender: false,
    forceFastFetch: false,
    fastFetchTimeoutMs: 10000,
    browserRenderTimeoutMs: 30000,
    concurrency: 10,
    userAgent: 'SeesbyBot/1.0 (+https://seesby.dev)',
    ...fetchConfig,
  };

  const results: FetchResult[] = [];
  const concurrency = cfg.concurrency;
  let index = 0;
  let completed = 0;

  const worker = async () => {
    while (index < urls.length) {
      const i = index++;
      const url = urls[i];

      let result: FetchResult;
      try {
        result = await fetchPage(url, config, fingerprint, cfg);
      } catch (err: any) {
        result = {
          url,
          finalUrl: url,
          html: '',
          statusCode: 0,
          headers: {},
          timingMs: 0,
          renderMethod: 'fastFetch',
          contentLength: 0,
          contentType: 'text/html',
          redirectChain: [],
          error: err?.message ?? String(err),
        };
      }

      results.push(result);
      completed++;
      onProgress?.(completed, urls.length, url);
    }
  };

  // Launch worker pool
  const workers = Array.from({ length: Math.min(concurrency, urls.length) }, () => worker());
  await Promise.all(workers);

  return results;
}

// ── Render Method Decision ──────────────────────────────────────────

function decideRenderMethod(
  url: string,
  config: CrawlConfig,
  fingerprint?: FingerprintResult | null,
  fetchConfig?: FetchConfig,
): RenderMethod {
  // Config overrides
  if (fetchConfig?.forceBrowserRender) return 'browserRender';
  if (fetchConfig?.forceFastFetch) return 'fastFetch';
  if (config.forceRender === 'browser') return 'browserRender';
  if (config.forceRender === 'fast') return 'fastFetch';

  // CMS-based decision: known JS-heavy CMSes prefer browser render
  if (fingerprint?.cms?.value) {
    const stackKey = `cms:${fingerprint.cms.value}`;
    if (JS_HEAVY_CMS.has(fingerprint.cms.value)) {
      return 'browserRender';
    }
    // If the stack detector found client-side frameworks
    if (fingerprint.stack) {
      for (const [key, val] of Object.entries(fingerprint.stack)) {
        const frameworkName = (val as any)?.value;
        if (typeof frameworkName === 'string' && JS_HEAVY_CMS.has(frameworkName)) {
          return 'browserRender';
        }
      }
    }
  }

  // URL-based heuristics
  // Product pages and SPA-like paths often need rendering
  const path = new URL(url).pathname.toLowerCase();
  if (
    path.includes('/app') ||
    path.includes('/dashboard') ||
    path.includes('/search') ||
    path.includes('/results')
  ) {
    return 'browserRender';
  }

  // Default: fast fetch (will upgrade if content is thin)
  return 'fastFetch';
}

// ── Fast Fetch Implementation ───────────────────────────────────────

async function fastFetch(url: string, cfg: Required<FetchConfig>): Promise<FetchResult> {
  const t0 = performance.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), cfg.fastFetchTimeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': cfg.userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate',
      },
      redirect: 'follow',
    });

    const html = await response.text();
    const timingMs = Math.round(performance.now() - t0);

    // Check if the page is JS-rendered (thin content)
    const isThin = isContentThin(html);

    if (isThin) {
      // Re-fetch with browser render
      clearTimeout(timer);
      return await browserRender(url, cfg);
    }

    const headers: Record<string, string> = {};
    response.headers.forEach((v, k) => { headers[k] = v; });

    return {
      url,
      finalUrl: response.url ?? url,
      html,
      statusCode: response.status,
      headers,
      timingMs,
      renderMethod: 'fastFetch',
      contentLength: html.length,
      contentType: headers['content-type'] ?? 'text/html',
      redirectChain: [],
    };
  } catch (err: any) {
    const timingMs = Math.round(performance.now() - t0);
    return {
      url,
      finalUrl: url,
      html: '',
      statusCode: err?.name === 'AbortError' ? 408 : 0,
      headers: {},
      timingMs,
      renderMethod: 'fastFetch',
      contentLength: 0,
      contentType: '',
      redirectChain: [],
      error: err?.message ?? String(err),
    };
  } finally {
    clearTimeout(timer);
  }
}

// ── Browser Render Implementation ───────────────────────────────────

async function browserRender(url: string, cfg: Required<FetchConfig>): Promise<FetchResult> {
  const t0 = performance.now();

  try {
    // Use the backend browser rendering service
    const response = await fetch('/api/crawler/render', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url,
        timeoutMs: cfg.browserRenderTimeoutMs,
        userAgent: cfg.userAgent,
      }),
    });

    if (!response.ok) {
      throw new Error(`Browser render returned ${response.status}`);
    }

    const data: any = await response.json();
    const timingMs = Math.round(performance.now() - t0);

    return {
      url,
      finalUrl: data.finalUrl ?? url,
      html: data.html ?? '',
      statusCode: data.statusCode ?? 200,
      headers: data.headers ?? {},
      timingMs,
      renderMethod: 'browserRender',
      contentLength: (data.html ?? '').length,
      contentType: data.headers?.['content-type'] ?? 'text/html',
      redirectChain: data.redirectChain ?? [],
    };
  } catch (err: any) {
    const timingMs = Math.round(performance.now() - t0);
    return {
      url,
      finalUrl: url,
      html: '',
      statusCode: 0,
      headers: {},
      timingMs,
      renderMethod: 'browserRender',
      contentLength: 0,
      contentType: '',
      redirectChain: [],
      error: err?.message ?? String(err),
    };
  }
}

// ── Content Analysis ────────────────────────────────────────────────

/**
 * Detect if HTML content is mostly JavaScript (thin content).
 * Returns true when the visible text is likely empty or minimal
 * because the page relies on client-side rendering.
 */
function isContentThin(html: string): boolean {
  if (!html || html.length < 200) return true;

  // Check for JS framework markers
  for (const marker of JS_FRAMEWORK_MARKERS) {
    if (html.includes(marker)) {
      // Has JS framework marker - check if there's substantial static content
      const textContent = stripTags(html);
      const wordCount = textContent.split(/\s+/).filter(Boolean).length;

      // If the static text is very sparse, it's likely JS-rendered
      if (wordCount < 50) {
        return true;
      }
    }
  }

  // Strip scripts and check remaining text
  const withoutScripts = html.replace(/<script[\s\S]*?<\/script>/gi, '');
  const textContent = stripTags(withoutScripts);
  const wordCount = textContent.split(/\s+/).filter(Boolean).length;

  return wordCount < 30;
}

function stripTags(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z]+;/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
