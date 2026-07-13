import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useCommerceInsights } from '../_hooks/useCommerceInsights'
import { Card } from '../_shared/Card'
import { KpiTile } from '../_shared/KpiTile'
import { RowItem } from '../_shared/RowItem'
import { SingleCrawlNotice } from '../_shared/blocks/SingleCrawlNotice'
import { EmptyState } from '../_shared/empty'
import { compactNum, fmtPct } from '../_shared/format'

export function CommerceFeed() {
  const { pages } = useSeoCrawler()
  const s = useCommerceInsights()

  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  const feedCoverage = s.total > 0 ? ((s.feed.feedPresent / s.total) * 100).toFixed(1) : '0'
  const feedHealthy = s.feed.feedPresent - s.feed.feedErrors

  const reasons = [
    { label: 'Price mismatch', count: s.feed.feedPriceMismatch, severity: 'bad' as const },
    { label: 'Availability mismatch', count: s.feed.feedAvailMismatch, severity: 'bad' as const },
    { label: 'Image issues', count: s.feed.feedImageIssues, severity: 'warn' as const },
    { label: 'Title/desc policy', count: s.feed.feedTitleDesc, severity: 'warn' as const },
    { label: 'GTIN missing', count: s.feed.feedGtinMissing, severity: 'warn' as const },
    { label: 'Missing attributes', count: s.feed.feedAttrsMissing, severity: 'warn' as const },
  ].filter(r => r.count > 0)

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* KPI tiles */}
      <div className="grid grid-cols-2 gap-2">
        <KpiTile label="In feed" value={s.feed.feedPresent} tone="good" sub={`${feedCoverage}% coverage`} />
        <KpiTile label="Disapproved" value={s.feed.feedDisapproved} tone={s.feed.feedDisapproved > 0 ? 'bad' : 'good'} />
        <KpiTile label="Pending" value={s.feed.feedPending} tone={s.feed.feedPending > 0 ? 'warn' : 'good'} />
        <KpiTile label="Shopping ranks" value={s.feed.shoppingRanks} tone="info" />
      </div>

      {/* Feed status breakdown */}
      <Card padded={false}>
        <div className="px-3 py-2 border-b border-[var(--brand-surface-3)]]">
          <span className="text-[11px] text-[var(--brand-text-mid)]]">Feed status</span>
        </div>
        <div className="flex flex-col border-t border-[var(--brand-surface-3)]]">
          <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--brand-surface-3)]]">
            <span className="text-[11px] text-[var(--brand-text-mid)]]">Approved</span>
            <span className="text-[11px] font-mono font-medium text-[#22c55e]">{s.feed.feedApproved}</span>
          </div>
          <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--brand-surface-3)]]">
            <span className="text-[11px] text-[var(--brand-text-mid)]]">Pending review</span>
            <span className="text-[11px] font-mono font-medium text-[#f59e0b]">{s.feed.feedPending}</span>
          </div>
          <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--brand-surface-3)]]">
            <span className="text-[11px] text-[var(--brand-text-mid)]]">Disapproved</span>
            <span className="text-[11px] font-mono font-medium text-[#ef4444]">{s.feed.feedDisapproved}</span>
          </div>
          {s.feed.feedExpired > 0 && (
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-[11px] text-[var(--brand-text-mid)]]">Expired</span>
              <span className="text-[11px] font-mono font-medium text-[var(--brand-text-faint)]]">{s.feed.feedExpired}</span>
            </div>
          )}
        </div>
      </Card>

      {/* Feed coverage bar */}
      <Card padded={false}>
        <div className="px-3 py-2 border-b border-[var(--brand-surface-3)]]">
          <span className="text-[11px] text-[var(--brand-text-mid)]]">Coverage</span>
        </div>
        <div className="px-3 py-3 border-t border-[var(--brand-surface-3)]]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-[var(--brand-text-mid)]]">{s.feed.feedPresent} of {s.total} products in feed</span>
            <span className="text-[10px] font-mono text-[var(--brand-text-mid)]]">{feedCoverage}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-[var(--brand-surface-3)]] overflow-hidden">
            <div className="h-full rounded-full flex">
              <div className="h-full bg-[#22c55e]" style={{ width: `${s.total > 0 ? (s.feed.feedApproved / s.total) * 100 : 0}%` }} />
              <div className="h-full bg-[#f59e0b]" style={{ width: `${s.total > 0 ? (s.feed.feedPending / s.total) * 100 : 0}%` }} />
              <div className="h-full bg-[#ef4444]" style={{ width: `${s.total > 0 ? (s.feed.feedDisapproved / s.total) * 100 : 0}%` }} />
            </div>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#22c55e]" /><span className="text-[9px] text-[var(--brand-text-faint)]]">Approved</span></div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#f59e0b]" /><span className="text-[9px] text-[var(--brand-text-faint)]]">Pending</span></div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#ef4444]" /><span className="text-[9px] text-[var(--brand-text-faint)]]">Disapproved</span></div>
          </div>
        </div>
      </Card>

      {/* Disapproval reasons */}
      {reasons.length > 0 && (
        <Card padded={false}>
          <div className="px-3 py-2 border-b border-[var(--brand-surface-3)]]">
            <span className="text-[11px] text-[var(--brand-text-mid)]]">Disapproval reasons</span>
          </div>
          <div className="flex flex-col border-t border-[var(--brand-surface-3)]]">
            {reasons.map(r => (
              <div key={r.label} className="flex items-center justify-between px-3 py-2 border-b border-[var(--brand-surface-3)]] last:border-b-0">
                <span className="text-[11px] text-[var(--brand-text-mid)]]">{r.label}</span>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-1.5 rounded-full bg-[var(--brand-surface-3)]] overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${s.feed.feedErrors > 0 ? (r.count / s.feed.feedErrors) * 100 : 0}%`, background: r.severity === 'bad' ? '#ef4444' : '#f59e0b' }} />
                  </div>
                  <span className={`text-[10px] font-mono ${r.severity === 'bad' ? 'text-[#ef4444]' : 'text-[#f59e0b]'}`}>{r.count}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Feed health */}
      <Card padded={false}>
        <div className="px-3 py-2 border-b border-[var(--brand-surface-3)]]">
          <span className="text-[11px] text-[var(--brand-text-mid)]]">Feed health</span>
        </div>
        <div className="flex flex-col border-t border-[var(--brand-surface-3)]]">
          <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--brand-surface-3)]]">
            <span className="text-[11px] text-[var(--brand-text-mid)]]">Products without errors</span>
            <span className="text-[11px] font-mono font-medium text-[#22c55e]">{feedHealthy}</span>
          </div>
          <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--brand-surface-3)]]">
            <span className="text-[11px] text-[var(--brand-text-mid)]]">Total disapprovals</span>
            <span className={`text-[11px] font-mono font-medium ${s.feed.feedErrors > 0 ? 'text-[#ef4444]' : 'text-[#22c55e]'}`}>{s.feed.feedErrors}</span>
          </div>
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-[11px] text-[var(--brand-text-mid)]]">Products not in feed</span>
            <span className="text-[11px] font-mono font-medium text-[#f59e0b]">{s.total - s.feed.feedPresent}</span>
          </div>
        </div>
      </Card>

      {s.feed.feedErrors === 0 && s.feed.feedPresent > 0 && (
        <div className="rounded-md border border-[var(--brand-surface-3)]] bg-[var(--brand-surface-0)]] p-3 text-[11px] text-[var(--brand-text-mid)]]">
          Feed looks healthy. All {s.feed.feedPresent} products are approved.
        </div>
      )}

      {!s.hasPrior && <SingleCrawlNotice />}
    </div>
  )
}
