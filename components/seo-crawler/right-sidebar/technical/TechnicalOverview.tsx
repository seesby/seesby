import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useTechnicalInsights } from '../_hooks/useTechnicalInsights'
import { useHasTrend } from '../_hooks/useSessionsCount'
import { useDrill } from '../_shared/drill'
import { Card } from '../_shared/Card'
import { KpiTile } from '../_shared/KpiTile'
import { HealthStrip } from '../_shared/HealthStrip'
import { Distribution } from '../_shared/Distribution'
import { ProgressRing } from '../_shared/ProgressRing'
import { TopList } from '../_shared/lists'
import { SegmentTable } from '../_shared/SegmentTable'
import { EmptyState } from '../_shared/empty'
import { fmtPct } from '../_shared/format'
import { RsSparkline } from '../parts/RsSparkline'

export function TechnicalOverview() {
  const { pages } = useSeoCrawler()
  const s = useTechnicalInsights()
  const hasTrend = useHasTrend()
  const drill = useDrill()

  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  const topIssues = [...pages]
    .filter((p: any) => Number(p.statusCode) >= 400 || p.indexable === false || Number(p.lcpMs) > 2500)
    .slice(0, 5)

  return (
    <div className="flex flex-col gap-3 p-3">
      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-[var(--brand-text-mid)]">Tech score</div>
            <div className="mt-1 text-2xl font-semibold text-[var(--brand-text-strong)]">{Math.round(s.score)}</div>
            {hasTrend && s.history.scoreSeries.length > 1 ? (
              <div className="mt-1 w-24"><RsSparkline values={s.history.scoreSeries} /></div>
            ) : null}
          </div>
          <ProgressRing value={s.score} size={72} />
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-2">
        <KpiTile label="HTTPS" value={fmtPct(s.tech.httpsCoverage)} tone={s.tech.httpsCoverage >= 95 ? 'good' : 'warn'} />
        <KpiTile label="Indexable" value={fmtPct(s.tech.indexable)} tone={s.tech.indexable >= 90 ? 'good' : 'warn'} />
        <KpiTile label="CWV pass" value={fmtPct(s.tech.cwvPass)} tone={s.tech.cwvPass >= 75 ? 'good' : 'warn'} />
      </div>

      <Card title="Status mix">
        <HealthStrip
          total={s.total}
          segments={[
            { label: '2xx', value: s.status.ok, color: '#22c55e' },
            { label: '3xx', value: s.status.redirect, color: '#3b82f6' },
            { label: '4xx', value: s.status.client, color: '#f59e0b' },
            { label: '5xx', value: s.status.server, color: '#ef4444' },
            { label: 'Blocked', value: s.status.blocked, color: '#64748b' },
          ]}
        />
      </Card>

      <Card title="Indexability">
        <Distribution rows={[
          { label: 'Indexable', value: s.indexability.indexable, tone: 'good' },
          { label: 'Noindex', value: s.indexability.noindex, tone: 'warn' },
          { label: 'Canonical diff', value: s.indexability.canonicalDifferent, tone: 'warn' },
          { label: 'Blocked', value: s.indexability.blockedRobots, tone: 'bad' },
          { label: 'Orphan', value: s.indexability.orphan, tone: 'warn' },
        ]} />
      </Card>

      <Card title="Top issues">
        <TopList items={topIssues.map((p: any) => ({
          id: p.url,
          primary: p.title || p.url,
          secondary: p.url,
          tail: Number(p.statusCode) >= 400 ? `${p.statusCode}` : (p.indexable === false ? 'noindex' : `${Math.round(Number(p.lcpMs) || 0)}ms`),
          onClick: () => drill.toPage(p),
        }))} max={5} />
      </Card>

      <Card title="By template">
        <SegmentTable
          headers={['Template', 'Pages', 'Idx', 'Noindex']}
          rows={s.indexability.byTemplate.slice(0, 5).map((t: any) => ({
            id: t.id, label: t.label, values: [t.pages, t.indexable, t.noindex],
          }))}
        />
      </Card>
    </div>
  )
}
