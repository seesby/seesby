import React from 'react'
import { useContentInsights } from '../_hooks/useContentInsights'
import { useHasTrend } from '../_hooks/useSessionsCount'
import { Card } from '../_shared/Card'
import { KpiTile } from '../_shared/KpiTile'
import { Distribution } from '../_shared/Distribution'
import { ProgressRing } from '../_shared/ProgressRing'
import { HealthStrip } from '../_shared/HealthStrip'
import { DeltaChip } from '../_shared/DeltaChip'
import { RsSparkline } from '../parts/RsSparkline'
import { RowItem } from '../_shared/RowItem'
import { EmptyState } from '../_shared/empty'
import { compactNum } from '../_shared/format'

export function ContentOverview() {
  const s = useContentInsights()
  const hasTrend = useHasTrend()

  if (!s.total) return <EmptyState title="No crawl data yet" />

  const delta = hasTrend && s.avgQualityPrev > 0
    ? s.avgQuality - s.avgQualityPrev
    : undefined

  const gaps = [
    { label: 'Thin <300 words', value: s.thin },
    { label: 'Stale >180 days', value: s.staleCount },
    { label: 'Near-duplicates', value: s.dup.near },
    { label: 'Exact duplicates', value: s.dup.exact },
    { label: 'Cannibalization', value: s.dup.cannibal },
    { label: 'No byline', value: s.missing.noByline },
    { label: 'Missing schema', value: s.missing.noSchema },
    { label: 'No meta desc', value: s.missing.noMeta },
  ]
    .filter(g => g.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)

  const scoreGrade = s.avgQuality >= 90 ? 'A' : s.avgQuality >= 75 ? 'B' : s.avgQuality >= 60 ? 'C' : s.avgQuality >= 40 ? 'D' : 'F'

  const categoryRows = s.categoryMix.map(([label, count]) => ({
    label,
    value: count,
  }))

  const freshnessPercent = s.total > 0 ? Math.round(((s.freshness.live + s.freshness.recent) / s.total) * 100) : 0
  const uniquePages = s.total - s.dup.exact - s.dup.near

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* Score card */}
      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-[var(--brand-text-mid)]">Content score</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-bold tabular-nums text-[var(--brand-text-strong)]">{s.avgQuality}</span>
              <span className="text-sm font-medium text-[var(--brand-text-faint)]">{scoreGrade}</span>
            </div>
            <div className="mt-1 flex items-center gap-2">
              {typeof delta === 'number' && <DeltaChip value={delta} />}
              {hasTrend && s.scoreSeries.length > 1 && (
                <RsSparkline values={s.scoreSeries} />
              )}
            </div>
            <div className="mt-1.5 flex gap-4 text-[10px] text-[var(--brand-text-faint)]">
              <span>p50 <span className="text-[var(--brand-text-mid)]">{s.p50}</span></span>
              <span className="w-px h-2 bg-[var(--brand-border-2)]" />
              <span>p90 <span className="text-[var(--brand-text-mid)]">{s.p90}</span></span>
            </div>
          </div>
          <ProgressRing value={s.avgQuality} size={72} />
        </div>
      </Card>

      {/* KPIs with secondary info */}
      <div className="grid grid-cols-2 gap-2">
        <KpiTile label="Pages" value={compactNum(s.total)} sub={`${compactNum(uniquePages)} unique`} />
        <KpiTile label="Words" value={compactNum(s.totalWords)} sub={`${compactNum(s.avgWords)} avg`} />
        <KpiTile label="Clusters" value={String(s.clusters.length)} sub={`${s.hubs} hubs`} />
        <KpiTile label="Fresh" value={`${freshnessPercent}%`} tone={freshnessPercent >= 70 ? 'good' : 'warn'} sub={`${s.freshness.stale} stale`} />
      </div>

      {/* Score distribution as HealthStrip */}
      <Card title="Quality breakdown">
        <HealthStrip
          total={s.total}
          segments={[
            { label: 'Excellent', value: s.bands.excellent, color: '#22c55e' },
            { label: 'Good', value: s.bands.good, color: '#10b981' },
            { label: 'Fair', value: s.bands.fair, color: '#f59e0b' },
            { label: 'Poor', value: s.bands.poor, color: '#f97316' },
            { label: 'Critical', value: s.bands.critical, color: '#ef4444' },
          ].filter(seg => seg.value > 0)}
        />
      </Card>

      {/* Page categories */}
      {categoryRows.length > 0 && (
        <Card title="Page types">
          <Distribution rows={categoryRows} />
        </Card>
      )}

      {/* Top issues to fix */}
      {gaps.length > 0 && (
        <Card title="Needs attention" padded={false}>
          <div className="flex flex-col border-t border-[var(--brand-surface-3)]">
            {gaps.map((g, i) => (
              <RowItem
                key={i}
                title={g.label}
                badge={<span className="text-[10px] font-mono text-[#f59e0b]">{g.value}</span>}
              />
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
