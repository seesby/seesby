/**
 * action-engine.ts
 *
 * Core action engine that evaluates 48+ action types across 10 namespaces.
 * Each action has trigger conditions, priority bands, effort estimates,
 * and is scored using: actionScore = (expectedDelta x confidenceTag x businessValue) / effortHours
 *
 * Integrates with the existing @seesby/types ActionDescriptor and SeverityBand.
 */

import type { Industry } from '@seesby/types';
import type { Mode } from '@seesby/types';

// ─── Priority Bands ─────────────────────────────────────────────────────

/**
 * Priority bands for action triage.
 * Distinct from the UI-level SeverityBand; these drive the action engine's
 * sorting and batch-grouping logic.
 *
 *   1. BLOCKING     – site crashing, 5xx, indexability lost on converters, security A/F
 *   2. REVENUE_LOSS – decay on revenue pages, OOS on high-GA, paid disapproved
 *   3. HIGH_LEVERAGE – near-miss kw, content refresh, CWV on converters
 *   4. STRATEGIC    – answer structure, cat tree, unlinked mentions
 *   5. HYGIENE      – alt text, titles, schema cleanups, generic anchors
 */
export type PriorityBand =
  | 'BLOCKING'
  | 'REVENUE_LOSS'
  | 'HIGH_LEVERAGE'
  | 'STRATEGIC'
  | 'HYGIENE';

export const PRIORITY_BAND_ORDER: readonly PriorityBand[] = [
  'BLOCKING',
  'REVENUE_LOSS',
  'HIGH_LEVERAGE',
  'STRATEGIC',
  'HYGIENE',
] as const;

export const PRIORITY_BAND_WEIGHT: Record<PriorityBand, number> = {
  BLOCKING: 100,
  REVENUE_LOSS: 80,
  HIGH_LEVERAGE: 60,
  STRATEGIC: 40,
  HYGIENE: 20,
};

// ─── Namespace ──────────────────────────────────────────────────────────

export type ActionNamespace =
  | 'content'
  | 'technical'
  | 'links'
  | 'search'
  | 'ai'
  | 'paid'
  | 'ux'
  | 'social'
  | 'commerce'
  | 'local';

export const NAMESPACE_MODE_MAP: Record<ActionNamespace, Mode> = {
  content: 'content',
  technical: 'technical',
  links: 'linksAuthority',
  search: 'content',
  ai: 'ai',
  paid: 'paid',
  ux: 'uxConversion',
  social: 'socialBrand',
  commerce: 'commerce',
  local: 'local',
};

// ─── Confidence Tags ────────────────────────────────────────────────────

/**
 * Multiplier applied to the expected delta based on how confident we are
 * that this specific action will produce results on this page.
 */
export type ConfidenceTag = 1.0 | 0.75 | 0.5 | 0.25;

// ─── Action Definition ──────────────────────────────────────────────────

export interface ActionDefinition {
  /** Unique code, e.g. "C01", "T08", "L04" */
  code: string;
  /** Human-readable name, e.g. "Rewrite Title Tag" */
  name: string;
  /** One of the 10 namespaces */
  namespace: ActionNamespace;
  /** Priority band */
  priorityBand: PriorityBand;
  /** Reference to a trigger function key (resolved in action-triggers.ts) */
  triggerKey: string;
  /** Estimated effort in hours (0.25 = 15 min, 1 = half day, 4 = full day, etc.) */
  effortHours: number;
  /**
   * Template for computing expected delta.
   * Actual computation happens in action-forecasting.ts.
   * This is a human-readable formula key, e.g. "title_ctr_gap * impressions"
   */
  expectedDeltaFormula: string;
  /** Forecast unit */
  forecastUnit: 'clicks' | 'sessions' | 'conversions' | 'revenue' | 'impressions' | 'none';
  /** Which modes this action applies to */
  modes: ReadonlyArray<Mode>;
  /** Which industries (empty = all) */
  industries?: ReadonlyArray<Industry>;
  /** Metric keys consumed by the trigger */
  requires: ReadonlyArray<string>;
  /** Minimum page traffic (sessions) to consider this action */
  minTraffic?: number;
}

// ─── Triggered Action (instance) ────────────────────────────────────────

export interface Action {
  /** Reference to the definition */
  definition: ActionDefinition;
  /** The page URL this action targets */
  targetUrl: string;
  /** Computed action score */
  score: number;
  /** Computed expected delta (in forecastUnit) */
  expectedDelta: number;
  /** Confidence tag used for scoring */
  confidenceTag: ConfidenceTag;
  /** Business value multiplier (1-5) */
  businessValue: number;
  /** Why this action was triggered (human-readable) */
  reason: string;
  /** Optional: sibling / cluster URLs also affected */
  relatedUrls?: string[];
  /** Timestamp */
  computedAt: number;
}

// ─── Evaluation Context ─────────────────────────────────────────────────

export interface EvalContext {
  pageData: PageData;
  siteData: SiteData;
  fingerprint: FingerprintData;
}

export interface PageData {
  url: string;
  statusCode: number;
  title?: string;
  titleLength?: number;
  metaDescription?: string;
  metaDescLength?: number;
  h1?: string;
  h1Count?: number;
  wordCount: number;
  readabilityScore?: number;
  schemaTypes?: string[];
  schemaErrors?: string[];
  images?: Array<{ src: string; alt?: string; width?: number; height?: number }>;
  internalLinks?: number;
  externalLinks?: number;
  outboundLinks?: number;
  noindex?: boolean;
  canonicalUrl?: string;
  canonicalSelfRef?: boolean;
  hreflang?: Array<{ lang: string; href: string; valid: boolean }>;
  robotsDirectives?: string[];
  mixedContent?: boolean;
  hasHttpsRedirect?: boolean;
  redirectChain?: string[];
  redirectCount?: number;
  responseTime?: number;
  contentLength?: number;
  ogTags?: Record<string, string>;
  twitterTags?: Record<string, string>;
  securityHeaders?: Record<string, string>;
  securityGrade?: string;
  cwv?: {
    lcp?: number;
    fid?: number;
    cls?: number;
    inp?: number;
  };
  a11y?: {
    score?: number;
    issues?: number;
  };
  jsSize?: number;
  totalSize?: number;
  hasLlmsTxt?: boolean;
  hasSpeakable?: boolean;
  hasEntityMarkup?: boolean;
  hasAnswerStructure?: boolean;
  formFields?: number;
  rageClickHotspots?: boolean;
  ctaAboveFold?: boolean;
  soft404?: boolean;
  isSitemapIncluded?: boolean;
  lastModified?: string;
  crawlDepth?: number;
  inlinks?: number;
  backlinks?: number;
  backlinksBucket?: 'none' | 'low' | 'medium' | 'high';
  trafficBucket?: 'none' | 'low' | 'medium' | 'high';
  pageRankBucket?: 'none' | 'low' | 'medium' | 'high';
  impressions?: number;
  clicks?: number;
  ctr?: number;
  position?: number;
  avgPosition?: number;
  conversions?: number;
  revenue?: number;
  pageIntent?: string;
  pageCluster?: string;
  isConverter?: boolean;
  isRevenuePage?: boolean;
  ageDays?: number;
  lastRefreshedDays?: number;
  hasFaqSchema?: boolean;
  hasHowtoSchema?: boolean;
  hasAuthorSchema?: boolean;
  isDuplicate?: boolean;
  duplicateOf?: string;
  overlapScore?: number;
  thinContent?: boolean;
  nearMissKeywords?: Array<{ keyword: string; position: number; impressions: number }>;
  lostKeywords?: Array<{ keyword: string; prevPosition: number; impressions: number }>;
  featuredSnippetOpportunity?: boolean;
  cannibalization?: Array<{ url: string; sharedKeywords: string[] }>;
  aiBotBlocked?: boolean;
  unlinkedMentions?: Array<{ sourceUrl: string; anchorText: string }>;
  brokenOutboundLinks?: string[];
  toxicBacklinks?: number;
  anchorDiversity?: number;
  brandAnchorsPct?: number;
  // Paid-specific
  adDisapproved?: boolean;
  adFatigued?: boolean;
  qualityScore?: number;
  campaignBudget?: number;
  negativeKeywords?: string[];
  adAssets?: number;
  landingPageRelevance?: number;
  messageMatch?: number;
  // UX-specific
  formAbandonmentRate?: number;
  bounceRate?: number;
  exitRate?: number;
  // Social-specific
  crisisMentions?: boolean;
  socialPostFrequency?: number;
  shortVideoRatio?: number;
  // Commerce-specific
  feedAttributesMissing?: string[];
  outOfStock?: boolean;
  stockLevel?: number;
  categoryDepth?: number;
  reviewSchemaPresent?: boolean;
  // Local-specific
  nap?: { name: string; address: string; phone: string };
  napConsistent?: boolean;
  gbpClaimed?: boolean;
  reviewResponses?: number;
  reviewCount?: number;
  hasServiceAreaPage?: boolean;
  // Technical extras
  cwvScore?: 'good' | 'needs-improvement' | 'poor';
  indexabilityStatus?: 'indexable' | 'non-indexable' | 'blocked' | 'canonicalized';
}

export interface SiteData {
  totalPages: number;
  totalRevenue: number;
  monthlyTraffic: number;
  averageCwv?: 'good' | 'needs-improvement' | 'poor';
  siteStatus?: 'up' | 'degraded' | 'down';
  fiveXXPages?: number;
  fourXXPages?: number;
  soft404Pages?: number;
  noindexCount?: number;
  sitemapPages?: number;
  avgBacklinks?: number;
  domainAuthority?: number;
  organicTraffic?: number;
  organicTrafficDelta?: number;
  paidTraffic?: number;
  conversionRate?: number;
  revenuePerSession?: number;
}

export interface FingerprintData {
  industry: Industry;
  cms?: string;
  language?: string;
  size?: number;
  pageRankBucket?: 'none' | 'low' | 'medium' | 'high';
  backlinksBucket?: 'none' | 'low' | 'medium' | 'high';
  trafficBucket?: 'none' | 'low' | 'medium' | 'high';
}

// ─── Action Registry ────────────────────────────────────────────────────

const registry = new Map<string, ActionDefinition>();

/**
 * Register a single action definition. Overwrites if the code already exists.
 */
export function registerAction(def: ActionDefinition): void {
  registry.set(def.code, def);
}

/**
 * Get a registered action definition by code.
 */
export function getActionDef(code: string): ActionDefinition | undefined {
  return registry.get(code);
}

/**
 * Get all registered action definitions.
 */
export function getAllActionDefs(): ActionDefinition[] {
  return Array.from(registry.values());
}

/**
 * Get all registered action definitions for a specific namespace.
 */
export function getActionsByNamespace(namespace: ActionNamespace): ActionDefinition[] {
  return Array.from(registry.values()).filter(a => a.namespace === namespace);
}

/**
 * Get all registered action definitions for a specific priority band.
 */
export function getActionsByPriorityBand(band: PriorityBand): ActionDefinition[] {
  return Array.from(registry.values()).filter(a => a.priorityBand === band);
}

// ─── Score Computation ──────────────────────────────────────────────────

/**
 * Compute the action score:
 *   actionScore = (expectedDelta x confidenceTag x businessValue) / effortHours
 *
 * Higher score = do first.
 * BLOCKING actions get a floor multiplier so they always sort above non-BLOCKING.
 */
export function computeActionScore(
  action: {
    definition: ActionDefinition;
    expectedDelta: number;
    confidenceTag: ConfidenceTag;
    businessValue: number;
  },
  context?: EvalContext,
): number {
  const { definition, expectedDelta, confidenceTag, businessValue } = action;

  if (definition.effortHours <= 0) return 0;

  const raw =
    (expectedDelta * confidenceTag * businessValue) / definition.effortHours;

  // Floor: BLOCKING actions always score >= 1000 so they surface first
  if (definition.priorityBand === 'BLOCKING') {
    return Math.max(1000, raw);
  }

  return Math.round(raw * 100) / 100;
}

/**
 * Compute the business value multiplier (1-5) based on page and site context.
 */
export function computeBusinessValue(page: PageData, site: SiteData): number {
  let bv = 1;

  // Revenue page multiplier
  if (page.isRevenuePage || page.isConverter) bv += 2;

  // High-traffic page
  if (page.trafficBucket === 'high') bv += 1;
  else if (page.trafficBucket === 'medium') bv += 0.5;

  // High-authority page
  if (page.pageRankBucket === 'high') bv += 0.5;

  // Site-level health pressure
  if (site.siteStatus === 'down') bv += 1;
  else if (site.siteStatus === 'degraded') bv += 0.5;

  // High conversion rate site
  if (site.conversionRate && site.conversionRate > 0.03) bv += 0.5;

  return Math.min(5, Math.round(bv));
}

/**
 * Compute confidence tag based on trigger signal strength and data availability.
 */
export function computeConfidence(
  signalStrength: number, // 0-1
  dataAvailability: number, // 0-1
): ConfidenceTag {
  const combined = signalStrength * 0.7 + dataAvailability * 0.3;
  if (combined >= 0.8) return 1.0;
  if (combined >= 0.55) return 0.75;
  if (combined >= 0.3) return 0.5;
  return 0.25;
}

// ─── Main Evaluation Pipeline ───────────────────────────────────────────

// Lazy-import triggers and forecasting to avoid circular deps.
// These are set by initActionEngine() below.
let triggerFn: ((triggerKey: string, pageData: PageData, siteData: SiteData) => {
  triggered: boolean;
  reason: string;
  signalStrength: number;
}) | null = null;

let forecastFn: (
  code: string,
  context: EvalContext,
) => { expectedDelta: number; confidenceTag: ConfidenceTag } | null = null;

/**
 * Wire up the trigger and forecast functions.
 * Call once at startup after importing action-triggers and action-forecasting.
 */
export function initActionEngine(opts: {
  triggerEvaluator: typeof triggerFn;
  forecastEvaluator: typeof forecastFn;
}): void {
  triggerFn = opts.triggerEvaluator;
  forecastFn = opts.forecastEvaluator;
}

/**
 * Evaluate all registered actions against a page + site context.
 * Returns triggered actions sorted by score (highest first).
 */
export function evaluateActions(
  pageData: PageData,
  siteData: SiteData,
  fingerprint: FingerprintData,
): Action[] {
  if (!triggerFn || !forecastFn) {
    throw new Error(
      'Action engine not initialized. Call initActionEngine() first.',
    );
  }

  const context: EvalContext = { pageData, siteData, fingerprint };
  const now = Date.now();
  const results: Action[] = [];

  for (const def of registry.values()) {
    // ── Gate checks ──
    // Skip if page doesn't meet minimum traffic threshold
    if (def.minTraffic != null) {
      const traffic = pageData.impressions ?? 0;
      if (traffic < def.minTraffic) continue;
    }

    // ── Trigger evaluation ──
    const triggerResult = triggerFn(def.triggerKey, pageData, siteData);
    if (!triggerResult.triggered) continue;

    // ── Forecast ──
    const forecastResult = forecastFn(def.code, context);
    const expectedDelta = forecastResult?.expectedDelta ?? 0;
    const confidenceTag =
      forecastResult?.confidenceTag ??
      computeConfidence(triggerResult.signalStrength, 0.5);

    // ── Business value ──
    const businessValue = computeBusinessValue(pageData, siteData);

    // ── Score ──
    const score = computeActionScore({
      definition: def,
      expectedDelta,
      confidenceTag,
      businessValue,
    });

    results.push({
      definition: def,
      targetUrl: pageData.url,
      score,
      expectedDelta,
      confidenceTag,
      businessValue,
      reason: triggerResult.reason,
      computedAt: now,
    });
  }

  // Sort by score descending (highest priority first)
  results.sort((a, b) => b.score - a.score);

  return results;
}

// ─── Band Grouping Helpers ──────────────────────────────────────────────

/**
 * Group an array of actions by their priority band.
 */
export function groupByPriorityBand(
  actions: Action[],
): Record<PriorityBand, Action[]> {
  const grouped: Record<PriorityBand, Action[]> = {
    BLOCKING: [],
    REVENUE_LOSS: [],
    HIGH_LEVERAGE: [],
    STRATEGIC: [],
    HYGIENE: [],
  };

  for (const action of actions) {
    grouped[action.definition.priorityBand].push(action);
  }

  return grouped;
}

/**
 * Get the top N actions, de-duplicated by namespace (at most one per namespace).
 */
export function getTopDiversifiedActions(
  actions: Action[],
  maxCount: number = 10,
): Action[] {
  const seen = new Set<string>();
  const result: Action[] = [];

  for (const action of actions) {
    if (result.length >= maxCount) break;
    if (seen.has(action.definition.namespace)) continue;
    seen.add(action.definition.namespace);
    result.push(action);
  }

  return result;
}

// ─── All 48 Action Definitions ──────────────────────────────────────────

const ACTION_DEFINITIONS: ActionDefinition[] = [
  // ── Content (C01-C17) ──
  {
    code: 'C01', name: 'Rewrite Title Tag', namespace: 'content',
    priorityBand: 'HYGIENE', triggerKey: 'C01', effortHours: 0.5,
    expectedDeltaFormula: 'title_ctr_gap * impressions', forecastUnit: 'clicks',
    modes: ['content', 'fullAudit', 'wqa'], requires: ['title', 'titleLength', 'ctr', 'position'],
  },
  {
    code: 'C02', name: 'Rewrite Meta Description', namespace: 'content',
    priorityBand: 'HYGIENE', triggerKey: 'C02', effortHours: 0.5,
    expectedDeltaFormula: 'meta_ctr_gap * impressions', forecastUnit: 'clicks',
    modes: ['content', 'fullAudit', 'wqa'], requires: ['metaDescription', 'metaDescLength', 'ctr'],
  },
  {
    code: 'C03', name: 'Refresh Stale Content', namespace: 'content',
    priorityBand: 'HIGH_LEVERAGE', triggerKey: 'C03', effortHours: 2,
    expectedDeltaFormula: 'decay_clicks * recovery_rate', forecastUnit: 'clicks',
    modes: ['content', 'fullAudit'], requires: ['lastRefreshedDays', 'clicks', 'ageDays'],
  },
  {
    code: 'C04', name: 'Expand Thin Content', namespace: 'content',
    priorityBand: 'HIGH_LEVERAGE', triggerKey: 'C04', effortHours: 3,
    expectedDeltaFormula: 'thin_gap * target_word_count_ratio', forecastUnit: 'clicks',
    modes: ['content', 'fullAudit', 'wqa'], requires: ['wordCount', 'thinContent'],
  },
  {
    code: 'C05', name: 'Merge Cannibalized Pages', namespace: 'content',
    priorityBand: 'HIGH_LEVERAGE', triggerKey: 'C05', effortHours: 4,
    expectedDeltaFormula: 'cannibal_traffic_loss * merge_benefit_factor', forecastUnit: 'clicks',
    modes: ['content', 'fullAudit'], requires: ['cannibalization'],
  },
  {
    code: 'C06', name: 'Split Overlapping Content', namespace: 'content',
    priorityBand: 'STRATEGIC', triggerKey: 'C06', effortHours: 6,
    expectedDeltaFormula: 'overlap_score * potential_separation_gain', forecastUnit: 'clicks',
    modes: ['content', 'fullAudit'], requires: ['overlapScore'],
  },
  {
    code: 'C07', name: 'Deprecate Low-Value Page', namespace: 'content',
    priorityBand: 'HYGIENE', triggerKey: 'C07', effortHours: 0.25,
    expectedDeltaFormula: 'crawl_budget_recovery * 0.1', forecastUnit: 'none',
    modes: ['content', 'fullAudit', 'technical'], requires: ['clicks', 'conversions'],
  },
  {
    code: 'C08', name: 'Redirect to Stronger Page', namespace: 'content',
    priorityBand: 'HIGH_LEVERAGE', triggerKey: 'C08', effortHours: 0.5,
    expectedDeltaFormula: 'cannibal_weak_page_traffic * redirect_capture_rate', forecastUnit: 'clicks',
    modes: ['content', 'fullAudit'], requires: ['cannibalization'],
  },
  {
    code: 'C09', name: 'Add FAQ Schema', namespace: 'content',
    priorityBand: 'HYGIENE', triggerKey: 'C09', effortHours: 1,
    expectedDeltaFormula: 'faq_rich_result_clicks * 0.15', forecastUnit: 'clicks',
    modes: ['content', 'fullAudit', 'ai'], requires: ['hasFaqSchema', 'pageIntent'],
  },
  {
    code: 'C10', name: 'Add HowTo Schema', namespace: 'content',
    priorityBand: 'HYGIENE', triggerKey: 'C10', effortHours: 1,
    expectedDeltaFormula: 'howto_rich_result_clicks * 0.12', forecastUnit: 'clicks',
    modes: ['content', 'fullAudit', 'ai'], requires: ['hasHowtoSchema', 'pageIntent'],
  },
  {
    code: 'C11', name: 'Add Author E-E-A-T Signals', namespace: 'content',
    priorityBand: 'STRATEGIC', triggerKey: 'C11', effortHours: 1.5,
    expectedDeltaFormula: 'authority_boost * ymyl_traffic_share', forecastUnit: 'clicks',
    modes: ['content', 'fullAudit'], requires: ['hasAuthorSchema'],
  },
  {
    code: 'C12', name: 'Rebuild Topic Cluster', namespace: 'content',
    priorityBand: 'STRATEGIC', triggerKey: 'C12', effortHours: 8,
    expectedDeltaFormula: 'cluster_traffic * interlinking_boost', forecastUnit: 'clicks',
    modes: ['content', 'fullAudit'], requires: ['pageCluster'],
  },
  {
    code: 'C13', name: 'Fix Duplicate Content', namespace: 'content',
    priorityBand: 'HIGH_LEVERAGE', triggerKey: 'C13', effortHours: 1,
    expectedDeltaFormula: 'duplicate_traffic_recovery', forecastUnit: 'clicks',
    modes: ['content', 'fullAudit', 'technical'], requires: ['isDuplicate', 'duplicateOf'],
  },
  {
    code: 'C14', name: 'Batch Add Alt Text', namespace: 'content',
    priorityBand: 'HYGIENE', triggerKey: 'C14', effortHours: 2,
    expectedDeltaFormula: 'image_search_traffic * 0.05', forecastUnit: 'clicks',
    modes: ['content', 'fullAudit', 'wqa'], requires: ['images'],
  },
  {
    code: 'C15', name: 'Fix Readability Issues', namespace: 'content',
    priorityBand: 'HYGIENE', triggerKey: 'C15', effortHours: 2,
    expectedDeltaFormula: 'readability_engagement_boost * organic_share', forecastUnit: 'clicks',
    modes: ['content', 'fullAudit', 'wqa'], requires: ['readabilityScore'],
  },
  {
    code: 'C16', name: 'Rewrite AI-Generated Text', namespace: 'content',
    priorityBand: 'HYGIENE', triggerKey: 'C16', effortHours: 2,
    expectedDeltaFormula: 'ai_penalty_risk * organic_exposure', forecastUnit: 'clicks',
    modes: ['content', 'fullAudit', 'ai'], requires: ['wordCount'],
  },
  {
    code: 'C17', name: 'Add Internal Links', namespace: 'content',
    priorityBand: 'HYGIENE', triggerKey: 'C17', effortHours: 1,
    expectedDeltaFormula: 'internal_link_equity_boost', forecastUnit: 'clicks',
    modes: ['content', 'fullAudit', 'linksAuthority'], requires: ['internalLinks'],
  },

  // ── Technical (T01-T16) ──
  {
    code: 'T01', name: 'Fix Indexability', namespace: 'technical',
    priorityBand: 'BLOCKING', triggerKey: 'T01', effortHours: 0.5,
    expectedDeltaFormula: 'blocked_revenue_pages * expected_crawl_rate', forecastUnit: 'clicks',
    modes: ['technical', 'fullAudit'], requires: ['indexabilityStatus', 'noindex'],
  },
  {
    code: 'T02', name: 'Fix 5xx Errors', namespace: 'technical',
    priorityBand: 'BLOCKING', triggerKey: 'T02', effortHours: 0.25,
    expectedDeltaFormula: 'five_xx_pages * revenue_per_page', forecastUnit: 'revenue',
    modes: ['technical', 'fullAudit'], requires: ['statusCode'],
  },
  {
    code: 'T03', name: 'Fix 4xx Errors', namespace: 'technical',
    priorityBand: 'BLOCKING', triggerKey: 'T03', effortHours: 0.5,
    expectedDeltaFormula: 'four_xx_pages * expected_recovery_rate', forecastUnit: 'clicks',
    modes: ['technical', 'fullAudit'], requires: ['statusCode'],
  },
  {
    code: 'T04', name: 'Fix Redirect Chains', namespace: 'technical',
    priorityBand: 'HYGIENE', triggerKey: 'T04', effortHours: 0.5,
    expectedDeltaFormula: 'redirect_chain_speed_gain * affected_pages', forecastUnit: 'none',
    modes: ['technical', 'fullAudit'], requires: ['redirectChain', 'redirectCount'],
  },
  {
    code: 'T05', name: 'Fix Hreflang Tags', namespace: 'technical',
    priorityBand: 'HYGIENE', triggerKey: 'T05', effortHours: 1,
    expectedDeltaFormula: 'hreflang_traffic_recovery * international_share', forecastUnit: 'clicks',
    modes: ['technical', 'fullAudit'], requires: ['hreflang'],
  },
  {
    code: 'T06', name: 'Fix Schema Errors', namespace: 'technical',
    priorityBand: 'HYGIENE', triggerKey: 'T06', effortHours: 1,
    expectedDeltaFormula: 'schema_error_count * rich_result_recovery', forecastUnit: 'clicks',
    modes: ['technical', 'fullAudit'], requires: ['schemaErrors'],
  },
  {
    code: 'T07', name: 'Upgrade Schema Coverage', namespace: 'technical',
    priorityBand: 'STRATEGIC', triggerKey: 'T07', effortHours: 2,
    expectedDeltaFormula: 'missing_schema_opportunity * rich_result_ctr_boost', forecastUnit: 'clicks',
    modes: ['technical', 'fullAudit', 'ai'], requires: ['schemaTypes'],
  },
  {
    code: 'T08', name: 'Improve Core Web Vitals', namespace: 'technical',
    priorityBand: 'HIGH_LEVERAGE', triggerKey: 'T08', effortHours: 4,
    expectedDeltaFormula: 'cwv_traffic_impact * converter_page_share', forecastUnit: 'clicks',
    modes: ['technical', 'fullAudit'], requires: ['cwv', 'cwvScore'],
  },
  {
    code: 'T09', name: 'Reduce JS Dependency', namespace: 'technical',
    priorityBand: 'HIGH_LEVERAGE', triggerKey: 'T09', effortHours: 4,
    expectedDeltaFormula: 'js_size_reduction * render_time_improvement', forecastUnit: 'none',
    modes: ['technical', 'fullAudit'], requires: ['jsSize', 'cwv'],
  },
  {
    code: 'T10', name: 'Fix Security Headers', namespace: 'technical',
    priorityBand: 'BLOCKING', triggerKey: 'T10', effortHours: 0.5,
    expectedDeltaFormula: 'security_grade_impact * trust_signal', forecastUnit: 'none',
    modes: ['technical', 'fullAudit'], requires: ['securityHeaders', 'securityGrade'],
  },
  {
    code: 'T11', name: 'Rotate SSL Certificate', namespace: 'technical',
    priorityBand: 'BLOCKING', triggerKey: 'T11', effortHours: 0.25,
    expectedDeltaFormula: 'ssl_expiry_risk * 1000', forecastUnit: 'none',
    modes: ['technical', 'fullAudit'], requires: ['securityHeaders'],
  },
  {
    code: 'T12', name: 'Fix Accessibility Issues', namespace: 'technical',
    priorityBand: 'HYGIENE', triggerKey: 'T12', effortHours: 2,
    expectedDeltaFormula: 'a11y_traffic_inclusion * 0.05', forecastUnit: 'clicks',
    modes: ['technical', 'fullAudit', 'uxConversion'], requires: ['a11y'],
  },
  {
    code: 'T13', name: 'Fix Sitemap Issues', namespace: 'technical',
    priorityBand: 'HYGIENE', triggerKey: 'T13', effortHours: 0.5,
    expectedDeltaFormula: 'sitemap_coverage_gap * crawl_efficiency', forecastUnit: 'none',
    modes: ['technical', 'fullAudit'], requires: ['isSitemapIncluded'],
  },
  {
    code: 'T14', name: 'Fix Mixed Content', namespace: 'technical',
    priorityBand: 'BLOCKING', triggerKey: 'T14', effortHours: 0.5,
    expectedDeltaFormula: 'mixed_content_blocked_pages * revenue_per_page', forecastUnit: 'revenue',
    modes: ['technical', 'fullAudit'], requires: ['mixedContent'],
  },
  {
    code: 'T15', name: 'Remove Soft 404s', namespace: 'technical',
    priorityBand: 'HIGH_LEVERAGE', triggerKey: 'T15', effortHours: 0.5,
    expectedDeltaFormula: 'soft_404_count * crawl_budget_recovery', forecastUnit: 'none',
    modes: ['technical', 'fullAudit'], requires: ['soft404'],
  },
  {
    code: 'T16', name: 'Fix Canonical Loops', namespace: 'technical',
    priorityBand: 'BLOCKING', triggerKey: 'T16', effortHours: 0.5,
    expectedDeltaFormula: 'canonical_loop_pages * indexability_recovery', forecastUnit: 'clicks',
    modes: ['technical', 'fullAudit'], requires: ['canonicalUrl', 'canonicalSelfRef'],
  },

  // ── Links (L01-L07) ──
  {
    code: 'L01', name: 'Add Internal Links', namespace: 'links',
    priorityBand: 'HYGIENE', triggerKey: 'L01', effortHours: 1,
    expectedDeltaFormula: 'orphan_page_link_equity_boost', forecastUnit: 'clicks',
    modes: ['linksAuthority', 'fullAudit'], requires: ['internalLinks'],
  },
  {
    code: 'L02', name: 'Redistribute PageRank', namespace: 'links',
    priorityBand: 'STRATEGIC', triggerKey: 'L02', effortHours: 2,
    expectedDeltaFormula: 'pr_redistribution_gain * high_value_pages', forecastUnit: 'clicks',
    modes: ['linksAuthority', 'fullAudit'], requires: ['internalLinks', 'pageRankBucket'],
  },
  {
    code: 'L03', name: 'Remove Toxic Backlinks', namespace: 'links',
    priorityBand: 'REVENUE_LOSS', triggerKey: 'L03', effortHours: 2,
    expectedDeltaFormula: 'toxic_backlink_penalty * domain_authority_risk', forecastUnit: 'clicks',
    modes: ['linksAuthority', 'fullAudit'], requires: ['toxicBacklinks'],
  },
  {
    code: 'L04', name: 'Reclaim Unlinked Mentions', namespace: 'links',
    priorityBand: 'STRATEGIC', triggerKey: 'L04', effortHours: 1,
    expectedDeltaFormula: 'unlinked_mention_value * outreach_success_rate', forecastUnit: 'clicks',
    modes: ['linksAuthority', 'fullAudit'], requires: ['unlinkedMentions'],
  },
  {
    code: 'L05', name: 'Fix Broken Links', namespace: 'links',
    priorityBand: 'REVENUE_LOSS', triggerKey: 'L05', effortHours: 0.5,
    expectedDeltaFormula: 'broken_link_traffic_loss * link_equity_recovery', forecastUnit: 'clicks',
    modes: ['linksAuthority', 'fullAudit'], requires: ['brokenOutboundLinks'],
  },
  {
    code: 'L06', name: 'Shorten Redirect Chains', namespace: 'links',
    priorityBand: 'HYGIENE', triggerKey: 'L06', effortHours: 0.5,
    expectedDeltaFormula: 'redirect_chain_equity_loss * chain_length', forecastUnit: 'none',
    modes: ['linksAuthority', 'fullAudit'], requires: ['redirectChain', 'redirectCount'],
  },
  {
    code: 'L07', name: 'Diversify Anchor Text', namespace: 'links',
    priorityBand: 'HYGIENE', triggerKey: 'L07', effortHours: 2,
    expectedDeltaFormula: 'over_optimized_anchor_risk * backlink_profile_size', forecastUnit: 'clicks',
    modes: ['linksAuthority', 'fullAudit'], requires: ['anchorDiversity', 'brandAnchorsPct'],
  },

  // ── Search (S01-S06) ──
  {
    code: 'S01', name: 'Target Near-Miss Keywords', namespace: 'search',
    priorityBand: 'HIGH_LEVERAGE', triggerKey: 'S01', effortHours: 2,
    expectedDeltaFormula: 'near_miss_impressions * position_gain_click_rate', forecastUnit: 'clicks',
    modes: ['content', 'fullAudit'], requires: ['nearMissKeywords', 'position'],
  },
  {
    code: 'S02', name: 'Win Featured Snippet', namespace: 'search',
    priorityBand: 'HIGH_LEVERAGE', triggerKey: 'S02', effortHours: 1.5,
    expectedDeltaFormula: 'featured_snippet_ctr_boost * impressions', forecastUnit: 'clicks',
    modes: ['content', 'fullAudit'], requires: ['featuredSnippetOpportunity', 'position'],
  },
  {
    code: 'S03', name: 'Reclaim Lost Keywords', namespace: 'search',
    priorityBand: 'HIGH_LEVERAGE', triggerKey: 'S03', effortHours: 2,
    expectedDeltaFormula: 'lost_keyword_traffic * recovery_rate', forecastUnit: 'clicks',
    modes: ['content', 'fullAudit'], requires: ['lostKeywords'],
  },
  {
    code: 'S04', name: 'Expand Intent Coverage', namespace: 'search',
    priorityBand: 'STRATEGIC', triggerKey: 'S04', effortHours: 3,
    expectedDeltaFormula: 'intent_gap_traffic * ranking_probability', forecastUnit: 'clicks',
    modes: ['content', 'fullAudit'], requires: ['pageIntent', 'pageCluster'],
  },
  {
    code: 'S05', name: 'Deduplicate SERP Cannibalization', namespace: 'search',
    priorityBand: 'HIGH_LEVERAGE', triggerKey: 'S05', effortHours: 2,
    expectedDeltaFormula: 'cannibal_dilution_loss * consolidation_benefit', forecastUnit: 'clicks',
    modes: ['content', 'fullAudit'], requires: ['cannibalization'],
  },
  {
    code: 'S06', name: 'Optimize CTR', namespace: 'search',
    priorityBand: 'HIGH_LEVERAGE', triggerKey: 'S06', effortHours: 1,
    expectedDeltaFormula: 'ctr_gap * impressions', forecastUnit: 'clicks',
    modes: ['content', 'fullAudit'], requires: ['ctr', 'position', 'impressions'],
  },

  // ── AI (A01-A05) ──
  {
    code: 'A01', name: 'Unblock AI Bots', namespace: 'ai',
    priorityBand: 'HIGH_LEVERAGE', triggerKey: 'A01', effortHours: 0.5,
    expectedDeltaFormula: 'ai_citation_traffic * bot_block_share', forecastUnit: 'impressions',
    modes: ['ai', 'fullAudit', 'technical'], requires: ['aiBotBlocked'],
  },
  {
    code: 'A02', name: 'Add llms.txt', namespace: 'ai',
    priorityBand: 'STRATEGIC', triggerKey: 'A02', effortHours: 0.5,
    expectedDeltaFormula: 'ai_discovery_boost * 0.05', forecastUnit: 'impressions',
    modes: ['ai', 'fullAudit'], requires: ['hasLlmsTxt'],
  },
  {
    code: 'A03', name: 'Add Answer Structure', namespace: 'ai',
    priorityBand: 'STRATEGIC', triggerKey: 'A03', effortHours: 2,
    expectedDeltaFormula: 'answer_engine_visibility * question_keyword_share', forecastUnit: 'clicks',
    modes: ['ai', 'fullAudit', 'content'], requires: ['hasAnswerStructure', 'pageIntent'],
  },
  {
    code: 'A04', name: 'Add Speakable Markup', namespace: 'ai',
    priorityBand: 'STRATEGIC', triggerKey: 'A04', effortHours: 1,
    expectedDeltaFormula: 'voice_search_boost * local_keyword_share', forecastUnit: 'clicks',
    modes: ['ai', 'fullAudit'], requires: ['hasSpeakable'],
  },
  {
    code: 'A05', name: 'Claim Entity in Knowledge Graph', namespace: 'ai',
    priorityBand: 'STRATEGIC', triggerKey: 'A05', effortHours: 3,
    expectedDeltaFormula: 'entity_authority_boost * branded_search_share', forecastUnit: 'impressions',
    modes: ['ai', 'fullAudit'], requires: ['hasEntityMarkup'],
  },

  // ── Paid (P01-P08) ──
  {
    code: 'P01', name: 'Pause Low Quality Score Ads', namespace: 'paid',
    priorityBand: 'REVENUE_LOSS', triggerKey: 'P01', effortHours: 0.25,
    expectedDeltaFormula: 'low_qs_waste * daily_budget', forecastUnit: 'revenue',
    modes: ['paid', 'fullAudit'], requires: ['qualityScore'],
  },
  {
    code: 'P02', name: 'Add Negative Keywords', namespace: 'paid',
    priorityBand: 'HIGH_LEVERAGE', triggerKey: 'P02', effortHours: 0.5,
    expectedDeltaFormula: 'negative_keyword_waste * monthly_spend', forecastUnit: 'revenue',
    modes: ['paid', 'fullAudit'], requires: ['negativeKeywords'],
  },
  {
    code: 'P03', name: 'Refresh Fatigued Ad', namespace: 'paid',
    priorityBand: 'REVENUE_LOSS', triggerKey: 'P03', effortHours: 0.5,
    expectedDeltaFormula: 'fatigue_ctr_decline * ad_group_impressions', forecastUnit: 'clicks',
    modes: ['paid', 'fullAudit'], requires: ['adFatigued'],
  },
  {
    code: 'P04', name: 'Fix Landing Page for QS', namespace: 'paid',
    priorityBand: 'REVENUE_LOSS', triggerKey: 'P04', effortHours: 2,
    expectedDeltaFormula: 'qs_improvement * cpc_reduction * impressions', forecastUnit: 'revenue',
    modes: ['paid', 'fullAudit'], requires: ['landingPageRelevance', 'qualityScore'],
  },
  {
    code: 'P05', name: 'Reallocate Budget', namespace: 'paid',
    priorityBand: 'HIGH_LEVERAGE', triggerKey: 'P05', effortHours: 0.5,
    expectedDeltaFormula: 'budget_rebalance_roi_improvement', forecastUnit: 'revenue',
    modes: ['paid', 'fullAudit'], requires: ['campaignBudget'],
  },
  {
    code: 'P06', name: 'Fix Disapproved Ads', namespace: 'paid',
    priorityBand: 'REVENUE_LOSS', triggerKey: 'P06', effortHours: 0.25,
    expectedDeltaFormula: 'disapproved_ad_revenue_loss', forecastUnit: 'revenue',
    modes: ['paid', 'fullAudit'], requires: ['adDisapproved'],
  },
  {
    code: 'P07', name: 'Add Assets to RSA', namespace: 'paid',
    priorityBand: 'HYGIENE', triggerKey: 'P07', effortHours: 0.5,
    expectedDeltaFormula: 'rsa_asset_ctr_boost * impressions', forecastUnit: 'clicks',
    modes: ['paid', 'fullAudit'], requires: ['adAssets'],
  },
  {
    code: 'P08', name: 'Align Message Match', namespace: 'paid',
    priorityBand: 'HIGH_LEVERAGE', triggerKey: 'P08', effortHours: 1,
    expectedDeltaFormula: 'message_match_landing_page_conversion_gap', forecastUnit: 'conversions',
    modes: ['paid', 'fullAudit'], requires: ['messageMatch'],
  },

  // ── UX (U01-U05) ──
  {
    code: 'U01', name: 'Fix Form Field Issue', namespace: 'ux',
    priorityBand: 'REVENUE_LOSS', triggerKey: 'U01', effortHours: 1,
    expectedDeltaFormula: 'form_field_conversion_impact', forecastUnit: 'conversions',
    modes: ['uxConversion', 'fullAudit'], requires: ['formFields', 'formAbandonmentRate'],
  },
  {
    code: 'U02', name: 'Reduce Form Fields', namespace: 'ux',
    priorityBand: 'HIGH_LEVERAGE', triggerKey: 'U02', effortHours: 1,
    expectedDeltaFormula: 'field_reduction_conversion_lift * form_volume', forecastUnit: 'conversions',
    modes: ['uxConversion', 'fullAudit'], requires: ['formFields', 'formAbandonmentRate'],
  },
  {
    code: 'U03', name: 'Fix Rage Click Hotspot', namespace: 'ux',
    priorityBand: 'REVENUE_LOSS', triggerKey: 'U03', effortHours: 2,
    expectedDeltaFormula: 'rage_click_conversion_loss * affected_sessions', forecastUnit: 'conversions',
    modes: ['uxConversion', 'fullAudit'], requires: ['rageClickHotspots'],
  },
  {
    code: 'U04', name: 'Move CTA Above Fold', namespace: 'ux',
    priorityBand: 'HIGH_LEVERAGE', triggerKey: 'U04', effortHours: 1,
    expectedDeltaFormula: 'cta_visibility_conversion_lift * page_sessions', forecastUnit: 'conversions',
    modes: ['uxConversion', 'fullAudit'], requires: ['ctaAboveFold'],
  },
  {
    code: 'U05', name: 'Run Experiment', namespace: 'ux',
    priorityBand: 'STRATEGIC', triggerKey: 'U05', effortHours: 4,
    expectedDeltaFormula: 'experiment_uplift_range * conversion_volume', forecastUnit: 'conversions',
    modes: ['uxConversion', 'fullAudit'], requires: [],
  },

  // ── Social (SO01-SO04) ──
  {
    code: 'SO01', name: 'Fix Open Graph Tags', namespace: 'social',
    priorityBand: 'HYGIENE', triggerKey: 'SO01', effortHours: 0.5,
    expectedDeltaFormula: 'og_tag_social_share_ctr_boost * share_volume', forecastUnit: 'clicks',
    modes: ['socialBrand', 'fullAudit'], requires: ['ogTags', 'twitterTags'],
  },
  {
    code: 'SO02', name: 'Respond to Crisis Mentions', namespace: 'social',
    priorityBand: 'BLOCKING', triggerKey: 'SO02', effortHours: 1,
    expectedDeltaFormula: 'crisis_reputation_risk * brand_value', forecastUnit: 'revenue',
    modes: ['socialBrand', 'fullAudit'], requires: ['crisisMentions'],
  },
  {
    code: 'SO03', name: 'Shift Posting Time', namespace: 'social',
    priorityBand: 'STRATEGIC', triggerKey: 'SO03', effortHours: 0.5,
    expectedDeltaFormula: 'posting_time_engagement_delta * follower_count', forecastUnit: 'clicks',
    modes: ['socialBrand', 'fullAudit'], requires: ['socialPostFrequency'],
  },
  {
    code: 'SO04', name: 'Increase Short Video Ratio', namespace: 'social',
    priorityBand: 'STRATEGIC', triggerKey: 'SO04', effortHours: 3,
    expectedDeltaFormula: 'short_video_engagement_lift * audience_reach', forecastUnit: 'clicks',
    modes: ['socialBrand', 'fullAudit'], requires: ['shortVideoRatio'],
  },

  // ── Commerce (E01-E04) ──
  {
    code: 'E01', name: 'Fix Feed Attributes', namespace: 'commerce',
    priorityBand: 'REVENUE_LOSS', triggerKey: 'E01', effortHours: 2,
    expectedDeltaFormula: 'feed_attr_missing_products * product_traffic_per_attr', forecastUnit: 'revenue',
    modes: ['commerce', 'fullAudit'], requires: ['feedAttributesMissing'],
  },
  {
    code: 'E02', name: 'Restock Visibility', namespace: 'commerce',
    priorityBand: 'REVENUE_LOSS', triggerKey: 'E02', effortHours: 1,
    expectedDeltaFormula: 'oos_page_traffic_loss * restock_conversion_rate', forecastUnit: 'revenue',
    modes: ['commerce', 'fullAudit'], requires: ['outOfStock', 'stockLevel'],
  },
  {
    code: 'E03', name: 'Add Review Schema', namespace: 'commerce',
    priorityBand: 'HYGIENE', triggerKey: 'E03', effortHours: 0.5,
    expectedDeltaFormula: 'review_rich_result_ctr_boost * product_impressions', forecastUnit: 'clicks',
    modes: ['commerce', 'fullAudit', 'ai'], requires: ['reviewSchemaPresent'],
  },
  {
    code: 'E04', name: 'Flatten Category Depth', namespace: 'commerce',
    priorityBand: 'STRATEGIC', triggerKey: 'E04', effortHours: 4,
    expectedDeltaFormula: 'category_depth_crawl_penalty * category_traffic', forecastUnit: 'clicks',
    modes: ['commerce', 'fullAudit'], requires: ['categoryDepth'],
  },

  // ── Local (LO01-LO04) ──
  {
    code: 'LO01', name: 'Fix NAP Consistency', namespace: 'local',
    priorityBand: 'REVENUE_LOSS', triggerKey: 'LO01', effortHours: 1,
    expectedDeltaFormula: 'nap_inconsistency_local_ranking_penalty * local_search_volume', forecastUnit: 'clicks',
    modes: ['local', 'fullAudit'], requires: ['nap', 'napConsistent'],
  },
  {
    code: 'LO02', name: 'Claim Google Business Profile', namespace: 'local',
    priorityBand: 'BLOCKING', triggerKey: 'LO02', effortHours: 0.5,
    expectedDeltaFormula: 'gbp_unclaimed_local_pack_loss', forecastUnit: 'clicks',
    modes: ['local', 'fullAudit'], requires: ['gbpClaimed'],
  },
  {
    code: 'LO03', name: 'Respond to Reviews', namespace: 'local',
    priorityBand: 'HYGIENE', triggerKey: 'LO03', effortHours: 0.5,
    expectedDeltaFormula: 'review_response_rate_local_ranking_boost * review_count', forecastUnit: 'clicks',
    modes: ['local', 'fullAudit'], requires: ['reviewResponses', 'reviewCount'],
  },
  {
    code: 'LO04', name: 'Add Service Area Page', namespace: 'local',
    priorityBand: 'STRATEGIC', triggerKey: 'LO04', effortHours: 3,
    expectedDeltaFormula: 'service_area_gap * local_search_volume', forecastUnit: 'clicks',
    modes: ['local', 'fullAudit'], requires: ['hasServiceAreaPage'],
  },
];

// ── Auto-register all definitions on module load ──

for (const def of ACTION_DEFINITIONS) {
  registerAction(def);
}

export { ACTION_DEFINITIONS };
