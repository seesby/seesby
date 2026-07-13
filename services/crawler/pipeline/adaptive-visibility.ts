// services/crawler/pipeline/adaptive-visibility.ts
//
// Evaluates MetricGate rules against the current project context
// (mode, fingerprint, connected integrations, capabilities).
//
// Gate rules implement the adaptive-visibility spec: metrics are
// shown or hidden based on what the crawler detected during the
// fingerprint phase, which mode the user is in, and which third-party
// integrations are connected.

import type { Mode } from '../../packages/types/src/modes';
import type { MetricGate, IntegrationId, Capability } from '../../packages/types/src/metric-def';
import type { Industry } from '../../packages/types/src/industries';
import type { CmsKey } from '../../packages/types/src/cms';

// ── Fingerprint value accessors (duck-typed to avoid circular deps) ──

interface FpValueLike<T> {
	value: T;
	confidence: number;
}

interface FpStackLike {
	[key: string]: { value: string | string[]; confidence: number };
}

interface FingerprintLike {
	industry?: FpValueLike<Industry>;
	cms?: FpValueLike<CmsKey>;
	languagePrimary?: FpValueLike<string>;
	stack?: FpStackLike;
	size?: { urls?: FpValueLike<number> };
}

// ── Evaluation context ──────────────────────────────────────────────

export interface GateContext {
	/** Current UI mode. */
	mode: Mode;
	/** Project fingerprint from the probe phase. */
	fingerprint: FingerprintLike;
	/** Set of connected integration IDs. */
	integrations: ReadonlySet<IntegrationId>;
	/** Available capabilities (crawl, serp, browser, ai, etc.). */
	capabilities: ReadonlySet<Capability>;
}

// ── Custom gate predicates ──────────────────────────────────────────
//
// The `custom` field on MetricGate uses a simple DSL:
//   "hasSchema:<Type>"            — fingerprint detected a given schema type
//   "multiLocation"               — site has >1 physical location
//   "minConfidence:<number>"      — fingerprint confidence >= threshold
//   "hasEmailSignup"              — email signup CTA detected in stack
//   "hasNewsArticle"              — NewsArticle schema detected
//   "hasJobPosting"               — JobPosting schema detected
//   "hasProductSchema"            — Product schema detected
//   "hasAggregateRating"          — AggregateRating schema detected
//   "AND:<pred1>,<pred2>"         — all predicates must match
//   "OR:<pred1>,<pred2>"          — at least one predicate must match

type CustomPredicate = (ctx: GateContext) => boolean;

const SCHEMA_TYPES_KEY = '_detectedSchemaTypes';
const MULTI_LOCATION_KEY = '_multiLocation';
const EMAIL_SIGNUP_KEY = 'email';

function hasStackKey(stack: FpStackLike | undefined, key: string): boolean {
	if (!stack) return false;
	return key in stack;
}

function stackValuePresent(stack: FpStackLike | undefined, key: string): boolean {
	if (!stack) return false;
	const entry = stack[key];
	if (!entry) return false;
	if (Array.isArray(entry.value)) return entry.value.length > 0;
	return !!entry.value;
}

function parseCustomPredicate(raw: string): CustomPredicate {
	// AND / OR compound predicates
	if (raw.startsWith('AND:') || raw.startsWith('OR:')) {
		const isAnd = raw.startsWith('AND:');
		const parts = raw.slice(4).split(',').map(s => s.trim());
		const predicates = parts.map(parseCustomPredicate);
		return (ctx) => isAnd
			? predicates.every(p => p(ctx))
			: predicates.some(p => p(ctx));
	}

	// hasSchema:<Type>
	if (raw.startsWith('hasSchema:')) {
		const schemaType = raw.slice(10);
		return (ctx) => {
			const detected = (ctx.fingerprint as any)[SCHEMA_TYPES_KEY] as string[] | undefined;
			return detected?.includes(schemaType) ?? false;
		};
	}

	// hasDetectedStack:<key> — checks if a stack detection key is present
	if (raw.startsWith('hasDetectedStack:')) {
		const stackKey = raw.slice(17);
		return (ctx) => stackValuePresent(ctx.fingerprint.stack, stackKey);
	}

	switch (raw) {
		case 'multiLocation':
			return (ctx) => !!(ctx.fingerprint as any)[MULTI_LOCATION_KEY];
		case 'hasEmailSignup':
			return (ctx) => hasStackKey(ctx.fingerprint.stack, EMAIL_SIGNUP_KEY);
		case 'hasNewsArticle':
			return (ctx) => {
				const detected = (ctx.fingerprint as any)[SCHEMA_TYPES_KEY] as string[] | undefined;
				return detected?.includes('NewsArticle') ?? false;
			};
		case 'hasJobPosting':
			return (ctx) => {
				const detected = (ctx.fingerprint as any)[SCHEMA_TYPES_KEY] as string[] | undefined;
				return detected?.includes('JobPosting') ?? false;
			};
		case 'hasProductSchema':
			return (ctx) => {
				const detected = (ctx.fingerprint as any)[SCHEMA_TYPES_KEY] as string[] | undefined;
				return detected?.includes('Product') ?? false;
			};
		case 'hasAggregateRating':
			return (ctx) => {
				const detected = (ctx.fingerprint as any)[SCHEMA_TYPES_KEY] as string[] | undefined;
				return detected?.includes('AggregateRating') ?? false;
			};
		default:
			// Unknown custom predicate — deny by default
			return () => false;
	}
}

// ── Gate evaluation ─────────────────────────────────────────────────

/**
 * Evaluate whether a single MetricGate is satisfied by the current context.
 *
 * All present gate fields must match (AND semantics across fields).
 * Within a single array field, any match suffices (OR semantics).
 *
 * Returns `true` when the gate is satisfied (metric should be shown)
 * or when the gate is `undefined` (no restrictions).
 */
export function evaluateGate(
	gate: MetricGate | undefined,
	context: GateContext,
): boolean {
	if (!gate) return true;

	// ── Mode filter ──
	if (gate.modes && gate.modes.length > 0) {
		if (!gate.modes.includes(context.mode)) return false;
	}

	// ── Industry filter (allowlist) ──
	if (gate.industries && gate.industries.length > 0) {
		const fpIndustry = context.fingerprint.industry?.value;
		if (!fpIndustry || !gate.industries.includes(fpIndustry)) return false;
	}

	// ── Industry exclusion ──
	if (gate.excludeIndustries && gate.excludeIndustries.length > 0) {
		const fpIndustry = context.fingerprint.industry?.value;
		if (fpIndustry && gate.excludeIndustries.includes(fpIndustry)) return false;
	}

	// ── CMS filter ──
	if (gate.cms && gate.cms.length > 0) {
		const fpCms = context.fingerprint.cms?.value;
		if (!fpCms || !gate.cms.includes(fpCms)) return false;
	}

	// ── Language filter ──
	if (gate.languages && gate.languages.length > 0) {
		const fpLang = context.fingerprint.languagePrimary?.value;
		if (!fpLang || !gate.languages.includes(fpLang as any)) return false;
	}

	// ── Stack filter — at least one listed stack key must be detected ──
	if (gate.stack && gate.stack.length > 0) {
		const stack = context.fingerprint.stack;
		const anyMatch = gate.stack.some(key => stackValuePresent(stack, key));
		if (!anyMatch) return false;
	}

	// ── Minimum URL count ──
	if (gate.minUrls != null) {
		const urlCount = context.fingerprint.size?.urls?.value;
		if (urlCount == null || urlCount < gate.minUrls) return false;
	}

	// ── Required connected integrations (all must be connected) ──
	if (gate.requireConnected && gate.requireConnected.length > 0) {
		const allConnected = gate.requireConnected.every(id => context.integrations.has(id));
		if (!allConnected) return false;
	}

	// ── Required capabilities (all must be present) ──
	if (gate.requireCapability && gate.requireCapability.length > 0) {
		const allPresent = gate.requireCapability.every(cap => context.capabilities.has(cap));
		if (!allPresent) return false;
	}

	// ── Custom predicate ──
	if (gate.custom) {
		const predicate = parseCustomPredicate(gate.custom);
		if (!predicate(context)) return false;
	}

	return true;
}

// ── Namespace-level gate presets ────────────────────────────────────
//
// These represent the spec's namespace-level adaptive rules.
// They are applied as defaults when a metric within the namespace
// does not define its own gate.

export const NAMESPACE_GATE_PRESETS: Record<string, Partial<MetricGate>> = {
	'p.commerce': {
		industries: ['ecommerce'],
		stack: ['ecommerce', 'shopify', 'woocommerce', 'bigcommerce'],
	},
	'p.local': {
		industries: ['local', 'restaurant', 'healthcare', 'finance', 'realEstate'],
	},
	'p.email': {
		stack: ['email'],
		custom: 'hasEmailSignup',
	},
	'p.news': {
		industries: ['news', 'media'],
		custom: 'hasNewsArticle',
	},
	'p.jobs': {
		industries: ['jobBoard'],
		custom: 'hasJobPosting',
	},
	'p.paid': {
		requireConnected: ['serp'],
	},
	'p.social': {
		// Social metrics visible in all modes; gate only on specific modes
	},
	'p.local.nap': {
		industries: ['local', 'restaurant', 'healthcare', 'finance', 'realEstate'],
		custom: 'multiLocation',
	},
	'p.local.gbp': {
		industries: ['local', 'restaurant'],
		requireConnected: ['gbp'],
	},
	'p.commerce.feed': {
		industries: ['ecommerce'],
		stack: ['product-feed'],
	},
	'p.commerce.reviews': {
		industries: ['ecommerce'],
		custom: 'hasAggregateRating',
	},
	'q.paid': {
		requireConnected: ['serp'],
	},
	'q.commerce': {
		industries: ['ecommerce'],
	},
};

/**
 * Merge a metric's gate with the namespace-level preset.
 * Metric-level gate fields take precedence; the preset fills in
 * any fields the metric does not define itself.
 */
export function mergeGateWithPreset(
	metricGate: MetricGate | undefined,
	namespace: string,
): MetricGate | undefined {
	const preset = NAMESPACE_GATE_PRESETS[namespace];
	if (!preset && !metricGate) return undefined;
	if (!preset) return metricGate;
	if (!metricGate) return preset as MetricGate;

	// Merge: metric-level fields override preset fields
	const merged: MetricGate = { ...preset, ...metricGate };

	// For array fields, if the metric defines them, use metric's values;
	// otherwise use preset values
	if (!metricGate.industries && preset.industries) merged.industries = preset.industries;
	if (!metricGate.stack && preset.stack) merged.stack = preset.stack;
	if (!metricGate.requireConnected && preset.requireConnected) merged.requireConnected = preset.requireConnected;

	return merged;
}
