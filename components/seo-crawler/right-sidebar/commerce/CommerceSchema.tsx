import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useCommerceInsights } from '../_hooks/useCommerceInsights'
import { useDrill } from '../_shared/drill'
import { Card } from '../_shared/Card'
import { KpiTile } from '../_shared/KpiTile'
import { RowItem } from '../_shared/RowItem'
import { SingleCrawlNotice } from '../_shared/blocks/SingleCrawlNotice'
import { EmptyState } from '../_shared/empty'
import { fmtPct, compactNum } from '../_shared/format'

export function CommerceSchema() {
  const { pages } = useSeoCrawler()
  const s = useCommerceInsights()
  const drill = useDrill()

  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  const coreFields = [
    { label: 'Product schema', pct: s.schema.product },
    { label: 'Offer / price', pct: s.schema.offer },
    { label: 'Availability', pct: s.schema.availability },
    { label: 'Aggregate rating', pct: s.schema.rating },
    { label: 'Breadcrumb', pct: s.schema.breadcrumb },
  ]

  const richFields = [
    { label: 'FAQ schema', count: s.schema.faq },
    { label: 'Size guide', count: s.schema.sizeGuide },
    { label: 'Shipping info', count: s.schema.shipping },
    { label: 'Returns info', count: s.schema.returns },
    { label: 'Product video', count: s.schema.productVideo },
  ]

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* Schema score KPIs */}
      <div className="grid grid-cols-3 gap-2">
        <KpiTile label="Valid" value={s.schema.valid} tone="good" />
        <KpiTile label="Warnings" value={s.schema.warnings} tone="warn" />
        <KpiTile label="Errors" value={s.schema.errors} tone="bad" />
      </div>

      {/* Core schema fields */}
      <Card padded={false}>
        <div className="px-3 py-2 border-b border-[var(--brand-surface-3)]">
          <span className="text-[11px] text-[var(--brand-text-mid)]">Core fields</span>
        </div>
        <div className="flex flex-col border-t border-[var(--brand-surface-3)]">
          {coreFields.map(f => (
            <div key={f.label} className="flex items-center justify-between px-3 py-2 border-b border-[var(--brand-surface-3)] last:border-b-0">
              <span className="text-[11px] text-[var(--brand-text-mid)]">{f.label}</span>
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 rounded-full bg-[var(--brand-surface-3)] overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${f.pct}%`, background: f.pct >= 90 ? '#22c55e' : f.pct >= 70 ? '#f59e0b' : '#ef4444' }} />
                </div>
                <span className="text-[10px] font-mono text-[var(--brand-text-mid)] w-8 text-right">{f.pct}%</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Missing schema */}
      {s.schema.noSchema > 0 && (
        <Card padded={false}>
          <div className="px-3 py-2 border-b border-[var(--brand-surface-3)]">
            <span className="text-[11px] text-[var(--brand-text-mid)]">Missing Product schema</span>
            <span className="ml-2 text-[10px] font-mono text-[#ef4444]">{s.schema.noSchema}</span>
          </div>
          <div className="px-3 py-2 border-t border-[var(--brand-surface-3)]">
            <div className="text-[11px] text-[var(--brand-text-mid)]">
              {s.schema.noSchema} product pages don&apos;t have Product structured data.
              This limits rich results in Google Search and Shopping.
            </div>
          </div>
        </Card>
      )}

      {/* Rich content schema */}
      <Card padded={false}>
        <div className="px-3 py-2 border-b border-[var(--brand-surface-3)]">
          <span className="text-[11px] text-[var(--brand-text-mid)]">Rich content</span>
        </div>
        <div className="flex flex-col border-t border-[var(--brand-surface-3)]">
          {richFields.map(f => (
            <div key={f.label} className="flex items-center justify-between px-3 py-2 border-b border-[var(--brand-surface-3)] last:border-b-0">
              <span className="text-[11px] text-[var(--brand-text-mid)]">{f.label}</span>
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 rounded-full bg-[var(--brand-surface-3)] overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${s.total > 0 ? (f.count / s.total) * 100 : 0}%`, background: (f.count / Math.max(s.total, 1)) >= 0.7 ? '#22c55e' : (f.count / Math.max(s.total, 1)) >= 0.4 ? '#f59e0b' : '#ef4444' }} />
                </div>
                <span className="text-[10px] font-mono text-[var(--brand-text-mid)] w-12 text-right">{f.count} / {s.total}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Image quality */}
      <Card padded={false}>
        <div className="px-3 py-2 border-b border-[var(--brand-surface-3)]">
          <span className="text-[11px] text-[var(--brand-text-mid)]">Images</span>
        </div>
        <div className="flex flex-col border-t border-[var(--brand-surface-3)]">
          <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--brand-surface-3)]">
            <span className="text-[11px] text-[var(--brand-text-mid)]">Avg images per product</span>
            <span className={`text-[11px] font-mono font-medium ${s.schema.avgImages >= 3 ? 'text-[#22c55e]' : s.schema.avgImages >= 1.5 ? 'text-[#f59e0b]' : 'text-[#ef4444]'}`}>
              {s.schema.avgImages.toFixed(1)}
            </span>
          </div>
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-[11px] text-[var(--brand-text-mid)]">Alt text coverage</span>
            <div className="flex items-center gap-2">
              <div className="w-16 h-1.5 rounded-full bg-[var(--brand-surface-3)] overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${s.schema.altCoverage}%`, background: s.schema.altCoverage >= 90 ? '#22c55e' : s.schema.altCoverage >= 70 ? '#f59e0b' : '#ef4444' }} />
              </div>
              <span className="text-[10px] font-mono text-[var(--brand-text-mid)] w-8 text-right">{s.schema.altCoverage.toFixed(0)}%</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Category breakdown */}
      {s.byCategory.length > 1 && (
        <Card padded={false}>
          <div className="px-3 py-2 border-b border-[var(--brand-surface-3)]">
            <span className="text-[11px] text-[var(--brand-text-mid)]">Schema by category</span>
          </div>
          <div className="flex flex-col border-t border-[var(--brand-surface-3)]">
            {s.byCategory.slice(0, 8).map(c => (
              <div key={c.id} className="flex items-center justify-between px-3 py-2 border-b border-[var(--brand-surface-3)] last:border-b-0">
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] text-[var(--brand-text-mid)] truncate">{c.label}</div>
                  <div className="text-[10px] text-[var(--brand-text-faint)]">{c.products} products</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="w-12 h-1.5 rounded-full bg-[var(--brand-surface-3)] overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${c.schemaCov}%`, background: c.schemaCov >= 90 ? '#22c55e' : c.schemaCov >= 70 ? '#f59e0b' : '#ef4444' }} />
                  </div>
                  <span className="text-[10px] font-mono text-[var(--brand-text-mid)] w-8 text-right">{c.schemaCov}%</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {!s.hasPrior && <SingleCrawlNotice />}
    </div>
  )
}
