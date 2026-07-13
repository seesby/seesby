// Centralized metric value resolution.
// The old pipeline writes flat property names (qualityScore, healthScore, etc.)
// The new L0-L8 pipeline writes canonical dotted keys (p.score.contentQuality, etc.)
// This helper tries canonical key first, then falls back to legacy flat keys.

const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/** Resolve a numeric metric from a page, trying canonical key then legacy keys. */
export function getMetricValue(
  page: Record<string, unknown>,
  canonicalKey: string,
  legacyKeys: string[] = [],
  fallback = 0,
): number {
  // Try canonical dotted key
  const canonical = num(page[canonicalKey]);
  if (canonical) return canonical;

  // Try legacy flat keys
  for (const key of legacyKeys) {
    const v = num(page[key]);
    if (v) return v;
  }

  return fallback;
}

/** Resolve quality score for a page. */
export function getQualityScore(page: Record<string, unknown>, fallback = 0): number {
  return getMetricValue(page, 'p.score.contentQuality', [
    'qualityScore',
    'contentQualityScore',
    'scores.quality',
    'pageScore',
  ], fallback);
}

/** Resolve health/tech score for a page. */
export function getHealthScore(page: Record<string, unknown>): number {
  return getMetricValue(page, 'p.score.health', [
    'healthScore',
    'techHealthScore',
    'technicalScore',
    'scores.tech',
  ]);
}

/** Resolve authority/links score for a page. */
export function getAuthorityScore(page: Record<string, unknown>): number {
  return getMetricValue(page, 'p.score.eeat', [
    'authorityScore',
    'linksScore',
    'scores.links',
  ]);
}

/** Resolve E-E-A-T score for a page. */
export function getEeatScore(page: Record<string, unknown>): number {
  return getMetricValue(page, 'p.content.eeatScore', [
    'eeatScore',
    'scores.eeat',
  ]);
}

/** Resolve value tier for a page. */
export function getValueTier(page: Record<string, unknown>): string {
  const canonical = String(page['p.score.valueTier'] ?? '');
  if (canonical) return canonical;
  return String(page['pageValueTier'] ?? page['valueTier'] ?? 'medium');
}

/** Resolve a generic pillar score for a page. */
export function getPillarScore(
  page: Record<string, unknown>,
  canonicalKey: string,
  legacyKeys: string[] = [],
): number {
  return getMetricValue(page, canonicalKey, legacyKeys);
}
