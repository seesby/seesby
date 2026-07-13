// services/jobs/jobs/CruxMonthlyJob.ts
// ── Monthly CrUX Refresh ─────────────────────────────────────────
//
// Pulls Chrome User Experience Report data for all tracked URLs,
// updating Core Web Vitals metrics (LCP, INP, CLS) and recomputing
// the CWV quality bucket.

import { BackgroundMetricsStore } from '../BackgroundMetricsStore';
import { crawlDb, getHtmlPages } from '../../CrawlDatabase';

/** CrUX API response structure (simplified) */
interface CruxResponse {
  record?: {
    key?: { url?: string; formFactor?: string };
    metrics?: {
      LARGEST_CONTENTFUL_PAINT_MS?: { percentiles: { p75: number } };
      CUMULATIVE_LAYOUT_SHIFT_SCORE?: { percentiles: { p75: number } };
      INTERACTION_TO_NEXT_PAINT?: { percentiles: { p75: number } };
      FIRST_CONTENTFUL_PAINT_MS?: { percentiles: { p75: number } };
      EXPERIMENTAL_TIME_TO_FIRST_BYTE?: { percentiles: { p75: number } };
    };
  };
  error?: { message: string };
}

/** CWV bucket thresholds (per Google's spec) */
const CWV_THRESHOLDS = {
  lcp: { good: 2500, poor: 4000 },      // ms
  inp: { good: 200, poor: 500 },         // ms
  cls: { good: 0.1, poor: 0.25 },        // score
};

/**
 * Monthly Chrome UX Report data refresh.
 *
 * Schedule: `0 2 1 * *` (1st of each month at 02:00 UTC)
 * Background metric: `b.crux.monthly`
 */
export class CruxMonthlyJob {
  /** CrUX API endpoint */
  private static readonly CRUX_API = 'https://chromeuxreport.googleapis.com/v1/records:queryRecord';

  async run(): Promise<void> {
    console.log('[CruxMonthlyJob] Starting monthly CrUX refresh...');

    // 1. Get all tracked origins from crawl sessions
    const origins = await this.getTrackedOrigins();

    if (origins.length === 0) {
      console.log('[CruxMonthlyJob] No tracked origins found');
      BackgroundMetricsStore.record('b.crux.monthly', { origins: 0 });
      return;
    }

    let totalUpdated = 0;
    let totalErrors = 0;

    // 2. Fetch CrUX data per origin (both PHONE and DESKTOP)
    for (const { origin, sessionId } of origins) {
      try {
        const [mobileData, desktopData] = await Promise.all([
          this.fetchCruxData(origin, 'PHONE'),
          this.fetchCruxData(origin, 'DESKTOP'),
        ]);

        if (!mobileData && !desktopData) {
          continue;
        }

        // 3. Update pages with CrUX data
        const updated = await this.updatePagesWithCrux(sessionId, origin, mobileData, desktopData);
        totalUpdated += updated;
      } catch (err: any) {
        console.error(`[CruxMonthlyJob] Failed for origin ${origin}:`, err.message);
        totalErrors++;
      }
    }

    // 5. Persist timestamp
    BackgroundMetricsStore.record('b.crux.monthly', {
      origins: origins.length,
      updated: totalUpdated,
      errors: totalErrors,
    });

    console.log(`[CruxMonthlyJob] Completed: ${totalUpdated} pages updated across ${origins.length} origins (${totalErrors} errors)`);
  }

  /** Get all unique origins from crawl sessions */
  private async getTrackedOrigins(): Promise<Array<{ origin: string; sessionId: string }>> {
    try {
      const sessions = await crawlDb.sessions.toArray();
      const origins: Array<{ origin: string; sessionId: string }> = [];
      const seen = new Set<string>();

      for (const session of sessions) {
        if (!session.startUrl) continue;
        try {
          const parsed = new URL(session.startUrl);
          const origin = `${parsed.protocol}//${parsed.hostname}`;
          const key = `${origin}::${session.id}`;
          if (!seen.has(key)) {
            seen.add(key);
            origins.push({ origin, sessionId: session.id });
          }
        } catch { /* skip invalid URLs */ }
      }

      return origins;
    } catch {
      return [];
    }
  }

  /** Fetch CrUX data for an origin and form factor */
  private async fetchCruxData(origin: string, formFactor: 'PHONE' | 'DESKTOP'): Promise<CruxResponse | null> {
    try {
      const apiKey = (import.meta as any).env?.VITE_GOOGLE_CRUX_API_KEY;
      const url = apiKey
        ? `${CruxMonthlyJob.CRUX_API}?key=${apiKey}`
        : CruxMonthlyJob.CRUX_API;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: origin,
          formFactor: formFactor,
        }),
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) return null;
      const data: CruxResponse = await response.json();
      return data.error ? null : data;
    } catch {
      return null;
    }
  }

  /** Update all pages in a session with CrUX field data */
  private async updatePagesWithCrux(
    sessionId: string,
    origin: string,
    mobileData: CruxResponse | null,
    desktopData: CruxResponse | null,
  ): Promise<number> {
    // Use mobile data as primary (mobile-first indexing)
    const primary = mobileData || desktopData;
    if (!primary?.record?.metrics) return 0;

    const metrics = primary.record.metrics;
    const lcpP75 = metrics.LARGEST_CONTENTFUL_PAINT_MS?.percentiles.p75;
    const clsP75 = metrics.CUMULATIVE_LAYOUT_SHIFT_SCORE?.percentiles.p75;
    const inpP75 = metrics.INTERACTION_TO_NEXT_PAINT?.percentiles.p75;
    const fcpP75 = metrics.FIRST_CONTENTFUL_PAINT_MS?.percentiles.p75;
    const ttfbP75 = metrics.EXPERIMENTAL_TIME_TO_FIRST_BYTE?.percentiles.p75;

    // 4. Recompute CWV bucket
    const bucket = this.computeCwvBucket(lcpP75, inpP75, clsP75);

    // Update all pages in this session with origin-level CrUX data
    try {
      const pages = await getHtmlPages(sessionId);
      let updated = 0;

      for (const page of pages) {
        try {
          // Only update pages from this origin
          const pageOrigin = (() => { try { const p = new URL(page.url); return `${p.protocol}//${p.hostname}`; } catch { return ''; } })();
          if (pageOrigin !== origin) continue;

          await crawlDb.pages.update(page.url, {
            fieldLcp: lcpP75 ?? null,
            fieldCls: clsP75 ? clsP75 / 100 : null, // CLS score is ×100 in API
            fieldInp: inpP75 ?? null,
            fieldFcp: fcpP75 ?? null,
            fieldTtfb: ttfbP75 ?? null,
            qualityScore: bucket === 'good' ? 100 : bucket === 'needs-improvement' ? 60 : 20,
            psiEnrichedAt: Date.now(),
          });
          updated++;
        } catch { /* skip */ }
      }

      return updated;
    } catch {
      return 0;
    }
  }

  /** Compute CWV bucket using Google's thresholds */
  private computeCwvBucket(
    lcp: number | undefined,
    inp: number | undefined,
    cls: number | undefined,
  ): 'good' | 'needs-improvement' | 'poor' {
    if (lcp === undefined && inp === undefined && cls === undefined) {
      return 'needs-improvement';
    }

    // Check each metric — if any is "poor", the bucket is "poor"
    if (
      (lcp !== undefined && lcp > CWV_THRESHOLDS.lcp.poor) ||
      (inp !== undefined && inp > CWV_THRESHOLDS.inp.poor) ||
      (cls !== undefined && cls > CWV_THRESHOLDS.cls.poor)
    ) {
      return 'poor';
    }

    // If all measured metrics are "good", the bucket is "good"
    const allGood =
      (lcp === undefined || lcp <= CWV_THRESHOLDS.lcp.good) &&
      (inp === undefined || inp <= CWV_THRESHOLDS.inp.good) &&
      (cls === undefined || cls <= CWV_THRESHOLDS.cls.good);

    return allGood ? 'good' : 'needs-improvement';
  }
}
