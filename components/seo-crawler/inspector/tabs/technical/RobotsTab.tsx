import React from 'react';
import {
  DataRow, Card, MetricPill, StatusBadge, TruncatedUrl,
  formatNumber, getMetric,
} from '../../shared';

export default function RobotsTab({ page }: { page: any }) {
  const metaRobots = page?.metaRobots1 || page?.metaRobots || '';
  const xRobots = page?.xRobots || page?.xRobotsTag || '';
  const isNoindex = /noindex/i.test(metaRobots) || /noindex/i.test(xRobots);
  const isNofollow = /nofollow/i.test(metaRobots) || /nofollow/i.test(xRobots);

  const canonical = page?.canonical || '';
  const canonicalSelf = canonical === page?.url;

  const hreflang = Array.isArray(page?.hreflang) ? page.hreflang : page?.hreflangTags || [];
  const hreflangs = Array.isArray(hreflang) ? hreflang : [];

  const inSitemap = page?.inSitemap || false;

  return (
    <div className="space-y-4">
      {/* Quick metrics */}
      <div className="grid grid-cols-4 gap-2">
        <MetricPill label="Indexable" value={page?.indexable !== false ? 'Yes' : 'No'} good={page?.indexable !== false} />
        <MetricPill label="In Sitemap" value={inSitemap ? 'Yes' : 'No'} good={inSitemap} />
        <MetricPill label="Canonical" value={canonical ? (canonicalSelf ? 'Self' : 'External') : 'Missing'} good={canonicalSelf} />
        <MetricPill label="Noindex" value={isNoindex ? 'Yes' : 'No'} good={!isNoindex} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* robots.txt */}
        <Card title="robots.txt">
          <DataRow label="User-agent" value={page?.robotsTxtUserAgent || '*'} />
          <DataRow label="Blocked" value={page?.robotsTxtBlocked ? 'Yes' : 'No'} status={page?.robotsTxtBlocked ? 'fail' : 'pass'} />
          <DataRow label="Crawl-delay" value={page?.robotsTxtCrawlDelay || '—'} />
          <DataRow label="Sitemap ref" value={page?.robotsTxtSitemap || '—'} />
        </Card>

        {/* Meta robots */}
        <Card title="Meta robots">
          <DataRow label="Meta robots" value={metaRobots || '—'} status={isNoindex ? 'fail' : 'pass'} />
          <DataRow label="X-Robots-Tag" value={xRobots || '—'} status={/noindex/i.test(xRobots) ? 'fail' : 'pass'} />
          <DataRow label="Noindex" value={isNoindex ? 'Yes' : 'No'} status={isNoindex ? 'fail' : 'pass'} />
          <DataRow label="Nofollow" value={isNofollow ? 'Yes' : 'No'} status={isNofollow ? 'warn' : 'pass'} />
        </Card>
      </div>

      {/* Canonical */}
      <Card title="Canonical">
        <DataRow label="Canonical URL" value={canonical || '—'} mono />
        <DataRow label="Self-referencing" value={canonical ? (canonicalSelf ? 'Yes' : 'No') : 'N/A'}
          status={canonicalSelf ? 'pass' : canonical ? 'info' : 'warn'} />
        <DataRow label="HTTP status" value={page?.canonicalHttpStatus || '—'} />
        <DataRow label="Indexability" value={page?.canonicalIndexable !== false ? 'Indexable' : 'Non-indexable'} />
      </Card>

      {/* Sitemap */}
      <Card title="Sitemap">
        <DataRow label="In sitemap" value={inSitemap ? 'Yes' : 'No'} status={inSitemap ? 'pass' : 'warn'} />
        <DataRow label="Sitemap index" value={page?.inSitemapIndex ? 'Yes' : 'No'} />
        <DataRow label="Priority" value={page?.crawlPriority || page?.priority || '—'} />
        <DataRow label="Change freq" value={page?.changeFrequency || page?.changefreq || '—'} />
      </Card>

      {/* Hreflang */}
      {hreflangs.length > 0 && (
        <Card title={`Hreflang (${hreflangs.length})`}>
          <div className="bg-[var(--brand-surface-0)] border border-[var(--brand-surface-3)] rounded-lg overflow-hidden max-h-[180px] overflow-y-auto custom-scrollbar">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-[var(--brand-surface-3)]">
                  <th className="px-3 py-2 text-left text-[var(--brand-border-2)] uppercase tracking-widest text-[9px] font-bold">Lang</th>
                  <th className="px-3 py-2 text-left text-[var(--brand-border-2)] uppercase tracking-widest text-[9px] font-bold">URL</th>
                  <th className="px-3 py-2 text-left text-[var(--brand-border-2)] uppercase tracking-widest text-[9px] font-bold">Valid</th>
                </tr>
              </thead>
              <tbody>
                {hreflangs.map((h: any, i: number) => (
                  <tr key={i} className={`border-b border-[var(--brand-surface-2)] ${i % 2 === 0 ? '' : 'bg-[var(--brand-surface-0)]'} hover:bg-[var(--brand-surface-2)]`}>
                    <td className="px-3 py-1.5 text-[var(--brand-text-mid)] font-mono">{h?.lang || h?.hreflang || '—'}</td>
                    <td className="px-3 py-1.5 text-blue-400 break-all font-mono">{h?.url || h?.href || '—'}</td>
                    <td className="px-3 py-1.5">
                      <StatusBadge status={h?.valid !== false ? 'pass' : 'fail'} label={h?.valid !== false ? 'OK' : 'Invalid'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
