// Bridges canonical metric keys with legacy crawl data keys
// Tries canonical key first, falls back to legacy key

const CANONICAL_TO_LEGACY: Record<string, string> = {
  // ─── Search ──────────────────────────────────────────────────────
  'p.search.gsc.clicks': 'gscClicks',
  'p.search.gsc.impressions': 'gscImpressions',
  'p.search.gsc.position': 'gscPosition',
  'p.search.gsc.ctr': 'gscCtr',
  'p.search.mainKw': 'mainKeyword',
  'p.search.mainKwPos': 'mainKwPosition',
  'p.search.bestKw': 'bestKeyword',
  'p.search.bestKwPos': 'bestKwPosition',
  'p.search.bestKwVolume': 'bestKwVolume',
  'p.search.totalKeywords': 'totalKeywords',
  'p.search.keywordsTop3': 'keywordsTop3',
  'p.search.keywordsTop10': 'keywordsTop10',
  'p.search.bing.clicks': 'bingClicks',
  'p.search.bing.impressions': 'bingImpressions',
  'p.search.bing.position': 'bingPosition',
  'p.search.bing.ctr': 'bingCtr',
  'p.search.bing.crawlErrors': 'bingCrawlErrors',

  // ─── Indexing ────────────────────────────────────────────────────
  'p.indexing.statusCode': 'statusCode',
  'p.indexing.canonical': 'canonical',
  'p.indexing.indexable': 'indexable',
  'p.indexing.robots': 'metaRobots1',
  'p.indexing.redirectUrl': 'redirectUrl',
  'p.indexing.finalUrl': 'finalUrl',
  'p.indexing.inSitemap': 'inSitemap',
  'p.indexing.depth': 'crawlDepth',
  'p.indexing.folderDepth': 'folderDepth',
  'p.indexing.contentType': 'contentType',
  'p.indexing.isHtmlPage': 'isHtmlPage',
  'p.indexing.redirectType': 'redirectType',
  'p.indexing.isSoft404': 'isSoft404',

  // ─── Content ─────────────────────────────────────────────────────
  'p.content.title': 'title',
  'p.content.titleLength': 'titleLength',
  'p.content.metaDesc': 'metaDesc',
  'p.content.metaDescLength': 'metaDescLength',
  'p.content.h1Text': 'h1_1',
  'p.content.wordCount': 'wordCount',
  'p.content.sentenceCount': 'sentenceCount',
  'p.content.readabilityFlesch': 'fleschScore',
  'p.content.textRatio': 'textRatio',
  'p.content.hash': 'hash',
  'p.content.language': 'language',
  'p.content.schemaErrors': 'schemaErrors',
  'p.content.schemaWarnings': 'schemaWarnings',
  'p.content.schemaTypes': 'schemaTypes',
  'p.content.missingAltImages': 'missingAltImages',
  'p.content.totalImages': 'totalImages',
  'p.content.topicCluster': 'topicCluster',
  'p.content.intentSearch': 'searchIntent',
  'p.content.funnelStage': 'funnelStage',
  'p.content.contentDecay': 'contentDecay',
  'p.content.visibleDate': 'visibleDate',
  'p.content.lastModified': 'lastModified',
  'p.content.isSoft404': 'isSoft404',
  'p.content.duplicateMatch': 'nearDuplicateMatch',
  'p.content.semanticSimilarity': 'semanticSimilarityScore',
  'p.content.eeatScore': 'eeatScore',
  'p.content.eeatBreakdown': 'eeatBreakdown',
  'p.content.spellingErrors': 'spellingErrors',
  'p.content.grammarErrors': 'grammarErrors',
  'p.content.bylinePresent': 'hasByline',
  'p.content.authorBioPresent': 'hasAuthorBio',
  'p.content.contentQuality': 'contentQualityScore',
  'p.content.contentFreshness': 'contentFreshness',
  'p.content.contentDecayRisk': 'contentDecayRisk',
  'p.content.pageCategory': 'pageCategory',
  'p.content.pageCategoryConfidence': 'pageCategoryConfidence',

  // ─── Tech ────────────────────────────────────────────────────────
  'p.tech.cwv.lcp': 'lcp',
  'p.tech.cwv.fcp': 'fcp',
  'p.tech.cwv.cls': 'cls',
  'p.tech.cwv.inp': 'inp',
  'p.tech.loadTime': 'loadTime',
  'p.tech.sizeBytes': 'sizeBytes',
  'p.tech.domNodes': 'domNodeCount',
  'p.tech.renderBlockingCss': 'renderBlockingCss',
  'p.tech.renderBlockingJs': 'renderBlockingJs',
  'p.tech.thirdPartyScripts': 'thirdPartyScriptCount',
  'p.tech.securityGrade': 'securityGrade',
  'p.tech.sslGrade': 'sslGrade',
  'p.tech.hydrationMismatch': 'hydrationMismatch',
  'p.tech.renderMode': 'renderMode',
  'p.tech.lighthousePerformance': 'lighthousePerformance',
  'p.tech.lighthouseAccessibility': 'lighthouseAccessibility',
  'p.tech.speedIndex': 'speedIndex',
  'p.tech.tbt': 'tbt',
  'p.tech.fieldLcp': 'fieldLcp',
  'p.tech.fieldCls': 'fieldCls',
  'p.tech.fieldInp': 'fieldInp',
  'p.tech.co2Mg': 'co2Mg',
  'p.tech.carbonRating': 'carbonRating',

  // ─── Links ───────────────────────────────────────────────────────
  'p.links.inlinks': 'inlinks',
  'p.links.outlinks': 'outlinks',
  'p.links.externalOutlinks': 'externalOutlinks',
  'p.links.internalPageRank': 'internalPageRank',
  'p.links.linkEquity': 'linkEquity',
  'p.links.brokenLinks': 'brokenLinks',
  'p.links.referringDomains': 'referringDomains',
  'p.links.backlinks': 'backlinks',
  'p.links.urlRating': 'urlRating',
  'p.links.anchorTextDiversity': 'anchorTextDiversity',
  'p.links.orphan': 'orphanPages',

  // ─── GA4 ─────────────────────────────────────────────────────────
  'p.ga.sessions': 'ga4Sessions',
  'p.ga.users': 'ga4Users',
  'p.ga.views': 'ga4Views',
  'p.ga.bounce': 'ga4BounceRate',
  'p.ga.conversions': 'ga4Conversions',
  'p.ga.conversionRate': 'ga4ConversionRate',
  'p.ga.revenue': 'ga4Revenue',
  'p.ga.transactions': 'ga4Transactions',
  'p.ga.addToCart': 'ga4AddtoCart',
  'p.ga.checkouts': 'ga4Checkouts',
  'p.ga.goalCompletions': 'ga4GoalCompletions',
  'p.ga.engagementRate': 'ga4EngagementRate',
  'p.ga.engagementTime': 'ga4EngagementTimePerPage',

  // ─── AI ──────────────────────────────────────────────────────────
  'p.ai.passageReadiness': 'passageReadiness',
  'p.ai.hasLlmsTxt': 'hasLlmsTxt',
  'p.ai.extractability': 'aiOverviewFit',
  'p.ai.botsAllowed': 'aiBotAccessSummary',
  'p.ai.aiLikelihood': 'aiLikelihood',

  // ─── Social ──────────────────────────────────────────────────────
  'p.social.hasTwitterCard': 'hasTwitterCard',
  'p.social.twitterCardType': 'twitterCardType',
  'p.social.socialLinks': 'socialLinks',

  // ─── Local ───────────────────────────────────────────────────────
  'p.local.gbpName': 'gbpName',
  'p.local.gbpAddress': 'gbpAddress',
  'p.local.gbpPhone': 'gbpPhone',
  'p.local.gbpReviewCount': 'gbpReviewCount',
  'p.local.gbpAvgRating': 'gbpAvgRating',
  'p.local.gbpCategories': 'gbpCategories',
  'p.local.gbpHours': 'gbpHours',
  'p.local.napMatch': 'napMatchWithHomepage',
  'p.local.napDistinctAddress': 'napHasDistinctAddress',

  // ─── CMS ─────────────────────────────────────────────────────────
  'fp.cms': 'cmsType',

  // ─── Derived scores ──────────────────────────────────────────────
  'p.score.techHealth': 'techHealthScore',
  'p.score.contentQuality': 'contentQualityScore',
  'p.score.searchVisibility': 'searchVisibilityScore',
  'p.score.engagement': 'engagementScore',
  'p.score.authority': 'authorityComputedScore',
  'p.score.business': 'businessComputedScore',
  'p.score.opportunity': 'opportunityScore',
  'p.score.businessValue': 'businessValueScore',
  'p.score.authorityScore': 'authorityScore',

  // ─── Actions ─────────────────────────────────────────────────────
  'p.actions.primary': 'recommendedAction',
  'p.actions.technical': 'technicalAction',
  'p.actions.content': 'contentAction',
  'p.actions.estimatedImpact': 'estimatedImpact',
  'p.actions.priority': 'actionPriority',

  // ─── External enrichment ─────────────────────────────────────────
  'p.tech.htmlErrors': 'htmlErrors',
  'p.tech.brokenImages': 'brokenImages',
  'p.tech.waybackSnapshots': 'waybackSnapshots',
  'p.tech.hasTrustBadges': 'hasTrustBadges',
  'p.tech.hasPricingPage': 'hasPricingPage',
  'p.tech.ctaTexts': 'ctaTexts',
  'p.ai.jsRenderDiff': 'jsRenderDiff',
  'p.ai.visualDiffPercent': 'visualDiffPercent',
  'p.ai.geoScore': 'geoScore',
  'p.ai.citationWorthiness': 'citationWorthiness',
  'p.ai.voiceSearchScore': 'voiceSearchScore',
};

// Get the legacy key for a canonical metric key
export function legacyKey(ckey: string): string | undefined {
  return CANONICAL_TO_LEGACY[ckey];
}

// Resolve a cell value from page data, trying canonical key first then legacy
export function resolveCellValue(
  pageData: Record<string, unknown>,
  columnKey: string,
): unknown {
  // Try canonical key directly
  if (pageData[columnKey] !== undefined) return pageData[columnKey];

  // Try legacy mapping
  const legacy = CANONICAL_TO_LEGACY[columnKey];
  if (legacy && pageData[legacy] !== undefined) return pageData[legacy];

  // Try dot-to-flat conversion (e.g. 'p.tech.cwv.lcp' -> 'cwvLcp')
  const flat = columnKey.split('.').pop() ?? columnKey;
  if (pageData[flat] !== undefined) return pageData[flat];

  return undefined;
}
