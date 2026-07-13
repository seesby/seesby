// services/jobs/jobs/SocialMentionsJob.ts
// ── Hourly Social Mention Monitoring ─────────────────────────────
//
// Monitors brand mentions across social platforms, detects crisis
// signals (velocity spike + negative sentiment), and updates share
// of voice metrics.

import { BackgroundMetricsStore } from '../BackgroundMetricsStore';
import { crawlDb } from '../../CrawlDatabase';

/** A single social mention */
interface SocialMention {
  platform: string;
  url: string;
  author: string;
  text: string;
  timestamp: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  engagement: number; // likes + shares + replies
}

/** Aggregated social metrics */
interface SocialMetrics {
  volume24h: number;
  avgSentiment: number; // -1 to 1
  shareOfVoice: number; // 0-1
  platformBreakdown: Record<string, number>;
  crisisSignal: boolean;
}

/**
 * Hourly social mention monitoring.
 *
 * Schedule: `0 * * * *` (every hour)
 * Background metric: `b.social.mentions`
 */
export class SocialMentionsJob {
  /** Platforms to monitor */
  private static readonly PLATFORMS = ['twitter', 'reddit', 'hackernews', 'linkedin', 'mastodon'];
  /** Crisis threshold: mentions/hour > 5x rolling average */
  private static readonly CRISIS_VELOCITY_MULTIPLIER = 5;
  /** Crisis threshold: sentiment score < -0.5 */
  private static readonly CRISIS_SENTIMENT_THRESHOLD = -0.5;

  async run(): Promise<void> {
    console.log('[SocialMentionsJob] Starting hourly social mention monitoring...');

    // 1. Get brand names/domains from project configs
    const brands = await this.getTrackedBrands();

    if (brands.length === 0) {
      console.log('[SocialMentionsJob] No tracked brands found');
      BackgroundMetricsStore.record('b.social.mentions', { brands: 0 });
      return;
    }

    let totalMentions = 0;
    let crisisDetected = false;

    for (const brand of brands) {
      try {
        // 2. Search for mentions across platforms
        const mentions = await this.searchMentions(brand);

        // 3. Compute social metrics
        const metrics = this.computeMetrics(mentions, brand);

        totalMentions += metrics.volume24h;

        // 4. Detect crisis signals
        if (metrics.crisisSignal) {
          crisisDetected = true;
          await this.triggerCrisisAlert(brand, metrics);
        }

        // 5. Store metrics in session metadata
        await this.storeSocialMetrics(brand, metrics);
      } catch (err: any) {
        console.error(`[SocialMentionsJob] Failed for brand ${brand.name}:`, err.message);
      }
    }

    // 6. Persist timestamp
    BackgroundMetricsStore.record('b.social.mentions', {
      brands: brands.length,
      totalMentions,
      crisisDetected,
    });

    console.log(`[SocialMentionsJob] Completed: ${totalMentions} mentions across ${brands.length} brands${crisisDetected ? ' (CRISIS DETECTED)' : ''}`);
  }

  /** Get tracked brand names/domains from crawl sessions */
  private async getTrackedBrands(): Promise<Array<{ name: string; domain: string; projectId: string; sessionId: string }>> {
    try {
      const sessions = await crawlDb.sessions.toArray();
      const brands: Array<{ name: string; domain: string; projectId: string; sessionId: string }> = [];
      const seen = new Set<string>();

      for (const session of sessions) {
        if (!session.startUrl) continue;
        try {
          const domain = new URL(session.startUrl).hostname.replace(/^www\./, '');
          // Extract brand name from domain (e.g., "example.com" → "example")
          const name = domain.split('.')[0];
          const key = `${name}::${session.projectId}`;
          if (!seen.has(key)) {
            seen.add(key);
            brands.push({
              name,
              domain,
              projectId: session.projectId,
              sessionId: session.id,
            });
          }
        } catch { /* skip */ }
      }

      return brands;
    } catch {
      return [];
    }
  }

  /** Search for brand mentions across platforms */
  private async searchMentions(brand: { name: string; domain: string }): Promise<SocialMention[]> {
    const allMentions: SocialMention[] = [];

    for (const platform of SocialMentionsJob.PLATFORMS) {
      try {
        const mentions = await this.searchPlatform(platform, brand);
        allMentions.push(...mentions);
      } catch (err) {
        // Individual platform failures are non-fatal
      }
    }

    return allMentions;
  }

  /** Search a single platform for brand mentions */
  private async searchPlatform(platform: string, brand: { name: string; domain: string }): Promise<SocialMention[]> {
    try {
      // Use a unified social search API endpoint
      const response = await fetch('/api/social/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          query: brand.name,
          domain: brand.domain,
          limit: 100,
        }),
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) return [];
      const data: any = await response.json();
      if (!data.mentions) return [];

      return data.mentions.map((m: any): SocialMention => ({
        platform,
        url: m.url || '',
        author: m.author || '',
        text: m.text || '',
        timestamp: m.timestamp || Date.now(),
        sentiment: this.classifySentiment(m.text || ''),
        engagement: (m.likes || 0) + (m.shares || 0) + (m.replies || 0),
      }));
    } catch {
      return [];
    }
  }

  /** Simple sentiment classification (would use AI in production) */
  private classifySentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const lower = text.toLowerCase();
    const positiveWords = ['great', 'amazing', 'love', 'excellent', 'awesome', 'best', 'fantastic', 'recommend', 'helpful'];
    const negativeWords = ['terrible', 'hate', 'awful', 'worst', 'bad', 'scam', 'fraud', 'broken', 'fail', 'disappointed'];

    let score = 0;
    for (const word of positiveWords) {
      if (lower.includes(word)) score++;
    }
    for (const word of negativeWords) {
      if (lower.includes(word)) score--;
    }

    if (score > 0) return 'positive';
    if (score < 0) return 'negative';
    return 'neutral';
  }

  /** Compute aggregated social metrics from mentions */
  private computeMetrics(mentions: SocialMention[], brand: { name: string; domain: string }): SocialMetrics {
    const now = Date.now();
    const mentions24h = mentions.filter(m => now - m.timestamp < 24 * 60 * 60 * 1000);

    // Volume
    const volume24h = mentions24h.length;

    // Average sentiment (-1 to 1)
    const sentimentScores = mentions24h.map(m =>
      m.sentiment === 'positive' ? 1 : m.sentiment === 'negative' ? -1 : 0
    );
    const avgSentiment = sentimentScores.length > 0
      ? sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length
      : 0;

    // Platform breakdown
    const platformBreakdown: Record<string, number> = {};
    for (const m of mentions24h) {
      platformBreakdown[m.platform] = (platformBreakdown[m.platform] || 0) + 1;
    }

    // Share of voice (simplified: mentions per hour vs baseline)
    const shareOfVoice = volume24h > 0 ? Math.min(1, volume24h / 100) : 0;

    // Crisis detection: velocity spike + negative sentiment
    const mentionsLastHour = mentions.filter(m => now - m.timestamp < 60 * 60 * 1000).length;
    const rollingAvgHourly = Math.max(1, volume24h / 24);
    const velocitySpike = mentionsLastHour > rollingAvgHourly * SocialMentionsJob.CRISIS_VELOCITY_MULTIPLIER;
    const negativeSentiment = avgSentiment < SocialMentionsJob.CRISIS_SENTIMENT_THRESHOLD;
    const crisisSignal = velocitySpike && negativeSentiment;

    return {
      volume24h,
      avgSentiment,
      shareOfVoice,
      platformBreakdown,
      crisisSignal,
    };
  }

  /** Trigger a crisis alert */
  private async triggerCrisisAlert(brand: { name: string; domain: string; projectId: string }, metrics: SocialMetrics): Promise<void> {
    try {
      const { dispatchAlert } = await import('../../AlertDispatcher');
      await dispatchAlert(
        {
          type: 'new_issues',
          title: `Social Crisis Signal: ${brand.name}`,
          body: `Detected velocity spike (${metrics.volume24h} mentions/24h) with negative sentiment (score: ${metrics.avgSentiment.toFixed(2)}). Platforms: ${Object.entries(metrics.platformBreakdown).map(([p, c]) => `${p}: ${c}`).join(', ')}`,
          severity: 'critical',
          projectId: brand.projectId,
          projectName: brand.name,
          projectUrl: brand.domain,
          data: { metrics },
        },
        { inApp: true, slack: true, email: false, webhook: false },
        {}
      );
    } catch (err) {
      console.error('[SocialMentionsJob] Crisis alert failed:', err);
    }
  }

  /** Store social metrics in session metadata */
  private async storeSocialMetrics(brand: { sessionId: string }, metrics: SocialMetrics): Promise<void> {
    try {
      // Update pages with social signals
      const pages = await crawlDb.pages.where('crawlId').equals(brand.sessionId).toArray();
      for (const page of pages) {
        await crawlDb.pages.update(page.url, {
          socialLinks: {
            twitter: metrics.platformBreakdown['twitter'] > 0,
            reddit: metrics.platformBreakdown['reddit'] > 0,
            linkedin: metrics.platformBreakdown['linkedin'] > 0,
          },
          industrySignals: {
            ...(page.industrySignals || {}),
            socialMentions: metrics.volume24h,
            socialSentiment: metrics.avgSentiment,
            socialCrisis: metrics.crisisSignal,
          },
        } as any);
      }
    } catch { /* skip */ }
  }
}
