// packages/compute/src/run-ladder.ts
import type { MetricDef, MetricSample, SourceTier } from '@seesby/types';

/**
 * Rank for freshness-based demotion.
 * Higher = fresher. Stale values get demoted below fresh values from lower tiers.
 * Rule: fresh T2 > stale T0, but fresh T0 > fresh T2.
 */
function freshnessRank(sample: MetricSample): number {
	const ageMs = Date.now() - new Date(sample.stamp.observedAt).getTime();
	if (ageMs < 0) return 100;         // future (clock skew) — treat as very fresh
	if (ageMs < 5 * 60 * 1_000) return 90;    // < 5 min (live)
	if (ageMs < 24 * 60 * 60 * 1_000) return 80;  // < 24 h (recent)
	if (ageMs < 7 * 24 * 60 * 60 * 1_000) return 70; // < 7 d (fresh)
	if (ageMs < 30 * 24 * 60 * 60 * 1_000) return 60; // < 30 d (ok)
	return 10; // stale
}

export function resolveMetricFromLadder(
	def: MetricDef,
	samples: MetricSample[]
): MetricSample | null {
	const candidates = samples.filter(s => s.key === def.key);
	if (candidates.length === 0) return null;

	// Sort by composite score: tier priority (lower = better) × freshness (higher = better)
	// A stale T0 (tier 0 × freshness 10 = 0) loses to a fresh T2 (tier 2 × freshness 70 = 140)
	// A fresh T0 (tier 0 × freshness 80 = 0) beats a fresh T2 (tier 2 × freshness 70 = 140)
	const sorted = candidates.sort((a, b) => {
		const tierA = parseInt(a.stamp.tier.slice(1));
		const tierB = parseInt(b.stamp.tier.slice(1));
		if (tierA !== tierB) return tierA - tierB;
		// Same tier — prefer fresher
		return freshnessRank(b) - freshnessRank(a);
	});

	const best = sorted[0];
	const bestFreshness = freshnessRank(best);

	// If the best available value is stale AND a lower-tier fresh alternative exists, prefer the fresh one
	if (bestFreshness <= 10) {
		const freshAlt = sorted.find(s => freshnessRank(s) > 10);
		if (freshAlt) return freshAlt;
	}

	return best;
}
