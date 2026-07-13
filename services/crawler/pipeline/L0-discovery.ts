// services/crawler/pipeline/L0-discovery.ts
// ── L0 Discovery: Find all candidate URLs for the site ─────────────
//
// Sources: sitemaps, seed URLs, GSC pages, GA4 landing pages,
//          CommonCrawl, backlinks, archive.org

import type { CrawlConfig } from '@seesby/types';

// ── Types ───────────────────────────────────────────────────────────

export type DiscoverySource =
  | 'sitemap'
  | 'seed'
  | 'gsc'
  | 'ga4'
  | 'commoncrawl'
  | 'backlinks'
  | 'archive'
  | 'robots';

export interface DiscoveryResult {
  /** All unique URLs discovered, deduplicated and normalized */
  urls: string[];
  /** URLs grouped by discovery source */
  sources: Record<DiscoverySource, string[]>;
  /** Total unique URL count */
  totalUrls: number;
  /** Per-source stats */
  stats: {
    source: DiscoverySource;
    count: number;
    durationMs: number;
  }[];
  /** Robots.txt content if fetched */
  robotsTxt?: string;
  /** Sitemap URLs found in robots.txt */
  sitemapUrls: string[];
}

// ── Main entry ──────────────────────────────────────────────────────

export async function discoverUrls(config: CrawlConfig): Promise<DiscoveryResult> {
  const baseUrl = normalizeBaseUrl(config.url);
  const hostname = new URL(baseUrl).hostname;

  const sources: Record<DiscoverySource, string[]> = {
    sitemap: [],
    seed: [],
    gsc: [],
    ga4: [],
    commoncrawl: [],
    backlinks: [],
    archive: [],
    robots: [],
  };

  const stats: DiscoveryResult['stats'] = [];

  // Run all source discovery in parallel for speed
  const runSource = async <T>(
    source: DiscoverySource,
    fn: () => Promise<string[]>,
  ): Promise<void> => {
    const t0 = performance.now();
    try {
      sources[source] = await fn();
    } catch (err) {
      console.warn(`[L0] Source "${source}" failed:`, err);
      sources[source] = [];
    }
    stats.push({
      source,
      count: sources[source].length,
      durationMs: Math.round(performance.now() - t0),
    });
  };

  // All discovery sources run in parallel
  await Promise.all([
    // Sitemaps + robots.txt (must run first to get sitemap URLs for sitemap source)
    runSource('robots', async () => {
      const robotsTxt = await fetchRobotsTxt(baseUrl);
      // robots.txt parsing happens here, sitemaps are extracted
      return [robotsTxt ? `${baseUrl}/robots.txt` : ''];
    }),

    // Seed URLs (user-provided starting points)
    runSource('seed', async () => {
      return extractSeedUrls(config, baseUrl);
    }),

    // GSC pages
    runSource('gsc', async () => {
      if (!config.connections?.gsc) return [];
      return fetchGscPages(hostname, config);
    }),

    // GA4 landing pages
    runSource('ga4', async () => {
      if (!config.connections?.ga4) return [];
      return fetchGa4LandingPages(hostname, config);
    }),

    // CommonCrawl index
    runSource('commoncrawl', async () => {
      return fetchCommonCrawlUrls(hostname);
    }),

    // Backlink sources
    runSource('backlinks', async () => {
      if (!config.connections?.backlinks) return [];
      return fetchBacklinkUrls(hostname, config);
    }),

    // Archive.org (Wayback Machine)
    runSource('archive', async () => {
      return fetchArchiveUrls(hostname);
    }),
  ]);

  // Now run sitemap discovery (needs robots.txt results)
  const robotsResult = await fetchRobotsTxt(baseUrl);
  const sitemapUrlsFromRobots = parseSitemapUrls(robotsResult);
  let allSitemapUrls: string[] = [];

  // Fetch and parse all sitemaps found in robots.txt
  for (const sitemapUrl of sitemapUrlsFromRobots) {
    const urls = await fetchAndParseSitemap(sitemapUrl);
    allSitemapUrls = allSitemapUrls.concat(urls);
  }

  sources.sitemap = dedupeUrls(allSitemapUrls);
  stats.push({
    source: 'sitemap',
    count: sources.sitemap.length,
    durationMs: 0, // Already timed within the parallel runs
  });

  // Apply URL limit from config
  const maxUrls = config.maxUrls ?? 50000;

  // Merge all sources, deduplicate
  const allUrls: string[] = [];
  for (const sourceUrls of Object.values(sources)) {
    for (const url of sourceUrls) {
      if (!allUrls.includes(url) && allUrls.length < maxUrls) {
        allUrls.push(url);
      }
    }
  }

  return {
    urls: allUrls,
    sources,
    totalUrls: allUrls.length,
    stats,
    robotsTxt: robotsResult ?? undefined,
    sitemapUrls: sitemapUrlsFromRobots,
  };
}

// ── Source Implementations ──────────────────────────────────────────

async function fetchRobotsTxt(baseUrl: string): Promise<string | null> {
  try {
    const robotsUrl = new URL('/robots.txt', baseUrl).toString();
    const response = await fetchWithTimeout(robotsUrl, 5000);
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  }
}

function parseSitemapUrls(robotsTxt: string | null): string[] {
  if (!robotsTxt) return [];
  const urls: string[] = [];
  const lines = robotsTxt.split('\n');
  for (const line of lines) {
    const trimmed = line.trim().toLowerCase();
    if (trimmed.startsWith('sitemap:')) {
      const url = line.trim().slice(8).trim();
      if (url) urls.push(url);
    }
  }
  return urls;
}

async function fetchAndParseSitemap(sitemapUrl: string): Promise<string[]> {
  try {
    const response = await fetchWithTimeout(sitemapUrl, 10000);
    if (!response.ok) return [];

    const text = await response.text();

    // Check if this is a sitemap index file
    if (text.includes('<sitemapindex')) {
      return await parseSitemapIndex(text);
    }

    return parseSitemapUrlsFromXml(text);
  } catch {
    return [];
  }
}

async function parseSitemapIndex(xml: string): Promise<string[]> {
  const urls: string[] = [];
  const sitemapMatches = xml.matchAll(/<sitemap>\s*<loc>([^<]+)<\/loc>/gi);
  for (const match of sitemapMatches) {
    const sitemapUrl = match[1]?.trim();
    if (sitemapUrl) {
      const childUrls = await fetchAndParseSitemap(sitemapUrl);
      urls.push(...childUrls);
    }
  }
  return urls;
}

function parseSitemapUrlsFromXml(xml: string): string[] {
  const urls: string[] = [];
  const urlMatches = xml.matchAll(/<url>\s*<loc>([^<]+)<\/loc>/gi);
  for (const match of urlMatches) {
    const url = match[1]?.trim();
    if (url) urls.push(url);
  }
  return urls;
}

function extractSeedUrls(config: CrawlConfig, baseUrl: string): string[] {
  const seeds: string[] = [];

  // Base URL is always a seed
  seeds.push(baseUrl);

  // Config-provided seed URLs
  if (config.seedUrls) {
    for (const url of config.seedUrls) {
      seeds.push(normalizeUrl(url, baseUrl));
    }
  }

  // Add common high-value pages if not already included
  const commonPaths = ['/', '/blog', '/about', '/contact', '/sitemap.xml'];
  for (const path of commonPaths) {
    try {
      const url = new URL(path, baseUrl).toString();
      if (!seeds.includes(url)) seeds.push(url);
    } catch {
      // skip invalid URLs
    }
  }

  return dedupeUrls(seeds);
}

async function fetchGscPages(hostname: string, config: CrawlConfig): Promise<string[]> {
  // GSC integration: fetch top pages by impressions
  // In production this calls the GSC API via the backend connector
  // For now, return empty - the actual API call is handled by the connector layer
  try {
    const response = await fetch('/api/connectors/gsc/pages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hostname,
        startDate: getDateDaysAgo(28),
        endDate: getDateDaysAgo(3),
        rowLimit: 5000,
      }),
    });
    if (!response.ok) return [];
    const data = await response.json();
    return (data.pages ?? []).map((p: any) => p.url).filter(Boolean);
  } catch {
    return [];
  }
}

async function fetchGa4LandingPages(hostname: string, config: CrawlConfig): Promise<string[]> {
  try {
    const response = await fetch('/api/connectors/ga4/landing-pages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hostname,
        startDate: getDateDaysAgo(28),
        endDate: getDateDaysAgo(3),
        rowLimit: 5000,
      }),
    });
    if (!response.ok) return [];
    const data = await response.json();
    return (data.pages ?? []).map((p: any) => p.url).filter(Boolean);
  } catch {
    return [];
  }
}

async function fetchCommonCrawlUrls(hostname: string): Promise<string[]> {
  try {
    // Query CommonCrawl index for the domain
    const indexUrl = `https://index.commoncrawl.org/CC-MAIN-2024-42-index?url=${hostname}/*&output=json&limit=1000`;
    const response = await fetchWithTimeout(indexUrl, 15000);
    if (!response.ok) return [];

    const text = await response.text();
    const urls: string[] = [];
    for (const line of text.split('\n')) {
      if (!line.trim()) continue;
      try {
        const entry = JSON.parse(line);
        if (entry.url) urls.push(entry.url);
      } catch {
        // skip malformed lines
      }
    }
    return dedupeUrls(urls);
  } catch {
    return [];
  }
}

async function fetchBacklinkUrls(hostname: string, config: CrawlConfig): Promise<string[]> {
  try {
    const response = await fetch('/api/connectors/backlinks/pages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        domain: hostname,
        limit: 5000,
      }),
    });
    if (!response.ok) return [];
    const data = await response.json();
    return (data.pages ?? []).map((p: any) => p.url).filter(Boolean);
  } catch {
    return [];
  }
}

async function fetchArchiveUrls(hostname: string): Promise<string[]> {
  try {
    const cdxUrl = `https://web.archive.org/cdx/search/cdx?url=${hostname}/*&output=json&limit=1000&fl=timestamp,original&collapse=urlkey`;
    const response = await fetchWithTimeout(cdxUrl, 15000);
    if (!response.ok) return [];

    const data = await response.json();
    if (!Array.isArray(data) || data.length < 2) return [];

    // Skip header row (first element)
    const urls: string[] = [];
    for (let i = 1; i < data.length; i++) {
      const url = data[i]?.[1];
      if (url && isSameHost(url, hostname)) {
        urls.push(url);
      }
    }
    return dedupeUrls(urls);
  } catch {
    return [];
  }
}

// ── Utility Functions ───────────────────────────────────────────────

function normalizeBaseUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.hostname}`;
  } catch {
    return `https://${url}`;
  }
}

function normalizeUrl(url: string, baseUrl: string): string {
  try {
    return new URL(url, baseUrl).toString();
  } catch {
    return url;
  }
}

function dedupeUrls(urls: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const url of urls) {
    const normalized = normalizeUrlForDedupe(url);
    if (!seen.has(normalized)) {
      seen.add(normalized);
      result.push(url);
    }
  }
  return result;
}

function normalizeUrlForDedupe(url: string): string {
  try {
    const parsed = new URL(url);
    // Strip trailing slash, lowercase host
    let path = parsed.pathname.replace(/\/+$/, '') || '/';
    return `${parsed.hostname.toLowerCase()}${path.toLowerCase()}${parsed.search}`;
  } catch {
    return url.toLowerCase();
  }
}

function isSameHost(url: string, hostname: string): boolean {
  try {
    return new URL(url).hostname === hostname || new URL(url).hostname.endsWith(`.${hostname}`);
  } catch {
    return false;
  }
}

function getDateDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}
