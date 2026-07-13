import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useAiInsights } from '../_hooks/useAiInsights'
import { useDrill } from '../_shared/drill'
import { Card } from '../_shared/Card'
import { KpiTile } from '../_shared/KpiTile'
import { Distribution } from '../_shared/Distribution'
import { TopList } from '../_shared/lists'
import { ComparisonRow } from '../_shared/ComparisonRow'
import { RowItem } from '../_shared/RowItem'
import { Trendable } from '../_shared/blocks/Trendable'
import { SingleCrawlNotice } from '../_shared/blocks/SingleCrawlNotice'
import { EmptyState } from '../_shared/empty'
import { fmtNum } from '../_shared/format'
import { RsSparkline } from '../parts/RsSparkline'

export function AiEntities() {
  const { pages } = useSeoCrawler()
  const s = useAiInsights()
  const drill = useDrill()
  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  const types = [
    { label: 'Person', value: s.entities.types.person },
    { label: 'Organization', value: s.entities.types.org },
    { label: 'Product', value: s.entities.types.product },
    { label: 'Event', value: s.entities.types.event },
    { label: 'Place', value: s.entities.types.place },
    { label: 'Other', value: s.entities.types.other },
  ].filter(t => t.value > 0)

  const topEntities = s.entities.list.slice(0, 10)

  const topPagesByEntities = s.entities.pagesByEntities.slice(0, 5)

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-2">
        <KpiTile label="Total entities" value={fmtNum(s.entities.totalEntities)} tone={s.entities.totalEntities > 0 ? 'good' : 'warn'} />
        <KpiTile label="SameAs coverage" value={`${s.entities.sameAsCoverage}%`} tone={s.entities.sameAsCoverage >= 70 ? 'good' : 'warn'} />
        <KpiTile label="Entity types" value={String(s.entities.typeCount)} />
        <KpiTile label="Density" value={`${s.entities.density}/page`} />
      </div>

      {/* Trend */}
      <Trendable hasPrior={s.hasTrend}>
        {s.history.entities.length > 1 && (
          <Card title="Entity trend">
            <div className="flex items-center justify-between">
              <RsSparkline values={s.history.entities} />
              <span className="text-[10px] text-[#666]">{fmtNum(s.entities.totalEntities)} total</span>
            </div>
          </Card>
        )}
      </Trendable>

      {/* Entity type mix */}
      {types.length > 0 && (
        <Card title="Entity types">
          <Distribution rows={types.map(t => ({
            label: t.label,
            value: t.value,
          }))} />
        </Card>
      )}

      {/* Top entities */}
      {topEntities.length > 0 && (
        <Card title="Top entities">
          <div className="flex flex-col border-t border-[#1f1f1f]">
            {topEntities.map((e: any) => (
              <RowItem
                key={e.label}
                title={e.label}
                meta={e.type}
                badge={<span className="text-[10px] text-[#888]">{e.citations} mentions</span>}
              />
            ))}
          </div>
        </Card>
      )}

      {/* Pages with most entities */}
      {topPagesByEntities.length > 0 && (
        <Card title="Richest pages">
          <TopList items={topPagesByEntities.map((p: any) => ({
            id: p.url,
            primary: p.title || p.url,
            secondary: p.url,
            tail: `${p.count} entities`,
            onClick: () => drill.toPage(p),
          }))} max={5} />
        </Card>
      )}

      {/* SameAs coverage detail */}
      <Card title="SameAs coverage">
        <div className="grid grid-cols-2 gap-2">
          <KpiTile label="With type" value={fmtNum(s.entities.totalEntities - s.entities.types.other)} tone="good" />
          <KpiTile label="Unknown type" value={fmtNum(s.entities.types.other)} tone={s.entities.types.other > 0 ? 'warn' : 'good'} />
        </div>
      </Card>

      {/* Comparison */}
      <Trendable hasPrior={s.hasTrend}>
        {s.entities.totalPrev > 0 && (
          <Card title="vs last crawl">
            <ComparisonRow
              label="Total entities"
              a={{ v: s.entities.totalEntities, tag: 'now' }}
              b={{ v: s.entities.totalPrev, tag: 'prev' }}
              format={(v: number) => fmtNum(v)}
            />
          </Card>
        )}
      </Trendable>

      {!s.hasTrend && <SingleCrawlNotice />}
    </div>
  )
}
