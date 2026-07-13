/**
 * Deterministic Checker
 *
 * Identifies which metrics can be computed without AI (rules, regex, schema
 * validation, readability formulas, etc.) and provides the computation
 * functions. When the checker reports >95% confidence the AI tier router
 * skips the AI call entirely, saving quota and latency.
 *
 * Category groups (from spec):
 *   - Technical: status, redirects, canonical, robots, sitemap, performance, security, a11y
 *   - On-page:   title, metaDesc, heading hierarchy, word/sentence count, OG/Twitter
 *   - Content:   hash, exact dup, near dup, schema presence, images, readability formulas
 *   - URL:       shape, role classification, soft-404 detection, mobile-friendly
 *   - Links:     link graph, internal/external ratios
 *   - Rendering: JS render diff, form detection
 *   - Security:  SSL, blacklist checks
 */

// ─── Types ─────────────────────────────────────────
export interface DeterministicResult {
  value: any;
  confidence: number;   // 0-1 — deterministic metrics are always 1.0
  method: string;       // e.g. 'regex', 'schema', 'formula', 'rule'
}

export interface PageData {
  url: string;
  status?: number;
  redirectChain?: string[];
  title?: string;
  metaDescription?: string;
  headings?: Record<string, string[]>;   // h1: [...], h2: [...], ...
  bodyText?: string;
  html?: string;
  canonicalUrl?: string;
  robotsMeta?: string;
  robotsTxt?: string;
  sitemapUrls?: string[];
  openGraph?: Record<string, string>;
  twitterCard?: Record<string, string>;
  hreflang?: Array<{ lang: string; href: string }>;
  images?: Array<{ src: string; alt?: string; width?: number; height?: number }>;
  links?: Array<{ href: string; text: string; isInternal: boolean }>;
  schema?: any[];
  sslValid?: boolean;
  sslExpiry?: string;
  mobileFriendly?: boolean;
  forms?: Array<{ action: string; method: string; inputs: string[] }>;
  jsRenderDiff?: { before: string; after: string };
  rawHeaders?: Record<string, string>;
  techPerf?: { fcp?: number; lcp?: number; cls?: number; ttfb?: number };
  wordCount?: number;
  sentenceCount?: number;
  contentHash?: string;
}

// ─── Metric key → determinism map ──────────────────
// true  = always deterministic
// 'partial' = deterministic in most cases (may need AI for edge cases)

const DETERMINISTIC_METRICS = new Map<string, boolean | 'partial'>([
  // ── Technical ────────────────────────────────────
  ['status',                  true],
  ['redirects',               true],
  ['redirectChain',           true],
  ['canonical',               true],
  ['canonicalMatch',          true],
  ['robotsMeta',              true],
  ['robotsTxt',               true],
  ['sitemap',                 true],
  ['sitemapInclusion',        true],
  ['performance',             true],
  ['perf.fcp',                true],
  ['perf.lcp',                true],
  ['perf.cls',                true],
  ['perf.ttfb',               true],
  ['coreWebVitals',           true],
  ['securityHeaders',         true],
  ['a11y',                    true],
  ['a11yColorContrast',       true],
  ['a11yAltText',             true],
  ['ssl',                     true],
  ['blacklist',               true],

  // ── On-page SEO ──────────────────────────────────
  ['title',                   true],
  ['titleLength',             true],
  ['titleContainsKeyword',    'partial'],
  ['metaDesc',                true],
  ['metaDescLength',          true],
  ['hierarchy',               true],
  ['h1Count',                 true],
  ['h1Content',               true],
  ['headingCount',            true],
  ['wordCount',               true],
  ['sentenceCount',           true],
  ['readingTime',             true],

  // ── Social / Meta ────────────────────────────────
  ['og',                      true],
  ['ogImage',                 true],
  ['ogImageRatio',            true],
  ['ogTitle',                 true],
  ['ogDescription',           true],
  ['twitterCard',             true],
  ['twitterTitle',            true],
  ['twitterDescription',      true],
  ['twitterImage',            true],

  // ── Internationalization ──────────────────────────
  ['hreflang',                true],
  ['hreflangValid',           true],
  ['hreflangReturnLinks',     true],

  // ── Content ──────────────────────────────────────
  ['contentHash',             true],
  ['exactDuplicate',          true],
  ['nearDuplicate',           true],
  ['duplicateCluster',        true],
  ['schemaPresence',          true],
  ['schemaValid',             true],
  ['imageCount',              true],
  ['imageAltCoverage',        true],
  ['imageSize',               true],
  ['readabilityFlesch',       true],
  ['readabilityGrade',        true],

  // ── URL ──────────────────────────────────────────
  ['urlShape',                true],
  ['urlLength',               true],
  ['urlDepth',                true],
  ['urlRole',                 true],     // product, blog, category, etc.
  ['isSoft404',               true],
  ['mobileFriendly',          true],

  // ── Forms & Interactivity ────────────────────────
  ['formDetection',           true],
  ['hasLogin',                true],
  ['hasSearch',               true],
  ['hasCart',                 true],
  ['hasNewsletter',           true],

  // ── Links ────────────────────────────────────────
  ['linkGraph',               true],
  ['internalLinkCount',       true],
  ['externalLinkCount',       true],
  ['brokenLinks',             true],
  ['anchorText',              true],
  ['linkRatio',               true],

  // ── JS / Rendering ──────────────────────────────
  ['jsRenderDiff',            true],
  ['jsDifferences',           true],

  // ── Language ─────────────────────────────────────
  ['language',                'partial'],  // regex detect works 95%+ of the time
  ['piiDetection',            'partial'],  // regex for emails/phones is high confidence
  ['aiGeneratedDetection',    'partial'],  // statistical methods can be deterministic
]);

// ─── Computation functions ─────────────────────────

function computeStatus(page: PageData): DeterministicResult {
  return {
    value: page.status,
    confidence: 1.0,
    method: 'http-status',
  };
}

function computeRedirects(page: PageData): DeterministicResult {
  return {
    value: {
      count: page.redirectChain?.length ?? 0,
      chain: page.redirectChain ?? [],
      hasLoop: hasRedirectLoop(page.redirectChain ?? []),
    },
    confidence: 1.0,
    method: 'redirect-chain',
  };
}

function computeCanonical(page: PageData): DeterministicResult {
  const canonical = page.canonicalUrl;
  const normalized = canonical ? normalizeUrl(canonical) : null;
  const pageNormalized = normalizeUrl(page.url);
  return {
    value: {
      present: !!canonical,
      url: canonical ?? null,
      matchesSelf: normalized === pageNormalized,
    },
    confidence: 1.0,
    method: 'meta-tag',
  };
}

function computeHierarchy(page: PageData): DeterministicResult {
  const h = page.headings ?? {};
  const levels = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
  const issues: string[] = [];

  const h1Count = (h.h1 ?? []).length;
  if (h1Count === 0) issues.push('missing_h1');
  if (h1Count > 1) issues.push('multiple_h1');

  // Check for skipped levels
  let prevLevel = 0;
  for (const level of levels) {
    const count = (h[level] ?? []).length;
    if (count > 0) {
      const num = parseInt(level.replace('h', ''), 10);
      if (prevLevel > 0 && num > prevLevel + 1) {
        issues.push(`skipped_level_h${prevLevel}_to_h${num}`);
      }
      prevLevel = num;
    }
  }

  return {
    value: {
      h1Count,
      headingCounts: Object.fromEntries(levels.map(l => [l, (h[l] ?? []).length])),
      issues,
      valid: issues.length === 0,
    },
    confidence: 1.0,
    method: 'heading-analysis',
  };
}

function computeWordCount(page: PageData): DeterministicResult {
  const text = page.bodyText ?? '';
  const words = text.split(/\s+/).filter(w => w.length > 0).length;
  return {
    value: { words, estimatedReadingTimeMin: Math.ceil(words / 250) },
    confidence: 1.0,
    method: 'token-count',
  };
}

function computeReadability(page: PageData): DeterministicResult {
  const text = page.bodyText ?? '';
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const syllables = words.reduce((count, word) => count + countSyllables(word), 0);

  // Flesch Reading Ease
  const sentenceCount = Math.max(sentences.length, 1);
  const wordCount = Math.max(words.length, 1);
  const flesch = Math.max(0, Math.min(100,
    206.835 - 1.015 * (wordCount / sentenceCount) - 84.6 * (syllables / wordCount)
  ));

  // Grade level (Flesch-Kincaid)
  const grade = Math.max(0,
    0.39 * (wordCount / sentenceCount) + 11.8 * (syllables / wordCount) - 15.59
  );

  const gradeLabel =
    grade < 6 ? 'elementary' :
    grade < 8 ? 'plain-english' :
    grade < 12 ? 'high-school' :
    grade < 16 ? 'college' :
    'post-graduate';

  return {
    value: {
      fleschReadingEase: Math.round(flesch * 10) / 10,
      fleschKincaidGrade: Math.round(grade * 10) / 10,
      gradeLabel,
      sentenceCount: sentences.length,
      wordCount: words.length,
      avgWordsPerSentence: Math.round(wordCount / sentenceCount),
    },
    confidence: 1.0,
    method: 'readability-formula',
  };
}

function computeUrlShape(page: PageData): DeterministicResult {
  const url = page.url;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { value: { valid: false, issues: ['invalid_url'] }, confidence: 1.0, method: 'url-parse' };
  }

  const issues: string[] = [];
  if (parsed.pathname.length > 128) issues.push('path_too_long');
  if (parsed.pathname.split('/').filter(Boolean).length > 6) issues.push('too_many_segments');
  if (/[_ ]/.test(parsed.pathname)) issues.push('underscores_or_spaces');
  if (/\.(jpg|jpeg|png|gif|pdf|zip)$/i.test(parsed.pathname)) issues.push('non_html_extension');
  if (parsed.search.length > 256) issues.push('query_too_long');

  return {
    value: {
      valid: issues.length === 0,
      protocol: parsed.protocol,
      host: parsed.host,
      pathSegments: parsed.pathname.split('/').filter(Boolean).length,
      hasTrailingSlash: parsed.pathname.endsWith('/'),
      issues,
    },
    confidence: 1.0,
    method: 'url-parse',
  };
}

function computeUrlRole(page: PageData): DeterministicResult {
  const url = page.url.toLowerCase();
  const title = (page.title ?? '').toLowerCase();
  const bodySnippet = (page.bodyText ?? '').slice(0, 500).toLowerCase();

  let role = 'content'; // default
  let confidence = 0.7;

  // Pattern-based classification
  if (/\/(product|item|p)\/|\.html?\b/.test(url)) {
    role = 'product';
    confidence = 0.9;
  } else if (/\/(category|cat|collection|shop)\/|\/c\//.test(url)) {
    role = 'category';
    confidence = 0.85;
  } else if (/\/(blog|post|article|news|story)\//.test(url)) {
    role = 'blog';
    confidence = 0.95;
  } else if (/\/(about|team|company)/.test(url)) {
    role = 'about';
    confidence = 0.9;
  } else if (/\/(contact|support|help|faq)/.test(url)) {
    role = 'support';
    confidence = 0.9;
  } else if (/\/(pricing|plans|packages)/.test(url)) {
    role = 'pricing';
    confidence = 0.95;
  } else if (/\/(login|signin|signup|register|auth)/.test(url)) {
    role = 'auth';
    confidence = 0.95;
  } else if (/\/(cart|checkout|basket)/.test(url)) {
    role = 'cart';
    confidence = 0.95;
  } else if (/\/(search|q)\b/.test(url)) {
    role = 'search';
    confidence = 0.9;
  } else if (url === '/' || /\/(home|index)/.test(url)) {
    role = 'homepage';
    confidence = 0.95;
  }

  // Boost confidence if title corroborates
  if (role === 'product' && /buy|price|\$|shop/i.test(title)) confidence = Math.min(confidence + 0.05, 1.0);

  return {
    value: { role, confidence },
    confidence,
    method: 'regex-pattern',
  };
}

function computeIsSoft404(page: PageData): DeterministicResult {
  const indicators: string[] = [];
  let score = 0;

  if (page.status === 404) return { value: true, confidence: 1.0, method: 'http-status' };
  if (page.status === 200) {
    // Check for soft-404 indicators
    const title = (page.title ?? '').toLowerCase();
    const body = (page.bodyText ?? '').toLowerCase();

    if (/not found|page not found|does not exist|doesn't exist/.test(title)) {
      indicators.push('title_not_found');
      score += 0.5;
    }
    if (/not found|page not found|does not exist|404/.test(body.slice(0, 1000))) {
      indicators.push('body_not_found');
      score += 0.3;
    }
    if ((page.bodyText ?? '').split(/\s+/).length < 30) {
      indicators.push('thin_content');
      score += 0.1;
    }

    return {
      value: score > 0.5,
      confidence: Math.min(score + 0.3, 0.95),
      method: 'soft-404-patterns',
    };
  }

  return { value: false, confidence: 0.5, method: 'insufficient-data' };
}

function computeSchema(page: PageData): DeterministicResult {
  const schemas = page.schema ?? [];
  return {
    value: {
      present: schemas.length > 0,
      types: schemas.map((s: any) => s['@type'] ?? 'unknown'),
      count: schemas.length,
      hasJsonLd: schemas.some((s: any) => s['@context']?.includes('schema.org')),
    },
    confidence: 1.0,
    method: 'schema-detection',
  };
}

function computeImages(page: PageData): DeterministicResult {
  const images = page.images ?? [];
  const total = images.length;
  const withAlt = images.filter(i => i.alt && i.alt.trim().length > 0).length;
  const withEmptyAlt = images.filter(i => i.alt === '').length;
  const missingAlt = images.filter(i => i.alt === undefined || i.alt === null).length;

  return {
    value: {
      total,
      withAlt,
      withEmptyAlt,
      missingAlt,
      altCoverage: total > 0 ? Math.round((withAlt / total) * 100) : 100,
      largeImages: images.filter(i => (i.width ?? 0) > 1200 || (i.height ?? 0) > 1200).length,
    },
    confidence: 1.0,
    method: 'image-analysis',
  };
}

function computeBrokenLinks(page: PageData): DeterministicResult {
  // This would typically be populated by the crawler itself;
  // we provide the structure for post-crawl analysis.
  const links = page.links ?? [];
  return {
    value: {
      total: links.length,
      internal: links.filter(l => l.isInternal).length,
      external: links.filter(l => !l.isInternal).length,
    },
    confidence: 1.0,
    method: 'link-crawl',
  };
}

function computeMobileFriendly(page: PageData): DeterministicResult {
  const isMobile = page.mobileFriendly;
  return {
    value: isMobile ?? null,
    confidence: isMobile !== undefined ? 1.0 : 0,
    method: 'viewport-detection',
  };
}

function computeJsRenderDiff(page: PageData): DeterministicResult {
  const diff = page.jsRenderDiff;
  if (!diff) return { value: null, confidence: 0, method: 'no-data' };

  const before = diff.before ?? '';
  const after = diff.after ?? '';
  const identical = before === after;
  const lengthDelta = after.length - before.length;

  return {
    value: {
      identical,
      lengthDelta,
      beforeLength: before.length,
      afterLength: after.length,
    },
    confidence: 1.0,
    method: 'text-diff',
  };
}

function computeSecurityHeaders(page: PageData): DeterministicResult {
  const h = page.rawHeaders ?? {};
  const checks = {
    strictTransportSecurity: !!h['strict-transport-security'],
    contentSecurityPolicy: !!h['content-security-policy'],
    xContentTypeOptions: !!h['x-content-type-options'],
    xFrameOptions: !!h['x-frame-options'],
    referrerPolicy: !!h['referrer-policy'],
    permissionsPolicy: !!h['permissions-policy'],
  };

  const present = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;

  return {
    value: {
      checks,
      present,
      total,
      score: Math.round((present / total) * 100),
    },
    confidence: 1.0,
    method: 'header-check',
  };
}

function computeSsl(page: PageData): DeterministicResult {
  return {
    value: {
      valid: page.sslValid ?? null,
      expiry: page.sslExpiry ?? null,
    },
    confidence: page.sslValid !== undefined ? 1.0 : 0,
    method: 'ssl-check',
  };
}

function computeLanguage(page: PageData): DeterministicResult {
  const html = page.html ?? '';
  const text = page.bodyText ?? '';

  // Try <html lang="...">
  const langMatch = html.match(/<html[^>]+lang=["']([^"']+)["']/i);
  if (langMatch) {
    return { value: langMatch[1], confidence: 0.95, method: 'html-lang-attr' };
  }

  // Heuristic: character frequency analysis (simplified)
  // This is a stub — real implementation would use a language detection library
  return {
    value: 'en', // default fallback
    confidence: 0.6,
    method: 'heuristic-fallback',
  };
}

function computePiiDetection(page: PageData): DeterministicResult {
  const text = page.bodyText ?? '';
  const findings: string[] = [];

  // Email patterns
  const emails = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/g) ?? [];
  if (emails.length > 0) findings.push(`emails:${emails.length}`);

  // Phone patterns (US)
  const phones = text.match(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g) ?? [];
  if (phones.length > 0) findings.push(`phones:${phones.length}`);

  // SSN patterns
  const ssns = text.match(/\b\d{3}-\d{2}-\d{4}\b/g) ?? [];
  if (ssns.length > 0) findings.push(`ssns:${ssns.length}`);

  // Credit card patterns (simplified)
  const cc = text.match(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g) ?? [];
  if (cc.length > 0) findings.push(`credit_cards:${cc.length}`);

  return {
    value: {
      detected: findings.length > 0,
      findings,
      emailCount: emails.length,
      phoneCount: phones.length,
    },
    confidence: 0.9,
    method: 'regex-pattern',
  };
}

function computeAiGeneratedDetection(page: PageData): DeterministicResult {
  const text = page.bodyText ?? '';
  const words = text.split(/\s+/);
  const wordCount = words.length;
  if (wordCount < 50) {
    return { value: null, confidence: 0, method: 'insufficient-data' };
  }

  // Simple statistical heuristics (not AI-dependent):
  // 1. Vocabulary richness (type-token ratio)
  const uniqueWords = new Set(words.map(w => w.toLowerCase())).size;
  const typeTokenRatio = uniqueWords / wordCount;

  // 2. Average sentence length variance
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const sentLengths = sentences.map(s => s.split(/\s+/).length);
  const avgSentLen = sentLengths.reduce((a, b) => a + b, 0) / Math.max(sentLengths.length, 1);
  const variance = sentLengths.reduce((sum, l) => sum + Math.pow(l - avgSentLen, 2), 0) / Math.max(sentLengths.length, 1);

  // 3. Repetitive phrasing score
  const bigrams = words.slice(0, -1).map((w, i) => `${w.toLowerCase()}_${words[i + 1].toLowerCase()}`);
  const uniqueBigrams = new Set(bigrams).size;
  const bigramDiversity = uniqueBigrams / Math.max(bigrams.length, 1);

  // Low type-token ratio + low bigram diversity + low variance = AI-ish
  const aiIndicator = (1 - typeTokenRatio) * 0.4 + (1 - bigramDiversity) * 0.4 + (1 / (1 + variance)) * 0.2;

  return {
    value: {
      aiLikelihoodScore: Math.round(aiIndicator * 100) / 100,
      typeTokenRatio: Math.round(typeTokenRatio * 100) / 100,
      bigramDiversity: Math.round(bigramDiversity * 100) / 100,
      sentenceVariance: Math.round(variance * 10) / 10,
    },
    confidence: 0.7,  // statistical methods are good but not perfect
    method: 'statistical-heuristic',
  };
}

function computeForms(page: PageData): DeterministicResult {
  const forms = page.forms ?? [];
  return {
    value: {
      count: forms.length,
      hasLogin: forms.some(f => /login|signin|auth/.test(f.action)),
      hasSearch: forms.some(f => /search/.test(f.action) || f.inputs.some(i => /search|query|q/.test(i))),
      hasNewsletter: forms.some(f => /newsletter|subscribe|email/.test(f.action)),
      hasCart: forms.some(f => /cart|checkout|basket/.test(f.action)),
    },
    confidence: 1.0,
    method: 'form-detection',
  };
}

function computeOgImage(page: PageData): DeterministicResult {
  const og = page.openGraph ?? {};
  const img = og['og:image'] ?? null;
  return {
    value: {
      present: !!img,
      url: img,
      hasWidthHeight: !!(og['og:image:width'] && og['og:image:height']),
      width: og['og:image:width'] ? parseInt(og['og:image:width'], 10) : null,
      height: og['og:image:height'] ? parseInt(og['og:image:height'], 10) : null,
      ratio: og['og:image:width'] && og['og:image:height']
        ? parseInt(og['og:image:width'], 10) / parseInt(og['og:image:height'], 10)
        : null,
    },
    confidence: 1.0,
    method: 'meta-tag',
  };
}

function computeHreflang(page: PageData): DeterministicResult {
  const tags = page.hreflang ?? [];
  const returnLinks: string[] = [];
  const issues: string[] = [];

  for (const tag of tags) {
    if (!tag.lang) issues.push('missing_lang');
    if (!tag.href) issues.push('missing_href');
  }

  // Check for x-default
  const hasXDefault = tags.some(t => t.lang === 'x-default');

  return {
    value: {
      count: tags.length,
      languages: tags.map(t => t.lang),
      hasXDefault,
      issues,
    },
    confidence: 1.0,
    method: 'meta-tag',
  };
}

function computeNearDuplicate(page: PageData): DeterministicResult {
  // Content hash comparison would be done at batch level
  // This provides the hash for the batch deduplicator to use
  return {
    value: {
      contentHash: page.contentHash ?? null,
      // Simhash-like fingerprint (simplified)
      fingerprint: page.contentHash ? simpleFingerprint(page.contentHash) : null,
    },
    confidence: page.contentHash ? 1.0 : 0,
    method: 'content-hash',
  };
}

// ─── Helpers ───────────────────────────────────────

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    return `${u.hostname}${u.pathname.replace(/\/$/, '')}`.toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

function hasRedirectLoop(chain: string[]): boolean {
  const seen = new Set<string>();
  for (const url of chain) {
    if (seen.has(normalizeUrl(url))) return true;
    seen.add(normalizeUrl(url));
  }
  return false;
}

function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 2) return 1;

  let count = 0;
  const vowels = 'aeiouy';
  let prevVowel = false;

  for (const char of word) {
    const isVowel = vowels.includes(char);
    if (isVowel && !prevVowel) count++;
    prevVowel = isVowel;
  }

  // Adjust for silent-e
  if (word.endsWith('e') && count > 1) count--;
  return Math.max(count, 1);
}

function simpleFingerprint(hash: string): number {
  // Convert hex hash to a 32-bit integer fingerprint
  let fingerprint = 0;
  for (let i = 0; i < Math.min(hash.length, 8); i++) {
    fingerprint = ((fingerprint << 5) - fingerprint) + parseInt(hash[i], 16);
    fingerprint = fingerprint & fingerprint; // Convert to 32-bit int
  }
  return Math.abs(fingerprint);
}

// ─── Computation dispatch ──────────────────────────
const COMPUTE_FNS: Record<string, (page: PageData) => DeterministicResult> = {
  status:             computeStatus,
  redirects:          computeRedirects,
  redirectChain:      computeRedirects,
  canonical:          computeCanonical,
  canonicalMatch:     computeCanonical,
  hierarchy:          computeHierarchy,
  headingHierarchy:   computeHierarchy,
  wordCount:          computeWordCount,
  sentenceCount:      computeWordCount,
  readabilityFlesch:  computeReadability,
  readabilityGrade:   computeReadability,
  urlShape:           computeUrlShape,
  urlLength:          computeUrlShape,
  urlDepth:           computeUrlShape,
  urlRole:            computeUrlRole,
  isSoft404:          computeIsSoft404,
  schemaPresence:     computeSchema,
  schemaValid:        computeSchema,
  imageCount:         computeImages,
  imageAltCoverage:   computeImages,
  brokenLinks:        computeBrokenLinks,
  mobileFriendly:     computeMobileFriendly,
  jsRenderDiff:       computeJsRenderDiff,
  securityHeaders:    computeSecurityHeaders,
  ssl:                computeSsl,
  language:           computeLanguage,
  piiDetection:       computePiiDetection,
  aiGeneratedDetection: computeAiGeneratedDetection,
  formDetection:      computeForms,
  ogImage:            computeOgImage,
  ogImageRatio:       computeOgImage,
  hreflang:           computeHreflang,
  nearDuplicate:      computeNearDuplicate,
  contentHash:        computeNearDuplicate,
};

// ─── Public API ────────────────────────────────────

/**
 * Returns true if the metric can be computed deterministically (without AI).
 * @param metricKey - The metric identifier (e.g. 'status', 'readabilityFlesch')
 * @returns true | 'partial' | false
 */
export function canComputeDeterministically(metricKey: string): boolean | 'partial' {
  const result = DETERMINISTIC_METRICS.get(metricKey);
  if (result !== undefined) return result;

  // Fuzzy match: try without dots and camelCase → kebab
  const normalized = metricKey.replace(/\./g, '').toLowerCase();
  for (const [key, value] of DETERMINISTIC_METRICS) {
    if (key.replace(/\./g, '').toLowerCase() === normalized) return value;
  }
  return false;
}

/**
 * Compute a metric deterministically from page data.
 * Returns null if the metric cannot be computed deterministically,
 * or if the required page data is missing.
 */
export function computeDeterministically(
  metricKey: string,
  pageData: PageData
): DeterministicResult | null {
  const deterministic = canComputeDeterministically(metricKey);
  if (!deterministic) return null;

  // Try exact match first
  const fn = COMPUTE_FNS[metricKey];
  if (fn) return fn(pageData);

  // Try normalized key
  const normalized = metricKey.replace(/\./g, '').toLowerCase();
  for (const [key, computeFn] of Object.entries(COMPUTE_FNS)) {
    if (key.replace(/\./g, '').toLowerCase() === normalized) {
      return computeFn(pageData);
    }
  }

  return null;
}

/**
 * Batch compute all deterministic metrics for a page.
 * Returns a map of metricKey → DeterministicResult for all metrics
 * that can be computed without AI.
 */
export function computeAllDeterministic(pageData: PageData): Map<string, DeterministicResult> {
  const results = new Map<string, DeterministicResult>();

  for (const [metricKey, deterministic] of DETERMINISTIC_METRICS) {
    if (deterministic === false) continue;

    const fn = COMPUTE_FNS[metricKey];
    if (fn) {
      const result = fn(pageData);
      // Only include if we have sufficient data (confidence > 0)
      if (result.confidence > 0) {
        results.set(metricKey, result);
      }
    }
  }

  return results;
}

/**
 * Get all deterministic metric keys, optionally filtered by category.
 */
export function getDeterministicMetrics(category?: string): string[] {
  const all = [...DETERMINISTIC_METRICS.keys()];

  if (!category) return all;

  const categoryPrefixes: Record<string, string[]> = {
    technical: ['status', 'redirect', 'canonical', 'robots', 'sitemap', 'perf', 'security', 'a11y', 'ssl'],
    onpage:    ['title', 'meta', 'hierarchy', 'heading', 'word', 'sentence', 'reading'],
    social:    ['og', 'twitter'],
    content:   ['content', 'schema', 'image', 'readability', 'hash', 'duplicate'],
    url:       ['url', 'isSoft', 'mobile'],
    links:     ['link', 'anchor', 'broken'],
    forms:     ['form', 'login', 'search', 'cart', 'newsletter'],
    language:  ['language', 'pii', 'aiGenerated', 'hreflang'],
    rendering: ['jsRender', 'jsDiff'],
  };

  const prefixes = categoryPrefixes[category] ?? [];
  return all.filter(m =>
    prefixes.some(p => m.toLowerCase().includes(p.toLowerCase()))
  );
}
