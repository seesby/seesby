import React from 'react';
import { DataRow, Card, MetricPill, formatNumber, formatPercent, formatSignedNumber } from '../../shared';
import { Sparkline } from '../../../right-sidebar/_shared';

export default function HistoryTab({ page, hasTrend }: { page: any; hasTrend?: boolean }) {
  if (!hasTrend) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-[13px] text-[var(--brand-text-faint)]] max-w-[280px]">
          Trend data available after 2+ crawls. Run another crawl to see historical trends.
        </div>
      </div>
    );
  }

  const qs = page?.qualityScore ?? page?.paidQualityScore ?? 0;
  const prevQs = page?.prevQualityScore ?? page?.prevQs ?? 0;
  const cpc = page?.cpc || page?.avgCpc || 0;
  const prevCpc = page?.prevCpc || 0;
  const roas = page?.roas || 0;
  const prevRoas = page?.prevRoas || 0;
  const spend = page?.spend30d || page?.spend || 0;
  const prevSpend = page?.prevSpend || 0;
  const conv = page?.conversions30d || page?.conversions || 0;
  const prevConv = page?.prevConversions || 0;
  const cpa = conv > 0 ? spend / conv : 0;
  const prevCpa = prevConv > 0 ? prevSpend / prevConv : 0;

  return (
    <div className="space-y-4">
      {/* Quality Score trend */}
      <Card title="Quality Score">
        <div className="bg-[var(--brand-surface-0)]] border border-[var(--brand-surface-2)]] rounded p-3 mb-3">
          <Sparkline values={page?.qualityScoreTrend || []} tone="info" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <MetricPill label="Current" value={qs ? String(qs) : '—'} good={qs >= 7} />
          <MetricPill label="Previous" value={prevQs ? String(prevQs) : '—'} />
          <MetricPill label="Change" value={formatSignedNumber(qs - prevQs)}
            good={(qs - prevQs) >= 0} />
        </div>
      </Card>

      {/* CPC trend */}
      <Card title="CPC">
        <div className="bg-[var(--brand-surface-0)]] border border-[var(--brand-surface-2)]] rounded p-3 mb-3">
          <Sparkline values={page?.cpcTrend || []} tone="info" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <MetricPill label="Current" value={cpc ? `$${formatNumber(cpc, { maximumFractionDigits: 2 })}` : '—'} />
          <MetricPill label="Previous" value={prevCpc ? `$${formatNumber(prevCpc, { maximumFractionDigits: 2 })}` : '—'} />
          <MetricPill label="Change" value={cpc && prevCpc ? `$${formatNumber(cpc - prevCpc, { maximumFractionDigits: 2 })}` : '—'}
            good={(cpc - prevCpc) <= 0} />
        </div>
      </Card>

      {/* ROAS trend */}
      <Card title="ROAS">
        <div className="bg-[var(--brand-surface-0)]] border border-[var(--brand-surface-2)]] rounded p-3 mb-3">
          <Sparkline values={page?.roasTrend || []} tone="good" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <MetricPill label="Current" value={roas ? `${formatNumber(roas, { maximumFractionDigits: 1 })}x` : '—'} />
          <MetricPill label="Previous" value={prevRoas ? `${formatNumber(prevRoas, { maximumFractionDigits: 1 })}x` : '—'} />
          <MetricPill label="Change" value={roas && prevRoas ? `${formatNumber(roas - prevRoas, { maximumFractionDigits: 1 })}x` : '—'}
            good={(roas - prevRoas) >= 0} />
        </div>
      </Card>

      {/* Spend + CPA trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card title="Spend">
          <div className="bg-[var(--brand-surface-0)]] border border-[var(--brand-surface-2)]] rounded p-3 mb-3">
            <Sparkline values={page?.spendTrend || []} tone="info" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <MetricPill label="Current" value={spend ? `$${formatNumber(spend, { maximumFractionDigits: 0 })}` : '—'} />
            <MetricPill label="Previous" value={prevSpend ? `$${formatNumber(prevSpend, { maximumFractionDigits: 0 })}` : '—'} />
          </div>
        </Card>

        <Card title="CPA">
          <div className="bg-[var(--brand-surface-0)]] border border-[var(--brand-surface-2)]] rounded p-3 mb-3">
            <Sparkline values={page?.cpaTrend || []} tone="info" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <MetricPill label="Current" value={cpa ? `$${formatNumber(cpa, { maximumFractionDigits: 0 })}` : '—'} />
            <MetricPill label="Previous" value={prevCpa ? `$${formatNumber(prevCpa, { maximumFractionDigits: 0 })}` : '—'} />
          </div>
        </Card>
      </div>
    </div>
  );
}
