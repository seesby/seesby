/**
 * Action Forecasting
 * Estimates expected delta for each action type based on page/site context.
 * Uses cohort regression when available, falls back to industry defaults.
 */
import type { ActionDescriptor, ProjectFingerprint } from '@seesby/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ForecastResult {
  expectedDelta: number;
  unit: string;
  confidence: number;
  method: 'cohort' | 'heuristic' | 'industry-default';
}

export interface ForecastContext {
  pageData: Record<string, unknown>;
  siteData: Record<string, unknown>;
  fingerprint: ProjectFingerprint;
  cohortData?: CohortStats;
}

export interface CohortStats {
  actionCode: string;
  sampleSize: number;
  avgDelta: number;
  stdDev: number;
}

// ---------------------------------------------------------------------------
// Industry defaults (fallback when no cohort data)
// ---------------------------------------------------------------------------

const INDUSTRY_DELTA_DEFAULTS: Record<string, Record<string, number>> = {
  ecommerce: { clicks: 25, conversions: 3, revenue: 150, rank: 2 },
  saas: { clicks: 15, conversions: 2, revenue: 200, rank: 1.5 },
  blog: { clicks: 30, conversions: 1, revenue: 5, rank: 2.5 },
  news: { clicks: 40, conversions: 1, revenue: 10, rank: 2 },
  finance: { clicks: 10, conversions: 1, revenue: 500, rank: 1 },
  healthcare: { clicks: 8, conversions: 1, revenue: 300, rank: 1 },
  education: { clicks: 12, conversions: 1, revenue: 100, rank: 1.5 },
  local: { clicks: 5, conversions: 2, revenue: 50, rank: 1 },
  real_estate: { clicks: 8, conversions: 2, revenue: 200, rank: 1.5 },
  restaurant: { clicks: 6, conversions: 3, revenue: 80, rank: 1 },
  nonprofit: { clicks: 10, conversions: 2, revenue: 100, rank: 1 },
  general: { clicks: 10, conversions: 1, revenue: 50, rank: 1 },
};

// ---------------------------------------------------------------------------
// Action-specific forecast models
// ---------------------------------------------------------------------------

function forecastClicksGain(pageData: Record<string, unknown>, ctx: ForecastContext): number {
  const impressions = (typeof pageData['p.search.gsc.impr'] === 'number' ? pageData['p.search.gsc.impr'] as number : 1000);
  const position = (typeof pageData['p.search.gsc.position'] === 'number' ? pageData['p.search.gsc.position'] as number : 20);
  const ctr = (typeof pageData['p.search.gsc.ctr'] === 'number' ? pageData['p.search.gsc.ctr'] as number : 0.01);
  const currentClicks = impressions * ctr;
  // Improving by 2 positions typically yields 1.5–3x more clicks
  const multiplier = position <= 5 ? 2.5 : position <= 10 ? 1.8 : 1.3;
  return Math.round(currentClicks * (multiplier - 1));
}

function forecastRankImprovement(_pageData: Record<string, unknown>, ctx: ForecastContext): number {
  const defaults = INDUSTRY_DELTA_DEFAULTS[ctx.fingerprint.industry] ?? INDUSTRY_DELTA_DEFAULTS.general;
  return defaults.rank;
}

function forecastConversionGain(pageData: Record<string, unknown>, ctx: ForecastContext): number {
  const sessions = (typeof pageData['p.ga.sessions'] === 'number' ? pageData['p.ga.sessions'] as number : 100);
  const cvr = (typeof pageData['p.ga.conversionRate'] === 'number' ? pageData['p.ga.conversionRate'] as number : 0.02);
  const currentConversions = sessions * cvr;
  const defaults = INDUSTRY_DELTA_DEFAULTS[ctx.fingerprint.industry] ?? INDUSTRY_DELTA_DEFAULTS.general;
  return Math.round(currentConversions * 0.15 + defaults.conversions);
}

function forecastRevenueGain(pageData: Record<string, unknown>, ctx: ForecastContext): number {
  const revenue = (typeof pageData['p.ga.revenue'] === 'number' ? pageData['p.ga.revenue'] as number : 0);
  const defaults = INDUSTRY_DELTA_DEFAULTS[ctx.fingerprint.industry] ?? INDUSTRY_DELTA_DEFAULTS.general;
  return Math.round(revenue * 0.1 + defaults.revenue);
}

// ---------------------------------------------------------------------------
// Main forecast function
// ---------------------------------------------------------------------------

export function forecastDelta(
  action: ActionDescriptor,
  ctx: ForecastContext,
): ForecastResult {
  const { pageData, fingerprint, cohortData } = ctx;

  // 1. Try cohort data first (highest confidence)
  if (cohortData && cohortData.sampleSize >= 50) {
    return {
      expectedDelta: cohortData.avgDelta,
      unit: action.forecastUnit,
      confidence: Math.min(1, cohortData.sampleSize / 200),
      method: 'cohort',
    };
  }

  // 2. Heuristic forecast based on action type and available data
  let delta: number;
  const unit = action.forecastUnit;

  if (unit === 'clicks') {
    delta = forecastClicksGain(pageData, ctx);
  } else if (unit === 'conversions') {
    delta = forecastConversionGain(pageData, ctx);
  } else if (unit === 'revenue') {
    delta = forecastRevenueGain(pageData, ctx);
  } else if (unit === 'rank') {
    delta = forecastRankImprovement(pageData, ctx);
  } else {
    delta = 5;
  }

  // Scale by effort (higher effort → higher expected delta)
  const effortMultiplier = Math.min(2, action.effortMinutes / 60);
  delta = Math.round(delta * effortMultiplier);

  return {
    expectedDelta: Math.max(1, delta),
    unit,
    confidence: cohortData ? 0.6 : 0.3,
    method: cohortData ? 'cohort' : 'heuristic',
  };
}

// ---------------------------------------------------------------------------
// Batch forecasting
// ---------------------------------------------------------------------------

export function forecastAllDeltas(
  actions: Array<{ action: ActionDescriptor; pageData: Record<string, unknown> }>,
  siteData: Record<string, unknown>,
  fingerprint: ProjectFingerprint,
  cohortMap?: Map<string, CohortStats>,
): ForecastResult[] {
  return actions.map(({ action, pageData }) =>
    forecastDelta(action, {
      pageData,
      siteData,
      fingerprint,
      cohortData: cohortMap?.get(action.code),
    }),
  );
}
