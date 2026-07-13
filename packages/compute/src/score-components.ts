// packages/compute/src/score-components.ts
//
// Per-metric weighted score component registry.
// Ported from METRIC_CATALOG.md §24 Score Component Formulas.

import type { Industry } from '@seesby/types';

// ── Normalization helpers ──────────────────────────────────────────────

/** Linear threshold: returns 100 if value meets the best threshold, else linear falloff. */
function linearThreshold(value: number, best: number, steps: number[][]): number {
  if (value >= best) return 100;
  for (const [threshold, score] of steps) {
    if (value >= threshold) return score;
  }
  return steps.length > 0 ? steps[steps.length - 1][1] : 0;
}

/** Inverse threshold: lower is better. Returns 100 if value meets best, else falloff. */
function inverseThreshold(value: number, best: number, steps: number[][]): number {
  if (value <= best) return 100;
  for (const [threshold, score] of steps) {
    if (value <= threshold) return score;
  }
  return 0;
}

/** Boolean: true=100, false=0. */
function boolScore(value: unknown): number {
  return value === true ? 100 : 0;
}

/** Bucket score from enum map. */
function bucketScore(value: unknown, map: Record<string, number>): number {
  return map[String(value)] ?? 50;
}

// ── Metric entry ───────────────────────────────────────────────────────

export interface MetricEntry {
  /** Metric key in the page data map (e.g., 'p.content.titleLength'). */
  key: string;
  /** Weight of this metric within the component. */
  weight: number;
  /** Normalization function: raw value → 0–100. */
  normalize: (value: unknown, page?: Record<string, unknown>) => number;
}

// ── Score component definition ─────────────────────────────────────────

export interface ScoreComponentDef {
  name: string;
  metrics: MetricEntry[];
}

// ── Content Quality Score (contentQuality) ─────────────────────────────

export const CONTENT_QUALITY_COMPONENT: ScoreComponentDef = {
  name: 'contentQuality',
  metrics: [
    { key: 'p.content.titleLength', weight: 0.08, normalize: v => linearThreshold(v as number, 45, [[30, 100], [20, 80], [10, 60], [5, 40], [0, 20]]) },
    { key: 'p.content.metaDescLength', weight: 0.06, normalize: v => linearThreshold(v as number, 140, [[120, 100], [80, 80], [50, 60], [20, 40], [0, 20]]) },
    { key: 'p.content.h1Count', weight: 0.04, normalize: v => (v as number) === 1 ? 100 : (v as number) > 1 ? 60 : 0 },
    { key: 'p.content.hOrderValid', weight: 0.04, normalize: boolScore },
    { key: 'p.content.wordCount', weight: 0.12, normalize: v => linearThreshold(v as number, 800, [[500, 80], [300, 60], [150, 40], [50, 20], [0, 0]]) },
    { key: 'p.content.readabilityGradeLevel', weight: 0.10, normalize: v => inverseThreshold(v as number, 8, [[10, 80], [12, 60], [14, 40], [16, 20]]) },
    { key: 'p.content.freshnessDays', weight: 0.12, normalize: v => inverseThreshold(v as number, 30, [[90, 80], [180, 60], [365, 40], [730, 20]]) },
    { key: 'p.content.duplicateRatio', weight: 0.10, normalize: v => inverseThreshold(v as number, 0, [[0.3, 60], [0.7, 30]]) },
    { key: 'p.content.textRatio', weight: 0.05, normalize: v => linearThreshold(v as number, 0.6, [[0.4, 80], [0.25, 60], [0.15, 40], [0.05, 20]]) },
    { key: 'p.content.schemaRichResultEligible', weight: 0.08, normalize: boolScore },
    { key: 'p.content.topicCoverage', weight: 0.10, normalize: v => linearThreshold(v as number, 0.8, [[0.6, 80], [0.4, 60], [0.2, 40], [0, 20]]) },
    { key: 'p.content.ctaDensity', weight: 0.05, normalize: (v) => {
      const n = v as number;
      if (n >= 1 && n <= 3) return 100;
      if (n === 0) return 80;
      if (n <= 6) return 40;
      return 20;
    }},
    { key: 'p.content.schemaMissing', weight: 0.05, normalize: (v) => {
      const n = v as number;
      if (n === 0) return 100;
      if (n === 1) return 60;
      if (n <= 3) return 30;
      return 0;
    }},
  ],
};

// ── Technical Health Score (health) ────────────────────────────────────

export const HEALTH_COMPONENT: ScoreComponentDef = {
  name: 'health',
  metrics: [
    { key: 'p.indexing.indexable', weight: 0.15, normalize: boolScore },
    { key: 'p.indexing.statusCode', weight: 0.12, normalize: (v) => {
      const n = v as number;
      if (n === 200) return 100;
      if (n >= 300 && n < 400) return 60;
      return 0;
    }},
    { key: 'p.tech.cwv.bucket', weight: 0.18, normalize: v => bucketScore(v, { good: 100, 'needs-improvement': 60, poor: 20 }) },
    { key: 'p.tech.sec.grade', weight: 0.12, normalize: v => bucketScore(v, { A: 100, B: 80, C: 60, D: 40, F: 20 }) },
    { key: 'p.tech.a11y.score', weight: 0.10, normalize: v => Math.min(100, Math.max(0, v as number)) },
    { key: 'p.tech.jsRenderDep', weight: 0.08, normalize: v => inverseThreshold(v as number, 0.2, [[0.4, 80], [0.6, 60], [0.8, 40]]) },
    { key: 'p.indexing.redirectChain', weight: 0.08, normalize: (v) => {
      const n = v as number;
      if (n === 0) return 100;
      if (n === 1) return 60;
      if (n === 2) return 30;
      return 0;
    }},
    { key: 'p.tech.sec.mixedContent', weight: 0.06, normalize: v => (v === true) ? 0 : 100 },
    { key: 'p.indexing.hreflangErrors', weight: 0.05, normalize: (v) => {
      const n = v as number;
      if (n === 0) return 100;
      if (n === 1) return 70;
      if (n <= 3) return 40;
      return 0;
    }},
    { key: 'p.content.schemaErrors', weight: 0.06, normalize: (v) => {
      const n = v as number;
      if (n === 0) return 100;
      if (n === 1) return 60;
      if (n <= 3) return 30;
      return 0;
    }},
  ],
};

// ── E-E-A-T Score (eeat) ──────────────────────────────────────────────

export const EEAT_COMPONENT: ScoreComponentDef = {
  name: 'eeat',
  metrics: [
    { key: 'p.content.eeatScore', weight: 0.25, normalize: v => Math.min(100, Math.max(0, v as number)) },
    { key: 'p.content.authorCredential', weight: 0.15, normalize: (v) => {
      const s = String(v);
      if (s.includes('bio') && s.includes('credential')) return 100;
      if (s.includes('bio')) return 60;
      if (s.includes('name')) return 30;
      return 0;
    }},
    { key: 'p.content.eeatExperience', weight: 0.15, normalize: v => Math.min(100, Math.max(0, v as number)) },
    { key: 'p.content.eeatExpertise', weight: 0.15, normalize: v => Math.min(100, Math.max(0, v as number)) },
    { key: 'p.content.eeatAuthoritativeness', weight: 0.15, normalize: v => Math.min(100, Math.max(0, v as number)) },
    { key: 'p.content.eeatTrust', weight: 0.15, normalize: v => Math.min(100, Math.max(0, v as number)) },
  ],
};

// ── Search Performance Score (search) ──────────────────────────────────

export const SEARCH_COMPONENT: ScoreComponentDef = {
  name: 'search',
  metrics: [
    { key: 'p.search.gsc.clicks', weight: 0.20, normalize: v => linearThreshold(v as number, 1000, [[500, 80], [100, 60], [10, 40], [1, 20], [0, 0]]) },
    { key: 'p.search.gsc.position', weight: 0.18, normalize: v => inverseThreshold(v as number, 3, [[10, 80], [20, 60], [50, 40], [100, 20]]) },
    { key: 'p.search.gsc.ctr', weight: 0.15, normalize: v => linearThreshold(v as number, 0.08, [[0.05, 80], [0.03, 60], [0.01, 40], [0, 20]]) },
    { key: 'p.search.totalKeywords', weight: 0.12, normalize: v => linearThreshold(v as number, 50, [[20, 80], [10, 60], [5, 40], [1, 20], [0, 0]]) },
    { key: 'p.search.keywordsTop3', weight: 0.10, normalize: v => linearThreshold(v as number, 5, [[3, 80], [2, 60], [1, 40], [0, 0]]) },
    { key: 'p.search.serpFeaturesOwned', weight: 0.10, normalize: v => linearThreshold(v as number, 3, [[2, 80], [1, 60], [0, 0]]) },
    { key: 'p.search.gsc.isLosing', weight: 0.08, normalize: v => (v === false) ? 100 : 0 },
    { key: 'p.search.snippetCannibalized', weight: 0.07, normalize: v => (v === false) ? 100 : 40 },
  ],
};

// ── Link Quality Score (links) ────────────────────────────────────────

export const LINKS_COMPONENT: ScoreComponentDef = {
  name: 'links',
  metrics: [
    { key: 'p.links.inlinks', weight: 0.20, normalize: v => linearThreshold(v as number, 50, [[20, 80], [10, 60], [5, 40], [1, 20], [0, 0]]) },
    { key: 'p.links.internalPagerank', weight: 0.20, normalize: v => linearThreshold(v as number, 80, [[60, 80], [40, 60], [20, 40], [10, 20]]) },
    { key: 'p.links.referringDomains', weight: 0.15, normalize: v => linearThreshold(v as number, 20, [[10, 80], [5, 60], [2, 40], [1, 20], [0, 0]]) },
    { key: 'p.links.orphan', weight: 0.15, normalize: v => (v === false) ? 100 : 0 },
    { key: 'p.links.toxicBacklinkShare', weight: 0.10, normalize: v => inverseThreshold(v as number, 0, [[0.02, 70], [0.05, 40], [0.10, 20]]) },
    { key: 'p.links.broken', weight: 0.10, normalize: (v) => {
      const n = v as number;
      if (n === 0) return 100;
      if (n === 1) return 60;
      if (n <= 3) return 30;
      return 0;
    }},
    { key: 'p.links.anchorTextDiversity', weight: 0.05, normalize: v => linearThreshold(v as number, 0.8, [[0.6, 80], [0.4, 60], [0.2, 40]]) },
    { key: 'p.links.clickDepth', weight: 0.05, normalize: v => inverseThreshold(v as number, 3, [[5, 80], [7, 60], [10, 40]]) },
  ],
};

// ── AI Discoverability Score (ai) ─────────────────────────────────────

export const AI_COMPONENT: ScoreComponentDef = {
  name: 'ai',
  metrics: [
    { key: 'p.ai.botsAllowed', weight: 0.15, normalize: (v) => {
      const count = Array.isArray(v) ? v.length : typeof v === 'number' ? v : 0;
      if (count >= 5) return 100;
      if (count >= 3) return 70;
      if (count >= 1) return 40;
      return 0;
    }},
    { key: 'p.ai.llmsTxt', weight: 0.12, normalize: (v) => {
      const s = String(v);
      if (s === 'full') return 100;
      if (s === 'true' || v === true) return 70;
      return 0;
    }},
    { key: 'p.ai.citation.rate', weight: 0.20, normalize: v => linearThreshold(v as number, 0.5, [[0.3, 80], [0.15, 60], [0.05, 40], [0, 20]]) },
    { key: 'p.ai.extractability', weight: 0.15, normalize: v => Math.min(100, Math.max(0, v as number)) },
    { key: 'p.ai.entityCoverage', weight: 0.12, normalize: v => linearThreshold(v as number, 0.8, [[0.6, 80], [0.4, 60], [0.2, 40], [0, 20]]) },
    { key: 'p.ai.schemaForAI', weight: 0.10, normalize: (v) => {
      const n = v as number;
      if (n >= 3) return 100;
      if (n === 2) return 70;
      if (n === 1) return 40;
      return 0;
    }},
    { key: 'p.ai.passageFitness', weight: 0.08, normalize: v => Math.min(100, Math.max(0, v as number)) },
    { key: 'p.ai.speakable', weight: 0.08, normalize: boolScore },
  ],
};

// ── Social Proof Score (social) ────────────────────────────────────────

export const SOCIAL_COMPONENT: ScoreComponentDef = {
  name: 'social',
  metrics: [
    { key: 'p.social.shares.total', weight: 0.25, normalize: v => linearThreshold(v as number, 500, [[100, 80], [20, 60], [5, 40], [1, 20], [0, 0]]) },
    { key: 'p.social.og.previewOk', weight: 0.20, normalize: (v) => {
      const count = typeof v === 'number' ? v : 0;
      if (count >= 6) return 100;
      if (count >= 4) return 60;
      if (count >= 2) return 30;
      return 0;
    }},
    { key: 's.social.followersTotal', weight: 0.20, normalize: v => linearThreshold(v as number, 100000, [[10000, 80], [1000, 60], [100, 40], [1, 20], [0, 0]]) },
    { key: 's.social.engagementRate', weight: 0.15, normalize: v => linearThreshold(v as number, 0.05, [[0.03, 80], [0.01, 60], [0.005, 40], [0, 20]]) },
    { key: 's.social.mentionsSentiment', weight: 0.10, normalize: v => linearThreshold(v as number, 0.7, [[0.5, 70], [0.3, 40], [0, 20]]) },
    { key: 's.social.mentionsVolume', weight: 0.10, normalize: v => linearThreshold(v as number, 50, [[20, 80], [5, 60], [1, 40], [0, 0]]) },
  ],
};

// ── Paid Quality Score (paid) ──────────────────────────────────────────

export const PAID_COMPONENT: ScoreComponentDef = {
  name: 'paid',
  metrics: [
    { key: 'p.paid.qsLpComponent', weight: 0.25, normalize: v => linearThreshold(v as number, 8, [[6, 80], [4, 60], [2, 40], [1, 20], [0, 0]]) },
    { key: 'p.paid.adIntentMatch', weight: 0.20, normalize: v => linearThreshold(v as number, 0.8, [[0.6, 80], [0.4, 60], [0.2, 40]]) },
    { key: 'p.paid.paidCvr', weight: 0.20, normalize: v => linearThreshold(v as number, 0.05, [[0.03, 80], [0.015, 60], [0.005, 40], [0, 20]]) },
    { key: 's.paid.qsAvg', weight: 0.15, normalize: v => linearThreshold(v as number, 8, [[6, 80], [4, 60], [2, 40], [1, 20], [0, 0]]) },
    { key: 's.paid.roas', weight: 0.10, normalize: v => linearThreshold(v as number, 5, [[3, 80], [2, 60], [1, 40], [0.5, 20]]) },
    { key: 's.paid.imprShare', weight: 0.10, normalize: v => linearThreshold(v as number, 0.5, [[0.3, 80], [0.15, 60], [0.05, 40], [0, 20]]) },
  ],
};

// ── Commerce Score (commerce) ──────────────────────────────────────────

export const COMMERCE_COMPONENT: ScoreComponentDef = {
  name: 'commerce',
  metrics: [
    { key: 'p.commerce.priceSchema', weight: 0.15, normalize: (v) => {
      const s = String(v);
      if (s === 'valid') return 100;
      if (s === 'partial') return 40;
      return 0;
    }},
    { key: 'p.commerce.availability', weight: 0.15, normalize: (v) => {
      const s = String(v);
      if (s === 'in_stock') return 100;
      if (s === 'backorder' || s === 'preorder') return 50;
      return 0;
    }},
    { key: 'p.commerce.reviews.count', weight: 0.15, normalize: v => linearThreshold(v as number, 50, [[20, 80], [5, 60], [1, 40], [0, 0]]) },
    { key: 'p.commerce.reviews.avg', weight: 0.12, normalize: v => linearThreshold(v as number, 4.5, [[4.0, 80], [3.5, 60], [3.0, 40], [2.0, 20]]) },
    { key: 'p.commerce.imagesPerProduct', weight: 0.10, normalize: v => linearThreshold(v as number, 5, [[3, 80], [2, 60], [1, 40], [0, 0]]) },
    { key: 'p.commerce.altImageCoverage', weight: 0.10, normalize: v => linearThreshold(v as number, 0.9, [[0.7, 80], [0.5, 60], [0.3, 40]]) },
    { key: 'p.commerce.breadcrumbValid', weight: 0.08, normalize: boolScore },
    { key: 'p.commerce.feed.errors', weight: 0.10, normalize: (v) => {
      const n = v as number;
      if (n === 0) return 100;
      if (n <= 2) return 60;
      if (n <= 5) return 30;
      return 0;
    }},
    { key: 'p.content.faqPresent', weight: 0.05, normalize: boolScore },
  ],
};

// ── Local Score (local) ───────────────────────────────────────────────

export const LOCAL_COMPONENT: ScoreComponentDef = {
  name: 'local',
  metrics: [
    { key: 'e.local.napScore', weight: 0.20, normalize: v => linearThreshold(v as number, 0.95, [[0.85, 80], [0.7, 60], [0.5, 40]]) },
    { key: 'e.local.gbpVerified', weight: 0.15, normalize: boolScore },
    { key: 'e.local.gbpCompleteness', weight: 0.15, normalize: v => linearThreshold(v as number, 90, [[75, 80], [50, 60], [25, 40]]) },
    { key: 'e.local.reviewsAvgGoogle', weight: 0.15, normalize: v => linearThreshold(v as number, 4.5, [[4.0, 80], [3.5, 60], [3.0, 40], [2.0, 20]]) },
    { key: 'e.local.reviewsCountGoogle', weight: 0.10, normalize: v => linearThreshold(v as number, 50, [[20, 80], [5, 60], [1, 40], [0, 0]]) },
    { key: 'e.local.citations.quality', weight: 0.10, normalize: v => linearThreshold(v as number, 0.9, [[0.7, 80], [0.5, 60], [0.3, 40]]) },
    { key: 'p.local.localBusinessSchema', weight: 0.08, normalize: (v) => {
      const s = String(v);
      if (s === 'valid') return 100;
      if (s === 'present') return 40;
      return 0;
    }},
    { key: 'e.local.rankGeogrid', weight: 0.07, normalize: v => inverseThreshold(v as number, 3, [[5, 80], [10, 60], [20, 40]]) },
  ],
};

// ── UX Score (ux) ─────────────────────────────────────────────────────

export const UX_COMPONENT: ScoreComponentDef = {
  name: 'ux',
  metrics: [
    { key: 'p.ga.engagementRate', weight: 0.20, normalize: v => linearThreshold(v as number, 0.6, [[0.45, 80], [0.3, 60], [0.15, 40]]) },
    { key: 'p.ux.rageClicks', weight: 0.18, normalize: (v) => {
      const n = v as number;
      if (n === 0) return 100;
      if (n <= 2) return 70;
      if (n <= 5) return 40;
      if (n <= 10) return 20;
      return 0;
    }},
    { key: 'p.ga.conversionRate', weight: 0.18, normalize: v => linearThreshold(v as number, 0.05, [[0.03, 80], [0.015, 60], [0.005, 40], [0, 20]]) },
    { key: 'p.ux.deadClicks', weight: 0.12, normalize: (v) => {
      const n = v as number;
      if (n === 0) return 100;
      if (n <= 3) return 70;
      if (n <= 8) return 40;
      return 20;
    }},
    { key: 'p.ux.scrollDead', weight: 0.10, normalize: v => inverseThreshold(v as number, 0.1, [[0.2, 80], [0.3, 60], [0.5, 40]]) },
    { key: 'p.ga.bounce', weight: 0.12, normalize: v => inverseThreshold(v as number, 0.3, [[0.45, 80], [0.55, 60], [0.7, 40]]) },
    { key: 'p.ux.uTurns', weight: 0.10, normalize: (v) => {
      const n = v as number;
      if (n === 0) return 100;
      if (n <= 2) return 70;
      if (n <= 5) return 40;
      return 20;
    }},
  ],
};

// ── Email Score (email) ───────────────────────────────────────────────

export const EMAIL_COMPONENT: ScoreComponentDef = {
  name: 'email',
  metrics: [
    { key: 's.email.domainAuth.dmarc', weight: 0.20, normalize: (v) => {
      const s = String(v);
      if (s === 'reject' || s === 'quarantine') return 100;
      if (s === 'none') return 0;
      return 60;
    }},
    { key: 's.email.domainAuth.spf', weight: 0.15, normalize: boolScore },
    { key: 's.email.domainAuth.dkim', weight: 0.15, normalize: boolScore },
    { key: 's.email.deliverability', weight: 0.15, normalize: v => linearThreshold(v as number, 0.95, [[0.90, 80], [0.80, 60], [0.70, 40]]) },
    { key: 's.email.openRate', weight: 0.12, normalize: v => linearThreshold(v as number, 0.25, [[0.20, 80], [0.15, 60], [0.10, 40], [0.05, 20], [0, 0]]) },
    { key: 's.email.ctr', weight: 0.12, normalize: v => linearThreshold(v as number, 0.05, [[0.03, 80], [0.02, 60], [0.01, 40], [0, 20]]) },
    { key: 's.email.bounceRate', weight: 0.06, normalize: v => inverseThreshold(v as number, 0.01, [[0.02, 80], [0.03, 60], [0.05, 40]]) },
    { key: 's.email.bimi', weight: 0.05, normalize: boolScore },
  ],
};

// ── All components registry ────────────────────────────────────────────

export const ALL_SCORE_COMPONENTS: ScoreComponentDef[] = [
  CONTENT_QUALITY_COMPONENT,
  HEALTH_COMPONENT,
  EEAT_COMPONENT,
  SEARCH_COMPONENT,
  LINKS_COMPONENT,
  AI_COMPONENT,
  SOCIAL_COMPONENT,
  PAID_COMPONENT,
  COMMERCE_COMPONENT,
  LOCAL_COMPONENT,
  UX_COMPONENT,
  EMAIL_COMPONENT,
];

// ── Component → sub-score key mapping (for qOverall) ──────────────────

export const COMPONENT_SUBSCORE_KEY: Record<string, string> = {
  contentQuality: 'content',
  health: 'tech',
  eeat: 'eeat',
  search: 'search',
  links: 'links',
  ai: 'ai',
  social: 'social',
  paid: 'paid',
  commerce: 'commerce',
  local: 'local',
  ux: 'ux',
  email: 'email',
};

// ── Industry-specific weight overrides ─────────────────────────────────

export const INDUSTRY_WEIGHTS: Partial<Record<Industry, Record<string, number>>> = {
  ecommerce: { contentQuality: 0.14, health: 0.12, search: 0.14, eeat: 0.08, commerce: 0.20, paid: 0.08 },
  saas: { contentQuality: 0.18, health: 0.14, search: 0.18, eeat: 0.10, paid: 0.10 },
  blog: { contentQuality: 0.25, health: 0.12, search: 0.18, eeat: 0.15 },
  news: { contentQuality: 0.22, health: 0.14, search: 0.18, eeat: 0.12 },
  finance: { contentQuality: 0.15, health: 0.12, search: 0.14, eeat: 0.20 },
  healthcare: { contentQuality: 0.15, health: 0.12, search: 0.14, eeat: 0.22, local: 0.04 },
  education: { contentQuality: 0.18, health: 0.12, search: 0.16, eeat: 0.16 },
  local: { contentQuality: 0.14, health: 0.12, search: 0.14, eeat: 0.10, local: 0.18 },
  jobBoard: { contentQuality: 0.18, health: 0.14, search: 0.18, eeat: 0.12 },
  realEstate: { contentQuality: 0.16, health: 0.12, search: 0.16, eeat: 0.10, commerce: 0.08, local: 0.10 },
  restaurant: { contentQuality: 0.14, health: 0.12, search: 0.14, eeat: 0.10, local: 0.16 },
  nonprofit: { contentQuality: 0.20, health: 0.12, search: 0.16, eeat: 0.14 },
};

/** Default weights for qOverall composition. */
export const DEFAULT_OVERALL_WEIGHTS: Record<string, number> = {
  contentQuality: 0.18,
  health: 0.15,
  search: 0.15,
  eeat: 0.12,
  links: 0.10,
  ai: 0.08,
  commerce: 0.07,
  paid: 0.06,
  ux: 0.06,
  social: 0.04,
  local: 0.03,
  email: 0.02,
};

// ── Scoring functions ──────────────────────────────────────────────────

/** Compute a single score component from page data. */
export function computeComponentScore(
  component: ScoreComponentDef,
  pageData: Record<string, unknown>,
): number {
  let totalWeight = 0;
  let weightedSum = 0;

  for (const entry of component.metrics) {
    const raw = pageData[entry.key];
    if (raw === undefined || raw === null) continue;
    const normalized = entry.normalize(raw, pageData);
    weightedSum += normalized * entry.weight;
    totalWeight += entry.weight;
  }

  return totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) / 100 : 0;
}

/** Compute all component scores for a page. */
export function computeAllComponentScores(
  pageData: Record<string, unknown>,
): Record<string, number> {
  const scores: Record<string, number> = {};
  for (const comp of ALL_SCORE_COMPONENTS) {
    scores[comp.name] = computeComponentScore(comp, pageData);
  }
  return scores;
}

/** Compute qOverall from component scores with optional industry weight overrides. */
export function computeQOverall(
  componentScores: Record<string, number>,
  industry?: Industry,
): number {
  const overrides = industry ? INDUSTRY_WEIGHTS[industry] : undefined;
  const weights = { ...DEFAULT_OVERALL_WEIGHTS, ...overrides };

  // Normalize weights so they sum to 1
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  if (totalWeight === 0) return 0;

  let weightedSum = 0;
  for (const [name, weight] of Object.entries(weights)) {
    const score = componentScores[name];
    if (score === undefined) continue;
    weightedSum += score * (weight / totalWeight);
  }

  return Math.round(weightedSum);
}
