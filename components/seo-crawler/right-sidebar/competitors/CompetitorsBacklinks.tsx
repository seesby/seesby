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
import { compactNum } from '../_shared/format'

export function CompetitorsBacklinks() {
  const s = useCompetitorsInsights()
  if (!s.byCompetitor?.length) return <EmptyState title="No competitor data yet" />

  const { backlinks } = s

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* Key metrics */}
      <div className="grid grid-cols-2 gap-2">
        <KpiTile label="Your refdoms" value={compactNum(backlinks.you.refDomains)} />
        <KpiTile label="Gap" value={compactNum(backlinks.gapTotal)} tone="warn" />
      </div>

      {/* Link velocity */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[var(--brand-text-faint)]] font-semibold">Link Velocity</div>
            <div className="mt-1 text-2xl font-bold tabular-nums text-blue-400">
              +{backlinks.velocity} <span className="text-sm text-[var(--brand-text-mid)]]">per month</span>
            </div>
          </div>
          <Sparkline values={backlinks.youSeries} tone="info" width={100} height={32} />
        </div>
      </Card>

      {/* Quality distribution */}
      <Card padded={false}>
        <div className="px-3 py-2 border-b border-[var(--brand-surface-3)]]">
          <span className="text-[10px] uppercase tracking-wider text-[var(--brand-text-faint)]] font-semibold">Link Quality</span>
        </div>
        <div className="px-3 py-3">
          <BarStack segments={[
            { value: backlinks.quality.high, tone: 'good', label: 'High DR' },
            { value: backlinks.quality.medium, tone: 'info', label: 'Medium DR' },
            { value: backlinks.quality.low, tone: 'neutral', label: 'Low DR' },
          ]} />
        </div>
      </Card>

      {/* Referring domains comparison */}
      <Card padded={false}>
        <div className="px-3 py-2 border-b border-[var(--brand-surface-3)]]">
          <span className="text-[10px] uppercase tracking-wider text-[var(--brand-text-faint)]] font-semibold">Referring Domains</span>
        </div>
        <div className="px-3 py-2">
          <TopList items={backlinks.byCompetitor.slice(0, 6).map((c: any) => ({
            id: c.domain,
            primary: c.domain,
            secondary: c.isYou ? 'You' : '',
            tail: compactNum(c.refDomains),
          }))} />
        </div>
      </Card>

      {/* Benchmark */}
      <Card padded={false}>
        <div className="px-3 py-2 border-b border-[var(--brand-surface-3)]]">
          <span className="text-[10px] uppercase tracking-wider text-[var(--brand-text-faint)]] font-semibold">vs Average</span>
        </div>
        <div className="px-3 py-3">
          <BenchmarkBar site={backlinks.you.refDomains} benchmark={backlinks.avgCompetitor.refDomains} />
        </div>
      </Card>

      {/* High-value targets */}
      <Card padded={false}>
        <div className="px-3 py-2 border-b border-[var(--brand-surface-3)]]">
          <span className="text-[10px] uppercase tracking-wider text-[var(--brand-text-faint)]] font-semibold">High-Value Targets</span>
        </div>
        <div className="px-3 py-2">
          <TopList items={backlinks.highValueTargets.map((t: any) => ({
            id: t.domain,
            primary: t.domain,
            secondary: `DR ${t.dr} | ${t.difficulty}`,
            tail: `~${compactNum(t.traffic)}`,
          }))} />
        </div>
      </Card>

      {/* Link gap list */}
      <Card padded={false}>
        <div className="px-3 py-2 border-b border-[var(--brand-surface-3)]]">
          <span className="text-[10px] uppercase tracking-wider text-[var(--brand-text-faint)]] font-semibold">Link Gap</span>
        </div>
        <div className="px-3 py-2">
          <TopList items={backlinks.gapList.map((l: any) => ({
            id: l.domain,
            primary: l.domain,
            secondary: `DR ${l.dr} | ${l.competitors.length} competitors`,
            tail: `~${compactNum(l.traffic)}`,
          }))} />
        </div>
      </Card>

      {/* Your unique domains */}
      <Card padded={false}>
        <div className="px-3 py-2 border-b border-[var(--brand-surface-3)]]">
          <span className="text-[10px] uppercase tracking-wider text-[var(--brand-text-faint)]] font-semibold">Your Unique Domains</span>
        </div>
        <div className="px-3 py-2">
          <TopList items={backlinks.youOnly.map((d: any) => ({
            id: d.domain,
            primary: d.domain,
            secondary: `DR ${d.dr}`,
            tail: `~${compactNum(d.traffic)}`,
          }))} />
        </div>
      </Card>

      {/* Trend */}
      <Trendable hasPrior={s.hasPrior}>
        <Card padded={false}>
          <div className="px-3 py-2 border-b border-[var(--brand-surface-3)]]">
            <span className="text-[10px] uppercase tracking-wider text-[var(--brand-text-faint)]] font-semibold">Ref Domain Growth</span>
          </div>
          <div className="px-3 py-3">
            <div className="w-full"><Sparkline values={backlinks.youSeries} tone="info" /></div>
          </div>
        </Card>
      </Trendable>

      {!s.hasPrior && <SingleCrawlNotice />}
    </div>
  )
}
