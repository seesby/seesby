import React from 'react';
import {
  DataRow, Card, MetricPill, StatusBadge, TruncatedUrl,
  formatNumber, getMetric,
} from '../../../inspector/shared';

export default function LinksTab({ page, hasTrend }: { page: any; hasTrend?: boolean }) {
  const inlinks = Number(getMetric(page, 'inlinks') || page?.inlinks || 0);
  const outlinks = Number(getMetric(page, 'outlinks') || page?.outlinks || 0);
  const internalLinks = Number(getMetric(page, 'internalLinks') || page?.internalLinks || 0);
  const externalLinks = Number(getMetric(page, 'externalOutlinks') || page?.externalOutlinks || 0);
  const referringDomains = Number(getMetric(page, 'uniqueReferringDomains') || page?.uniqueReferringDomains || 0);
  const backlinksCount = Number(getMetric(page, 'backlinksCount') || page?.backlinksCount || 0);
  const inLinksList: Array<{ url: string; anchor?: string; sourcePages?: number }> = Array.isArray(page?.inLinksList) ? page.inLinksList : [];
  const backlinks = page?.backlinksData || {};
  const hubSpoke = page?.hubSpoke || {};
  const coCitation = Array.isArray(page?.coCitations) ? page.coCitations : [];
  const clickDepth = Number(page?.clickDepth || 0);
  const sourcePages = Number(page?.sourcePages || 0);
  const uniqueThirdPartyDomains: string[] = Array.isArray(page?.uniqueThirdPartyDomains) ? page.uniqueThirdPartyDomains : [];
  const nofollowIn = Number(getMetric(page, 'nofollowInlinks') || page?.nofollowInlinks || 0);
  const dofollowIn = Number(getMetric(page, 'dofollowInlinks') || page?.dofollowInlinks || 0);
  const brokenLinks = Number(getMetric(page, 'brokenLinks') || page?.brokenLinks || 0);
  const pageRank = getMetric(page, 'internalPageRank') || page?.internalPageRank;
  const linkEquity = getMetric(page, 'linkEquity') || page?.linkEquity;

  return (
    <div className="space-y-3">
      {/* Quick metrics */}
      <div className="grid grid-cols-4 gap-2">
        <MetricPill label="Inlinks" value={formatNumber(inlinks)} />
        <MetricPill label="Outlinks" value={formatNumber(outlinks)} />
        <MetricPill label="Internal" value={formatNumber(internalLinks)} />
        <MetricPill label="External" value={formatNumber(externalLinks)} />
      </div>

      {/* Status badges */}
      <div className="flex flex-wrap gap-1.5">
        {inlinks === 0 && <StatusBadge status="fail" label="Orphan" />}
        {inlinks > 0 && inlinks <= 2 && outlinks > 5 && <StatusBadge status="warn" label="Spoke (thin inlinks)" />}
        {inlinks > 10 && outlinks > 10 && <StatusBadge status="info" label="Hub page" />}
        {brokenLinks > 0 && <StatusBadge status="fail" label={`${brokenLinks} broken`} />}
        {nofollowIn > 0 && <StatusBadge status="warn" label={`${nofollowIn} nofollow`} />}
        {referringDomains > 10 && <StatusBadge status="pass" label={`${referringDomains} referring`} />}
      </div>

      {/* Row 1: Internal + External */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card title="Internal">
          {sourcePages > 0 && (
            <DataRow label="Source pages" value={formatNumber(sourcePages)} mono />
          )}
          {dofollowIn > 0 && nofollowIn > 0 && (
            <DataRow label="Link types" value={`${formatNumber(dofollowIn)} dofollow \u00B7 ${formatNumber(nofollowIn)} nofollow`} />
          )}
          {inLinksList.length > 0 && (
            <div className="mt-2 pt-2 border-t border-[var(--brand-surface-2)]]">
              <div className="text-[9px] text-[var(--brand-border-2)]] uppercase tracking-widest mb-1.5">Top Sources</div>
              <div className="space-y-1 max-h-[160px] overflow-y-auto">
                {inLinksList.slice(0, 5).map((link, i) => (
                  <div key={`${link.url}-${i}`} className="flex items-center gap-2 text-[10px] py-1 border-b border-[var(--brand-surface-2)]] last:border-b-0">
                    <TruncatedUrl url={link.url} />
                    {link.anchor && (
                      <span className="text-[10px] text-[var(--brand-text-faint)]] shrink-0">anchor &ldquo;{String(link.anchor).slice(0, 30)}&rdquo;</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          <DataRow label="Click depth" value={clickDepth || '\u2014'} mono />
        </Card>

        <Card title="External Backlinks">
          <DataRow label="Referring domains" value={formatNumber(referringDomains)} mono />
          <DataRow label="Total backlinks" value={formatNumber(backlinks.total || backlinksCount)} mono />
          <DataRow label="DR range" value={backlinks.drRange || '\u2014'} />
          <DataRow label="New 90d" value={formatNumber(backlinks.new90d || 0)}
            status={Number(backlinks.new90d || 0) > 0 ? 'pass' : 'warn'} />
          <DataRow label="Lost 90d" value={formatNumber(backlinks.lost90d || 0)}
            status={Number(backlinks.lost90d || 0) > 0 ? 'warn' : 'pass'} />
          <DataRow label="Toxic" value={formatNumber(backlinks.toxic || 0)}
            status={Number(backlinks.toxic || 0) === 0 ? 'pass' : 'fail'} />
          {backlinks.topReferrer && (
            <DataRow label="Top referrer" value={`${backlinks.topReferrer}  ${backlinks.topReferrerDr ? `DR ${backlinks.topReferrerDr}` : ''}`} />
          )}
          {pageRank && <DataRow label="PageRank" value={pageRank} />}
          {linkEquity && <DataRow label="Link equity" value={linkEquity} />}
        </Card>
      </div>

      {/* Third-party domains */}
      {uniqueThirdPartyDomains.length > 0 && (
        <Card title={`Third-party domains (${uniqueThirdPartyDomains.length})`}>
          <div className="flex flex-wrap gap-1.5">
            {uniqueThirdPartyDomains.slice(0, 20).map((domain: string) => (
              <StatusBadge key={domain} status="info" label={domain} />
            ))}
            {uniqueThirdPartyDomains.length > 20 && (
              <span className="text-[10px] text-[var(--brand-text-faint)]]">+{uniqueThirdPartyDomains.length - 20} more</span>
            )}
          </div>
        </Card>
      )}

      {/* Row 2: Hub/spoke + Co-citation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card title="Hub / Spoke Role">
          <DataRow label="Role" value={hubSpoke.role || '\u2014'}
            status={hubSpoke.role === 'hub' ? 'pass' : hubSpoke.role === 'spoke' ? 'info' : undefined} />
          {hubSpoke.cluster && (
            <DataRow label="" value={`(cluster: ${hubSpoke.cluster})`} />
          )}
          <DataRow label="Links to hub" value={hubSpoke.linksToHub ? 'Yes' : 'No'}
            status={hubSpoke.linksToHub ? 'pass' : 'warn'} />
          {hubSpoke.hubUrl && (
            <DataRow label="" value={`(${hubSpoke.hubUrl})`} />
          )}
          <DataRow label="Peer spoke links" value={hubSpoke.peerLinks || '\u2014'} />
        </Card>

        <Card title="Co-citation (Peer Articles)">
          <div className="text-[9px] text-[var(--brand-border-2)]] uppercase tracking-widest mb-1.5">Cited with</div>
          {coCitation.length > 0 ? (
            <div className="space-y-1">
              {coCitation.slice(0, 6).map((c: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-1 border-b border-[var(--brand-surface-2)]] last:border-b-0">
                  <span className="text-[10px] text-[var(--brand-text-mid)]] truncate max-w-[160px]">{c.url || c}</span>
                  <span className="text-[10px] font-mono text-[var(--brand-text-mid)]]">{c.count || c.times || ''}x</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-[10px] text-[var(--brand-border-2)]] py-2">No co-citation data</div>
          )}
        </Card>
      </div>
    </div>
  );
}
