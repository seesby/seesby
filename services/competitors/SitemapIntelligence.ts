import { CompetitorProfile } from '../CompetitorMatrixConfig';

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

export async function analyzeSitemap(domain: string): Promise<Partial<CompetitorProfile>> {
  const result: Partial<CompetitorProfile> = {};
  const urls = await fetchAndParseSitemap(domain);
  if (!urls.length) return result;

  result.totalIndexablePages = urls.length;
  result.pagesIndexed = urls.length;

  const blogPattern = /\/(blog|news|articles?|insights?|resources?|learn|posts?)\//i;
  const productPattern = /\/(products?|shop|store|items?|collections?)\//i;
  const landingPattern = /\/(landing|lp-|offer|promo|campaign)\//i;

  const blogUrls = urls.filter((u) => blogPattern.test(u.loc));
  const productUrls = urls.filter((u) => productPattern.test(u.loc));
  const landingUrls = urls.filter((u) => landingPattern.test(u.loc));
  const otherUrls = urls.length - blogUrls.length - productUrls.length - landingUrls.length;

  result.contentTypeDistribution = {
    blog: blogUrls.length,
    product: productUrls.length,
    landing: landingUrls.length,
    other: Math.max(0, otherUrls),
  };

  const total = urls.length || 1;
  result.contentTypeBreakdown = [
    blogUrls.length > 0 ? `Blog ${Math.round((blogUrls.length / total) * 100)}%` : null,
    productUrls.length > 0 ? `Product ${Math.round((productUrls.length / total) * 100)}%` : null,
    landingUrls.length > 0 ? `Landing ${Math.round((landingUrls.length / total) * 100)}%` : null,
  ].filter(Boolean).join(', ') || 'General';

  if (blogUrls.length > 0) {
    const blogBase = blogUrls[0].loc.match(/(https?:\/\/[^/]+\/[^/]+\/)/)?.[1];
    result.blogUrl = blogBase || blogUrls[0].loc;
  }

  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 86400000;
  const ninetyDaysAgo = now - 90 * 86400000;
  const sixMonthsAgo = now - 180 * 86400000;
  const yearAgo = now - 365 * 86400000;

  const blogWithDates = blogUrls.filter((u) => u.lastmod && !Number.isNaN(Date.parse(u.lastmod)));
  const recentBlog30d = blogWithDates.filter((u) => Date.parse(u.lastmod as string) >= thirtyDaysAgo);
  const recentBlog90d = blogWithDates.filter((u) => Date.parse(u.lastmod as string) >= ninetyDaysAgo);
  const recentBlogYear = blogWithDates.filter((u) => Date.parse(u.lastmod as string) >= yearAgo);

  result.isActivelyBlogging = recentBlog90d.length > 0;
  result.recentNewPages = recentBlog30d.length;

  if (recentBlogYear.length > 0) {
    result.blogPostsPerMonth = Math.round((recentBlogYear.length / 12) * 10) / 10;
  }

  const allWithDates = urls.filter((u) => u.lastmod && !Number.isNaN(Date.parse(u.lastmod)));
  const freshPages = allWithDates.filter((u) => Date.parse(u.lastmod as string) >= sixMonthsAgo);
  if (allWithDates.length > 0) {
    result.contentFreshnessScore = Math.round((freshPages.length / allWithDates.length) * 100);
  }

  const ages = allWithDates.map((u) => (now - Date.parse(u.lastmod as string)) / (30 * 86400000));
  if (ages.length > 0) {
    result.averagePageAge = Math.round(ages.reduce((a, b) => a + b, 0) / ages.length);
  }

  const prev90d = allWithDates.filter((u) => {
    const ts = Date.parse(u.lastmod as string);
    return ts >= ninetyDaysAgo - 90 * 86400000 && ts < ninetyDaysAgo;
  });
  if (prev90d.length > 0) {
    const recent90dAll = allWithDates.filter((u) => Date.parse(u.lastmod as string) >= ninetyDaysAgo);
    result.contentVelocityTrend = Math.round(((recent90dAll.length - prev90d.length) / prev90d.length) * 100);
  }

  const pathSegments = new Set<string>();
  urls.forEach((u) => {
    try {
      const path = new URL(u.loc).pathname.split('/').filter(Boolean);
      if (path.length > 0) pathSegments.add(path[0]);
    } catch {
      // ignore malformed URLs
    }
  });
  result.topicCoverageBreadth = pathSegments.size;

  result.hasTargetedLandingPages = landingUrls.length > 0;

  const localPattern = /\/(locations?|cities|near-me|service-area)\//i;
  result.hasOptimizedLocalPages = urls.some((u) => localPattern.test(u.loc));

  return result;
}

async function fetchAndParseSitemap(domain: string): Promise<SitemapUrl[]> {
  const urls: SitemapUrl[] = [];
  const sitemapUrls = [
    `https://${domain}/sitemap.xml`,
    `https://${domain}/sitemap_index.xml`,
    `https://${domain}/sitemap/sitemap-index.xml`,
    `https://www.${domain}/sitemap.xml`,
  ];

  for (const sitemapUrl of sitemapUrls) {
    try {
      const resp = await fetch(sitemapUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SeesbyBot/1.0)' },
        signal: AbortSignal.timeout(8000),
      });
      if (!resp.ok) continue;

      const xml = await resp.text();
      if (xml.includes('<sitemapindex')) {
        const childUrls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
        for (const childUrl of childUrls.slice(0, 10)) {
          try {
            const childResp = await fetch(childUrl, {
              headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SeesbyBot/1.0)' },
              signal: AbortSignal.timeout(8000),
            });
            if (!childResp.ok) continue;
            urls.push(...parseSitemapXml(await childResp.text()));
          } catch {
            // ignore child failures
          }
        }
      } else {
        urls.push(...parseSitemapXml(xml));
      }

      if (urls.length > 0) break;
    } catch {
      // try next candidate
    }
  }

  if (urls.length === 0) {
    try {
      const robotsResp = await fetch(`https://${domain}/robots.txt`, {
        signal: AbortSignal.timeout(5000),
      });
      if (robotsResp.ok) {
        const robotsTxt = await robotsResp.text();
        const sitemapMatch = robotsTxt.match(/Sitemap:\s*(\S+)/i);
        if (sitemapMatch) {
          const resp = await fetch(sitemapMatch[1], {
            signal: AbortSignal.timeout(8000),
          });
          if (resp.ok) urls.push(...parseSitemapXml(await resp.text()));
        }
      }
    } catch {
      // ignore robots fallback failures
    }
  }

  return urls;
}

function parseSitemapXml(xml: string): SitemapUrl[] {
  const urls: SitemapUrl[] = [];
  const urlBlocks = xml.match(/<url>[\s\S]*?<\/url>/g) || [];

  for (const block of urlBlocks) {
    const loc = block.match(/<loc>([^<]+)<\/loc>/)?.[1];
    if (!loc) continue;

    const lastmod = block.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1];
    const changefreq = block.match(/<changefreq>([^<]+)<\/changefreq>/)?.[1];
    const priority = block.match(/<priority>([^<]+)<\/priority>/)?.[1];

    urls.push({ loc: loc.trim(), lastmod, changefreq, priority });
  }

  return urls;
}
