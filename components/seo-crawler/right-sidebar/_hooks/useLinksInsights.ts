import { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useHasTrend } from './useSessionsCount'
import { safePct } from '../_shared/format'

const num = (v: any) => { const n = Number(v); return isFinite(n) ? n : 0 }

function pct(n: number, total: number) {
  return total > 0 ? Math.round((n / total) * 100) : 0
}

export function useLinksInsights() {
  const crawler = useSeoCrawler()
  const { pages, crawlHistory } = crawler
  const compareSession = (crawler as any).compareSession
  const prevPages = compareSession?.pages || []
  const hasTrend = useHasTrend()

  return useMemo(() => {
    const safe = pages || []
    const html = safe.filter((p: any) => p.isHtmlPage !== false)
    const total = html.length
    const prev = prevPages || []

    // ── Ref domains & backlinks ──
    const refDomains = html.reduce((s: number, p: any) => s + num(p.refDomains), 0)
    const refDomainsPrev = prev.reduce((s: number, p: any) => s + num(p.refDomains), 0)
    const totalBacklinks = html.reduce((s: number, p: any) => s + num(p.backlinks), 0)
    const totalBacklinksPrev = prev.reduce((s: number, p: any) => s + num(p.backlinks), 0)

    // ── DR distribution ──
    const drValues = html.map((p: any) => num(p.domainRating)).filter((v: number) => v > 0)
    const avgDr = drValues.length ? drValues.reduce((a: number, b: number) => a + b, 0) / drValues.length : 0
    const prevDrValues = prev.map((p: any) => num(p.domainRating)).filter((v: number) => v > 0)
    const avgDrPrev = prevDrValues.length ? prevDrValues.reduce((a: number, b: number) => a + b, 0) / prevDrValues.length : 0

    // ── Link attributes (dofollow/nofollow/etc) ──
    const attrs = html.reduce((acc: Record<string, number>, p: any) => {
      const a = p.linkAttributes
      if (a && typeof a === 'object') {
        Object.entries(a).forEach(([k, v]) => { acc[k] = (acc[k] || 0) + num(v) })
      }
      return acc
    }, {})
    const dofollow = attrs.dofollow || 0
    const nofollow = attrs.nofollow || 0
    const ugc = attrs.ugc || 0
    const sponsored = attrs.sponsored || 0
    const totalAttrs = dofollow + nofollow + ugc + sponsored || 1

    // ── Internal links ──
    const inlinks = html.map((p: any) => num(p.inLinks))
    const totalInlinks = inlinks.reduce((a: number, b: number) => a + b, 0)
    const avgInlinks = total > 0 ? totalInlinks / total : 0
    const orphans = inlinks.filter((v: number) => v === 0).length
    const broken = html.filter((p: any) => num(p.statusCode) >= 400).length
    const redirected = html.filter((p: any) => num(p.redirectChainLength) > 0).length

    const inlinkBuckets = {
      bucket0: inlinks.filter((v: number) => v === 0).length,
      bucket12: inlinks.filter((v: number) => v >= 1 && v <= 2).length,
      bucket310: inlinks.filter((v: number) => v >= 3 && v <= 10).length,
      bucket1150: inlinks.filter((v: number) => v >= 11 && v <= 50).length,
      bucket50: inlinks.filter((v: number) => v > 50).length,
    }

    // ── Internal anchor types (from pages that have anchor data) ──
    const anchorTypes = html.reduce((acc: Record<string, number>, p: any) => {
      const t = p.internalAnchorType || p.anchorType
      if (t) acc[t] = (acc[t] || 0) + 1
      return acc
    }, {})
    const anchorBranded = anchorTypes.brand || anchorTypes.branded || 0
    const anchorExact = anchorTypes.exact || 0
    const anchorGeneric = anchorTypes.generic || 0
    const anchorNaked = anchorTypes.naked || anchorTypes.url || 0

    // ── Template breakdown ──
    const templateMap: Record<string, { pages: number; inlinks: number; orphans: number; outlinks: number }> = {}
    html.forEach((p: any) => {
      const t = p.template || 'other'
      if (!templateMap[t]) templateMap[t] = { pages: 0, inlinks: 0, orphans: 0, outlinks: 0 }
      templateMap[t].pages++
      templateMap[t].inlinks += num(p.inLinks)
      templateMap[t].outlinks += num(p.outlinks)
      if (num(p.inLinks) === 0) templateMap[t].orphans++
    })
    const byTemplate = Object.entries(templateMap)
      .map(([id, v]) => ({ id, label: id, ...v, avgInlinks: v.pages > 0 ? v.inlinks / v.pages : 0 }))
      .sort((a, b) => b.pages - a.pages)
      .slice(0, 6)

    // ── Ref domains trend (from crawlHistory) ──
    const sessions: any[] = (crawlHistory as any[]) || []
    const refDomainsSeries = sessions.slice(-8).map((s: any) => {
      const pgs = s.pages || []
      return pgs.reduce((sum: number, p: any) => sum + num(p.refDomains), 0)
    }).filter(Boolean)

    // ── External / referring domains ──
    const refDomainsList: Record<string, { dr: number; backlinks: number; gained30d: number; lost30d: number; tld: string }> = {}
    html.forEach((p: any) => {
      const rds = p.referringDomains || p.refDomainsList
      if (Array.isArray(rds)) {
        rds.forEach((r: any) => {
          const domain = r.domain || r
          if (typeof domain !== 'string') return
          if (!refDomainsList[domain]) {
            refDomainsList[domain] = { dr: num(r.dr || r.domainRating), backlinks: 0, gained30d: 0, lost30d: 0, tld: r.tld || domain.split('.').pop() || '' }
          }
          refDomainsList[domain].backlinks += num(r.backlinks) || 1
        })
      }
    })
    const refDomainsArr = Object.entries(refDomainsList).map(([domain, v]) => ({ domain, ...v }))
    const sortedByDr = [...refDomainsArr].sort((a, b) => b.dr - a.dr)
    const topRefDomains = sortedByDr.slice(0, 8)

    const dr80plus = refDomainsArr.filter(r => r.dr >= 80).length
    const dr5079 = refDomainsArr.filter(r => r.dr >= 50 && r.dr < 80).length
    const dr2049 = refDomainsArr.filter(r => r.dr >= 20 && r.dr < 50).length
    const dr019 = refDomainsArr.filter(r => r.dr < 20).length

    // ── TLD mix ──
    const tldMap: Record<string, number> = {}
    refDomainsArr.forEach(r => {
      const tld = r.tld || 'other'
      tldMap[tld] = (tldMap[tld] || 0) + 1
    })
    const tldMix = Object.entries(tldMap)
      .map(([tld, count]) => ({ tld, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)

    // ── Gained / lost (from page-level data) ──
    const gained30d = html.reduce((s: number, p: any) => s + num(p.refDomainsGained30d), 0)
    const lost30d = html.reduce((s: number, p: any) => s + num(p.refDomainsLost30d), 0)

    const recentlyLost = html
      .filter((p: any) => p.lostRefDomains && p.lostRefDomains.length > 0)
      .flatMap((p: any) => (p.lostRefDomains || []).map((r: any) => ({
        domain: r.domain || r,
        targetUrl: p.url,
        relTime: r.relTime || r.lostAt || '',
      })))
      .slice(0, 6)

    // ── By target page (external) ──
    const externalByPage = html
      .filter((p: any) => num(p.refDomains) > 0)
      .map((p: any) => ({
        url: p.url,
        title: p.title || p.url,
        refDomains: num(p.refDomains),
        gained30d: num(p.refDomainsGained30d),
        lost30d: num(p.refDomainsLost30d),
      }))
      .sort((a, b) => b.refDomains - a.refDomains)
      .slice(0, 6)

    // ── Anchors ──
    const anchorMap: Record<string, { count: number; type: string; pages: Set<string> }> = {}
    html.forEach((p: any) => {
      const anchors = p.anchorTexts || p.anchors || []
      if (Array.isArray(anchors)) {
        anchors.forEach((a: any) => {
          const text = typeof a === 'string' ? a : a.text || ''
          if (!text) return
          if (!anchorMap[text]) anchorMap[text] = { count: 0, type: 'generic', pages: new Set() }
          anchorMap[text].count += num(a.count) || 1
          anchorMap[text].pages.add(p.url)
        })
      }
    })
    const anchorArr = Object.entries(anchorMap).map(([text, v]) => ({
      text,
      count: v.count,
      type: v.type,
      pages: v.pages.size,
    }))
    const topAnchors = [...anchorArr].sort((a, b) => b.count - a.count).slice(0, 10)

    const uniqueAnchors = anchorArr.length
    const exactRisk = anchorArr.filter(a => a.type === 'exact' && a.count > 5).slice(0, 6)
    const emptyAnchors = num(html.reduce((s: number, p: any) => s + num(p.emptyAnchors), 0))

    // ── Anchor type mix ──
    const anchorTypeTotal = anchorBranded + anchorExact + anchorGeneric + anchorNaked + 1
    const anchorMix = {
      branded: pct(anchorBranded, anchorTypeTotal),
      exact: pct(anchorExact, anchorTypeTotal),
      partial: pct(num(anchorTypes.partial), anchorTypeTotal),
      generic: pct(anchorGeneric, anchorTypeTotal),
      naked: pct(anchorNaked, anchorTypeTotal),
      image: pct(num(anchorTypes.image), anchorTypeTotal),
    }

    // ── Anchor length distribution ──
    const anchorLens = anchorArr.map(a => a.text.split(/\s+/).length)
    const anchorLengths = {
      len1: anchorLens.filter(l => l === 1).length,
      len23: anchorLens.filter(l => l >= 2 && l <= 3).length,
      len46: anchorLens.filter(l => l >= 4 && l <= 6).length,
      len7: anchorLens.filter(l => l >= 7).length,
    }

    // ── Toxic links ──
    const toxicLinks = html
      .filter((p: any) => num(p.toxicityScore) > 60 || p.isToxic)
      .map((p: any) => ({
        url: p.url,
        title: p.title || p.url,
        domain: p.url,
        spamScore: num(p.toxicityScore) || num(p.spamScore),
        backlinks: num(p.refDomains) || 1,
        risk: num(p.toxicityScore) > 80 ? 'high' : num(p.toxicityScore) > 60 ? 'medium' : 'low',
      }))
      .sort((a, b) => b.spamScore - a.spamScore)

    const toxicCount = toxicLinks.length
    const toxicBands = {
      high: toxicLinks.filter(t => t.risk === 'high').length,
      medium: toxicLinks.filter(t => t.risk === 'medium').length,
      low: toxicLinks.filter(t => t.risk === 'low').length,
    }

    const toxicReasons = {
      tld: html.filter((p: any) => p.toxicReason === 'spammy_tld').length,
      pbn: html.filter((p: any) => p.toxicReason === 'pbn').length,
      lang: html.filter((p: any) => p.toxicReason === 'lang_mismatch').length,
      sitewide: html.filter((p: any) => p.toxicReason === 'sitewide').length,
    }

    const disavowed = html.filter((p: any) => p.disavowed).length

    // ── Toxic by target page ──
    const toxicByPage = html
      .filter((p: any) => num(p.toxicityScore) > 0)
      .map((p: any) => ({
        url: p.url,
        title: p.title || p.url,
        toxicCount: num(p.toxicRefDomains) || (num(p.toxicityScore) > 60 ? 1 : 0),
        risk: num(p.toxicityScore) > 80 ? 'high' : num(p.toxicityScore) > 60 ? 'medium' : 'low',
      }))
      .sort((a, b) => b.toxicCount - a.toxicCount)
      .slice(0, 6)

    // ── Score (composite) ──
    const internalHealth = total > 0 ? Math.round(((total - orphans - broken) / total) * 100) : 0
    const externalHealth = refDomainsArr.length > 0 ? Math.min(100, Math.round(avgDr + (refDomainsArr.length / 10))) : 0
    const toxicHealth = toxicCount === 0 ? 100 : Math.max(0, 100 - toxicCount * 2)
    const score = Math.round((internalHealth * 0.35 + externalHealth * 0.45 + toxicHealth * 0.2))

    // ── Hub pages (high inlink concentration) ──
    const hubPages = [...html]
      .filter((p: any) => num(p.inLinks) > 50)
      .sort((a, b) => num(b.inLinks) - num(a.inLinks))
      .slice(0, 5)

    // ── Total anchors & diversity ──
    let totalAnchors = 0
    html.forEach((p: any) => {
      const anchors = p.anchorTexts || p.anchors || []
      if (Array.isArray(anchors)) totalAnchors += anchors.length
    })
    const anchorDiversity = totalAnchors > 0 ? uniqueAnchors / totalAnchors : 0

    // ── Benchmark ──
    const bench = { refDomains: Math.round(refDomains * 1.1) }

    // ── Top linked pages ──
    const topLinked = [...html]
      .sort((a, b) => num(b.refDomains) - num(a.refDomains))
      .slice(0, 6)

    // ── Orphan pages ──
    const orphanPages = html
      .filter((p: any) => num(p.inLinks) === 0)
      .sort((a, b) => (num(b.gscClicks) || 0) - (num(a.gscClicks) || 0))
      .slice(0, 6)

    // ── Most linked pages ──
    const mostLinked = [...html]
      .sort((a, b) => num(b.inLinks) - num(a.inLinks))
      .slice(0, 6)

    // ── Anchor by target page ──
    const anchorByPage = html
      .filter((p: any) => {
        const anchors = p.anchorTexts || p.anchors || []
        return Array.isArray(anchors) && anchors.length > 0
      })
      .map((p: any) => ({
        url: p.url,
        title: p.title || p.url,
        branded: num(p.brandedAnchors) || 0,
        exact: num(p.exactAnchors) || 0,
        generic: num(p.genericAnchors) || 0,
      }))
      .sort((a, b) => (b.branded + b.exact) - (a.branded + a.exact))
      .slice(0, 6)

    // ── Previous anchor shares ──
    const prevAnchorTypes: Record<string, number> = prev.reduce((acc: Record<string, number>, p: any) => {
      const t = p.internalAnchorType || p.anchorType
      if (t) acc[t] = (acc[t] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    const prevAnchorTotal: number = Object.values(prevAnchorTypes).reduce((a, b) => a + b, 0) || 1
    const brandedSharePrev = ((prevAnchorTypes.brand || 0) + (prevAnchorTypes.branded || 0)) / prevAnchorTotal
    const exactSharePrev = (prevAnchorTypes.exact || 0) / prevAnchorTotal

    // ── Score series from crawl history ──
    const scoreSeries = sessions.slice(-8).map((session: any) => {
      const pgs = session.pages || []
      const sTotal = pgs.filter((p: any) => p.isHtmlPage !== false).length
      if (sTotal === 0) return 0
      const sOrphans = pgs.filter((p: any) => num(p.inLinks) === 0).length
      const sBroken = pgs.filter((p: any) => num(p.statusCode) >= 400).length
      const sRefDomains = pgs.reduce((s: number, p: any) => s + num(p.refDomains), 0)
      const sDrVals = pgs.map((p: any) => num(p.domainRating)).filter((v: number) => v > 0)
      const sAvgDr = sDrVals.length ? sDrVals.reduce((a: number, b: number) => a + b, 0) / sDrVals.length : 0
      const sToxic = pgs.filter((p: any) => num(p.toxicityScore) > 60).length
      const iH = Math.round(((sTotal - sOrphans - sBroken) / sTotal) * 100)
      const eH = Math.min(100, Math.round(sAvgDr + (sRefDomains / 10)))
      const tH = sToxic === 0 ? 100 : Math.max(0, 100 - sToxic * 2)
      return Math.round(iH * 0.35 + eH * 0.45 + tH * 0.2)
    }).filter(Boolean)

    return {
      hasTrend,
      score,
      internalHealth,
      externalHealth,
      toxicHealth,
      scoreSeries,
      total,
      refDomains,
      refDomainsPrev,
      refDomainsSeries,
      totalBacklinks,
      totalBacklinksPrev,
      avgDr,
      avgDrPrev,
      dofollow, nofollow, ugc, sponsored, totalAttrs,
      internal: {
        total: totalInlinks,
        avgPerPage: avgInlinks,
        orphans,
        broken,
        redirected,
        ...inlinkBuckets,
        anchorBranded, anchorExact, anchorGeneric, anchorNaked,
        byTemplate,
        hubPages,
      },
      external: {
        refDomains: refDomainsArr.length,
        refDomainsPrev: prev.reduce((s: number, p: any) => {
          const rds = p.referringDomains || p.refDomainsList
          return s + (Array.isArray(rds) ? rds.length : 0)
        }, 0),
        gained30d,
        lost30d,
        dr80plus, dr5079, dr2049, dr019,
        tldMix,
        topRefDomains,
        recentlyLost,
        byPage: externalByPage,
      },
      anchors: {
        ...anchorMix,
        ...anchorLengths,
        top: topAnchors,
        exactRisk,
        byPage: anchorByPage,
        empty: emptyAnchors,
        brandedShare: anchorBranded / anchorTypeTotal,
        brandedSharePrev,
        exactShare: anchorExact / anchorTypeTotal,
        exactSharePrev,
        diversity: anchorDiversity,
        total: totalAnchors,
      },
      toxicCount,
      toxicScore: toxicCount > 0 ? Math.round(toxicLinks.reduce((s, t) => s + t.spamScore, 0) / toxicCount) : 0,
      toxicLinks,
      toxicBands,
      toxicReasons,
      disavowed,
      toxicPages: { byPage: toxicByPage },
      uniqueAnchors,
      topLinked,
      orphanPages,
      mostLinked,
      bench,
    }
  }, [pages, prevPages, crawlHistory, hasTrend])
}
