import React from 'react';
import {
  DataRow, Card, MetricPill, StatusBadge,
  formatNumber, formatDate,
} from '../../shared';
import { Sparkline } from '../../../right-sidebar/_shared';

function seriesOf(p: any, k: string): number[] {
  const s = p?.[`${k}Series28d`];
  return Array.isArray(s) ? s.map(Number) : [];
}

export default function HistoryTab({ page, hasTrend }: { page: any; hasTrend?: boolean }) {
  const history = Array.isArray(page?.crawlSessions) ? page.crawlSessions : [];
  const statusDistrib = Array.isArray(page?.statusCodeDistribution) ? page.statusCodeDistribution : [];
  const indexabilityHistory = Array.isArray(page?.indexabilityHistory) ? page.indexabilityHistory : [];

  if (!hasTrend && history.length === 0) {
    return (
      <div className="bg-[var(--brand-surface-1)] border border-[var(--brand-surface-3)] rounded-lg p-8 text-center">
        <div className="text-[14px] text-[var(--brand-text-strong)] font-semibold mb-2">No history yet</div>
        <div className="text-[12px] text-[var(--brand-text-faint)]">Run additional crawls to see performance trends and historical changes.</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Trend sparklines */}
      {hasTrend && (
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-[var(--brand-surface-1)] border border-[var(--brand-surface-3)] rounded-lg p-3">
            <div className="text-[9px] text-[var(--brand-border-2)] uppercase tracking-widest mb-2">LCP Trend</div>
            <Sparkline values={seriesOf(page, 'lcp')} tone="info" />
          </div>
          <div className="bg-[var(--brand-surface-1)] border border-[var(--brand-surface-3)] rounded-lg p-3">
            <div className="text-[9px] text-[var(--brand-border-2)] uppercase tracking-widest mb-2">CLS Trend</div>
            <Sparkline values={seriesOf(page, 'cls')} tone="info" />
          </div>
          <div className="bg-[var(--brand-surface-1)] border border-[var(--brand-surface-3)] rounded-lg p-3">
            <div className="text-[9px] text-[var(--brand-border-2)] uppercase tracking-widest mb-2">INP Trend</div>
            <Sparkline values={seriesOf(page, 'inp')} tone="info" />
          </div>
          <div className="bg-[var(--brand-surface-1)] border border-[var(--brand-surface-3)] rounded-lg p-3">
            <div className="text-[9px] text-[var(--brand-border-2)] uppercase tracking-widest mb-2">Health Score</div>
            <Sparkline values={seriesOf(page, 'healthScore')} tone="good" />
          </div>
        </div>
      )}

      {/* Status code distribution */}
      {statusDistrib.length > 0 && (
        <Card title="Status code distribution">
          <div className="bg-[var(--brand-surface-0)] border border-[var(--brand-surface-3)] rounded-lg overflow-hidden">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-[var(--brand-surface-3)]">
                  <th className="px-3 py-2 text-left text-[var(--brand-border-2)] uppercase tracking-widest text-[9px] font-bold">Status</th>
                  <th className="px-3 py-2 text-right text-[var(--brand-border-2)] uppercase tracking-widest text-[9px] font-bold">Count</th>
                  <th className="px-3 py-2 text-right text-[var(--brand-border-2)] uppercase tracking-widest text-[9px] font-bold">Change</th>
                </tr>
              </thead>
              <tbody>
                {statusDistrib.map((d: any, i: number) => (
                  <tr key={i} className={`border-b border-[var(--brand-surface-2)] ${i % 2 === 0 ? '' : 'bg-[var(--brand-surface-0)]'} hover:bg-[var(--brand-surface-2)]`}>
                    <td className="px-3 py-1.5">
                      <StatusBadge
                        status={String(d.code || d.status || '').startsWith('2') ? 'pass' : String(d.code || '').startsWith('3') ? 'info' : 'fail'}
                        label={String(d.code || d.status || '—')}
                      />
                    </td>
                    <td className="px-3 py-1.5 text-[var(--brand-text-mid)] text-right font-mono">{formatNumber(d.count)}</td>
                    <td className={`px-3 py-1.5 text-right font-mono ${Number(d.delta || 0) < 0 ? 'text-[#22c55e]' : Number(d.delta || 0) > 0 ? 'text-[#ef4444]' : 'text-[var(--brand-text-faint)]'}`}>
                      {d.delta ? `${Number(d.delta) > 0 ? '+' : ''}${formatNumber(d.delta)}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Indexability changes */}
      {hasTrend && indexabilityHistory.length > 0 && (
        <Card title="Indexability changes">
          <div className="bg-[var(--brand-surface-1)] border border-[var(--brand-surface-3)] rounded-lg p-3 mb-2">
            <div className="text-[9px] text-[var(--brand-border-2)] uppercase tracking-widest mb-2">Indexable Pages</div>
            <Sparkline values={indexabilityHistory.map((h: any) => Number(h.indexable || 0))} tone="good" />
          </div>
          <DataRow label="Current status" value={page?.indexable !== false ? 'Indexable' : 'Non-indexable'} />
          <DataRow label="Last changed" value={formatDate(page?.indexabilityLastChanged)} />
        </Card>
      )}

      {/* Crawl history */}
      <Card title="Crawl history">
        <div className="space-y-1">
          {history.length > 0 ? history.map((s: any, i: number) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-[var(--brand-surface-2)] last:border-b-0">
              <div>
                <div className="text-[11px] text-[var(--brand-text-strong)] font-medium">{formatDate(s.date)}</div>
                <div className="text-[9px] text-[var(--brand-border-2)] uppercase tracking-wider">{s.status || 'Success'}</div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="text-[9px] text-[var(--brand-border-2)] uppercase">Health</div>
                  <div className="text-[11px] font-mono font-bold text-[var(--brand-text-strong)]">{s.healthScore || '—'}</div>
                </div>
                <div className="text-right">
                  <div className="text-[9px] text-[var(--brand-border-2)] uppercase">Status</div>
                  <div className="text-[11px] font-mono font-bold text-[var(--brand-text-strong)]">{s.statusCode || '—'}</div>
                </div>
              </div>
            </div>
          )) : (
            <div className="text-[11px] text-[var(--brand-text-faint)] italic p-4 text-center border border-dashed border-[var(--brand-surface-3)] rounded-lg">
              No previous crawl data for this URL.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
