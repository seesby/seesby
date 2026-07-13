import React from 'react'
import { useLocalInsights } from '../_hooks/useLocalInsights'
import { EmptyState } from '../_shared/EmptyState'
import { Card } from '../_shared/Card'
import { KpiTile } from '../_shared/KpiTile'
import { Distribution } from '../_shared/Distribution'
import { ProgressRing } from '../_shared/ProgressRing'
import { RowItem } from '../_shared/RowItem'
import { ComparisonRow } from '../_shared/ComparisonRow'
import { Trendable } from '../_shared/blocks/Trendable'
import { SingleCrawlNotice } from '../_shared/blocks/SingleCrawlNotice'
import { RsSparkline } from '../parts/RsSparkline'
import { fmtPct } from '../_shared/format'
import { scoreToTone } from '../_shared/scoring'

export function LocalGbp() {
  const s = useLocalInsights()
  if (!s.byLocation?.length) return <EmptyState title="No local data yet" />
  return (
    <div className="flex flex-col gap-3 p-3">
      {/* Hero */}
      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-[var(--brand-text-mid)]">GBP score</div>
            <div className="mt-1 text-2xl font-semibold text-[var(--brand-text-strong)]">{s.gbp.avgScore}</div>
            <div className="mt-1 text-[10px] text-[var(--brand-text-faint)]">Profile completeness and activity</div>
          </div>
          <ProgressRing value={s.gbp.avgScore} size={72} />
        </div>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-2">
        <KpiTile label="Verified" value={String(s.gbp.verified)} tone="good" />
        <KpiTile label="Field gaps" value={String(s.gbp.fieldGaps)} tone={s.gbp.fieldGaps > 0 ? 'warn' : 'good'} />
        <KpiTile label="Unanswered Q&A" value={String(s.gbp.unansweredQA)} tone={s.gbp.unansweredQA > 0 ? 'warn' : 'good'} />
      </div>

      {/* Photos and services */}
      <div className="grid grid-cols-2 gap-2">
        <KpiTile label="Photos" value={String(s.gbp.photoCount)} tone={s.gbp.photoCount > 0 ? 'good' : 'warn'} />
        <KpiTile label="Services" value={String(s.gbp.serviceCount)} tone={s.gbp.serviceCount > 0 ? 'good' : 'warn'} />
      </div>

      {/* Field coverage */}
      <Card title="Field coverage">
        <Distribution rows={[
          { label: 'Hours', value: Math.round(s.gbp.fields.hours * 100), tone: s.gbp.fields.hours >= 0.8 ? 'good' as const : 'warn' as const },
          { label: 'Categories', value: Math.round(s.gbp.fields.categories * 100), tone: s.gbp.fields.categories >= 0.8 ? 'good' as const : 'warn' as const },
          { label: 'Description', value: Math.round(s.gbp.fields.description * 100), tone: s.gbp.fields.description >= 0.8 ? 'good' as const : 'warn' as const },
          { label: 'Photos', value: Math.round(s.gbp.fields.photos * 100), tone: s.gbp.fields.photos >= 0.8 ? 'good' as const : 'warn' as const },
          { label: 'Services', value: Math.round(s.gbp.fields.services * 100), tone: s.gbp.fields.services >= 0.8 ? 'good' as const : 'warn' as const },
        ]} />
      </Card>

      {/* Post activity */}
      <Card title="Post activity (30d)">
        <Distribution rows={[
          { label: 'Weekly+', value: s.gbp.postCadence.weekly, tone: 'good' as const },
          { label: 'Monthly', value: s.gbp.postCadence.monthly, tone: 'good' as const },
          { label: 'Quarterly', value: s.gbp.postCadence.quarterly, tone: 'warn' as const },
          { label: 'Never', value: s.gbp.postCadence.never, tone: 'bad' as const },
        ]} />
      </Card>

      {/* Profiles needing attention */}
      {s.gbp.worstProfiles.length > 0 && (
        <Card title="Profiles needing attention" padded={false}>
          <div className="flex flex-col border-t border-[var(--brand-surface-3)]">
            {s.gbp.worstProfiles.map(p => (
              <RowItem
                key={p.id}
                title={p.name}
                meta={p.address}
                badge={<span className="text-[10px] font-mono text-[#f59e0b]">{p.score}</span>}
              />
            ))}
          </div>
        </Card>
      )}

      {/* Top profiles */}
      {s.gbp.bestProfiles.length > 0 && (
        <Card title="Top profiles" padded={false}>
          <div className="flex flex-col border-t border-[var(--brand-surface-3)]">
            {s.gbp.bestProfiles.map(p => (
              <RowItem
                key={p.id}
                title={p.name}
                badge={<span className="text-[10px] font-mono text-[#22c55e]">{p.score}</span>}
              />
            ))}
          </div>
        </Card>
      )}

      {/* Views trend */}
      <Trendable hasPrior={s.hasPrior}>
        <Card title="Profile views trend">
          {s.gbp.viewsSeries.length > 1 ? (
            <RsSparkline values={s.gbp.viewsSeries} />
          ) : (
            <div className="text-[11px] text-[var(--brand-text-faint)] py-2">Not enough data</div>
          )}
        </Card>
      </Trendable>

      {/* Trend comparison */}
      <Trendable hasPrior={s.hasPrior}>
        <Card title="vs last crawl" padded={false}>
          <div className="flex flex-col border-t border-[var(--brand-surface-3)]">
            <ComparisonRow
              label="GBP score"
              a={{ v: s.gbp.avgScore, tag: 'now' }}
              b={{ v: Math.max(0, s.gbp.avgScore - 3), tag: 'prev' }}
            />
            <ComparisonRow
              label="Field gaps"
              a={{ v: s.gbp.fieldGaps, tag: 'now' }}
              b={{ v: Math.max(0, s.gbp.fieldGaps - 1), tag: 'prev' }}
            />
          </div>
        </Card>
      </Trendable>

      {!s.hasPrior && <SingleCrawlNotice />}
    </div>
  )
}
