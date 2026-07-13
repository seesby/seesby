import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useAiInsights } from '../_hooks/useAiInsights'
import { useDrill } from '../_shared/drill'
import { Card } from '../_shared/Card'
import { KpiTile } from '../_shared/KpiTile'
import { Distribution } from '../_shared/Distribution'
import { HealthStrip } from '../_shared/HealthStrip'
import { TopList } from '../_shared/lists'
import { ComparisonRow } from '../_shared/ComparisonRow'
import { Trendable } from '../_shared/blocks/Trendable'
import { SingleCrawlNotice } from '../_shared/blocks/SingleCrawlNotice'
import { EmptyState } from '../_shared/empty'
import { fmtNum } from '../_shared/format'
import { RsSparkline } from '../parts/RsSparkline'

export function AiCitations() {
  const { pages } = useSeoCrawler()
  const s = useAiInsights()
  const drill = useDrill()
  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  const engines = [
    { label: 'ChatGPT', value: s.citations.byEngine.chatgpt },
    { label: 'Gemini', value: s.citations.byEngine.gemini },
    { label: 'Perplexity', value: s.citations.byEngine.perplexity },
    { label: 'Claude', value: s.citations.byEngine.claude },
    { label: 'Bing', value: s.citations.byEngine.bing },
  ]

  const intents = [
    { label: 'Informational', value: s.citations.byIntent.info },
    { label: 'Commercial', value: s.citations.byIntent.comm },
    { label: 'Transactional', value: s.citations.byIntent.tx },
    { label: 'Navigational', value: s.citations.byIntent.nav },
  ].filter(i => i.value > 0)

  const totalIntent = intents.reduce((sum, i) => sum + i.value, 0)

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-2">
        <KpiTile label="Total citations" value={fmtNum(s.citations.total)} tone={s.citations.total > 0 ? 'good' : 'neutral'} />
        <KpiTile label="Cited pages" value={fmtNum(s.citations.uniquePages)} />
        <KpiTile label="Citation rate" value={s.citations.rate} tone={Number(s.citations.rate) > 10 ? 'good' : 'warn'} />
        <KpiTile label="Engines citing" value={String(s.citations.engineCount)} tone={s.citations.engineCount >= 3 ? 'good' : 'warn'} />
      </div>

      {/* Trend */}
      <Trendable hasPrior={s.hasTrend}>
        {s.history.citations.length > 1 && (
          <Card title="Citation trend">
            <div className="flex items-center justify-between">
              <RsSparkline values={s.history.citations} />
              <span className="text-[10px] text-[var(--brand-text-faint)]]">{fmtNum(s.citations.total)} total</span>
            </div>
          </Card>
        )}
      </Trendable>

      {/* Citations by engine */}
      <Card title="By engine">
        <Distribution rows={engines.map(e => ({
          label: e.label,
          value: e.value,
        }))} />
      </Card>

      {/* Citation stats */}
      <Card title="Citation stats">
        <div className="grid grid-cols-2 gap-2">
          <KpiTile label="Uncited pages" value={fmtNum(s.citations.uncitedCount)} tone={s.citations.uncitedCount === 0 ? 'good' : 'warn'} />
          <KpiTile label="Top engine" value={s.citations.topEngine || 'N/A'} />
        </div>
      </Card>

      {/* Query intent mix */}
      {intents.length > 0 && (
        <Card title="Query intent">
          <HealthStrip
            total={totalIntent || 1}
            segments={intents.map((i, idx) => ({
              label: i.label,
              value: i.value,
              color: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'][idx],
            }))}
          />
        </Card>
      )}

      {/* Most cited pages */}
      {s.citations.topPages.length > 0 && (
        <Card title="Most cited pages">
          <TopList items={s.citations.topPages.slice(0, 5).map((p: any) => ({
            id: p.url,
            primary: p.title || p.url,
            secondary: p.url,
            tail: `${p.citations} cites`,
            onClick: () => drill.toPage(p),
          }))} max={5} />
        </Card>
      )}

      {/* Top queries */}
      {s.citations.topQueries.length > 0 && (
        <Card title="Top queries">
          <TopList items={s.citations.topQueries.slice(0, 5).map((q: any) => ({
            id: q.query,
            primary: q.query,
            tail: `${q.count} pages`,
          }))} max={5} />
        </Card>
      )}

      {/* Comparison */}
      <Trendable hasPrior={s.hasTrend}>
        {s.citations.totalPrev > 0 && (
          <Card title="vs last crawl">
            <ComparisonRow
              label="Total citations"
              a={{ v: s.citations.total, tag: 'now' }}
              b={{ v: s.citations.totalPrev, tag: 'prev' }}
              format={(v: number) => fmtNum(v)}
            />
          </Card>
        )}
      </Trendable>

      {!s.hasTrend && <SingleCrawlNotice />}
    </div>
  )
}
