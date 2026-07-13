import React from 'react';
import {
  DataRow, MetricPill, Card, StatusBadge, SectionHeader,
  formatNumber, formatDuration,
} from '../../shared';
import { Sparkline } from '../../../right-sidebar/_shared';

export default function FrictionTab({ page, hasTrend }: { page: any; hasTrend?: boolean }) {
  const ux = page?.ux || {};
  const rageClicks = page?.rageClicks ?? ux.rageClicks ?? 0;
  const deadClicks = page?.deadClicks ?? ux.deadClicks ?? 0;
  const errorClicks = page?.errorClicks ?? ux.errorClicks ?? 0;
  const formAbandon = page?.formAbandonCount ?? ux.formAbandons ?? Math.max(0, (ux.formStarts || 0) - (ux.formCompletes || 0));
  const latency = page?.interactionLatency ?? ux.interactionLatency;
  const frictionScore = page?.frictionScore ?? page?.uxFrictionScore;

  const total = rageClicks + deadClicks + errorClicks || 1;

  const breakdown = [
    { type: 'Rage Clicks', count: rageClicks, severity: 'fail' as const, desc: 'Rapid clicks on same element' },
    { type: 'Dead Clicks', count: deadClicks, severity: 'warn' as const, desc: 'Clicks with no response' },
    { type: 'Error Clicks', count: errorClicks, severity: 'fail' as const, desc: 'Clicks triggering errors' },
    { type: 'Form Abandons', count: formAbandon, severity: 'warn' as const, desc: 'Started but not completed' },
  ];

  const worstPages = page?.worstFrictionPages || [];
  const frictionByElement = page?.frictionByElement || ux.frictionByElement || [];

  return (
    <div className="space-y-4">
      {/* Quick metrics */}
      <div className="grid grid-cols-5 gap-2">
        <MetricPill label="Score" value={formatNumber(frictionScore)} good={Number(frictionScore) <= 30} />
        <MetricPill label="Rage" value={formatNumber(rageClicks)} good={rageClicks === 0} />
        <MetricPill label="Dead" value={formatNumber(deadClicks)} good={deadClicks === 0} />
        <MetricPill label="Error" value={formatNumber(errorClicks)} good={errorClicks === 0} />
        <MetricPill label="Latency" value={latency ? `${Math.round(latency)}ms` : '\u2014'} good={Number(latency) <= 100} />
      </div>

      {/* Trend */}
      {hasTrend && (
        <Card title="Friction Trend">
          <div className="bg-[var(--brand-surface-0)] border border-[var(--brand-border-2)] rounded p-3">
            <Sparkline values={page?.frictionScoreTrend || []} tone="warn" />
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Score Breakdown */}
        <Card title="Score Breakdown">
          <DataRow label="Overall Score" value={formatNumber(frictionScore)} status={Number(frictionScore) <= 30 ? 'pass' : Number(frictionScore) <= 60 ? 'warn' : 'fail'} />
          <DataRow label="Interaction Latency" value={formatDuration(latency)} status={Number(latency) <= 100 ? 'pass' : Number(latency) <= 300 ? 'warn' : 'fail'} />
          {breakdown.map((item) => (
            <DataRow key={item.type} label={item.type} value={formatNumber(item.count)} status={item.count > 0 ? item.severity : 'pass'} />
          ))}
        </Card>

        {/* Signal Distribution */}
        <Card title="Signal Distribution">
          <div className="space-y-3">
            {breakdown.map((item) => {
              const pct = (item.count / total) * 100;
              return (
                <div key={item.type} className="bg-[var(--brand-surface-0)] border border-[var(--brand-border-2)] rounded px-3 py-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] text-[var(--brand-text-mid)]">{item.type}</span>
                    <span className="text-[11px] text-[var(--brand-text-mid)]">{formatNumber(item.count)} ({pct.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-[var(--brand-surface-3)] rounded h-2">
                    <div
                      className={`rounded h-2 transition-all ${item.severity === 'fail' ? 'bg-red-500' : 'bg-orange-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-[var(--brand-text-faint)] mt-1">{item.desc}</div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Friction by Element */}
      {frictionByElement.length > 0 && (
        <Card title="Friction by Element">
          <div className="space-y-2">
            {frictionByElement.slice(0, 10).map((el: any, i: number) => (
              <div key={i} className="bg-[var(--brand-surface-0)] border border-[var(--brand-border-2)] rounded px-3 py-2 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <span className="text-[12px] text-[var(--brand-text-mid)] block truncate">{el.element || el.selector || el.label}</span>
                  {el.text && <span className="text-[10px] text-[var(--brand-text-faint)] block truncate">{el.text}</span>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] text-[var(--brand-text-mid)]">{formatNumber(el.count || el.clicks || 0)}</span>
                  <StatusBadge
                    status={(el.severity || el.frictionLevel) === 'high' ? 'fail' : (el.severity || el.frictionLevel) === 'medium' ? 'warn' : 'info'}
                    label={el.type || el.signal || 'click'}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Worst Pages */}
      {worstPages.length > 0 && (
        <Card title="Worst Pages">
          <div className="space-y-2">
            {worstPages.slice(0, 8).map((p: any, i: number) => (
              <div key={i} className="bg-[var(--brand-surface-0)] border border-[var(--brand-border-2)] rounded px-3 py-2 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <span className="text-[12px] text-[var(--brand-text-mid)] block truncate">{p.title || p.url}</span>
                  {p.url && <span className="text-[10px] text-[var(--brand-text-faint)] block truncate font-mono">{p.url}</span>}
                </div>
                <StatusBadge status="fail" label={`Score: ${Math.round(p.frictionScore || p.score || 0)}`} />
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
