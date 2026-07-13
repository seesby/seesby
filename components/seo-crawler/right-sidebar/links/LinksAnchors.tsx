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
import { DeltaChip } from '../_shared/DeltaChip'
import { fmtPct, compactNum } from '../_shared/format'

export function LinksAnchors() {
  const { pages } = useSeoCrawler()
  const s = useLinksInsights()
  const drill = useDrill()
  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  const totalLen = s.anchors.len1 + s.anchors.len23 + s.anchors.len46 + s.anchors.len7 || 1

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-2">
        <KpiTile label="Unique anchors" value={String(s.uniqueAnchors)} />
        <KpiTile label="Diversity" value={`${fmtPct(s.anchors.diversity * 100)}`}
          tone={s.anchors.diversity >= 0.6 ? 'good' : s.anchors.diversity >= 0.3 ? 'warn' : 'bad'}
          sub={`${compactNum(s.anchors.total)} total`} />
        <KpiTile label="Branded" value={`${fmtPct(s.anchors.brandedShare * 100)}`}
          tone={s.anchors.brandedShare >= 0.4 ? 'good' : 'warn'} />
        <KpiTile label="Exact match" value={`${fmtPct(s.anchors.exactShare * 100)}`}
          tone={s.anchors.exactShare <= 0.1 ? 'good' : s.anchors.exactShare <= 0.2 ? 'warn' : 'bad'} />
      </div>

      {/* Trend comparison */}
      {s.hasTrend && (
        <Card title="vs last crawl">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[#bbb]">Branded share</span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-white">{fmtPct(s.anchors.brandedShare * 100)}</span>
                <DeltaChip value={Math.round((s.anchors.brandedShare - s.anchors.brandedSharePrev) * 100)} suffix="pp" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[#bbb]">Exact share</span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-white">{fmtPct(s.anchors.exactShare * 100)}</span>
                <DeltaChip value={Math.round((s.anchors.exactShare - s.anchors.exactSharePrev) * 100)} suffix="pp" />
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Anchor type mix */}
      <AnchorMixBlock title="Anchor type mix" mix={{
        brand: s.anchors.branded,
        exact: s.anchors.exact,
        partial: s.anchors.partial,
        generic: s.anchors.generic,
        naked: s.anchors.naked,
        image: s.anchors.image,
      }} />

      {/* Length distribution */}
      <Card title="Anchor length">
        <HealthStrip
          total={totalLen}
          segments={[
            { label: '1 word', value: s.anchors.len1, color: '#f59e0b' },
            { label: '2–3 words', value: s.anchors.len23, color: '#22c55e' },
            { label: '4–6 words', value: s.anchors.len46, color: '#60a5fa' },
            { label: '7+ words', value: s.anchors.len7, color: '#a78bfa' },
          ].filter(seg => seg.value > 0)}
        />
      </Card>

      {/* Top anchor texts */}
      <Card title="Top anchor texts" padded={false}>
        <div className="flex flex-col border-t border-[#1f1f1f]">
          {s.anchors.top.slice(0, 8).map((a: any) => (
            <RowItem
              key={a.text}
              title={a.text || '(empty)'}
              badge={<span className="text-[10px] font-mono text-[#60a5fa]">{a.count}</span>}
            />
          ))}
        </div>
      </Card>

      {/* Over-optimized exact match */}
      <Card title="Over-optimized exact match" padded={false}>
        <div className="flex flex-col border-t border-[#1f1f1f]">
          {s.anchors.exactRisk.length > 0 ? (
            s.anchors.exactRisk.slice(0, 5).map((a: any) => (
              <RowItem
                key={a.text}
                title={a.text}
                badge={<span className="text-[10px] font-mono text-[#f59e0b]">{a.count} uses</span>}
              />
            ))
          ) : (
            <div className="px-2 py-3 text-[11px] text-[#666] italic">No exact-match over-optimization</div>
          )}
        </div>
      </Card>

      {/* By target page */}
      {s.anchors.byPage.length > 0 && (
        <Card title="By target page">
          <SegmentTable
            headers={['Page', 'Branded', 'Exact', 'Generic']}
            rows={s.anchors.byPage.map((p: any) => ({
              id: p.url, label: p.title || p.url,
              values: [p.branded, p.exact, p.generic],
            }))}
            onRowClick={(row) => {
              const p = s.anchors.byPage.find((x: any) => x.url === row.id)
              if (p) drill.toPage(p)
            }}
          />
        </Card>
      )}

      {/* Drill chips */}
      <DrillFooter chips={[
        { label: 'Exact risk', count: s.anchors.exactRisk.length },
        { label: 'Empty anchors', count: s.anchors.empty },
      ]} />
    </div>
  )
}
