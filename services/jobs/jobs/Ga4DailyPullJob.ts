// services/jobs/jobs/Ga4DailyPullJob.ts
// ── Daily GA4 Data Pull ──────────────────────────────────────────
//
// Fetches fresh page-level analytics from Google Analytics 4,
// including sessions, users, views, bounce rate, conversions,
// revenue, channel breakdown, and scroll depth.

import { BackgroundMetricsStore } from '../BackgroundMetricsStore';
import { Ga4ClientService } from '../../Ga4ClientService';
import { crawlDb } from '../../CrawlDatabase';
import { refreshGoogleToken } from '../../GoogleOAuthHelper';
import { refreshWithLock } from '../../TokenRefreshLock';

/**
 * Daily Google Analytics 4 data import.
 *
 * Schedule: `30 6 * * *` (every day at 06:30 UTC)
 * Background metric: `b.ga4.daily`
 *
 * Uses date-chunked, cardinality-aware fetching with a 10-deep
 * semaphore for controlled concurrency.
 */
export class Ga4DailyPullJob {
  /** Maximum concurrent API requests (10-deep semaphore) */
  private static readonly MAX_CONCURRENT = 10;
  private activeCount = 0;
  private waitQueue: Array<() => void> = [];

  /** Acquire a semaphore slot */
  private async acquire(): Promise<void> {
    if (this.activeCount < Ga4DailyPullJob.MAX_CONCURRENT) {
      this.activeCount++;
      return;
    }
    await new Promise<void>(resolve => this.waitQueue.push(resolve));
    this.activeCount++;
  }

  /** Release a semaphore slot */
  private release(): void {
    this.activeCount--;
    const next = this.waitQueue.shift();
    if (next) next();
  }

  /**
   * Chunk a date range into smaller ranges to handle GA4 cardinality limits.
   * GA4 API returns at most 100k rows per request; chunking by date helps
   * with high-cardinality dimensions.
   */
  private chunkDateRange(days: number, chunkSize = 7): Array<{ startDate: string; endDate: string }> {
    const chunks: Array<{ startDate: string; endDate: string }> = [];
    const end = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000); // yesterday
    const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);

    let currentStart = new Date(start);
    while (currentStart <= end) {
      const currentEnd = new Date(Math.min(
        currentStart.getTime() + (chunkSize - 1) * 24 * 60 * 60 * 1000,
        end.getTime()
      ));
      chunks.push({
        startDate: currentStart.toISOString().split('T')[0],
        endDate: currentEnd.toISOString().split('T')[0],
      });
      currentStart = new Date(currentEnd.getTime() + 24 * 60 * 60 * 1000);
    }

    return chunks;
  }

  async run(): Promise<void> {
    console.log('[Ga4DailyPullJob] Starting daily GA4 pull...');

    // 1. Get all sessions with GA4 connections
    const sessions = await BackgroundMetricsStore.getConnectedSessions('ga4');

    if (sessions.length === 0) {
      console.log('[Ga4DailyPullJob] No connected GA4 properties found');
      BackgroundMetricsStore.record('b.ga4.daily', { sessions: 0 });
      return;
    }

    let totalEnriched = 0;
    let totalErrors = 0;

    for (const session of sessions) {
      try {
        if (!session.propertyId) continue;

        // Refresh OAuth token if needed (credentials are stripped from cached integrations)
        let accessToken = session.accessToken;
        if (!accessToken && session.googleEmail) {
          try {
            accessToken = await refreshWithLock(session.googleEmail, refreshGoogleToken);
          } catch {
            console.error(`[Ga4DailyPullJob] Token refresh failed for ${session.googleEmail}`);
            continue;
          }
        }
        if (!accessToken) continue;

        // 2. Date-chunked fetch: pull last 7 days in chunks of 7
        const dateChunks = this.chunkDateRange(7, 7);

        // Process chunks with semaphore-controlled concurrency
        const chunkPromises = dateChunks.map(async (chunk) => {
          await this.acquire();
          try {
            // Use Ga4ClientService for the actual API call
            await Ga4ClientService.enrichSession(
              session.sessionId,
              session.propertyId,
              accessToken,
              undefined,
              {
                googleEmail: session.googleEmail,
                targetUrls: [], // let the service figure out pages
                maxRows: 10000,
              }
            );
          } finally {
            this.release();
          }
        });

        await Promise.all(chunkPromises);

        // 3. Fetch channel breakdown (organic, paid, direct, referral, social)
        await this.fetchChannelBreakdown(session, accessToken);

        // 4. Fetch scroll depth if enhanced measurement is enabled
        await this.fetchScrollDepth(session, accessToken);

        totalEnriched++;

      } catch (err: any) {
        console.error(`[Ga4DailyPullJob] Failed for session ${session.sessionId}:`, err.message);
        totalErrors++;
      }
    }

    // 6. Persist timestamp
    BackgroundMetricsStore.record('b.ga4.daily', {
      sessions: sessions.length,
      enriched: totalEnriched,
      errors: totalErrors,
    });

    console.log(`[Ga4DailyPullJob] Completed: ${totalEnriched} sessions enriched (${totalErrors} errors)`);
  }

  /**
   * Fetch channel breakdown for the session's pages.
   * Uses the sessionDefaultChannelGroup dimension.
   */
  private async fetchChannelBreakdown(session: any, accessToken: string): Promise<void> {
    if (!accessToken) return;
    try {
      // GA4 Data API request for channel breakdown
      const response = await fetch(`https://analyticsdata.googleapis.com/v1beta/${session.propertyId}:runReport`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRanges: [{ startDate: '7daysAgo', endDate: 'yesterday' }],
          dimensions: [{ name: 'pagePath' }, { name: 'sessionDefaultChannelGroup' }],
          metrics: [
            { name: 'sessions' },
            { name: 'totalUsers' },
          ],
          limit: 10000,
        }),
      });

      if (!response.ok) return;

      const data: any = await response.json();
      if (!data.rows) return;

      // Build channel breakdown per page path
      const channelMap = new Map<string, Record<string, number>>();

      for (const row of data.rows) {
        const pagePath = row.dimensionValues?.[0]?.value;
        const channel = row.dimensionValues?.[1]?.value || 'unknown';
        const sessions = parseInt(row.metricValues?.[0]?.value || '0', 10);

        if (!pagePath) continue;

        if (!channelMap.has(pagePath)) {
          channelMap.set(pagePath, {});
        }
        const channels = channelMap.get(pagePath)!;
        channels[channel.toLowerCase()] = (channels[channel.toLowerCase()] || 0) + sessions;
      }

      // Update pages with channel breakdown
      const pages = await crawlDb.pages.where('crawlId').equals(session.sessionId).toArray();
      const updates: Array<{ url: string; [key: string]: any }> = [];

      for (const page of pages) {
        try {
          const path = new URL(page.url).pathname;
          const channels = channelMap.get(path);
          if (channels) {
            // Store channel breakdown in page metadata
            updates.push({
              url: page.url,
              industrySignals: { ...(page.industrySignals || {}), ga4Channels: channels },
            });
          }
        } catch { /* skip */ }
      }

      if (updates.length > 0) {
        await crawlDb.transaction('rw', crawlDb.pages, async () => {
          for (const u of updates) {
            await crawlDb.pages.update(u.url, u);
          }
        });
      }
    } catch (err) {
      console.error('[Ga4DailyPullJob] Channel breakdown failed:', err);
    }
  }

  /**
   * Fetch scroll depth metrics if GA4 enhanced measurement is enabled.
   */
  private async fetchScrollDepth(session: any, accessToken: string): Promise<void> {
    if (!accessToken) return;
    try {
      const response = await fetch(`https://analyticsdata.googleapis.com/v1beta/${session.propertyId}:runReport`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRanges: [{ startDate: '7daysAgo', endDate: 'yesterday' }],
          dimensions: [{ name: 'pagePath' }],
          metrics: [{ name: 'averageEventPercentScrolled' }],
          limit: 10000,
        }),
      });

      if (!response.ok) return;

      const data: any = await response.json();
      if (!data.rows) return;

      // Update pages with scroll depth
      const pages = await crawlDb.pages.where('crawlId').equals(session.sessionId).toArray();
      const scrollMap = new Map<string, number>();

      for (const row of data.rows) {
        const path = row.dimensionValues?.[0]?.value;
        const scroll = parseFloat(row.metricValues?.[0]?.value || '0');
        if (path) scrollMap.set(path, scroll);
      }

      const updates: Array<{ url: string; [key: string]: any }> = [];

      for (const page of pages) {
        try {
          const path = new URL(page.url).pathname;
          const scroll = scrollMap.get(path);
          if (scroll !== undefined) {
            // Store scroll depth in page metadata
            updates.push({
              url: page.url,
              industrySignals: { ...(page.industrySignals || {}), ga4ScrollDepth: scroll },
            });
          }
        } catch { /* skip */ }
      }

      if (updates.length > 0) {
        await crawlDb.transaction('rw', crawlDb.pages, async () => {
          for (const u of updates) {
            await crawlDb.pages.update(u.url, u);
          }
        });
      }
    } catch (err) {
      console.error('[Ga4DailyPullJob] Scroll depth fetch failed:', err);
    }
  }
}
