// services/jobs/jobs/CoreUpdateDetectorJob.ts
// ── Google Core Update Detector ──────────────────────────────────
//
// Event-driven detector that monitors for Google algorithm updates
// by checking official announcement channels and SERP volatility
// sensors. Triggers a SERP scan to measure impact when an update
// is detected.

import { BackgroundMetricsStore } from '../BackgroundMetricsStore';
import { crawlDb } from '../../CrawlDatabase';

/** Core update event record */
interface CoreUpdateEvent {
  date: string;
  name: string;
  type: 'core' | 'helpfulContent' | 'spam' | 'review' | 'link' | 'unknown';
  confirmedByGoogle: boolean;
  impactLevel: 'low' | 'moderate' | 'high' | 'severe';
  detectedAt: string;
}

/** SERP volatility sensor reading */
interface VolatilityReading {
  sensor: string;
  score: number; // 0-10 (higher = more volatile)
  source: string;
}

/**
 * Google core update detection (runs every 4 hours).
 *
 * Schedule: every 4 hours (cron: 0 0/4 * * *)
 * Background metric: `b.core.update.events`
 */
export class CoreUpdateDetectorJob {
  /** Volatility threshold for flagging a potential update */
  private static readonly VOLATILITY_THRESHOLD = 5.0;
  async run(): Promise<void> {
    console.log('[CoreUpdateDetectorJob] Starting core update detection...');

    // 1. Check Google SearchLiaison / official announcements
    const announcements = await this.checkGoogleAnnouncements();

    // 2. Check third-party volatility sensors
    const volatility = await this.checkVolatilitySensors();

    // 3. Determine if an update is likely happening
    const updateDetected = announcements.length > 0 ||
      volatility.some(v => v.score >= CoreUpdateDetectorJob.VOLATILITY_THRESHOLD);

    let detectedEvent: CoreUpdateEvent | null = null;

    if (updateDetected) {
      // Build event record
      detectedEvent = this.buildEventRecord(announcements, volatility);

      // 4. If update detected, trigger a focused SERP scrape
      await this.triggerSerpImpactScan(detectedEvent);

      // 5. Update affected pages with core update flag
      await this.flagAffectedPages(detectedEvent);

      // Alert if significant impact detected
      if (detectedEvent.impactLevel === 'high' || detectedEvent.impactLevel === 'severe') {
        await this.triggerUpdateAlert(detectedEvent);
      }
    }

    // 6. Persist timestamp
    BackgroundMetricsStore.record('b.core.update.events', {
      detected: updateDetected,
      announcements: announcements.length,
      maxVolatility: Math.max(0, ...volatility.map(v => v.score)),
      event: detectedEvent,
    });

    console.log(`[CoreUpdateDetectorJob] Completed: ${updateDetected ? 'UPDATE DETECTED' : 'no update detected'}${detectedEvent ? ` — ${detectedEvent.name} (${detectedEvent.impactLevel})` : ''}`);
  }

  /** 1. Check Google SearchLiaison announcements */
  private async checkGoogleAnnouncements(): Promise<CoreUpdateEvent[]> {
    const events: CoreUpdateEvent[] = [];

    try {
      // Check Google Search Central blog RSS feed
      const response = await fetch('https://developers.google.com/search/blog/rss', {
        signal: AbortSignal.timeout(10000),
      });

      if (response.ok) {
        const text = await response.text();
        // Parse RSS for recent posts mentioning "update" or "core"
        const titlePattern = /<title>(.*?)<\/title>/gi;
        const titles = text.match(titlePattern) || [];

        for (const titleTag of titles.slice(0, 10)) {
          const title = titleTag.replace(/<\/?title>/gi, '').trim();
          const lower = title.toLowerCase();

          if (lower.includes('core update') || lower.includes('algorithm update') ||
              lower.includes('ranking update') || lower.includes('helpful content') ||
              lower.includes('spam update') || lower.includes('review update')) {

            let type: CoreUpdateEvent['type'] = 'unknown';
            if (lower.includes('core')) type = 'core';
            else if (lower.includes('helpful content')) type = 'helpfulContent';
            else if (lower.includes('spam')) type = 'spam';
            else if (lower.includes('review')) type = 'review';
            else if (lower.includes('link')) type = 'link';

            events.push({
              date: new Date().toISOString().split('T')[0],
              name: title,
              type,
              confirmedByGoogle: true,
              impactLevel: 'moderate',
              detectedAt: new Date().toISOString(),
            });
          }
        }
      }
    } catch (err) {
      console.error('[CoreUpdateDetectorJob] Announcement check failed:', err);
    }

    // Also check for recent cached events (avoid duplicate alerts)
    if (events.length > 0) {
      const lastRun = BackgroundMetricsStore.getLastRun('b.core.update.events');
      // Only flag as new if it's been more than 24h since last detection
      if (lastRun && Date.now() - lastRun < 24 * 60 * 60 * 1000) {
        // Already reported recently — skip
        return [];
      }
    }

    return events;
  }

  /** 2. Check third-party volatility sensors */
  private async checkVolatilitySensors(): Promise<VolatilityReading[]> {
    const readings: VolatilityReading[] = [];

    // SEMRush Sensor (US index)
    try {
      const semrushReading = await this.fetchSemrushSensor();
      if (semrushReading !== null) {
        readings.push({
          sensor: 'semrush',
          score: semrushReading,
          source: 'https://www.semrush.com/sensor/',
        });
      }
    } catch { /* skip */ }

    // Moz Algoroo
    try {
      const mozReading = await this.fetchMozAlgoroo();
      if (mozReading !== null) {
        readings.push({
          sensor: 'moz',
          score: mozReading,
          source: 'https://moz.com/algoroo',
        });
      }
    } catch { /* skip */ }

    return readings;
  }

  /** Fetch SEMRush Sensor score (scrape or API) */
  private async fetchSemrushSensor(): Promise<number | null> {
    try {
      // SEMRush sensor API (if available) or scrape
      const response = await fetch('https://www.semrush.com/sensor/api/v1/en/data', {
        signal: AbortSignal.timeout(10000),
        headers: { 'Accept': 'application/json' },
      });

      if (!response.ok) return null;
      const data: any = await response.json();

      // SEMRush returns a volatility score 0-10
      const score = data?.data?.[0]?.value ?? data?.sensor ?? null;
      return typeof score === 'number' ? score : null;
    } catch {
      return null;
    }
  }

  /** Fetch Moz Algoroo score */
  private async fetchMozAlgoroo(): Promise<number | null> {
    try {
      const response = await fetch('https://moz.com/algoroo/api/v1/data', {
        signal: AbortSignal.timeout(10000),
        headers: { 'Accept': 'application/json' },
      });

      if (!response.ok) return null;
      const data: any = await response.json();

      // Moz Algoroo returns a "temperature" 0-10
      const score = data?.temperature ?? data?.score ?? null;
      return typeof score === 'number' ? score : null;
    } catch {
      return null;
    }
  }

  /** Build an event record from announcements and volatility readings */
  private buildEventRecord(
    announcements: CoreUpdateEvent[],
    volatility: VolatilityReading[],
  ): CoreUpdateEvent {
    const maxVolatility = Math.max(0, ...volatility.map(v => v.score));

    // Compute volatility-based impact level
    const volImpactNum = maxVolatility >= 8 ? 4 : maxVolatility >= 6 ? 3 : maxVolatility >= 4 ? 2 : 1;
    const impactLevels = ['low', 'moderate', 'high', 'severe'] as const;
    const volImpactLevel = impactLevels[volImpactNum - 1];

    // If we have an official announcement, take the higher of volatility vs announcement impact
    if (announcements.length > 0) {
      const announceImpactNum = announcements[0].impactLevel === 'severe' ? 4
        : announcements[0].impactLevel === 'high' ? 3
        : announcements[0].impactLevel === 'moderate' ? 2 : 1;
      const finalImpactNum = Math.max(volImpactNum, announceImpactNum);
      return {
        ...announcements[0],
        impactLevel: impactLevels[finalImpactNum - 1],
      };
    }

    return {
      date: new Date().toISOString().split('T')[0],
      name: `Volatility spike detected (${maxVolatility.toFixed(1)}/10)`,
      type: 'unknown',
      confirmedByGoogle: false,
      impactLevel: volImpactLevel,
      detectedAt: new Date().toISOString(),
    };
  }

  /** 3. Trigger a focused SERP scrape to measure impact */
  private async triggerSerpImpactScan(event: CoreUpdateEvent): Promise<void> {
    try {
      // Import SerpScrapeJob and trigger it
      const { SerpScrapeJob } = await import('./SerpScrapeJob');
      const serpJob = new SerpScrapeJob();
      // Run in background — don't block the detector
      serpJob.run().catch(err => {
        console.error('[CoreUpdateDetectorJob] SERP impact scan failed:', err);
      });
    } catch (err) {
      console.error('[CoreUpdateDetectorJob] Failed to trigger SERP scan:', err);
    }
  }

  /** 4. Flag affected pages with core update indicator */
  private async flagAffectedPages(event: CoreUpdateEvent): Promise<void> {
    try {
      const sessions = await crawlDb.sessions.toArray();
      for (const session of sessions) {
        const pages = await crawlDb.pages.where('crawlId').equals(session.id).toArray();
        for (const page of pages) {
          await crawlDb.pages.update(page.url, {
            industrySignals: {
              ...(page.industrySignals || {}),
              coreUpdate: {
                detected: true,
                eventName: event.name,
                detectedAt: event.detectedAt,
                impactLevel: event.impactLevel,
              },
            },
          } as any);
        }
      }
    } catch (err) {
      console.error('[CoreUpdateDetectorJob] Failed to flag pages:', err);
    }
  }

  /** Trigger an alert for significant core updates */
  private async triggerUpdateAlert(event: CoreUpdateEvent): Promise<void> {
    try {
      const { dispatchAlert } = await import('../../AlertDispatcher');
      await dispatchAlert(
        {
          type: 'new_issues',
          title: `Google Core Update Detected: ${event.name}`,
          body: `Impact level: ${event.impactLevel}. ${event.confirmedByGoogle ? 'Confirmed by Google.' : 'Detected via SERP volatility sensors.'} A SERP impact scan has been triggered to measure position changes.`,
          severity: event.impactLevel === 'severe' ? 'critical' : 'warning',
          projectId: 'global',
          projectName: 'All Projects',
          projectUrl: '',
          data: { event },
        },
        { inApp: true, slack: true, email: false, webhook: false },
        {},
      );
    } catch (err) {
      console.error('[CoreUpdateDetectorJob] Alert failed:', err);
    }
  }
}
