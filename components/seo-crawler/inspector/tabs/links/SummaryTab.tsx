import React from 'react';
import {
  DataRow, Card, MetricPill, StatusBadge,
  formatNumber, getMetric, getActions, formatDate,
} from '../../shared';
import { DeltaChip } from '../../../right-sidebar/_shared';

export default function SummaryTab({ page, hasTrend }: { page: any; hasTrend?: boolean }) {
  const actions = getActions(page);
  const linkIssues = actions
    .filter((a: any) => /link|backlink|anchor|orphan|broken|internal|external|toxic|referring/i.test(a.label || a.title || ''))
    .slice(0, 5);

  // Core counts
  const inlinks = Number(page?.inlinks || 0);
  const outlinks = Number(page?.outlinks || 0);
  const backlinks = Number(page?.backlinkCount || page?.totalBacklinks || 0);
  const referringDomains = Number(page?.uniqueReferringDomains || 0);
  const authorityScore = Number(getMetric(page, 'pageAuthority') || page?.authorityScore || page?.pageRank || 0);
  const linkHealth = Number(page?.linkHealthScore || page?.healthScore || 0);

  const toxicScore = Number(page?.toxicLinkScore || page?.toxicScore || getMetric(page, 'toxicLinkScore') || 0);
  const toxicLinks = Number(page?.toxicLinkCount || 0);
  const backlinksDelta = hasTrend ? Number(page?.backlinksDelta || 0) : 0;

  const healthTone = linkHealth >= 70 ? 'good' : linkHealth >= 40 ? 'mid' : 'bad';

  // Edge details
  const linkType = page?.linkType || (Number(page?.externalOutlinks || 0) > 0 ? 'External' : 'Internal');
  const sourceUrl = page?.topReferringDomain || page?.sourceDomain || '—';
  const targetUrl = page?.targetUrl || page?.primaryOutlink || '—';
  const protocol = page?.linkProtocol || page?.protocol || 'https';

  // Anchor
  const anchorText = page?.primaryAnchorText || page?.topAnchorText || page?.anchorText || '—';
  const anchorLength = anchorText !== '—' ? anchorText.length : 0;
  const anchorType = page?.anchorType || page?.anchorClassification || '—';

  // Attributes
  const rel = page?.anchorRel || page?.linkRel || '—';
  const target = page?.linkTarget || '—';
  const referrerPolicy = page?.linkReferrerPolicy || '—';

  // Dates
  const firstSeen = page?.linkFirstSeen || page?.firstSeen || '—';
  const lastSeen = page?.linkLastSeen || page?.lastSeen || '—';
  const lostDate = page?.linkLostDate || '—';
  const linkAge = page?.linkAge || '—';

  // Scores
  const linkValue = page?.linkValue || '—';
  const referringDr = Number(page?.sourceDomainRating || page?.sourceDr || page?.domainRating || page?.dr || 0);

  // Context strength
  const inContent = page?.linkInContent ?? (page?.linkEditorialContext === 'mid-article' || page?.linkEditorialContext === 'in-content');
  const nearHeading = page?.linkNearHeading || '—';
  const surroundedBy = page?.linkSurroundedBy || '—';

  // Status
  const sourceStatus = Number(page?.sourceStatusCode || page?.linkSourceStatus || 0);
  const targetStatus = Number(page?.targetStatusCode || page?.linkTargetStatus || 0);

  // Classification
  const isNatural = page?.linkNatural ?? page?.linkIsNatural;
  const isToxic = toxicScore >= 60 || toxicLinks > 0;

  return (
    <div className="space-y-4">
      {/* Hero strip */}
      <div className="flex items-center gap-3 p-2.5 rounded-lg bg-gradient-to-r from-[var(--brand-surface-1)] to-[var(--brand-surface-0)] border border-[var(--brand-surface-3)]">
        <div className="flex-1 min-w-0">
          <div className="text-[13px] text-[var(--brand-text-strong)] font-semibold truncate">
            {getMetric(page, 'title') || page?.title || 'Untitled'}
          </div>
          <div className="text-[11px] text-[var(--brand-text-faint)] font-mono truncate mt-0.5">{page?.url}</div>
        </div>
        {linkHealth > 0 && (
          <div className="shrink-0 flex items-center gap-2">
            <div className="relative w-10 h-10">
              <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15" fill="none" stroke="bg-[var(--brand-surface-3)]" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15" fill="none"
                  stroke={healthTone === 'good' ? '#22c55e' : healthTone === 'mid' ? '#f59e0b' : '#ef4444'}
                  strokeWidth="3"
                  strokeDasharray={`${(linkHealth / 100) * 94.25} 94.25`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-[var(--brand-text-strong)]">{linkHealth}</span>
            </div>
          </div>
        )}
      </div>

      {/* Quick metrics */}
      <div className="grid grid-cols-5 gap-2">
        <MetricPill label="Inlinks" value={formatNumber(inlinks)} good={inlinks > 0} />
        <MetricPill label="Outlinks" value={formatNumber(outlinks)} />
        <MetricPill label="Ref Domains" value={formatNumber(referringDomains)} good={referringDomains > 10} />
        <MetricPill label="Authority" value={formatNumber(authorityScore)} good={authorityScore >= 40} />
        <MetricPill label="Toxic" value={formatNumber(toxicLinks)} good={toxicLinks === 0} sub={toxicScore > 0 ? `Score ${toxicScore}` : undefined} />
      </div>

      {/* Wireframe layout: 4-column top row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card title="Edge">
          <DataRow label="Type" value={linkType} />
          <DataRow label="Source" value={sourceUrl} mono />
          <DataRow label="Target" value={targetUrl} mono />
          <DataRow label="Protocol" value={protocol} />
        </Card>

        <Card title="Anchor">
          <DataRow label="Text" value={anchorText !== '—' ? `"${anchorText}"` : '—'} />
          <DataRow label="Length" value={anchorLength > 0 ? `${anchorLength} ch` : '—'} />
          <DataRow label="Type" value={anchorType} />
        </Card>

        <Card title="Attributes">
          <DataRow label="Rel" value={rel} />
          <DataRow label="Target" value={target} />
          <DataRow label="ReferrerPolicy" value={referrerPolicy} />
        </Card>

        <Card title="Dates">
          <DataRow label="First" value={formatDate(firstSeen)} />
          <DataRow label="Last" value={formatDate(lastSeen)} />
          <DataRow label="Lost" value={formatDate(lostDate)} />
          <DataRow label="Age" value={linkAge} />
        </Card>
      </div>

      {/* Wireframe layout: 4-column bottom row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card title="Scores">
          <DataRow label="Link value" value={linkValue} />
          <DataRow label="Referring DR" value={referringDr > 0 ? formatNumber(referringDr) : '—'} />
        </Card>

        <Card title="Context strength">
          <DataRow label="In-content" value={inContent === true ? 'Yes' : inContent === false ? 'No' : '—'} status={inContent === true ? 'pass' : 'info'} />
          <DataRow label="Near heading" value={nearHeading} />
          <DataRow label="Surrounded by" value={surroundedBy} />
        </Card>

        <Card title="Status">
          <DataRow label="Source status" value={sourceStatus > 0 ? String(sourceStatus) : '—'} status={sourceStatus >= 200 && sourceStatus < 400 ? 'pass' : sourceStatus > 0 ? 'fail' : 'info'} />
          <DataRow label="Target status" value={targetStatus > 0 ? String(targetStatus) : '—'} status={targetStatus >= 200 && targetStatus < 400 ? 'pass' : targetStatus > 0 ? 'fail' : 'info'} />
        </Card>

        <Card title="Classification">
          <DataRow label="Natural" value={isNatural === true ? 'Yes' : isNatural === false ? 'No' : '—'} status={isNatural === true ? 'pass' : 'info'} />
          <DataRow label="Toxic" value={isToxic ? 'Yes' : 'No'} status={isToxic ? 'fail' : 'pass'} />
        </Card>
      </div>

      {/* Issues */}
      {linkIssues.length > 0 && (
        <Card title={`Issues (${linkIssues.length})`}>
          <div className="space-y-0">
            {linkIssues.map((a: any, i: number) => (
              <div key={`${a.id}-${i}`} className="flex items-start gap-2.5 py-2 border-b border-[var(--brand-surface-2)] last:border-b-0">
                <div className="mt-0.5">
                  {a.type === 'error' || a.severity === 'CRITICAL' || a.severity === 'HIGH' ? (
                    <span className="block w-1.5 h-1.5 rounded-full bg-[#ef4444]" />
                  ) : a.type === 'warning' || a.severity === 'MEDIUM' ? (
                    <span className="block w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
                  ) : (
                    <span className="block w-1.5 h-1.5 rounded-full bg-[#6b7280]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] text-[var(--brand-text-mid)] font-medium">{a.label}</div>
                  {(a.description || a.reason) && (
                    <div className="text-[10px] text-[var(--brand-border-2)] mt-0.5 line-clamp-1">{a.description || a.reason}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
