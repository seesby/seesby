import React from 'react'
import { useCompetitorsInsights } from '../_hooks/useCompetitorsInsights'
import { EmptyState } from '../_shared/EmptyState'
import { Card } from '../_shared/Card'
import { KpiTile } from '../_shared/KpiTile'
import { BarStack } from '../_shared/bars'
import { TopList } from '../_shared/lists'
import { Sparkline } from '../_shared/Sparkline'
import { Trendable } from '../_shared/blocks/Trendable'
import { SingleCrawlNotice } from '../_shared/blocks/SingleCrawlNotice'
import { compactNum } from '../_shared/format'

export function CompetitorsLosses() {
  const s = useCompetitorsInsights()
  if (!s.byCompetitor?.length) return <EmptyState title="No competitor data yet" />

  const { losses } = s

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* Key metrics */}
      <div className="grid grid-cols-2 gap-2">
        <KpiTile label="Losses" value={losses.total} tone="bad" />
        <KpiTile label="Traffic lost" value={compactNum(losses.trafficLost)} tone="bad" />
      </div>

      {/* Recovery potential */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[var(--brand-text-faint)] font-semibold">Recoverable</div>
            <div className="mt-1 text-2xl font-bold tabular-nums text-amber-400">
              {losses.recoverable} <span className="text-sm text-[var(--brand-text-mid)]">keywords</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-[var(--brand-text-faint)] font-semibold">vs Last Period</div>
            <div className="mt-1 text-lg font-bold tabular-nums text-emerald-400">
              {losses.total < losses.totalPrev ? 'Improved' : 'Worsened'}
            </div>
          </div>
        </div>
      </Card>

      {/* Loss types */}
      <Card padded={false}>
        <div className="px-3 py-2 border-b border-[var(--brand-surface-3)]">
          <span className="text-[10px] uppercase tracking-wider text-[var(--brand-text-faint)] font-semibold">Loss Types</span>
        </div>
        <div className="px-3 py-3">
          <BarStack segments={[
            { value: losses.byType.position, tone: 'bad', label: 'Position' },
            { value: losses.byType.feature, tone: 'warn', label: 'SERP feature' },
            { value: losses.byType.snippet, tone: 'warn', label: 'Snippet' },
            { value: losses.byType.dropped, tone: 'bad', label: 'Dropped' },
          ]} />
        </div>
      </Card>

      {/* Severity breakdown */}
      <Card padded={false}>
        <div className="px-3 py-2 border-b border-[var(--brand-surface-3)]">
          <span className="text-[10px] uppercase tracking-wider text-[var(--brand-text-faint)] font-semibold">Severity</span>
        </div>
        <div className="px-3 py-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-[10px] text-[var(--brand-text-mid)]">High</span>
              <span className="text-[11px] font-mono tabular-nums text-[var(--brand-text-mid)]">{losses.severity.high}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-[10px] text-[var(--brand-text-mid)]">Medium</span>
              <span className="text-[11px] font-mono tabular-nums text-[var(--brand-text-mid)]">{losses.severity.medium}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[var(--brand-border-2)]" />
              <span className="text-[10px] text-[var(--brand-text-mid)]">Low</span>
              <span className="text-[11px] font-mono tabular-nums text-[var(--brand-text-mid)]">{losses.severity.low}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Recent losses */}
      <Card padded={false}>
        <div className="px-3 py-2 border-b border-[var(--brand-surface-3)]">
          <span className="text-[10px] uppercase tracking-wider text-[var(--brand-text-faint)] font-semibold">Recent Losses</span>
        </div>
        <div className="px-3 py-2">
          <TopList items={losses.recent.map((l: any) => ({
            id: l.keyword,
            primary: l.keyword,
            secondary: `${l.delta} positions to ${l.toCompetitor}`,
            tail: `~${compactNum(l.traffic)} traffic`,
          }))} />
        </div>
      </Card>

      {/* Recovery recommendations */}
      <Card padded={false}>
        <div className="px-3 py-2 border-b border-[var(--brand-surface-3)]">
          <span className="text-[10px] uppercase tracking-wider text-[var(--brand-text-faint)] font-semibold">Recovery Actions</span>
        </div>
        <div className="px-3 py-2">
          <TopList items={losses.recommendations.map((r: any) => ({
            id: r.keyword,
            primary: r.keyword,
            secondary: r.action,
            tail: r.priority,
          }))} />
        </div>
      </Card>

      {/* Loss by competitor */}
      <Card padded={false}>
        <div className="px-3 py-2 border-b border-[var(--brand-surface-3)]">
          <span className="text-[10px] uppercase tracking-wider text-[var(--brand-text-faint)] font-semibold">Losses by Competitor</span>
        </div>
        <div className="px-3 py-2">
          <TopList items={losses.byCompetitor.map((c: any) => ({
            id: c.domain,
            primary: c.domain,
            secondary: `${c.losses} losses | avg ${c.avgDelta}`,
            tail: `-${compactNum(c.trafficLost)}`,
          }))} />
        </div>
      </Card>

      {/* Trend */}
      <Trendable hasPrior={s.hasPrior}>
        <Card padded={false}>
          <div className="px-3 py-2 border-b border-[var(--brand-surface-3)]">
            <span className="text-[10px] uppercase tracking-wider text-[var(--brand-text-faint)] font-semibold">Loss Trend</span>
          </div>
          <div className="px-3 py-3">
            <div className="w-full"><Sparkline values={losses.series} tone="bad" /></div>
          </div>
        </Card>
      </Trendable>

      {!s.hasPrior && <SingleCrawlNotice />}
    </div>
  )
}
