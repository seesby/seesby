import React from 'react';
import { DataRow, StatusBadge, Card, MetricPill, formatNumber } from '../../shared';

export default function FeedStatusTab({ page, hasTrend }: { page: any; hasTrend?: boolean }) {
  const feedStatus = page?.gmcFeedStatus ?? page?.feedStatus ?? 'unknown';
  const feedId = page?.feedId ?? page?.gmcId ?? '—';
  const lastUpdate = page?.feedLastUpdate ?? page?.gmcLastUpdate ?? '—';
  const isPrimary = page?.feedPrimary ?? page?.gmcPrimary ?? true;

  const titleMatch = page?.feedTitleMatch ?? true;
  const priceMatch = page?.feedPriceMatch ?? true;
  const availMatch = page?.feedAvailMatch ?? true;
  const gtinMatch = page?.feedGtinMatch ?? true;
  const imageMatch = page?.feedImageMatch ?? true;

  const feedTitle = page?.feedTitle ?? page?.title ?? '—';
  const siteTitle = page?.siteTitle ?? page?.title ?? '—';
  const feedPrice = page?.feedPrice ?? page?.price ?? '—';
  const sitePrice = page?.sitePrice ?? page?.price ?? '—';
  const feedAvail = page?.feedAvailability ?? page?.availability ?? '—';
  const siteAvail = page?.siteAvailability ?? page?.availability ?? '—';

  const disapprovals = page?.feedDisapprovals ?? [];
  const warnings = page?.feedWarnings ?? [];
  const shoppingImpressions = page?.shoppingImpressions ?? 0;
  const freeListingImpressions = page?.freeListingImpressions ?? 0;

  const otherFeeds = page?.otherFeeds || [
    { name: 'Facebook', status: 'approved' },
    { name: 'Meta', status: 'approved' },
    { name: 'Bing', status: 'pending' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-5 gap-2">
        <MetricPill label="Status" value={feedStatus} good={feedStatus === 'approved'} />
        <MetricPill label="ID" value={feedId} />
        <MetricPill label="Primary" value={isPrimary ? 'Yes' : 'No'} good={isPrimary} />
        <MetricPill label="Shopping" value={formatNumber(shoppingImpressions)} />
        <MetricPill label="Free" value={formatNumber(freeListingImpressions)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-3">
        {/* Google Merchant */}
        <Card title="Google Merchant">
          <DataRow label="Status" value={feedStatus} status={feedStatus === 'approved' ? 'pass' : 'warn'} />
          <DataRow label="ID" value={feedId} mono />
          <DataRow label="Last upd." value={lastUpdate} />
          <DataRow label="Primary?" value={isPrimary ? 'yes' : 'no'} status={isPrimary ? 'pass' : 'warn'} />
        </Card>

        {/* Parity (feed vs site) */}
        <Card title="Parity (feed vs site)">
          <div className="bg-[var(--brand-surface-0)]] border border-[var(--brand-surface-3)]] rounded-lg overflow-hidden">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-[var(--brand-surface-3)]]">
                  <th className="px-3 py-1.5 text-left text-[9px] text-[var(--brand-border-2)]] uppercase tracking-widest font-bold">Field</th>
                  <th className="px-3 py-1.5 text-left text-[9px] text-[var(--brand-border-2)]] uppercase tracking-widest font-bold">Feed</th>
                  <th className="px-3 py-1.5 text-left text-[9px] text-[var(--brand-border-2)]] uppercase tracking-widest font-bold">Site</th>
                  <th className="px-3 py-1.5 text-left text-[9px] text-[var(--brand-border-2)]] uppercase tracking-widest font-bold">Match</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { field: 'title', feed: feedTitle, site: siteTitle, match: titleMatch },
                  { field: 'price', feed: `$${feedPrice}`, site: `$${sitePrice}`, match: priceMatch },
                  { field: 'availability', feed: feedAvail, site: siteAvail, match: availMatch },
                  { field: 'gtin', feed: '✓', site: '✓', match: gtinMatch },
                  { field: 'image', feed: 'url A', site: 'url A', match: imageMatch },
                ].map((row, i) => (
                  <tr key={i} className="border-b border-[var(--brand-surface-2)]] bg-[var(--brand-surface-0)]] hover:bg-[var(--brand-surface-2)]]">
                    <td className="px-3 py-1.5 text-[var(--brand-text-mid)]]">{row.field}</td>
                    <td className="px-3 py-1.5 text-[var(--brand-text-mid)]] truncate max-w-[100px]">{row.feed}</td>
                    <td className="px-3 py-1.5 text-[var(--brand-text-mid)]] truncate max-w-[100px]">{row.site}</td>
                    <td className="px-3 py-1.5">
                      <StatusBadge status={row.match ? 'pass' : 'fail'} label={row.match ? '✓' : '✗'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Disapprovals */}
        <Card title="Disapprovals">
          {Array.isArray(disapprovals) && disapprovals.length > 0 ? (
            disapprovals.map((d: any, i: number) => (
              <div key={i} className="text-[11px] text-[var(--brand-text-mid)]] py-1">{typeof d === 'string' ? d : d.message || d.reason}</div>
            ))
          ) : (
            <div className="text-[11px] text-[var(--brand-text-faint)]]">None</div>
          )}
        </Card>

        {/* Other feeds */}
        <Card title="Other feeds">
          {otherFeeds.map((f: any, i: number) => (
            <div key={i} className="flex items-center justify-between py-1">
              <span className="text-[11px] text-[var(--brand-text-mid)]]">{f.name}</span>
              <StatusBadge status={f.status === 'approved' ? 'pass' : f.status === 'pending' ? 'warn' : 'fail'} label={f.status} />
            </div>
          ))}
        </Card>

        {/* Impressions */}
        <Card title="Impressions">
          <DataRow label="Shopping" value={formatNumber(shoppingImpressions)} />
          <DataRow label="Free listings" value={formatNumber(freeListingImpressions)} />
        </Card>
      </div>

      {/* Warnings */}
      {Array.isArray(warnings) && warnings.length > 0 && (
        <Card title={`Warnings (${warnings.length})`}>
          {warnings.map((w: any, i: number) => (
            <div key={i} className="flex items-start gap-2 py-1">
              <span className="block w-1.5 h-1.5 rounded-full bg-[#f59e0b] mt-0.5 shrink-0" />
              <span className="text-[11px] text-[var(--brand-text-mid)]]">{typeof w === 'string' ? w : w.message || w.field}</span>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
