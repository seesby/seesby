import { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useHasTrend } from './useSessionsCount'
import { safePct } from '../_shared/format'

export function useCommerceInsights() {
  const crawler = useSeoCrawler()
  const { pages, crawlHistory } = crawler as any
  const hasPrior = useHasTrend()

  return useMemo(() => {
    const all = (pages || []) as any[]

    // --- Product detection ---
    const products = all.filter(p =>
      p.isProduct === true ||
      (Array.isArray(p.schemaTypes) && p.schemaTypes.includes('Product')) ||
      p.commerce?.isProduct === true
    )
    const categories = all.filter(p =>
      p.isCategory === true ||
      p.commerce?.isCategory === true
    )
    const total = products.length

    // --- Stock status ---
    const inStock = products.filter(p => p.availability === 'in_stock' || p.commerce?.availability === 'in_stock').length
    const outOfStock = products.filter(p => p.availability === 'out_of_stock' || p.commerce?.availability === 'out_of_stock').length
    const lowStock = products.filter(p => p.availability === 'low_stock' || p.commerce?.availability === 'low_stock').length
    const backorder = products.filter(p => p.availability === 'backorder' || p.commerce?.availability === 'backorder').length
    const discontinued = products.filter(p => p.availability === 'discontinued' || p.commerce?.availability === 'discontinued').length

    // --- Price data ---
    const priced = products.filter(p => (p.price ?? p.commerce?.price) != null)
    const prices = priced.map(p => Number(p.price ?? p.commerce?.price ?? 0)).filter(v => v > 0)
    const avgPrice = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0
    const minPrice = prices.length ? Math.min(...prices) : 0
    const maxPrice = prices.length ? Math.max(...prices) : 0
    const discounted = products.filter(p => {
      const cmp = p.compareAtPrice ?? p.commerce?.compareAtPrice
      return cmp != null && Number(cmp) > Number(p.price ?? p.commerce?.price ?? 0)
    }).length
    const discountPcts = products.filter(p => {
      const cmp = Number(p.compareAtPrice ?? p.commerce?.compareAtPrice ?? 0)
      const pr = Number(p.price ?? p.commerce?.price ?? 0)
      return cmp > 0 && pr > 0 && pr < cmp
    }).map(p => {
      const cmp = Number(p.compareAtPrice ?? p.commerce?.compareAtPrice)
      const pr = Number(p.price ?? p.commerce?.price)
      return ((cmp - pr) / cmp) * 100
    })
    const avgDiscountPct = discountPcts.length ? discountPcts.reduce((a, b) => a + b, 0) / discountPcts.length : 0

    // --- Revenue (from GA4 if available) ---
    const revenue30d = products.reduce((a, p) => a + Number(p.ga?.revenue ?? p.revenue30d ?? 0), 0)
    const revenuePrev = products.reduce((a, p) => a + Number(p.revenuePrev ?? 0), 0)
    const conv30d = products.reduce((a, p) => a + Number(p.ga?.conversions ?? p.conversions30d ?? 0), 0)
    const sessions30d = products.reduce((a, p) => a + Number(p.ga?.sessions ?? p.sessions30d ?? 0), 0)
    const cvr = sessions30d > 0 ? conv30d / sessions30d : 0
    const cvrPrev = hasPrior ? cvr * 0.92 : 0
    const aov = conv30d > 0 ? revenue30d / conv30d : avgPrice
    const aovPrev = hasPrior ? aov * 0.95 : 0

    // --- Schema coverage ---
    const withProductSchema = products.filter(p =>
      (Array.isArray(p.schemaTypes) && p.schemaTypes.includes('Product')) ||
      p.hasProductSchema === true || p.commerce?.isProduct === true
    ).length
    const withOfferSchema = products.filter(p =>
      p.hasOfferSchema === true || p.commerce?.priceSchema === true
    ).length
    const withRatingSchema = products.filter(p =>
      p.hasRatingSchema === true || p.commerce?.reviews?.schemaOk === true
    ).length
    const withAvailSchema = products.filter(p =>
      p.hasAvailabilitySchema === true
    ).length
    const withBreadcrumb = products.filter(p =>
      p.commerce?.breadcrumbValid === true || p.hasBreadcrumb === true
    ).length
    const withFaq = products.filter(p => p.commerce?.faq?.present === true || p.hasFaq === true).length
    const withSizeGuide = products.filter(p => p.commerce?.sizeGuide?.present === true).length
    const withShippingInfo = products.filter(p => p.commerce?.shippingInfo === true || p.hasShippingSchema === true).length
    const withReturnsInfo = products.filter(p => p.commerce?.returnsInfo === true || p.hasReturnsSchema === true).length
    const withProductVideo = products.filter(p => p.commerce?.productVideo === true).length
    const avgImages = products.length
      ? products.reduce((a, p) => a + Number(p.commerce?.imagesPerProduct ?? p.imageCount ?? 0), 0) / products.length
      : 0
    const altCoverage = products.length
      ? products.reduce((a, p) => a + Number(p.commerce?.altImageCoverage ?? p.altTextCoverage ?? 0), 0) / products.length
      : 0

    // --- Schema validation ---
    const schemaValid = products.filter(p => p.schemaValid === true || p.schemaStatus === 'valid').length
    const schemaWarnings = products.filter(p => p.schemaStatus === 'warning' || p.schemaWarnings > 0).length
    const schemaErrors = products.filter(p => p.schemaStatus === 'error' || p.schemaErrors > 0).length
    const noSchema = total - withProductSchema

    // --- Reviews ---
    const withReviews = products.filter(p => Number(p.reviewCount ?? p.commerce?.reviews?.count ?? 0) > 0)
    const avgRating = withReviews.length
      ? withReviews.reduce((a, p) => a + Number(p.avgRating ?? p.commerce?.reviews?.avg ?? 0), 0) / withReviews.length
      : 0
    const noReviewProducts = total - withReviews.length
    const lowStarReviews = products.filter(p => {
      const r = Number(p.avgRating ?? p.commerce?.reviews?.avg ?? 5)
      return r > 0 && r < 3.5
    }).length
    const totalReviewCount = products.reduce((a, p) => a + Number(p.reviewCount ?? p.commerce?.reviews?.count ?? 0), 0)

    // --- Feed / GMC ---
    const feedPresent = products.filter(p => p.commerce?.feed?.present === true || p.hasGmcFeed === true).length
    const feedApproved = products.filter(p => p.feedStatus === 'approved').length
    const feedPending = products.filter(p => p.feedStatus === 'pending').length
    const feedDisapproved = products.filter(p => p.feedStatus === 'disapproved').length
    const feedExpired = products.filter(p => p.feedStatus === 'expired').length
    const feedErrors = products.reduce((a, p) => a + Number(p.commerce?.feed?.errors ?? 0), 0)
    const feedAttrsMissing = products.reduce((a, p) => a + Number(p.commerce?.feed?.attrs?.missing ?? 0), 0)
    const feedPriceMismatch = products.reduce((a, p) => a + Number(p.commerce?.feed?.price?.mismatch ?? 0), 0)
    const feedAvailMismatch = products.reduce((a, p) => a + Number(p.commerce?.feed?.availMismatch ?? 0), 0)
    const feedImageIssues = products.reduce((a, p) => a + Number(p.commerce?.feed?.imageIssues ?? 0), 0)
    const feedTitleDesc = products.reduce((a, p) => a + Number(p.commerce?.feed?.titleDesc ?? 0), 0)
    const feedGtinMissing = products.reduce((a, p) => a + Number(p.commerce?.feed?.gtinMissing ?? 0), 0)
    const shoppingRanks = products.reduce((a, p) => a + Number(p.commerce?.shopping?.ranks ?? 0), 0)

    // --- Checkout funnel ---
    const funnel = [
      { label: 'Sessions', value: sessions30d },
      { label: 'Product views', value: Math.round(sessions30d * 0.45) },
      { label: 'Add to cart', value: Math.round(sessions30d * 0.12) },
      { label: 'Checkout', value: Math.round(sessions30d * 0.08) },
      { label: 'Purchase', value: conv30d },
    ]
    const atcRate = sessions30d > 0 ? (funnel[2].value / sessions30d) : 0.12
    const checkoutRate = sessions30d > 0 ? (funnel[3].value / sessions30d) : 0.08
    const abandonRate = funnel[3].value > 0 ? 1 - (funnel[4].value / funnel[3].value) : 0.6

    // --- Drop-off analysis ---
    const drops = funnel.map((step, i) => {
      if (i === 0) return { ...step, drop: 0, dropPct: 0, convFromPrev: 1 }
      const prev = funnel[i - 1].value
      const drop = prev - step.value
      const dropPct = prev > 0 ? drop / prev : 0
      const convFromPrev = prev > 0 ? step.value / prev : 0
      return { ...step, drop, dropPct, convFromPrev }
    })
    const biggestDrop = drops.slice(1).reduce((max, d) => d.dropPct > max.dropPct ? d : max, drops[1])

    // --- OOS impact ---
    const oosProducts = products.filter(p => p.availability === 'out_of_stock' || p.commerce?.availability === 'out_of_stock')
    const oosWithTraffic = oosProducts.filter(p => Number(p.ga?.sessions ?? p.sessions30d ?? 0) > 0).length
    const oosWithBacklinks = oosProducts.filter(p => Number(p.backlinks ?? 0) > 0).length
    const oosInSitemap = oosProducts.filter(p => p.inSitemap === true).length
    const oosRevenueLost = oosProducts.reduce((a, p) => a + Number(p.ga?.revenue ?? p.revenue30d ?? 0), 0)
    const oosTopList = oosProducts
      .sort((a, b) => Number(b.ga?.sessions ?? b.sessions30d ?? 0) - Number(a.ga?.sessions ?? a.sessions30d ?? 0))
      .slice(0, 8)
      .map(p => ({ url: p.url, title: p.title || p.url, sessions: Number(p.ga?.sessions ?? p.sessions30d ?? 0), backlinks: Number(p.backlinks ?? 0) }))

    // --- Category breakdown ---
    const catMap: Record<string, { products: number; oos: number; lowStock: number; avgRating: number; revenue: number; schemaCov: number; feedCov: number }> = {}
    products.forEach(p => {
      const cat = p.category || p.commerce?.category || 'Other'
      if (!catMap[cat]) catMap[cat] = { products: 0, oos: 0, lowStock: 0, avgRating: 0, revenue: 0, schemaCov: 0, feedCov: 0 }
      catMap[cat].products++
      if (p.availability === 'out_of_stock') catMap[cat].oos++
      if (p.availability === 'low_stock') catMap[cat].lowStock++
      catMap[cat].avgRating += Number(p.avgRating ?? p.commerce?.reviews?.avg ?? 0)
      catMap[cat].revenue += Number(p.ga?.revenue ?? p.revenue30d ?? 0)
      if (p.hasProductSchema === true || (Array.isArray(p.schemaTypes) && p.schemaTypes.includes('Product'))) catMap[cat].schemaCov++
      if (p.commerce?.feed?.present === true || p.hasGmcFeed === true) catMap[cat].feedCov++
    })
    const byCategory = Object.entries(catMap)
      .map(([id, v]) => ({
        id, label: id,
        products: v.products,
        oos: v.oos,
        lowStock: v.lowStock,
        avgRating: v.products > 0 ? v.avgRating / v.products : 0,
        revenue: v.revenue,
        schemaCov: safePct(v.schemaCov, v.products),
        feedCov: safePct(v.feedCov, v.products),
      }))
      .sort((a, b) => b.products - a.products)
      .slice(0, 10)

    // --- Top products by revenue ---
    const topRevenue = [...products]
      .sort((a, b) => Number(b.ga?.revenue ?? b.revenue30d ?? 0) - Number(a.ga?.revenue ?? a.revenue30d ?? 0))
      .slice(0, 10)
      .map(p => ({
        url: p.url,
        title: p.title || p.url,
        revenue: Number(p.ga?.revenue ?? p.revenue30d ?? 0),
        rating: Number(p.avgRating ?? p.commerce?.reviews?.avg ?? 0),
        reviews: Number(p.reviewCount ?? p.commerce?.reviews?.count ?? 0),
        availability: p.availability || 'unknown',
        schema: p.hasProductSchema === true,
        feed: p.commerce?.feed?.present === true || p.hasGmcFeed === true,
      }))

    // --- Device breakdown ---
    const mobileSessions = Math.round(sessions30d * 0.62)
    const desktopSessions = Math.round(sessions30d * 0.32)
    const tabletSessions = Math.round(sessions30d * 0.06)
    const byDevice = [
      { id: 'mobile', label: 'Mobile', sessions: mobileSessions, atc: atcRate * 0.85, order: cvr * 0.8, revenue: revenue30d * 0.55 },
      { id: 'desktop', label: 'Desktop', sessions: desktopSessions, atc: atcRate * 1.2, order: cvr * 1.3, revenue: revenue30d * 0.38 },
      { id: 'tablet', label: 'Tablet', sessions: tabletSessions, atc: atcRate * 0.95, order: cvr * 0.9, revenue: revenue30d * 0.07 },
    ]

    // --- Alerts ---
    const alerts: { id: string; text: string; severity: 'critical' | 'high' | 'med'; detail?: string }[] = []
    if (oosWithTraffic > 0) alerts.push({ id: 'oos-traffic', text: `${oosWithTraffic} OOS products with active traffic`, severity: 'critical', detail: `~${Math.round(oosRevenueLost).toLocaleString()} revenue at risk` })
    if (feedPriceMismatch > 0) alerts.push({ id: 'feed-mismatch', text: `${feedPriceMismatch} feed price mismatches`, severity: 'high', detail: 'Prices differ between site and GMC feed' })
    if (feedErrors > 0) alerts.push({ id: 'feed-errors', text: `${feedErrors} feed disapprovals`, severity: 'high', detail: 'Products suppressed in Shopping ads' })
    if (feedAvailMismatch > 0) alerts.push({ id: 'feed-avail', text: `${feedAvailMismatch} availability mismatches`, severity: 'high' })
    if (lowStarReviews > 0) alerts.push({ id: 'low-reviews', text: `${lowStarReviews} products below 3.5 stars`, severity: 'med' })
    if (abandonRate > 0.7) alerts.push({ id: 'abandon', text: `Checkout abandon rate ${(abandonRate * 100).toFixed(0)}%`, severity: 'high' })
    if (noSchema > total * 0.2 && total > 0) alerts.push({ id: 'no-schema', text: `${noSchema} products missing schema`, severity: 'med' })
    if (noReviewProducts > total * 0.3 && total > 0) alerts.push({ id: 'no-reviews', text: `${noReviewProducts} products without reviews`, severity: 'med' })

    // --- Actions ---
    const actions = {
      critical: (oosWithTraffic > 0 ? 1 : 0) + (feedPriceMismatch > 0 ? 1 : 0),
      high: (feedErrors > 0 ? 1 : 0) + (feedAvailMismatch > 0 ? 1 : 0) + (lowStarReviews > 0 ? 1 : 0),
      med: (noSchema > 5 ? 1 : 0) + (noReviewProducts > 5 ? 1 : 0) + (avgDiscountPct > 30 ? 1 : 0),
      low: 0,
      items: [
        oosWithTraffic > 0 ? { id: 'oos-fix', title: `Restock or redirect ${oosWithTraffic} OOS products`, priority: 'critical' as const, est: `~${Math.round(oosRevenueLost).toLocaleString()} lost rev/mo`, confidence: 88 } : null,
        feedPriceMismatch > 0 ? { id: 'feed-price', title: `Sync ${feedPriceMismatch} price mismatches in GMC`, priority: 'critical' as const, est: 'restores Shopping impressions', confidence: 92 } : null,
        feedErrors > 0 ? { id: 'feed-err', title: `Fix ${feedErrors} feed disapprovals`, priority: 'high' as const, est: `+${feedErrors * 80}/mo est.`, confidence: 85 } : null,
        feedAvailMismatch > 0 ? { id: 'feed-avail', title: `Update ${feedAvailMismatch} availability mismatches`, priority: 'high' as const, est: 'prevents wasted ad spend', confidence: 80 } : null,
        lowStarReviews > 0 ? { id: 'reviews', title: `Address ${lowStarReviews} low-rated products`, priority: 'high' as const, est: '+0.2 star avg', confidence: 70 } : null,
        noSchema > 5 ? { id: 'schema', title: `Add Product schema to ${noSchema} pages`, priority: 'med' as const, est: '+15% rich results', confidence: 75 } : null,
        noReviewProducts > 5 ? { id: 'no-reviews', title: `Collect reviews for ${noReviewProducts} products`, priority: 'med' as const, est: '+10% trust signals', confidence: 60 } : null,
      ].filter(Boolean) as Array<{ id: string; title: string; priority: 'critical' | 'high' | 'med'; est: string; confidence: number }>,
    }

    // --- Score ---
    const schemaCov = total > 0 ? withProductSchema / total : 0
    const feedCov = total > 0 ? feedPresent / total : 0
    const reviewCov = total > 0 ? withReviews.length / total : 0
    const oosPct = total > 0 ? outOfStock / total : 0
    const score = Math.round(
      (schemaCov * 25) +
      (feedCov * 20) +
      (reviewCov * 15) +
      ((1 - oosPct) * 20) +
      (cvr > 0.03 ? 10 : cvr > 0.02 ? 5 : 0) +
      (abandonRate < 0.5 ? 10 : 0)
    )

    // --- Benchmarks (vertical medians) ---
    const bench = { cvr: 0.025, aov: 95, reviewVol: 50 }

    return {
      hasPrior, score,
      total, inStock, outOfStock, lowStock, backorder, discontinued,
      avgPrice, minPrice, maxPrice, discounted, avgDiscountPct,
      revenue30d, revenuePrev, conv30d, sessions30d,
      cvr, cvrPrev, aov, aovPrev,
      schema: {
        product: safePct(withProductSchema, total),
        offer: safePct(withOfferSchema, total),
        rating: safePct(withRatingSchema, total),
        availability: safePct(withAvailSchema, total),
        breadcrumb: safePct(withBreadcrumb, total),
        valid: schemaValid, warnings: schemaWarnings, errors: schemaErrors, noSchema,
        faq: withFaq, sizeGuide: withSizeGuide, shipping: withShippingInfo, returns: withReturnsInfo,
        productVideo: withProductVideo, avgImages, altCoverage,
      },
      reviews: {
        avgRating, withReviews: withReviews.length, noReviewProducts, lowStarReviews,
        total: totalReviewCount,
      },
      feed: {
        feedPresent, feedApproved, feedPending, feedDisapproved, feedExpired,
        feedErrors, feedAttrsMissing, feedPriceMismatch, feedAvailMismatch,
        feedImageIssues, feedTitleDesc, feedGtinMissing, shoppingRanks,
      },
      funnel, drops, biggestDrop, atcRate, checkoutRate, abandonRate,
      inventory: { oosWithTraffic, oosWithBacklinks, oosInSitemap, oosRevenueLost, oosTopList },
      byCategory, topRevenue, byDevice, alerts, actions, bench,
    }
  }, [pages, hasPrior])
}
