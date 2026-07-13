import React from 'react'
import { useCompetitorsInsights } from '../_hooks/useCompetitorsInsights'
import { EmptyState } from '../_shared/EmptyState'
import { Card } from '../_shared/Card'
import { KpiTile } from '../_shared/KpiTile'
import { BarStack } from '../_shared/bars'
import { TopList } from '../_shared/lists'
import { Sparkline } from '../_shared/Sparkline'
import { BenchmarkBar } from '../_shared/BenchmarkBar'
import { Trendable } from '../_shared/blocks/Trendable'
import { SingleCrawlNotice } from '../_shared/blocks/SingleCrawlNotice'
import { fmtPct, compactNum } from '../_shared/format'

export function CompetitorsWins() {
  const s = useCompetitorsInsights()
  if (!s.byCompetitor?.length) return <EmptyState title="No competitor data yet" />

  const { wins } = s

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* Key metrics */}
      <div className="grid grid-cols-3 gap-2">
        <KpiTile label="Wins" value={wins.total} tone="good" />
        <KpiTile label="Traffic" value={compactNum(wins.trafficGained)} tone="good" />
        <KpiTile label="Win rate" value={fmtPct(wins.rate * 100)} />
      </div>

      {/* Win velocity */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[#666] font-semibold">Win Velocity</div>
            <div className="mt-1 text-2xl font-bold tabular-nums text-emerald-400">
              +{wins.velocity} <span className="text-sm text-[#888]">per week</span>
            </div>
          </div>
          <Sparkline values={wins.series} tone="good" width={100} height={32} />
        </div>
      </Card>

      {/* Win types */}
      <Card padded={false}>
        <div className="px-3 py-2 border-b border-[#1f1f1f]">
          <span className="text-[10px] uppercase tracking-wider text-[#666] font-semibold">Win Types</span>
        </div>
        <div className="px-3 py-3">
          <BarStack segments={[
            { value: wins.byType.position, tone: 'good', label: 'Position' },
            { value: wins.byType.feature, tone: 'good', label: 'SERP feature' },
            { value: wins.byType.snippet, tone: 'info', label: 'Snippet' },
            { value: wins.byType.image, tone: 'info', label: 'Image' },
          ]} />
        </div>
      </Card>

      {/* Win rate benchmark */}
      <Card padded={false}>
        <div className="px-3 py-2 border-b border-[#1f1f1f]">
          <span className="text-[10px] uppercase tracking-wider text-[#666] font-semibold">Win Rate vs Benchmark</span>
        </div>
        <div className="px-3 py-3">
          <BenchmarkBar site={wins.rate} benchmark={s.bench.winRate} />
        </div>
      </Card>

      {/* Recent wins */}
      <Card padded={false}>
        <div className="px-3 py-2 border-b border-[#1f1f1f]">
          <span className="text-[10px] uppercase tracking-wider text-[#666] font-semibold">Recent Wins</span>
        </div>
        <div className="px-3 py-2">
          <TopList items={wins.recent.map((w: any) => ({
            id: w.keyword,
            primary: w.keyword,
            secondary: `+${w.delta} positions vs ${w.competitor}`,
            tail: `~${compactNum(w.traffic)} traffic`,
          }))} />
        </div>
      </Card>

      {/* Win by competitor */}
      <Card padded={false}>
        <div className="px-3 py-2 border-b border-[#1f1f1f]">
          <span className="text-[10px] uppercase tracking-wider text-[#666] font-semibold">Wins by Competitor</span>
        </div>
        <div className="px-3 py-2">
          <TopList items={wins.byCompetitor.map((c: any) => ({
            id: c.domain,
            primary: c.domain,
            secondary: `${c.wins} wins`,
            tail: `+${compactNum(c.trafficGain)}`,
          }))} />
        </div>
      </Card>

      {/* Win by topic */}
      <Card padded={false}>
        <div className="px-3 py-2 border-b border-[#1f1f1f]">
          <span className="text-[10px] uppercase tracking-wider text-[#666] font-semibold">Wins by Topic</span>
        </div>
        <div className="px-3 py-2">
          <TopList items={wins.byTopic.map((t: any) => ({
            id: t.label,
            primary: t.label,
            secondary: `${t.wins} wins | avg +${t.avgDelta}`,
            tail: `+${compactNum(t.trafficGain)}`,
          }))} />
        </div>
      </Card>

      {/* Defend these rankings */}
      <Trendable hasPrior={s.hasPrior}>
        <Card padded={false}>
          <div className="px-3 py-2 border-b border-[#1f1f1f]">
            <span className="text-[10px] uppercase tracking-wider text-[#666] font-semibold">Defend These</span>
          </div>
          <div className="px-3 py-2">
            <TopList items={wins.defendThese.map((d: any) => ({
              id: d.keyword,
              primary: d.keyword,
              secondary: `Position #${d.position} | Risk: ${d.risk}`,
              tail: d.competitor,
            }))} />
          </div>
        </Card>
      </Trendable>

      {!s.hasPrior && <SingleCrawlNotice />}
    </div>
  )
}
