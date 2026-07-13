import React from 'react';
import { Card } from '../../shared';
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

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Price history */}
        <Card title="Price history (90d)">
          <div className="bg-[var(--brand-surface-0)]] border border-[var(--brand-border-2)]] rounded p-3">
            <Sparkline values={page?.priceTrend || []} tone="info" />
          </div>
        </Card>

        {/* Stock timeline */}
        <Card title="Stock timeline">
          <div className="bg-[var(--brand-surface-0)]] border border-[var(--brand-border-2)]] rounded p-3">
            <Sparkline values={page?.stockTimeline || page?.stockHealthTrend || []} tone="good" />
          </div>
        </Card>

        {/* Review count growth */}
        <Card title="Review count growth">
          <div className="bg-[var(--brand-surface-0)]] border border-[var(--brand-border-2)]] rounded p-3">
            <Sparkline values={page?.reviewGrowthTrend || []} tone="good" />
          </div>
          {page?.reviewGrowthNote && (
            <div className="text-[10px] text-[var(--brand-text-faint)]] mt-2">{page.reviewGrowthNote}</div>
          )}
        </Card>

        {/* Rank trend */}
        <Card title="Rank trend (organic)">
          <div className="bg-[var(--brand-surface-0)]] border border-[var(--brand-border-2)]] rounded p-3">
            <Sparkline values={page?.rankTrend || []} tone="info" />
          </div>
          {page?.rankNote && (
            <div className="text-[10px] text-[var(--brand-text-faint)]] mt-2">{page.rankNote}</div>
          )}
        </Card>
      </div>
    </div>
  );
}
