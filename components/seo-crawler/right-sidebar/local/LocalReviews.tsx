import React from 'react'
import { useLocalInsights } from '../_hooks/useLocalInsights'
import { EmptyState } from '../_shared/EmptyState'
import { Card } from '../_shared/Card'
import { KpiTile } from '../_shared/KpiTile'
import { HealthStrip } from '../_shared/HealthStrip'
import { Distribution } from '../_shared/Distribution'
import { ProgressRing } from '../_shared/ProgressRing'
import { RowItem } from '../_shared/RowItem'
import { ComparisonRow } from '../_shared/ComparisonRow'
import { Trendable } from '../_shared/blocks/Trendable'
import { SingleCrawlNotice } from '../_shared/blocks/SingleCrawlNotice'
import { RsSparkline } from '../parts/RsSparkline'
import { fmtPct, compactNum } from '../_shared/format'
import { scoreToTone } from '../_shared/scoring'

export function LocalReviews() {
  const s = useLocalInsights()
  if (!s.byLocation?.length) return <EmptyState title="No local data yet" />
  const reviewScore = Math.round(s.reviews.avg * 20)
  const totalDist = Object.values(s.reviews.dist).reduce((a: number, b: number) => a + b, 0)

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* Hero */}
      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-[var(--brand-text-mid)]">Review score</div>
            <div className="mt-1 text-2xl font-semibold text-[var(--brand-text-strong)]">{s.reviews.avg > 0 ? `${s.reviews.avg.toFixed(1)} \u2605` : '\u2014'}</div>
            <div className="mt-1 text-[10px] text-[var(--brand-text-faint)]">Average rating across all locations</div>
          </div>
          <ProgressRing value={reviewScore} size={72} />
        </div>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-2">
        <KpiTile label="Total" value={compactNum(s.reviews.total)} />
        <KpiTile label="Last 30d" value={`+${s.reviews.new30d}`} />
        <KpiTile label="Response rate" value={fmtPct(s.reviews.responseRate * 100)} tone={scoreToTone(s.reviews.responseRate * 100)} />
      </div>

      {/* Rating distribution */}
      <Card title="Rating distribution">
        <HealthStrip
          total={totalDist || 1}
          segments={[
            { label: '5\u2605', value: s.reviews.dist[5], color: '#22c55e' },
            { label: '4\u2605', value: s.reviews.dist[4], color: '#10b981' },
            { label: '3\u2605', value: s.reviews.dist[3], color: '#3b82f6' },
            { label: '2\u2605', value: s.reviews.dist[2], color: '#f59e0b' },
            { label: '1\u2605', value: s.reviews.dist[1], color: '#ef4444' },
          ].filter(seg => seg.value > 0)}
        />
      </Card>

      {/* Sentiment split */}
      <Card title="Sentiment split">
        <Distribution rows={[
          { label: 'Positive (4-5\u2605)', value: s.reviews.positive, tone: 'good' as const },
          { label: 'Neutral (3\u2605)', value: s.reviews.neutral, tone: 'warn' as const },
          { label: 'Negative (1-2\u2605)', value: s.reviews.negative, tone: 'bad' as const },
        ]} />
      </Card>

      {/* Recent low-star reviews */}
      {s.reviews.recentLow.length > 0 && (
        <Card title="Recent low-star reviews" padded={false}>
          <div className="flex flex-col border-t border-[var(--brand-surface-3)]">
            {s.reviews.recentLow.map(r => (
              <RowItem
                key={r.id}
                title={r.text.slice(0, 60)}
                meta={r.author}
                badge={<span className="text-[10px] font-mono text-[#ef4444]">{r.rating}\u2605</span>}
              />
            ))}
          </div>
        </Card>
      )}

      {/* Unanswered reviews */}
      {s.reviews.unanswered.length > 0 && (
        <Card title="Unanswered reviews" padded={false}>
          <div className="flex flex-col border-t border-[var(--brand-surface-3)]">
            {s.reviews.unanswered.map(r => (
              <RowItem
                key={r.id}
                title={r.text.slice(0, 60)}
                meta={r.author}
                badge={<span className="text-[10px] font-mono text-[#f59e0b]">{r.rating}\u2605</span>}
              />
            ))}
          </div>
        </Card>
      )}

      {/* Review velocity trend */}
      <Trendable hasPrior={s.hasPrior}>
        <Card title="Review velocity">
          {s.reviews.velocitySeries.length > 1 ? (
            <RsSparkline values={s.reviews.velocitySeries} />
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
              label="Avg rating"
              a={{ v: Math.round(s.reviews.avg * 10), tag: 'now' }}
              b={{ v: Math.max(0, Math.round(s.reviews.avg * 10) - 1), tag: 'prev' }}
              format={(v) => `${(v / 10).toFixed(1)}\u2605`}
            />
            <ComparisonRow
              label="New reviews (30d)"
              a={{ v: s.reviews.new30d, tag: 'now' }}
              b={{ v: Math.max(0, s.reviews.new30d - 5), tag: 'prev' }}
            />
          </div>
        </Card>
      </Trendable>

      {!s.hasPrior && <SingleCrawlNotice />}
    </div>
  )
}
