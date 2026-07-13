import React from 'react';
import {
  DataRow, Card, MetricPill, StatusBadge, TruncatedUrl,
  formatNumber, getMetric,
} from '../../shared';

export default function TargetTab({ page }: { page: any }) {
  // Target page details
  const targetUrl = page?.targetUrl || page?.primaryOutlink || page?.linkedPageUrl || '—';
  const targetQuality = Number(page?.targetQualityScore || page?.linkedPageQuality || 0);
  const targetClarity = Number(page?.targetClarityScore || page?.linkedPageClarity || 0);
  const targetRank = Number(page?.targetRank || page?.linkedPageRank || 0);
  const targetTopKwCount = Number(page?.targetTopKeywords || page?.linkedPageTopKwCount || 0);

  // Target role
  const targetCluster = page?.targetCluster || page?.linkedPageCluster || '—';
  const targetRole = page?.targetRole || page?.linkedPageRole || '—';
  const targetHubLinked = page?.targetHubLinked ?? page?.linkedPageHubLinked;

  // Other in-links to target
  const otherInLinks = Array.isArray(page?.targetOtherInLinks) ? page.targetOtherInLinks : [];
  const otherInLinksCount = Number(page?.targetOtherInLinksCount || otherInLinks.length || 0);
  const otherInLinksDomains = Number(page?.targetOtherInLinksDomains || 0);

  // Link equity share
  const linkEquityShare = Number(page?.targetLinkEquityShare || page?.outlinkEquityShare || 0);

  // Impact estimate
  const impactQuality = Number(page?.targetImpactQuality || page?.linkLostQualityImpact || 0);
  const impactClicks = Number(page?.targetImpactClicks || page?.linkLostClicksImpact || 0);

  // Broken links
  const brokenInternal = Number(page?.brokenInternalLinks || 0);
  const brokenExternal = Number(page?.brokenExternalLinks || 0);
  const isOrphan = Number(page?.inlinks || 0) === 0;
  const orphanPages = Number(page?.orphanPages || 0);

  // Outlink counts
  const internalOutlinks = Number(page?.internalOutlinks || 0);
  const externalOutlinks = Number(page?.externalOutlinks || 0);
  const totalOutlinks = internalOutlinks + externalOutlinks;

  return (
    <div className="space-y-4">
      {/* Quick metrics */}
      <div className="grid grid-cols-4 gap-2">
        <MetricPill label="Internal" value={formatNumber(internalOutlinks)} />
        <MetricPill label="External" value={formatNumber(externalOutlinks)} />
        <MetricPill label="Total" value={formatNumber(totalOutlinks)} />
        <MetricPill label="Broken" value={formatNumber(brokenInternal + brokenExternal)} good={brokenInternal + brokenExternal === 0} />
      </div>

      {/* Badges */}
      {(isOrphan || brokenInternal > 0 || brokenExternal > 0 || orphanPages > 0) && (
        <div className="flex flex-wrap gap-1.5">
          {isOrphan && <StatusBadge status="fail" label="Orphan page" />}
          {brokenInternal > 0 && <StatusBadge status="fail" label={`${brokenInternal} broken internal`} />}
          {brokenExternal > 0 && <StatusBadge status="fail" label={`${brokenExternal} broken external`} />}
          {orphanPages > 0 && <StatusBadge status="warn" label={`${orphanPages} orphan pages (site)`} />}
        </div>
      )}

      {/* Wireframe layout: Target page | Target role | Other in-links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card title="Target page">
          <div className="mb-2 pb-2 border-b border-[var(--brand-surface-2)]">
            <div className="text-[9px] text-[var(--brand-border-2)] uppercase tracking-wider mb-0.5">URL</div>
            <TruncatedUrl url={targetUrl} />
          </div>
          <DataRow label="Quality" value={targetQuality > 0 ? `${formatNumber(targetQuality)}` : '—'} status={targetQuality >= 70 ? 'pass' : targetQuality >= 40 ? 'info' : 'warn'} />
          <DataRow label="Clarity" value={targetClarity > 0 ? `${formatNumber(targetClarity)}` : '—'} />
          <DataRow label="Rank" value={targetRank > 0 ? `${formatNumber(targetRank)}` : '0 top-50 kw'} />
        </Card>

        <Card title="Target role">
          <DataRow label="Cluster" value={targetCluster} status={targetCluster !== '—' ? 'pass' : 'info'} />
          <DataRow label="Role" value={targetRole} />
          <DataRow label="Hub-linked" value={targetHubLinked === true ? 'Yes' : targetHubLinked === false ? 'No' : '—'} status={targetHubLinked === true ? 'pass' : 'info'} />
        </Card>

        <Card title={`Other in-links to target${otherInLinksCount > 0 ? ` (${otherInLinksCount})` : ''}`}>
          {otherInLinks.length === 0 ? (
            <div className="text-[12px] text-[var(--brand-text-faint)] italic">No other in-links data available.</div>
          ) : (
            <div className="max-h-[200px] overflow-y-auto custom-scrollbar">
              <div className="text-[10px] text-[var(--brand-text-faint)] mb-2">Total {formatNumber(otherInLinksCount)} from {formatNumber(otherInLinksDomains)} ref domains</div>
              {otherInLinks.slice(0, 10).map((link: any, i: number) => {
                const domain = typeof link === 'string' ? link : link?.domain || link?.url || '—';
                const anchor = typeof link === 'object' ? link?.anchor || link?.anchorText : undefined;
                const isCurrent = typeof link === 'object' && (link?.isCurrent || link?.isThisPage);
                return (
                  <div key={i} className="flex items-center gap-2 text-[11px] py-1 border-b border-[var(--brand-surface-2)] last:border-b-0">
                    <span className={`font-mono truncate ${isCurrent ? 'text-[var(--brand-text-strong)]' : 'text-[var(--brand-text-mid)]'}`}>{domain}</span>
                    {anchor && (
                      <span className="text-[10px] text-[var(--brand-text-faint)] shrink-0">anchor "{String(anchor).slice(0, 20)}"</span>
                    )}
                    {isCurrent && <span className="text-[10px] text-[#f59e0b] shrink-0">←</span>}
                  </div>
                );
              })}
            </div>
          )}
          {linkEquityShare > 0 && (
            <div className="mt-2 pt-2 border-t border-[var(--brand-surface-2)] text-[11px]">
              <span className="text-[var(--brand-text-faint)]">Link equity share of target: </span>
              <span className="text-[var(--brand-text-strong)] font-mono">{linkEquityShare}%</span>
            </div>
          )}
        </Card>
      </div>

      {/* Impact estimate */}
      <Card title="Impact estimate">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 min-w-0">
          <DataRow label="If this link lost:" value="" />
          <DataRow label="Quality" value={impactQuality !== 0 ? `${impactQuality > 0 ? '+' : ''}${formatNumber(impactQuality)}` : '—'} status={impactQuality < 0 ? 'fail' : impactQuality > 0 ? 'pass' : 'info'} />
          <DataRow label="Clicks/mo" value={impactClicks !== 0 ? `${impactClicks > 0 ? '+' : ''}${formatNumber(impactClicks)}` : '—'} status={impactClicks < 0 ? 'fail' : impactClicks > 0 ? 'pass' : 'info'} />
        </div>
      </Card>
    </div>
  );
}
