// packages/actions/src/forecasting/FeatureExtractor.ts
import type { ActionDescriptor } from '@seesby/types';

// ─── Types ────────────────────────────────────────────

/** Numeric feature vector for the forecasting model. */
export interface ActionFeatures {
  /** Action type code (e.g. 'C01', 'T08', 'S01'). */
  actionType: string;
  /** Action domain: content, tech, links, search, ai, paid, ux, social, commerce, local. */
  actionDomain: string;

  /** Page intent: informational, navigational, commercial, transactional, local. */
  pageIntent: string;
  /** Topic cluster ID (hashed to bucket for numeric encoding). */
  pageCluster: string;
  /** 0=top3, 1=top10, 2=top20, 3=top50, 4=top100, 5=not-ranking. */
  pageRankBucket: number;
  /** 0=high(>1k/mo), 1=medium(100-1k), 2=low(10-100), 3=none(<10). */
  pageTrafficBucket: number;
  /** 0=high(>5%), 1=medium(1-5%), 2=low(<1%), 3=none. */
  pageCvrBucket: number;

  /** Site industry (fp.industry value). */
  industry: string;
  /** CMS platform (fp.cms value). */
  cms: string;
  /** Total site URL count. */
  siteSize: number;
  /** Dominant device: mobile | desktop. */
  deviceDominant: string;

  /** 0=leader, 1=strong, 2=moderate, 3=weak, 4=absent. */
  competitorSovBucket: number;

  /** Current quality score (0-100). */
  currentScore: number;
  /** Current health: good | ok | poor | critical. */
  currentHealth: string;

  /** Source tier index (T0=0 ... T8=8). */
  sourceTier: number;
}

/** Raw page data needed for feature extraction. */
export interface PageData {
  intent?: string;
  topicCluster?: string;
  searchPosition?: number;
  ga4Sessions?: number;
  ga4ConversionRate?: number;
  eeatScore?: number;
  cwvBucket?: string;
  industry?: string;
  cms?: string;
  siteSize?: number;
  deviceDominant?: string;
  competitorSov?: number;
}

// ─── Constants ────────────────────────────────────────

const INTENTS = ['informational', 'navigational', 'commercial', 'transactional', 'local'] as const;
const INTENT_INDEX: Record<string, number> = {
  informational: 0,
  navigational: 1,
  commercial: 2,
  transactional: 3,
  local: 4,
};

const INDUSTRIES = [
  'ecommerce', 'saas', 'blog', 'news', 'finance', 'education',
  'healthcare', 'local', 'jobBoard', 'realEstate', 'restaurant',
  'portfolio', 'media', 'government', 'nonprofit', 'general',
] as const;
const INDUSTRY_INDEX: Record<string, number> = Object.fromEntries(
  INDUSTRIES.map((ind, i) => [ind, i]),
) as Record<string, number>;

const HEALTH_ORDER: Record<string, number> = {
  good: 0,
  ok: 1,
  poor: 2,
  critical: 3,
};

const DOMAIN_LIST = [
  'content', 'tech', 'links', 'search', 'ai',
  'paid', 'ux', 'social', 'commerce', 'local',
] as const;

const CLUSTER_BUCKET_COUNT = 10;
const CMS_BUCKET_COUNT = 10;

// ─── Feature Schema ───────────────────────────────────
// Index layout (33 features total):
//  0       actionTypeIndex        (numeric, 0-16)
//  1-5     intent one-hot         (5 values)
//  6       pageClusterBucket      (numeric, 0-9)
//  7       pageRankBucket         (numeric, 0-5)
//  8       pageTrafficBucket      (numeric, 0-3)
//  9       pageCvrBucket          (numeric, 0-3)
//  10-25   industry one-hot       (16 values)
//  26      cmsBucket              (numeric, 0-9)
//  27      siteSizeLog            (numeric, 0-1 normalized)
//  28      deviceDominant         (binary, 0/1)
//  29      competitorSovBucket    (numeric, 0-4)
//  30      currentScore           (numeric, 0-1 normalized)
//  31      currentHealth          (ordinal, 0-3)
//  32      sourceTier             (numeric, 0-1 normalized)

const FEATURE_COUNT = 33;

const FEATURE_NAMES: readonly string[] = [
  'actionTypeIndex',
  'intent_info', 'intent_nav', 'intent_comm', 'intent_trans', 'intent_local',
  'pageClusterBucket',
  'pageRankBucket',
  'pageTrafficBucket',
  'pageCvrBucket',
  ...INDUSTRIES.map(ind => `industry_${ind}`),
  'cmsBucket',
  'siteSizeLog',
  'deviceDominant',
  'competitorSovBucket',
  'currentScore',
  'currentHealth',
  'sourceTier',
] as const;

// ─── Implementation ───────────────────────────────────

/**
 * Extracts a numeric feature vector from a page + action context.
 *
 * The feature schema is deterministic (33 features) and stable across
 * training and inference. Each feature is either a bucketed ordinal,
 * a one-hot encoding, or a normalized continuous value in [0, 1].
 */
export class FeatureExtractor {
  /**
   * Extract structured features from raw page data and an action descriptor.
   */
  extract(page: PageData, action: ActionDescriptor, sourceTier: number): ActionFeatures {
    const domain = codeToDomain(action.code);
    return {
      actionType: action.code,
      actionDomain: domain,
      pageIntent: page.intent ?? 'informational',
      pageCluster: page.topicCluster ?? '',
      pageRankBucket: this.rankBucket(page.searchPosition),
      pageTrafficBucket: this.trafficBucket(page.ga4Sessions),
      pageCvrBucket: this.cvrBucket(page.ga4ConversionRate),
      industry: page.industry ?? 'general',
      cms: page.cms ?? 'unknown',
      siteSize: page.siteSize ?? 0,
      deviceDominant: page.deviceDominant ?? 'mobile',
      competitorSovBucket: this.sovBucket(page.competitorSov),
      currentScore: page.eeatScore ?? 50,
      currentHealth: scoreToHealth(page.eeatScore),
      sourceTier,
    };
  }

  // ─── Bucket Helpers ──────────────────────────────────

  /** Map raw search position to a rank bucket (0-5). */
  rankBucket(position?: number): number {
    if (position == null || position <= 0) return 5;
    if (position <= 3) return 0;
    if (position <= 10) return 1;
    if (position <= 20) return 2;
    if (position <= 50) return 3;
    if (position <= 100) return 4;
    return 5;
  }

  /** Map GA4 sessions to a traffic bucket (0-3). */
  trafficBucket(sessions?: number): number {
    if (sessions == null || sessions < 0) return 3;
    if (sessions >= 1000) return 0;
    if (sessions >= 100) return 1;
    if (sessions >= 10) return 2;
    return 3;
  }

  /** Map conversion rate to a CVR bucket (0-3). */
  cvrBucket(cvr?: number): number {
    if (cvr == null || cvr < 0) return 3;
    if (cvr >= 0.05) return 0;
    if (cvr >= 0.01) return 1;
    return 2;
  }

  /** Map competitor share-of-voice to a bucket (0-4). */
  sovBucket(sov?: number): number {
    if (sov == null) return 4;
    if (sov >= 0.4) return 0;
    if (sov >= 0.25) return 1;
    if (sov >= 0.1) return 2;
    if (sov > 0) return 3;
    return 4;
  }

  // ─── Numeric Encoding ────────────────────────────────

  /**
   * Encode features into a flat numeric vector for the ML model.
   * All values are in [0, 1] or small integer ranges.
   */
  toNumericVector(features: ActionFeatures): number[] {
    const vec = new Array<number>(FEATURE_COUNT).fill(0);

    // 0: action type index (0-16, derived from numeric part of code)
    vec[0] = codeToIndex(features.actionType);

    // 1-5: intent one-hot
    const intentIdx = INTENT_INDEX[features.pageIntent] ?? 0;
    vec[1 + intentIdx] = 1;

    // 6: page cluster bucket (hash string to 0-9)
    vec[6] = hashToBucket(features.pageCluster, CLUSTER_BUCKET_COUNT);

    // 7-9: ordinal buckets
    vec[7] = features.pageRankBucket;
    vec[8] = features.pageTrafficBucket;
    vec[9] = features.pageCvrBucket;

    // 10-25: industry one-hot
    const indIdx = INDUSTRY_INDEX[features.industry] ?? INDUSTRY_INDEX['general'];
    vec[10 + indIdx] = 1;

    // 26: CMS bucket (hash string to 0-9)
    vec[26] = hashToBucket(features.cms, CMS_BUCKET_COUNT);

    // 27: site size (log-normalized to 0-1, cap at 1M URLs)
    vec[27] = features.siteSize > 0
      ? Math.min(1, Math.log10(Math.max(1, features.siteSize)) / 6)
      : 0;

    // 28: device dominant (1 = desktop, 0 = mobile)
    vec[28] = features.deviceDominant === 'desktop' ? 1 : 0;

    // 29: competitor SOV bucket
    vec[29] = features.competitorSovBucket;

    // 30: current score (normalized to 0-1)
    vec[30] = Math.max(0, Math.min(1, features.currentScore / 100));

    // 31: current health ordinal
    vec[31] = HEALTH_ORDER[features.currentHealth] ?? 1;

    // 32: source tier (normalized to 0-1, T0=1.0, T8=0.0)
    vec[32] = features.sourceTier <= 0
      ? 1.0
      : Math.max(0, 1 - features.sourceTier / 8);

    return vec;
  }

  /** Get human-readable feature names matching the numeric vector. */
  getFeatureNames(): string[] {
    return [...FEATURE_NAMES];
  }

  /** Total number of features in the numeric vector. */
  getFeatureCount(): number {
    return FEATURE_COUNT;
  }
}

// ─── Domain Mapping ───────────────────────────────────

/** Map an action code prefix to its domain. */
export function codeToDomain(code: string): string {
  if (code.startsWith('SO')) return 'social';
  if (code.startsWith('LO')) return 'local';
  if (code.startsWith('C')) return 'content';
  if (code.startsWith('T')) return 'tech';
  if (code.startsWith('L')) return 'links';
  if (code.startsWith('S')) return 'search';
  if (code.startsWith('A')) return 'ai';
  if (code.startsWith('P')) return 'paid';
  if (code.startsWith('U')) return 'ux';
  if (code.startsWith('E')) return 'commerce';
  return 'unknown';
}

/** Get the numeric index of an action type within its domain (0-based). */
export function codeToIndex(code: string): number {
  const match = code.match(/(\d+)$/);
  return match ? parseInt(match[1], 10) - 1 : 0;
}

/** Map a quality score to a health label. */
function scoreToHealth(score?: number): string {
  if (score == null) return 'ok';
  if (score >= 80) return 'good';
  if (score >= 50) return 'ok';
  if (score >= 25) return 'poor';
  return 'critical';
}

/** Hash a string to a bucket index in [0, bucketCount). */
function hashToBucket(value: string, bucketCount: number): number {
  if (!value) return 0;
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % bucketCount;
}
