import React from 'react';
import { DataRow, MetricCard, SectionHeader, StatusBadge, formatNumber, formatPercent } from '../../shared';
import { Sparkline } from '../../../right-sidebar/_shared';

export default function PackTab({ page, hasTrend }: { page: any; hasTrend?: boolean }) {
  const packScore = page?.localPackShare ?? page?.packVisibilityScore;
  const avgPosition = page?.packAveragePosition ?? page?.localPackAvgPosition;
  const topKeywords = page?.packTopKeywords || page?.localPackKeywords || [];
  const lostPositions = page?.packLostPositions || page?.localPackLostPositions || [];

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
        <MetricCard label="Pack Visibility" value={formatPercent(packScore)} color={Number(packScore) >= 0.3 ? 'text-green-400' : Number(packScore) >= 0.1 ? 'text-orange-400' : 'text-red-400'} />
        <MetricCard label="Avg Position" value={avgPosition ? formatNumber(avgPosition, { maximumFractionDigits: 1 }) : '—'} />
        <MetricCard label="Keywords in Pack" value={formatNumber(topKeywords.length)} />
      </div>

      {hasTrend && (
        <div className="mb-5">
          <SectionHeader title="Pack Position Trend" />
          <div className="bg-[var(--brand-surface-0)]] border border-[var(--brand-border-2)]] rounded p-3">
            <Sparkline values={page?.packPositionTrend || []} tone="info" />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 xl:gap-8">
        <div>
          <SectionHeader title="Pack Overview" />
          <DataRow label="Visibility Score" value={formatPercent(packScore)} status={Number(packScore) >= 0.3 ? 'pass' : Number(packScore) >= 0.1 ? 'warn' : 'fail'} />
          <DataRow label="Average Position" value={avgPosition ? formatNumber(avgPosition, { maximumFractionDigits: 1 }) : '—'} />
          <DataRow label="Total Keywords" value={formatNumber(topKeywords.length)} />
        </div>

        <div>
          <SectionHeader title="Top Keywords in Pack" />
          {topKeywords.length > 0 ? (
            <div className="space-y-2">
              {topKeywords.slice(0, 10).map((kw: any, i: number) => (
                <div key={i} className="bg-[var(--brand-surface-0)]] border border-[var(--brand-border-2)]] rounded px-3 py-2 flex items-center justify-between">
                  <span className="text-[12px] text-[var(--brand-text-mid)]]">{typeof kw === 'string' ? kw : kw.keyword || kw.query}</span>
                  <StatusBadge status="pass" label={`#${typeof kw === 'object' ? kw.position || '?' : '?'}`} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-[12px] text-[var(--brand-text-faint)]]">No keywords found in local pack.</div>
          )}
        </div>
      </div>

      {hasTrend && lostPositions.length > 0 && (
        <div className="mt-5">
          <SectionHeader title="Lost Positions" />
          <div className="space-y-2">
            {lostPositions.slice(0, 10).map((item: any, i: number) => (
              <div key={i} className="bg-[var(--brand-surface-0)]] border border-[var(--brand-border-2)]] rounded px-3 py-2 flex items-center justify-between">
                <span className="text-[12px] text-[var(--brand-text-mid)]]">{typeof item === 'string' ? item : item.keyword || item.query}</span>
                <StatusBadge status="fail" label={`Lost #${item.position || '?'}`} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
