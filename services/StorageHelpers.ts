// services/StorageHelpers.ts
// ── Shared storage helpers ────────────────────────────────────────────
// Lean page summary builder used by both StorageRouter and StorageTieringService.
// Single source of truth for what fields get synced to Turso warm tier.

import type { CrawledPage } from './CrawlDatabase';

/**
 * Create a lean page summary suitable for Turso cloud storage.
 * Strips heavy fields (full link lists, raw HTML references, etc.)
 * while keeping everything needed for dashboard, inspector, and WQA views.
 */
export function toLeanSummary(page: CrawledPage | Record<string, any>): Record<string, any> {
  return {
    url: page.url,
    finalUrl: page.finalUrl ?? page.url,
    title: page.title ?? null,
    metaDesc: page.metaDesc ?? null,
    h1_1: page.h1_1 ?? null,
    statusCode: page.statusCode ?? 0,
    contentType: page.contentType ?? null,
    crawlDepth: page.crawlDepth ?? 0,
    indexable: page.indexable !== false,
    loadTime: page.loadTime ?? 0,
    sizeBytes: (page as any).sizeBytes ?? 0,
    wordCount: page.wordCount ?? 0,
    inlinks: page.inlinks ?? 0,
    outlinks: (page.internalOutlinks ?? 0) + (page.externalOutlinks ?? 0),
    internalOutlinks: page.internalOutlinks ?? 0,
    externalOutlinks: page.externalOutlinks ?? 0,
    hash: (page as any).hash ?? page.content_hash ?? null,
    inSitemap: page.inSitemap ?? false,
    canonical: page.canonical ?? null,
    metaRobots: page.metaRobots ?? null,
    cmsType: page.cmsType ?? null,
    isHtmlPage: page.isHtmlPage ?? true,
    imageCount: (page as any).imageCount ?? 0,
    imagesWithoutAlt: page.missingAltImages ?? 0,

    // GSC enrichment
    gscClicks: page.gscClicks ?? null,
    gscImpressions: page.gscImpressions ?? null,
    gscCtr: page.gscCtr ?? null,
    gscPosition: page.gscPosition ?? null,
    mainKeyword: page.mainKeyword ?? null,
    bestKeyword: page.bestKeyword ?? null,

    // GA4 enrichment
    ga4Sessions: page.ga4Sessions ?? null,
    ga4Users: page.ga4Users ?? null,
    ga4Views: page.ga4Views ?? null,
    ga4BounceRate: page.ga4BounceRate ?? null,
    ga4Conversions: page.ga4Conversions ?? null,
    ga4Revenue: page.ga4Revenue ?? null,

    // Backlink data
    urlRating: page.urlRating ?? null,
    referringDomains: page.referringDomains ?? null,
    backlinks: page.backlinks ?? null,

    // Strategic scores
    opportunityScore: page.opportunityScore ?? null,
    businessValueScore: page.businessValueScore ?? null,
    authorityScore: page.authorityScore ?? null,
    recommendedAction: page.recommendedAction ?? null,

    // AI analysis
    summary: page.summary ?? null,
    contentQualityScore: page.contentQualityScore ?? null,
    eeatScore: page.eeatScore ?? null,
    sentiment: page.sentiment ?? null,
    searchIntent: page.searchIntent ?? null,

    // Phase E
    geoScore: page.geoScore ?? null,
    hasLlmsTxt: page.hasLlmsTxt ?? false,
    visualChangeDetected: page.visualChangeDetected ?? false,

    // CWV
    lcp: page.fieldLcp ?? page.lcp ?? null,
    cls: page.fieldCls ?? page.cls ?? null,

    // Dedup
    nearDuplicateMatch: page.nearDuplicateMatch ?? null,

    // Meta
    priorityScore: page.opportunityScore ?? page.businessValueScore ?? 0,
    _projectId: (page as any)._projectId ?? '',
    timestamp: page.timestamp ?? Date.now(),
  };
}
