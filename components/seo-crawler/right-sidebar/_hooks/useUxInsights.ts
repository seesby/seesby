import { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useHasTrend } from './useSessionsCount'

export function useUxInsights() {
  const crawler = useSeoCrawler()
  const { pages, site } = crawler
  const compareSession = (crawler as any).compareSession
  const prevPages = compareSession?.pages || []
  const hasTrend = useHasTrend()

  return useMemo(() => {
    const safe = pages || []
    const html = safe.filter((p: any) => p.isHtmlPage !== false)
    const total = html.length
    if (!total) return EMPTY

    const num = (v: any) => { const n = Number(v); return isFinite(n) ? n : 0 }
    const uxOf = (p: any) => p.ux || {}
    const cwvOf = (p: any) => p.cwv || {}

    // ── Score ──
    const scores = html.map((p: any) => {
      const friction = num(p.frictionScore)
      if (friction > 0) return Math.max(0, 100 - friction)
      const bounce = num(uxOf(p).bounceRate)
      const scroll = num(uxOf(p).scrollDepth)
      return Math.round(100 - bounce * 40 - (1 - scroll / 100) * 30)
    })
    const score = scores.length
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0

    // ── Conversion & engagement ──
    const convertingPages = html.filter((p: any) =>
      num(uxOf(p).formCompletes) > 0 || num(uxOf(p).ctaClicks) > 0 || num((p as any).addToCart) > 0
    ).length
    const cvr = total > 0 ? convertingPages / total : 0
    const bounceRate = avg(html.map((p: any) => num(uxOf(p).bounceRate)).filter(Boolean)) || 0
    const avgSessionSec = avg(html.map((p: any) => num(uxOf(p).avgTime)).filter(Boolean)) || 0
    const engagementRate = total > 0
      ? html.filter((p: any) => {
        const bounce = num(uxOf(p).bounceRate)
        const scroll = num(uxOf(p).scrollDepth)
        return bounce < 0.7 || scroll > 50
      }).length / total
      : 0

    // ── Previous session comparison ──
    const prevHtml = prevPages.filter((p: any) => p.isHtmlPage !== false)
    const prevTotal = prevHtml.length
    const prevScore = prevTotal > 0 ? (() => {
      const ps = prevHtml.map((p: any) => {
        const friction = num(p.frictionScore)
        if (friction > 0) return Math.max(0, 100 - friction)
        const bounce = num(uxOf(p).bounceRate)
        const scroll = num(uxOf(p).scrollDepth)
        return Math.round(100 - bounce * 40 - (1 - scroll / 100) * 30)
      })
      return Math.round(ps.reduce((a: number, b: number) => a + b, 0) / ps.length)
    })() : NaN
    const prevCvr = prevTotal > 0 ? prevHtml.filter((p: any) =>
      num(uxOf(p).formCompletes) > 0 || num(uxOf(p).ctaClicks) > 0 || num((p as any).addToCart) > 0
    ).length / prevTotal : NaN
    const prevBounceRate = prevTotal > 0
      ? avg(prevHtml.map((p: any) => num(uxOf(p).bounceRate)).filter(Boolean)) || NaN
      : NaN
    const prevEngagementRate = prevTotal > 0
      ? prevHtml.filter((p: any) => {
        const bounce = num(uxOf(p).bounceRate)
        const scroll = num(uxOf(p).scrollDepth)
        return bounce < 0.7 || scroll > 50
      }).length / prevTotal
      : NaN

    // ── Friction bands ──
    const frictionBands = {
      low: html.filter((p: any) => num(p.frictionScore) < 20 || !p.frictionScore).length,
      medium: html.filter((p: any) => { const f = num(p.frictionScore); return f >= 20 && f < 60 }).length,
      high: html.filter((p: any) => num(p.frictionScore) >= 60).length,
    }

    // ── Events ──
    const events = {
      form: html.reduce((s, p) => s + num(uxOf(p).formCompletes), 0),
      atc: html.reduce((s, p) => s + num((p as any).addToCart), 0),
      checkout: html.reduce((s, p) => s + num((p as any).checkout), 0),
      signup: html.reduce((s, p) => s + num((p as any).signup), 0),
    }
    const totalEvents = events.form + events.atc + events.checkout + events.signup

    // ── Friction signals ──
    const friction = {
      rageClicks: html.reduce((s, p) => s + num(uxOf(p).rageClicks), 0),
      deadClicks: html.reduce((s, p) => s + num(uxOf(p).deadClicks), 0),
      errorClicks: html.reduce((s, p) => s + num(uxOf(p).errorClicks), 0),
      formAbandon: html.reduce((s, p) => s + Math.max(0, num(uxOf(p).formStarts) - num(uxOf(p).formCompletes)), 0),
      scrollDepth: html.filter((p: any) => num(uxOf(p).scrollDepth) < 50).length,
    }

    // ── Friction by template ──
    const templateMap: Record<string, { pages: number; friction: number; cvr: number; bounce: number }> = {}
    html.forEach((p: any) => {
      const t = p.template || 'other'
      if (!templateMap[t]) templateMap[t] = { pages: 0, friction: 0, cvr: 0, bounce: 0 }
      templateMap[t].pages++
      templateMap[t].friction += num(p.frictionScore)
      if (num(uxOf(p).formCompletes) > 0 || num(uxOf(p).ctaClicks) > 0) templateMap[t].cvr++
      templateMap[t].bounce += num(uxOf(p).bounceRate)
    })
    const frictionByTemplate = Object.entries(templateMap)
      .map(([id, v]) => ({
        id, label: id, pages: v.pages,
        avgFriction: v.pages ? Math.round(v.friction / v.pages) : 0,
        cvr: v.pages ? v.cvr / v.pages : 0,
        avgBounce: v.pages ? v.bounce / v.pages : 0,
      }))
      .sort((a, b) => b.pages - a.pages)
      .slice(0, 8)

    // ── Scroll depth distribution ──
    const scrollDist = {
      deep: html.filter((p: any) => num(uxOf(p).scrollDepth) >= 75).length,
      medium: html.filter((p: any) => { const s = num(uxOf(p).scrollDepth); return s >= 40 && s < 75 }).length,
      shallow: html.filter((p: any) => { const s = num(uxOf(p).scrollDepth); return s > 0 && s < 40 }).length,
      none: html.filter((p: any) => num(uxOf(p).scrollDepth) === 0).length,
    }
    const avgScrollDepth = avg(html.map((p: any) => num(uxOf(p).scrollDepth)).filter(Boolean)) || 0

    // ── CWV ──
    const lcpValues = html.map((p: any) => num(cwvOf(p).lcp) || num(p.lcpMs)).filter(Boolean)
    const inpValues = html.map((p: any) => num(cwvOf(p).inp) || num(p.inpMs)).filter(Boolean)
    const clsValues = html.map((p: any) => num(cwvOf(p).cls) || num(p.cls)).filter(Boolean)
    const lcpP75 = percentile(lcpValues, 0.75)
    const inpP75 = percentile(inpValues, 0.75)
    const clsP75 = percentile(clsValues, 0.75)
    const cwvPass = html.filter((p: any) => {
      const lcp = num(cwvOf(p).lcp) || num(p.lcpMs)
      const inp = num(cwvOf(p).inp) || num(p.inpMs)
      const cls = num(cwvOf(p).cls) || num(p.cls)
      return lcp <= 2500 && inp <= 200 && cls <= 0.1
    }).length
    const passPct = total > 0 ? Math.round((cwvPass / total) * 100) : 0

    // CWV by device (if available)
    const mobilePages = html.filter((p: any) => (p as any).device === 'mobile' || (p as any).isMobile)
    const desktopPages = html.filter((p: any) => (p as any).device === 'desktop' || !(p as any).isMobile)
    const mobileCwvPass = mobilePages.filter((p: any) => {
      const lcp = num(cwvOf(p).lcp) || num(p.lcpMs)
      const inp = num(cwvOf(p).inp) || num(p.inpMs)
      const cls = num(cwvOf(p).cls) || num(p.cls)
      return lcp <= 2500 && inp <= 200 && cls <= 0.1
    }).length
    const desktopCwvPass = desktopPages.filter((p: any) => {
      const lcp = num(cwvOf(p).lcp) || num(p.lcpMs)
      const inp = num(cwvOf(p).inp) || num(p.inpMs)
      const cls = num(cwvOf(p).cls) || num(p.cls)
      return lcp <= 2500 && inp <= 200 && cls <= 0.1
    }).length

    const cwv = {
      passPct, lcpP75, inpP75, clsP75,
      lcpGood: lcpValues.filter(v => v <= 2500).length,
      lcpMid: lcpValues.filter(v => v > 2500 && v <= 4000).length,
      lcpPoor: lcpValues.filter(v => v > 4000).length,
      clsBad: clsValues.filter(v => v > 0.25).length,
      mobilePass: mobilePages.length > 0 ? Math.round((mobileCwvPass / mobilePages.length) * 100) : 0,
      mobileTotal: mobilePages.length,
      desktopPass: desktopPages.length > 0 ? Math.round((desktopCwvPass / desktopPages.length) * 100) : 0,
      desktopTotal: desktopPages.length,
      lcpSeries: [] as number[],
    }

    // ── Funnels ──
    const funnels = computeFunnels(crawler)

    // ── Forms ──
    const forms = computeForms(crawler, html, num)

    // ── Tests ──
    const tests = computeTests(crawler)

    // ── Actions ──
    const actions = computeActions(crawler)

    // ── By template (general) ──
    const byTemplate = frictionByTemplate.map(t => ({
      ...t, bounce: t.avgBounce,
    }))

    // ── Pages with issues ──
    const pagesWithRage = html.filter((p: any) => num(uxOf(p).rageClicks) > 0).length
    const pagesWithDead = html.filter((p: any) => num(uxOf(p).deadClicks) > 0).length
    const pagesWithErrors = html.filter((p: any) => num(uxOf(p).errorClicks) > 0).length
    const pagesWithFormIssues = html.filter((p: any) =>
      num(uxOf(p).formStarts) > 0 && num(uxOf(p).formCompletes) < num(uxOf(p).formStarts) * 0.5
    ).length

    return {
      score, cvr, bounceRate, avgSessionSec, engagementRate,
      prevScore, prevCvr, prevBounceRate, prevEngagementRate,
      convertingPages, totalEvents,
      frictionBands, events, friction, frictionByTemplate,
      scrollDist, avgScrollDepth,
      cwv, funnels, forms, tests, actions,
      byTemplate,
      pagesWithRage, pagesWithDead, pagesWithErrors, pagesWithFormIssues,
      hasTrend, total, bench: { lcpP75: 2500 },
      scoreHistory: ((site as any)?.history?.score ?? []) as number[],
    }
  }, [pages, hasTrend])
}

// ── Helpers ──

function avg(arr: number[]): number {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
}

function percentile(sorted: number[], p: number): number {
  if (!sorted.length) return 0
  const s = [...sorted].sort((a, b) => a - b)
  const idx = Math.ceil(s.length * p) - 1
  return Math.round(s[Math.max(0, idx)])
}

function computeFunnels(crawler: any) {
  const funnelsList = (crawler as any).funnels || []
  if (!funnelsList.length) {
    return {
      list: [], primary: [], secondary: [],
      avgCompletion: 0, completionSeries: [] as number[],
      healthy: 0, dropping: 0, broken: 0,
      worstStep: null as { name: string; dropPct: number } | null,
    }
  }

  const primary = funnelsList[0]
  const secondary = funnelsList.length > 1 ? funnelsList[1] : null

  const primarySteps = primary?.counts?.map((c: number, i: number) => ({
    label: primary.steps?.[i]?.label || `Step ${i + 1}`,
    value: c,
  })) || []

  const secondarySteps = secondary?.counts?.map((c: number, i: number) => ({
    label: secondary.steps?.[i]?.label || `Step ${i + 1}`,
    value: c,
  })) || []

  let healthy = 0, dropping = 0, broken = 0
  let worstDrop = 0
  let worstStepName = ''

  funnelsList.forEach((f: any) => {
    const counts = f.counts || []
    for (let i = 1; i < counts.length; i++) {
      const drop = counts[i - 1] > 0 ? 1 - counts[i] / counts[i - 1] : 0
      if (drop > 0.5) { broken++; if (drop > worstDrop) { worstDrop = drop; worstStepName = f.steps?.[i]?.label || `Step ${i + 1}` } }
      else if (drop > 0.2) { dropping++; if (drop > worstDrop) { worstDrop = drop; worstStepName = f.steps?.[i]?.label || `Step ${i + 1}` } }
      else healthy++
    }
  })

  const avgCompletion = funnelsList.length
    ? funnelsList.reduce((s: number, f: any) => {
      const counts = f.counts || []
      return s + (counts.length > 0 ? counts[counts.length - 1] / counts[0] : 0)
    }, 0) / funnelsList.length
    : 0

  return {
    list: funnelsList.map((f: any) => ({
      id: f.id, name: f.name, steps: f.steps?.length || 0,
      completion: f.counts?.length > 0 ? f.counts[f.counts.length - 1] / f.counts[0] : 0,
      worstStep: worstStepName,
    })),
    primary: primarySteps,
    secondary: secondarySteps,
    avgCompletion,
    completionSeries: [] as number[],
    healthy, dropping, broken,
    worstStep: worstStepName ? { name: worstStepName, dropPct: worstDrop } : null,
  }
}

function computeForms(crawler: any, html: any[], num: (v: any) => number) {
  const formsList = (crawler as any).forms || []
  if (!formsList.length) {
    const totalFormStarts = html.reduce((s, p) => s + num(p.ux?.formStarts), 0)
    const totalFormCompletes = html.reduce((s, p) => s + num(p.ux?.formCompletes), 0)
    return {
      total: totalFormStarts > 0 ? 1 : 0,
      submitRate: totalFormStarts > 0 ? totalFormCompletes / totalFormStarts : 0,
      errorsPerSubmit: 0, errors: {} as Record<string, number>,
      fieldAbandon: totalFormStarts - totalFormCompletes,
      resubmit: 0, avgFillSec: 0, totalErrors: 0,
      totalStarts: totalFormStarts, totalCompletes: totalFormCompletes,
      worstFields: [] as any[], byPage: [] as any[],
      list: [] as any[],
    }
  }

  const worstFields = formsList.flatMap((f: any) =>
    (f.fields || []).map((field: any) => ({
      id: field.id, label: field.label, formName: f.name,
      errorRate: field.errorRate || 0,
      abandonRate: field.abandonRate || 0,
      avgFillMs: field.avgFillMs || 0,
    }))
  ).sort((a: any, b: any) => b.errorRate - a.errorRate).slice(0, 8)

  const byPage = formsList.map((f: any) => ({
    url: f.pageUrl, title: f.name,
    starts: f.starts, completes: f.completes,
    submitRate: f.starts > 0 ? f.completes / f.starts : 0,
    abandonRate: f.abandonRate || 0,
  })).slice(0, 8)

  const totalStarts = formsList.reduce((s, f) => s + (f.starts || 0), 0)
  const totalCompletes = formsList.reduce((s, f) => s + (f.completes || 0), 0)

  return {
    total: formsList.length,
    submitRate: totalStarts > 0 ? totalCompletes / totalStarts : 0,
    errorsPerSubmit: 0, errors: {} as Record<string, number>,
    fieldAbandon: formsList.reduce((s, f) => s + Math.max(0, (f.starts || 0) - (f.completes || 0)), 0),
    resubmit: 0, avgFillSec: 0, totalErrors: 0,
    totalStarts, totalCompletes,
    worstFields, byPage,
    list: formsList.slice(0, 8),
  }
}

function computeTests(crawler: any) {
  const tests = (crawler as any).experiments || (crawler as any).tests || []
  if (!tests.length) {
    return {
      active: 0, won: 0, lost: 0, inconclusive: 0,
      byType: { ab: 0, mvt: 0, personalize: 0 },
      recentWins: [] as any[], activeList: [] as any[],
      byPage: [] as any[],
      avgLift: 0, totalLift: 0,
      readyToShip: 0, needsMoreData: 0,
    }
  }

  const active = tests.filter((t: any) => t.status === 'active').length
  const won = tests.filter((t: any) => t.status === 'won').length
  const lost = tests.filter((t: any) => t.status === 'lost').length
  const inconclusive = tests.filter((t: any) => t.status === 'inconclusive').length

  const recentWins = tests
    .filter((t: any) => t.status === 'won')
    .sort((a: any, b: any) => (b.uplift || 0) - (a.uplift || 0))
    .slice(0, 6)
    .map((t: any) => ({ id: t.id, name: t.name, lift: t.uplift || 0 }))

  const activeList = tests
    .filter((t: any) => t.status === 'active')
    .sort((a: any, b: any) => (b.confidence || 0) - (a.confidence || 0))
    .slice(0, 8)
    .map((t: any) => ({
      id: t.id, name: t.name, targetUrl: t.targetUrl || '/',
      daysRunning: t.daysRunning || 0, confidence: t.confidence || 0,
      uplift: t.uplift || 0,
    }))

  const byType = {
    ab: tests.filter((t: any) => t.type === 'ab').length,
    mvt: tests.filter((t: any) => t.type === 'mvt').length,
    personalize: tests.filter((t: any) => t.type === 'personalize').length,
  }

  const pageMap: Record<string, { tests: number; wins: number; liftSum: number }> = {}
  tests.forEach((t: any) => {
    const url = t.targetUrl || '/'
    if (!pageMap[url]) pageMap[url] = { tests: 0, wins: 0, liftSum: 0 }
    pageMap[url].tests++
    if (t.status === 'won') { pageMap[url].wins++; pageMap[url].liftSum += t.uplift || 0 }
  })
  const byPage = Object.entries(pageMap)
    .map(([url, v]) => ({
      url, title: url, tests: v.tests, wins: v.wins,
      avgLift: v.wins > 0 ? v.liftSum / v.wins : 0,
    }))
    .sort((a, b) => b.tests - a.tests)
    .slice(0, 8)

  const allLifts = tests.filter((t: any) => t.uplift).map((t: any) => t.uplift)
  const avgLift = allLifts.length ? allLifts.reduce((a: number, b: number) => a + b, 0) / allLifts.length : 0
  const totalLift = allLifts.reduce((a: number, b: number) => a + b, 0)

  const readyToShip = tests.filter((t: any) => t.status === 'active' && (t.confidence || 0) >= 0.95).length
  const needsMoreData = tests.filter((t: any) => t.status === 'active' && (t.confidence || 0) < 0.8).length

  return { active, won, lost, inconclusive, byType, recentWins, activeList, byPage, avgLift, totalLift, readyToShip, needsMoreData }
}

function computeActions(crawler: any) {
  const pages = crawler.pages || []
  const critical = pages.filter((p: any) => p.actionPriority === 'critical' || p.actionPriority === 'high').length
  const high = pages.filter((p: any) => p.actionPriority === 'medium').length
  const med = pages.filter((p: any) => p.actionPriority === 'low').length
  const low = 0

  const reasonMap: Record<string, { open: number; done: number; affected: number }> = {}
  pages.forEach((p: any) => {
    const reason = p.primaryActionCategory || p.contentActionReason || p.technicalActionReason
    if (!reason) return
    if (!reasonMap[reason]) reasonMap[reason] = { open: 0, done: 0, affected: 0 }
    reasonMap[reason].open++
    reasonMap[reason].affected++
  })
  const byReason = Object.entries(reasonMap)
    .map(([id, v]) => ({ id, label: id, ...v }))
    .sort((a, b) => b.open - a.open)
    .slice(0, 8)

  const totalActions = critical + high + med + low

  return {
    open: totalActions, done: 0, snoozed: 0,
    critical, high, med, low, byReason,
    totalActions,
  }
}

// ── Empty state ──
const EMPTY = {
  score: 0, cvr: 0, bounceRate: 0, avgSessionSec: 0, engagementRate: 0,
  prevScore: NaN, prevCvr: NaN, prevBounceRate: NaN, prevEngagementRate: NaN,
  convertingPages: 0, totalEvents: 0,
  frictionBands: { low: 0, medium: 0, high: 0 },
  events: { form: 0, atc: 0, checkout: 0, signup: 0 },
  friction: {
    rageClicks: 0, deadClicks: 0, errorClicks: 0, formAbandon: 0, scrollDepth: 0,
  },
  frictionByTemplate: [] as any[],
  scrollDist: { deep: 0, medium: 0, shallow: 0, none: 0 },
  avgScrollDepth: 0,
  cwv: {
    passPct: 0, lcpP75: 0, inpP75: 0, clsP75: 0,
    lcpGood: 0, lcpMid: 0, lcpPoor: 0, clsBad: 0,
    mobilePass: 0, mobileTotal: 0, desktopPass: 0, desktopTotal: 0,
    lcpSeries: [] as number[],
  },
  funnels: {
    list: [], primary: [], secondary: [],
    avgCompletion: 0, completionSeries: [] as number[],
    healthy: 0, dropping: 0, broken: 0, worstStep: null,
  },
  forms: {
    total: 0, submitRate: 0, errorsPerSubmit: 0, errors: {},
    fieldAbandon: 0, resubmit: 0, avgFillSec: 0, totalErrors: 0,
    totalStarts: 0, totalCompletes: 0,
    worstFields: [], byPage: [], list: [],
  },
  tests: {
    active: 0, won: 0, lost: 0, inconclusive: 0,
    byType: { ab: 0, mvt: 0, personalize: 0 },
    recentWins: [], activeList: [], byPage: [],
    avgLift: 0, totalLift: 0, readyToShip: 0, needsMoreData: 0,
  },
  actions: {
    open: 0, done: 0, snoozed: 0,
    critical: 0, high: 0, med: 0, low: 0, byReason: [],
    totalActions: 0,
  },
  byTemplate: [] as any[],
  pagesWithRage: 0, pagesWithDead: 0, pagesWithErrors: 0, pagesWithFormIssues: 0,
  hasTrend: false, total: 0,
  bench: { lcpP75: 2500 },
  scoreHistory: [] as number[],
}
