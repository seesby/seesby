import React from 'react';
import { LineChart } from '../../_shared/LineChart';
import { useAuctionInsights } from '../selectors/useAuctionInsights.tsx';
import { fmtPct } from '../../_shared/formatters';
import { STATUS_HEX } from '../../_shared/shared-columns';

const CARD = 'rounded border border-[var(--brand-surface-3)]] bg-[var(--brand-surface-0)]] p-3 min-h-0';

function heatmapBg(value: number, max: number): string {
  const ratio = max > 0 ? value / max : 0;
  if (ratio >= 0.6) return 'rgba(6,182,212,0.25)';
  if (ratio >= 0.3) return 'rgba(6,182,212,0.12)';
  return 'transparent';
}

export default function PaidAuctionInsightsView() {
  const d = useAuctionInsights();
  const totalLost = d.lostBudget + d.lostRank + d.lostAdRank;

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-auto custom-scrollbar">
      <div className="flex-1 grid grid-cols-12 gap-3 p-3 pb-16 min-h-0 auto-rows-min">
        {/* Full matrix: us × competitors — 8 cols */}
        <div className={`${CARD} col-span-12 lg:col-span-8 overflow-auto custom-scrollbar`}>
          <H>Matrix: us × competitors</H>
          <table className="w-full text-[11px] border-collapse">
            <thead className="text-[9px] uppercase text-[var(--brand-text-faint)]]">
              <tr>
                <th className="text-left py-1.5 pr-4 font-normal">Competitor</th>
                <th className="text-right py-1.5 px-2 font-normal">Overlap</th>
                <th className="text-right py-1.5 px-2 font-normal">Abv Pos</th>
                <th className="text-right py-1.5 px-2 font-normal">Top%</th>
                <th className="text-right py-1.5 px-2 font-normal">Abs Top</th>
                <th className="text-right py-1.5 px-2 font-normal">Outrank</th>
                <th className="text-right py-1.5 pl-2 font-normal">IS</th>
              </tr>
            </thead>
            <tbody>
              {d.matrix.map((row: any) => {
                const maxOverlap = Math.max(...d.matrix.map((m: any) => m.overlap), 1);
                return (
                  <tr key={row.host} className={`border-t border-[var(--brand-surface-3)]] ${row.isOur ? 'bg-[var(--brand-surface-1)]]' : 'hover:bg-[var(--brand-surface-1)]]/50'}`}>
                    <td className="py-1.5 pr-4 text-[var(--brand-text-mid)]] font-medium whitespace-nowrap">{row.isOur ? 'us' : row.host}</td>
                    <td className="text-right font-mono px-2 tabular-nums" style={{ background: heatmapBg(row.overlap, maxOverlap) }}>
                      {row.isOur ? '—' : fmtPct(row.overlap)}
                    </td>
                    <td className="text-right font-mono px-2 tabular-nums" style={{ color: row.posAbove > 0.05 ? STATUS_HEX.bad : row.posAbove < -0.05 ? STATUS_HEX.good : 'text-[var(--brand-text-mid)]' }}>
                      {row.isOur ? '—' : `${row.posAbove > 0 ? '+' : ''}${fmtPct(row.posAbove)}`}
                    </td>
                    <td className="text-right font-mono px-2 tabular-nums">{fmtPct(row.topShare)}</td>
                    <td className="text-right font-mono px-2 tabular-nums">{fmtPct(row.absTopShare)}</td>
                    <td className="text-right font-mono px-2 tabular-nums" style={{ color: row.outrankUs > 0.2 ? STATUS_HEX.bad : 'text-[var(--brand-text-mid)]' }}>
                      {row.isOur ? '—' : fmtPct(row.outrankUs)}
                    </td>
                    <td className="text-right font-mono pl-2 tabular-nums" style={{ color: row.impressionShare >= 0.3 ? STATUS_HEX.good : row.impressionShare >= 0.15 ? STATUS_HEX.warn : STATUS_HEX.bad }}>
                      {fmtPct(row.impressionShare)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* SoV stream — 4 cols */}
        <div className={`${CARD} col-span-12 lg:col-span-4 flex flex-col`}>
          <H>SoV paid stream</H>
          <div className="flex-1 min-h-[200px] relative overflow-hidden">
            {d.streamData.length > 1 ? (
              <LineChart
                data={d.streamData}
                x="date"
                series={[
                  { key: 'us', color: '#06b6d4' },
                  ...d.top4Hosts.map((h: string, i: number) => ({
                    key: h,
                    color: [STATUS_HEX.good, STATUS_HEX.warn, STATUS_HEX.bad, '#8b5cf6'][i % 4],
                  })),
                ]}
                height={200}
              />
            ) : (
              <div className="flex-1 grid place-items-center text-[12px] text-[var(--brand-text-faint)]]">Run another crawl to see trends.</div>
            )}
          </div>
        </div>

        {/* Lost breakdown — 6 cols */}
        <div className={`${CARD} col-span-12 md:col-span-6`}>
          <H>Impr share lost breakdown</H>
          <div className="text-[12px] text-[var(--brand-text-strong)] mb-3">
            Total lost <span className="font-mono font-medium">{fmtPct(totalLost)}</span>
          </div>
          {d.lostBreakdown.length > 0 ? (
            <div className="flex flex-col gap-2.5">
              {d.lostBreakdown.map((l: any) => {
                const color = l.reason === 'rank' ? STATUS_HEX.bad : l.reason === 'budget' ? STATUS_HEX.warn : STATUS_HEX.info;
                return (
                  <div key={l.reason} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="h-2.5 rounded-sm overflow-hidden bg-[var(--brand-surface-2)]]">
                        <div
                          className="h-full rounded-sm"
                          style={{
                            width: `${(l.value / Math.max(totalLost, 0.01)) * 100}%`,
                            background: color,
                          }}
                        />
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-2 min-w-0">
                      <span className="font-mono text-[var(--brand-text-mid)]] tabular-nums">{fmtPct(l.value)}</span>
                      <span className="text-[var(--brand-text-mid)]]">{l.label}</span>
                      <span className="text-[10px] text-[var(--brand-text-faint)]]">{l.action}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-[12px] text-[var(--brand-text-faint)]]">No lost share data.</div>
          )}
        </div>

        {/* Competitor trends — 6 cols */}
        <div className={`${CARD} col-span-12 md:col-span-6`}>
          <H>Competitor trends</H>
          <div className="flex flex-col gap-2 pt-1">
            {d.competitorTrends.map((ct: any) => {
              const latest = ct.values[ct.values.length - 1] ?? 0;
              const prev = ct.values[ct.values.length - 2] ?? latest;
              const delta = prev > 0 ? (latest - prev) / prev : 0;
              return (
                <div key={ct.host} className="flex items-center gap-3 text-[11px]">
                  <span className="w-28 text-[var(--brand-text-mid)]] truncate shrink-0">{ct.host}</span>
                  <div className="flex-1 min-w-0 h-2 rounded-sm overflow-hidden bg-[var(--brand-surface-2)]]">
                    <div
                      className="h-full rounded-sm"
                      style={{
                        width: `${Math.min(latest * 100, 100)}%`,
                        background: latest >= 0.3 ? STATUS_HEX.good : latest >= 0.15 ? STATUS_HEX.warn : STATUS_HEX.bad,
                      }}
                    />
                  </div>
                  <span className="w-12 text-right font-mono text-[var(--brand-text-mid)]] tabular-nums shrink-0">{fmtPct(latest)}</span>
                  <span className="w-4 text-right shrink-0" style={{ color: delta > 0 ? STATUS_HEX.bad : delta < 0 ? STATUS_HEX.good : 'text-[var(--brand-text-faint)]' }}>
                    {delta > 0 ? '▲' : delta < 0 ? '▼' : '─'}
                  </span>
                </div>
              );
            })}
            {d.competitorTrends.length === 0 && (
              <div className="text-[12px] text-[var(--brand-text-faint)]]">No competitor data.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const H = ({ children }: { children: React.ReactNode }) =>
  <div className="text-[10px] uppercase tracking-wider text-[var(--brand-text-faint)]] mb-2">{children}</div>;
