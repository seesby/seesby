import React from 'react';
import {
  DataRow, MetricPill, Card, StatusBadge, SectionHeader,
  formatNumber, formatPercent, getActions,
} from '../../shared';

export default function HeatmapTab({ page, hasTrend }: { page: any; hasTrend?: boolean }) {
  const ux = page?.ux || {};
  const rageClicks = page?.rageClicks ?? ux.rageClicks ?? 0;
  const deadClicks = page?.deadClicks ?? ux.deadClicks ?? 0;
  const errorClicks = page?.errorClicks ?? ux.errorClicks ?? 0;
  const totalClicks = page?.totalClicks ?? ux.totalClicks ?? (rageClicks + deadClicks + errorClicks + (ux.normalClicks || 0));
  const interactionLatency = page?.interactionLatency ?? ux.interactionLatency;

  const total = rageClicks + deadClicks + errorClicks || 1;
  const ragePct = (rageClicks / total) * 100;
  const deadPct = (deadClicks / total) * 100;
  const errorPct = (errorClicks / total) * 100;

  const hotspots = page?.clickHotspots || ux.clickHotspots || [];
  const deadZones = page?.deadZones || ux.deadZones || [];
  const rageZones = page?.rageZones || ux.rageZones || [];

  return (
    <div className="space-y-4">
      {/* Quick metrics */}
      <div className="grid grid-cols-5 gap-2">
        <MetricPill label="Total Clicks" value={formatNumber(totalClicks)} />
        <MetricPill label="Rage" value={formatNumber(rageClicks)} good={rageClicks === 0} />
        <MetricPill label="Dead" value={formatNumber(deadClicks)} good={deadClicks === 0} />
        <MetricPill label="Error" value={formatNumber(errorClicks)} good={errorClicks === 0} />
        <MetricPill label="Latency" value={interactionLatency ? `${Math.round(interactionLatency)}ms` : '\u2014'} good={Number(interactionLatency) <= 100} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Click Distribution */}
        <Card title="Click Distribution">
          <div className="space-y-3">
            {[
              { label: 'Rage Clicks', count: rageClicks, pct: ragePct, color: 'bg-red-500', textColor: 'text-red-400' },
              { label: 'Dead Clicks', count: deadClicks, pct: deadPct, color: 'bg-orange-500', textColor: 'text-orange-400' },
              { label: 'Error Clicks', count: errorClicks, pct: errorPct, color: 'bg-red-400', textColor: 'text-red-400' },
            ].map((item) => (
              <div key={item.label} className="bg-[var(--brand-surface-0)] border border-[var(--brand-border-2)] rounded px-3 py-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[12px] text-[var(--brand-text-mid)]">{item.label}</span>
                  <span className={`text-[11px] ${item.textColor}`}>{formatNumber(item.count)} ({item.pct.toFixed(1)}%)</span>
                </div>
                <div className="w-full bg-[var(--brand-surface-3)] rounded h-2">
                  <div className={`rounded h-2 transition-all ${item.color}`} style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Click Health */}
        <Card title="Click Health">
          <DataRow label="Total Clicks" value={formatNumber(totalClicks)} />
          <DataRow label="Rage Rate" value={formatPercent(rageClicks / (totalClicks || 1), 100)} status={rageClicks > 0 ? 'fail' : 'pass'} />
          <DataRow label="Dead Rate" value={formatPercent(deadClicks / (totalClicks || 1), 100)} status={deadClicks > 0 ? 'warn' : 'pass'} />
          <DataRow label="Error Rate" value={formatPercent(errorClicks / (totalClicks || 1), 100)} status={errorClicks > 0 ? 'fail' : 'pass'} />
          <DataRow label="Interaction Latency" value={interactionLatency ? `${Math.round(interactionLatency)}ms` : '\u2014'} status={Number(interactionLatency) <= 100 ? 'pass' : Number(interactionLatency) <= 300 ? 'warn' : 'fail'} />
        </Card>
      </div>

      {/* Hotspots */}
      {hotspots.length > 0 && (
        <Card title="Click Hotspots">
          <div className="space-y-2">
            {hotspots.slice(0, 10).map((h: any, i: number) => (
              <div key={i} className="bg-[var(--brand-surface-0)] border border-[var(--brand-border-2)] rounded px-3 py-2 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <span className="text-[12px] text-[var(--brand-text-mid)] block truncate">{h.element || h.selector || `Zone ${i + 1}`}</span>
                  {h.text && <span className="text-[10px] text-[var(--brand-text-faint)] block truncate">{h.text}</span>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] text-[var(--brand-text-mid)]">{formatNumber(h.count || h.clicks || 0)} clicks</span>
                  {h.rage && <StatusBadge status="fail" label="Rage" />}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Dead Zones */}
      {deadZones.length > 0 && (
        <Card title="Dead Zones">
          <div className="space-y-2">
            {deadZones.slice(0, 8).map((z: any, i: number) => (
              <div key={i} className="bg-[var(--brand-surface-0)] border border-[var(--brand-border-2)] rounded px-3 py-2 flex items-center justify-between">
                <span className="text-[12px] text-[var(--brand-text-mid)]">{z.element || z.selector || `Zone ${i + 1}`}</span>
                <StatusBadge status="warn" label={`${z.attempts || 0} clicks, 0 action`} />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Rage Zones */}
      {rageZones.length > 0 && (
        <Card title="Rage Zones">
          <div className="space-y-2">
            {rageZones.slice(0, 8).map((z: any, i: number) => (
              <div key={i} className="bg-[var(--brand-surface-0)] border border-[var(--brand-border-2)] rounded px-3 py-2 flex items-center justify-between">
                <span className="text-[12px] text-[var(--brand-text-mid)]">{z.element || z.selector || `Zone ${i + 1}`}</span>
                <StatusBadge status="fail" label={`${z.count || z.rageCount || 0} rapid clicks`} />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Empty state */}
      {hotspots.length === 0 && deadZones.length === 0 && rageZones.length === 0 && (
        <Card title="Heatmap Data">
          <div className="text-[12px] text-[var(--brand-text-faint)] py-4 text-center">
            Click heatmap data will appear after tracking events are collected. Current data: {formatNumber(rageClicks)} rage, {formatNumber(deadClicks)} dead, {formatNumber(errorClicks)} error clicks.
          </div>
        </Card>
      )}
    </div>
  );
}
