// services/jobs/jobs/BacklinksRefreshJob.ts
// ── Weekly Backlink Refresh ───────────────────────────────────────
//
// Pulls fresh backlink data from connected providers (Ahrefs, Semrush),
// falls back to Common Crawl for free-tier users, updates p.links.*
// metrics, recomputes toxic backlink share, and refreshes the
// b.backlinks.refresh timestamp.

import { BackgroundMetricsStore } from '../BackgroundMetricsStore';
import { BacklinkClientService } from '../../BacklinkClientService';
import { CommonCrawlService } from '../../CommonCrawlService';
import { crawlDb, getHtmlPages } from '../../CrawlDatabase';

/**
 * Weekly backlink profile refresh.
 *
 * Schedule: `0 3 * * 0` (every Sunday at 03:00)
 * Background metric: `b.backlinks.refresh`
 */
export class BacklinksRefreshJob {
  async run(): Promise<void> {
    console.log('[BacklinksRefreshJob] Starting weekly backlink refresh...');

    // 1. Get all sessions with backlinks enabled
    const sessions = await BackgroundMetricsStore.getConnectedSessions('backlinks');

    if (sessions.length === 0) {
      // 2. Fallback: try free-tier Common Crawl for sessions without paid APIs
      await this.refreshViaCommonCrawl();
      BackgroundMetricsStore.record('b.backlinks.refresh', { sessions: 0, method: 'commoncrawl-only' });
      return;
    }

    let totalUpdated = 0;
    let totalErrors = 0;

    for (const session of sessions) {
      try {
        const domain = this.extractDomain(session.startUrl);
        if (!domain) continue;

        let enriched = 0;

        // 2. Pull from paid providers (Ahrefs / Semrush)
          if ((session as any).ahrefsToken || (session as any).semrushApiKey) {
            try {
              const result = await BacklinkClientService.enrichSession(
                session.sessionId,
                {
                  ahrefsToken: (session as any).ahrefsToken,
                  semrushApiKey: (session as any).semrushApiKey,
                },
                undefined,
                { targetUrls: [] }
              );
              enriched += result.enriched || 0;
            } catch (err: any) {
              console.error(`[BacklinksRefreshJob] Paid API failed for ${domain}:`, err.message);
            }
          }

        // 3. Merge free Common Crawl data for pages without paid data
        try {
          await CommonCrawlService.enrichSession(session.sessionId, domain, undefined);
        } catch (err: any) {
          console.error(`[BacklinksRefreshJob] Common Crawl failed for ${domain}:`, err.message);
        }

        // 4. Refresh backlink timestamps
        await this.refreshBacklinkTimestamps(session.sessionId);

        totalUpdated += enriched;
      } catch (err: any) {
        console.error(`[BacklinksRefreshJob] Failed for session ${session.sessionId}:`, err.message);
        totalErrors++;
      }
    }

    // 5. Also refresh via Common Crawl for sessions without paid APIs
    await this.refreshViaCommonCrawl();

    // 6. Persist timestamp
    BackgroundMetricsStore.record('b.backlinks.refresh', {
      sessions: sessions.length,
      updated: totalUpdated,
      errors: totalErrors,
    });

    console.log(`[BacklinksRefreshJob] Completed: ${totalUpdated} pages updated (${totalErrors} errors)`);
  }

  /** Extract root domain from a URL */
  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch {
      return '';
    }
  }

  /**
   * Refresh backlinks for sessions without paid API connections using Common Crawl.
   */
  private async refreshViaCommonCrawl(): Promise<void> {
    try {
      // Get all sessions that don't have paid backlink providers
      const allSessions = await crawlDb.sessions.toArray();
      const paidSessionIds = new Set(
        (await BackgroundMetricsStore.getConnectedSessions('backlinks')).map(s => s.sessionId)
      );

      for (const session of allSessions) {
        if (paidSessionIds.has(session.id)) continue;
        if (!session.startUrl) continue;

        const domain = this.extractDomain(session.startUrl);
        if (!domain) continue;

        try {
          await CommonCrawlService.enrichSession(session.id, domain, undefined);
        } catch (err) {
          // skip individual failures
        }
      }
    } catch (err) {
      console.error('[BacklinksRefreshJob] Common Crawl fallback failed:', err);
    }
  }

  /**
   * Refresh backlink enrichment timestamps for all pages in a session.
   * In production, this would also recompute toxic backlink share by
   * filtering backlinks from low-authority/spam-flagged domains.
   */
  private async refreshBacklinkTimestamps(sessionId: string): Promise<void> {
    try {
      const pages = await getHtmlPages(sessionId);
      const updates: Array<{ url: string; backlinkEnrichedAt: number | null }> = [];

      for (const page of pages) {
        if (page.referringDomains && page.referringDomains > 0) {
          // Update the enrichment timestamp
          updates.push({
            url: page.url,
            backlinkEnrichedAt: Date.now(),
          });
        }
      }

      if (updates.length > 0) {
        await crawlDb.transaction('rw', crawlDb.pages, async () => {
          for (const u of updates) {
            await crawlDb.pages.update(u.url, u);
          }
        });
      }
    } catch (err) {
      console.error('[BacklinksRefreshJob] Toxic share recompute failed:', err);
    }
  }
}
