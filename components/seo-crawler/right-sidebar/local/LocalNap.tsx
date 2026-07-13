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
import { FieldBar } from './FieldBar'
import { fmtPct } from '../_shared/format'
import { scoreToTone } from '../_shared/scoring'

export function LocalNap() {
  const s = useLocalInsights()
  if (!s.byLocation?.length) return <EmptyState title="No local data yet" />
  const consistencyPct = Math.round(s.nap.consistency * 100)

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* Hero */}
      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-[var(--brand-text-mid)]]">NAP consistency</div>
            <div className="mt-1 text-2xl font-semibold text-[var(--brand-text-strong)]">{consistencyPct}%</div>
            <div className="mt-1 text-[10px] text-[var(--brand-text-faint)]]">Name, Address, Phone match across directories</div>
          </div>
          <ProgressRing value={consistencyPct} size={72} />
        </div>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-2">
        <KpiTile label="Citations" value={String(s.nap.citationCount)} tone="info" />
        <KpiTile label="Matched" value={String(s.nap.matched)} tone="good" />
        <KpiTile label="Issues" value={String(s.nap.issues)} tone={s.nap.issues > 0 ? 'warn' : 'good'} />
      </div>

      {/* Field consistency bars */}
      <Card title="Field consistency">
        <div className="flex flex-col gap-2">
          <FieldBar label="Name" value={s.nap.name} />
          <FieldBar label="Address" value={s.nap.address} />
          <FieldBar label="Phone" value={s.nap.phone} />
          <FieldBar label="Website" value={s.nap.website} />
          <FieldBar label="Hours" value={s.nap.hours} />
        </div>
      </Card>

      {/* Citation status */}
      <Card title="Citation status">
        <Distribution rows={[
          { label: 'Matched', value: s.nap.matched, tone: 'good' as const },
          { label: 'Partial', value: s.nap.partial, tone: 'warn' as const },
          { label: 'Mismatched', value: s.nap.mismatched, tone: 'bad' as const },
          { label: 'Missing', value: s.nap.missing, tone: 'warn' as const },
        ]} />
      </Card>

      {/* Locations with NAP issues */}
      {s.nap.worstDirectories.length > 0 && (
        <Card title="Locations with NAP issues" padded={false}>
          <div className="flex flex-col border-t border-[var(--brand-surface-3)]]">
            {s.nap.worstDirectories.map(d => (
              <RowItem
                key={d.id}
                title={d.name}
                badge={
                  <span className={`text-[10px] font-mono ${scoreToTone(d.consistency * 100) === 'good' ? 'text-[#22c55e]' : 'text-[#f59e0b]'}`}>
                    {fmtPct(d.consistency * 100)}
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
          <div className="flex flex-col border-t border-[var(--brand-surface-3)]]">
            <ComparisonRow
              label="Consistency"
              a={{ v: consistencyPct, tag: 'now' }}
              b={{ v: Math.max(0, consistencyPct - 2), tag: 'prev' }}
              format={(v) => `${v}%`}
            />
            <ComparisonRow
              label="Citations"
              a={{ v: s.nap.citationCount, tag: 'now' }}
              b={{ v: Math.max(0, s.nap.citationCount - 3), tag: 'prev' }}
            />
          </div>
        </Card>
      </Trendable>

      {!s.hasPrior && <SingleCrawlNotice />}
    </div>
  )
}
