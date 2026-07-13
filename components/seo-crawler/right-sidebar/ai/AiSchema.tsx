import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useAiInsights } from '../_hooks/useAiInsights'
import { useDrill } from '../_shared/drill'
import { Card } from '../_shared/Card'
import { KpiTile } from '../_shared/KpiTile'
import { ProgressRing } from '../_shared/ProgressRing'
import { Distribution } from '../_shared/Distribution'
import { TopList } from '../_shared/lists'
import { ComparisonRow } from '../_shared/ComparisonRow'
import { RowItem } from '../_shared/RowItem'
import { Trendable } from '../_shared/blocks/Trendable'
import { SingleCrawlNotice } from '../_shared/blocks/SingleCrawlNotice'
import { EmptyState } from '../_shared/empty'
import { RsSparkline } from '../parts/RsSparkline'

export function AiSchema() {
  const { pages } = useSeoCrawler()
  const s = useAiInsights()
  const drill = useDrill()
  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  const fields = [
    { label: 'about / mentions', value: s.schema.fields.about },
    { label: 'sameAs', value: s.schema.fields.sameAs },
    { label: 'author', value: s.schema.fields.author },
    { label: 'datePublished', value: s.schema.fields.datePublished },
    { label: 'description', value: s.schema.fields.description },
    { label: 'image', value: s.schema.fields.image },
  ]

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* Score card */}
      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-[#888]">Schema score</div>
            <div className="mt-1 text-2xl font-semibold text-white">{s.schema.score}</div>
            <div className="mt-1 text-[10px] text-[#666]">{s.schema.pagesWithSchema} of {s.schema.totalPages} pages</div>
          </div>
          <ProgressRing value={s.schema.score} size={72} />
        </div>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-2">
        <KpiTile label="Coverage" value={s.schema.coverage} tone={Number(s.schema.coverage) >= 70 ? 'good' : 'warn'} />
        <KpiTile label="With schema" value={String(s.schema.pagesWithSchema)} />
        <KpiTile label="Errors" value={String(s.schema.errorPages.length)} tone={s.schema.errorPages.length === 0 ? 'good' : 'bad'} />
        <KpiTile label="Missing" value={String(s.schema.missingPages.length)} tone={s.schema.missingPages.length === 0 ? 'good' : 'warn'} />
      </div>

      {/* Trend */}
      <Trendable hasPrior={s.hasTrend}>
        {s.history.schema.length > 1 && (
          <Card title="Schema trend">
            <div className="flex items-center justify-between">
              <RsSparkline values={s.history.schema} />
              <span className="text-[10px] text-[#666]">{s.schema.score}</span>
            </div>
          </Card>
        )}
      </Trendable>

      {/* Schema type mix */}
      {s.schema.types.length > 0 && (
        <Card title="Schema types">
          <Distribution rows={s.schema.types.slice(0, 6).map((t: any) => ({
            label: t.type,
            value: t.count,
          }))} />
        </Card>
      )}

      {/* AI-key fields coverage */}
      <Card title="AI-key fields">
        <div className="flex flex-col border-t border-[#1f1f1f]">
          {fields.map(f => (
            <RowItem
              key={f.label}
              title={f.label}
              badge={
                <span className={`text-[10px] font-mono ${
                  Number(f.value) >= 70 ? 'text-emerald-400'
                    : Number(f.value) >= 40 ? 'text-amber-400'
                    : 'text-red-400'
                }`}>
                  {f.value}
                </span>
              }
            />
          ))}
        </div>
      </Card>

      {/* Schema stats */}
      <Card title="Schema stats">
        <div className="grid grid-cols-2 gap-2">
          <KpiTile label="Fields present" value={`${s.schema.fieldsPresent}/${s.schema.fieldCount}`} tone={s.schema.fieldsPresent >= s.schema.fieldCount ? 'good' : 'warn'} />
          <KpiTile label="Page coverage" value={s.schema.coverage} tone={Number(s.schema.coverage) >= 70 ? 'good' : 'warn'} />
        </div>
      </Card>

      {/* Missing schema pages */}
      {s.schema.missingPages.length > 0 && (
        <Card title="Missing schema">
          <TopList items={s.schema.missingPages.map((p: any) => ({
            id: p.url,
            primary: p.title || p.url,
            secondary: p.url,
            tail: 'no schema',
            onClick: () => drill.toPage(p),
          }))} max={5} />
        </Card>
      )}

      {/* Schema error pages */}
      {s.schema.errorPages.length > 0 && (
        <Card title="Schema errors">
          <TopList items={s.schema.errorPages.map((p: any) => ({
            id: p.url,
            primary: p.title || p.url,
            secondary: p.url,
            tail: `${p.schemaErrors?.length || 0} errors`,
            onClick: () => drill.toPage(p),
          }))} max={5} />
        </Card>
      )}

      {/* Comparison */}
      <Trendable hasPrior={s.hasTrend}>
        {!Number.isNaN(s.schema.scorePrev) && (
          <Card title="vs last crawl">
            <ComparisonRow
              label="Schema score"
              a={{ v: s.schema.score, tag: 'now' }}
              b={{ v: s.schema.scorePrev, tag: 'prev' }}
              format={(v: number) => String(v)}
            />
          </Card>
        )}
      </Trendable>

      {!s.hasTrend && <SingleCrawlNotice />}
    </div>
  )
}
