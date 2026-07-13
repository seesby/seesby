import React, { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useHasTrend } from '../_hooks/useSessionsCount'
import { useDrill } from '../_shared/drill'
import { EmptyState } from '../_shared/EmptyState'
import { Card } from '../_shared/Card'
import { KpiTile } from '../_shared/KpiTile'
import { Distribution } from '../_shared/Distribution'
import { ProgressRing } from '../_shared/ProgressRing'
import { HealthStrip } from '../_shared/HealthStrip'
import { TopList } from '../_shared/lists'
import { SegmentTable } from '../_shared/SegmentTable'
import { ComparisonRow } from '../_shared/ComparisonRow'
import { Trendable } from '../_shared/blocks/Trendable'
import { SingleCrawlNotice } from '../_shared/blocks/SingleCrawlNotice'
import { DeltaChip } from '../_shared/DeltaChip'
import { RsSparkline } from '../parts/RsSparkline'
import {
  selectStatusMix,
  selectDepthDistribution,
  selectCategoryDonut,
  selectIndexable,
  selectIssues,
  selectPillars,
  selectOverallScore,
  selectSearchSnapshot,
  selectTrafficSummary,
} from './_selectors'

function fmtCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

function grade(score: number) {
  if (score >= 90) return 'A'
  if (score >= 80) return 'A-'
  if (score >= 75) return 'B+'
  if (score >= 70) return 'B'
  if (score >= 65) return 'B-'
  if (score >= 60) return 'C+'
  if (score >= 55) return 'C'
  if (score >= 50) return 'C-'
  return 'D'
}

export default function FullAuditOverview() {
  const { pages, site, gscQueries, ga4Traffic, sessions, compareSession } = useSeoCrawler() as any
  const hasTrend = useHasTrend()

  if (!pages?.length) return <EmptyState title="No crawl data yet" />
  const drill = useDrill()

  const status = useMemo(() => selectStatusMix(pages), [pages])
  const depth = useMemo(() => selectDepthDistribution(pages), [pages])
  const donut = useMemo(() => selectCategoryDonut(pages), [pages])
  const idx = useMemo(() => selectIndexable(pages), [pages])
  const issues = useMemo(() => selectIssues(pages), [pages])
  const pillars = useMemo(() => selectPillars(pages), [pages])
  const overall = useMemo(() => selectOverallScore(pillars), [pillars])
  const search = useMemo(() => selectSearchSnapshot(gscQueries, sessions), [gscQueries, sessions])
  const traffic = useMemo(() => selectTrafficSummary(ga4Traffic), [ga4Traffic])
  const newPages = Number(site?.lastSession?.newPages ?? 0)
  const hasGsc = gscQueries?.length > 0
  const hasGa4 = ga4Traffic?.length > 0

  // Previous session data for comparisons
  const scoreSpark = (site?.history?.score ?? []) as number[]
  const scoreDelta = scoreSpark.length >= 2 ? overall - scoreSpark[scoreSpark.length - 2] : null
  const prevStatus = compareSession?.summary?.status
  const prevIssuesOpen = compareSession?.summary?.issuesOpen ?? null

  // Top pages with issues for drill-down
  const topIssuePages = useMemo(() => {
    return [...pages]
      .filter((p: any) => Number(p.statusCode) >= 400 || p.indexable === false)
      .slice(0, 5)
  }, [pages])

  // By template breakdown
  const byTemplate = useMemo(() => {
    const m = new Map<string, { pages: number; indexable: number; noindex: number }>()
    for (const p of pages) {
      const t = (p.template || 'other') as string
      const cur = m.get(t) ?? { pages: 0, indexable: 0, noindex: 0 }
      cur.pages++
      if (p.indexable) cur.indexable++
      if (String(p.metaRobots1 || '').toLowerCase().includes('noindex')) cur.noindex++
      m.set(t, cur)
    }
    return [...m.entries()]
      .map(([id, v]) => ({ id, label: id, values: [v.pages, v.indexable, v.noindex] as const }))
      .sort((a, b) => b.values[0] - a.values[0])
      .slice(0, 5)
  }, [pages])

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* Score hero */}
      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-[var(--brand-text-mid)]">Site score</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-[var(--brand-text-strong)]">{overall}</span>
              <span className="text-sm font-medium text-[var(--brand-text-faint)]">{grade(overall)}</span>
              {hasTrend && scoreDelta !== null && <DeltaChip value={scoreDelta} />}
            </div>
            {hasTrend && scoreSpark?.length ? (
              <div className="mt-1.5 w-24"><RsSparkline values={scoreSpark} stroke="#22c55e" fill="rgba(34,197,94,0.12)" /></div>
            ) : null}
          </div>
          <ProgressRing value={overall} size={72} />
        </div>
      </Card>

      {/* Core KPIs */}
      <div className="grid grid-cols-2 gap-2">
        <KpiTile
          label="Pages"
          value={status.total}
          sub={`${status.ok + status.redirect} crawlable`}
        />
        <KpiTile
          label="Indexable"
          value={idx.indexable}
          sub={`${idx.notIndexable} blocked`}
          tone={idx.notIndexable > 0 ? 'warn' : 'good'}
        />
        <KpiTile
          label="Issues"
          value={issues.openTotal}
          sub={issues.severity.critical > 0 ? `${issues.severity.critical} critical` : issues.openTotal > 0 ? `${issues.severity.high} high` : 'All clear'}
          tone={issues.severity.critical > 0 ? 'bad' : issues.openTotal > 0 ? 'warn' : 'good'}
        />
        <KpiTile
          label="HTML pages"
          value={status.ok + status.redirect}
          sub={`${status.clientError + status.serverError} with errors`}
        />
      </div>

      {/* Status mix */}
      <Card title="Status codes">
        <HealthStrip
          total={status.total}
          segments={[
            { label: '2xx', value: status.ok, color: '#22c55e' },
            { label: '3xx', value: status.redirect, color: '#3b82f6' },
            { label: '4xx', value: status.clientError, color: '#f59e0b' },
            { label: '5xx', value: status.serverError, color: '#ef4444' },
          ]}
        />
      </Card>

      {/* Indexability breakdown */}
      <Card title="Indexability">
        <Distribution
          rows={[
            { label: 'Indexable', value: idx.indexable, color: '#22c55e' },
            { label: 'Noindex', value: pages.filter((p: any) => String(p.metaRobots1 || '').toLowerCase().includes('noindex')).length, color: '#f59e0b' },
            { label: 'Canonical diff', value: pages.filter((p: any) => p.canonical && p.url && p.canonical !== p.url).length, color: '#f59e0b' },
            { label: 'Blocked', value: pages.filter((p: any) => String(p.robotsTxtDirective || '').includes('disallow')).length, color: '#ef4444' },
          ].filter(r => r.value > 0)}
        />
      </Card>

      {/* Search snapshot - only if GSC connected */}
      {hasGsc && (
        <Card title="Search performance">
          <div className="grid grid-cols-2 gap-2">
            <KpiTile label="Clicks" value={fmtCompact(search.clicks)} />
            <KpiTile label="Impressions" value={fmtCompact(search.impressions)} />
            <KpiTile label="CTR" value={`${(search.ctr * 100).toFixed(1)}%`} />
            <KpiTile label="Avg position" value={search.avgPosition.toFixed(1)} />
          </div>
        </Card>
      )}

      {/* Traffic - only if GA4 connected */}
      {hasGa4 && traffic.sessions > 0 && (
        <Card title="Traffic">
          <div className="grid grid-cols-2 gap-2">
            <KpiTile label="Sessions" value={fmtCompact(traffic.sessions)} />
            <KpiTile label="Users" value={fmtCompact(traffic.users)} />
          </div>
          <div className="mt-2">
            <Distribution
              rows={[
                { label: 'Organic', value: traffic.channels.organic, color: '#22c55e' },
                { label: 'Direct', value: traffic.channels.direct, color: '#3b82f6' },
                { label: 'Referral', value: traffic.channels.referral, color: '#a78bfa' },
                { label: 'Social', value: traffic.channels.social, color: '#f59e0b' },
                { label: 'Paid', value: traffic.channels.paid, color: '#ef4444' },
              ].filter(r => r.value > 0)}
            />
          </div>
        </Card>
      )}

      {/* Page types */}
      <Card title="Page types">
        <Distribution rows={donut.map((d) => ({ label: d.name, value: d.value, color: d.color }))} />
      </Card>

      {/* Crawl depth */}
      <Card title="Crawl depth">
        <Distribution rows={depth.map((d) => ({ label: `D${d.depth}`, value: d.count }))} />
      </Card>

      {/* By template */}
      {byTemplate.length > 0 && (
        <Card title="By template">
          <SegmentTable
            headers={['Template', 'Pages', 'Idx', 'Noindex']}
            rows={byTemplate.map(t => ({
              id: t.id,
              label: t.label,
              values: t.values,
            }))}
          />
        </Card>
      )}

      {/* Pages with issues */}
      {topIssuePages.length > 0 && (
        <Card title="Pages with issues">
          <TopList items={topIssuePages.map((p: any) => ({
            id: p.url,
            primary: p.title || p.url,
            secondary: p.url,
            tail: Number(p.statusCode) >= 400 ? `${p.statusCode}` : (p.indexable === false ? 'noindex' : ''),
            onClick: () => drill.toPage(p),
          }))} max={5} />
        </Card>
      )}

      {/* Trend section */}
      <Trendable hasPrior={hasTrend}>
        <Card title="vs last crawl">
          {prevStatus && (
            <>
              <ComparisonRow label="Status 2xx" a={{ v: status.ok, tag: 'now' }} b={{ v: prevStatus.ok ?? 0, tag: 'prev' }} />
              <ComparisonRow label="Status 4xx" a={{ v: status.clientError, tag: 'now' }} b={{ v: prevStatus.clientError ?? 0, tag: 'prev' }} />
            </>
          )}
          {prevIssuesOpen != null && (
            <ComparisonRow label="Issues" a={{ v: issues.openTotal, tag: 'now' }} b={{ v: prevIssuesOpen, tag: 'prev' }} />
          )}
          <ComparisonRow label="Pages" a={{ v: status.total, tag: 'now' }} b={{ v: (prevStatus?.ok ?? 0) + (prevStatus?.redirect ?? 0) + (prevStatus?.clientError ?? 0) + (prevStatus?.serverError ?? 0), tag: 'prev' }} />
        </Card>
      </Trendable>

      {!hasTrend && <SingleCrawlNotice />}
    </div>
  )
}
