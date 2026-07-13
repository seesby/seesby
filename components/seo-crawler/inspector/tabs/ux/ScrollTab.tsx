import React from 'react';
import {
  DataRow, MetricPill, Card, StatusBadge, SectionHeader,
  formatNumber, formatPercent,
} from '../../shared';
import { Sparkline } from '../../../right-sidebar/_shared';

export default function ScrollTab({ page, hasTrend }: { page: any; hasTrend?: boolean }) {
  const ux = page?.ux || {};
  const scrollDepth = page?.scrollDepth ?? ux.scrollDepth ?? 0;
  const maxScrollDepth = page?.maxScrollDepth ?? ux.maxScrollDepth ?? scrollDepth;
  const scrollDepthDistribution = page?.scrollDepthDistribution || ux.scrollDepthDistribution;
  const foldData = page?.foldData || ux.foldData;
  const timeToFirstScroll = page?.timeToFirstScroll ?? ux.timeToFirstScroll;
  const scrollSpeed = page?.scrollSpeed ?? ux.scrollSpeed;
  const backScrollRate = page?.backScrollRate ?? ux.backScrollRate;

  const deep = scrollDepthDistribution?.deep ?? (scrollDepth >= 75 ? 1 : 0);
  const medium = scrollDepthDistribution?.medium ?? (scrollDepth >= 40 && scrollDepth < 75 ? 1 : 0);
  const shallow = scrollDepthDistribution?.shallow ?? (scrollDepth > 0 && scrollDepth < 40 ? 1 : 0);
  const none = scrollDepthDistribution?.none ?? (scrollDepth === 0 ? 1 : 0);
  const total = deep + medium + shallow + none || 1;

  const heroVisibility = foldData?.hero ?? 100;
  const ctaVisibility = foldData?.cta ?? 0;
  const footerVisibility = foldData?.footer ?? 0;

  return (
    <div className="space-y-4">
      {/* Quick metrics */}
      <div className="grid grid-cols-5 gap-2">
        <MetricPill label="Avg Scroll" value={`${Math.round(scrollDepth)}%`} good={scrollDepth >= 60} />
        <MetricPill label="Max Scroll" value={`${Math.round(maxScrollDepth)}%`} />
        <MetricPill label="Deep 75%+" value={formatNumber(deep)} good={deep > medium + shallow} />
        <MetricPill label="Shallow" value={formatNumber(shallow + none)} good={shallow + none === 0} />
        <MetricPill label="Time to Scroll" value={timeToFirstScroll ? `${Math.round(timeToFirstScroll)}ms` : '\u2014'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Scroll Distribution */}
        <Card title="Scroll Distribution">
          <div className="space-y-3">
            {[
              { label: 'Deep (75%+)', value: deep, color: 'bg-green-500', textColor: 'text-green-400' },
              { label: 'Medium (40-75%)', value: medium, color: 'bg-orange-500', textColor: 'text-orange-400' },
              { label: 'Shallow (<40%)', value: shallow, color: 'bg-red-500', textColor: 'text-red-400' },
              { label: 'None (0%)', value: none, color: 'bg-[#64748b]', textColor: 'text-[var(--brand-text-mid)]]' },
            ].map((item) => {
              const pct = total > 0 ? (item.value / total) * 100 : 0;
              return (
                <div key={item.label} className="bg-[var(--brand-surface-0)]] border border-[var(--brand-border-2)]] rounded px-3 py-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] text-[var(--brand-text-mid)]]">{item.label}</span>
                    <span className={`text-[11px] ${item.textColor}`}>{formatNumber(item.value)} ({pct.toFixed(0)}%)</span>
                  </div>
                  <div className="w-full bg-[var(--brand-surface-3)]] rounded h-2">
                    <div className={`rounded h-2 transition-all ${item.color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Fold Analysis */}
        <Card title="Fold Analysis">
          <DataRow label="Hero visibility" value={`${Math.round(heroVisibility)}%`} status={heroVisibility >= 90 ? 'pass' : 'warn'} />
          <DataRow label="CTA visibility" value={`${Math.round(ctaVisibility)}%`} status={ctaVisibility >= 50 ? 'pass' : ctaVisibility >= 20 ? 'warn' : 'fail'} />
          <DataRow label="Footer visibility" value={`${Math.round(footerVisibility)}%`} status={footerVisibility >= 10 ? 'pass' : 'info'} />
          <div className="mt-3 pt-3 border-t border-[var(--brand-surface-2)]]">
            <DataRow label="Scroll Depth" value={`${Math.round(scrollDepth)}%`} status={scrollDepth >= 60 ? 'pass' : scrollDepth >= 40 ? 'warn' : 'fail'} />
            <DataRow label="Max Depth" value={`${Math.round(maxScrollDepth)}%`} />
            <DataRow label="Back Scroll Rate" value={backScrollRate ? `${Math.round(backScrollRate * 100)}%` : '\u2014'} />
          </div>
        </Card>
      </div>

      {/* Scroll Speed */}
      {scrollSpeed && (
        <Card title="Scroll Behavior">
          <DataRow label="Avg Scroll Speed" value={scrollSpeed ? `${Math.round(scrollSpeed)}px/s` : '\u2014'} />
          <DataRow label="Time to First Scroll" value={timeToFirstScroll ? `${Math.round(timeToFirstScroll)}ms` : '\u2014'} />
          <DataRow label="Back Scroll Rate" value={backScrollRate ? `${Math.round(backScrollRate * 100)}%` : '\u2014'} status={Number(backScrollRate) > 0.3 ? 'warn' : 'pass'} />
        </Card>
      )}

      {/* Scroll Depth Trend */}
      {hasTrend && (
        <Card title="Scroll Depth Trend">
          <div className="bg-[var(--brand-surface-0)]] border border-[var(--brand-border-2)]] rounded p-3">
            <Sparkline values={page?.scrollDepthTrend || []} tone="info" />
          </div>
        </Card>
      )}

      {/* Attention Zones */}
      {foldData?.zones && foldData.zones.length > 0 && (
        <Card title="Attention Zones">
          <div className="space-y-2">
            {foldData.zones.slice(0, 8).map((z: any, i: number) => (
              <div key={i} className="bg-[var(--brand-surface-0)]] border border-[var(--brand-border-2)]] rounded px-3 py-2 flex items-center justify-between">
                <span className="text-[12px] text-[var(--brand-text-mid)]]">{z.label || z.element || `Zone ${i + 1}`}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[var(--brand-text-mid)]]">{Math.round(z.visibility || z.pct || 0)}%</span>
                  <StatusBadge
                    status={(z.visibility || z.pct || 0) >= 70 ? 'pass' : (z.visibility || z.pct || 0) >= 30 ? 'warn' : 'fail'}
                    label={(z.visibility || z.pct || 0) >= 70 ? 'High' : (z.visibility || z.pct || 0) >= 30 ? 'Med' : 'Low'}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
