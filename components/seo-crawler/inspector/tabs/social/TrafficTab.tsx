import React from 'react';
import {
  DataRow, Card, MetricPill, TruncatedUrl, StatusBadge,
  formatNumber, formatPercent,
} from '../../shared';
import { Sparkline } from '../../../right-sidebar/_shared';

export default function TrafficTab({ page, hasTrend }: { page: any; hasTrend?: boolean }) {
  const socialTraffic = page?.socialTrafficSessions ?? page?.trafficFromSocial ?? 0;
  const trafficByChannel = page?.socialTrafficByChannel || page?.trafficBySocialChannel || [];
  const topLandingPages = page?.socialTopLandingPages || page?.topLandingPagesFromSocial || [];
  const convRate = page?.socialConversionRate ?? page?.conversionFromSocial ?? 0;
  const bounceRate = page?.socialBounceRate ?? page?.bounceRateFromSocial ?? 0;
  const avgSessionDuration = page?.socialAvgSessionDuration ?? page?.avgSessionFromSocial ?? 0;
  const pagesPerSession = page?.socialPagesPerSession ?? 0;
  const revenue = page?.socialRevenue ?? 0;
  const goalCompletions = page?.socialGoalCompletions ?? 0;

  return (
    <div className="space-y-4">
      {/* Quick metrics */}
      <div className="grid grid-cols-5 gap-2">
        <MetricPill label="Sessions" value={formatNumber(socialTraffic)} good={socialTraffic > 0} />
        <MetricPill label="Conv. Rate" value={formatPercent(convRate)} good={Number(convRate) >= 0.02} />
        <MetricPill label="Revenue" value={revenue ? `$${formatNumber(revenue, { maximumFractionDigits: 0 })}` : '—'} good={revenue > 0} />
        <MetricPill label="Goals" value={formatNumber(goalCompletions)} good={goalCompletions > 0} />
        <MetricPill label="Bounce" value={formatPercent(bounceRate)} good={Number(bounceRate) < 0.5} />
      </div>

      {/* Traffic trend */}
      {hasTrend && (
        <Card title="Social Traffic Trend">
          <div className="bg-[var(--brand-surface-0)] border border-[var(--brand-border-2)] rounded p-3">
            <Sparkline values={page?.socialTrafficTrend || []} tone="info" />
          </div>
        </Card>
      )}

      {/* 2-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Traffic Overview */}
        <Card title="Traffic Overview">
          <DataRow label="Social Sessions" value={formatNumber(socialTraffic)} />
          <DataRow label="Conv. Rate" value={formatPercent(convRate)} status={Number(convRate) >= 0.02 ? 'pass' : 'warn'} />
          <DataRow label="Revenue" value={revenue ? `$${formatNumber(revenue, { maximumFractionDigits: 2 })}` : '—'} />
          <DataRow label="Goal Completions" value={formatNumber(goalCompletions)} />
          <DataRow label="Bounce Rate" value={formatPercent(bounceRate)} status={Number(bounceRate) < 0.5 ? 'pass' : 'warn'} />
          <DataRow label="Avg Session" value={avgSessionDuration ? `${Math.round(avgSessionDuration / 1000)}s` : '—'} />
          <DataRow label="Pages/Session" value={pagesPerSession ? Number(pagesPerSession).toFixed(1) : '—'} />
        </Card>

        {/* Channel Breakdown */}
        <Card title="Channel Breakdown">
          {trafficByChannel.length > 0 ? trafficByChannel.map((ch: any, i: number) => {
            const channel = ch.channel || ch.platform || ch.name || `Channel ${i + 1}`;
            const sessions = ch.sessions || ch.visits || 0;
            const pct = socialTraffic > 0 ? (sessions / socialTraffic) * 100 : 0;
            return (
              <div key={i} className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[12px] text-[var(--brand-text-mid)]">{channel}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[var(--brand-text-mid)]">{formatNumber(sessions)}</span>
                    <span className="text-[10px] text-[var(--brand-text-faint)]">{pct.toFixed(0)}%</span>
                  </div>
                </div>
                <div className="w-full bg-[var(--brand-surface-3)] rounded h-1.5">
                  <div
                    className="bg-blue-500 rounded h-1.5 transition-all"
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
              </div>
            );
          }) : (
            <div className="text-[11px] text-[var(--brand-text-faint)]">No channel data available</div>
          )}
        </Card>
      </div>

      {/* Top Landing Pages */}
      <Card title="Top Landing Pages">
        {topLandingPages.length > 0 ? (
          <div className="space-y-2">
            {topLandingPages.slice(0, 8).map((lp: any, i: number) => {
              const url = typeof lp === 'string' ? lp : lp.url || '';
              const sessions = typeof lp === 'object' ? (lp.sessions || lp.visits || 0) : 0;
              const conversions = typeof lp === 'object' ? (lp.conversions || lp.goals || 0) : 0;
              const bounce = typeof lp === 'object' ? (lp.bounceRate ?? 0) : 0;
              return (
                <div key={i} className="py-2 border-b border-[var(--brand-surface-2)] last:border-0">
                  <TruncatedUrl url={url} />
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-[var(--brand-text-mid)]">
                    {sessions > 0 && <span>{formatNumber(sessions)} sessions</span>}
                    {conversions > 0 && <span>{conversions} conv</span>}
                    {bounce > 0 && <span>{formatPercent(bounce)} bounce</span>}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-[11px] text-[var(--brand-text-faint)]">No landing page data available</div>
        )}
      </Card>
    </div>
  );
}
