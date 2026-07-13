import React from 'react';
import {
  DataRow, StatusBadge, TruncatedUrl, Card, MetricPill,
  formatNumber, getMetric,
} from '../../shared';

export default function LinksTab({ page }: { page: any; hasTrend?: boolean }) {
  const inlinks = Number(getMetric(page, 'inlinks') || page?.inlinks || 0);
  const outlinks = Number(getMetric(page, 'outlinks') || page?.outlinks || 0);
  const internalLinks = Number(getMetric(page, 'internalLinks') || page?.internalLinks || 0);
  const externalLinks = Number(getMetric(page, 'externalOutlinks') || page?.externalOutlinks || 0);
  const referringDomains = Number(getMetric(page, 'uniqueReferringDomains') || page?.uniqueReferringDomains || 0);
  const backlinksCount = Number(getMetric(page, 'backlinksCount') || page?.backlinksCount || 0);
  const brokenLinks = Number(getMetric(page, 'brokenLinks') || page?.brokenLinks || 0);
  const nofollowIn = Number(getMetric(page, 'nofollowInlinks') || page?.nofollowInlinks || 0);
  const dofollowIn = Number(getMetric(page, 'dofollowInlinks') || page?.dofollowInlinks || 0);
  const uniqueThirdPartyDomains: string[] = Array.isArray(page?.uniqueThirdPartyDomains) ? page.uniqueThirdPartyDomains : [];
  const externalLinksList: string[] = Array.isArray(page?.externalLinks) ? page.externalLinks : [];

  const inLinksList: Array<{ url: string; anchor?: string }> = Array.isArray(page?.inLinksList) ? page.inLinksList : [];
  const outLinksList: Array<{ url: string; anchor?: string; external?: boolean }> = Array.isArray(page?.outLinksList) ? page.outLinksList : [];
  const isHub = inlinks > 10 && outlinks > 10;
  const isSpoke = inlinks <= 2 && outlinks > 5;

  return (
    <div className="space-y-4">
      {/* Metrics */}
      <div className="grid grid-cols-4 gap-2">
        <MetricPill label="Inlinks" value={formatNumber(inlinks)} />
        <MetricPill label="Outlinks" value={formatNumber(outlinks)} />
        <MetricPill label="Internal" value={formatNumber(internalLinks)} />
        <MetricPill label="External" value={formatNumber(externalLinks)} />
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5">
        {isHub && <StatusBadge status="info" label="Hub page" />}
        {isSpoke && <StatusBadge status="warn" label="Spoke (thin inlinks)" />}
        {brokenLinks > 0 && <StatusBadge status="fail" label={`${brokenLinks} broken`} />}
        {nofollowIn > 0 && <StatusBadge status="warn" label={`${nofollowIn} nofollow`} />}
        {inlinks === 0 && <StatusBadge status="fail" label="Orphan" />}
        {referringDomains > 10 && <StatusBadge status="pass" label={`${referringDomains} referring`} />}
      </div>

      {/* Summary */}
      <Card title="Link summary">
        <DataRow label="Dofollow inlinks" value={formatNumber(dofollowIn)} />
        <DataRow label="Nofollow inlinks" value={formatNumber(nofollowIn)} />
        <DataRow label="Referring domains" value={formatNumber(referringDomains)} />
        <DataRow label="Third-party domains" value={formatNumber(uniqueThirdPartyDomains.length)} />
        <DataRow label="PageRank" value={getMetric(page, 'internalPageRank') || '\u2014'} />
        <DataRow label="Link equity" value={getMetric(page, 'linkEquity') || '\u2014'} />
        <DataRow label="Orphan risk" value={inlinks === 0 ? 'High' : 'Low'} status={inlinks === 0 ? 'fail' : 'pass'} />
      </Card>

      {/* Third-party domains */}
      {uniqueThirdPartyDomains.length > 0 && (
        <Card title={`Third-party domains (${uniqueThirdPartyDomains.length})`}>
          <div className="flex flex-wrap gap-1.5">
            {uniqueThirdPartyDomains.slice(0, 20).map((domain: string) => (
              <StatusBadge key={domain} status="info" label={domain} />
            ))}
            {uniqueThirdPartyDomains.length > 20 && (
              <span className="text-[10px] text-[var(--brand-text-faint)]">+{uniqueThirdPartyDomains.length - 20} more</span>
            )}
          </div>
        </Card>
      )}

      {/* In-links */}
      {inLinksList.length > 0 && (
        <Card title={`In-links (${inLinksList.length})`}>
          <div className="space-y-1 max-h-[200px] overflow-y-auto custom-scrollbar">
            {inLinksList.map((link, i) => (
              <div key={`${link.url}-${i}`} className="flex items-center gap-2 text-[11px] py-1 border-b border-[var(--brand-surface-2)] last:border-b-0">
                <TruncatedUrl url={link.url} />
                {link.anchor && (
                  <span className="text-[10px] text-[var(--brand-text-faint)] shrink-0">"{String(link.anchor).slice(0, 40)}"</span>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Out-links */}
      {outLinksList.length > 0 && (
        <Card title={`Out-links (${outLinksList.length})`}>
          <div className="space-y-1 max-h-[200px] overflow-y-auto custom-scrollbar">
            {outLinksList.map((link, i) => (
              <div key={`${link.url}-${i}`} className="flex items-center gap-2 text-[11px] py-1 border-b border-[var(--brand-surface-2)] last:border-b-0">
                <TruncatedUrl url={link.url} />
                {link.external && <StatusBadge status="info" label="ext" />}
                {link.anchor && (
                  <span className="text-[10px] text-[var(--brand-text-faint)] shrink-0">"{String(link.anchor).slice(0, 40)}"</span>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
