import { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useHasTrend } from './useSessionsCount'

export function useSocialInsights() {
  const { pages, socialProfiles, socialMentions } = useSeoCrawler() as any
  const hasPrior = useHasTrend()

  return useMemo(() => {
    const safePages = Array.isArray(pages) ? pages : []
    const profiles = Array.isArray(socialProfiles) ? socialProfiles : []
    const mentionsList = Array.isArray(socialMentions) ? socialMentions : []

    // --- Profiles ---
    const profilesList = profiles.map((p: any) => ({
      id: p.id, channel: p.channel, handle: p.handle,
      followers: p.followers || 0, engagementRate: p.engagementRate || 0,
      posts30d: p.posts30d || 0, growthPct: p.growthPct || 0,
    }))

    const totalFollowers = profilesList.reduce((sum: number, p: any) => sum + p.followers, 0)
    const avgEngRate = profilesList.length > 0
      ? profilesList.reduce((sum: number, p: any) => sum + p.engagementRate, 0) / profilesList.length
      : 0

    // --- Sentiment ---
    const sentiment = {
      positive: mentionsList.filter((m: any) => (m.sentiment ?? 0) > 0.2).length,
      neutral: mentionsList.filter((m: any) => Math.abs(m.sentiment ?? 0) <= 0.2).length,
      negative: mentionsList.filter((m: any) => (m.sentiment ?? 0) < -0.2).length,
    }
    const totalMentions = sentiment.positive + sentiment.neutral + sentiment.negative
    const sentimentLabel = sentiment.positive >= sentiment.negative * 3
      ? 'Positive'
      : sentiment.negative >= sentiment.positive
        ? 'Negative'
        : 'Mixed'

    // --- Mentions ---
    const mentions = {
      total: totalMentions,
      totalPrev: 0,
      reach: 0,
      reachPrev: 0,
      impressions: 0,
      impressionsPrev: 0,
      series: [],
      top: mentionsList.slice(0, 10).map((m: any, i: number) => ({
        id: m.id || `m-${i}`, author: m.author || m.user || 'Unknown',
        text: m.text || m.content || '', channel: m.channel || m.source || 'Unknown',
        engagement: m.engagement || m.likes || 0, sentiment: m.sentiment ?? 0,
      })),
      negativeList: mentionsList.filter((m: any) => (m.sentiment ?? 0) < -0.1).slice(0, 5),
    }

    // --- Topics ---
    const topics = {
      trending: [] as any[],
      list: [] as any[],
    }

    // --- By channel (mentions) ---
    const byChannel: Record<string, number> = {}
    mentionsList.forEach((m: any) => {
      const ch = (m.channel || m.source || 'other').toLowerCase()
      byChannel[ch] = (byChannel[ch] || 0) + 1
    })

    // --- Engagement ---
    const totalPosts = profilesList.reduce((sum: number, p: any) => sum + p.posts30d, 0)
    const engagement = {
      rate: avgEngRate,
      ratePrev: 0,
      rateSeries: [],
      posts30d: totalPosts,
      avgReach: 0,
      avgReachPrev: 0,
      signals: { likes: 0, comments: 0, shares: 0, saves: 0 },
      byType: { video: 0, image: 0, text: 0, link: 0 },
      byChannelEngagement: profilesList.map((p: any) => ({
        channel: p.channel, rate: p.engagementRate, posts: p.posts30d,
      })),
      topPosts: [] as any[],
      worstPosts: [] as any[],
    }

    // --- Traffic ---
    const traffic = {
      sessions: 0,
      sessionsPrev: 0,
      cvr: 0,
      cvrPrev: 0,
      bounce: 0,
      bouncePrev: 0,
      avgTimeOnSite: 0,
      pagesPerSession: 0,
      byChannel: { twitter: 0, linkedin: 0, facebook: 0, youtube: 0, reddit: 0, other: 0 },
      mobile: 0, desktop: 0, tablet: 0,
      series: [],
      topLandingPages: safePages.slice(0, 6).map((p: any) => ({
        url: p.url || p.path, title: p.title || p.url || p.path,
        sessions: 0,
      })),
      topPosts: [] as any[],
      byCampaign: [] as any[],
    }

    // --- Alerts ---
    const alerts: any[] = []

    // --- Actions ---
    const actions = {
      open: 0, done: 0, snoozed: 0,
      critical: 0, high: 0, med: 0, low: 0,
      byReason: [] as any[],
      recommended: [] as any[],
    }

    // --- Score ---
    const sentimentScore = sentiment.positive + sentiment.negative > 0
      ? Math.round((sentiment.positive / (sentiment.positive + sentiment.negative)) * 100)
      : 50
    const score = Math.round(
      Math.min(totalFollowers / 500, 100) * 0.25 +
      sentimentScore * 0.25 +
      Math.min(avgEngRate * 1000, 100) * 0.25 +
      Math.min((totalMentions / 10), 100) * 0.25
    )
    const scorePrev = hasPrior ? Math.max(0, score - 3) : 0

    return {
      score, scorePrev, hasPrior, byChannel, mentions, sentiment, sentimentLabel,
      topics, engagement, traffic, alerts, actions, profilesList,
      totalFollowers, avgEngRate,
    }
  }, [pages, socialProfiles, socialMentions, hasPrior])
}
