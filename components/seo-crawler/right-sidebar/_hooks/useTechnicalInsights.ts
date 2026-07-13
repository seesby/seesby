import { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { computeTechSummary } from '../technical/selectors'
import { safePct } from '../_shared/format'

export function useTechnicalInsights() {
  const crawler = useSeoCrawler()
  const { pages, crawlHistory } = crawler
  const compareSession = (crawler as any).compareSession
  const prevPages = compareSession?.pages || []

  return useMemo(() => {
    const num = (v: any) => { const n = Number(v); return isFinite(n) ? n : 0 }
    const safe = pages || []
    const total = safe.length
    const html = safe.filter((p: any) => p.isHtmlPage || String(p.contentType || '').includes('html')).length

    const summary = computeTechSummary(safe)

    const prevSummary = prevPages.length ? computeTechSummary(prevPages) : null

    const tech = {
      httpsCoverage: safePct(summary.security.httpsPages, total),
      indexable: safePct(summary.indexability.indexable, html),
      cwvPass: safePct(summary.cwv.lcpGood, html),
      cwvPassPrev: prevSummary ? safePct(prevSummary.cwv.lcpGood, prevSummary.html) : NaN,
    }

    const crawl = {
      avgDepth: (() => {
        const depths = safe.map(p => num(p.crawlDepth)).filter(d => isFinite(d) && d >= 0)
        return depths.length ? depths.reduce((a, b) => a + b, 0) / depths.length : 0
      })(),
      avgDepthPrev: prevPages.length ? (() => {
        const depths = prevPages.map((p: any) => num(p.crawlDepth)).filter(d => isFinite(d) && d >= 0)
        return depths.length ? depths.reduce((a: number, b: number) => a + b, 0) / depths.length : 0
      })() : NaN,
    }

    const score = summary.scores.overall
    const scorePrev = prevSummary ? prevSummary.scores.overall : NaN

    return {
      total, totalPrev: prevPages.length, html,
      score, scorePrev,
      status: summary.status,
      indexability: {
        ...summary.indexability,
        byTemplate: [] as any[],
      },
      crawl: summary.crawl,
      render: summary.render,
      cwv: summary.cwv,
      cwvAvg: summary.cwvAvg,
      blocking: summary.blocking,
      security: summary.security,
      a11y: {
        total: summary.a11y.altMissing + summary.a11y.formsNoLabel + summary.a11y.genericLinks + summary.a11y.invalidAria + summary.a11y.tablesNoHeader + summary.a11y.skipLinkMissing + summary.a11y.mainLandmarkMissing + summary.a11y.smallTap + summary.a11y.smallFonts + summary.a11y.zoomDisabled,
        ...summary.a11y,
      },
      tech,
      crawlStats: crawl,
      history: {
        scoreSeries: (crawlHistory || []).slice(-5).map((h: any) => num(h.qualityScore) || 0),
      },
      bench: { lcpP75: 0 },
      scores: summary.scores,
    }
  }, [pages, prevPages, crawlHistory])
}
