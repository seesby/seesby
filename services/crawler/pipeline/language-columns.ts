// services/crawler/pipeline/language-columns.ts
//
// Language-specific metric definitions. When the project fingerprint
// identifies particular language characteristics (CJK script, RTL,
// non-English, multi-language), these columns are injected into views
// so users see the appropriate analysis fields.

import type { LanguageCode, MetricDef } from '@seesby/types';
import { LANGUAGES, type LanguageDescriptor } from '@seesby/types';

// ── Helper: build a MetricDef from minimal parameters ──────────────────

function metric(
  key: string,
  namespace: string,
  label: string,
  description: string,
  extra: Partial<Pick<MetricDef, 'roles' | 'sources' | 'format' | 'unit' | 'width' | 'gate'>> = {},
): MetricDef {
  return {
    key,
    namespace,
    level: 'P',
    roles: extra.roles ?? ['G', 'I', 'X'],
    sources: extra.sources ?? ['T2', 'T6'],
    format: extra.format ?? 'number',
    unit: extra.unit,
    width: extra.width,
    i18nLabelKey: `metric.${key}.label`,
    description,
    gate: extra.gate,
  };
}

// ── CJK language metrics (zh, ja, ko) ─────────────────────────────────

const CJK_METRICS: MetricDef[] = [
  metric('p.lang.charCount', 'p.lang', 'Character Count', 'Total characters (including CJK), replacing word count for CJK text.', {
    roles: ['G', 'I', 'X', 'S'],
    unit: 'count',
    gate: { languages: ['zh', 'ja', 'ko'] },
  }),
  metric('p.lang.charsPerSentence', 'p.lang', 'Chars / Sentence', 'Average character count per sentence for CJK readability.', {
    roles: ['I', 'S'],
    unit: 'count',
    gate: { languages: ['zh', 'ja', 'ko'] },
  }),
  metric('p.lang.cjkReadability', 'p.lang', 'CJK Readability', 'Character-based readability score for CJK content.', {
    format: 'score',
    roles: ['G', 'I', 'S', 'A'],
    gate: { languages: ['zh', 'ja', 'ko'] },
  }),
  metric('p.lang.charCountBody', 'p.lang', 'Body Char Count', 'Character count of the main body text only.', {
    roles: ['I', 'X'],
    unit: 'count',
    gate: { languages: ['zh', 'ja', 'ko'] },
  }),
];

// ── RTL language metrics (ar, he, fa, ur) ─────────────────────────────

const RTL_METRICS: MetricDef[] = [
  metric('p.rtl.alignmentIssues', 'p.rtl', 'Alignment Issues', 'Number of elements with incorrect RTL text alignment.', {
    roles: ['G', 'I', 'S', 'A'],
    unit: 'count',
    gate: { languages: ['ar', 'he', 'fa', 'ur'] },
  }),
  metric('p.rtl.mirrorIssues', 'p.rtl', 'Mirror Issues', 'Number of bidirectional text mirroring problems detected.', {
    roles: ['G', 'I', 'S', 'A'],
    unit: 'count',
    gate: { languages: ['ar', 'he', 'fa', 'ur'] },
  }),
  metric('p.rtl.cssDirection', 'p.rtl', 'CSS Direction', 'Whether the root element has correct direction:rtl CSS.', {
    format: 'boolean',
    roles: ['I'],
    gate: { languages: ['ar', 'he', 'fa', 'ur'] },
  }),
  metric('p.rtl.mixedDirection', 'p.rtl', 'Mixed Direction', 'Number of elements with mixed LTR/RTL content.', {
    roles: ['I'],
    unit: 'count',
    gate: { languages: ['ar', 'he', 'fa', 'ur'] },
  }),
];

// ── Non-English grammar metrics ────────────────────────────────────────

const NON_ENGLISH_GRAMMAR_METRICS: MetricDef[] = [
  metric('p.grammar.aiModel', 'p.grammar', 'AI Grammar Score', 'AI-powered grammar score for non-English content.', {
    format: 'score',
    roles: ['G', 'I', 'S', 'A'],
    sources: ['T6'],
    // Shown for any non-English language that has grammar support.
    gate: { languages: ['es', 'fr', 'de', 'pt', 'it', 'nl', 'pl', 'ru', 'uk', 'cs', 'da', 'fi', 'hu', 'no', 'ro', 'sv', 'ja', 'ko', 'zh'] },
  }),
  metric('p.grammar.spellingAi', 'p.grammar', 'AI Spelling Score', 'AI-powered spelling assessment for non-English content.', {
    format: 'score',
    roles: ['I', 'S'],
    sources: ['T6'],
    gate: { languages: ['es', 'fr', 'de', 'pt', 'it', 'nl', 'pl', 'ru', 'uk', 'cs', 'da', 'fi', 'hu', 'no', 'ro', 'sv', 'ja', 'ko', 'zh'] },
  }),
];

// ── Multi-language metrics ─────────────────────────────────────────────

const MULTI_LANG_METRICS: MetricDef[] = [
  metric('p.lang.hreflangMatrix', 'p.lang', 'Hreflang Matrix', 'Completeness of the hreflang implementation across all detected languages.', {
    format: 'percent',
    roles: ['G', 'I', 'R', 'S', 'A'],
    sources: ['T0', 'T2'],
  }),
  metric('p.lang.match', 'p.lang', 'Language Match', 'Whether page content language matches declared hreflang / lang attribute.', {
    format: 'boolean',
    roles: ['G', 'I', 'S', 'A'],
    sources: ['T0', 'T2'],
  }),
  metric('p.lang.duplicates', 'p.lang', 'Per-Locale Duplicates', 'Number of duplicate pages across different language versions.', {
    roles: ['G', 'I', 'S'],
    unit: 'count',
    sources: ['T0', 'T2', 'T6'],
  }),
  metric('p.lang.hreflangErrors', 'p.lang', 'Hreflang Errors', 'Number of hreflang implementation errors found.', {
    roles: ['G', 'I', 'S', 'A'],
    unit: 'count',
    sources: ['T0'],
  }),
  metric('p.lang.missingTranslations', 'p.lang', 'Missing Translations', 'Number of pages with missing translations for a language in the hreflang set.', {
    roles: ['I', 'S'],
    unit: 'count',
    sources: ['T0', 'T6'],
  }),
  metric('p.lang.defaultLang', 'p.lang', 'Default Language', 'The primary/default language declared for the site.', {
    format: 'text',
    roles: ['I'],
    sources: ['T0'],
  }),
];

// ── Readability formula selector (non-English) ─────────────────────────

const READABILITY_NON_EN_METRICS: MetricDef[] = [
  metric('p.readability.formula', 'p.readability', 'Readability Formula', 'The readability formula applied based on the primary language.', {
    format: 'enum',
    roles: ['I'],
    sources: ['T8'],
    gate: { languages: ['es', 'fr', 'de', 'pt', 'it', 'nl', 'pl', 'ar'] },
  }),
  metric('p.readability.score', 'p.readability', 'Readability Score', 'Language-appropriate readability score.', {
    format: 'score',
    roles: ['G', 'I', 'S', 'A'],
    sources: ['T0', 'T2'],
    gate: { languages: ['es', 'fr', 'de', 'pt', 'it', 'nl', 'pl', 'ar'] },
  }),
];

// ── Language code → metric groups mapping ──────────────────────────────

function isCjk(code: LanguageCode): boolean {
  return ['zh', 'ja', 'ko'].includes(code);
}

function isRtl(code: LanguageCode): boolean {
  return ['ar', 'he', 'fa', 'ur'].includes(code);
}

function isNonEnglish(code: LanguageCode): boolean {
  return code !== 'en' && code !== 'unknown';
}

// ── Public API ─────────────────────────────────────────────────────────

/**
 * Return language-specific metric definitions for the given primary language.
 * Combines CJK, RTL, non-English grammar, and readability metrics as
 * appropriate for the language.
 */
export function getLanguageSpecificColumns(lang: LanguageCode): MetricDef[] {
  const out: MetricDef[] = [];

  if (isCjk(lang)) {
    out.push(...CJK_METRICS);
  }

  if (isRtl(lang)) {
    out.push(...RTL_METRICS);
  }

  if (isNonEnglish(lang)) {
    out.push(...NON_ENGLISH_GRAMMAR_METRICS);
    out.push(...READABILITY_NON_EN_METRICS);
  }

  return out;
}

/**
 * Return multi-language metrics. These should be shown when the project
 * has more than one detected language.
 */
export function getMultiLanguageColumns(): MetricDef[] {
  return MULTI_LANG_METRICS;
}

/**
 * Returns true if the language uses character-based counting instead of
 * word-based counting.
 */
export function usesCharCount(lang: LanguageCode): boolean {
  return isCjk(lang);
}

/**
 * Returns true if the language uses RTL text direction.
 */
export function usesRtlDirection(lang: LanguageCode): boolean {
  return isRtl(lang);
}

/**
 * Returns the readability formula key for the given language.
 * Delegates to the LANGUAGES descriptor when available.
 */
export function getReadabilityFormulaForLang(lang: LanguageCode): string {
  const descriptor: LanguageDescriptor | undefined = LANGUAGES[lang];
  return descriptor?.readabilityFormula ?? 'none';
}

/**
 * Returns true if Grammarly-style grammar checking should be disabled
 * for this language (non-English).
 */
export function shouldDisableGrammarly(lang: LanguageCode): boolean {
  return isNonEnglish(lang);
}

/**
 * Returns all language-specific metric definitions across all languages.
 * Useful for building the full metric registry.
 */
export function getAllLanguageColumns(): MetricDef[] {
  const seen = new Set<string>();
  const out: MetricDef[] = [];

  // Collect all per-language metrics.
  const allLangs = Object.keys(LANGUAGES) as LanguageCode[];
  for (const lang of allLangs) {
    for (const m of getLanguageSpecificColumns(lang)) {
      if (!seen.has(m.key)) {
        seen.add(m.key);
        out.push(m);
      }
    }
  }

  // Add multi-language metrics.
  for (const m of getMultiLanguageColumns()) {
    if (!seen.has(m.key)) {
      seen.add(m.key);
      out.push(m);
    }
  }

  return out;
}
