import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { usePaidInsights } from '../_hooks/usePaidInsights'
import { Card } from '../_shared/Card'
import { KpiTile } from '../_shared/KpiTile'
import { ProgressRing } from '../_shared/ProgressRing'
import { Sparkline } from '../_shared/Sparkline'
import { RowItem } from '../_shared/RowItem'
import { SingleCrawlNotice } from '../_shared/blocks/SingleCrawlNotice'
import { Trendable } from '../_shared/blocks/Trendable'
import { EmptyState } from '../_shared/empty'
import { fmtCurrency, fmtPct, compactNum } from '../_shared/format'

export function PaidOverview() {
  const { paidCampaigns } = useSeoCrawler() as any
  const s = usePaidInsights()

  if (!paidCampaigns?.length) return <EmptyState title="No paid data yet" hint="Connect Google Ads or Meta Ads." />

  const scoreGrade = s.score >= 80 ? 'A' : s.score >= 60 ? 'B' : s.score >= 40 ? 'C' : 'D'
  const spendDelta = s.hasPrior && s.spendPrev > 0 ? s.spend30d - s.spendPrev : undefined
  const cpaDelta = s.hasPrior && s.cpaPrev > 0 ? s.cpa - s.cpaPrev : undefined
  const roasDelta = s.hasPrior && s.roasPrev > 0 ? s.roas - s.roasPrev : undefined

  const gaps = [
    { label: 'Low QS (< 5)', value: s.below5 },
    { label: 'Wasted spend', value: s.wastedTotal > 0 ? 1 : 0, extra: fmtCurrency(s.wastedTotal) },
    { label: 'Broken landing pages', value: s.lps.broken },
    { label: 'Slow landing pages', value: s.lps.slow },
    { label: 'Lost budget share', value: s.auction.lostBudget > 0.2 ? 1 : 0, extra: fmtPct(s.auction.lostBudget * 100) },
    { label: 'Lost rank share', value: s.auction.lostRank > 0.2 ? 1 : 0, extra: fmtPct(s.auction.lostRank * 100) },
  ].filter(g => g.value > 0).slice(0, 5)

  const perfRows = [
    { label: 'Winning', value: s.bands.winning, color: '#22c55e', desc: 'ROAS > 3' },
    { label: 'Steady', value: s.bands.steady, color: '#3b82f6', desc: 'ROAS 2–3' },
    { label: 'At risk', value: s.bands.atRisk, color: '#f59e0b', desc: 'ROAS 1–2' },
    { label: 'Losing', value: s.bands.losing, color: '#ef4444', desc: 'ROAS < 1' },
  ].filter(r => r.value > 0)

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* Score card */}
      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-[var(--brand-text-mid)]">Paid score</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-bold tabular-nums text-[var(--brand-text-strong)]">{s.score}</span>
              <span className="text-sm font-medium text-[var(--brand-text-faint)]">{scoreGrade}</span>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <Trendable hasPrior={s.hasPrior}>
                {s.spendSeries.length > 1 && (
                  <Sparkline values={s.spendSeries} width={80} height={20} />
                )}
              </Trendable>
            </div>
          </div>
          <ProgressRing value={s.score} size={72} />
        </div>
      </Card>

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-2">
        <KpiTile
          label="Spend (30d)"
          value={fmtCurrency(s.spend30d)}
          sub={s.hasPrior && typeof spendDelta === 'number' ? `${spendDelta >= 0 ? '+' : ''}${fmtCurrency(spendDelta)} vs prev` : undefined}
        />
        <KpiTile
          label="Conversions"
          value={compactNum(s.conv30d)}
          sub={s.revenue30d > 0 ? `Rev ${fmtCurrency(s.revenue30d)}` : undefined}
        />
        <KpiTile
          label="CPA"
          value={fmtCurrency(s.cpa)}
          tone={s.cpa > s.bench.cpa ? 'warn' : 'good'}
          sub={s.hasPrior && typeof cpaDelta === 'number' ? `${cpaDelta >= 0 ? '+' : ''}${fmtCurrency(cpaDelta)}` : undefined}
        />
        <KpiTile
          label="ROAS"
          value={`${s.roas.toFixed(1)}x`}
          tone={s.roas >= 3 ? 'good' : s.roas >= 1 ? 'info' : 'bad'}
          sub={s.hasPrior && typeof roasDelta === 'number' ? `${roasDelta >= 0 ? '+' : ''}${roasDelta.toFixed(1)}x` : undefined}
        />
      </div>

      {/* Performance breakdown */}
      {perfRows.length > 0 && (
        <Card title="Campaign performance" padded={false}>
          <div className="flex flex-col border-t border-[var(--brand-surface-3)]">
            {perfRows.map((r) => (
              <div key={r.label} className="flex items-center justify-between px-3 py-2 border-b border-[var(--brand-surface-3)] last:border-b-0">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: r.color }} />
                  <span className="text-[11px] text-[var(--brand-text-mid)]">{r.label}</span>
                  <span className="text-[10px] text-[var(--brand-text-faint)]">{r.desc}</span>
                </div>
                <span className="text-[11px] font-mono font-medium text-[var(--brand-text-strong)]">{r.value}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Top gaps */}
      {gaps.length > 0 && (
        <Card title="Needs attention" padded={false}>
          <div className="flex flex-col border-t border-[var(--brand-surface-3)]">
            {gaps.map((g, i) => (
              <RowItem
                key={i}
                title={g.label}
                badge={
                  <span className="text-[10px] font-mono text-[#f59e0b]">
                    {g.extra || g.value}
                  </span>
                }
              />
            ))}
          </div>
        </Card>
      )}

      {/* QS summary */}
      <Card padded={false}>
        <div className="flex flex-col border-t border-[var(--brand-surface-3)]">
          <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--brand-surface-3)]">
            <span className="text-[11px] text-[var(--brand-text-mid)]">Avg Quality Score</span>
            <span className="text-[11px] font-mono font-medium text-[var(--brand-text-strong)]">
              {s.avgQs > 0 ? s.avgQs.toFixed(1) : '—'} /10
            </span>
          </div>
          <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--brand-surface-3)]">
            <span className="text-[11px] text-[var(--brand-text-mid)]">QS &ge; 8 (excellent)</span>
            <span className="text-[11px] font-mono font-medium text-[#22c55e]">{s.above8}</span>
          </div>
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-[11px] text-[var(--brand-text-mid)]">Total campaigns</span>
            <span className="text-[11px] font-mono font-medium text-[var(--brand-text-strong)]">{s.total}</span>
          </div>
        </div>
      </Card>

      {!s.hasPrior && <SingleCrawlNotice />}
    </div>
  )
}
