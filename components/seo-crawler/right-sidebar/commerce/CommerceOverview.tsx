import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useCommerceInsights } from '../_hooks/useCommerceInsights'
import { Card } from '../_shared/Card'
import { KpiTile } from '../_shared/KpiTile'
import { ProgressRing } from '../_shared/ProgressRing'
import { RowItem } from '../_shared/RowItem'
import { SingleCrawlNotice } from '../_shared/blocks/SingleCrawlNotice'
import { RecommendedActionsBlock } from '../_shared/blocks/RecommendedActionsBlock'
import { EmptyState } from '../_shared/empty'
import { fmtPct, fmtCurrency, compactNum } from '../_shared/format'
import { scoreToTone } from '../_shared/scoring'

export function CommerceOverview() {
  const { pages } = useSeoCrawler()
  const s = useCommerceInsights()

  if (!pages?.length) return <EmptyState title="No crawl data yet" hint="Run a crawl to see commerce insights." />

  const scoreGrade = s.score >= 80 ? 'A' : s.score >= 60 ? 'B' : s.score >= 40 ? 'C' : 'D'

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* Score + KPIs */}
      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-[var(--brand-text-mid)]]">Commerce score</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-bold tabular-nums text-[var(--brand-text-strong)]">{s.score}</span>
              <span className="text-sm font-medium text-[var(--brand-text-faint)]]">{scoreGrade}</span>
            </div>
          </div>
          <ProgressRing value={s.score} size={72} />
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-2">
        <KpiTile
          label="Products"
          value={compactNum(s.total)}
          delta={s.hasPrior ? `${compactNum(s.inStock)} in stock` : undefined}
        />
        <KpiTile
          label="Conv. rate"
          value={fmtPct(s.cvr * 100, 1)}
          tone={scoreToTone(s.cvr * 100)}
          delta={s.hasPrior ? fmtPct((s.cvr - s.cvrPrev) * 100, 1) : undefined}
          deltaTone={s.cvr > s.cvrPrev ? 'up' : s.cvr < s.cvrPrev ? 'down' : 'flat'}
        />
        <KpiTile
          label="Avg order"
          value={fmtCurrency(s.aov)}
          delta={s.hasPrior && s.aovPrev > 0 ? fmtCurrency(s.aov - s.aovPrev) : undefined}
          deltaTone={s.aov > s.aovPrev ? 'up' : 'down'}
        />
        <KpiTile
          label="Revenue (30d)"
          value={fmtCurrency(s.revenue30d)}
          delta={s.hasPrior && s.revenuePrev > 0 ? fmtCurrency(s.revenue30d - s.revenuePrev) : undefined}
          deltaTone={s.revenue30d > s.revenuePrev ? 'up' : 'down'}
        />
      </div>

      {/* Schema coverage */}
      <Card padded={false}>
        <div className="px-3 py-2 border-b border-[var(--brand-surface-3)]]">
          <span className="text-[11px] text-[var(--brand-text-mid)]]">Schema coverage</span>
        </div>
        <div className="flex flex-col border-t border-[var(--brand-surface-3)]]">
          {[
            { label: 'Product', pct: s.schema.product },
            { label: 'Offer / price', pct: s.schema.offer },
            { label: 'Aggregate rating', pct: s.schema.rating },
            { label: 'Availability', pct: s.schema.availability },
          ].map(r => (
            <div key={r.label} className="flex items-center justify-between px-3 py-2 border-b border-[var(--brand-surface-3)]] last:border-b-0">
              <span className="text-[11px] text-[var(--brand-text-mid)]]">{r.label}</span>
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 rounded-full bg-[var(--brand-surface-3)]] overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${r.pct}%`, background: r.pct >= 90 ? '#22c55e' : r.pct >= 70 ? '#f59e0b' : '#ef4444' }} />
                </div>
                <span className="text-[10px] font-mono text-[var(--brand-text-mid)]] w-8 text-right">{r.pct}%</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Checkout funnel */}
      <Card padded={false}>
        <div className="px-3 py-2 border-b border-[var(--brand-surface-3)]]">
          <span className="text-[11px] text-[var(--brand-text-mid)]]">Checkout funnel</span>
        </div>
        <div className="flex flex-col border-t border-[var(--brand-surface-3)]]">
          {s.drops.map((step, i) => (
            <div key={step.label} className="flex items-center justify-between px-3 py-2 border-b border-[var(--brand-surface-3)]] last:border-b-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[var(--brand-text-mid)]]">{step.label}</span>
                {i > 0 && step.dropPct > 0.2 && (
                  <span className="text-[9px] font-mono text-[#ef4444]">-{(step.dropPct * 100).toFixed(0)}%</span>
                )}
              </div>
              <span className="text-[10px] font-mono text-[var(--brand-text-mid)]]">{compactNum(step.value)}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Reviews summary */}
      <Card padded={false}>
        <div className="px-3 py-2 border-b border-[var(--brand-surface-3)]]">
          <span className="text-[11px] text-[var(--brand-text-mid)]]">Reviews</span>
        </div>
        <div className="flex flex-col border-t border-[var(--brand-surface-3)]]">
          <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--brand-surface-3)]]">
            <span className="text-[11px] text-[var(--brand-text-mid)]]">Avg rating</span>
            <span className="text-[11px] font-mono font-medium text-[var(--brand-text-strong)]">
              {s.reviews.avgRating > 0 ? `${s.reviews.avgRating.toFixed(1)} / 5` : '—'}
            </span>
          </div>
          <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--brand-surface-3)]]">
            <span className="text-[11px] text-[var(--brand-text-mid)]]">Total reviews</span>
            <span className="text-[11px] font-mono font-medium text-[var(--brand-text-strong)]">{compactNum(s.reviews.total)}</span>
          </div>
          <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--brand-surface-3)]]">
            <span className="text-[11px] text-[var(--brand-text-mid)]]">Products with reviews</span>
            <span className="text-[11px] font-mono font-medium text-[var(--brand-text-strong)]">{s.reviews.withReviews} / {s.total}</span>
          </div>
          {s.reviews.lowStarReviews > 0 && (
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-[11px] text-[var(--brand-text-mid)]]">Low-rated (&lt; 3.5 stars)</span>
              <span className="text-[11px] font-mono font-medium text-[#ef4444]">{s.reviews.lowStarReviews}</span>
            </div>
          )}
        </div>
      </Card>

      {/* Feed status */}
      <Card padded={false}>
        <div className="px-3 py-2 border-b border-[var(--brand-surface-3)]]">
          <span className="text-[11px] text-[var(--brand-text-mid)]]">Feed status</span>
        </div>
        <div className="flex flex-col border-t border-[var(--brand-surface-3)]]">
          <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--brand-surface-3)]]">
            <span className="text-[11px] text-[var(--brand-text-mid)]]">Products in feed</span>
            <span className="text-[11px] font-mono font-medium text-[var(--brand-text-strong)]">{s.feed.feedPresent} / {s.total}</span>
          </div>
          {s.feed.feedDisapproved > 0 && (
            <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--brand-surface-3)]]">
              <span className="text-[11px] text-[var(--brand-text-mid)]]">Disapproved</span>
              <span className="text-[11px] font-mono font-medium text-[#ef4444]">{s.feed.feedDisapproved}</span>
            </div>
          )}
          {s.feed.feedPending > 0 && (
            <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--brand-surface-3)]]">
              <span className="text-[11px] text-[var(--brand-text-mid)]]">Pending</span>
              <span className="text-[11px] font-mono font-medium text-[#f59e0b]">{s.feed.feedPending}</span>
            </div>
          )}
          {s.feed.feedPriceMismatch > 0 && (
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-[11px] text-[var(--brand-text-mid)]]">Price mismatches</span>
              <span className="text-[11px] font-mono font-medium text-[#f59e0b]">{s.feed.feedPriceMismatch}</span>
            </div>
          )}
        </div>
      </Card>

      {/* Alerts */}
      {s.alerts.length > 0 && (
        <Card padded={false}>
          <div className="px-3 py-2 border-b border-[var(--brand-surface-3)]]">
            <span className="text-[11px] text-[var(--brand-text-mid)]]">Alerts</span>
          </div>
          <div className="flex flex-col border-t border-[var(--brand-surface-3)]]">
            {s.alerts.map(a => (
              <RowItem
                key={a.id}
                title={a.text}
                meta={a.detail}
                badge={
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest"
                    style={{ color: a.severity === 'critical' ? '#ef4444' : a.severity === 'high' ? '#f59e0b' : '#3b82f6' }}>
                    {a.severity}
                  </span>
                }
              />
            ))}
          </div>
        </Card>
      )}

      {/* Actions */}
      {s.actions.items.length > 0 && (
        <RecommendedActionsBlock
          title="Priority actions"
          items={s.actions.items.map(a => ({
            id: a.id, title: a.title, priority: a.priority,
            pagesAffected: 1,
            effortMin: a.confidence > 80 ? 15 : a.confidence > 60 ? 30 : 60,
            expectedDelta: { value: 0, unit: '' },
            confidence: a.confidence / 100,
          }))}
        />
      )}

      {!s.hasPrior && <SingleCrawlNotice />}
    </div>
  )
}
