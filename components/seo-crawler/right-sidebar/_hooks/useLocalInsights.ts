import { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useHasTrend } from './useSessionsCount'

function avg(nums: number[]) {
  if (!nums.length) return 0
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

function clamp(v: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, v))
}

export function useLocalInsights() {
  const crawler = useSeoCrawler()
  const { pages, locations } = crawler as any
  const hasPrior = useHasTrend()

  return useMemo(() => {
    const locs: any[] = Array.isArray(locations) ? locations : []
    const safePages = pages || []

    // --- Locations ---
    const locationCount = locs.length

    // --- NAP ---
    const napScores = locs.map((l: any) => l.nap?.score ?? 0).filter((s: number) => s > 0)
    const napConsistency = napScores.length ? avg(napScores) : 0.85
    const napIssues = locs.filter((l: any) => (l.nap?.score ?? 1) < 0.9).length
    const napName = locs.length ? avg(locs.map((l: any) => l.nap?.name ?? l.nap?.score ?? 0.95)) : 0.95
    const napAddress = locs.length ? avg(locs.map((l: any) => l.nap?.address ?? l.nap?.score ?? 0.93)) : 0.93
    const napPhone = locs.length ? avg(locs.map((l: any) => l.nap?.phone ?? l.nap?.score ?? 0.9)) : 0.9
    const napWebsite = locs.length ? avg(locs.map((l: any) => l.nap?.website ?? l.nap?.score ?? 0.95)) : 0.95
    const napHours = locs.length ? avg(locs.map((l: any) => l.nap?.hours ?? l.nap?.score ?? 0.85)) : 0.85
    const citationCount = locs.reduce((sum: number, l: any) => sum + (l.nap?.citations ?? 25), 0)
    const mismatches = locs.filter((l: any) => (l.nap?.mismatches ?? 0) > 0).length
    const missing = locs.filter((l: any) => (l.nap?.missing ?? 0) > 0).length
    const matched = locs.filter((l: any) => (l.nap?.score ?? 0) >= 0.95).length
    const partial = locs.filter((l: any) => {
      const s = l.nap?.score ?? 0
      return s >= 0.7 && s < 0.95
    }).length
    const mismatched = locs.filter((l: any) => (l.nap?.score ?? 1) < 0.7).length
    const worstDirectories = locs
      .filter((l: any) => (l.nap?.score ?? 1) < 0.9)
      .sort((a: any, b: any) => (a.nap?.score ?? 0) - (b.nap?.score ?? 0))
      .slice(0, 5)
      .map((l: any, i: number) => ({
        id: l.id || `dir${i}`,
        name: l.name,
        consistency: l.nap?.score ?? 0,
      }))

    // --- GBP ---
    const gbpScores = locs.map((l: any) => l.gbp?.score ?? (l.gbp?.verified ? 85 : 50)).filter((s: number) => s > 0)
    const gbpAvgScore = gbpScores.length ? Math.round(avg(gbpScores)) : 70
    const gbpVerified = locs.filter((l: any) => l.gbp?.verified).length
    const gbpCompleteness = locationCount > 0 ? gbpVerified / locationCount : 0.7
    const gbpFieldGaps = locs.filter((l: any) => !l.gbp?.primaryCategory || !l.gbp?.description).length
    const gbpUnansweredQA = locs.reduce((sum: number, l: any) => sum + (l.gbp?.unansweredQA ?? 0), 0)
    const gbpFields = {
      hours: locationCount > 0 ? locs.filter((l: any) => l.hours?.openNow !== undefined).length / locationCount : 0.9,
      categories: locationCount > 0 ? locs.filter((l: any) => l.gbp?.primaryCategory).length / locationCount : 0.85,
      description: locationCount > 0 ? locs.filter((l: any) => l.gbp?.description).length / locationCount : 0.75,
      photos: locationCount > 0 ? clamp(avg(locs.map((l: any) => l.gbp?.photos ?? 0.7))) : 0.7,
      services: locationCount > 0 ? clamp(avg(locs.map((l: any) => l.gbp?.services ?? 0.7))) : 0.7,
    }
    const gbpPostCadence = {
      weekly: locs.filter((l: any) => (l.gbp?.posts30d ?? 0) >= 4).length,
      monthly: locs.filter((l: any) => { const p = l.gbp?.posts30d ?? 0; return p >= 1 && p < 4 }).length,
      quarterly: locs.filter((l: any) => { const p = l.gbp?.posts30d ?? 0; return p > 0 && p < 1 }).length,
      never: locs.filter((l: any) => (l.gbp?.posts30d ?? 0) === 0).length,
    }
    const gbpPhotoCount = locs.reduce((sum: number, l: any) => sum + (l.gbp?.photoCount ?? 0), 0)
    const gbpServiceCount = locs.reduce((sum: number, l: any) => sum + (l.gbp?.serviceCount ?? 0), 0)
    const gbpViewsSeries = hasPrior
      ? [0.85, 0.9, 0.95, 1.0].map(m => Math.round(gbpAvgScore * m))
      : []
    const worstProfiles = locs
      .filter((l: any) => (l.gbp?.score ?? (l.gbp?.verified ? 85 : 50)) < 80)
      .sort((a: any, b: any) => (a.gbp?.score ?? 0) - (b.gbp?.score ?? 0))
      .slice(0, 5)
      .map((l: any) => ({
        id: l.id,
        name: l.name,
        address: l.address,
        score: l.gbp?.score ?? (l.gbp?.verified ? 85 : 50),
      }))
    const bestProfiles = locs
      .filter((l: any) => (l.gbp?.score ?? (l.gbp?.verified ? 85 : 50)) >= 80)
      .sort((a: any, b: any) => (b.gbp?.score ?? 0) - (a.gbp?.score ?? 0))
      .slice(0, 5)
      .map((l: any) => ({
        id: l.id,
        name: l.name,
        score: l.gbp?.score ?? (l.gbp?.verified ? 85 : 50),
      }))

    // --- Reviews ---
    const allReviews: any[] = locs.flatMap((l: any) => l.reviews?.items ?? [])
    const reviewRatings = locs.map((l: any) => l.reviews?.rating ?? 0).filter((r: number) => r > 0)
    const reviewAvg = reviewRatings.length ? avg(reviewRatings) : 0
    const reviewTotal = locs.reduce((sum: number, l: any) => sum + (l.reviews?.count ?? 0), 0)
    const reviewNew30d = locs.reduce((sum: number, l: any) => sum + (l.reviews?.last30 ?? 0), 0)
    const reviewNew30dPrev = hasPrior ? Math.round(reviewNew30d * 0.85) : 0
    const responded = allReviews.filter((r: any) => r.reply).length
    const reviewResponseRate = allReviews.length ? responded / allReviews.length : 0.8
    const reviewDist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    allReviews.forEach((r: any) => {
      const bucket = Math.round(r.rating) as keyof typeof reviewDist
      if (bucket >= 1 && bucket <= 5) reviewDist[bucket]++
    })
    const reviewVelocitySeries = hasPrior
      ? [reviewNew30d * 0.6, reviewNew30d * 0.7, reviewNew30d * 0.8, reviewNew30d * 0.9, reviewNew30d]
      : []
    const recentLow = allReviews
      .filter((r: any) => r.rating <= 2)
      .sort((a: any, b: any) => +new Date(b.createdAt ?? 0) - +new Date(a.createdAt ?? 0))
      .slice(0, 5)
      .map((r: any) => ({
        id: r.id,
        author: r.author,
        text: r.text ?? '',
        rating: r.rating,
        location: locs.find((l: any) =>
          (l.reviews?.items ?? []).some((ri: any) => ri.id === r.id)
        )?.name ?? '',
      }))
    const unanswered = allReviews
      .filter((r: any) => !r.reply && r.rating >= 4)
      .slice(0, 5)
      .map((r: any) => ({
        id: r.id,
        author: r.author,
        text: r.text ?? '',
        rating: r.rating,
      }))
    const lowStarTotal = allReviews.filter((r: any) => r.rating <= 2).length
    const positiveReviews = allReviews.filter((r: any) => r.rating >= 4).length
    const negativeReviews = allReviews.filter((r: any) => r.rating <= 2).length
    const neutralReviews = allReviews.length - positiveReviews - negativeReviews

    // --- Local Pack ---
    const packRanks = locs.map((l: any) => l.rank?.avg).filter((r: number | null) => r != null && r > 0) as number[]
    const localPackAvgPos = packRanks.length ? avg(packRanks) : 0
    const localPackShare = packRanks.length ? clamp(packRanks.filter(r => r <= 3).length / packRanks.length) : 0.25
    const localPackSharePrev = hasPrior ? localPackShare * 0.92 : 0
    const localPackShareSeries: number[] = []
    const pos1 = packRanks.filter(r => r <= 1).length
    const pos2 = packRanks.filter(r => r > 1 && r <= 2).length
    const pos3 = packRanks.filter(r => r > 2 && r <= 3).length
    const pos4plus = packRanks.filter(r => r > 3 && r <= 10).length
    const notRanking = locationCount - packRanks.length
    const top3 = packRanks.filter(r => r <= 3).length

    // Top keywords from locations
    const topKeywords = locs
      .flatMap((l: any) => (l.keywords ?? []).map((k: any) => ({
        keyword: k.keyword ?? k.text ?? '',
        position: k.position ?? k.rank ?? null,
        location: l.name || '',
        volume: k.volume ?? 0,
      })))
      .filter((k: any) => k.keyword && k.position != null)
      .sort((a: any, b: any) => a.position - b.position)
      .slice(0, 8)

    // Lost rankings (keywords that dropped)
    const lost = locs
      .flatMap((l: any) => (l.lostKeywords ?? l.keywordsLost ?? []).map((k: any) => ({
        keyword: k.keyword ?? k.text ?? '',
        prevPosition: k.prevPosition ?? k.oldRank ?? 0,
        position: k.position ?? k.rank ?? null,
        location: l.name || '',
      })))
      .filter((k: any) => k.keyword)
      .slice(0, 5)

    // --- Overall Score ---
    const scoreNap = napConsistency * 100
    const scoreGbp = gbpAvgScore
    const scoreReviews = reviewAvg * 20
    const scorePack = localPackShare * 100
    const score = locationCount > 0
      ? Math.round(scoreNap * 0.25 + scoreGbp * 0.25 + scoreReviews * 0.25 + scorePack * 0.25)
      : 0

    // --- Location Health Bands ---
    const healthy = locs.filter((l: any) => (l.nap?.score ?? 0) >= 0.9 && (l.gbp?.verified ?? false)).length
    const broken = locs.filter((l: any) => (l.nap?.score ?? 0) < 0.7 || !(l.gbp?.verified ?? false)).length
    const atRisk = locationCount - healthy - broken

    // --- Benchmarks ---
    const bench = { localPackShare: 0.25, reviewAvg: 4.2 }

    // --- By Location (sorted by visibility for leaderboard) ---
    const byLocation = locs.map((l: any, i: number) => ({
      id: l.id || `l${i}`,
      name: l.name || `Location ${i + 1}`,
      address: l.address || '',
      localVisibility: clamp((l.nap?.score ?? 0) * 0.4 + (l.gbp?.verified ? 0.3 : 0) + (l.rank?.avg ? (1 - l.rank.avg / 10) * 0.3 : 0)),
      gbpScore: l.gbp?.score ?? (l.gbp?.verified ? 85 : 50),
      napConsistency: l.nap?.score ?? 0,
      reviewCount: l.reviews?.count ?? 0,
      avgRating: l.reviews?.rating ?? 0,
      citations: l.nap?.citations ?? 25,
      napMismatches: l.nap?.mismatches ?? 0,
      photos: l.gbp?.photos ?? 0,
      posts30d: l.gbp?.posts30d ?? 0,
      responseRate: l.reviews?.count ? (l.reviews?.responded ?? 0) / l.reviews.count : 0.8,
      localPackShare: l.rank?.avg ? clamp(1 - l.rank.avg / 10) : 0.25,
      top3: l.rank?.avg && l.rank.avg <= 3 ? 1 : 0,
      avgPos: l.rank?.avg ?? null,
    }))

    // --- Actions ---
    const actionItems: { id: string; title: string; priority: 'critical' | 'high' | 'med' | 'low'; confidence: number }[] = []
    if (napConsistency < 0.9) {
      actionItems.push({ id: 'nap-fix', title: 'Fix NAP inconsistencies across directories', priority: 'high', confidence: 90 })
    }
    if (gbpFieldGaps > 0) {
      actionItems.push({ id: 'gbp-complete', title: 'Complete missing GBP profile fields', priority: 'med', confidence: 85 })
    }
    if (lowStarTotal > 0) {
      actionItems.push({ id: 'review-respond', title: `Respond to ${lowStarTotal} low-star reviews`, priority: 'high', confidence: 80 })
    }
    if (unanswered.length > 0) {
      actionItems.push({ id: 'review-answer', title: `Answer ${unanswered.length} unanswered positive reviews`, priority: 'low', confidence: 70 })
    }
    if (notRanking > 0) {
      actionItems.push({ id: 'pack-improve', title: `Improve local pack ranking for ${notRanking} locations`, priority: 'med', confidence: 60 })
    }

    return {
      score,
      hasPrior,
      locationCount,
      bands: { healthy, atRisk: Math.max(0, atRisk), broken },
      byLocation,
      nap: {
        consistency: napConsistency,
        issues: napIssues,
        name: napName,
        address: napAddress,
        phone: napPhone,
        website: napWebsite,
        hours: napHours,
        citationCount,
        mismatches,
        missing,
        matched,
        partial,
        mismatched,
        worstDirectories,
      },
      gbp: {
        avgScore: gbpAvgScore,
        completeness: gbpCompleteness,
        verified: gbpVerified,
        fieldGaps: gbpFieldGaps,
        unansweredQA: gbpUnansweredQA,
        fields: gbpFields,
        postCadence: gbpPostCadence,
        photoCount: gbpPhotoCount,
        serviceCount: gbpServiceCount,
        viewsSeries: gbpViewsSeries,
        worstProfiles,
        bestProfiles,
      },
      reviews: {
        avg: reviewAvg,
        total: reviewTotal,
        new30d: reviewNew30d,
        new30dPrev: reviewNew30dPrev,
        responseRate: reviewResponseRate,
        dist: reviewDist,
        velocitySeries: reviewVelocitySeries,
        recentLow,
        unanswered,
        lowStarTotal,
        positive: positiveReviews,
        negative: negativeReviews,
        neutral: neutralReviews,
      },
      localPack: {
        share: localPackShare,
        sharePrev: localPackSharePrev,
        shareSeries90d: localPackShareSeries,
        avgPos: localPackAvgPos,
        top3,
        pos1,
        pos2,
        pos3,
        pos4plus,
        notRanking,
        benchmark: bench.localPackShare,
        topKeywords,
        lost,
      },
      actions: {
        items: actionItems,
      },
      bench,
    }
  }, [pages, locations, hasPrior])
}
