import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useCommerceInsights } from '../_hooks/useCommerceInsights'
import { useDrill } from '../_shared/drill'
import { Card } from '../_shared/Card'
import { KpiTile } from '../_shared/KpiTile'
import { RowItem } from '../_shared/RowItem'
import { SingleCrawlNotice } from '../_shared/blocks/SingleCrawlNotice'
import { EmptyState } from '../_shared/empty'
import { compactNum, fmtPct, fmtCurrency } from '../_shared/format'

export function CommerceInventory() {
  const { pages } = useSeoCrawler()
  const s = useCommerceInsights()
  const drill = useDrill()

  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  const oosPct = s.total > 0 ? ((s.outOfStock / s.total) * 100).toFixed(1) : '0'
  const lowPct = s.total > 0 ? ((s.lowStock / s.total) * 100).toFixed(1) : '0'
  const stockPct = s.total > 0 ? ((s.inStock / s.total) * 100).toFixed(0) : '0'

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* KPI tiles */}
      <div className="grid grid-cols-2 gap-2">
        <KpiTile label="In stock" value={s.inStock} tone="good" sub={`${stockPct}% of catalog`} />
        <KpiTile label="Out of stock" value={s.outOfStock} tone="bad" sub={`${oosPct}% of catalog`} />
        <KpiTile label="Low stock" value={s.lowStock} tone="warn" sub={`${lowPct}% of catalog`} />
        <KpiTile label="OOS w/ traffic" value={s.inventory.oosWithTraffic} tone="bad" sub="Lost revenue" />
      </div>

      {/* OOS impact */}
      <Card padded={false}>
        <div className="px-3 py-2 border-b border-[var(--brand-surface-3)]">
          <span className="text-[11px] text-[var(--brand-text-mid)]">OOS impact</span>
        </div>
        <div className="flex flex-col border-t border-[var(--brand-surface-3)]">
          <RowItem
            title="OOS with active traffic"
            meta="Products receiving clicks but unavailable"
            badge={<span className="text-[10px] font-mono text-[#ef4444]">{s.inventory.oosWithTraffic}</span>}
          />
          <RowItem
            title="OOS with backlinks"
            meta="Links pointing to unavailable pages"
            badge={<span className="text-[10px] font-mono text-[#f59e0b]">{s.inventory.oosWithBacklinks}</span>}
          />
          <RowItem
            title="OOS in sitemap"
            meta="Sitemap includes unavailable products"
            badge={<span className="text-[10px] font-mono text-[#f59e0b]">{s.inventory.oosInSitemap}</span>}
          />
          <RowItem
            title="Estimated revenue lost"
            meta="From OOS products with traffic"
            badge={<span className="text-[10px] font-mono text-[#ef4444]">{fmtCurrency(s.inventory.oosRevenueLost)}</span>}
          />
        </div>
      </Card>

      {/* OOS products with traffic */}
      {s.inventory.oosTopList.length > 0 && (
        <Card padded={false}>
          <div className="px-3 py-2 border-b border-[var(--brand-surface-3)]">
            <span className="text-[11px] text-[var(--brand-text-mid)]">OOS with most traffic</span>
          </div>
          <div className="flex flex-col border-t border-[var(--brand-surface-3)]">
            {s.inventory.oosTopList.map(p => (
              <button
                key={p.url}
                onClick={() => drill.toPage({ url: p.url })}
                className="flex items-center justify-between px-3 py-2 border-b border-[var(--brand-surface-3)] last:border-b-0 hover:bg-[var(--brand-surface-1)] transition-colors text-left w-full"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] text-[var(--brand-text-mid)] truncate">{p.title}</div>
                  <div className="text-[10px] text-[var(--brand-text-faint)]">{compactNum(p.sessions)} sessions · {p.backlinks} backlinks</div>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest text-[#ef4444] border border-[#ef4444]/30 shrink-0">OOS</span>
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Category breakdown */}
      {s.byCategory.length > 1 && (
        <Card padded={false}>
          <div className="px-3 py-2 border-b border-[var(--brand-surface-3)]">
            <span className="text-[11px] text-[var(--brand-text-mid)]">By category</span>
          </div>
          <div className="flex flex-col border-t border-[var(--brand-surface-3)]">
            {s.byCategory.slice(0, 8).map(c => (
              <div key={c.id} className="flex items-center justify-between px-3 py-2 border-b border-[var(--brand-surface-3)] last:border-b-0">
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] text-[var(--brand-text-mid)] truncate">{c.label}</div>
                  <div className="text-[10px] text-[var(--brand-text-faint)]">{c.products} products · {fmtCurrency(c.revenue)} rev</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {c.oos > 0 && <span className="text-[10px] font-mono text-[#ef4444]">{c.oos} OOS</span>}
                  {c.lowStock > 0 && <span className="text-[10px] font-mono text-[#f59e0b]">{c.lowStock} low</span>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Top revenue products */}
      {s.topRevenue.length > 0 && (
        <Card padded={false}>
          <div className="px-3 py-2 border-b border-[var(--brand-surface-3)]">
            <span className="text-[11px] text-[var(--brand-text-mid)]">Top products by revenue</span>
          </div>
          <div className="flex flex-col border-t border-[var(--brand-surface-3)]">
            {s.topRevenue.slice(0, 8).map(p => (
              <button
                key={p.url}
                onClick={() => drill.toPage({ url: p.url })}
                className="flex items-center justify-between px-3 py-2 border-b border-[var(--brand-surface-3)] last:border-b-0 hover:bg-[var(--brand-surface-1)] transition-colors text-left w-full"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] text-[var(--brand-text-mid)] truncate">{p.title}</div>
                  <div className="text-[10px] text-[var(--brand-text-faint)]">{fmtCurrency(p.revenue)} · {p.rating > 0 ? `${p.rating.toFixed(1)}★` : '—'} · {p.reviews} reviews</div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {!p.schema && <span className="px-1 py-0.5 rounded text-[7px] font-bold uppercase text-[#f59e0b] border border-[#f59e0b]/30">No schema</span>}
                  {!p.feed && <span className="px-1 py-0.5 rounded text-[7px] font-bold uppercase text-[#3b82f6] border border-[#3b82f6]/30">No feed</span>}
                  {p.availability === 'out_of_stock' && <span className="px-1 py-0.5 rounded text-[7px] font-bold uppercase text-[#ef4444] border border-[#ef4444]/30">OOS</span>}
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Pricing */}
      <Card padded={false}>
        <div className="px-3 py-2 border-b border-[var(--brand-surface-3)]">
          <span className="text-[11px] text-[var(--brand-text-mid)]">Pricing</span>
        </div>
        <div className="flex flex-col border-t border-[var(--brand-surface-3)]">
          <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--brand-surface-3)]">
            <span className="text-[11px] text-[var(--brand-text-mid)]">Avg price</span>
            <span className="text-[11px] font-mono font-medium text-[var(--brand-text-strong)]">{fmtCurrency(s.avgPrice)}</span>
          </div>
          <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--brand-surface-3)]">
            <span className="text-[11px] text-[var(--brand-text-mid)]">Price range</span>
            <span className="text-[11px] font-mono font-medium text-[var(--brand-text-mid)]">{fmtCurrency(s.minPrice)} – {fmtCurrency(s.maxPrice)}</span>
          </div>
          <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--brand-surface-3)]">
            <span className="text-[11px] text-[var(--brand-text-mid)]">Products on sale</span>
            <span className="text-[11px] font-mono font-medium text-[#f59e0b]">{s.discounted} (avg {s.avgDiscountPct.toFixed(0)}% off)</span>
          </div>
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-[11px] text-[var(--brand-text-mid)]">vs benchmark AOV</span>
            <span className={`text-[11px] font-mono font-medium ${s.aov > s.bench.aov ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
              {fmtCurrency(s.aov)} vs {fmtCurrency(s.bench.aov)}
            </span>
          </div>
        </div>
      </Card>

      {!s.hasPrior && <SingleCrawlNotice />}
    </div>
  )
}
