import React, { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useHasTrend } from '../_hooks/useSessionsCount'
import { useDrill } from '../_shared/drill'
import { EmptyState } from '../_shared/EmptyState'
import { Card } from '../_shared/Card'
import { KpiTile } from '../_shared/KpiTile'
import { Distribution } from '../_shared/Distribution'
import { HealthStrip } from '../_shared/HealthStrip'
import { CrawlHeaderCard } from '../_shared/CrawlHeaderCard'
import { TopList } from '../_shared/lists'
import { SegmentTable } from '../_shared/SegmentTable'
import { ComparisonRow } from '../_shared/ComparisonRow'
import { Trendable } from '../_shared/blocks/Trendable'
import { SingleCrawlNotice } from '../_shared/blocks/SingleCrawlNotice'
import { selectCrawlHealth } from './_selectors'

function fmtMs(ms: number) {
  if (!ms) return '—'
  if (ms < 1000) return `${ms} ms`
  return `${(ms / 1000).toFixed(1)} s`
}

export default function FullAuditCrawlHealth() {
  const { site, industry, cms, language, country, pages, compareSession } = useSeoCrawler() as any
  const h = useMemo(() => selectCrawlHealth(site), [site])
  const hasTrend = useHasTrend()

  if (!pages?.length) return <EmptyState title="No crawl data yet" />
  const drill = useDrill()

  const errorTotal = h.errors.timeouts + h.errors.server + h.errors.parse + h.errors.dns
  const blockedTotal = h.blocked.robots + h.blocked.metaNoindex + h.blocked.auth
  const renderTotal = h.render.staticHtml + h.render.ssr + h.render.csr

  // Previous session data for comparison
  const prevCrawl = compareSession?.summary?.crawl ?? null

  // Slowest pages
  const slowPages = useMemo(() => {
    return [...(pages || [])]
      .filter((p: any) => Number(p.responseMs) > 0)
      .sort((a: any, b: any) => Number(b.responseMs) - Number(a.responseMs))
      .slice(0, 5)
  }, [pages])

  // 5xx pages
  const errorPages = useMemo(() => {
    return [...(pages || [])]
      .filter((p: any) => Number(p.statusCode) >= 500)
      .slice(0, 5)
  }, [pages])

  // Deepest pages
  const deepPages = useMemo(() => {
    return [...(pages || [])]
      .filter((p: any) => Number(p.depth) > 3)
      .sort((a: any, b: any) => Number(b.depth) - Number(a.depth))
      .slice(0, 5)
  }, [pages])

  // Response time distribution
  const responseDist = useMemo(() => {
    const fast = pages.filter((p: any) => Number(p.responseMs) > 0 && Number(p.responseMs) < 500).length
    const ok = pages.filter((p: any) => Number(p.responseMs) >= 500 && Number(p.responseMs) < 1000).length
    const slow = pages.filter((p: any) => Number(p.responseMs) >= 1000 && Number(p.responseMs) < 3000).length
    const verySlow = pages.filter((p: any) => Number(p.responseMs) >= 3000).length
    return { fast, ok, slow, verySlow }
  }, [pages])

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* Crawl header */}
      <CrawlHeaderCard
        scope={{ label: 'All pages' }}
        industry={industry}
        cms={cms}
        language={language}
        country={country}
        lastCrawlAt={h.startedAt}
        durationMs={h.durationMs}
        pagesCrawled={h.pagesCrawled}
      />

      {/* Timing stats */}
      <div className="grid grid-cols-3 gap-2">
        <KpiTile label="Avg" value={fmtMs(h.avgMs)} />
        <KpiTile label="p90" value={fmtMs(h.p90Ms)} />
        <KpiTile label="p99" value={fmtMs(h.p99Ms)} />
      </div>

      {/* Response time distribution */}
      <Card title="Response time">
        <HealthStrip
          total={responseDist.fast + responseDist.ok + responseDist.slow + responseDist.verySlow || 1}
          segments={[
            { label: '<500ms', value: responseDist.fast, color: '#22c55e' },
            { label: '500ms-1s', value: responseDist.ok, color: '#3b82f6' },
            { label: '1-3s', value: responseDist.slow, color: '#f59e0b' },
            { label: '3s+', value: responseDist.verySlow, color: '#ef4444' },
          ]}
        />
      </Card>

      {/* Errors */}
      {errorTotal > 0 && (
        <Card title={`Errors (${errorTotal})`}>
          <Distribution
            rows={[
              { label: 'Timeouts', value: h.errors.timeouts, color: '#ef4444' },
              { label: '5xx', value: h.errors.server, color: '#f97316' },
              { label: 'Parse', value: h.errors.parse, color: '#f59e0b' },
              { label: 'DNS', value: h.errors.dns, color: '#a78bfa' },
            ].filter(r => r.value > 0)}
          />
        </Card>
      )}

      {/* 5xx pages */}
      {errorPages.length > 0 && (
        <Card title="5xx pages">
          <TopList items={errorPages.map((p: any) => ({
            id: p.url,
            primary: p.title || p.url,
            secondary: p.url,
            tail: `${p.statusCode}`,
            onClick: () => drill.toPage(p),
          }))} max={5} />
        </Card>
      )}

      {/* Blocked */}
      {blockedTotal > 0 && (
        <Card title={`Blocked (${blockedTotal})`}>
          <Distribution
            rows={[
              { label: 'robots.txt', value: h.blocked.robots, color: '#94a3b8' },
              { label: 'noindex', value: h.blocked.metaNoindex, color: '#64748b' },
              { label: 'auth', value: h.blocked.auth, color: '#475569' },
            ].filter(r => r.value > 0)}
          />
        </Card>
      )}

      {/* Sitemap parity */}
      <Card title="Sitemap parity">
        <HealthStrip
          total={h.sitemap.inSitemap + h.sitemap.missingFromSitemap + h.sitemap.orphanInSitemap || 1}
          segments={[
            { label: 'In sitemap', value: h.sitemap.inSitemap, color: '#22c55e' },
            { label: 'Missing', value: h.sitemap.missingFromSitemap, color: '#f59e0b' },
            { label: 'Orphan', value: h.sitemap.orphanInSitemap, color: '#ef4444' },
          ]}
        />
      </Card>

      {/* Render mode */}
      {renderTotal > 0 && (
        <Card title="Render mode">
          <HealthStrip
            total={renderTotal}
            segments={[
              { label: 'Static', value: h.render.staticHtml, color: '#22c55e' },
              { label: 'SSR', value: h.render.ssr, color: '#3b82f6' },
              { label: 'CSR', value: h.render.csr, color: '#f59e0b' },
            ]}
          />
        </Card>
      )}

      {/* Slowest pages */}
      {slowPages.length > 0 && (
        <Card title="Slowest pages">
          <TopList items={slowPages.map((p: any) => ({
            id: p.url,
            primary: p.title || p.url,
            secondary: p.url,
            tail: fmtMs(Number(p.responseMs)),
            onClick: () => drill.toPage(p),
          }))} max={5} />
        </Card>
      )}

      {/* Deepest pages */}
      {deepPages.length > 0 && (
        <Card title="Deepest pages">
          <TopList items={deepPages.map((p: any) => ({
            id: p.url,
            primary: p.title || p.url,
            secondary: p.url,
            tail: `D${p.depth}`,
            onClick: () => drill.toPage(p),
          }))} max={5} />
        </Card>
      )}

      {/* Trend section */}
      <Trendable hasPrior={hasTrend}>
        <Card title="vs last crawl">
          {prevCrawl && (
            <>
              <ComparisonRow label="Avg response" a={{ v: h.avgMs, tag: 'now' }} b={{ v: prevCrawl.avgMs ?? 0, tag: 'prev' }} format={fmtMs} />
              <ComparisonRow label="Errors" a={{ v: errorTotal, tag: 'now' }} b={{ v: (prevCrawl.errors ?? 0) as number, tag: 'prev' }} />
              <ComparisonRow label="Blocked" a={{ v: blockedTotal, tag: 'now' }} b={{ v: (prevCrawl.blocked ?? 0) as number, tag: 'prev' }} />
            </>
          )}
        </Card>
      </Trendable>

      {!hasTrend && <SingleCrawlNotice />}
    </div>
  )
}
