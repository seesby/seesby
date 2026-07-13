import React from 'react'
import { useCompetitorsInsights } from '../_hooks/useCompetitorsInsights'
import { EmptyState } from '../_shared/EmptyState'
import { Card } from '../_shared/Card'
import { KpiTile } from '../_shared/KpiTile'
import { ProgressRing } from '../_shared/ProgressRing'
import { Sparkline } from '../_shared/Sparkline'
import { Trendable } from '../_shared/blocks/Trendable'
import { SingleCrawlNotice } from '../_shared/blocks/SingleCrawlNotice'
import { fmtPct, compactNum } from '../_shared/format'

export function CompetitorsOverview() {
  const s = useCompetitorsInsights()
  if (!s.byCompetitor?.length) return <EmptyState title="No competitor data yet" />

  const grade = s.score >= 80 ? 'A' : s.score >= 60 ? 'B' : s.score >= 40 ? 'C' : 'D'
  const sorted = [...s.byCompetitor].sort((a: any, b: any) => b.visibility - a.visibility)
  const maxVisibility = Math.max(...sorted.map((c: any) => c.visibility))

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* Score card */}
      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[#666] font-semibold">Competitive Score</div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="text-3xl font-bold tabular-nums text-white">{s.score}</span>
              <span className="text-sm font-semibold text-[#666]">{grade}</span>
            </div>
            <Trendable hasPrior={s.hasPrior}>
              <div className="mt-2"><Sparkline values={s.visibilitySeries} tone="info" width={100} height={28} /></div>
            </Trendable>
          </div>
          <ProgressRing value={s.score} size={72} />
        </div>
      </Card>

      {/* Key metrics */}
      <div className="grid grid-cols-2 gap-2">
        <KpiTile
          label="Rank"
          value={`#${s.rank}`}
          delta={`from #${s.rankPrev}`}
          deltaTone={s.rank < s.rankPrev ? 'up' : 'down'}
        />
        <KpiTile
          label="Visibility"
          value={fmtPct(s.visibilityShare * 100)}
          delta={`${s.visibilityShare > s.visibilitySharePrev ? '+' : ''}${fmtPct((s.visibilityShare - s.visibilitySharePrev) * 100)}`}
          deltaTone={s.visibilityShare > s.visibilitySharePrev ? 'up' : 'down'}
        />
      </div>

      {/* Leaderboard with visual bars */}
      <Card padded={false}>
        <div className="px-3 py-2 border-b border-[#1f1f1f]">
          <span className="text-[10px] uppercase tracking-wider text-[#666] font-semibold">Leaderboard</span>
        </div>
        <div className="divide-y divide-[#1f1f1f]">
          {sorted.map((c: any, idx: number) => {
            const barWidth = maxVisibility > 0 ? (c.visibility / maxVisibility) * 100 : 0
            return (
              <div key={c.id} className="flex items-center gap-3 px-3 py-2">
                <div className="w-5 text-center">
                  <span className="text-[10px] font-mono text-[#666]">{idx + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[11px] truncate ${c.isYou ? 'text-[#F59E0B] font-semibold' : 'text-[#ddd]'}`}>
                      {c.domain}
                    </span>
                    {c.isYou && (
                      <span className="text-[8px] px-1 py-0.5 rounded bg-[#F59E0B]/20 text-[#F59E0B] font-semibold uppercase">
                        You
                      </span>
                    )}
                  </div>
                  <div className="h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${barWidth}%`,
                        background: c.isYou ? '#F59E0B' : '#444',
                      }}
                    />
                  </div>
                </div>
                <div className="text-[11px] font-mono tabular-nums text-[#888] w-12 text-right">
                  {fmtPct(c.visibility * 100)}
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Side-by-side comparison */}
      <Card padded={false}>
        <div className="px-3 py-2 border-b border-[#1f1f1f]">
          <span className="text-[10px] uppercase tracking-wider text-[#666] font-semibold">Side by Side</span>
        </div>
        <div className="divide-y divide-[#1f1f1f]">
          {sorted.map((c: any) => (
            <div key={c.id} className="px-3 py-2">
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-[11px] truncate ${c.isYou ? 'text-[#F59E0B] font-semibold' : 'text-[#ddd]'}`}>
                  {c.domain}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-[#666]">Ref doms</div>
                  <div className="text-[11px] font-mono tabular-nums text-[#ddd]">{compactNum(c.refDomains)}</div>
                </div>
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-[#666]">Top 10</div>
                  <div className="text-[11px] font-mono tabular-nums text-[#ddd]">{compactNum(c.top10)}</div>
                </div>
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-[#666]">Traffic</div>
                  <div className="text-[11px] font-mono tabular-nums text-[#ddd]">{compactNum(c.traffic)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Movement trend */}
      <Trendable hasPrior={s.hasPrior}>
        <Card padded={false}>
          <div className="px-3 py-2 border-b border-[#1f1f1f]">
            <span className="text-[10px] uppercase tracking-wider text-[#666] font-semibold">Movement (30d)</span>
          </div>
          <div className="px-3 py-3">
            <div className="flex items-center justify-between gap-2">
              {[
                { label: 'Climbing', value: s.movers.climbing, color: 'bg-emerald-500' },
                { label: 'Steady', value: s.movers.steady, color: 'bg-[#444]' },
                { label: 'Falling', value: s.movers.falling, color: 'bg-red-500' },
                { label: 'New', value: s.movers.new, color: 'bg-blue-500' },
              ].map((m) => (
                <div key={m.label} className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${m.color}`} />
                  <span className="text-[10px] text-[#888]">{m.label}</span>
                  <span className="text-[11px] font-mono tabular-nums text-[#ddd]">{m.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </Trendable>

      {!s.hasPrior && <SingleCrawlNotice />}
    </div>
  )
}
