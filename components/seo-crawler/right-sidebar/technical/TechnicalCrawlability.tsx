import React, { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useTechnicalInsights } from '../_hooks/useTechnicalInsights'
import { useHasTrend } from '../_hooks/useSessionsCount'
import { useDrill } from '../_shared/drill'
import { Card } from '../_shared/Card'
import { KpiTile } from '../_shared/KpiTile'
import { HealthStrip } from '../_shared/HealthStrip'
import { Distribution } from '../_shared/Distribution'
import { TopList } from '../_shared/lists'
import { ComparisonRow } from '../_shared/ComparisonRow'
import { EmptyState } from '../_shared/empty'
import { fmtNum, fmtPct, fmtMs } from '../_shared/format'
import { depthBucket } from '../_shared/derive'

export function TechnicalCrawlability() {
  const { pages = [] } = useSeoCrawler() as any
  const s = useTechnicalInsights()
  const hasTrend = useHasTrend()
  const drill = useDrill()

  const slowestRedirects = useMemo(() =>
    [...pages].filter((p: any) => Number(p.redirectChainLength) > 1)
      .sort((a: any, b: any) => Number(b.redirectChainLength) - Number(a.redirectChainLength))
      .slice(0, 5),
  [pages])

  const deepest = useMemo(() =>
    [...pages].sort((a: any, b: any) => Number(b.crawlDepth) - Number(a.crawlDepth)).slice(0, 5),
  [pages])

  const depthDist = useMemo(() => {
    const buckets = ['0', '1', '2', '3', '4', '5+']
    return buckets.map(d => ({
      label: `D${d}`,
      value: pages.filter((p: any) => {
        const depth = Number(p.crawlDepth ?? 0)
        return d === '5+' ? depth >= 5 : depth === Number(d)
      }).length,
    }))
  }, [pages])

  const inSitemap = pages.filter((p: any) => p.inSitemap === true).length
  const missingFromSitemap = pages.filter((p: any) => p.inSitemap === false && Number(p.statusCode) === 200 && (p.isHtmlPage || String(p.contentType || '').includes('html'))).length
  const orphanInSitemap = pages.filter((p: any) => p.inSitemap === true && Number(p.inlinks) === 0).length

  const hreflangErrors = pages.filter((p: any) => p.hreflangIssues?.length > 0 || p.hreflangError).length
  const canonicalErrors = pages.filter((p: any) => p.canonical && p.canonical !== p.url && !p.indexable).length

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="grid grid-cols-2 gap-2">
        <KpiTile label="Avg depth" value={Number(s.crawlStats.avgDepth).toFixed(1)} />
        <KpiTile label="Redirect chains" value={slowestRedirects.length} tone={slowestRedirects.length > 0 ? 'warn' : 'good'} />
      </div>

      <Card title="Depth distribution">
        <Distribution rows={depthDist.map(d => ({
          label: d.label,
          value: d.value,
          tone: Number(d.label.slice(1)) >= 4 ? 'warn' : undefined,
        }))} />
      </Card>

      <Card title="Sitemap parity">
        <HealthStrip
          total={inSitemap + missingFromSitemap + orphanInSitemap || 1}
          segments={[
            { label: 'In sitemap', value: inSitemap, color: '#22c55e' },
            { label: 'Missing', value: missingFromSitemap, color: '#f59e0b' },
            { label: 'Orphan', value: orphanInSitemap, color: '#ef4444' },
          ]}
        />
      </Card>

      <Card title="Longest redirect chains">
        <TopList items={slowestRedirects.map((p: any) => ({
          id: p.url, primary: p.title || p.url, secondary: p.url,
          tail: `${p.redirectChainLength} hops`, onClick: () => drill.toPage(p),
        }))} />
      </Card>

      <Card title="Deepest pages">
        <TopList items={deepest.map((p: any) => ({
          id: p.url, primary: p.title || p.url, secondary: p.url,
          tail: `D${p.crawlDepth}`, onClick: () => drill.toPage(p),
        }))} />
      </Card>

      {hreflangErrors > 0 && (
        <Card title="Hreflang errors">
          <div className="text-[11px] text-[var(--brand-text-mid)]">{fmtNum(hreflangErrors)} pages with hreflang issues</div>
        </Card>
      )}

      {hasTrend && s.crawlStats.avgDepthPrev !== undefined && !Number.isNaN(s.crawlStats.avgDepthPrev) ? (
        <Card title="vs last crawl">
          <ComparisonRow
            label="Avg depth"
            a={{ v: s.crawlStats.avgDepth, tag: 'now' }}
            b={{ v: s.crawlStats.avgDepthPrev, tag: 'prev' }}
            format={(v: number) => v.toFixed(1)}
          />
        </Card>
      ) : null}
    </div>
  )
}
