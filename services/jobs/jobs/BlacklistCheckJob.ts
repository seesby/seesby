// services/jobs/jobs/BlacklistCheckJob.ts
// ── Daily Blacklist Check ───────────────────────────────────────
//
// Checks the domain against Google Safe Browsing, Spamhaus, and
// abuse.ch blocklists to detect security/reputation issues.

import { BackgroundMetricsStore } from '../BackgroundMetricsStore';
import { crawlDb } from '../../CrawlDatabase';

/** Blacklist check result */
interface BlacklistResult {
  isBlacklisted: boolean;
  googleSafeBrowsing: boolean;
  spamhaus: boolean;
  abuseCh: boolean;
  checkedAt: string;
  details?: string;
}

/**
 * Daily blacklist and security check.
 *
 * Schedule: `0 7 * * *` (every day at 07:00 UTC)
 * Background metric: `b.blacklist`
 */
export class BlacklistCheckJob {
  async run(): Promise<void> {
    console.log('[BlacklistCheckJob] Starting daily blacklist check...');

    // 1. Get all tracked domains from crawl sessions
    const domains = await this.getTrackedDomains();

    if (domains.length === 0) {
      console.log('[BlacklistCheckJob] No tracked domains found');
      BackgroundMetricsStore.record('b.blacklist', { domains: 0 });
      return;
    }

    let totalBlacklisted = 0;
    let totalErrors = 0;

    for (const { domain, sessionId, projectId } of domains) {
      try {
        // 2-4. Run all checks in parallel
        const [googleResult, spamhausResult, abuseResult] = await Promise.all([
          this.checkGoogleSafeBrowsing(domain),
          this.checkSpamhaus(domain),
          this.checkAbuseCh(domain),
        ]);

        // 5. Aggregate results
        const result: BlacklistResult = {
          isBlacklisted: googleResult.listed || spamhausResult.listed || abuseResult.listed,
          googleSafeBrowsing: googleResult.listed,
          spamhaus: spamhausResult.listed,
          abuseCh: abuseResult.listed,
          checkedAt: new Date().toISOString(),
          details: [googleResult.detail, spamhausResult.detail, abuseResult.detail].filter(Boolean).join('; '),
        };

        if (result.isBlacklisted) {
          totalBlacklisted++;
          await this.triggerSecurityAlert(domain, projectId, result);
        }

        // Update pages with blacklist status
        await this.updatePagesWithBlacklistStatus(sessionId, result);
      } catch (err: any) {
        console.error(`[BlacklistCheckJob] Failed for ${domain}:`, err.message);
        totalErrors++;
      }
    }

    // 6. Persist timestamp
    BackgroundMetricsStore.record('b.blacklist', {
      domains: domains.length,
      blacklisted: totalBlacklisted,
      errors: totalErrors,
    });

    console.log(`[BlacklistCheckJob] Completed: ${totalBlacklisted}/${domains.length} domains blacklisted (${totalErrors} errors)`);
  }

  /** Get all tracked domains from crawl sessions */
  private async getTrackedDomains(): Promise<Array<{ domain: string; sessionId: string; projectId: string }>> {
    try {
      const sessions = await crawlDb.sessions.toArray();
      const domains: Array<{ domain: string; sessionId: string; projectId: string }> = [];
      const seen = new Set<string>();

      for (const session of sessions) {
        if (!session.startUrl) continue;
        try {
          const hostname = new URL(session.startUrl).hostname.replace(/^www\./, '');
          if (!seen.has(hostname)) {
            seen.add(hostname);
            domains.push({
              domain: hostname,
              sessionId: session.id,
              projectId: session.projectId,
            });
          }
        } catch { /* skip */ }
      }

      return domains;
    } catch {
      return [];
    }
  }

  /** 2. Google Safe Browsing API check */
  private async checkGoogleSafeBrowsing(domain: string): Promise<{ listed: boolean; detail?: string }> {
    try {
      const apiKey = (import.meta as any).env?.VITE_GOOGLE_SAFE_BROWSING_API_KEY;
      if (!apiKey) return { listed: false };

      const response = await fetch(`https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client: { clientId: 'seesby', clientVersion: '1.0' },
          threatInfo: {
            threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE', 'POTENTIALLY_HARMFUL_APPLICATION'],
            platformTypes: ['ANY_PLATFORM'],
            threatEntryTypes: ['URL'],
            threatEntries: [{ url: `https://${domain}/` }],
          },
        }),
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) return { listed: false };
      const data: any = await response.json();

      if (data.matches && data.matches.length > 0) {
        const threatTypes = data.matches.map((m: any) => m.threatType).join(', ');
        return { listed: true, detail: `Google Safe Browsing: ${threatTypes}` };
      }

      return { listed: false };
    } catch {
      return { listed: false };
    }
  }

  /** 3. Spamhaus DNS-based check */
  private async checkSpamhaus(domain: string): Promise<{ listed: boolean; detail?: string }> {
    try {
      // Spamhaus ZEN check: reverse IP lookup against zen.spamhaus.org
      // For domain-based check, we need to resolve the domain first
      // Use DNS-over-HTTPS as a portable approach
      const dohUrl = `https://dns.google/resolve?name=${domain}&type=A`;
      const dohResponse = await fetch(dohUrl, { signal: AbortSignal.timeout(5000) });
      if (!dohResponse.ok) return { listed: false };

      const dohData: any = await dohResponse.json();
      const ips = (dohData.Answer || []).filter((a: any) => a.type === 1).map((a: any) => a.data);

      if (ips.length === 0) return { listed: false };

      // Check each IP against Spamhaus ZEN
      for (const ip of ips) {
        const reversed = ip.split('.').reverse().join('.');
        const spamhausQuery = `${reversed}.zen.spamhaus.org`;
        const spamhausResponse = await fetch(`https://dns.google/resolve?name=${spamhausQuery}&type=A`, {
          signal: AbortSignal.timeout(5000),
        });

        if (spamhausResponse.ok) {
          const spamhausData: any = await spamhausResponse.json();
          const answers = (spamhausData.Answer || []).filter((a: any) => a.type === 1);

          for (const answer of answers) {
            const code = answer.data;
            // 127.0.0.2-8 = listed in SBL/SBL/XBL/PBL
            if (code.startsWith('127.0.0.')) {
              const lastOctet = parseInt(code.split('.').pop(), 10);
              if (lastOctet >= 2 && lastOctet <= 8) {
                let listName = 'Unknown';
                if (lastOctet === 2 || lastOctet === 3 || lastOctet === 4) listName = 'SBL (Spamhaus Block List)';
                else if (lastOctet === 5 || lastOctet === 6) listName = 'XBL (Exploits Block List)';
                else if (lastOctet === 7 || lastOctet === 8) listName = 'PBL (Policy Block List)';
                return { listed: true, detail: `Spamhaus: ${listName} (${ip})` };
              }
            }
          }
        }
      }

      return { listed: false };
    } catch {
      return { listed: false };
    }
  }

  /** 4. abuse.ch URLhaus check */
  private async checkAbuseCh(domain: string): Promise<{ listed: boolean; detail?: string }> {
    try {
      // abuse.ch URLhaus API: check if domain appears in malware URL blocklist
      const response = await fetch(`https://urlhaus-api.abuse.ch/v1/host/${domain}/`, {
        method: 'GET',
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) return { listed: false };
      const data: any = await response.json();

      if (data.query_status === 'ok' && data.host_status === 'online') {
        const malwareCount = data.url_count || 0;
        if (malwareCount > 0) {
          return { listed: true, detail: `abuse.ch URLhaus: ${malwareCount} malicious URLs found` };
        }
      }

      return { listed: false };
    } catch {
      return { listed: false };
    }
  }

  /** Trigger a security alert if a domain is blacklisted */
  private async triggerSecurityAlert(domain: string, projectId: string, result: BlacklistResult): Promise<void> {
    try {
      const { dispatchAlert } = await import('../../AlertDispatcher');
      await dispatchAlert(
        {
          type: 'new_issues',
          title: `Security Alert: ${domain} blacklisted`,
          body: `Domain ${domain} is listed on: ${[result.googleSafeBrowsing && 'Google Safe Browsing', result.spamhaus && 'Spamhaus', result.abuseCh && 'abuse.ch'].filter(Boolean).join(', ')}. ${result.details || ''}`,
          severity: 'critical',
          projectId,
          projectName: domain,
          projectUrl: `https://${domain}`,
          data: { blacklist: result },
        },
        { inApp: true, slack: true, email: true, webhook: false },
        {},
      );
    } catch (err) {
      console.error('[BlacklistCheckJob] Alert failed:', err);
    }
  }

  /** Update pages with blacklist status */
  private async updatePagesWithBlacklistStatus(sessionId: string, result: BlacklistResult): Promise<void> {
    try {
      const pages = await crawlDb.pages.where('crawlId').equals(sessionId).toArray();
      for (const page of pages) {
        await crawlDb.pages.update(page.url, {
          industrySignals: {
            ...(page.industrySignals || {}),
            blacklist: result,
          },
        } as any);
      }
    } catch { /* skip */ }
  }
}
