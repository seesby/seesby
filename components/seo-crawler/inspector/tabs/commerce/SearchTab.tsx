import React from 'react';
import { DataRow, Card, MetricPill, formatNumber, formatPercent } from '../../shared';

export default function SearchTab({ page, hasTrend }: { page: any; hasTrend?: boolean }) {
  const gscClicks = page?.gscClicks ?? page?.searchClicks ?? 0;
  const gscImpressions = page?.gscImpressions ?? page?.searchImpressions ?? 0;
  const gscPosition = page?.gscPosition ?? page?.searchPosition ?? 0;
  const gscCtr = page?.gscCtr ?? page?.searchCtr ?? 0;

  const shoppingImpressions = page?.shoppingImpressions ?? 0;
  const shoppingClicks = page?.shoppingClicks ?? 0;
  const shoppingCtr = page?.shoppingCtr ?? 0;
  const shoppingCpc = page?.shoppingCpc ?? '—';

  const purchases = page?.purchases ?? page?.conversions ?? 0;
  const convRate = page?.conversionRate ?? 0;
  const revenue = page?.revenue ?? 0;

  const topQueries = page?.topQueries || page?.searchQueries || [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-5 gap-2">
        <MetricPill label="Clicks" value={formatNumber(gscClicks)} />
        <MetricPill label="Impr" value={formatNumber(gscImpressions)} />
        <MetricPill label="Pos" value={gscPosition ? Number(gscPosition).toFixed(1) : '—'} good={Number(gscPosition) > 0 && Number(gscPosition) <= 10} />
        <MetricPill label="CTR" value={formatPercent(gscCtr, 100)} good={Number(gscCtr) >= 0.03} />
        <MetricPill label="Purchases" value={formatNumber(purchases)} good={purchases > 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Organic */}
        <Card title="Organic">
          <DataRow label="Clicks" value={formatNumber(gscClicks)} />
          <DataRow label="Impr" value={formatNumber(gscImpressions)} />
          <DataRow label="Pos" value={gscPosition ? Number(gscPosition).toFixed(1) : '—'} />
          <DataRow label="CTR" value={formatPercent(gscCtr, 100)} />
        </Card>

        {/* Shopping */}
        <Card title="Shopping">
          <DataRow label="Impr" value={formatNumber(shoppingImpressions)} />
          <DataRow label="Clicks" value={formatNumber(shoppingClicks)} />
          <DataRow label="CTR" value={formatPercent(shoppingCtr, 100)} />
          <DataRow label="CPC" value={shoppingCpc !== '—' ? `$${shoppingCpc}` : '—'} />
        </Card>
      </div>

      {/* Top queries */}
      {topQueries.length > 0 && (
        <Card title="Top queries">
          <div className="bg-[var(--brand-surface-0)] border border-[var(--brand-surface-3)] rounded-lg overflow-hidden">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-[var(--brand-surface-3)]">
                  <th className="px-3 py-1.5 text-left text-[9px] text-[var(--brand-border-2)] uppercase tracking-widest font-bold">Query</th>
                  <th className="px-3 py-1.5 text-left text-[9px] text-[var(--brand-border-2)] uppercase tracking-widest font-bold">Pos</th>
                  <th className="px-3 py-1.5 text-left text-[9px] text-[var(--brand-border-2)] uppercase tracking-widest font-bold">Clk</th>
                  <th className="px-3 py-1.5 text-left text-[9px] text-[var(--brand-border-2)] uppercase tracking-widest font-bold">CTR</th>
                </tr>
              </thead>
              <tbody>
                {topQueries.slice(0, 10).map((q: any, i: number) => (
                  <tr key={i} className="border-b border-[var(--brand-surface-2)] bg-[var(--brand-surface-0)] hover:bg-[var(--brand-surface-2)]">
                    <td className="px-3 py-1.5 text-[var(--brand-text-mid)] truncate max-w-[200px]">{q.query || q.keyword}</td>
                    <td className="px-3 py-1.5 text-[var(--brand-text-mid)]">{q.position ?? q.pos ?? '—'}</td>
                    <td className="px-3 py-1.5 text-[var(--brand-text-mid)]">{q.clicks ?? q.clk ?? '—'}</td>
                    <td className="px-3 py-1.5 text-[var(--brand-text-mid)]">{q.ctr ? formatPercent(q.ctr, 100) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Conversion */}
      <Card title="Conversion (if GA linked)">
        <DataRow label="Purchases" value={formatNumber(purchases)} />
        <DataRow label="Conv rate" value={formatPercent(convRate)} />
        <DataRow label="Revenue" value={revenue ? `$${formatNumber(revenue, { maximumFractionDigits: 0 })}` : '—'} />
      </Card>
    </div>
  );
}
