import React from 'react'
import { useCompetitorsInsights } from '../_hooks/useCompetitorsInsights'
import { EmptyState } from '../_shared/EmptyState'
import { Card } from '../_shared/Card'
import { KpiTile } from '../_shared/KpiTile'
import { BarStack } from '../_shared/bars'
import { TopList } from '../_shared/lists'
import { compactNum } from '../_shared/format'

export function CompetitorsGaps() {
  const s = useCompetitorsInsights()
  if (!s.byCompetitor?.length) return <EmptyState title="No competitor data yet" />

  const { gaps } = s

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* Key metrics */}
      <div className="grid grid-cols-3 gap-2">
        <KpiTile label="Total" value={gaps.total} />
        <KpiTile label="Keywords" value={gaps.keywords} tone="info" />
        <KpiTile label="Content" value={gaps.content} tone="warn" />
      </div>

      {/* Estimated traffic potential */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[#666] font-semibold">Traffic Potential</div>
            <div className="mt-1 text-2xl font-bold tabular-nums text-emerald-400">
              {compactNum(gaps.estimatedTraffic)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-[#666] font-semibold">Quick Wins</div>
            <div className="mt-1 text-2xl font-bold tabular-nums text-blue-400">
              {gaps.quickWins.length}
            </div>
          </div>
        </div>
      </Card>

      {/* Gap breakdown */}
      <Card padded={false}>
        <div className="px-3 py-2 border-b border-[#1f1f1f]">
          <span className="text-[10px] uppercase tracking-wider text-[#666] font-semibold">Gap Breakdown</span>
        </div>
        <div className="px-3 py-3">
          <BarStack segments={[
            { value: gaps.keywords, tone: 'info', label: 'Keywords' },
            { value: gaps.content, tone: 'warn', label: 'Content' },
            { value: gaps.links, tone: 'neutral', label: 'Links' },
          ]} />
        </div>
      </Card>

      {/* Priority matrix */}
      <Card padded={false}>
        <div className="px-3 py-2 border-b border-[#1f1f1f]">
          <span className="text-[10px] uppercase tracking-wider text-[#666] font-semibold">Priority Matrix</span>
        </div>
        <div className="px-3 py-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-2">
              <div className="text-[9px] uppercase tracking-wider text-emerald-400 font-semibold">Easy + High Traffic</div>
              <div className="mt-1 text-lg font-bold tabular-nums text-emerald-400">{gaps.priorityMatrix.easyHighTraffic}</div>
            </div>
            <div className="rounded-md border border-blue-500/30 bg-blue-500/5 p-2">
              <div className="text-[9px] uppercase tracking-wider text-blue-400 font-semibold">Easy + Low Traffic</div>
              <div className="mt-1 text-lg font-bold tabular-nums text-blue-400">{gaps.priorityMatrix.easyLowTraffic}</div>
            </div>
            <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-2">
              <div className="text-[9px] uppercase tracking-wider text-amber-400 font-semibold">Hard + High Traffic</div>
              <div className="mt-1 text-lg font-bold tabular-nums text-amber-400">{gaps.priorityMatrix.hardHighTraffic}</div>
            </div>
            <div className="rounded-md border border-[#333] bg-[#111] p-2">
              <div className="text-[9px] uppercase tracking-wider text-[#666] font-semibold">Hard + Low Traffic</div>
              <div className="mt-1 text-lg font-bold tabular-nums text-[#888]">{gaps.priorityMatrix.hardLowTraffic}</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Quick wins */}
      <Card padded={false}>
        <div className="px-3 py-2 border-b border-[#1f1f1f]">
          <span className="text-[10px] uppercase tracking-wider text-[#666] font-semibold">Quick Wins</span>
        </div>
        <div className="px-3 py-2">
          <TopList items={gaps.quickWins.map((k: any) => ({
            id: k.keyword,
            primary: k.keyword,
            secondary: `KD: ${k.kd} | Vol: ${compactNum(k.volume)}`,
            tail: `~${compactNum(k.traffic)} traffic`,
          }))} />
        </div>
      </Card>

      {/* Difficulty distribution */}
      <Card padded={false}>
        <div className="px-3 py-2 border-b border-[#1f1f1f]">
          <span className="text-[10px] uppercase tracking-wider text-[#666] font-semibold">Difficulty</span>
        </div>
        <div className="px-3 py-3">
          <BarStack segments={[
            { value: gaps.byKd.easy, tone: 'good', label: 'Easy' },
            { value: gaps.byKd.medium, tone: 'warn', label: 'Medium' },
            { value: gaps.byKd.hard, tone: 'bad', label: 'Hard' },
          ]} />
        </div>
      </Card>

      {/* Top keywords */}
      <Card padded={false}>
        <div className="px-3 py-2 border-b border-[#1f1f1f]">
          <span className="text-[10px] uppercase tracking-wider text-[#666] font-semibold">Top Gap Keywords</span>
        </div>
        <div className="px-3 py-2">
          <TopList items={gaps.topKeywords.map((k: any) => ({
            id: k.keyword,
            primary: k.keyword,
            secondary: `KD: ${k.kd} | Vol: ${compactNum(k.volume)}`,
            tail: k.competitorRanking,
          }))} />
        </div>
      </Card>

      {/* Content topics */}
      <Card padded={false}>
        <div className="px-3 py-2 border-b border-[#1f1f1f]">
          <span className="text-[10px] uppercase tracking-wider text-[#666] font-semibold">Content Topics</span>
        </div>
        <div className="px-3 py-2">
          <TopList items={gaps.topTopics.map((t: any) => ({
            id: t.label,
            primary: t.label,
            secondary: `${t.competitorPages} competitor pages`,
            tail: `~${compactNum(t.traffic)} traffic`,
          }))} />
        </div>
      </Card>
    </div>
  )
}
