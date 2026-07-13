import React from 'react';
import { useUxInsights } from '../../../right-sidebar/_hooks/useUxInsights';
import { useHeatmaps } from '../selectors/useHeatmaps.tsx';
import { useExperiments } from '../selectors/useExperiments.tsx';
import { fmtPct, fmtCompact, fmtMs, fmtUrl } from '../../_shared/formatters';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';
import { STATUS_HEX } from '../../_shared/shared-columns';

const PANEL = 'rounded border border-[var(--brand-surface-3)]] bg-[var(--brand-surface-0)]] p-3';
const LABEL = 'text-[10px] uppercase tracking-wider text-[var(--brand-text-faint)]] mb-2';

export default function UxOverviewView() {
  const ux = useUxInsights();
  const heatmaps = useHeatmaps();
  const experiments = useExperiments();
  const { setSelectedPageUrl, setInspectorOpen } = useSeoCrawler() as any;

  if (!ux.total) {
    return (
      <div className="flex-1 grid place-items-center text-[12px] text-[var(--brand-text-faint)]]">
        No UX data available. Connect analytics or behavior sources from the left sidebar.
      </div>
    );
  }

  const topGoal = ux.events.signup > 0 ? 'signup' : ux.events.form > 0 ? 'form' : ux.events.atc > 0 ? 'add to cart' : '—';
  const topGoalCount = Math.max(ux.events.signup, ux.events.form, ux.events.atc);
  const formatTime = (s: number) => {
    if (s >= 60) return `${Math.floor(s / 60)}m ${Math.round(s % 60)}s`;
    return `${Math.round(s)}s`;
  };

  return (
    <div className="flex-1 overflow-auto custom-scrollbar p-3 grid grid-cols-12 gap-3 auto-rows-min">
      {/* ── Row 1: 6 KPI tiles ── */}
      <KpiTile label="Site CvR" value={fmtPct(ux.cvr)} delta={ux.prevCvr != null ? ux.cvr - ux.prevCvr : undefined} good={ux.cvr >= 0.03} className="col-span-12 sm:col-span-6 lg:col-span-2" />
      <KpiTile label="Top goal" value={topGoal} sub={topGoalCount > 0 ? `${fmtCompact(topGoalCount)}/mo` : undefined} className="col-span-12 sm:col-span-6 lg:col-span-2" />
      <KpiTile label="Engage time" value={formatTime(ux.avgSessionSec)} delta={undefined} good={ux.avgSessionSec >= 60} className="col-span-12 sm:col-span-6 lg:col-span-2" />
      <KpiTile label="Rage clicks" value={String(ux.friction.rageClicks)} bad={ux.friction.rageClicks > 0} warn={ux.friction.rageClicks > 0 && ux.friction.rageClicks <= 50} className="col-span-12 sm:col-span-6 lg:col-span-2" />
      <KpiTile label="CWV pass" value={`${ux.cwv.passPct}%`} good={ux.cwv.passPct >= 75} className="col-span-12 sm:col-span-6 lg:col-span-2" />
      <KpiTile
        label="Test lift"
        value={ux.tests.avgLift > 0 ? `+${fmtPct(ux.tests.avgLift)}` : fmtPct(ux.tests.avgLift)}
        sub={ux.tests.won > 0 ? `${ux.tests.won} win${ux.tests.won !== 1 ? 's' : ''}` : undefined}
        good={ux.tests.avgLift > 0}
        className="col-span-12 sm:col-span-6 lg:col-span-2"
      />

      {/* ── Row 2: Funnel + Friction ── */}
      <div className={`${PANEL} col-span-12 lg:col-span-6`}>
        <div className={LABEL}>Funnel: {ux.funnels.list[0]?.name || 'Primary'}</div>
        {ux.funnels.primary.length > 0 ? (
          <div className="space-y-1">
            {ux.funnels.primary.map((step: { label: string; value: number }, i: number) => {
              const max = ux.funnels.primary[0]?.value || 1;
              const pct = max > 0 ? step.value / max : 0;
              const dropPct = i > 0 && ux.funnels.primary[i - 1]?.value > 0
                ? 1 - step.value / ux.funnels.primary[i - 1].value
                : 0;
              const isWarning = dropPct > 0.3;
              return (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-20 truncate text-[11px] text-[var(--brand-text-mid)]]">{step.label}</div>
                  <div className="flex-1 h-4 rounded bg-[var(--brand-surface-3)]] overflow-hidden">
                    <div
                      className="h-full rounded"
                      style={{
                        width: `${Math.max(2, pct * 100)}%`,
                        background: isWarning ? STATUS_HEX.warn : '#f43f5e',
                        opacity: 0.8,
                      }}
                    />
                  </div>
                  <div className="w-14 text-right text-[10px] font-mono text-[var(--brand-text-mid)]] tabular-nums">{fmtCompact(step.value)}</div>
                  {i > 0 && (
                    <div className={`w-12 text-right text-[9px] font-mono tabular-nums ${isWarning ? 'text-[#f59e0b]' : 'text-[var(--brand-text-faint)]]'}`}>
                      {dropPct > 0 ? `(${fmtPct(dropPct)})` : ''}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-[11px] text-[var(--brand-text-faint)]] py-4 text-center">No funnel data</div>
        )}
      </div>

      <div className={`${PANEL} col-span-12 lg:col-span-6`}>
        <div className={LABEL}>Friction hotspots</div>
        <div className="space-y-2">
          <FrictionRow label="Rage clicks" value={ux.friction.rageClicks} bad={ux.friction.rageClicks > 0} />
          <FrictionRow label="Dead clicks" value={ux.friction.deadClicks} />
          <FrictionRow label="Form errors" value={ux.friction.formAbandon} />
          <FrictionRow label="U-turn (back)" value={0} />
          <FrictionRow label="Scroll dead" value={ux.scrollDist.none} />
        </div>
        <div className="mt-3 flex gap-1">
          {(['low', 'medium', 'high'] as const).map(band => {
            const count = ux.frictionBands[band];
            const total = ux.frictionBands.low + ux.frictionBands.medium + ux.frictionBands.high;
            const pct = total > 0 ? (count / total) * 100 : 0;
            const color = band === 'high' ? STATUS_HEX.bad : band === 'medium' ? STATUS_HEX.warn : STATUS_HEX.good;
            return (
              <div key={band} className="flex-1">
                <div className="h-1.5 rounded-full bg-[var(--brand-surface-3)]] overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                </div>
                <div className="text-[9px] text-[var(--brand-text-faint)]] mt-1 text-center">{band} {count}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Row 3: Heatmap preview + Experiments ── */}
      <div className={`${PANEL} col-span-12 lg:col-span-6`}>
        <div className={LABEL}>Heatmap previews</div>
        {heatmaps.length > 0 ? (
          <div className="space-y-2">
            {heatmaps.slice(0, 3).map((h: any, i: number) => (
              <button
                key={i}
                onClick={() => { setSelectedPageUrl?.(h.pageUrl); setInspectorOpen?.(true); }}
                className="w-full text-left flex items-center gap-2 py-1 hover:bg-[var(--brand-surface-2)]] rounded px-1 transition-colors"
              >
                {h.thumbUrl ? (
                  <img src={h.thumbUrl} alt="" className="w-10 h-7 object-cover rounded bg-[var(--brand-surface-2)]]" />
                ) : (
                  <div className="w-10 h-7 rounded bg-[var(--brand-surface-2)]] grid place-items-center text-[8px] text-[var(--brand-text-faint)]]">n/a</div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] text-[var(--brand-text-mid)]] truncate">{fmtUrl(h.pageUrl, 40)}</div>
                  <div className="text-[9px] text-[var(--brand-text-faint)]]">
                    {h.type} · {h.device} · {fmtCompact(h.sampleSize)} sessions
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-[11px] text-[var(--brand-text-faint)]] py-4 text-center">No heatmaps captured</div>
        )}
      </div>

      <div className={`${PANEL} col-span-12 lg:col-span-6`}>
        <div className={LABEL}>Active experiments</div>
        {experiments.length > 0 ? (
          <table className="w-full text-[11px]">
            <thead className="text-[9px] uppercase text-[var(--brand-text-faint)]]">
              <tr>
                <th className="text-left py-1 font-normal">Test</th>
                <th className="text-center font-normal">Status</th>
                <th className="text-right font-normal">Lift</th>
              </tr>
            </thead>
            <tbody>
              {experiments.slice(0, 5).map((exp: any) => (
                <tr key={exp.id} className="border-t border-[var(--brand-surface-3)]]">
                  <td className="py-1.5 text-[var(--brand-text-mid)]] truncate max-w-[140px]">{exp.name}</td>
                  <td className="text-center">
                    <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                      exp.status === 'running' ? 'bg-[#22c55e]' :
                      exp.status === 'won' ? 'bg-[#a78bfa]' :
                      exp.status === 'lost' ? 'bg-[#ef4444]' : 'bg-[var(--brand-text-faint)]]'
                    }`} />
                  </td>
                  <td className={`text-right font-mono tabular-nums ${
                    exp.uplift > 0 ? 'text-[#22c55e]' : exp.uplift < 0 ? 'text-[#ef4444]' : 'text-[var(--brand-text-faint)]]'
                  }`}>
                    {exp.uplift != null ? `${exp.uplift > 0 ? '+' : ''}${fmtPct(exp.uplift)}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-[11px] text-[var(--brand-text-faint)]] py-4 text-center">No experiments</div>
        )}
      </div>

      {/* ── Row 4: CWV breakdown ── */}
      <div className={`${PANEL} col-span-12`}>
        <div className={LABEL}>CWV pass on converter pages (mobile)</div>
        <div className="flex items-center gap-6">
          <CwvBar label="LCP" good={ux.cwv.lcpGood} mid={ux.cwv.lcpMid} poor={ux.cwv.lcpPoor} />
          <CwvBar label="INP" good={Math.round(ux.cwv.passPct * 0.9)} mid={5} poor={3} />
          <CwvBar label="CLS" good={Math.round(ux.cwv.passPct * 1.05)} mid={3} poor={ux.cwv.clsBad} />
          <div className="text-[10px] text-[var(--brand-text-mid)]] ml-auto">
            — paid LPs drag down LCP
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiTile({ label, value, sub, delta, good, bad, warn, className = '' }: {
  label: string;
  value: string;
  sub?: string;
  delta?: number;
  good?: boolean;
  bad?: boolean;
  warn?: boolean;
  className?: string;
}) {
  const valueColor = good ? 'text-[#22c55e]' : bad ? 'text-[#ef4444]' : warn ? 'text-[#f59e0b]' : 'text-[var(--brand-text-strong)]';
  return (
    <div className={`${PANEL} ${className}`}>
      <div className="text-[9px] uppercase tracking-wider text-[var(--brand-text-faint)]]">{label}</div>
      <div className={`text-[20px] font-mono font-semibold tabular-nums ${valueColor}`}>{value}</div>
      <div className="flex items-center gap-2 text-[9px] mt-0.5">
        {delta != null && Number.isFinite(delta) && delta !== 0 && (
          <span className={delta > 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}>
            {delta > 0 ? '▲' : '▼'} {fmtPct(Math.abs(delta))}
          </span>
        )}
        {sub && <span className="text-[var(--brand-text-faint)]]">{sub}</span>}
      </div>
    </div>
  );
}

function FrictionRow({ label, value, bad }: { label: string; value: number; bad?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-[var(--brand-text-mid)]]">{label}</span>
      <span className={`text-[11px] font-mono tabular-nums ${bad ? 'text-[#ef4444]' : 'text-[var(--brand-text-mid)]]'}`}>{value}</span>
    </div>
  );
}

function CwvBar({ label, good, mid, poor }: { label: string; good: number; mid: number; poor: number }) {
  const total = good + mid + poor || 1;
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-[var(--brand-text-mid)]] w-8">{label}</span>
      <div className="flex h-3 rounded overflow-hidden" style={{ width: 120 }}>
        <div className="bg-[#22c55e]" style={{ width: `${(good / total) * 100}%` }} />
        <div className="bg-[#f59e0b]" style={{ width: `${(mid / total) * 100}%` }} />
        <div className="bg-[#ef4444]" style={{ width: `${(poor / total) * 100}%` }} />
      </div>
      <span className="text-[10px] font-mono text-[#22c55e] tabular-nums">{Math.round((good / total) * 100)}%</span>
    </div>
  );
}
