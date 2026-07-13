// services/OwnershipVerifier.ts
// ── Domain Ownership Verification ─────────────────────────────────
//
// Verifies domain ownership using three methods:
// 1. DNS TXT record verification
// 2. Google Search Console verification
// 3. HTML meta tag verification
//
// Used to confirm that a user controls a domain before enabling
// integrations, scheduled crawls, or background jobs.

export type VerificationMethod = 'dns_txt' | 'gsc' | 'meta_tag';

export interface VerificationResult {
  method: VerificationMethod;
  verified: boolean;
  detail: string;
  verifiedAt: string;
  /** The verification token/code that was checked */
  token?: string;
}

export interface OwnershipVerificationResult {
  domain: string;
  anyVerified: boolean;
  results: VerificationResult[];
  recommendedMethod: VerificationMethod | null;
}

/**
 * Domain ownership verification service.
 */
export class OwnershipVerifier {
  /**
   * Verify domain ownership using all available methods.
   * Returns as soon as any method succeeds, but continues checking
   * remaining methods for completeness.
   */
  static async verifyOwnership(
    domain: string,
    options?: {
      /** Expected DNS TXT verification token (e.g., from GSC) */
      dnsTxtToken?: string;
      /** GSC access token for API-based verification */
      gscAccessToken?: string;
      /** Expected meta tag verification content */
      metaTagToken?: string;
      /** Google email for GSC API calls */
      googleEmail?: string;
    },
  ): Promise<OwnershipVerificationResult> {
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');

    const results: VerificationResult[] = [];

    // Run all verification methods in parallel
    const [dnsResult, gscResult, metaResult] = await Promise.all([
      options?.dnsTxtToken
        ? this.verifyDnsTxt(cleanDomain, options.dnsTxtToken)
        : Promise.resolve(null),
      options?.gscAccessToken
        ? this.verifyGsc(cleanDomain, options.gscAccessToken, options.googleEmail)
        : Promise.resolve(null),
      options?.metaTagToken
        ? this.verifyMetaTag(cleanDomain, options.metaTagToken)
        : Promise.resolve(null),
    ]);

    if (dnsResult) results.push(dnsResult);
    if (gscResult) results.push(gscResult);
    if (metaResult) results.push(metaResult);

    const anyVerified = results.some(r => r.verified);

    // Recommend the most reliable method
    let recommendedMethod: VerificationMethod | null = null;
    if (dnsResult?.verified) recommendedMethod = 'dns_txt';
    else if (gscResult?.verified) recommendedMethod = 'gsc';
    else if (metaResult?.verified) recommendedMethod = 'meta_tag';

    return {
      domain: cleanDomain,
      anyVerified,
      results,
      recommendedMethod,
    };
  }

  /**
   * 1. DNS TXT record verification.
   * Checks if the domain has a specific TXT record (typically
   * provided by Google Search Console for domain property verification).
   *
   * Expected format: google-site-verification=<token>
   */
  static async verifyDnsTxt(domain: string, expectedToken: string): Promise<VerificationResult> {
    try {
      // Use DNS-over-HTTPS (Google Public DNS) for portable TXT lookup
      const dohUrl = `https://dns.google/resolve?name=${domain}&type=TXT`;
      const response = await fetch(dohUrl, {
        signal: AbortSignal.timeout(10000),
        headers: { 'Accept': 'application/dns-json' },
      });

      if (!response.ok) {
        return {
          method: 'dns_txt',
          verified: false,
          detail: `DNS lookup failed: HTTP ${response.status}`,
          verifiedAt: new Date().toISOString(),
        };
      }

      const data: any = await response.json();
      const txtRecords: string[] = (data.Answer || [])
        .filter((a: any) => a.type === 16) // TXT record type
        .map((a: any) => a.data.replace(/"/g, ''));

      // Check if any TXT record contains the expected token
      const fullToken = `google-site-verification=${expectedToken}`;
      const found = txtRecords.some(txt =>
        txt.toLowerCase().includes(expectedToken.toLowerCase()) ||
        txt.toLowerCase().includes(fullToken.toLowerCase())
      );

      return {
        method: 'dns_txt',
        verified: found,
        detail: found
          ? `DNS TXT record verified: found token in ${txtRecords.length} TXT records`
          : `Token not found in ${txtRecords.length} TXT records. Expected: ${fullToken}`,
        verifiedAt: new Date().toISOString(),
        token: expectedToken,
      };
    } catch (err: any) {
      return {
        method: 'dns_txt',
        verified: false,
        detail: `DNS lookup error: ${err.message}`,
        verifiedAt: new Date().toISOString(),
      };
    }
  }

  /**
   * 2. Google Search Console API verification.
   * Checks if the domain is already verified in GSC by attempting
   * to list sites and checking if the domain appears.
   */
  static async verifyGsc(domain: string, accessToken: string, googleEmail?: string): Promise<VerificationResult> {
    try {
      // Try to list GSC sites — if the domain is listed, it's verified
      const response = await fetch(
        `https://www.googleapis.com/webmasters/v3/sites?__method=GET`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
          signal: AbortSignal.timeout(10000),
        }
      );

      // GSC API might use GET instead — try that as fallback
      let sitesResponse = response;
      if (!response.ok) {
        sitesResponse = await fetch('https://www.googleapis.com/webmasters/v3/sites', {
          headers: { 'Authorization': `Bearer ${accessToken}` },
          signal: AbortSignal.timeout(10000),
        });
      }

      if (!sitesResponse.ok) {
        return {
          method: 'gsc',
          verified: false,
          detail: `GSC API error: HTTP ${sitesResponse.status}`,
          verifiedAt: new Date().toISOString(),
        };
      }

      const data: any = await sitesResponse.json();
      const sites: Array<{ siteEntry?: { siteUrl?: string; permissionLevel?: string } }> = data.siteEntry || [];

      // Check if our domain (or a domain-level property) is verified
      const domainPatterns = [
        `sc-domain:${domain}`,
        `sc-domain:www.${domain}`,
        `https://${domain}/`,
        `https://www.${domain}/`,
        `http://${domain}/`,
      ];

      const matchedSite = sites.find(site => {
        const siteUrl = site.siteEntry?.siteUrl?.toLowerCase() || '';
        return domainPatterns.some(p => siteUrl === p.toLowerCase());
      });

      const verified = !!matchedSite;
      const permissionLevel = matchedSite?.siteEntry?.permissionLevel || 'unknown';

      return {
        method: 'gsc',
        verified,
        detail: verified
          ? `GSC verified: ${matchedSite?.siteEntry?.siteUrl} (permission: ${permissionLevel})`
          : `Domain not found in GSC verified properties (${sites.length} sites found)`,
        verifiedAt: new Date().toISOString(),
      };
    } catch (err: any) {
      return {
        method: 'gsc',
        verified: false,
        detail: `GSC verification error: ${err.message}`,
        verifiedAt: new Date().toISOString(),
      };
    }
  }

  /**
   * 3. HTML meta tag verification.
   * Fetches the domain's homepage and checks for a
   * `<meta name="google-site-verification" content="<token>">` tag.
   */
  static async verifyMetaTag(domain: string, expectedToken: string): Promise<VerificationResult> {
    try {
      // Fetch the homepage HTML via Ghost Bridge or direct
      const bridgeUrl = (import.meta as any).env?.VITE_GHOST_BRIDGE_URL;
      const targetUrl = `https://${domain}/`;
      const fetchUrl = bridgeUrl
        ? `${bridgeUrl.replace(/\/$/, '')}/?url=${encodeURIComponent(targetUrl)}`
        : targetUrl;

      const response = await fetch(fetchUrl, {
        signal: AbortSignal.timeout(15000),
        headers: { 'User-Agent': 'Seesby-Verifier/1.0' },
      });

      if (!response.ok) {
        return {
          method: 'meta_tag',
          verified: false,
          detail: `Failed to fetch homepage: HTTP ${response.status}`,
          verifiedAt: new Date().toISOString(),
        };
      }

      const html = await response.text();

      // Look for google-site-verification meta tag
      const metaPattern = /<meta\s+name=["']google-site-verification["']\s+content=["']([^"']+)["']/i;
      const match = html.match(metaPattern);

      if (!match) {
        // Also check for Bing verification tag
        const bingPattern = /<meta\s+name=["']msvalidate\.01["']\s+content=["']([^"']+)["']/i;
        const bingMatch = html.match(bingPattern);
        if (bingMatch && bingMatch[1] === expectedToken) {
          return {
            method: 'meta_tag',
            verified: true,
            detail: `Bing Webmaster verification meta tag found`,
            verifiedAt: new Date().toISOString(),
            token: expectedToken,
          };
        }

        return {
          method: 'meta_tag',
          verified: false,
          detail: 'No google-site-verification meta tag found on homepage',
          verifiedAt: new Date().toISOString(),
        };
      }

      const foundToken = match[1];
      const verified = foundToken === expectedToken || foundToken.includes(expectedToken);

      return {
        method: 'meta_tag',
        verified,
        detail: verified
          ? `Meta tag verified: google-site-verification token matches`
          : `Meta tag found but token mismatch (expected: ${expectedToken}, found: ${foundToken})`,
        verifiedAt: new Date().toISOString(),
        token: foundToken,
      };
    } catch (err: any) {
      return {
        method: 'meta_tag',
        verified: false,
        detail: `Meta tag verification error: ${err.message}`,
        verifiedAt: new Date().toISOString(),
      };
    }
  }

  /**
   * Generate a verification token for a domain.
   * This would typically be called before asking the user to add
   * the token to their DNS or HTML.
   */
  static generateVerificationToken(domain: string): string {
    // Generate a domain-specific token using a simple hash
    const base = `${domain}:${Date.now()}:${Math.random()}`;
    let hash = 0;
    for (let i = 0; i < base.length; i++) {
      const char = base.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return `seesby-${Math.abs(hash).toString(36)}-${Date.now().toString(36)}`;
  }

  /**
   * Get verification instructions for a specific method.
   */
  static getVerificationInstructions(
    method: VerificationMethod,
    domain: string,
    token: string,
  ): { title: string; steps: string[] } {
    switch (method) {
      case 'dns_txt':
        return {
          title: 'DNS TXT Record Verification',
          steps: [
            `Log in to your DNS provider (e.g., Cloudflare, GoDaddy, Namecheap)`,
            `Add a new TXT record for ${domain}`,
            `Set the name/host to @ (or your domain root)`,
            `Set the value to: google-site-verification=${token}`,
            `Save the record and wait for DNS propagation (usually 5-30 minutes)`,
            `Click "Verify" to check if the record is live`,
          ],
        };
      case 'gsc':
        return {
          title: 'Google Search Console Verification',
          steps: [
            `Ensure you have a verified property in Google Search Console for ${domain}`,
            `Connect your Google account in Seesby's Integrations settings`,
            `Select the GSC property for ${domain}`,
            `Click "Verify" to confirm access via the GSC API`,
          ],
        };
      case 'meta_tag':
        return {
          title: 'HTML Meta Tag Verification',
          steps: [
            `Add the following meta tag to the <head> of your homepage at https://${domain}/:`,
            `<meta name="google-site-verification" content="${token}" />`,
            `Save and publish your changes`,
            `Click "Verify" to check if the tag is live`,
          ],
        };
    }
  }
}
