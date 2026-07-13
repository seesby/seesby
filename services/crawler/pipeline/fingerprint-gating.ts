// services/crawler/pipeline/fingerprint-gating.ts
//
// Fingerprint-based adaptive visibility. Evaluates whether each metric
// should be shown/hidden (or weight-adjusted) based on the project
// fingerprint. This extends the static `MetricGate` checks in
// packages/metrics/src/gates.ts with dynamic, fingerprint-aware rules.

import type { Industry } from '../../packages/types/src/industries';
import type { CmsKey } from '../../packages/types/src/cms';
import type { MetricDef } from '../../packages/types/src/metric-def';

// ── Fingerprint duck-typed interface (avoids circular deps) ────────────

interface FpValueLike<T> {
  value: T;
  confidence: number;
}

interface FpStackLike {
  [key: string]: { value: string | string[] | number | number[]; confidence: number };
}

export interface ProjectFingerprint {
  industry?: FpValueLike<Industry>;
  cms?: FpValueLike<CmsKey>;
  languagePrimary?: FpValueLike<string>;
  stack?: FpStackLike;
  size?: { urls?: FpValueLike<number> };
}

// ── Gate rule ──────────────────────────────────────────────────────────

export interface GateRule {
  /** Namespace prefix this rule applies to (e.g. 'p.commerce', 'p.local'). */
  readonly metricNamespace: string;
  /** Human-readable reason for this rule. */
  readonly description: string;
  /**
   * Evaluate whether metrics under this namespace should be visible
   * given the current project fingerprint.
   */
  condition(fp: ProjectFingerprint): boolean;
}

// ── Internal helpers ───────────────────────────────────────────────────

/** Get the primary industry value from a fingerprint. */
function industryOf(fp: ProjectFingerprint): Industry {
  return fp.industry?.value ?? 'general';
}

/** Get the primary language code from a fingerprint. */
function langOf(fp: ProjectFingerprint): string {
  return fp.languagePrimary?.value ?? 'en';
}

/** Check whether a fingerprint's stack has a key with any value. */
function stackHas(fp: ProjectFingerprint, key: string): boolean {
  const entry = fp.stack?.[key];
  if (!entry) return false;
  if (typeof entry.value === 'string') return entry.value.length > 0;
  if (Array.isArray(entry.value)) return entry.value.length > 0;
  return false;
}

/** Check whether the stack contains a value within a key. */
function stackContains(fp: ProjectFingerprint, key: string, needle: string): boolean {
  const entry = fp.stack?.[key];
  if (!entry) return false;
  if (typeof entry.value === 'string') return entry.value.includes(needle);
  if (Array.isArray(entry.value)) return entry.value.some((v) => v.includes(needle));
  return false;
}

/** Return the set of detected languages from the fingerprint. */
function detectedLanguages(fp: ProjectFingerprint): string[] {
  const langEntry = fp.stack?.['languages'];
  if (!langEntry) return [];
  if (Array.isArray(langEntry.value)) return langEntry.value as string[];
  if (typeof langEntry.value === 'string') return [langEntry.value];
  return [];
}

// ── Gate rules registry ────────────────────────────────────────────────

const GATE_RULES: ReadonlyArray<GateRule> = [
  // ── p.commerce.* ─────────────────────────────────────────────────────
  {
    metricNamespace: 'p.commerce',
    description: 'Commerce metrics require ecommerce industry or e-commerce stack detection.',
    condition: (fp) =>
      industryOf(fp) === 'ecommerce' || stackHas(fp, 'stack.ecom'),
  },

  // ── p.local.* ────────────────────────────────────────────────────────
  {
    metricNamespace: 'p.local',
    description: 'Local metrics require a local/hyper-local industry or multi-location presence.',
    condition: (fp) => {
      const industry = industryOf(fp);
      const localIndustries: Industry[] = ['local', 'restaurant', 'healthcare', 'finance', 'realEstate'];
      if (localIndustries.includes(industry)) return true;
      // Multi-location heuristic: stack carries a 'locations' count > 1.
      const locEntry = fp.stack?.['locations'];
      if (locEntry) {
        const count = typeof locEntry.value === 'number'
          ? locEntry.value
          : Array.isArray(locEntry.value) ? locEntry.value.length : 0;
        if (count > 1) return true;
      }
      return false;
    },
  },

  // ── p.email.* ────────────────────────────────────────────────────────
  {
    metricNamespace: 'p.email',
    description: 'Email metrics require an email stack tool or a detected signup CTA.',
    condition: (fp) =>
      stackHas(fp, 'email') ||
      stackContains(fp, 'signupCta', 'email') ||
      stackHas(fp, 'stack.email'),
  },

  // ── p.news.* ─────────────────────────────────────────────────────────
  {
    metricNamespace: 'p.news',
    description: 'News metrics require news/media industry or NewsArticle schema presence.',
    condition: (fp) => {
      const industry = industryOf(fp);
      if (industry === 'news' || industry === 'media') return true;
      return stackContains(fp, 'schemas', 'NewsArticle');
    },
  },

  // ── p.jobs.* ─────────────────────────────────────────────────────────
  {
    metricNamespace: 'p.jobs',
    description: 'Job board metrics require jobboard industry or JobPosting schema.',
    condition: (fp) =>
      industryOf(fp) === 'jobBoard' || stackContains(fp, 'schemas', 'JobPosting'),
  },

  // ── p.lang.* ─────────────────────────────────────────────────────────
  {
    metricNamespace: 'p.lang',
    description: 'hreflang metrics only shown when more than one language is detected.',
    condition: (fp) => detectedLanguages(fp).length > 1,
  },

  // ── p.tech.consent.mode ──────────────────────────────────────────────
  {
    metricNamespace: 'p.tech.consent',
    description: 'Consent mode metrics require GA4 connection.',
    condition: (fp) => stackHas(fp, 'ga4') || stackHas(fp, 'stack.ga4'),
  },

  // ── p.paid.* ─────────────────────────────────────────────────────────
  {
    metricNamespace: 'p.paid',
    description: 'Paid metrics require Paid mode or detected ad platforms in the stack.',
    condition: (fp) => stackHas(fp, 'adPlatforms') || stackHas(fp, 'stack.adPlatforms'),
  },

  // ── p.search.discover ────────────────────────────────────────────────
  {
    metricNamespace: 'p.search.discover',
    description: 'Discover metrics require a supported country and news/blog/ecommerce industry.',
    condition: (fp) => {
      const industry = industryOf(fp);
      const supported: Industry[] = ['news', 'blog', 'ecommerce'];
      if (!supported.includes(industry)) return false;
      // Country must be in a supported set (US, UK, AU, etc.)
      const geo = fp.stack?.['geo']?.value;
      const supportedCountries = ['us', 'uk', 'au', 'ca', 'in', 'de', 'fr', 'br', 'jp'];
      if (typeof geo === 'string') return supportedCountries.includes(geo.toLowerCase());
      return false;
    },
  },

  // ── p.ai.citation.* ──────────────────────────────────────────────────
  // Always computed; skip engines with no coverage. This is handled at
  // compute-time, not as a visibility gate. Documented here for reference.
];

// ── E-E-A-T expertise weight boost industries ──────────────────────────

const EEXP_BOOST_INDUSTRIES: ReadonlySet<Industry> = new Set([
  'finance',
  'healthcare',
]);

/**
 * Returns a multiplier for expertise weight in E-E-A-T scoring.
 * Returns 1.5 for finance/healthcare, 1.0 otherwise.
 */
export function getExpertiseWeightMultiplier(fp: ProjectFingerprint): number {
  return EEXP_BOOST_INDUSTRIES.has(industryOf(fp)) ? 1.5 : 1.0;
}

/**
 * Pick the correct readability formula based on the primary language.
 * Delegates to the LANGUAGES descriptors in @seesby/types.
 */
export function getReadabilityFormula(fp: ProjectFingerprint): string {
  const lang = langOf(fp);
  // CJK languages use character-count.
  if (['zh', 'ja', 'ko'].includes(lang)) return 'character-count';
  // RTL languages.
  if (['ar', 'he', 'fa', 'ur'].includes(lang)) return 'osman-ar';
  return lang; // returns the lang code; callers resolve via LANGUAGES[lang].readabilityFormula
}

/**
 * Returns true if the site is multi-lingual (more than one language detected).
 */
export function isMultiLanguage(fp: ProjectFingerprint): boolean {
  return detectedLanguages(fp).length > 1;
}

/**
 * Returns true if the primary language uses RTL script.
 */
export function isRtlLanguage(fp: ProjectFingerprint): boolean {
  const lang = langOf(fp);
  return ['ar', 'he', 'fa', 'ur'].includes(lang);
}

/**
 * Returns true if the primary language uses CJK script.
 */
export function isCjkLanguage(fp: ProjectFingerprint): boolean {
  const lang = langOf(fp);
  return ['zh', 'ja', 'ko'].includes(lang);
}

// ── Public API ─────────────────────────────────────────────────────────

/**
 * Evaluate a single gate rule against the fingerprint.
 * Returns true if the metric should be shown.
 */
export function evaluateGate(metric: MetricDef, fp: ProjectFingerprint): boolean {
  // If the metric has no namespace prefix (e.g. site-level), always show.
  if (!metric.namespace || !metric.namespace.startsWith('p.')) return true;

  // Find the most specific matching rule.
  let matched: GateRule | null = null;
  for (const rule of GATE_RULES) {
    if (metric.namespace === rule.metricNamespace || metric.namespace.startsWith(rule.metricNamespace + '.')) {
      if (!matched || rule.metricNamespace.length > matched.metricNamespace.length) {
        matched = rule;
      }
    }
  }

  if (!matched) return true;
  return matched.condition(fp);
}

/**
 * Filter an array of MetricDefs to only those that pass fingerprint gating.
 */
export function getGatedMetrics(
  allMetrics: ReadonlyArray<MetricDef>,
  fp: ProjectFingerprint,
): MetricDef[] {
  return allMetrics.filter((m) => evaluateGate(m, fp));
}

/**
 * Get all registered gate rules (for debugging / UI display).
 */
export function getGateRules(): ReadonlyArray<GateRule> {
  return GATE_RULES;
}

/**
 * Find the gate rule that applies to a given namespace.
 * Returns undefined if no rule matches.
 */
export function findGateRule(namespace: string): GateRule | undefined {
  let matched: GateRule | undefined;
  for (const rule of GATE_RULES) {
    if (namespace === rule.metricNamespace || namespace.startsWith(rule.metricNamespace + '.')) {
      if (!matched || rule.metricNamespace.length > matched.metricNamespace.length) {
        matched = rule;
      }
    }
  }
  return matched;
}

/**
 * Return a list of namespaces that have explicit gate rules.
 */
export function getGatedNamespaces(): string[] {
  return GATE_RULES.map((r) => r.metricNamespace);
}
