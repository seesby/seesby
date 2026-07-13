import React from 'react';
import {
  DataRow, MetricPill, Card, StatusBadge, TruncatedUrl,
  formatNumber, formatPercent, formatDuration, getActions,
} from '../../shared';
import { Sparkline } from '../../../right-sidebar/_shared';

function FlagRow({ label, fail }: { label: string; fail: boolean }) {
  return (
    <div className="flex items-center justify-between py-[3px] text-[11px]">
      <span className="text-[#666]">{label}</span>
      <span className={`text-[10px] font-medium ${fail ? 'text-[#F59E0B]' : 'text-[#22c55e]'}`}>
        {fail ? 'Yes' : 'No'}
      </span>
    </div>
  );
}

export default function SummaryTab({ page, hasTrend }: { page: any; hasTrend?: boolean }) {
  const actions = getActions(page);

  const frictionScore = page?.frictionScore ?? page?.uxFrictionScore;
  const conversionRate = page?.conversionRate ?? page?.uxConversionRate;
  const engagementRate = page?.engagementRate ?? page?.uxEngagementRate;
  const scrollDepth = page?.scrollDepth ?? page?.uxScrollDepth;
  const bounceRate = page?.bounceRate ?? page?.ux?.bounceRate;
  const avgTime = page?.avgTime ?? page?.ux?.avgTime;

  const rageClicks = page?.rageClicks ?? page?.ux?.rageClicks ?? 0;
  const deadClicks = page?.deadClicks ?? page?.ux?.deadClicks ?? 0;
  const errorClicks = page?.errorClicks ?? page?.ux?.errorClicks ?? 0;

  const lcp = page?.lcp ?? page?.cwv?.lcp;
  const cls = page?.cls ?? page?.cwv?.cls;
  const inp = page?.inp ?? page?.cwv?.inp;

  const cwvPass = lcp <= 2500 && cls <= 0.1 && inp <= 200;

  const uxScore = (() => {
    if (frictionScore > 0) return Math.max(0, 100 - Number(frictionScore));
    return Math.round(100 - (Number(bounceRate) || 0) * 40 - (1 - (Number(scrollDepth) || 0) / 100) * 30);
  })();
  const scoreTone = uxScore >= 80 ? 'good' : uxScore >= 50 ? 'mid' : 'bad';
  const gaugeColor = scoreTone === 'good' ? '#22c55e' : scoreTone === 'mid' ? '#f59e0b' : '#ef4444';

  const topIssues = actions
    .filter((a: any) => /ux|friction|click|form|cwv|scroll|engagement|conversion|bounce/i.test(a.label || a.title || ''))
    .slice(0, 5);

  return (
    <div className="space-y-4">
      {/* Hero strip */}
      <div className="flex items-center gap-3 p-2.5 rounded-lg bg-gradient-to-r from-[#0f0f0f] to-[#0a0a0a] border border-[#1a1a1a]">
        <div className="flex-1 min-w-0">
          <div className="text-[13px] text-white font-semibold truncate">{page?.title || 'Untitled'}</div>
          <div className="text-[11px] text-[#555] font-mono truncate mt-0.5">{page?.url}</div>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <div className="relative w-10 h-10">
            <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15" fill="none" stroke="#1a1a1a" strokeWidth="3" />
              <circle cx="18" cy="18" r="15" fill="none" stroke={gaugeColor} strokeWidth="3" strokeDasharray={`${(uxScore / 100) * 94.25} 94.25`} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[11px] font-bold text-white">{uxScore}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick metrics */}
      <div className="grid grid-cols-5 gap-2">
        <MetricPill label="Score" value={String(uxScore)} good={uxScore >= 80} />
        <MetricPill label="Conv" value={formatPercent(conversionRate)} good={Number(conversionRate) >= 0.03} />
        <MetricPill label="Bounce" value={formatPercent(bounceRate)} good={Number(bounceRate) <= 0.4} />
        <MetricPill label="Scroll" value={formatPercent(scrollDepth)} good={Number(scrollDepth) >= 60} />
        <MetricPill label="CWV" value={cwvPass ? 'Pass' : 'Fail'} good={cwvPass} />
      </div>

      {/* 2-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* UX Overview */}
        <div className="bg-[#0e0e0e] border border-[#1a1a1a] rounded-lg p-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#444] mb-2.5">UX Overview</div>
          <DataRow label="Friction Score" value={formatNumber(frictionScore)} status={Number(frictionScore) <= 30 ? 'pass' : Number(frictionScore) <= 60 ? 'warn' : 'fail'} />
          <DataRow label="Conversion" value={formatPercent(conversionRate)} />
          <DataRow label="Engagement" value={formatPercent(engagementRate)} />
          <DataRow label="Scroll Depth" value={formatPercent(scrollDepth)} />
          <DataRow label="Bounce Rate" value={formatPercent(bounceRate)} status={Number(bounceRate) <= 0.4 ? 'pass' : Number(bounceRate) <= 0.6 ? 'warn' : 'fail'} />
          <DataRow label="Avg Time" value={formatDuration(Number(avgTime) * 1000)} />
        </div>

        {/* Friction Signals */}
        <Card title="Friction Signals">
          <DataRow label="Rage Clicks" value={formatNumber(rageClicks)} status={rageClicks > 0 ? 'fail' : 'pass'} />
          <DataRow label="Dead Clicks" value={formatNumber(deadClicks)} status={deadClicks > 0 ? 'warn' : 'pass'} />
          <DataRow label="Error Clicks" value={formatNumber(errorClicks)} status={errorClicks > 0 ? 'fail' : 'pass'} />
          <DataRow label="CWV LCP" value={formatDuration(lcp)} status={Number(lcp) <= 2500 ? 'pass' : Number(lcp) <= 4000 ? 'warn' : 'fail'} />
          <DataRow label="CWV CLS" value={formatNumber(cls, { maximumFractionDigits: 3 })} status={Number(cls) <= 0.1 ? 'pass' : Number(cls) <= 0.25 ? 'warn' : 'fail'} />
          <DataRow label="CWV INP" value={formatDuration(inp)} status={Number(inp) <= 200 ? 'pass' : Number(inp) <= 500 ? 'warn' : 'fail'} />
        </Card>

        {/* Risks */}
        <Card title="Risks">
          <FlagRow label="High friction" fail={Number(frictionScore) > 60} />
          <FlagRow label="Low scroll depth" fail={Number(scrollDepth) < 40} />
          <FlagRow label="High bounce rate" fail={Number(bounceRate) > 0.6} />
          <FlagRow label="Rage clicks" fail={rageClicks > 0} />
          <FlagRow label="Dead clicks" fail={deadClicks > 0} />
          <FlagRow label="Error clicks" fail={errorClicks > 0} />
          <FlagRow label="CWV poor" fail={!cwvPass} />
        </Card>

        {/* Page Info */}
        <Card title="Page">
          <DataRow label="URL" value={<TruncatedUrl url={String(page?.url || '')} />} mono />
          <DataRow label="Title" value={page?.title || '\u2014'} />
          <DataRow label="Template" value={page?.template || '\u2014'} />
          <DataRow label="Device" value={page?.device || page?.isMobile ? 'Mobile' : 'Desktop'} />
        </Card>
      </div>

      {/* Trend */}
      {hasTrend && (
        <Card title="Score Trend">
          <div className="bg-[#0a0a0a] border border-[#222] rounded p-3">
            <Sparkline values={page?.uxScoreTrend || page?.frictionScoreTrend || []} tone="warn" />
          </div>
        </Card>
      )}

      {/* Issues */}
      {topIssues.length > 0 && (
        <Card title={`Issues (${topIssues.length})`}>
          <div className="space-y-0">
            {topIssues.map((a: any, i: number) => (
              <div key={`${a.id}-${i}`} className="flex items-start gap-2.5 py-2 border-b border-[#111] last:border-b-0">
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
                  <div className="text-[11px] text-[#ccc] font-medium">{a.label}</div>
                  {(a.description || a.reason) && (
                    <div className="text-[10px] text-[#444] mt-0.5 line-clamp-1">{a.description || a.reason}</div>
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
