import { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { safePct } from '../_shared/format'

export function useContentInsights() {
  const crawler = useSeoCrawler()
  const { pages } = crawler
  const compareSession = (crawler as any).compareSession
  const prevPages = compareSession?.pages || []
  const sessions: any[] = crawler?.sessions ?? crawler?.crawlHistory ?? []

  return useMemo(() => {
    const safe = pages || []
    const html = safe.filter((p: any) => p.isHtmlPage !== false)
    const total = html.length
    const num = (v: any) => { const n = Number(v); return isFinite(n) ? n : 0 }

    // ── Score ──
    const scores = html.map((p: any) => num(p.qualityScore) || num(p.contentQualityScore) || 50)
    const avgQuality = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0

    const prevScores = prevPages
      .filter((p: any) => p.isHtmlPage !== false)
      .map((p: any) => num(p.qualityScore) || num(p.contentQualityScore) || 50)
    const avgQualityPrev = prevScores.length ? Math.round(prevScores.reduce((a: number, b: number) => a + b, 0) / prevScores.length) : 0

    const sortedScores = [...scores].sort((a, b) => a - b)
    const p50 = sortedScores.length > 0 ? sortedScores[Math.floor(sortedScores.length * 0.5)] : 0
    const p90 = sortedScores.length > 0 ? sortedScores[Math.floor(sortedScores.length * 0.9)] : 0

    const bands = {
      excellent: scores.filter((s: number) => s >= 90).length,
      good: scores.filter((s: number) => s >= 75 && s < 90).length,
      fair: scores.filter((s: number) => s >= 60 && s < 75).length,
      poor: scores.filter((s: number) => s >= 40 && s < 60).length,
      critical: scores.filter((s: number) => s < 40).length,
    }

    const scoreSeries = sessions.slice(-8).map((s: any) => {
      const sc = s.pages?.filter((p: any) => p.isHtmlPage !== false)
      if (!sc?.length) return 0
      return Math.round(sc.reduce((a: number, b: any) => a + (num(b.qualityScore) || num(b.contentQualityScore) || 50), 0) / sc.length)
    }).filter(Boolean)

    // ── Word count ──
    const wordCounts = html.map((p: any) => num(p.wordCount) || 0)
    const totalWords = wordCounts.reduce((a: number, b: number) => a + b, 0)
    const avgWords = total > 0 ? Math.round(totalWords / total) : 0
    const lengthMix = {
      tiny: html.filter((p: any) => num(p.wordCount) < 300).length,
      short: html.filter((p: any) => num(p.wordCount) >= 300 && num(p.wordCount) < 800).length,
      medium: html.filter((p: any) => num(p.wordCount) >= 800 && num(p.wordCount) < 2000).length,
      long: html.filter((p: any) => num(p.wordCount) >= 2000 && num(p.wordCount) < 5000).length,
      veryLong: html.filter((p: any) => num(p.wordCount) >= 5000).length,
    }
    const thin = lengthMix.tiny

    // ── Readability (Page.readability) ──
    const readabilityAvg = num(html.reduce((s: number, p: any) => s + num(p.readability), 0) / (total || 1))
    const readability = {
      hard: html.filter((p: any) => num(p.readability) < 50).length,
      medium: 0,
      easy: html.filter((p: any) => num(p.readability) >= 70).length,
    }
    readability.medium = total - readability.hard - readability.easy

    // ── E-E-A-T (uses Page type fields) ──
    const eeat = {
      bylines: html.filter((p: any) => p.hasByline).length,
      bios: html.filter((p: any) => p.hasAuthorBio).length,
      citations: html.filter((p: any) => num(p.externalCitations) > 0).length,
      updated: html.filter((p: any) => p.updatedDateVisible).length,
    }

    // ── AI detection (Page.aiLikelihood) ──
    const aiLikely = html.filter((p: any) => num(p.aiLikelihood) > 0.7).length

    // ── Missing basics ──
    const missing = {
      noH1: html.filter((p: any) => !p.h1_1 || p.h1_1.trim() === '').length,
      noMeta: html.filter((p: any) => !p.metaDesc || p.metaDesc.trim().length < 50).length,
      noSchema: html.filter((p: any) => !p.schemaTypes || p.schemaTypes.length === 0).length,
      noByline: html.filter((p: any) => !p.hasByline).length,
    }

    // ── Schema (Page.schemaTypes) ──
    const withSchema = html.filter((p: any) => p.schemaTypes && p.schemaTypes.length > 0).length
    const schema = {
      coverage: safePct(withSchema, total),
      withSchema,
      errors: 0, // schema errors not in Page type
      types: Object.entries(
        html.reduce((acc: Record<string, number>, p: any) => {
          const types: string[] = p.schemaTypes || []
          types.forEach(t => { acc[t] = (acc[t] || 0) + 1 })
          return acc
        }, {})
      )
        .sort((a, b) => (b[1] as number) - (a[1] as number))
        .slice(0, 8)
        .map(([type, count]) => ({ type, count })),
    }

    // ── Freshness (Page.freshnessDays — may be undefined, fallback to 0) ──
    const freshness = {
      live: html.filter((p: any) => num(p.freshnessDays) < 7).length,
      recent: html.filter((p: any) => num(p.freshnessDays) >= 7 && num(p.freshnessDays) < 30).length,
      fresh: html.filter((p: any) => num(p.freshnessDays) >= 30 && num(p.freshnessDays) < 90).length,
      ok: html.filter((p: any) => num(p.freshnessDays) >= 90 && num(p.freshnessDays) < 180).length,
      stale: html.filter((p: any) => num(p.freshnessDays) >= 180).length,
    }
    const staleCount = freshness.stale

    // ── Duplication (Page type fields) ──
    const dup = {
      exact: html.filter((p: any) => p.exactDuplicate).length,
      near: html.filter((p: any) => p.nearDuplicateGroup).length,
      canonMismatch: 0, // canonicalMismatch not in Page type
      titleDup: 0, // titleDuplicate not in Page type
      cannibal: html.filter((p: any) => p.cannibalizedBy).length,
    }

    // ── Topic clusters (Page.topicCluster from AI analysis) ──
    const clusterMap: Record<string, any[]> = {}
    html.forEach((p: any) => {
      const cluster = p.topicCluster
      if (cluster) {
        if (!clusterMap[cluster]) clusterMap[cluster] = []
        clusterMap[cluster].push(p)
      }
    })
    const clusters = Object.entries(clusterMap)
      .map(([label, pgs]) => ({
        id: label,
        label,
        pages: pgs.length,
        avgScore: Math.round(pgs.reduce((s: number, p: any) => s + (num(p.qualityScore) || num(p.contentQualityScore) || 50), 0) / pgs.length),
        topUrl: pgs.sort((a: any, b: any) => (num(b.gscClicks) || 0) - (num(a.gscClicks) || 0))[0]?.url,
      }))
      .sort((a, b) => b.pages - a.pages)

    const hubs = clusters.filter(c => c.pages >= 3).length
    const weakHubs = clusters.filter(c => c.avgScore < 50).length

    // ── Intent (Page.searchIntent from AI analysis) ──
    const intentMap: Record<string, number> = {}
    html.forEach((p: any) => {
      const intent = p.searchIntent || 'informational'
      intentMap[intent] = (intentMap[intent] || 0) + 1
    })
    const intentMix = Object.entries(intentMap)
      .map(([intent, count]) => ({ intent, count }))
      .sort((a, b) => b.count - a.count)

    // ── Entity coverage (Page.entities from AI analysis) ──
    const withEntity = html.filter((p: any) => p.entities && (Array.isArray(p.entities) ? p.entities.length > 0 : true)).length
    const withRelated = html.filter((p: any) => p.entities && Array.isArray(p.entities) && p.entities.length > 1).length
    const entityCoverage = { withEntity, withRelated, missing: total - withEntity }

    // ── Orphan topics ──
    const orphanTopics = html
      .filter((p: any) =>
        !p.topicCluster &&
        (Number(p.gscClicks) > 10 || Number(p.keywords?.length) > 0)
      )
      .sort((a: any, b: any) => (Number(b.gscClicks || 0)) - (Number(a.gscClicks || 0)))

    // ── Category mix (Page.category) ──
    const categoryMap: Record<string, number> = {}
    html.forEach((p: any) => {
      const cat = p.category || 'other'
      categoryMap[cat] = (categoryMap[cat] || 0) + 1
    })
    const categoryMix = Object.entries(categoryMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)

    return {
      total,
      totalWords,
      avgWords,
      avgQuality,
      avgQualityPrev,
      p50: Math.round(p50),
      p90: Math.round(p90),
      bands,
      scoreSeries,
      lengthMix,
      thin,
      readability: { ...readability, avg: readabilityAvg },
      eeat,
      aiLikely,
      missing,
      schema,
      freshness,
      staleCount,
      dup,
      clusters,
      hubs,
      weakHubs,
      intentMix,
      entityCoverage,
      orphanTopics,
      categoryMix,
    }
  }, [pages, prevPages, sessions])
}
