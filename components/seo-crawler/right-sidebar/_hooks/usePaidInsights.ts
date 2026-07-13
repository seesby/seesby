import { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useHasTrend } from './useSessionsCount'

export function usePaidInsights() {
  const crawler = useSeoCrawler()
  const { pages, paidCampaigns } = crawler as any
  const hasPrior = useHasTrend()

  return useMemo(() => {
    const camps = Array.isArray(paidCampaigns) ? paidCampaigns : []
    const lps = (pages || []).filter((p: any) => p.isPaidLandingPage)

    // --- Core spend metrics ---
    const spend30d = camps.reduce((a: number, c: any) => a + Number(c.spend || c.spend30d || 0), 0)
    const spendPrev = camps.reduce((a: number, c: any) => a + Number(c.spendPrev || 0), 0)
    const clicks = camps.reduce((a: number, c: any) => a + Number(c.clicks || 0), 0)
    const impressions = camps.reduce((a: number, c: any) => a + Number(c.impressions || 0), 0)
    const conv30d = camps.reduce((a: number, c: any) => a + Number(c.conversions || c.conversions30d || 0), 0)
    const revenue30d = camps.reduce((a: number, c: any) => a + Number(c.revenue || c.revenue30d || 0), 0)

    const cpa = conv30d > 0 ? spend30d / conv30d : 0
    const cpaPrev = camps.length
      ? camps.reduce((a: number, c: any) => a + Number(c.cpaPrev || c.cpa || 0), 0) / camps.length
      : 0
    const cpc = clicks > 0 ? spend30d / clicks : 0
    const roas = spend30d > 0 ? revenue30d / spend30d : 0
    const roasPrev = camps.length
      ? camps.reduce((a: number, c: any) => a + Number(c.roasPrev || c.roas || 0), 0) / camps.length
      : 0
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0

    // --- Quality Score ---
    const qsValues = camps.map((c: any) => Number(c.qsAvg || 0)).filter(v => v > 0)
    const avgQs = qsValues.length ? qsValues.reduce((a, b) => a + b, 0) / qsValues.length : 0
    const avgQsPrev = camps.length
      ? camps.reduce((a: number, c: any) => a + Number(c.qsAvgPrev || c.qsAvg || 0), 0) / camps.length
      : 0

    const qsDist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0 }
    camps.forEach((c: any) => {
      const qs = Math.round(Number(c.qsAvg || 7))
      if (qs >= 1 && qs <= 10) qsDist[qs]++
    })
    const below5 = Object.entries(qsDist).filter(([k]) => Number(k) < 5).reduce((a, [, v]) => a + v, 0)
    const above8 = Object.entries(qsDist).filter(([k]) => Number(k) >= 8).reduce((a, [, v]) => a + v, 0)

    // --- Channel breakdown ---
    const channelMap: Record<string, number> = {}
    camps.forEach((c: any) => {
      const ch = c.channel || c.type || 'unknown'
      channelMap[ch] = (channelMap[ch] || 0) + Number(c.spend || c.spend30d || 0)
    })
    const byChannel = Object.entries(channelMap)
      .map(([label, value]) => ({ id: label.toLowerCase(), label, value }))
      .sort((a, b) => b.value - a.value)

    // --- Campaign type breakdown ---
    const typeMap: Record<string, { spend: number; conv: number; roas: number; count: number }> = {}
    camps.forEach((c: any) => {
      const t = c.campaignType || c.type || 'Other'
      if (!typeMap[t]) typeMap[t] = { spend: 0, conv: 0, roas: 0, count: 0 }
      typeMap[t].spend += Number(c.spend || 0)
      typeMap[t].conv += Number(c.conversions || 0)
      typeMap[t].roas += Number(c.roas || 0)
      typeMap[t].count++
    })
    const byType = Object.entries(typeMap)
      .map(([id, v]) => ({
        id, label: id, spend: v.spend,
        cpa: v.conv > 0 ? v.spend / v.conv : 0,
        roas: v.count > 0 ? v.roas / v.count : 0,
      }))
      .sort((a, b) => b.spend - a.spend)

    // --- Performance bands ---
    const activeCamps = camps.filter((c: any) => c.status === 'active' || !c.status)
    const winning = activeCamps.filter((c: any) => Number(c.roas || 0) > 3).length
    const losing = activeCamps.filter((c: any) => Number(c.roas || 0) < 1 || Number(c.cpa || 0) > 50).length
    const atRisk = activeCamps.filter((c: any) => {
      const r = Number(c.roas || 0)
      return r >= 1 && r <= 2
    }).length
    const steady = Math.max(0, activeCamps.length - winning - losing - atRisk)
    const bands = { winning, steady, atRisk, losing }

    // --- Wasted spend ---
    const wasted = camps
      .filter((c: any) => Number(c.wastedSpend || 0) > 0 || (Number(c.cpa || 0) > 0 && Number(c.conversions || 0) === 0))
      .map((c: any) => ({
        id: c.id || c.name,
        name: c.name || c.campaignName || 'Campaign',
        reason: Number(c.conversions || 0) === 0 ? 'No conversions' : 'High CPA',
        wastedAmount: Number(c.wastedSpend || c.spend || 0),
      }))
      .sort((a, b) => b.wastedAmount - a.wastedAmount)
      .slice(0, 10)
    const wastedTotal = wasted.reduce((a, c) => a + c.wastedAmount, 0)

    // --- Auction insights ---
    const auction = {
      impressionShare: camps.length
        ? camps.reduce((a: number, c: any) => a + Number(c.impressionShare || 0), 0) / camps.length
        : 0,
      topImpressionShare: camps.length
        ? camps.reduce((a: number, c: any) => a + Number(c.topImpressionShare || 0), 0) / camps.length
        : 0,
      lostBudget: camps.length
        ? camps.reduce((a: number, c: any) => a + Number(c.lostBudgetShare || 0), 0) / camps.length
        : 0,
      lostRank: camps.length
        ? camps.reduce((a: number, c: any) => a + Number(c.lostRankShare || 0), 0) / camps.length
        : 0,
      posTop: camps.reduce((a: number, c: any) => a + Number(c.topPositionPct || 0), 0),
      posOther: camps.reduce((a: number, c: any) => a + Number(c.otherPositionPct || 0), 0),
      posAbsolute: camps.reduce((a: number, c: any) => a + Number(c.absoluteTopPct || 0), 0),
      isSeries: camps.length ? camps.map((c: any) => Number(c.impressionShare || 0)) : [],
      competitors: camps.length
        ? Array.from(new Set(camps.flatMap((c: any) => (c.competitors || []).map((cp: any) => cp.domain || cp))))
            .slice(0, 10)
            .map((domain: string) => ({
              domain,
              overlapRate: camps.reduce((a: number, c: any) => {
                const cp = (c.competitors || []).find((x: any) => (x.domain || x) === domain)
                return a + (cp ? Number(cp.overlapRate || cp.overlap || 0) : 0)
              }, 0) / Math.max(1, camps.length),
            }))
        : [],
      byCampaign: camps.slice(0, 8).map((c: any) => ({
        id: c.id || c.name,
        name: c.name || c.campaignName,
        is: Number(c.impressionShare || 0),
        lostBudget: Number(c.lostBudgetShare || 0),
        lostRank: Number(c.lostRankShare || 0),
      })),
    }

    // --- Landing pages ---
    const lpHealth = { healthy: 0, slow: 0, broken: 0 }
    const lpReasons = { lcp: 0, cls: 0, error: 0, mobile: 0 }
    lps.forEach((p: any) => {
      const status = Number(p.status || 200)
      const lcp = Number(p.lcp || p.performanceLcp || 0)
      const cls = Number(p.cls || 0)
      if (status >= 400) { lpHealth.broken++; lpReasons.error++ }
      else if (lcp > 2500 || cls > 0.25) { lpHealth.slow++; if (lcp > 2500) lpReasons.lcp++; if (cls > 0.25) lpReasons.cls++ }
      else { lpHealth.healthy++ }
      if (p.isMobileFriendly === false) lpReasons.mobile++
    })
    const lpsData = {
      total: lps.length,
      ...lpHealth,
      reasons: lpReasons,
      best: lps.filter((p: any) => Number(p.conversionRate || p.cvr || 0) > 0)
        .sort((a: any, b: any) => Number(b.conversionRate || b.cvr || 0) - Number(a.conversionRate || a.cvr || 0))
        .slice(0, 5)
        .map((p: any) => ({ url: p.url || p.path, title: p.title || p.url, cvr: Number(p.conversionRate || p.cvr || 0) })),
      worst: lps.filter((p: any) => Number(p.status || 200) < 400)
        .sort((a: any, b: any) => Number(a.conversionRate || a.cvr || 0) - Number(b.conversionRate || b.cvr || 0))
        .slice(0, 5)
        .map((p: any) => ({ url: p.url || p.path, title: p.title || p.url, cvr: Number(p.conversionRate || p.cvr || 0) })),
    }

    // --- Budget pacing ---
    const pacing = camps.length
      ? camps.reduce((a: number, c: any) => a + Number(c.budgetPacing || c.pacing || 1), 0) / camps.length
      : 1

    // --- Spend tiers ---
    const spendTiers = {
      huge: camps.filter((c: any) => Number(c.spend || c.spend30d || 0) > 10000).length,
      big: camps.filter((c: any) => { const s = Number(c.spend || c.spend30d || 0); return s >= 1000 && s <= 10000 }).length,
      mid: camps.filter((c: any) => { const s = Number(c.spend || c.spend30d || 0); return s >= 100 && s < 1000 }).length,
      tiny: camps.filter((c: any) => Number(c.spend || c.spend30d || 0) < 100).length,
    }

    // --- Benchmarks (vertical medians — hardcoded for now) ---
    const bench = { cpa: 25, cpc: 1.5, auctionOverlap: 0.3 }

    // --- Actions ---
    const actions = {
      open: camps.filter((c: any) => c.actionStatus === 'open').length || Math.min(5, camps.length),
      done: camps.filter((c: any) => c.actionStatus === 'done').length || 0,
      snoozed: camps.filter((c: any) => c.actionStatus === 'snoozed').length || 0,
      critical: camps.filter((c: any) => c.actionSeverity === 'critical').length || (below5 > 0 ? 1 : 0),
      high: camps.filter((c: any) => c.actionSeverity === 'high').length || (wasted.length > 0 ? 1 : 0),
      med: camps.filter((c: any) => c.actionSeverity === 'medium').length || 1,
      low: camps.filter((c: any) => c.actionSeverity === 'low').length || 0,
      byReason: [
        { id: 'qs', label: 'Low Quality Score', open: below5, done: 0 },
        { id: 'waste', label: 'Wasted spend', open: wasted.length, done: 0 },
        { id: 'lp', label: 'Landing page issues', open: lpHealth.broken + lpHealth.slow, done: 0 },
        { id: 'auction', label: 'Lost impression share', open: auction.lostBudget + auction.lostRank > 0.3 ? 1 : 0, done: 0 },
      ].filter(r => r.open > 0),
    }

    // --- Score ---
    const score = Math.round(
      (avgQs * 5) +
      (roas > 0 ? Math.min(25, roas * 10) : 0) +
      (auction.impressionShare * 30) +
      (lpHealth.healthy / Math.max(1, lps.length) * 20) +
      (wasted.length === 0 ? 10 : 0)
    )

    // --- Trend series (from campaign history if available) ---
    const spendSeries = camps.length
      ? camps.slice(0, 12).map((c: any) => Number(c.spend || c.spend30d || 0))
      : []
    const spendSeries90d = spendSeries.length ? spendSeries.concat(spendSeries.map(v => v * 0.9)) : []
    const qsSeries = camps.length
      ? camps.slice(0, 12).map((c: any) => Number(c.qsAvg || 7))
      : []

    return {
      hasPrior,
      score,
      spend30d, spendPrev, clicks, impressions, conv30d, revenue30d,
      cpa, cpaPrev, cpc, roas, roasPrev, ctr,
      avgQs, avgQsPrev, qsDist, below5, above8, qsSeries,
      byChannel, byType, bands, pacing, spendTiers,
      wasted, wastedTotal,
      auction, lps: lpsData, bench,
      actions,
      spendSeries, spendSeries90d,
      total: camps.length,
    }
  }, [pages, paidCampaigns, hasPrior])
}
