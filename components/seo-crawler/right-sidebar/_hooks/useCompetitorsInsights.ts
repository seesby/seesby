import { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useHasTrend } from './useSessionsCount'
import { safePct } from '../_shared/format'

export function useCompetitorsInsights() {
  const { competitors, pages } = useSeoCrawler() as any
  const hasPrior = useHasTrend()

  return useMemo(() => {
    const list = Array.isArray(competitors) ? competitors : []

    // ── Score & visibility ──
    const youEntry = list.find((c: any) => c.isYou)
    const visibilityShare = youEntry?.shareOfVoice || 0
    const visibilitySharePrev = youEntry?.shareOfVoicePrev || 0
    const visibilitySeries: number[] = []
    const sorted = [...list].sort((a: any, b: any) => (b.shareOfVoice || 0) - (a.shareOfVoice || 0))
    const rank = youEntry ? sorted.findIndex((c: any) => c.isYou) + 1 : 0
    const rankPrev = 0
    const leaderVisibility = sorted.length ? sorted[0].shareOfVoice || 0 : 0
    const score = Math.round(visibilityShare * 100)

    // ── Per-competitor breakdown ──
    const byCompetitor = list.map((c: any, i: number) => ({
      id: c.id || `c${i}`,
      domain: c.domain,
      visibility: c.shareOfVoice || 0,
      isYou: c.isYou || false,
      refDomains: c.refDomains || 0,
      top10: c.top10 || 0,
      gapKeywords: c.gapKeywords || 0,
      gapContent: c.gapContent || 0,
      gapLinks: c.gapLinks || 0,
      traffic: c.traffic || 0,
      keywords: c.keywords || 0,
    }))

    // ── Movement ──
    const movers = { climbing: 0, steady: list.length, falling: 0, new: 0 }

    // ── Shared gaps ──
    const gaps = {
      total: 0, keywords: 0, content: 0, links: 0,
      byKd: { easy: 0, medium: 0, hard: 0 },
      estimatedTraffic: 0,
      topKeywords: [] as any[],
      topTopics: [] as any[],
      quickWins: [] as any[],
      priorityMatrix: { easyHighTraffic: 0, easyLowTraffic: 0, hardHighTraffic: 0, hardLowTraffic: 0 },
    }

    // ── Wins ──
    const wins = {
      total: 0, trafficGained: 0, rate: 0, velocity: 0,
      byType: { position: 0, feature: 0, snippet: 0, image: 0 },
      recent: [] as any[],
      byTopic: [] as any[],
      defendThese: [] as any[],
      series: [] as number[],
      byCompetitor: [] as any[],
    }

    // ── Losses ──
    const losses = {
      total: 0, totalPrev: 0, trafficLost: 0, trafficLostPrev: 0,
      byType: { position: 0, feature: 0, snippet: 0, dropped: 0 },
      recoverable: 0,
      severity: { high: 0, medium: 0, low: 0 },
      recent: [] as any[],
      recommendations: [] as any[],
      series: [] as number[],
      byCompetitor: [] as any[],
    }

    // ── Backlinks ──
    const backlinks = {
      you: { refDomains: youEntry?.refDomains || 0 },
      avgCompetitor: { refDomains: 0 },
      leader: { refDomains: sorted.length ? sorted[0].refDomains || 0 : 0 },
      velocity: 0,
      quality: { high: 0, medium: 0, low: 0 },
      byCompetitor,
      gapTotal: 0,
      gapList: [] as any[],
      highValueTargets: [] as any[],
      youOnly: [] as any[],
      youSeries: [] as number[],
    }

    // ── Benchmarks ──
    const bench = { winRate: 0 }

    // ── Inline actions (not a separate tab) ──
    const actions = {
      critical: 0,
      high: 0,
      items: [] as any[],
    }

    return {
      score, hasPrior,
      visibilityShare, visibilitySharePrev, visibilitySeries,
      rank, rankPrev, leaderVisibility,
      byCompetitor, movers,
      gaps, wins, losses, backlinks, bench, actions,
    }
  }, [competitors, pages, hasPrior])
}
