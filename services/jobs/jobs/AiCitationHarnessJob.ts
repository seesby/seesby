// services/jobs/jobs/AiCitationHarnessJob.ts
// ── Weekly AI Citation Harness ───────────────────────────────────
//
// Tests how often the site appears in AI-generated answers across
// multiple AI engines (OpenAI, Claude, Gemini, Perplexity, Bing).
// This measures the site's "AI visibility" — a growing channel for traffic.

import { BackgroundMetricsStore } from '../BackgroundMetricsStore';
import { crawlDb, getHtmlPages } from '../../CrawlDatabase';
import { UrlNormalization } from '../../UrlNormalization';

/** AI engine identifiers */
type AIEngine = 'openai' | 'anthropic' | 'gemini' | 'perplexity' | 'bing';

/** Citation result for a single page × engine combination */
interface CitationResult {
  engine: AIEngine;
  cited: boolean;
  citationPosition: number | null; // 1st, 2nd, 3rd citation
  responseExcerpt: string | null;
}

/**
 * Weekly AI citation analysis harness.
 *
 * Schedule: `0 5 * * 2` (every Tuesday at 05:00 UTC)
 * Background metric: `b.ai.harness`
 */
export class AiCitationHarnessJob {
  /** Max pages to test per run (to stay within API budgets) */
  private static readonly MAX_PAGES = 150;
  /** Engines to test */
  private static readonly ENGINES: AIEngine[] = ['openai', 'anthropic', 'gemini', 'perplexity', 'bing'];

  async run(): Promise<void> {
    console.log('[AiCitationHarnessJob] Starting weekly AI citation harness...');

    // 1. Select page sample: top 100 by traffic + 50 random
    const samplePages = await this.selectPageSample();

    if (samplePages.length === 0) {
      console.log('[AiCitationHarnessJob] No pages to test');
      BackgroundMetricsStore.record('b.ai.harness', { pages: 0 });
      return;
    }

    let totalCited = 0;
    const engineCitationRates: Record<string, number> = {};

    // 2. For each page, prompt all 5 AI engines
    for (const page of samplePages) {
      const results = await this.queryAllEngines(page);

      // 3. Parse responses for citations
      const citationResults = results.map(r => this.detectCitation(r, page));

      const anyCited = citationResults.some(r => r.cited);
      if (anyCited) totalCited++;

      // Aggregate per-engine citation counts
      for (const cr of citationResults) {
        if (cr.cited) {
          engineCitationRates[cr.engine] = (engineCitationRates[cr.engine] || 0) + 1;
        }
      }

      // 4. Update page with citation metrics
      await this.updatePageCitationMetrics(page, citationResults);
    }

    // 5. Compute overall citation rate
    const citationRate = samplePages.length > 0 ? totalCited / samplePages.length : 0;
    for (const engine of AiCitationHarnessJob.ENGINES) {
      engineCitationRates[engine] = engineCitationRates[engine]
        ? engineCitationRates[engine] / samplePages.length
        : 0;
    }

    // Persist timestamp
    BackgroundMetricsStore.record('b.ai.harness', {
      pages: samplePages.length,
      citationRate,
      engineRates: engineCitationRates,
    });

    console.log(`[AiCitationHarnessJob] Completed: ${totalCited}/${samplePages.length} pages cited (${(citationRate * 100).toFixed(1)}% citation rate)`);
  }

  /** Select a sample of pages: top 100 by GSC traffic + 50 random */
  private async selectPageSample(): Promise<Array<{ url: string; title: string; mainKeyword: string | null }>> {
    try {
      const sessions = await crawlDb.sessions.toArray();
      const allPages: Array<{ url: string; title: string; mainKeyword: string | null; gscClicks: number }> = [];

      for (const session of sessions) {
        const pages = await getHtmlPages(session.id);
        for (const page of pages) {
          allPages.push({
            url: page.url,
            title: page.title || '',
            mainKeyword: page.mainKeyword || null,
            gscClicks: page.gscClicks || 0,
          });
        }
      }

      // Sort by GSC clicks (traffic) and take top 100
      const topByTraffic = [...allPages]
        .sort((a, b) => b.gscClicks - a.gscClicks)
        .slice(0, 100);

      // Take 50 random from the rest
      const remaining = allPages.filter(p => !topByTraffic.includes(p));
      const random50: typeof allPages = [];
      const shuffled = [...remaining].sort(() => Math.random() - 0.5);
      random50.push(...shuffled.slice(0, 50));

      return [...topByTraffic, ...random50].slice(0, AiCitationHarnessJob.MAX_PAGES);
    } catch (err) {
      console.error('[AiCitationHarnessJob] Failed to select page sample:', err);
      return [];
    }
  }

  /** Query all AI engines for a page */
  private async queryAllEngines(page: { url: string; title: string; mainKeyword: string | null }): Promise<Array<{ engine: AIEngine; response: string }>> {
    const query = this.buildQueryPrompt(page);

    const results = await Promise.allSettled(
      AiCitationHarnessJob.ENGINES.map(engine => this.queryEngine(engine, query))
    );

    return results
      .filter((r): r is PromiseFulfilledResult<{ engine: AIEngine; response: string }> => r.status === 'fulfilled')
      .map(r => r.value);
  }

  /** Build a query prompt for a page */
  private buildQueryPrompt(page: { url: string; title: string; mainKeyword: string | null }): string {
    const keyword = page.mainKeyword || page.title || new URL(page.url).pathname;
    return `What are the best resources for "${keyword}"? Please cite your sources with URLs.`;
  }

  /** Query a single AI engine */
  private async queryEngine(engine: AIEngine, query: string): Promise<{ engine: AIEngine; response: string }> {
    try {
      const response = await fetch(`/api/ai/citation-check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ engine, query }),
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) return { engine, response: '' };
      const data: any = await response.json();
      return { engine, response: data.response || data.text || '' };
    } catch (err) {
      console.error(`[AiCitationHarnessJob] ${engine} query failed:`, err);
      return { engine, response: '' };
    }
  }

  /** Detect if the page URL/domain/title appears in the AI response */
  private detectCitation(
    result: { engine: AIEngine; response: string },
    page: { url: string; title: string },
  ): CitationResult {
    const { response, engine } = result;
    if (!response) return { engine, cited: false, citationPosition: null, responseExcerpt: null };

    const lowerResponse = response.toLowerCase();
    let domain = '';
    let path = '';
    try {
      const parsed = new URL(page.url);
      domain = parsed.hostname.replace(/^www\./, '').toLowerCase();
      path = parsed.pathname.toLowerCase();
    } catch { /* skip */ }

    const titleLower = page.title.toLowerCase();

    // Check for URL, domain, or title mention
    const hasUrl = lowerResponse.includes(page.url.toLowerCase());
    const hasDomain = domain && lowerResponse.includes(domain);
    const hasTitle = titleLower.length > 10 && lowerResponse.includes(titleLower);

    const cited = hasUrl || hasDomain || hasTitle;

    // Find citation position (which citation number is ours?)
    let citationPosition: number | null = null;
    if (cited) {
      // Count URLs before our citation
      const urlPattern = /https?:\/\/[^\s<>"']+/gi;
      const allUrls = response.match(urlPattern) || [];
      const ownIdx = allUrls.findIndex(u =>
        u.toLowerCase().includes(domain) || u.toLowerCase() === page.url.toLowerCase()
      );
      citationPosition = ownIdx >= 0 ? ownIdx + 1 : null;
    }

    // Extract a short excerpt around the citation
    let responseExcerpt: string | null = null;
    if (cited) {
      const idx = lowerResponse.indexOf(domain || page.url.toLowerCase());
      if (idx >= 0) {
        const start = Math.max(0, idx - 50);
        const end = Math.min(response.length, idx + 100);
        responseExcerpt = response.slice(start, end).trim();
      }
    }

    return { engine, cited, citationPosition, responseExcerpt };
  }

  /** Update page with citation metrics */
  private async updatePageCitationMetrics(
    page: { url: string },
    results: CitationResult[],
  ): Promise<void> {
    const cited = results.filter(r => r.cited);
    const citationRate = cited.length / results.length;

    // Compute average citation position
    const positions = cited.map(r => r.citationPosition).filter((p): p is number => p !== null);
    const avgPosition = positions.length > 0
      ? positions.reduce((a, b) => a + b, 0) / positions.length
      : null;

    // Per-engine citation flags
    const engineFlags: Record<string, boolean> = {};
    for (const r of results) {
      engineFlags[r.engine] = r.cited;
    }

    try {
      await crawlDb.pages.update(page.url, {
        citationWorthiness: Math.round(citationRate * 100),
        aiOverviewFit: citationRate > 0.4 ? Math.round(citationRate * 100) : 0,
        industrySignals: {
          aiCitationEngines: engineFlags,
          avgCitationPosition: avgPosition,
        },
      } as any);
    } catch { /* skip if page not in DB */ }
  }
}
