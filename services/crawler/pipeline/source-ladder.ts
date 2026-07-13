// services/crawler/pipeline/source-ladder.ts
//
// Source-ladder utilities. Every metric value carries an ordered list of
// sources (T0-T8). The first tier that returns a fresh value wins.

import type { SourceTier, SourceTag } from '@seesby/types';

// ── Re-export the shared type so consumers can import from this module ──
export type { SourceTier };

// ── Visual tag definition returned by getSourceTag ──────────────────────

export interface SourceTierTag {
	symbol: string;
	label: string;
	/** Tailwind-compatible colour class name (without the `text-` prefix). */
	color: string;
}

// ── Tier metadata ───────────────────────────────────────────────────────

const TIER_MAP: Record<SourceTier, SourceTierTag> = {
	T0: { symbol: '●', label: 'authoritative', color: 'text-emerald-600' },
	T1: { symbol: '●', label: 'free-api',      color: 'text-emerald-600' },
	T2: { symbol: '◐', label: 'browser',       color: 'text-blue-500' },
	T3: { symbol: '◑', label: 'scrape',        color: 'text-orange-500' },
	T4: { symbol: '◌', label: 'public',        color: 'text-gray-500' },
	T5: { symbol: '◑', label: 'derived',       color: 'text-orange-500' },
	T6: { symbol: '◌', label: 'ai',            color: 'text-purple-500' },
	T7: { symbol: '◌', label: 'est',           color: 'text-gray-400' },
	T8: { symbol: '◌', label: 'default',       color: 'text-gray-300' },
};

// ── Helper: get tag info for a tier ─────────────────────────────────────

export function getSourceTag(tier: SourceTier): SourceTierTag {
	return TIER_MAP[tier];
}

// ── Freshness classes ───────────────────────────────────────────────────

export type FreshnessClass =
	| 'live'
	| 'recent'
	| 'fresh'
	| 'ok'
	| 'stale'
	| 'unknown';

const FRESHNESS_SYMBOLS: Record<FreshnessClass, string> = {
	live:    '●',
	recent:  '●',
	fresh:   '◐',
	ok:      '◑',
	stale:   '⟲',
	unknown: '·',
};

/** Render symbol for each SourceTag kind (§4 chip system). */
export const TAG_SYMBOLS: Record<SourceTag, string> = {
	source:  '●',
	live:    '●',
	browser: '◐',
	scrape:  '◑',
	stale:   '⟲',
	ai:      '◌',
	est:     '◌',
	'low-n': '⚠',
	default: '◌',
};

/** Render a SourceTag as a compact chip string. */
export function renderTagChip(tag: SourceTag): string {
	return `${TAG_SYMBOLS[tag]}${tag}`;
}

const FRESHNESS_LABELS: Record<FreshnessClass, string> = {
	live:    'live',
	recent:  'recent',
	fresh:   'fresh',
	ok:      'ok',
	stale:   'stale',
	unknown: 'unknown',
};

/**
 * Classify a timestamp into a freshness bucket.
 *
 * Thresholds:
 *   live    < 5 min
 *   recent  < 24 h
 *   fresh   < 7 days
 *   ok      < 30 days
 *   stale   >= 30 days
 *   unknown when the timestamp is missing / epoch 0
 */
export function getFreshnessClass(lastUpdated: Date | null | undefined): FreshnessClass {
	if (!lastUpdated || lastUpdated.getTime() === 0) return 'unknown';

	const ageMs = Date.now() - lastUpdated.getTime();

	if (ageMs < 0) return 'live'; // future timestamp (clock skew)
	if (ageMs < 5 * 60 * 1_000) return 'live';
	if (ageMs < 24 * 60 * 60 * 1_000) return 'recent';
	if (ageMs < 7 * 24 * 60 * 60 * 1_000) return 'fresh';
	if (ageMs < 30 * 24 * 60 * 60 * 1_000) return 'ok';
	return 'stale';
}

export function getFreshnessSymbol(cls: string): string {
	return FRESHNESS_SYMBOLS[cls as FreshnessClass] ?? '·';
}

export function getFreshnessLabel(cls: string): string {
	return FRESHNESS_LABELS[cls as FreshnessClass] ?? 'unknown';
}

// ── Resolved value ──────────────────────────────────────────────────────

export interface ResolvedValue<T = unknown> {
	/** The winning value. */
	value: T;
	/** Tier that provided this value. */
	tier: SourceTier;
	/** Computed freshness class. */
	freshness: FreshnessClass;
	/** Visual tag for the winning tier. */
	tag: SourceTierTag;
}

/**
 * Given an ordered array of candidate sources (highest-priority first),
 * return the first one that carries a non-null value. Each candidate also
 * needs a `timestamp` so we can compute freshness.
 *
 * If nothing qualifies the function returns `null`.
 */
export function resolveSource<T>(
	availableSources: Array<{
		tier: SourceTier;
		value: T | null | undefined;
		timestamp: Date;
	}>,
): ResolvedValue<T> | null {
	for (const src of availableSources) {
		if (src.value == null) continue;

		const freshness = getFreshnessClass(src.timestamp);
		return {
			value: src.value,
			tier: src.tier,
			freshness,
			tag: getSourceTag(src.tier),
		};
	}
	return null;
}

// ── Metric-aware source resolution ─────────────────────────────────────

// ── Metric-aware resolution ───────────────────────────────────────────

/**
 * Given a metric key and available values per tier, resolve the best value
 * by iterating the metric's declared source ladder (from MetricDef.sources).
 *
 * The caller provides `availableValues` as a Map from SourceTier to
 * { value, timestamp }. The function reads the metric's source ladder
 * order and picks the first tier that has a fresh value.
 *
 * @param metricKey  The metric's dotted key (e.g. 'p.content.wordCount').
 * @param sourceLadders  Map<metricKey, SourceTier[]> — from MetricRegistry.getAllSourceLadders().
 * @param availableValues  Map<SourceTier, { value, timestamp }> — the values you have.
 * @returns ResolvedValue with the best tier, or null if nothing qualifies.
 *
 * @example
 * ```ts
 * const ladders = metricRegistry.getAllSourceLadders();
 * const values = new Map([
 *   ['T0', { value: null, timestamp: new Date() }],
 *   ['T1', { value: 42, timestamp: new Date() }],
 * ]);
 * resolveForMetric('p.search.gsc.clicks', ladders, values); // → { value: 42, tier: 'T1', freshness: 'live', ... }
 * ```
 */
export function resolveForMetric<T>(
	metricKey: string,
	sourceLadders: Map<string, ReadonlyArray<SourceTier>>,
	availableValues: Map<SourceTier, { value: T | null | undefined; timestamp: Date }>,
): ResolvedValue<T> | null {
	const ladder = sourceLadders.get(metricKey);
	if (!ladder || ladder.length === 0) return null;

	// Build the ordered candidate list using the metric's declared tier order
	const candidates: Array<{
		tier: SourceTier;
		value: T | null | undefined;
		timestamp: Date;
	}> = [];

	for (const tier of ladder) {
		const available = availableValues.get(tier);
		if (available) {
			candidates.push({
				tier,
				value: available.value,
				timestamp: available.timestamp,
			});
		}
	}

	return resolveSource(candidates);
}
