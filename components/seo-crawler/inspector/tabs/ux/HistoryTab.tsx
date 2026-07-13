import React from 'react';
import {
  DataRow, MetricPill, Card, SectionHeader,
  formatNumber, formatPercent, formatDuration, formatSignedNumber,
} from '../../shared';
import { Sparkline } from '../../../right-sidebar/_shared';

export default function HistoryTab({ page, hasTrend }: { page: any; hasTrend?: boolean }) {
  if (!hasTrend) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-[13px] text-[var(--brand-text-faint)] max-w-[280px]">
          Trend data available after 2+ crawls. Run another crawl to see historical trends.
        </div>
      </div>
    );
  }

  const frictionScore = page?.frictionScore ?? 0;
  const prevFrictionScore = page?.prevFrictionScore ?? 0;
  const conversionRate = page?.conversionRate ?? 0;
  const prevConversionRate = page?.prevConversionRate ?? 0;
  const scrollDepth = page?.scrollDepth ?? 0;
  const prevScrollDepth = page?.prevScrollDepth ?? 0;
  const engagementRate = page?.engagementRate ?? 0;
  const prevEngagementRate = page?.prevEngagementRate ?? 0;
  const bounceRate = page?.bounceRate ?? 0;
  const prevBounceRate = page?.prevBounceRate ?? 0;

  const lcp = page?.lcp ?? 0;
  const prevLcp = page?.prevLcp ?? 0;
  const cls = page?.cls ?? 0;
  const prevCls = page?.prevCls ?? 0;
  const inp = page?.inp ?? 0;
  const prevInp = page?.prevInp ?? 0;

  return (
    <div className="space-y-4">
      {/* Friction Score Trend */}
      <Card title="Friction Score">
        <div className="bg-[var(--brand-surface-0)] border border-[var(--brand-border-2)] rounded p-3 mb-3">
          <Sparkline values={page?.frictionScoreTrend || []} tone="warn" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <MetricPill label="Current" value={formatNumber(frictionScore)} />
          <MetricPill label="Previous" value={formatNumber(prevFrictionScore)} />
          <MetricPill label="Change" value={formatSignedNumber(frictionScore - prevFrictionScore)} good={frictionScore <= prevFrictionScore} />
        </div>
      </Card>

      {/* Conversion Rate Trend */}
      <Card title="Conversion Rate">
        <div className="bg-[var(--brand-surface-0)] border border-[var(--brand-border-2)] rounded p-3 mb-3">
          <Sparkline values={page?.conversionRateTrend || []} tone="good" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <MetricPill label="Current" value={formatPercent(conversionRate)} />
          <MetricPill label="Previous" value={formatPercent(prevConversionRate)} />
          <MetricPill label="Change" value={formatPercent(conversionRate - prevConversionRate)} good={conversionRate >= prevConversionRate} />
        </div>
      </Card>

      {/* Scroll Depth Trend */}
      <Card title="Scroll Depth">
        <div className="bg-[var(--brand-surface-0)] border border-[var(--brand-border-2)] rounded p-3 mb-3">
          <Sparkline values={page?.scrollDepthTrend || []} tone="info" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <MetricPill label="Current" value={formatPercent(scrollDepth)} />
          <MetricPill label="Previous" value={formatPercent(prevScrollDepth)} />
          <MetricPill label="Change" value={formatPercent(scrollDepth - prevScrollDepth)} good={scrollDepth >= prevScrollDepth} />
        </div>
      </Card>

      {/* Engagement Trend */}
      <Card title="Engagement">
        <div className="bg-[var(--brand-surface-0)] border border-[var(--brand-border-2)] rounded p-3 mb-3">
          <Sparkline values={page?.engagementRateTrend || []} tone="good" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <MetricPill label="Current" value={formatPercent(engagementRate)} />
          <MetricPill label="Previous" value={formatPercent(prevEngagementRate)} />
          <MetricPill label="Change" value={formatPercent(engagementRate - prevEngagementRate)} good={engagementRate >= prevEngagementRate} />
        </div>
      </Card>

      {/* Bounce Rate Trend */}
      <Card title="Bounce Rate">
        <div className="bg-[var(--brand-surface-0)] border border-[var(--brand-border-2)] rounded p-3 mb-3">
          <Sparkline values={page?.bounceRateTrend || []} tone="warn" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <MetricPill label="Current" value={formatPercent(bounceRate)} />
          <MetricPill label="Previous" value={formatPercent(prevBounceRate)} />
          <MetricPill label="Change" value={formatPercent(bounceRate - prevBounceRate)} good={bounceRate <= prevBounceRate} />
        </div>
      </Card>

      {/* CWV Changes */}
      <Card title="Core Web Vitals">
        <div className="bg-[var(--brand-surface-0)] border border-[var(--brand-border-2)] rounded p-3 mb-3">
          <Sparkline values={page?.cwvTrend || []} tone="info" />
        </div>
        <DataRow label="Current LCP" value={formatDuration(lcp)} />
        <DataRow label="Previous LCP" value={formatDuration(prevLcp)} />
        <DataRow label="Current CLS" value={formatNumber(cls, { maximumFractionDigits: 3 })} />
        <DataRow label="Previous CLS" value={formatNumber(prevCls, { maximumFractionDigits: 3 })} />
        <DataRow label="Current INP" value={formatDuration(inp)} />
        <DataRow label="Previous INP" value={formatDuration(prevInp)} />
      </Card>
    </div>
  );
}
