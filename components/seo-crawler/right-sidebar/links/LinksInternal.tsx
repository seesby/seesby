import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useLinksInsights } from '../_hooks/useLinksInsights'
import { useDrill } from '../_shared/drill'
import { Card } from '../_shared/Card'
import { KpiTile } from '../_shared/KpiTile'
import { HealthStrip } from '../_shared/HealthStrip'
import { SegmentTable } from '../_shared/SegmentTable'
import { RowItem } from '../_shared/RowItem'
import { AnchorMixBlock } from '../_shared/blocks/AnchorMixBlock'
import { DrillFooter } from '../_shared/blocks/CardBlocks'
import { EmptyState } from '../_shared/empty'
import { compactNum } from '../_shared/format'

export function LinksInternal() {
  const { pages } = useSeoCrawler()
  const s = useLinksInsights()
  const drill = useDrill()
  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  const totalSafe = s.internal.bucket0 + s.internal.bucket12 + s.internal.bucket310 + s.internal.bucket1150 + s.internal.bucket50 || 1

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* Inlinks distribution */}
      <Card title="Inlinks per page">
        <HealthStrip
          total={totalSafe}
          segments={[
            { label: '0 (orphans)', value: s.internal.bucket0, color: '#ef4444' },
            { label: '1–2', value: s.internal.bucket12, color: '#f59e0b' },
            { label: '3–10', value: s.internal.bucket310, color: '#60a5fa' },
            { label: '11–50', value: s.internal.bucket1150, color: '#22c55e' },
            { label: '50+', value: s.internal.bucket50, color: '#10b981' },
          ].filter(seg => seg.value > 0)}
        />
        <div className="mt-2 grid grid-cols-2 gap-2">
          <KpiTile label="Avg inlinks" value={Math.round(s.internal.avgPerPage).toString()}
            tone={s.internal.avgPerPage >= 5 ? 'good' : s.internal.avgPerPage >= 2 ? 'warn' : 'bad'} />
          <KpiTile label="Total inlinks" value={compactNum(s.internal.total)} />
        </div>
      </Card>

      {/* Anchor types (internal) */}
      <AnchorMixBlock title="Internal anchor types" mix={{
        brand: s.internal.anchorBranded,
        exact: s.internal.anchorExact,
        partial: 0,
        generic: s.internal.anchorGeneric,
        naked: s.internal.anchorNaked,
        image: 0,
      }} />

      {/* Orphan pages */}
      <Card title="Orphan pages" padded={false}>
        <div className="flex flex-col border-t border-[var(--brand-surface-3)]">
          {s.orphanPages.length > 0 ? (
            s.orphanPages.slice(0, 5).map((p: any) => (
              <RowItem
                key={p.url}
                title={p.title || p.url}
                meta={p.url}
                badge={<span className="text-[10px] font-mono text-[#ef4444]">0</span>}
                onClick={() => drill.toPage(p)}
              />
            ))
          ) : (
            <div className="px-2 py-3 text-[11px] text-[var(--brand-text-faint)] italic">No orphan pages</div>
          )}
        </div>
      </Card>

      {/* Most linked pages */}
      <Card title="Most linked pages" padded={false}>
        <div className="flex flex-col border-t border-[var(--brand-surface-3)]">
          {s.mostLinked.slice(0, 5).map((p: any) => (
            <RowItem
              key={p.url}
              title={p.title || p.url}
              meta={p.url}
              badge={<span className="text-[10px] font-mono text-[#22c55e]">{compactNum(Number(p.inLinks) || 0)}</span>}
              onClick={() => drill.toPage(p)}
            />
          ))}
        </div>
      </Card>

      {/* Hub pages */}
      {s.internal.hubPages.length > 0 && (
        <Card title="Hub pages" padded={false}>
          <div className="flex flex-col border-t border-[var(--brand-surface-3)]">
            {s.internal.hubPages.slice(0, 5).map((p: any) => (
              <RowItem
                key={p.url}
                title={p.title || p.url}
                meta={p.url}
                badge={<span className="text-[10px] font-mono text-[#a78bfa]">{compactNum(Number(p.inLinks) || 0)} in</span>}
                onClick={() => drill.toPage(p)}
              />
            ))}
          </div>
        </Card>
      )}

      {/* By template */}
      {s.internal.byTemplate.length > 1 && (
        <Card title="By template">
          <SegmentTable
            headers={['Template', 'Pages', 'Avg inlinks', 'Outlinks', 'Orphans']}
            rows={s.internal.byTemplate.map((t: any) => ({
              id: t.id, label: t.label,
              values: [t.pages, t.avgInlinks.toFixed(0), t.outlinks || 0, t.orphans],
            }))}
          />
        </Card>
      )}

      {/* Drill chips */}
      <DrillFooter chips={[
        { label: 'Orphans', count: s.internal.orphans },
        { label: 'Broken', count: s.internal.broken },
        { label: 'Redirected', count: s.internal.redirected },
      ]} />
    </div>
  )
}
