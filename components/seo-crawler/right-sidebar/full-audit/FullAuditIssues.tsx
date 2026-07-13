import React, { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useHasTrend } from '../_hooks/useSessionsCount'
import { useDrill } from '../_shared/drill'
import { EmptyState } from '../_shared/EmptyState'
import { Card } from '../_shared/Card'
import { KpiTile } from '../_shared/KpiTile'
import { Distribution } from '../_shared/Distribution'
import { HealthStrip } from '../_shared/HealthStrip'
import { TopList } from '../_shared/lists'
import { ComparisonRow } from '../_shared/ComparisonRow'
import { Trendable } from '../_shared/blocks/Trendable'
import { SingleCrawlNotice } from '../_shared/blocks/SingleCrawlNotice'
import { DeltaChip } from '../_shared/DeltaChip'
import { RsSparkline } from '../parts/RsSparkline'
import { selectIssues } from './_selectors'

const SEV_COLOR = { critical: '#ef4444', high: '#f97316', medium: '#f59e0b', low: 'text-[var(--brand-text-mid)]' } as const

export default function FullAuditIssues() {
  const { pages, site, openIssueDrawer, compareSession } = useSeoCrawler() as any
  const hasTrend = useHasTrend()
  const drill = useDrill()
  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  const { rows, severity, category, openTotal } = useMemo(() => selectIssues(pages), [pages])

  const newCount = Number(site?.lastSession?.newIssues ?? 0)
  const resolvedCount = Number(site?.lastSession?.resolvedIssues ?? 0)
  const issuesSpark = (site?.history?.issuesOpen ?? []) as number[]

  // Previous session severity for comparison
  const prevSeverity = compareSession?.summary?.severity ?? null
  const prevIssuesOpen = compareSession?.summary?.issuesOpen ?? null

  // Pages with most issues for drill-down
  const topIssuePages = useMemo(() => {
    return [...pages]
      .filter((p: any) => {
        const code = Number(p.statusCode ?? 0)
        return code >= 400 || p.indexable === false || p.brokenInternalLinks > 0 || p.brokenExternalLinks > 0
      })
      .slice(0, 5)
  }, [pages])

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* Total issues */}
      <Card>
        <div className="flex items-end justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-[var(--brand-text-mid)]]">Issues open</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-[var(--brand-text-strong)]">{openTotal}</span>
              {hasTrend && prevIssuesOpen != null && (
                <DeltaChip value={openTotal - prevIssuesOpen} />
              )}
            </div>
          </div>
          {hasTrend && issuesSpark.length ? (
            <div className="w-28"><RsSparkline values={issuesSpark} stroke="#ef4444" fill="rgba(239,68,68,0.12)" /></div>
          ) : null}
        </div>
      </Card>

      {/* Severity breakdown */}
      <Card title="Severity">
        <HealthStrip
          total={openTotal || 1}
          segments={[
            { label: 'Critical', value: severity.critical, color: SEV_COLOR.critical },
            { label: 'High', value: severity.high, color: SEV_COLOR.high },
            { label: 'Medium', value: severity.medium, color: SEV_COLOR.medium },
            { label: 'Low', value: severity.low, color: SEV_COLOR.low },
          ]}
        />
      </Card>

      {/* New vs resolved - only with trend */}
      {hasTrend && (
        <div className="grid grid-cols-2 gap-2">
          <KpiTile label="New" value={newCount} tone={newCount > 0 ? 'bad' : 'good'} />
          <KpiTile label="Resolved" value={resolvedCount} tone={resolvedCount > 0 ? 'good' : 'neutral'} />
        </div>
      )}

      {/* Category breakdown */}
      <Card title="By category">
        <Distribution
          rows={[
            { label: 'Content', value: category.content, color: '#f59e0b' },
            { label: 'Technical', value: category.technical, color: '#3b82f6' },
            { label: 'Schema', value: category.schema, color: '#a78bfa' },
            { label: 'Links', value: category.links, color: '#14b8a6' },
            { label: 'A11y', value: category.a11y, color: '#10b981' },
            { label: 'Security', value: category.security, color: '#ef4444' },
            { label: 'Performance', value: category.performance, color: '#f97316' },
            { label: 'UX', value: category.ux, color: '#f43f5e' },
          ].filter(r => r.value > 0)}
        />
      </Card>

      {/* Top issues */}
      <Card title="Top issues" padded={false}>
        <ul className="flex flex-col border-t border-[var(--brand-surface-3)]]">
          {rows.slice(0, 6).map((r) => (
            <li key={r.code}>
              <button
                onClick={() => openIssueDrawer?.(r.code)}
                className="flex w-full items-center justify-between gap-2 border-b border-[var(--brand-surface-3)]] px-3 py-2 text-left hover:bg-[var(--brand-surface-2)]] transition-colors"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: SEV_COLOR[r.severity] }} />
                  <span className="truncate text-[12px] text-[var(--brand-text-mid)]]">{r.title}</span>
                </span>
                <span className="text-[11px] tabular-nums text-[var(--brand-text-mid)]]">{r.count}</span>
              </button>
            </li>
          ))}
          {rows.length === 0 && (
            <li className="px-3 py-3 text-[11px] text-[var(--brand-text-faint)]]">No issues found</li>
          )}
        </ul>
      </Card>

      {/* Pages with most issues */}
      {topIssuePages.length > 0 && (
        <Card title="Affected pages">
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
          {prevSeverity && (
            <>
              <ComparisonRow label="Critical" a={{ v: severity.critical, tag: 'now' }} b={{ v: prevSeverity.critical ?? 0, tag: 'prev' }} />
              <ComparisonRow label="High" a={{ v: severity.high, tag: 'now' }} b={{ v: prevSeverity.high ?? 0, tag: 'prev' }} />
              <ComparisonRow label="Medium" a={{ v: severity.medium, tag: 'now' }} b={{ v: prevSeverity.medium ?? 0, tag: 'prev' }} />
            </>
          )}
          {prevIssuesOpen != null && (
            <ComparisonRow label="Total" a={{ v: openTotal, tag: 'now' }} b={{ v: prevIssuesOpen, tag: 'prev' }} />
          )}
        </Card>
      </Trendable>

      {!hasTrend && <SingleCrawlNotice />}
    </div>
  )
}
