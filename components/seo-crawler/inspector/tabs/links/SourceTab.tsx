import React from 'react';
import {
  DataRow, Card, MetricPill, StatusBadge,
  formatNumber, formatDate, TruncatedUrl,
} from '../../shared';
import { Sparkline } from '../../../right-sidebar/_shared';

function seriesOf(p: any, k: string): number[] {
  const s = p?.[`${k}Series28d`];
  return Array.isArray(s) ? s.map(Number) : [];
}

export default function SourceTab({ page, hasTrend }: { page: any; hasTrend?: boolean }) {
  // Source domain
  const sourceDomain = page?.topReferringDomain || page?.topRefDomain || page?.sourceDomain || '—';
  const sourceDr = Number(page?.sourceDomainRating || page?.sourceDr || page?.domainRating || page?.dr || 0);
  const sourceRd = Number(page?.sourceReferringDomains || page?.sourceRd || 0);
  const sourceLanguage = page?.sourceLanguage || page?.language || '—';

  // Source page
  const sourceUrl = page?.sourceUrl || page?.topReferringUrl || page?.referringPageUrl || '—';
  const sourcePageTopic = page?.sourcePageTopic || page?.referringPageTopic || '—';
  const sourceWordCount = Number(page?.sourceWordCount || page?.referringPageWordCount || 0);
  const sourceOutboundLinks = Number(page?.sourceOutboundLinks || page?.referringPageOutboundLinks || 0);
  const sourcePubDate = page?.sourcePublishDate || page?.referringPagePubDate || '—';

  // Publisher
  const publisherName = page?.sourceAuthor || page?.referringAuthor || page?.publisherName || '—';
  const publisherVerified = page?.sourceAuthorVerified || page?.publisherVerified;
  const publisherContacted = page?.publisherContacted || false;

  // Other links from same source
  const otherLinksFromSource = Array.isArray(page?.otherLinksFromSource) ? page.otherLinksFromSource : [];
  const otherLinksCount = Number(page?.otherLinksFromSourceCount || otherLinksFromSource.length || 0);

  // Overlap
  const sameAuthorLinksUs = Number(page?.sameAuthorLinksToUs || 0);
  const sameAuthorPosts = Number(page?.sameAuthorPostCount || 0);

  // Backlink context
  const backlinks = Number(page?.backlinkCount || page?.totalBacklinks || 0);
  const referringDomains = Number(page?.uniqueReferringDomains || 0);
  const dofollow = Number(page?.dofollowInlinks || 0);
  const nofollow = Number(page?.nofollowInlinks || 0);
  const gainedLinks = Number(page?.gainedBacklinks || 0);
  const lostLinks = Number(page?.lostBacklinks || 0);

  // Toxic (for badges)
  const toxicScore = Number(page?.toxicLinkScore || page?.toxicScore || 0);
  const toxicLinks = Number(page?.toxicLinkCount || 0);
  const linkFarmIndicators = Number(page?.linkFarmIndicators || 0);
  const paidLinkSignals = Number(page?.paidLinkSignals || 0);
  const disavowCandidates = Array.isArray(page?.disavowCandidates) ? page.disavowCandidates : [];

  const followRatio = backlinks > 0 ? Math.round((dofollow / backlinks) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Quick metrics */}
      <div className="grid grid-cols-4 gap-2">
        <MetricPill label="Backlinks" value={formatNumber(backlinks)} />
        <MetricPill label="Ref Domains" value={formatNumber(referringDomains)} />
        <MetricPill label="Dofollow" value={`${followRatio}%`} good={followRatio >= 50} />
        <MetricPill label="Toxic" value={formatNumber(toxicLinks)} good={toxicLinks === 0} />
      </div>

      {/* Badges */}
      {(hasTrend && gainedLinks > 0 || hasTrend && lostLinks > 0 || toxicScore >= 60 || linkFarmIndicators > 0 || paidLinkSignals > 0 || disavowCandidates.length > 0 || otherLinksCount > 1) && (
        <div className="flex flex-wrap gap-1.5">
          {hasTrend && gainedLinks > 0 && <StatusBadge status="pass" label={`+${formatNumber(gainedLinks)} gained`} />}
          {hasTrend && lostLinks > 0 && <StatusBadge status="fail" label={`-${formatNumber(lostLinks)} lost`} />}
          {toxicScore >= 60 && <StatusBadge status="fail" label="High toxic score" />}
          {linkFarmIndicators > 0 && <StatusBadge status="fail" label="Link farm detected" />}
          {paidLinkSignals > 0 && <StatusBadge status="fail" label="Paid links detected" />}
          {disavowCandidates.length > 0 && <StatusBadge status="warn" label={`${disavowCandidates.length} disavow candidates`} />}
          {otherLinksCount > 1 && <StatusBadge status="info" label={`${otherLinksCount} links from this source`} />}
        </div>
      )}

      {/* Wireframe layout: Source domain | Source page | Publisher */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card title="Source domain">
          <DataRow label="Domain" value={sourceDomain} mono />
          <DataRow label="DR" value={sourceDr > 0 ? formatNumber(sourceDr) : '—'} status={sourceDr >= 50 ? 'pass' : sourceDr >= 20 ? 'info' : 'warn'} />
          <DataRow label="Referring domains" value={sourceRd > 0 ? formatNumber(sourceRd) : '—'} />
          <DataRow label="Language" value={sourceLanguage} />
        </Card>

        <Card title="Source page">
          <div className="mb-2 pb-2 border-b border-[var(--brand-surface-2)]]">
            <div className="text-[9px] text-[var(--brand-border-2)]] uppercase tracking-wider mb-0.5">URL</div>
            <TruncatedUrl url={sourceUrl} />
          </div>
          <DataRow label="Pub date" value={formatDate(sourcePubDate)} />
          <DataRow label="Topic" value={sourcePageTopic} />
          <DataRow label="Word count" value={sourceWordCount > 0 ? formatNumber(sourceWordCount) : '—'} />
          <DataRow label="Outbound links" value={sourceOutboundLinks > 0 ? `${formatNumber(sourceOutboundLinks)}${sourceOutboundLinks > 0 && sourceOutboundLinks <= 5 ? ' (few)' : ''}` : '—'} />
        </Card>

        <Card title="Publisher">
          <DataRow label="Author" value={publisherName} />
          <DataRow label="Verified" value={publisherVerified === true ? 'Yes' : publisherVerified === false ? 'No' : 'n/a'} status={publisherVerified === true ? 'pass' : 'info'} />
          <DataRow label="Contacted" value={publisherContacted ? 'Yes' : 'No'} status={publisherContacted ? 'pass' : 'info'} />
        </Card>
      </div>

      {/* Other links from this source + Overlap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card title={`Other links from ${sourceDomain !== '—' ? sourceDomain : 'this source'}${otherLinksCount > 0 ? ` (${otherLinksCount})` : ''}`}>
          {otherLinksFromSource.length === 0 ? (
            <div className="text-[12px] text-[var(--brand-text-faint)]] italic">No other links from this source found.</div>
          ) : (
            <div className="max-h-[200px] overflow-y-auto custom-scrollbar">
              {otherLinksFromSource.slice(0, 20).map((link: any, i: number) => {
                const url = typeof link === 'string' ? link : link?.url || '—';
                const anchor = typeof link === 'object' ? link?.anchor || link?.anchorText : undefined;
                return (
                  <div key={i} className="flex items-center gap-2 text-[11px] py-1 border-b border-[var(--brand-surface-2)]] last:border-b-0">
                    <TruncatedUrl url={url} />
                    {anchor && (
                      <span className="text-[10px] text-[var(--brand-text-faint)]] shrink-0">"{String(anchor).slice(0, 40)}"</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card title="Overlap with other referrers">
          <DataRow label="Same author links to us" value={sameAuthorLinksUs > 0 ? `${formatNumber(sameAuthorLinksUs)} from ${formatNumber(sameAuthorPosts)} posts` : '—'} status={sameAuthorLinksUs > 0 ? 'pass' : 'info'} />
          <DataRow label="Overlap score" value={page?.referralOverlapScore != null ? formatNumber(page.referralOverlapScore) : '—'} />
          <DataRow label="Shared topics" value={page?.sharedTopics != null ? formatNumber(page.sharedTopics) : '—'} />
        </Card>
      </div>

      {/* Trend sparklines */}
      {hasTrend && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <Card title="Referring domains trend">
            <Sparkline values={seriesOf(page, 'uniqueReferringDomains')} tone="info" />
          </Card>
          <Card title="Backlink count trend">
            <Sparkline values={seriesOf(page, 'backlinkCount')} tone="good" />
          </Card>
        </div>
      )}

      {/* Disavow candidates */}
      {disavowCandidates.length > 0 && (
        <Card title={`Disavow candidates (${disavowCandidates.length})`}>
          <div className="max-h-[200px] overflow-y-auto custom-scrollbar">
            {disavowCandidates.map((d: any, i: number) => (
              <div key={i} className="flex items-center justify-between py-1 border-b border-[var(--brand-surface-2)]] last:border-b-0 text-[11px]">
                <span className="text-red-400 font-mono truncate">{d?.domain || d?.referringDomain || '—'}</span>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[var(--brand-text-mid)]]">{d?.reason || d?.flag || '—'}</span>
                  <span className="text-[var(--brand-text-faint)]] font-mono">{formatNumber(d?.toxicScore || d?.score)}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
