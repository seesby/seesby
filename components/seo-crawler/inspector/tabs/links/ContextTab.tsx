import React from 'react';
import {
  DataRow, Card, MetricPill, StatusBadge,
  formatNumber,
} from '../../shared';

export default function ContextTab({ page }: { page: any }) {
  // Surrounding text
  const surroundingText = page?.linkSurroundingText || page?.linkContext || page?.anchorContextText || '—';
  const positionInSource = page?.linkPositionInSource || page?.linkParagraphPosition || '—';
  const domLocation = page?.linkDomLocation || page?.linkDomPath || '—';
  const nearHeading = page?.linkNearHeading || '—';
  const surroundingLinksCount = Number(page?.linkSurroundingLinksCount || 0);
  const surroundingLinksDetail = page?.linkSurroundingLinksDetail || '—';

  // Context quality
  const topicalRelevance = page?.linkTopicalRelevance || '—';
  const editorialContext = page?.linkEditorialContext || '—';
  const isBoilerplate = page?.linkIsBoilerplate ?? page?.linkBoilerplate;
  const boilerplateCheck = isBoilerplate === true ? 'yes' : isBoilerplate === false ? 'no' : '—';

  // Aggregate placement (supporting data)
  const navigationLinks = Number(page?.navigationLinks || 0);
  const inlineLinks = Number(page?.inlineLinks || 0);
  const footerLinks = Number(page?.footerLinks || 0);
  const sidebarLinks = Number(page?.sidebarLinks || 0);
  const breadcrumbLinks = Number(page?.breadcrumbLinks || 0);
  const totalOutContext = navigationLinks + inlineLinks + footerLinks + sidebarLinks + breadcrumbLinks;
  const contextualRatio = totalOutContext > 0 ? Math.round((inlineLinks / totalOutContext) * 100) : 0;

  // Incoming link context
  const inlinkContextNav = Number(page?.inlinkNavigation || 0);
  const inlinkContextContent = Number(page?.inlinkContextual || 0);
  const inlinkContextFooter = Number(page?.inlinkFooter || 0);
  const inlinkContextSidebar = Number(page?.inlinkSidebar || 0);
  const inlinkTotal = inlinkContextNav + inlinkContextContent + inlinkContextFooter + inlinkContextSidebar;
  const inlinkContextualRatio = inlinkTotal > 0 ? Math.round((inlinkContextContent / inlinkTotal) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Quick metrics */}
      <div className="grid grid-cols-4 gap-2">
        <MetricPill label="Contextual Out" value={totalOutContext > 0 ? `${contextualRatio}%` : '—'} good={contextualRatio >= 30} />
        <MetricPill label="Contextual In" value={inlinkTotal > 0 ? `${inlinkContextualRatio}%` : '—'} good={inlinkContextualRatio >= 40} />
        <MetricPill label="Surrounding" value={surroundingLinksCount > 0 ? `${surroundingLinksCount} links` : '—'} />
        <MetricPill label="Placement" value={totalOutContext > 0 ? formatNumber(totalOutContext) : '—'} />
      </div>

      {/* Badges */}
      {(isBoilerplate === true || topicalRelevance === 'low' || editorialContext === 'footer' || editorialContext === 'sidebar') && (
        <div className="flex flex-wrap gap-1.5">
          {isBoilerplate === true && <StatusBadge status="warn" label="Boilerplate context" />}
          {topicalRelevance === 'low' && <StatusBadge status="warn" label="Low topical relevance" />}
          {editorialContext === 'footer' && <StatusBadge status="info" label="Footer placement" />}
          {editorialContext === 'sidebar' && <StatusBadge status="info" label="Sidebar placement" />}
        </div>
      )}

      {/* Wireframe layout: Surrounding text (full width) */}
      <Card title="Surrounding text">
        <div className="mb-3 pb-3 border-b border-[var(--brand-surface-2)]]">
          <div className="text-[11px] text-[var(--brand-text-mid)]] leading-relaxed">
            {surroundingText !== '—'
              ? <span>"…{surroundingText}…"</span>
              : <span className="italic text-[var(--brand-text-faint)]]">No surrounding text data available.</span>
            }
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 min-w-0">
          <DataRow label="Position in source" value={positionInSource} />
          <DataRow label="DOM location" value={domLocation} mono />
          <DataRow label="Near heading" value={nearHeading} />
          <DataRow label="Surrounding links" value={surroundingLinksCount > 0 ? `${surroundingLinksCount} (${surroundingLinksDetail})` : '—'} />
        </div>
      </Card>

      {/* Second row: Context quality + Aggregate placement */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card title="Context quality">
          <DataRow label="Topical relevance vs target" value={topicalRelevance} status={topicalRelevance === 'high' ? 'pass' : topicalRelevance === 'medium' ? 'info' : topicalRelevance !== '—' ? 'warn' : 'info'} />
          <DataRow label="Editorial context" value={editorialContext} status={editorialContext === 'mid-article' || editorialContext === 'in-content' ? 'pass' : editorialContext !== '—' ? 'info' : 'info'} />
          <DataRow label="Boilerplate?" value={boilerplateCheck} status={isBoilerplate === true ? 'warn' : isBoilerplate === false ? 'pass' : 'info'} />
        </Card>

        <Card title="Aggregate placement">
          <PlacementBar label="Navigation" count={navigationLinks} total={totalOutContext} color="bg-blue-500" />
          <PlacementBar label="Inline / Content" count={inlineLinks} total={totalOutContext} color="bg-green-500" />
          <PlacementBar label="Footer" count={footerLinks} total={totalOutContext} color="bg-orange-500" />
          <PlacementBar label="Sidebar" count={sidebarLinks} total={totalOutContext} color="bg-purple-500" />
          <PlacementBar label="Breadcrumb" count={breadcrumbLinks} total={totalOutContext} color="bg-teal-500" />
        </Card>
      </div>

      {/* Incoming link context */}
      {inlinkTotal > 0 && (
        <Card title="Incoming link context">
          <PlacementBar label="Navigation" count={inlinkContextNav} total={inlinkTotal} color="bg-blue-500" />
          <PlacementBar label="Content / Contextual" count={inlinkContextContent} total={inlinkTotal} color="bg-green-500" />
          <PlacementBar label="Footer" count={inlinkContextFooter} total={inlinkTotal} color="bg-orange-500" />
          <PlacementBar label="Sidebar" count={inlinkContextSidebar} total={inlinkTotal} color="bg-purple-500" />
        </Card>
      )}
    </div>
  );
}

function PlacementBar({ label, count, total, color }: {
  label: string; count: number; total: number; color: string;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="mb-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] text-[var(--brand-text-mid)]]">{label}</span>
        <span className="text-[11px] font-mono text-[var(--brand-text-mid)]]">{formatNumber(count)} ({pct.toFixed(1)}%)</span>
      </div>
      <div className="h-[6px] bg-[var(--brand-surface-2)]] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
    </div>
  );
}
