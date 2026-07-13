// services/crawler/pipeline/L5-fingerprint.ts
// ── L5 Fingerprint: Site fingerprint detection (PROBE) ─────────────
//
// Runs on a small probe sample BEFORE L1 crawls the full site.
// Probe sample: robots.txt + homepage + 10 random pages + sitemap sample
// Every later layer reads fingerprint.{industry, language, cms, stack,
//   size, intent, geography} and uses it to gate metrics, pick scrapers,
//   pick schemas, pick actions.

import type { CrawlConfig } from '@seesby/types';
import type { FingerprintResult as HpFingerprintResult } from '@seesby/fingerprint';
import { runFingerprint } from '@seesby/fingerprint';
import type { ProbeContext } from '@seesby/fingerprint';
import type { DiscoveryResult } from './L0-discovery';

// ── Re-export the FingerprintResult from @seesby/fingerprint ─────
export type { HpFingerprintResult as FingerprintResult };

// ── Probe Configuration ─────────────────────────────────────────────

const PROBE_SAMPLE_SIZE = 12; // Total pages to probe

interface ProbePage {
  url: string;
  html: string;
  headers: Record<string, string>;
}

// ── Main Entry ──────────────────────────────────────────────────────

/**
 * Detect the site fingerprint on a small probe sample.
 * This MUST run before L1 (full crawl) so every later layer can use
 * the fingerprint to gate metrics, pick scrapers, and pick schemas.
 *
 * Probe sample includes:
 * 1. robots.txt
 * 2. Homepage
 * 3. Up to 10 random pages from L0 discovery
 * 4. Sitemap sample (if available)
 */
export async function detectFingerprint(
  config: CrawlConfig,
  discovery?: DiscoveryResult | null,
): Promise<HpFingerprintResult> {
  const hostname = extractHostname(config.url);

  // Build the probe sample
  const probePages = await buildProbeSample(config, discovery);

  // Build ProbeContext for the fingerprint engine
  const ctx: ProbeContext = {
    projectId: config.projectId ?? 'unknown',
    hostname,
    htmlSamples: probePages.map((p) => ({
      url: p.url,
      html: p.html,
      headers: p.headers,
    })),
    headers: probePages[0]?.headers ?? {},
    now: new Date(),
    connections: {
      gsc: config.connections?.gsc ?? false,
      ga4: config.connections?.ga4 ?? false,
      gbp: config.connections?.gbp ?? false,
      bing: config.connections?.bing ?? false,
      backlinks: config.connections?.backlinks ?? false,
    },
  };

  // Run the existing fingerprint probe with full cascade detection
  const result = await runFingerprint({ ctx });

  // Enhance the result with probe metadata
  return {
    ...result,
    size: {
      urls: {
        value: discovery?.totalUrls ?? probePages.length,
        confidence: discovery ? 0.9 : 0.3,
        source: {
          tier: discovery ? 'T1' : 'T8',
          provider: discovery ? 'l0.discovery' : 'l5.probe.estimate',
          observedAt: new Date().toISOString(),
          tags: ['source'],
        },
      },
    },
    probedAt: new Date().toISOString(),
  };
}

// ── Probe Sample Builder ────────────────────────────────────────────

async function buildProbeSample(
  config: CrawlConfig,
  discovery?: DiscoveryResult | null,
): Promise<ProbePage[]> {
  const baseUrl = normalizeBaseUrl(config.url);
  const probePages: ProbePage[] = [];

  // 1. robots.txt
  const robotsPage = await probeFetch(`${baseUrl}/robots.txt`);
  if (robotsPage) probePages.push(robotsPage);

  // 2. Homepage
  const homepage = await probeFetch(baseUrl);
  if (homepage) probePages.push(homepage);

  // 3. Random pages from discovery (up to 10)
  if (discovery?.urls && discovery.urls.length > 0) {
    const randomUrls = pickRandom(discovery.urls, 10, baseUrl);
    for (const url of randomUrls) {
      if (probePages.length >= PROBE_SAMPLE_SIZE) break;
      const page = await probeFetch(url);
      if (page) probePages.push(page);
    }
  }

  // 4. Sitemap sample
  if (discovery?.sitemapUrls && discovery.sitemapUrls.length > 0) {
    for (const sitemapUrl of discovery.sitemapUrls.slice(0, 2)) {
      if (probePages.length >= PROBE_SAMPLE_SIZE) break;
      const page = await probeFetch(sitemapUrl);
      if (page) probePages.push(page);
    }
  }

  return probePages;
}

async function probeFetch(url: string): Promise<ProbePage | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'SeesbyBot/1.0 (+https://seesby.dev)',
        'Accept': 'text/html,application/xhtml+xml,text/plain,*/*;q=0.8',
      },
    });
    clearTimeout(timer);

    if (!response.ok) return null;

    const html = await response.text();
    const headers: Record<string, string> = {};
    response.headers.forEach((v, k) => { headers[k] = v; });

    return { url, html, headers };
  } catch {
    return null;
  }
}

// ── Helpers ─────────────────────────────────────────────────────────

function normalizeBaseUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.hostname}`;
  } catch {
    return `https://${url}`;
  }
}

function extractHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function pickRandom<T>(arr: T[], count: number, exclude?: T): T[] {
  const filtered = exclude ? arr.filter((item) => item !== exclude) : [...arr];
  const shuffled = filtered.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
