import React from 'react';
import { KpiStrip } from '../../_shared/KpiStrip';
import { LineChart } from '../../_shared/LineChart';
import { Donut } from '../../_shared/Donut';
import { usePaidOverview } from '../selectors/usePaidOverview.tsx';
import { fmtCompact, fmtPct } from '../../_shared/formatters';
import { useHasComparison } from '../../_hooks/useHasComparison';
import { STATUS } from '../../_shared/tokens';

const CARD = 'rounded border border-[var(--brand-surface-3)] bg-[var(--brand-surface-0)] p-3 min-h-0';

export default function PaidOverviewView() {
  const d = usePaidOverview();
  const hasComparison = useHasComparison();
  const delta = hasComparison && d.spendPrev30d > 0
    ? (d.spend30d - d.spendPrev30d) / d.spendPrev30d
    : undefined;

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-auto custom-scrollbar">
      <KpiStrip items={[
        { label: 'Spend 30d', value: `$${fmtCompact(d.spend30d)}`, delta, hint: 'vs prev 30d' },
        { label: 'Conv 30d', value: d.conversions, tone: d.conversions > 0 ? 'good' : 'neutral' },
        { label: 'CPA', value: d.cpa > 0 ? `$${fmtCompact(d.cpa)}` : '—', tone: d.cpa < 50 ? 'good' : d.cpa < 100 ? 'warn' : 'bad' },
        { label: 'ROAS', value: d.roas > 0 ? `${d.roas.toFixed(1)}×` : '—', tone: d.roas >= 3 ? 'good' : d.roas >= 1 ? 'warn' : 'bad' },
        { label: 'Impr Share', value: `${Math.round(d.impressionShare * 100)}%`, tone: d.impressionShare >= 0.5 ? 'good' : d.impressionShare >= 0.3 ? 'warn' : 'bad' },
        { label: 'QS avg', value: d.qualityScoreAvg > 0 ? d.qualityScoreAvg.toFixed(1) : '—', tone: d.qualityScoreAvg >= 7 ? 'good' : d.qualityScoreAvg >= 5 ? 'warn' : 'bad' },
      ]} />

      <div className="flex-1 grid grid-cols-12 gap-3 p-3 pb-16 min-h-0 auto-rows-min">
        {/* Spend × Conv quadrant — 8 cols */}
        <div className={`${CARD} col-span-12 md:col-span-8 flex flex-col overflow-hidden`}>
          <H>Spend × conversions</H>
          <div className="flex-1 min-h-[280px] relative overflow-hidden">
            {d.scatterData.length > 0 ? (
              <ScatterQuadrant data={d.scatterData} />
            ) : (
              <div className="flex-1 grid place-items-center text-[12px] text-[var(--brand-text-faint)]">No campaign data.</div>
            )}
          </div>
        </div>

        {/* ROAS trend — 4 cols */}
        <div className={`${CARD} col-span-12 md:col-span-4 flex flex-col overflow-hidden`}>
          <H>ROAS trend (12w)</H>
          <div className="flex-1 min-h-[280px] relative overflow-hidden">
            {d.roasTrend.length > 1 ? (
              <LineChart data={d.roasTrend} x="date" series={[
                { key: 'roas', color: '#06b6d4' },
                { key: 'target', label: 'target', color: 'text-[var(--brand-text-faint)]' },
              ]} height={280} />
            ) : (
              <div className="flex-1 grid place-items-center text-[12px] text-[var(--brand-text-faint)]">Run another crawl to see trends.</div>
            )}
          </div>
        </div>

        {/* Top movers 7d — 6 cols */}
        <div className={`${CARD} col-span-12 md:col-span-6 overflow-auto custom-scrollbar min-h-[200px]`}>
          <H>Top movers 7d</H>
          {d.topMovers.length > 0 ? (
            <table className="w-full text-[12px]">
              <thead className="text-[10px] uppercase text-[var(--brand-text-faint)]">
                <tr>
                  <th className="text-left py-1 font-normal">Campaign</th>
                  <th className="text-right font-normal">Δ spend</th>
                  <th className="text-right font-normal">Δ conv</th>
                </tr>
              </thead>
              <tbody>
                {d.topMovers.map((m: any) => (
                  <tr key={m.name} className="border-t border-[var(--brand-surface-3)]">
                    <td className="py-1.5 text-[var(--brand-text-mid)] truncate max-w-[200px]">{m.name}</td>
                    <td className="text-right font-mono" style={{ color: m.spendDelta > 0 ? STATUS.good : m.spendDelta < 0 ? STATUS.bad : 'text-[var(--brand-text-mid)]' }}>
                      {m.spendDelta > 0 ? '+' : ''}{fmtCompact(m.spendDelta)}
                    </td>
                    <td className="text-right font-mono" style={{ color: m.convDelta > 0 ? STATUS.good : m.convDelta < 0 ? STATUS.bad : 'text-[var(--brand-text-mid)]' }}>
                      {m.convDelta > 0 ? '+' : ''}{m.convDelta}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-4 text-[12px] text-[var(--brand-text-faint)] text-center">No movers this week.</div>
          )}
        </div>

        {/* QS distribution — 6 cols */}
        <div className={`${CARD} col-span-12 md:col-span-6 flex flex-col min-h-[200px]`}>
          <H>Quality Score distribution</H>
          <div className="flex-1 flex flex-col justify-center gap-2">
            {d.qsDist.map((q: any) => (
              <div key={q.score} className="flex items-center gap-2 text-[12px]">
                <span className="w-10 shrink-0 text-right text-[var(--brand-text-mid)] tabular-nums text-[11px]">QS {q.score}</span>
                <div className="flex-1 h-4 rounded-sm overflow-hidden bg-[var(--brand-surface-2)]">
                  <div
                    className="h-full rounded-sm"
                    style={{
                      width: `${(q.count / d.maxQs) * 100}%`,
                      background: q.score >= 8 ? STATUS.good : q.score >= 6 ? STATUS.info : q.score >= 5 ? STATUS.warn : STATUS.bad,
                    }}
                  />
                </div>
                <span className="w-6 text-right text-[var(--brand-text-mid)] tabular-nums text-[11px]">{q.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Auction insights preview — 6 cols */}
        <div className={`${CARD} col-span-12 md:col-span-6 overflow-auto custom-scrollbar min-h-[200px]`}>
          <H>Auction insights preview</H>
          {d.competitors.length > 0 ? (
            <table className="w-full text-[12px]">
              <thead className="text-[10px] uppercase text-[var(--brand-text-faint)]">
                <tr>
                  <th className="text-left py-1 font-normal">Competitor</th>
                  <th className="text-right font-normal">Overlap</th>
                  <th className="text-right font-normal">Abv pos</th>
                  <th className="text-right font-normal">Top%</th>
                </tr>
              </thead>
              <tbody>
                {d.competitors.map((c: any) => (
                  <tr key={c.host} className="border-t border-[var(--brand-surface-3)]">
                    <td className="py-1.5 text-[var(--brand-text-mid)]">{c.host}</td>
                    <td className="text-right font-mono" style={{ color: c.overlap > 0.3 ? STATUS.bad : 'text-[var(--brand-text-mid)]' }}>
                      {fmtPct(c.overlap)}
                    </td>
                    <td className="text-right font-mono" style={{ color: c.posAbove > 0.05 ? STATUS.bad : c.posAbove < -0.05 ? STATUS.good : 'text-[var(--brand-text-mid)]' }}>
                      {c.posAbove > 0 ? '+' : ''}{fmtPct(c.posAbove)}
                    </td>
                    <td className="text-right font-mono text-[var(--brand-text-strong)]">{fmtPct(c.topShare)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-4 text-[12px] text-[var(--brand-text-faint)] text-center">No auction data.</div>
          )}
        </div>

        {/* Spend by device — 3 cols */}
        <div className={`${CARD} col-span-12 sm:col-span-6 md:col-span-3 flex flex-col min-h-[180px]`}>
          <H>By device</H>
          <div className="flex-1 relative">
            <Donut data={(d.spendByDevice as any[]).map(n => ({ name: n.name, value: n.value, color: n.color ?? '#0891b2' }))} label="" />
          </div>
        </div>

        {/* Quick stats — 3 cols */}
        <div className={`${CARD} col-span-12 sm:col-span-6 md:col-span-3 flex flex-col justify-center gap-3 min-h-[180px]`}>
          <H>Account</H>
          <StatRow label="Campaigns" value={d.campaignCount} />
          <StatRow label="Ads" value={d.adCount} />
          <StatRow label="Keywords" value={d.keywordCount} />
          <StatRow label="LPs" value={d.lpCount} />
        </div>
      </div>
    </div>
  );
}

/* Scatter quadrant: spend (x) vs conversions (y) with quadrant labels */
function ScatterQuadrant({ data }: { data: { x: number; y: number; name: string; roas: number }[] }) {
  const maxX = Math.max(...data.map(d => d.x), 1);
  const maxY = Math.max(...data.map(d => d.y), 1);

  return (
    <div className="relative w-full h-full">
      {/* Quadrant labels */}
      <span className="absolute top-2 right-2 text-[9px] text-[#22c55e]">stars</span>
      <span className="absolute top-2 left-2 text-[9px] text-[#3b82f6]">high conv</span>
      <span className="absolute bottom-5 right-2 text-[9px] text-[#f59e0b]">scale</span>
      <span className="absolute bottom-5 left-2 text-[9px] text-[#ef4444]">fix / cut</span>

      {/* Crosshair lines */}
      <div className="absolute left-0 right-0 top-1/2 border-t border-dashed border-[var(--brand-surface-4)]" />
      <div className="absolute top-0 bottom-0 left-1/2 border-l border-dashed border-[var(--brand-surface-4)]" />

      {/* Axis labels */}
      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[9px] text-[var(--brand-text-faint)]">spend →</span>
      <span className="absolute left-0 top-1/2 -translate-y-1/2 -rotate-90 text-[9px] text-[var(--brand-text-faint)]">conv →</span>

      {/* Points */}
      {data.map((d, i) => {
        const px = (d.x / maxX) * 100;
        const py = 100 - (d.y / maxY) * 100;
        const color = d.roas >= 3 ? STATUS.good : d.roas >= 1 ? STATUS.warn : STATUS.bad;
        return (
          <div
            key={i}
            className="absolute w-2.5 h-2.5 rounded-full -translate-x-1.5 -translate-y-1.5 cursor-pointer hover:scale-150 transition-transform"
            style={{ left: `${px}%`, top: `${py}%`, background: color }}
            title={`${d.name}\nSpend: $${fmtCompact(d.x)}\nConv: ${d.y}\nROAS: ${d.roas.toFixed(1)}×`}
          />
        );
      })}
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between text-[11px]">
      <span className="text-[var(--brand-text-mid)]">{label}</span>
      <span className="text-[var(--brand-text-strong)] tabular-nums">{value}</span>
    </div>
  );
}

const H = ({ children }: { children: React.ReactNode }) =>
  <div className="text-[10px] uppercase tracking-wider text-[var(--brand-text-faint)] mb-2">{children}</div>;
