import React from 'react'
import { useUxInsights } from '../_hooks/useUxInsights'
import { useHasTrend } from '../_hooks/useSessionsCount'
import { useDrill } from '../_shared/drill'
import { Card } from '../_shared/Card'
import { KpiTile } from '../_shared/KpiTile'
import { HealthStrip } from '../_shared/HealthStrip'
import { SegmentTable } from '../_shared/SegmentTable'
import { Sparkline } from '../_shared/Sparkline'
import { RowItem } from '../_shared/RowItem'
import { EmptyState } from '../_shared/empty'
import { compactNum, fmtPct } from '../_shared/format'

export function UxFunnels() {
  const s = useUxInsights()
  const hasTrend = useHasTrend()
  const drill = useDrill()

  if (!s.total) return <EmptyState title="No crawl data yet" />

  const totalSteps = s.funnels.healthy + s.funnels.dropping + s.funnels.broken
  const worstStep = s.funnels.worstStep

  // Step-level drop analysis for primary funnel
  const stepDrops = s.funnels.primary.slice(1).map((step, i) => {
    const prev = s.funnels.primary[i]
    const dropPct = prev.value > 0 ? Math.round((1 - step.value / prev.value) * 100) : 0
    return { label: step.label, from: prev.label, dropPct, value: step.value, prevValue: prev.value }
  }).filter(s => s.dropPct > 0).sort((a, b) => b.dropPct - a.dropPct)

  // Funnels with best/worst completion
  const sortedFunnels = [...s.funnels.list].sort((a: any, b: any) => b.completion - a.completion)
  const bestFunnel = sortedFunnels[0]
  const worstFunnel = sortedFunnels[sortedFunnels.length - 1]

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-2">
        <KpiTile
          label="Avg completion"
          value={fmtPct(s.funnels.avgCompletion * 100)}
          tone={s.funnels.avgCompletion >= 0.15 ? 'good' : 'warn'}
        />
        <KpiTile
          label="Funnels"
          value={String(s.funnels.list.length)}
        />
        <KpiTile
          label="Healthy steps"
          value={String(s.funnels.healthy)}
          tone={s.funnels.healthy > 0 ? 'good' : 'neutral'}
        />
        <KpiTile
          label="Drops"
          value={String(s.funnels.dropping + s.funnels.broken)}
          tone={s.funnels.dropping + s.funnels.broken > 0 ? 'bad' : 'good'}
          sub={`${s.funnels.broken} broken`}
        />
      </div>

      {/* Step health */}
      <Card title="Step health">
        <HealthStrip
          total={totalSteps || 1}
          segments={[
            { label: 'Healthy', value: s.funnels.healthy, color: '#22c55e' },
            { label: 'Dropping', value: s.funnels.dropping, color: '#f59e0b' },
            { label: 'Broken', value: s.funnels.broken, color: '#ef4444' },
          ].filter(seg => seg.value > 0)}
        />
      </Card>

      {/* Primary funnel visual */}
      <Card title="Primary funnel">
        {s.funnels.primary.length > 0 ? (
          <div className="space-y-1.5">
            {s.funnels.primary.slice(0, 7).map((step, i) => {
              const max = s.funnels.primary[0]?.value || 1
              const pct = max > 0 ? (step.value / max) * 100 : 0
              const dropFromPrev = i > 0 && s.funnels.primary[i - 1].value > 0
                ? Math.round((1 - step.value / s.funnels.primary[i - 1].value) * 100)
                : 0
              return (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-[70px] truncate text-[10px] text-[var(--brand-text-mid)]">{step.label}</span>
                  <div className="flex-1 h-2.5 rounded-full bg-[var(--brand-surface-2)] overflow-hidden">
                    <div
                      className={`h-full rounded-full ${dropFromPrev > 50 ? 'bg-red-500/60' : dropFromPrev > 20 ? 'bg-amber-500/60' : 'bg-[#f43f5e]/60'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-[50px] text-right text-[10px] font-mono text-[var(--brand-text-mid)]">{compactNum(step.value)}</span>
                  {dropFromPrev > 0 && (
                    <span className={`w-[36px] text-right text-[9px] font-mono ${dropFromPrev > 50 ? 'text-red-400' : dropFromPrev > 20 ? 'text-amber-400' : 'text-[var(--brand-text-mid)]'}`}>
                      -{dropFromPrev}%
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-[11px] text-[var(--brand-text-faint)]">No funnel data. Set up funnels in the Funnels view.</div>
        )}
      </Card>

      {/* Step drops analysis */}
      <Card title="Biggest drops">
        {stepDrops.length > 0 ? (
          <div className="flex flex-col border-t border-[var(--brand-surface-3)]">
            {stepDrops.slice(0, 4).map((d, i) => (
              <RowItem
                key={i}
                title={`${d.from} → ${d.label}`}
                meta={`${compactNum(d.prevValue)} → ${compactNum(d.value)}`}
                badge={<span className={`text-[10px] font-mono ${d.dropPct > 50 ? 'text-[#ef4444]' : 'text-[#f59e0b]'}`}>-{d.dropPct}%</span>}
              />
            ))}
          </div>
        ) : (
          <div className="text-[11px] text-[var(--brand-text-faint)]">No step drops detected.</div>
        )}
      </Card>

      {/* Secondary funnel */}
      <Card title="Secondary funnel">
        {s.funnels.secondary.length > 0 ? (
          <div className="space-y-1.5">
            {s.funnels.secondary.slice(0, 6).map((step, i) => {
              const max = s.funnels.secondary[0]?.value || 1
              const pct = max > 0 ? (step.value / max) * 100 : 0
              const dropFromPrev = i > 0 && s.funnels.secondary[i - 1].value > 0
                ? Math.round((1 - step.value / s.funnels.secondary[i - 1].value) * 100)
                : 0
              return (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-[70px] truncate text-[10px] text-[var(--brand-text-mid)]">{step.label}</span>
                  <div className="flex-1 h-2.5 rounded-full bg-[var(--brand-surface-2)] overflow-hidden">
                    <div className="h-full rounded-full bg-[#60a5fa]/50" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-[50px] text-right text-[10px] font-mono text-[var(--brand-text-mid)]">{compactNum(step.value)}</span>
                  {dropFromPrev > 0 && (
                    <span className="w-[36px] text-right text-[9px] font-mono text-amber-400">-{dropFromPrev}%</span>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-[11px] text-[var(--brand-text-faint)]">No secondary funnel data.</div>
        )}
      </Card>

      {/* All funnels table */}
      <Card title="All funnels">
        {s.funnels.list.length > 0 ? (
          <SegmentTable
            headers={['Funnel', 'Steps', 'Completion', 'Worst step']}
            rows={s.funnels.list.map((f: any) => ({
              id: f.id, label: f.name,
              values: [f.steps, fmtPct(f.completion * 100), f.worstStep || '—'],
            }))}
          />
        ) : (
          <div className="text-[11px] text-[var(--brand-text-faint)]">No funnels configured.</div>
        )}
      </Card>

      {/* Best and worst funnels */}
      {bestFunnel && worstFunnel && (
        <div className="grid grid-cols-2 gap-2">
          <Card>
            <div className="text-[10px] uppercase tracking-wide text-[var(--brand-text-faint)] mb-1">Best</div>
            <div className="text-[11px] text-[var(--brand-text-strong)] font-medium truncate">{bestFunnel.name}</div>
            <div className="text-[10px] text-emerald-400">{fmtPct(bestFunnel.completion * 100)}</div>
          </Card>
          <Card>
            <div className="text-[10px] uppercase tracking-wide text-[var(--brand-text-faint)] mb-1">Worst</div>
            <div className="text-[11px] text-[var(--brand-text-strong)] font-medium truncate">{worstFunnel.name}</div>
            <div className="text-[10px] text-red-400">{fmtPct(worstFunnel.completion * 100)}</div>
          </Card>
        </div>
      )}

      {/* Worst step callout */}
      {worstStep && (
        <Card tone="accent">
          <div className="flex items-center gap-2">
            <div className="text-[11px] text-[var(--brand-text-mid)]">
              <span className="font-medium text-[var(--brand-text-strong)]">{worstStep.name}</span> has the biggest drop
            </div>
            <span className="ml-auto text-[11px] font-mono text-red-400">-{Math.round(worstStep.dropPct * 100)}%</span>
          </div>
        </Card>
      )}

      {/* Completion trend - only with multi-crawl */}
      <Card title="Completion trend">
        {hasTrend && s.funnels.completionSeries.length > 1 ? (
          <Sparkline values={s.funnels.completionSeries} tone="info" />
        ) : (
          <div className="text-[11px] text-[var(--brand-text-faint)]">Trend data will appear after the next crawl.</div>
        )}
      </Card>
    </div>
  )
}
