// packages/types/src/crawl-config.ts
// ── Crawl Configuration ──────────────────────────────────────────────
// Central config type used by every pipeline layer (L0-L8) and the
// orchestrator. This is the single source of truth for crawl behavior.

import type { Mode } from './modes';

export interface CrawlConnections {
  gsc?: boolean;
  ga4?: boolean;
  backlinks?: boolean;
  bing?: boolean;
  psi?: boolean;
}

export interface CrawlConfig {
  /** Starting URL for the crawl */
  url: string;
  /** Crawl mode (fullAudit, technical, content, etc.) */
  mode?: Mode;
  /** Optional session ID for storage routing */
  sessionId?: string;
  /** Maximum pages to crawl (0 = unlimited) */
  maxUrls?: number;
  /** Maximum crawl depth */
  maxDepth?: number;
  /** Max concurrent requests */
  concurrency?: number;
  /** User agent string */
  userAgent?: string;
  /** Whether AI enrichment is enabled */
  aiEnabled?: boolean;
  /** Force render method */
  forceRender?: 'browser' | 'fast' | 'auto';
  /** External data source connections */
  connections?: CrawlConnections;
  /** User-provided seed URLs */
  seedUrls?: string[];
  /** Custom headers to include in fetch requests */
  headers?: Record<string, string>;
  /** URL patterns to exclude from crawling */
  excludePatterns?: string[];
  /** URL patterns to include (if set, only these are crawled) */
  includePatterns?: string[];
  /** Respect robots.txt */
  respectRobots?: boolean;
  /** Follow redirects */
  followRedirects?: boolean;
  /** Crawl delay in ms (politeness) */
  crawlDelayMs?: number;
  /** Boost mode (faster crawling, less politeness) */
  boostMode?: boolean;
  /** Schedule expression (e.g. "weekly", "daily") */
  schedule?: string;
  /** Custom metadata passthrough */
  [key: string]: unknown;
}
