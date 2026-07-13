import React from 'react';
import { BarChart } from '../../views/_shared/BarChart';
import { useWqaPerformance } from './selectors/useWqaPerformance';

const PANEL = 'rounded border border-[var(--brand-surface-3)] bg-[var(--brand-surface-0)] p-3';
const LABEL = 'text-[10px] uppercase tracking-wider text-[var(--brand-text-faint)] mb-2';

function Panel({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`${PANEL} ${className}`}>
      <div className={LABEL}>{title}</div>
      {children}
    </div>
  );
}

function EmptyChart({ text }: { text: string }) {
  return <div className="flex items-center justify-center h-[180px] text-[11px] text-[var(--brand-text-faint)]">{text}</div>;
}

// Heatmap cell with intensity-based background
function HeatCell({ value, max }: { value: number; max: number }) {
  const intensity = max > 0 ? value / max : 0;
  return (
    <div
      className="inline-flex items-center justify-center w-14 h-5 rounded text-[10px] font-mono"
      style={{ background: `rgba(167,139,250,${Math.max(0.1, intensity)})` }}
    >
      {value.toLocaleString()}
    </div>
  );
}

function Delta({ value, suffix = '%' }: { value: number | null; suffix?: string }) {
  if (value == null) return null;
  const positive = value > 0;
  const color = positive ? '#22c55e' : value < 0 ? '#ef4444' : 'text-[var(--brand-text-faint)]';
  const sign = positive ? '+' : '';
  return <span className="ml-1 text-[10px] font-mono" style={{ color }}>{sign}{value}{suffix}</span>;
}

export default function WqaPerformanceView() {
  const d = useWqaPerformance();

  return (
    <div className="flex-1 overflow-auto custom-scrollbar p-3 grid grid-cols-12 gap-3 auto-rows-min">
      {/* Row 1: Clicks & Impressions + Search perf */}
      <Panel title="Clicks & Impressions (28d)" className="col-span-12 lg:col-span-8">
        <div className="space-y-2">
          <div className="flex items-center text-[13px]">
            <span className="text-[var(--brand-text-mid)] w-14">Clicks</span>
            <span className="ml-2 font-mono text-[var(--brand-text-strong)]">{d.searchPerf.totalClicks.toLocaleString()}</span>
            <Delta value={d.searchPerf.clicksDeltaPct} />
          </div>
          <div className="flex items-center text-[13px]">
            <span className="text-[var(--brand-text-mid)] w-14">Impr</span>
            <span className="ml-2 font-mono text-[var(--brand-text-strong)]">{d.searchPerf.totalImpr.toLocaleString()}</span>
            <Delta value={d.searchPerf.imprDeltaPct} />
          </div>
        </div>
      </Panel>

      <Panel title="Search performance" className="col-span-12 lg:col-span-4">
        <div className="space-y-1.5">
          <div className="flex justify-between items-baseline">
            <span className="text-[11px] text-[var(--brand-text-mid)]">Clicks</span>
            <span className="text-[12px] font-mono text-[var(--brand-text-strong)]">{d.searchPerf.totalClicks.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-[11px] text-[var(--brand-text-mid)]">Impr</span>
            <span className="text-[12px] font-mono text-[var(--brand-text-strong)]">{d.searchPerf.totalImpr.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-[11px] text-[var(--brand-text-mid)]">CTR</span>
            <span className="text-[12px] font-mono text-[var(--brand-text-strong)]">{d.searchPerf.ctr}%</span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-[11px] text-[var(--brand-text-mid)]">Avg Pos</span>
            <span className="text-[12px] font-mono text-[var(--brand-text-strong)]">{d.searchPerf.avgPos}</span>
          </div>
        </div>
      </Panel>

      {/* Row 2: Position histogram + CTR vs benchmark */}
      <Panel title="Position distribution" className="col-span-12 lg:col-span-6">
        {d.positionBuckets.some(b => b.count > 0) ? (
          <BarChart data={d.positionBuckets} x="label" y="count" color="#a78bfa" height={200} />
        ) : (
          <EmptyChart text="No position data" />
        )}
      </Panel>

      <Panel title="CTR vs benchmark" className="col-span-12 lg:col-span-6">
        {d.ctrVsBenchmark.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr>
                  <th className="text-left text-[var(--brand-text-faint)] pr-3 py-1">Position</th>
                  <th className="text-center text-[var(--brand-text-faint)] px-3 py-1">Your CTR</th>
                  <th className="text-center text-[var(--brand-text-faint)] px-3 py-1">Benchmark</th>
                  <th className="text-center text-[var(--brand-text-faint)] pl-3 py-1">Gap</th>
                </tr>
              </thead>
              <tbody>
                {d.ctrVsBenchmark.map(r => {
                  const gap = Math.round((r.us - r.bench) * 10) / 10;
                  const gapColor = gap >= 0 ? '#22c55e' : gap > -3 ? '#f59e0b' : '#ef4444';
                  return (
                    <tr key={r.pos}>
                      <td className="text-[var(--brand-text-mid)] pr-3 py-1 font-mono">#{r.pos}</td>
                      <td className="text-center py-1 px-3 font-mono text-[var(--brand-text-strong)]">{r.us}%</td>
                      <td className="text-center py-1 px-3 font-mono text-[var(--brand-text-mid)]">{r.bench}%</td>
                      <td className="text-center py-1 pl-3 font-mono" style={{ color: gapColor }}>
                        {gap >= 0 ? '+' : ''}{gap}pt
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyChart text="No keyword position data for CTR comparison" />
        )}
      </Panel>

      {/* Row 3: Category heatmap */}
      <Panel title="Category performance" className="col-span-12">
        {d.categoryMetrics.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr>
                  <th className="text-left text-[var(--brand-text-faint)] pr-3 py-1">Category</th>
                  <th className="text-center text-[var(--brand-text-faint)] px-3 py-1">Clicks</th>
                  <th className="text-center text-[var(--brand-text-faint)] px-3 py-1">Impr</th>
                  <th className="text-center text-[var(--brand-text-faint)] px-3 py-1">CTR</th>
                  <th className="text-center text-[var(--brand-text-faint)] px-3 py-1">Pos</th>
                  <th className="text-center text-[var(--brand-text-faint)] pl-3 py-1">Pages</th>
                </tr>
              </thead>
              <tbody>
                {d.categoryMetrics.map(cm => {
                  const maxClicks = d.categoryMetrics[0]?.clicks ?? 1;
                  const maxImpr = Math.max(...d.categoryMetrics.map(r => r.impr), 1);
                  const maxCtr = Math.max(...d.categoryMetrics.map(r => r.ctr), 0.1);
                  const maxPos = Math.max(...d.categoryMetrics.map(r => r.pos), 1);
                  return (
                    <tr key={cm.category}>
                      <td className="text-[var(--brand-text-mid)] pr-3 py-1 font-mono">{cm.category}</td>
                      <td className="text-center py-1 px-3"><HeatCell value={cm.clicks} max={maxClicks} /></td>
                      <td className="text-center py-1 px-3"><HeatCell value={cm.impr} max={maxImpr} /></td>
                      <td className="text-center py-1 px-3">
                        <div
                          className="inline-flex items-center justify-center w-14 h-5 rounded text-[10px] font-mono"
                          style={{ background: `rgba(167,139,250,${Math.max(0.1, cm.ctr / maxCtr)})` }}
                        >{cm.ctr}%</div>
                      </td>
                      <td className="text-center py-1 px-3">
                        <div
                          className="inline-flex items-center justify-center w-14 h-5 rounded text-[10px] font-mono"
                          style={{ background: `rgba(167,139,250,${Math.max(0.1, cm.pos / maxPos)})` }}
                        >{cm.pos}</div>
                      </td>
                      <td className="text-center py-1 pl-3 text-[var(--brand-text-faint)]">{cm.pages}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyChart text="No category data" />
        )}
      </Panel>

      {/* Row 4: Winners / Losers */}
      {(d.winners.length > 0 || d.losers.length > 0) && (
        <Panel title="Winners / Losers" className="col-span-12">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[10px] text-[#22c55e] mb-1">Winners</div>
              {d.winners.map(w => (
                <div key={w.url} className="flex justify-between py-0.5 text-[11px]">
                  <span className="text-[var(--brand-text-mid)] truncate mr-2">{w.url}</span>
                  <span className="text-[#22c55e] font-mono">+{w.delta.toLocaleString()}</span>
                </div>
              ))}
              {d.winners.length === 0 && <div className="text-[11px] text-[var(--brand-text-faint)]">None</div>}
            </div>
            <div>
              <div className="text-[10px] text-[#ef4444] mb-1">Losers</div>
              {d.losers.map(l => (
                <div key={l.url} className="flex justify-between py-0.5 text-[11px]">
                  <span className="text-[var(--brand-text-mid)] truncate mr-2">{l.url}</span>
                  <span className="text-[#ef4444] font-mono">{l.delta.toLocaleString()}</span>
                </div>
              ))}
              {d.losers.length === 0 && <div className="text-[11px] text-[var(--brand-text-faint)]">None</div>}
            </div>
          </div>
        </Panel>
      )}

    </div>
  );
}
