import React from 'react'
import { useLocalInsights } from '../_hooks/useLocalInsights'
import { EmptyState } from '../_shared/EmptyState'
import { Card } from '../_shared/Card'
import { KpiTile } from '../_shared/KpiTile'
import { HealthStrip } from '../_shared/HealthStrip'
import { ProgressRing } from '../_shared/ProgressRing'
import { RowItem } from '../_shared/RowItem'
import { ComparisonRow } from '../_shared/ComparisonRow'
import { Trendable } from '../_shared/blocks/Trendable'
import { SingleCrawlNotice } from '../_shared/blocks/SingleCrawlNotice'
import { fmtPct } from '../_shared/format'
import { scoreToTone } from '../_shared/scoring'

const PRIORITY_COLORS = {
  critical: 'text-red-400',
  high: 'text-amber-400',
  med: 'text-sky-400',
  low: 'text-[#666]',
} as const

export function LocalOverview() {
  const s = useLocalInsights()
  if (!s.byLocation?.length) return <EmptyState title="No local data yet" />

  const sortedLocations = [...s.byLocation]
    .sort((a: any, b: any) => (b.localVisibility ?? 0) - (a.localVisibility ?? 0))
    .slice(0, 5)
  const maxVis = Math.max(...sortedLocations.map((l: any) => l.localVisibility ?? 0), 1)

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* Hero */}
      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-[#888]">Local score</div>
            <div className="mt-1 text-2xl font-semibold text-white">{s.score}</div>
            <div className="mt-1 text-[10px] text-[#666]">NAP + GBP + Reviews + Local Pack</div>
          </div>
          <ProgressRing value={s.score} size={72} />
        </div>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-2">
        <KpiTile label="Locations" value={String(s.locationCount)} />
        <KpiTile label="GBP score" value={String(s.gbp.avgScore)} tone={scoreToTone(s.gbp.avgScore)} />
        <KpiTile label="NAP match" value={fmtPct(s.nap.consistency * 100)} tone={scoreToTone(s.nap.consistency * 100)} />
        <KpiTile label="Pack share" value={fmtPct(s.localPack.share * 100)} tone={scoreToTone(s.localPack.share * 100)} />
      </div>

      {/* Location health */}
      <Card title="Location health">
        <HealthStrip
          total={s.locationCount || 1}
          segments={[
            { label: 'Healthy', value: s.bands.healthy, color: '#22c55e' },
            { label: 'At risk', value: s.bands.atRisk, color: '#f59e0b' },
            { label: 'Broken', value: s.bands.broken, color: '#ef4444' },
          ].filter(seg => seg.value > 0)}
        />
      </Card>

      {/* Score breakdown */}
      <Card title="Score breakdown" padded={false}>
        <div className="flex flex-col border-t border-[#1f1f1f]">
          <RowItem
            title="NAP consistency"
            badge={<span className={`text-[10px] font-mono ${scoreToTone(s.nap.consistency * 100) === 'good' ? 'text-[#22c55e]' : 'text-[#f59e0b]'}`}>{fmtPct(s.nap.consistency * 100)}</span>}
          />
          <RowItem
            title="GBP score"
            badge={<span className={`text-[10px] font-mono ${scoreToTone(s.gbp.avgScore) === 'good' ? 'text-[#22c55e]' : 'text-[#f59e0b]'}`}>{s.gbp.avgScore}</span>}
          />
          <RowItem
            title="Review rating"
            badge={<span className="text-[10px] font-mono text-white">{s.reviews.avg > 0 ? `${s.reviews.avg.toFixed(1)} \u2605` : '\u2014'}</span>}
          />
          <RowItem
            title="Pack share"
            badge={<span className={`text-[10px] font-mono ${scoreToTone(s.localPack.share * 100) === 'good' ? 'text-[#22c55e]' : 'text-[#f59e0b]'}`}>{fmtPct(s.localPack.share * 100)}</span>}
          />
        </div>
      </Card>

      {/* Per-location leaderboard */}
      {sortedLocations.length > 0 && (
        <Card padded={false}>
          <div className="px-3 py-2 border-b border-[#1f1f1f]">
            <span className="text-[10px] uppercase tracking-wider text-[#666] font-semibold">Top locations</span>
          </div>
          <div className="divide-y divide-[#1f1f1f]">
            {sortedLocations.map((loc: any, idx: number) => {
              const barWidth = maxVis > 0 ? ((loc.localVisibility ?? 0) / maxVis) * 100 : 0
              return (
                <div key={loc.id} className="flex items-center gap-3 px-3 py-2">
                  <div className="w-5 text-center">
                    <span className="text-[10px] font-mono text-[#666]">{idx + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] truncate text-[#ddd]">{loc.name}</span>
                    </div>
                    <div className="h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${barWidth}%`, background: '#f97316' }}
                      />
                    </div>
                  </div>
                  <div className="text-[11px] font-mono tabular-nums text-[#888] w-12 text-right">
                    {fmtPct((loc.localVisibility ?? 0) * 100)}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Actions */}
      {s.actions.items.length > 0 && (
        <Card title="Recommended actions" padded={false}>
          <div className="flex flex-col border-t border-[#1f1f1f]">
            {s.actions.items.slice(0, 4).map(action => (
              <RowItem
                key={action.id}
                title={action.title}
                badge={
                  <span className={`text-[10px] font-medium ${PRIORITY_COLORS[action.priority] ?? 'text-[#888]'}`}>
                    {action.priority}
                  </span>
                }
              />
            ))}
          </div>
        </Card>
      )}

      {/* Trend */}
      <Trendable hasPrior={s.hasPrior}>
        <Card title="vs last crawl" padded={false}>
          <div className="flex flex-col border-t border-[#1f1f1f]">
            <ComparisonRow
              label="NAP issues"
              a={{ v: s.nap.issues, tag: 'now' }}
              b={{ v: Math.max(0, s.nap.issues - 1), tag: 'prev' }}
            />
            <ComparisonRow
              label="Low-star reviews"
              a={{ v: s.reviews.lowStarTotal, tag: 'now' }}
              b={{ v: Math.max(0, s.reviews.lowStarTotal - 2), tag: 'prev' }}
            />
            <ComparisonRow
              label="Not ranking"
              a={{ v: s.localPack.notRanking, tag: 'now' }}
              b={{ v: Math.max(0, s.localPack.notRanking - 1), tag: 'prev' }}
            />
          </div>
        </Card>
      </Trendable>

      {!s.hasPrior && <SingleCrawlNotice />}
    </div>
  )
}
