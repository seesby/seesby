import React, { useState, useMemo } from 'react';
import { Funnel } from '../../_shared/Funnel';
import { useFunnels } from '../selectors/useFunnels.tsx';
import { fmtCompact, fmtPct } from '../../_shared/formatters';
import { STATUS_HEX } from '../../_shared/shared-columns';

export default function UxFunnelsView() {
  const funnels = useFunnels();
  const [selectedId, setSelectedId] = useState<string | null>(funnels[0]?.id ?? null);
  const f = funnels.find((x: any) => x.id === selectedId) ?? funnels[0];

  const funnelSteps = useMemo(() => {
    if (!f) return [];
    return (f.steps || []).map((s: any, i: number) => ({
      label: s.label || `Step ${i + 1}`,
      value: f.counts?.[i] ?? 0,
    }));
  }, [f]);

  const dropoffs = useMemo(() => {
    if (!f || !f.counts || f.counts.length < 2) return [];
    return f.counts.slice(1).map((count: number, i: number) => {
      const prev = f.counts[i];
      const drop = prev > 0 ? (1 - count / prev) : 0;
      return {
        label: f.steps?.[i + 1]?.label || `Step ${i + 2}`,
        from: f.steps?.[i]?.label || `Step ${i + 1}`,
        fromCount: prev,
        toCount: count,
        drop,
      };
    }).filter((d: any) => d.drop > 0).sort((a: any, b: any) => b.drop - a.drop);
  }, [f]);

  const completion = useMemo(() => {
    if (!f || !f.counts || f.counts.length === 0) return 0;
    return f.counts[f.counts.length - 1] / f.counts[0];
  }, [f]);

  return (
    <div className="flex-1 grid grid-cols-12 gap-0 min-h-0">
      {/* Funnel list */}
      <div className="col-span-4 border-r border-[var(--brand-surface-3)]] bg-[var(--brand-surface-0)]] flex flex-col min-h-0">
        <div className="h-9 px-3 flex items-center border-b border-[var(--brand-surface-3)]] shrink-0">
          <span className="text-[11px] text-[var(--brand-text-faint)]] uppercase tracking-wider">{funnels.length} funnels</span>
        </div>
        <div className="flex-1 overflow-auto custom-scrollbar">
          {funnels.length === 0 ? (
            <div className="p-4 text-[12px] text-[var(--brand-text-faint)]]">No funnels configured.</div>
          ) : (
            funnels.map((x: any) => {
              const sel = x.id === selectedId;
              const c = x.counts;
              const rate = c?.length > 0 ? c[c.length - 1] / c[0] : 0;
              return (
                <button
                  key={x.id}
                  onClick={() => setSelectedId(x.id)}
                  className={`w-full text-left px-3 py-2.5 border-b border-[var(--brand-surface-2)]] transition-colors ${
                    sel ? 'bg-[var(--brand-surface-1)]]' : 'hover:bg-[var(--brand-surface-1)]]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-[var(--brand-text-strong)] truncate">{x.name}</span>
                    <span className={`text-[10px] font-mono tabular-nums ${
                      rate >= 0.15 ? 'text-[#22c55e]' : rate >= 0.05 ? 'text-[#f59e0b]' : 'text-[#ef4444]'
                    }`}>
                      {fmtPct(rate)}
                    </span>
                  </div>
                  <div className="text-[10px] text-[var(--brand-text-faint)]] mt-0.5">
                    {c?.[0] ? `${fmtCompact(c[0])} entries` : '—'} · {x.steps?.length || 0} steps
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Funnel detail */}
      <div className="col-span-8 flex flex-col min-h-0 overflow-auto custom-scrollbar">
        {f ? (
          <div className="p-4 space-y-4">
            {/* Header metrics */}
            <div className="grid grid-cols-3 gap-3">
              <MetricCard label="Entry" value={f.counts?.[0] ? fmtCompact(f.counts[0]) : '—'} />
              <MetricCard
                label="Completion"
                value={fmtPct(completion)}
                tone={completion >= 0.15 ? 'good' : completion >= 0.05 ? 'warn' : 'bad'}
              />
              <MetricCard
                label="Conversions"
                value={f.counts?.length ? fmtCompact(f.counts[f.counts.length - 1]) : '—'}
              />
            </div>

            {/* Funnel visualization */}
            <div className="rounded border border-[var(--brand-surface-3)]] bg-[var(--brand-surface-1)]] p-4">
              <div className="text-[10px] uppercase tracking-wider text-[var(--brand-text-faint)]] mb-3">{f.name}</div>
              <Funnel steps={funnelSteps} accent="#f43f5e" />
            </div>

            {/* Drop-off analysis */}
            {dropoffs.length > 0 && (
              <div className="rounded border border-[var(--brand-surface-3)]] bg-[var(--brand-surface-1)]] p-4">
                <div className="text-[10px] uppercase tracking-wider text-[var(--brand-text-faint)]] mb-3">Biggest drop-offs</div>
                <div className="space-y-2">
                  {dropoffs.slice(0, 5).map((d: any, i: number) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] text-[var(--brand-text-mid)]] truncate">{d.from} → {d.label}</div>
                        <div className="text-[10px] text-[var(--brand-text-faint)]]">
                          {fmtCompact(d.fromCount)} → {fmtCompact(d.toCount)}
                        </div>
                      </div>
                      <div className="w-16 h-1.5 rounded-full bg-[var(--brand-surface-3)]] overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.max(5, d.drop * 100)}%`,
                            background: d.drop > 0.5 ? STATUS_HEX.bad : d.drop > 0.2 ? STATUS_HEX.warn : '#f43f5e',
                          }}
                        />
                      </div>
                      <span className="w-12 text-right text-[10px] font-mono text-[#ef4444] tabular-nums">
                        -{fmtPct(d.drop)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Segments */}
            {f.segments && f.segments.length > 0 && (
              <div className="rounded border border-[var(--brand-surface-3)]] bg-[var(--brand-surface-1)]] p-4">
                <div className="text-[10px] uppercase tracking-wider text-[var(--brand-text-faint)]] mb-3">Segments</div>
                <div className="grid grid-cols-2 gap-3">
                  {f.segments.map((s: any) => {
                    const segSteps = (f.steps || []).map((st: any, i: number) => ({
                      label: st.label || `Step ${i + 1}`,
                      value: s.counts?.[i] ?? 0,
                    }));
                    return (
                      <div key={s.name} className="rounded border border-[var(--brand-surface-3)]] bg-[var(--brand-surface-0)]] p-3">
                        <div className="text-[11px] text-[var(--brand-text-strong)] mb-2">{s.name}</div>
                        <Funnel steps={segSteps} accent="#f43f5e" />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 grid place-items-center text-[12px] text-[var(--brand-text-faint)]]">
            Select a funnel to see details.
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({ label, value, tone }: { label: string; value: string; tone?: string }) {
  const toneClass = tone === 'good' ? 'text-[#22c55e]' : tone === 'warn' ? 'text-[#f59e0b]' : tone === 'bad' ? 'text-[#ef4444]' : 'text-[var(--brand-text-strong)]';
  return (
    <div className="rounded border border-[var(--brand-surface-3)]] bg-[var(--brand-surface-1)]] px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-[var(--brand-text-faint)]]">{label}</div>
      <div className={`text-[16px] font-mono font-semibold tabular-nums ${toneClass}`}>{value}</div>
    </div>
  );
}
