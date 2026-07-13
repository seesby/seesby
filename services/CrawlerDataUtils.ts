/**
 * CrawlerDataUtils.ts
 * 
 * D2+D3+D4 fix: Pure data transformation functions extracted from SeoCrawlerContext.
 * These have zero React dependencies and are fully testable in isolation.
 */

// ─── Text Normalization ───

export const normalizeComparableText = (value: any): string => {
    if (typeof value !== 'string') return '';
    return value.trim().replace(/\s+/g, ' ').toLowerCase();
};

export const clampScore = (value: number): number =>
    Math.max(0, Math.min(100, Math.round(value)));

export const countWhere = <T>(arr: T[], pred: (item: T) => boolean): number =>
    arr.filter(pred).length;

export const pct = (part: number, total: number): number =>
    total > 0 ? (part / total) * 100 : 0;

export const isThin = (p: any): boolean =>
    (p.wordCount || 0) < 300;


// ─── Formatting & Tones ───

export const ago = (iso?: string | number | null): string => {
  if (!iso) return '—'
  const t = typeof iso === 'string' ? Date.parse(iso) : iso
  const d = Math.max(0, (Date.now() - t) / 1000)
  if (d < 60)        return `${Math.round(d)}s ago`
  if (d < 3_600)     return `${Math.round(d / 60)}m ago`
  if (d < 86_400)    return `${Math.round(d / 3_600)}h ago`
  if (d < 30 * 86_400) return `${Math.round(d / 86_400)}d ago`
  return new Date(t).toISOString().slice(0, 10)
}

export const fmtInt = (n?: number | null): string =>
  n == null || Number.isNaN(Number(n)) ? '—' : Math.round(Number(n)).toLocaleString()

export const fmtPct = (n?: number | null, mul = 100, digits = 1): string =>
  n == null || Number.isNaN(Number(n)) ? '—' : `${(Number(n) * mul).toFixed(digits)}%`

export const fmtTime = (ms?: number | null): string =>
  ms == null ? '—' : ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(2)}s`

export const scoreTone = (n: number): 'good' | 'warn' | 'bad' =>
  n >= 75 ? 'good' : n >= 50 ? 'warn' : 'bad'



// ─── Page Merging ───

/**
 * Merges two page arrays by URL key, with `nextPages` overwriting `existingPages`.
 * Used during flush to reconcile in-memory state with incoming updates.
 */
export const mergePagesByUrl = (existingPages: any[], nextPages: any[]): any[] => {
    const pageMap = new Map<string, any>();

    existingPages.forEach((page) => {
        if (page?.url) pageMap.set(page.url, page);
    });

    nextPages.forEach((page) => {
        if (!page?.url) return;
        pageMap.set(page.url, {
            ...(pageMap.get(page.url) || {}),
            ...page
        });
    });

    return Array.from(pageMap.values());
};

// ─── Page Normalization ───

/**
 * Normalizes a raw crawled page object into a consistent shape.
 * Ensures all expected string/boolean/array fields have safe default values.
 * Returns null for invalid pages (missing URL).
 */
export const normalizeCrawlerPage = (page: any): any | null => {
    if (!page || typeof page.url !== 'string') return null;

    const url = page.url.trim();
    if (!url) return null;

    const redirectChain = Array.isArray(page.redirectChain)
        ? page.redirectChain.filter((item: unknown): item is string => typeof item === 'string' && item.length > 0)
        : [];

    let recommendedActionFactors = null;
    if (typeof page.recommendedActionFactors === 'string') {
        recommendedActionFactors = page.recommendedActionFactors;
    } else if (Array.isArray(page.recommendedActionFactors)) {
        try {
            recommendedActionFactors = JSON.stringify(page.recommendedActionFactors);
        } catch {
            recommendedActionFactors = null;
        }
    }

    return {
        ...page,
        url,
        status: typeof page.status === 'string' ? page.status : '',
        title: typeof page.title === 'string' ? page.title : '',
        metaDesc: typeof page.metaDesc === 'string' ? page.metaDesc : '',
        h1_1: typeof page.h1_1 === 'string' ? page.h1_1 : '',
        h1_2: typeof page.h1_2 === 'string' ? page.h1_2 : '',
        h2_1: typeof page.h2_1 === 'string' ? page.h2_1 : '',
        h2_2: typeof page.h2_2 === 'string' ? page.h2_2 : '',
        contentType: typeof page.contentType === 'string' ? page.contentType : '',
        canonical: typeof page.canonical === 'string' ? page.canonical : '',
        indexabilityStatus: typeof page.indexabilityStatus === 'string' ? page.indexabilityStatus : '',
        metaRobots1: typeof page.metaRobots1 === 'string' ? page.metaRobots1 : '',
        metaRobots2: typeof page.metaRobots2 === 'string' ? page.metaRobots2 : '',
        xRobots: typeof page.xRobots === 'string' ? page.xRobots : '',
        xRobotsNoindex: page.xRobotsNoindex === true,
        xRobotsNofollow: page.xRobotsNofollow === true,
        topicCluster: typeof page.topicCluster === 'string' ? page.topicCluster : '',
        funnelStage: typeof page.funnelStage === 'string' ? page.funnelStage : '',
        searchIntent: typeof page.searchIntent === 'string' ? page.searchIntent : '',
        language: typeof page.language === 'string' ? page.language : '',
        readability: typeof page.readability === 'string' ? page.readability : '',
        redirectUrl: typeof page.redirectUrl === 'string' ? page.redirectUrl : '',
        finalUrl: typeof page.finalUrl === 'string'
            ? page.finalUrl
            : (typeof page.redirectUrl === 'string' && page.redirectUrl)
                ? page.redirectUrl
                : url,
        redirectChain,
        redirectChainLength: Number.isFinite(Number(page.redirectChainLength))
            ? Number(page.redirectChainLength)
            : Math.max(0, redirectChain.length - 1),
        inlinksList: Array.isArray(page.inlinksList) ? page.inlinksList : [],
        outlinksList: Array.isArray(page.outlinksList) ? page.outlinksList : [],
        externalLinks: Array.isArray(page.externalLinks) ? page.externalLinks : [],
        images: Array.isArray(page.images) ? page.images : [],
        headingHierarchy: Array.isArray(page.headingHierarchy) ? page.headingHierarchy : [],
        schemaTypes: Array.isArray(page.schemaTypes) ? page.schemaTypes : [],
        fontDisplayValues: Array.isArray(page.fontDisplayValues) ? page.fontDisplayValues : [],
        uniqueThirdPartyDomains: Array.isArray(page.uniqueThirdPartyDomains) ? page.uniqueThirdPartyDomains : [],
        exposedEmails: Array.isArray(page.exposedEmails) ? page.exposedEmails : [],
        cookieDetails: Array.isArray(page.cookieDetails) ? page.cookieDetails : [],
        hasHsts: typeof page.hasHsts === 'boolean'
            ? page.hasHsts
            : (typeof page.hstsMissing === 'boolean' ? !page.hstsMissing : undefined),
        hasCsp: typeof page.hasCsp === 'boolean'
            ? page.hasCsp
            : (typeof page.cspPresent === 'boolean' ? page.cspPresent : undefined),
        hasXFrameOptions: typeof page.hasXFrameOptions === 'boolean'
            ? page.hasXFrameOptions
            : (typeof page.xFrameMissing === 'boolean' ? !page.xFrameMissing : undefined),
        hasXContentTypeOptions: typeof page.hasXContentTypeOptions === 'boolean'
            ? page.hasXContentTypeOptions
            : (typeof page.xContentTypeNoSniff === 'boolean' ? page.xContentTypeNoSniff : undefined),
        hasCacheControl: typeof page.hasCacheControl === 'boolean' ? page.hasCacheControl : undefined,
        hasEtag: typeof page.hasEtag === 'boolean' ? page.hasEtag : undefined,
        hasLastModified: typeof page.hasLastModified === 'boolean' ? page.hasLastModified : undefined,
        hasExpires: typeof page.hasExpires === 'boolean' ? page.hasExpires : undefined,
        hasViewportMeta: typeof page.hasViewportMeta === 'boolean' ? page.hasViewportMeta : undefined,
        viewportWidth: typeof page.viewportWidth === 'boolean' ? page.viewportWidth : undefined,
        sslValid: typeof page.sslValid === 'boolean' ? page.sslValid : undefined,
        responseHeaders: page.responseHeaders && typeof page.responseHeaders === 'object' ? page.responseHeaders : null,
        recommendedActionFactors,

        // Consolidated Volume Metrics (Main)
        mainKwVolume: Number(page.mainKwSearchVolume || page.mainKwEstimatedVolume || 0),
        mainKwVolumeSource: page.mainKwSearchVolume ? 'db' : (page.mainKwEstimatedVolume ? 'gsc' : 'none'),

        // Consolidated Volume Metrics (Best)
        bestKwVolume: Number(page.bestKwSearchVolume || page.bestKwEstimatedVolume || 0),
        bestKwVolumeSource: page.bestKwSearchVolume ? 'db' : (page.bestKwEstimatedVolume ? 'gsc' : 'none'),
    };
};

// ─── Sitemap State Builder ───

export type SitemapState = {
    totalUrls: number;
    sources: string[];
    coverageParsed?: boolean;
};

/**
 * Normalizes raw sitemap data into a consistent state object.
 * Returns null if no valid sitemap data exists.
 */
export const buildSitemapState = (
    totalUrls: unknown,
    sources: unknown,
    coverageParsed = true
): SitemapState | null => {
    const normalizedSources = Array.isArray(sources)
        ? sources.filter((source: unknown): source is string => typeof source === 'string' && source.trim().length > 0)
        : [];

    const parsedTotal = Number(totalUrls);
    const normalizedTotal = Number.isFinite(parsedTotal) && parsedTotal >= 0 ? parsedTotal : 0;

    if (normalizedSources.length === 0 && normalizedTotal <= 0) {
        return null;
    }

    return {
        totalUrls: normalizedTotal,
        sources: normalizedSources,
        coverageParsed
    };
};

// ─── Post-Crawl Scoring ───

import {
    calculateInternalPageRank,
    calculatePredictiveScore,
    calculateSpeedScore,
    calculatePageValue,
    classifyContentAge,
    checkIntentMatch
} from './StrategicIntelligence';
import { getExpectedCtr, getCtrGap } from './ExpectedCtrCurve';
import { classifyPageCategory, classifyPageCategoryRich, learnSiteSegments } from './PageCategoryClassifier';
import { 
    assignTechnicalAction, 
    assignContentAction, 
    getIndustryActions,
    derivePrimaryAndSecondaryAction 
} from '../packages/actions/src/index';
import { detectSiteType, type SiteTypeResult } from './SiteTypeDetector';
import { resolvePageLanguage } from './LanguageFallback';
import { detectDataAvailability } from './DataAvailability';


import { calculateContentDecayRisk } from './StrategicIntelligence';


/**
 * Shared post-crawl scoring pipeline.
 * Computes site type, PageRank, category/value/speed/search/action fields, and health scores.
 * Called from both Ghost Engine and WebSocket completion handlers.
 */
export const runPostCrawlScoring = async (completedPages: any[]): Promise<{ pages: any[]; siteType: SiteTypeResult }> => {
    if (completedPages.length === 0) {
        return {
            pages: completedPages,
            siteType: {
                detectedIndustry: 'general',
                industryConfidence: 0,
                detectedIndustrySecondary: undefined,
                detectedLanguage: 'unknown',
                detectedLanguages: [],
                detectedCms: 'custom',
                isMultiLanguage: false,
                isLowConfidence: true,
                cmsConfidence: 0
            }
        };

    }

    // Enrich each page with resolved language before site-type detection
    const enrichedPages = completedPages.map(p => ({
      ...p,
      language: p.language || resolvePageLanguage(p),
    }));

    const siteType = await detectSiteType(enrichedPages);
    const availability = detectDataAvailability(enrichedPages);

    const ranks = calculateInternalPageRank(enrichedPages);
    
    // A3 — Keyword Cannibalization Detection
    const keywordPageMap = new Map<string, string[]>();
    enrichedPages.forEach(p => {
        if (p.mainKeyword) {
            const kw = String(p.mainKeyword).toLowerCase().trim();
            if (!keywordPageMap.has(kw)) keywordPageMap.set(kw, []);
            keywordPageMap.get(kw)!.push(p.url);
        }
    });

    // B2 — WWW vs Non-WWW Consistency Detection
    const wwwInconsistency = detectWwwInconsistency(enrichedPages);

    // B3 — Hreflang Return Tag Verification
    const hreflangReturnMap = verifyHreflangReciprocity(enrichedPages);

    const siteCtx = {
        detectedIndustry: siteType.detectedIndustry,
        detectedLanguage: siteType.detectedLanguage,
        totalPages: enrichedPages.length,
        isMultiLanguage: siteType.isMultiLanguage,
        availability,
        rootHostname: ''
    };

    try {
        const firstUrl = completedPages.find((p) => p.crawlDepth === 0)?.url || completedPages[0]?.url;
        if (firstUrl) siteCtx.rootHostname = new URL(firstUrl).hostname.replace(/^www\./, '');
    } catch {
        // noop
    }

    // --- Pass 1: Initial classification (to gather clusters) ---
    const pass1Pages = enrichedPages.map(p => {
        const enriched = { ...p, inlinks: (p.inlinks || []).length };
        const cat = classifyPageCategoryRich(enriched, siteCtx);
        return { ...p, pageCategory: cat.category, pageCategoryConfidence: cat.confidence, pageCategorySignals: cat.signals };
    });

    // --- Site-learning phase ---
    const learned = learnSiteSegments(pass1Pages);
    const siteCtxWithLearning = { ...siteCtx, ...learned };

    // NAP cross-check for local industry
    const homepageNap = pass1Pages.find(p => p.crawlDepth === 0)?.napSnapshot;

    const pages = pass1Pages.map(p => {
        const internalPageRank = ranks[p.url] || 0;
        
        // Pass 2: Final classification with learned segments
        const enriched = { ...p, inlinks: (p.inlinks || []).length };
        const cat = classifyPageCategoryRich(enriched, siteCtxWithLearning);

        // Local NAP Signals
        let napMatchWithHomepage = false;
        let napHasDistinctAddress = false;
        if (homepageNap && p.napSnapshot && p.crawlDepth > 0) {
            const samePhone = p.napSnapshot.phones.some((f: string) => homepageNap.phones.includes(f));
            const sameAddr = p.napSnapshot.address === homepageNap.address;
            napMatchWithHomepage = samePhone || sameAddr;
            napHasDistinctAddress = p.napSnapshot.address !== '' && homepageNap.address !== '' && p.napSnapshot.address !== homepageNap.address;
        }

        // Apply Cannibalization flag
        let isCannibalized = false;
        if (p.mainKeyword) {
            const kw = String(p.mainKeyword).toLowerCase().trim();
            const urls = keywordPageMap.get(kw);
            isCannibalized = urls && urls.length > 1;
        }

        const pageCategory = cat.category;
        const pageCategoryConfidence = cat.confidence;
        const pageCategorySignals = cat.signals;
        const speedScore = calculateSpeedScore(p);
        const position = Number(p.gscPosition || 0);
        const actualCtr = Number(p.gscCtr || 0);
        const expectedCtr = getExpectedCtr(position);
        const ctrGap = position > 0 ? getCtrGap(position, actualCtr) : 0;
        const kwIntent = p.extractedKeywords?.[0]?.intent || null;
        const intentMatch = checkIntentMatch(p.searchIntent, kwIntent);
        const contentAge = classifyContentAge(p.visibleDate || p.wpPublishDate || p.lastModified);

        const updatedPage: any = {
            ...p,
            internalPageRank,
            isCannibalized,
            wwwInconsistency: wwwInconsistency.hasInconsistency,
            hreflangNoReturn: hreflangReturnMap.get(p.url) || false,
            pageCategory,
            pageCategoryConfidence,
            pageCategorySignals,
            napMatchWithHomepage,
            napHasDistinctAddress,
            speedScore,
            expectedCtr,
            ctrGap,
            intentMatch,
            contentAge
        };

        const contentDecayRisk = calculateContentDecayRisk(updatedPage);
        updatedPage.contentDecayRisk = contentDecayRisk;

        const { score: pageValueScore, tier: pageValueTier } = calculatePageValue(updatedPage, siteType.industry);
        updatedPage.pageValue = pageValueScore;
        updatedPage.pageValueTier = pageValueTier;
        updatedPage.healthScore = calculatePredictiveScore(updatedPage);

        const techAction     = assignTechnicalAction(updatedPage, siteCtx);
        const contentAction  = assignContentAction(updatedPage, siteCtx);
        const industryList   = getIndustryActions(updatedPage, siteCtx);

        updatedPage.technicalAction        = techAction.action;
        updatedPage.technicalActionReason  = techAction.reason;
        updatedPage.contentAction          = contentAction.action;
        updatedPage.contentActionReason    = contentAction.reason;
        updatedPage.industryAction         = industryList[0]?.action ?? null;
        updatedPage.industryActionReason   = industryList[0]?.reason ?? null;

        const { primary, secondary, all } = derivePrimaryAndSecondaryAction(
          techAction.action === 'Monitor' ? null : techAction,
          contentAction.action === 'No Action' ? null : contentAction,
          industryList,
        );

        updatedPage.primaryAction          = primary?.action   ?? 'Monitor';
        updatedPage.primaryActionCategory  = primary?.category ?? 'technical';
        updatedPage.actionPriority         = primary?.priority ?? 99;
        updatedPage.secondaryAction        = secondary?.action;
        updatedPage.secondaryActionCategory= secondary?.category;
        updatedPage.estimatedImpact        = all.reduce((s, a) => s + a.estimatedImpact, 0);

        return updatedPage;
    });

    return { pages, siteType };
};

/**
 * B2 — WWW vs Non-WWW Consistency
 */
export function detectWwwInconsistency(pages: any[]): { hasInconsistency: boolean; wwwUrls: number; nonWwwUrls: number } {
    let wwwUrls = 0;
    let nonWwwUrls = 0;
    pages.forEach(p => {
        try {
            const host = new URL(p.url).hostname;
            if (host.startsWith('www.')) wwwUrls++;
            else nonWwwUrls++;
        } catch {}
    });
    return { hasInconsistency: wwwUrls > 0 && nonWwwUrls > 0, wwwUrls, nonWwwUrls };
}

/**
 * B3 — Hreflang Return Tag Verification
 */
export function verifyHreflangReciprocity(pages: any[]): Map<string, boolean> {
    // Build a map: url -> hreflang targets
    const hreflangMap = new Map<string, Set<string>>();
    pages.forEach(p => {
        if (Array.isArray(p.hreflang) && p.hreflang.length > 0) {
            const targets = new Set(p.hreflang.map((h: any) => h.href).filter(Boolean).map((h: string) => h.trim()));
            hreflangMap.set(p.url, targets);
        }
    });

    // For each page, check if all its hreflang targets link back
    const results = new Map<string, boolean>();
    hreflangMap.forEach((targets, sourceUrl) => {
        let hasNonReciprocal = false;
        targets.forEach(targetUrl => {
            const targetHreflangs = hreflangMap.get(targetUrl);
            if (targetHreflangs && !targetHreflangs.has(sourceUrl)) {
                hasNonReciprocal = true;
            }
        });
        results.set(sourceUrl, hasNonReciprocal);
    });
    return results;
}

// ─── Owner Check Helper ───

export const hasOwn = (value: Record<string, any>, key: string): boolean =>
    Object.prototype.hasOwnProperty.call(value, key);

// ─── Export Utilities ───

import { ALL_COLUMNS } from '../components/seo-crawler/constants';

/**
 * R4 fix: Export pages as CSV file. Pure DOM/Blob operation extracted from context.
 * Triggers a browser download of all pages using ALL_COLUMNS as the schema.
 */
export const exportPagesAsCSV = (pages: any[]): void => {
    if (pages.length === 0) return;
    const headers = ALL_COLUMNS.map(col => col.label).join(',');
    const rows = pages.map(page =>
        ALL_COLUMNS.map(col => {
            const val = (page[col.key] === null || page[col.key] === undefined) ? '' : page[col.key];
            const strVal = typeof val === 'object' ? JSON.stringify(val) : String(val);
            return `"${strVal.replace(/"/g, '""')}"`;
        }).join(',')
    );
    const blob = new Blob([headers + "\n", ...rows.map(r => r + "\n")], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `seesby_scan_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

/**
 * R4 fix: Export raw session data as JSON. Pure async DOM/Blob operation extracted from context.
 * Returns a log message tuple for the caller to handle.
 */
export const exportRawSessionData = async (sessionId: string): Promise<{ success: boolean; message: string }> => {
    try {
        const { exportSessionData } = await import('./CrawlHistoryService');
        const blob = await exportSessionData(sessionId);
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `seesby_raw_dump_${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        return { success: true, message: 'Raw DB export complete.' };
    } catch (error) {
        console.error('Failed to export raw DB:', error);
        return { success: false, message: 'Failed to export raw DB.' };
    }
};
