// services/jobs/jobs/SerpScrapeJob.ts
// ── Weekly SERP Scrape ───────────────────────────────────────────
//
// Scrapes search engine results pages for tracked keywords to detect
// SERP features, cannibalization, and opportunity scores.

import { BackgroundMetricsStore } from '../BackgroundMetricsStore';
import { crawlDb } from '../../CrawlDatabase';
import { UrlNormalization } from '../../UrlNormalization';

/** SERP features detected from Google results */
interface SerpFeatures {
  featuredSnippet: boolean;
  peopleAlsoAsk: boolean;
  videoCarousel: boolean;
  newsCarousel: boolean;
  localPack: boolean;
  shoppingCarousel: boolean;
  imagePack: boolean;
  knowledgePanel: boolean;
  siteLinks: boolean;
}

/** A single SERP result entry */
interface SerpResult {
  position: number;
  url: string;
  title: string;
  isOwnDomain: boolean;
}

/**
 * Weekly SERP scrape for tracked keywords.
 *
 * Schedule: `0 4 * * 1` (every Monday at 04:00 UTC)
 * Background metric: `b.serp.scrape`
 */
export class SerpScrapeJob {
  /** Max concurrent scrapes */
  private static readonly MAX_CONCURRENT = 5;
  /** Delay between requests to avoid rate limiting (ms) */
  private static readonly REQUEST_DELAY_MS = 2000;

  async run(): Promise<void> {
    console.log('[SerpScrapeJob] Starting weekly SERP scrape...');

    // 1. Get all tracked keywords from crawl sessions
    const keywords = await this.getTrackedKeywords();

    if (keywords.length === 0) {
      console.log('[SerpScrapeJob] No tracked keywords found');
      BackgroundMetricsStore.record('b.serp.scrape', { keywords: 0 });
      return;
    }

    let totalScraped = 0;
    let totalCannibalization = 0;
    const cannibalizationPairs: Array<{ keyword: string; urls: string[] }> = [];

    // 2. Scrape SERP for each keyword with rate limiting
    const batchSize = SerpScrapeJob.MAX_CONCURRENT;
    for (let i = 0; i < keywords.length; i += batchSize) {
      const batch = keywords.slice(i, i + batchSize);

      const results = await Promise.all(
        batch.map(async ({ keyword, domain, sessionId }) => {
          await this.rateLimit();
          return this.scrapeSerp(keyword, domain, sessionId);
        })
      );

      for (const result of results) {
        if (result) {
          totalScraped++;

          // 5. Detect cannibalization: 2+ pages from same domain in top 20
          if (result.ownDomainResults.length >= 2) {
            totalCannibalization++;
            cannibalizationPairs.push({
              keyword: result.keyword,
              urls: result.ownDomainResults.map(r => r.url),
            });
          }

          // 4. Compute opportunity score
          await this.updateOpportunityScore(result);
        }
      }
    }

    // 6. Persist cannibalization findings
    if (cannibalizationPairs.length > 0) {
      await this.persistCannibalization(cannibalizationPairs);
    }

    BackgroundMetricsStore.record('b.serp.scrape', {
      keywords: keywords.length,
      scraped: totalScraped,
      cannibalization: totalCannibalization,
    });

    console.log(`[SerpScrapeJob] Completed: ${totalScraped} keywords scraped, ${totalCannibalization} cannibalization cases`);
  }

  /** Get tracked keywords from all crawl sessions */
  private async getTrackedKeywords(): Promise<Array<{ keyword: string; domain: string; sessionId: string }>> {
    const keywords: Array<{ keyword: string; domain: string; sessionId: string }> = [];

    try {
      // Get keywords from GSC query data stored in the DB
      const sessions = await crawlDb.sessions.toArray();
      for (const session of sessions) {
        if (!session.startUrl) continue;
        try {
          const domain = new URL(session.startUrl).hostname.replace(/^www\./, '');

          // Get top queries for this session
          const queries = await crawlDb.queries
            .where('crawlId').equals(session.id)
            .toArray();

          // Deduplicate and take top 50 per session
          const seen = new Set<string>();
          for (const q of queries) {
            if (!q.query || seen.has(q.query.toLowerCase())) continue;
            seen.add(q.query.toLowerCase());
            keywords.push({ keyword: q.query, domain, sessionId: session.id });
          }
        } catch { /* skip session */ }
      }
    } catch (err) {
      console.error('[SerpScrapeJob] Failed to get tracked keywords:', err);
    }

    return keywords.slice(0, 500); // cap at 500 keywords per run
  }

  /** Simple rate limiter */
  private lastRequestTime = 0;
  private async rateLimit(): Promise<void> {
    const elapsed = Date.now() - this.lastRequestTime;
    if (elapsed < SerpScrapeJob.REQUEST_DELAY_MS) {
      await new Promise(r => setTimeout(r, SerpScrapeJob.REQUEST_DELAY_MS - elapsed));
    }
    this.lastRequestTime = Date.now();
  }

  /**
   * Scrape SERP for a keyword and extract features + own-domain positions.
   * Uses Ghost Bridge proxy to avoid CORS issues.
   */
  private async scrapeSerp(
    keyword: string,
    domain: string,
    sessionId: string,
  ): Promise<{
    keyword: string;
    features: SerpFeatures;
    ownDomainResults: SerpResult[];
    allResults: SerpResult[];
  } | null> {
    try {
      // Use Ghost Bridge for SERP fetching
      const bridgeUrl = (import.meta as any).env?.VITE_GHOST_BRIDGE_URL;
      const serpUrl = `https://www.google.com/search?q=${encodeURIComponent(keyword)}&hl=en&num=20`;
      const targetUrl = bridgeUrl
        ? `${bridgeUrl.replace(/\/$/, '')}/?url=${encodeURIComponent(serpUrl)}`
        : serpUrl;

      const response = await fetch(targetUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Seesby-Serp/1.0' },
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) return null;

      const html = await response.text();

      // 3. Extract SERP features from HTML
      const features = this.extractSerpFeatures(html);

      // Parse organic results
      const allResults = this.parseSerpResults(html, domain);
      const ownDomainResults = allResults.filter(r => r.isOwnDomain);

      // Store SERP features for this keyword
      await this.storeSerpFeatures(sessionId, keyword, features, ownDomainResults);

      return { keyword, features, ownDomainResults, allResults };
    } catch (err: any) {
      console.error(`[SerpScrapeJob] Failed to scrape "${keyword}":`, err.message);
      return null;
    }
  }

  /** Extract SERP features from Google HTML */
  private extractSerpFeatures(html: string): SerpFeatures {
    const lower = html.toLowerCase();
    return {
      featuredSnippet: lower.includes('class="g') && (lower.includes('kp-whp') || lower.includes('mod-data')),
      peopleAlsoAsk: lower.includes('related-question') || lower.includes('jscontroller="cXDN') ,
      videoCarousel: lower.includes('video-card') || lower.includes('class="vrd') || lower.includes('g-img.videobox'),
      newsCarousel: lower.includes('class="So9e3d') || lower.includes('top-stories'),
      localPack: lower.includes('class="rlfl__ol') || lower.includes('local-pack') || lower.includes('data-section-id="lcl-'),
      shoppingCarousel: lower.includes('class="sh-nr') || lower.includes('shopping-results'),
      imagePack: lower.includes('class="IS3QEc') || lower.includes('images-card'),
      knowledgePanel: lower.includes('class="kp-box') || lower.includes('knowledge-panel'),
      siteLinks: lower.includes('class="zlDVob') || lower.includes('sitelinks'),
    };
  }

  /** Parse organic SERP results from Google HTML */
  private parseSerpResults(html: string, ownDomain: string): SerpResult[] {
    const results: SerpResult[] = [];
    try {
      const doc = new DOMParser().parseFromString(html, 'text/html');

      // Parse organic results — Google uses div.g or div[data-sokoban-container]
      const resultDivs = doc.querySelectorAll('div.g, div[data-sokoban-container] > div');

      let position = 0;
      for (const div of resultDivs) {
        const link = div.querySelector('a[href]');
        if (!link) continue;
        const href = (link as HTMLAnchorElement).getAttribute('href');
        if (!href || !href.startsWith('http')) continue;

        position++;
        const title = div.querySelector('h3')?.textContent || '';
        const urlHost = (() => { try { return new URL(href).hostname.replace(/^www\./, ''); } catch { return ''; } })();

        results.push({
          position,
          url: href,
          title,
          isOwnDomain: urlHost === ownDomain,
        });
      }
    } catch {
      // Fallback: regex-based parsing
      const linkPattern = /<a[^>]*href="(https?:\/\/(?!www\.google\.|accounts\.google\.|support\.google\.)[^"]+)"[^>]*>[\s\S]*?<h3[^>]*>(.*?)<\/h3>/gi;
      let match;
      let position = 0;
      while ((match = linkPattern.exec(html)) !== null) {
        position++;
        const href = match[1];
        const title = match[2].replace(/<[^>]+>/g, '');
        const urlHost = (() => { try { return new URL(href).hostname.replace(/^www\./, ''); } catch { return ''; } })();
        results.push({
          position,
          url: href,
          title,
          isOwnDomain: urlHost === ownDomain,
        });
      }
    }
    return results;
  }

  /** Store SERP features in the page query data */
  private async storeSerpFeatures(
    sessionId: string,
    keyword: string,
    features: SerpFeatures,
    ownResults: SerpResult[],
  ): Promise<void> {
    // Update pages that rank for this keyword with SERP feature data
    for (const result of ownResults) {
      try {
        const page = await crawlDb.pages.get(result.url);
        if (page && page.crawlId === sessionId) {
          await crawlDb.pages.update(result.url, {
            hasFeaturedSnippetPatterns: features.featuredSnippet,
            answerBoxReady: features.featuredSnippet,
            // Store SERP position from scrape
            expectedCtr: features.featuredSnippet ? 0.35 : undefined,
          } as any);
        }
      } catch { /* skip */ }
    }
  }

  /** Compute and update opportunity score for a keyword */
  private async updateOpportunityScore(result: {
    keyword: string;
    features: SerpFeatures;
    ownDomainResults: SerpResult[];
    allResults: SerpResult[];
  }): Promise<void> {
    // Opportunity score: higher when SERP has fewer features and own domain is close to top
    const featureCount = Object.values(result.features).filter(Boolean).length;
    const bestPosition = result.ownDomainResults[0]?.position ?? 50;
    const opportunityScore = Math.max(0, Math.min(100,
      (20 - bestPosition) * 3 + (10 - featureCount) * 5
    ));

    // Update opportunity score on the best-ranking own-domain page
    const bestOwn = result.ownDomainResults[0];
    if (bestOwn) {
      try {
        await crawlDb.pages.update(bestOwn.url, {
          opportunityScore,
        });
      } catch { /* skip if page not in DB */ }
    }
  }

  /** Persist cannibalization pairs to the database */
  private async persistCannibalization(
    pairs: Array<{ keyword: string; urls: string[] }>,
  ): Promise<void> {
    // Flag pages that are cannibalizing each other
    for (const pair of pairs) {
      for (const url of pair.urls) {
        try {
          await crawlDb.pages.update(url, {
            // Mark as potentially cannibalizing
            closestSemanticAddress: pair.urls.find(u => u !== url) || null,
          } as any);
        } catch { /* skip */ }
      }
    }
  }
}
