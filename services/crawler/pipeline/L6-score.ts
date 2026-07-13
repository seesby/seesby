/**
 * L6 – Score + Gate
 * Reads MetricRegistry, gates metrics by fingerprint, computes composite scores.
 *
 * Uses the weighted score component registry from @seesby/compute/score-components.
 * Each score component (contentQuality, health, eeat, etc.) has per-metric weights
 * and normalization rules ported from METRIC_CATALOG.md §24.
 */
import type { MetricDef, ProjectFingerprint } from '@seesby/types';
import { defaultMetricRegistry } from './metric-registry';
import { evaluateGate } from './fingerprint-gating';
import {
  computeComponentScore,
  computeQOverall,
  ALL_SCORE_COMPONENTS,
  COMPONENT_SUBSCORE_KEY,
} from '@seesby/compute';

export interface ScoreResult {
  qOverall: number;
  namespaceScores: Record<string, number>;
  visibleMetrics: MetricDef[];
  pageScores: Map<string, Map<string, unknown>>;
  siteScores: Map<string, unknown>;
}

export interface ScoreContext {
  fingerprint: ProjectFingerprint;
  mode: string;
  pages: Map<string, Record<string, unknown>>;
  siteData: Record<string, unknown>;
}

export function runL6Score(ctx: ScoreContext): ScoreResult {
  const { fingerprint, mode, pages, siteData } = ctx;
  const visibleMetrics = defaultMetricRegistry
    .getAll()
    .filter(m => evaluateGate(m.gate, { fingerprint, mode: mode as any }));

  // Collect visible metric values per page
  const pageScores = new Map<string, Map<string, unknown>>();
  for (const [url, pageData] of pages) {
    const scores = new Map<string, unknown>();
    for (const m of visibleMetrics) {
      if (pageData[m.key] !== undefined) scores.set(m.key, pageData[m.key]);
    }
    pageScores.set(url, scores);
  }

  // Compute per-page component scores, then aggregate across all pages
  const componentAggregates: Record<string, number[]> = {};
  for (const comp of ALL_SCORE_COMPONENTS) {
    componentAggregates[comp.name] = [];
  }

  for (const [, pageData] of pages) {
    for (const comp of ALL_SCORE_COMPONENTS) {
      const score = computeComponentScore(comp, pageData);
      if (score > 0) componentAggregates[comp.name].push(score);
    }
  }

  // Average component scores across pages → sub-scores
  const namespaceScores: Record<string, number> = {};
  for (const [compName, scores] of Object.entries(componentAggregates)) {
    if (scores.length === 0) continue;
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const subKey = COMPONENT_SUBSCORE_KEY[compName];
    if (subKey) namespaceScores[subKey] = avg;
  }

  // Compute qOverall with industry-specific weight overrides
  const industry = fingerprint.industry as any;
  const qOverall = computeQOverall(namespaceScores, industry);

  // Collect site-level scores
  const siteScores = new Map<string, unknown>();
  for (const m of visibleMetrics) {
    if (m.level === 'S') siteScores.set(m.key, siteData[m.key]);
  }

  return { qOverall, namespaceScores, visibleMetrics, pageScores, siteScores };
}
