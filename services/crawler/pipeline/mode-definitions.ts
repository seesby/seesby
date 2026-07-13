// services/crawler/pipeline/mode-definitions.ts
//
// Default grid column definitions per mode (spec section 8).
// Each mode declares an ordered list of metric keys that form its
// default column layout. Users can customize columns per-view; these
// are the initial defaults.
//
// The mode config also carries:
//   - description: human-readable summary of the mode's purpose
//   - accent: Tailwind accent colour token
//   - hiddenByDefault: namespaces hidden unless the fingerprint matches

import type { Mode } from '@seesby/types';
import { MODE_LABEL, MODE_ACCENT } from '@seesby/types';

// ── Mode configuration type ─────────────────────────────────────────

export interface ModeConfig {
	/** Mode identifier. */
	id: Mode;
	/** Human-readable label (mirrors MODE_LABEL). */
	label: string;
	/** Accent colour hex (mirrors MODE_ACCENT). */
	accent: string;
	/** One-line description shown in mode picker / tooltip. */
	description: string;
	/** Ordered list of metric keys shown as grid columns by default. */
	defaultColumns: readonly string[];
	/**
	 * Namespaces that are hidden by default and only shown when the
	 * fingerprint matches (adaptive-visibility). Empty array = no
	 * additional namespace gating beyond metric-level gates.
	 */
	hiddenByDefault: readonly string[];
}

// ── Mode definitions ────────────────────────────────────────────────

export const MODE_CONFIGS: Record<Mode, ModeConfig> = {
	// ──────────────────────────────────────────────────────────────────
	// 1. Full Audit — overview across all dimensions
	// ──────────────────────────────────────────────────────────────────
	fullAudit: {
		id: 'fullAudit',
		label: MODE_LABEL.fullAudit,
		accent: MODE_ACCENT.fullAudit,
		description: 'Cross-cutting overview: quality, traffic, technical health, and action queue.',
		defaultColumns: [
			'p.identity.url',
			's.score.healthGrade',
			'p.content.title',
			'p.indexing.statusCode',
			'p.tech.cwv.bucket',
			'p.tech.sec.grade',
			'p.tech.a11y.score',
			'p.search.gsc.clicks',
			'p.ga.sessions',
			'p.content.wordCount',
			'p.links.inlinks',
			'p.action.topAction',
		],
		hiddenByDefault: [
			'p.commerce',
			'p.local',
			'p.news',
			'p.jobs',
			'p.paid',
			'p.social',
			'p.email',
		],
	},

	// ──────────────────────────────────────────────────────────────────
	// 2. WQA — Website Quality Assurance
	// ──────────────────────────────────────────────────────────────────
	wqa: {
		id: 'wqa',
		label: MODE_LABEL.wqa,
		accent: MODE_ACCENT.wqa,
		description: 'Content quality, search intent, technical hygiene, AI-readiness, and E-E-A-T.',
		defaultColumns: [
			'p.identity.url',
			's.score.healthGrade',
			'p.content.wordCount',
			'p.search.gsc.position',
			'p.search.gsc.clicks',
			'p.tech.cwv.bucket',
			'p.content.eeatScore',
			'p.ai.citation.rate',
			'p.ga.sessions',
			'p.links.inlinks',
			'p.action.topAction',
		],
		hiddenByDefault: [],
	},

	// ──────────────────────────────────────────────────────────────────
	// 3. Technical — crawlability, performance, security
	// ──────────────────────────────────────────────────────────────────
	technical: {
		id: 'technical',
		label: MODE_LABEL.technical,
		accent: MODE_ACCENT.technical,
		description: 'Status codes, CWV, render mode, security, accessibility, schema, and issue counts.',
		defaultColumns: [
			'p.identity.url',
			'p.indexing.statusCode',
			'p.indexing.indexable',
			'p.tech.cwv.bucket',
			'p.tech.renderMode',
			'p.tech.sec.grade',
			'p.tech.a11y.score',
			'p.content.schema.types',
			'p.indexing.redirectUrl',
			'p.tech.issueCount',
			'p.action.topAction',
		],
		hiddenByDefault: [],
	},

	// ──────────────────────────────────────────────────────────────────
	// 4. Content — depth, freshness, readability, E-E-A-T
	// ──────────────────────────────────────────────────────────────────
	content: {
		id: 'content',
		label: MODE_LABEL.content,
		accent: MODE_ACCENT.content,
		description: 'Word count, readability, content decay, topic clusters, E-E-A-T signals.',
		defaultColumns: [
			'p.identity.url',
			'p.content.title',
			'p.content.wordCount',
			'p.content.readabilityFlesch',
			'p.content.freshness.days',
			'p.content.eeatScore',
			'p.content.topicCluster',
			'p.search.gsc.clicks',
			'p.search.gsc.position',
			'p.content.duplicateExact',
			'p.action.topAction',
		],
		hiddenByDefault: [],
	},

	// ──────────────────────────────────────────────────────────────────
	// 5. Links & Authority — backlinks, anchors, toxic links
	// ──────────────────────────────────────────────────────────────────
	linksAuthority: {
		id: 'linksAuthority',
		label: MODE_LABEL.linksAuthority,
		accent: MODE_ACCENT.linksAuthority,
		description: 'Inlinks, referring domains, anchor diversity, toxic links, orphan pages.',
		defaultColumns: [
			'p.identity.url',
			'p.links.inlinks',
			'p.links.referringDomains',
			'p.links.outlinks',
			'p.links.internalPagerank',
			'p.links.anchorTextDiversity',
			'p.links.toxicBacklinkShare',
			'p.links.orphan',
			'p.action.topAction',
		],
		hiddenByDefault: [],
	},

	// ──────────────────────────────────────────────────────────────────
	// 6. UX & Conversion — engagement, CVR, rage clicks, tests
	// ──────────────────────────────────────────────────────────────────
	uxConversion: {
		id: 'uxConversion',
		label: MODE_LABEL.uxConversion,
		accent: MODE_ACCENT.uxConversion,
		description: 'Page role, conversion rate, engagement, rage clicks, scroll depth, A/B tests.',
		defaultColumns: [
			'p.identity.url',
			'p.ux.roleClassified',
			'p.ga.conversionRate',
			'p.ga.sessions',
			'p.ga.engagementRate',
			'p.ux.rageClicks',
			'p.ux.scrollDepth',
			'p.conv.experiments.active',
			'p.tech.cwv.bucket',
			'p.ga.bounce',
			'p.action.topAction',
		],
		hiddenByDefault: [],
	},

	// ──────────────────────────────────────────────────────────────────
	// 7. Paid — campaigns, keywords, ads, landing pages
	// ──────────────────────────────────────────────────────────────────
	paid: {
		id: 'paid',
		label: MODE_LABEL.paid,
		accent: MODE_ACCENT.paid,
		description: 'Campaigns, keywords, ad copy, landing pages, spend, QS, CTR, ROAS.',
		defaultColumns: [
			'p.identity.url',
			'p.paid.campaignsUsing',
			'q.kw',
			'p.paid.paidSessions',
			'p.paid.paidCvr',
			'p.paid.qsLpComponent',
			'p.paid.adIntentMatch',
			's.paid.spend30d.google',
			's.paid.roas.google',
			'p.paid.paidBounce',
			'p.tech.cwv.bucket',
			'p.action.topAction',
		],
		hiddenByDefault: ['p.commerce', 'p.local'],
	},

	// ──────────────────────────────────────────────────────────────────
	// 8. Commerce — product catalog, feeds, pricing, reviews
	// ──────────────────────────────────────────────────────────────────
	commerce: {
		id: 'commerce',
		label: MODE_LABEL.commerce,
		accent: MODE_ACCENT.commerce,
		description: 'Products, pricing, stock, reviews, schema, and feed health.',
		defaultColumns: [
			'p.identity.url',
			'p.commerce.isProduct',
			'p.commerce.price',
			'p.commerce.availability',
			'p.commerce.reviewsCount',
			'p.commerce.reviewsAvg',
			'p.content.schema.types',
			'p.commerce.feed.present',
			'p.tech.cwv.bucket',
			'p.action.topAction',
		],
		hiddenByDefault: [],
	},

	// ──────────────────────────────────────────────────────────────────
	// 9. Local — NAP, GBP, local pack, location-specific rankings
	// ──────────────────────────────────────────────────────────────────
	local: {
		id: 'local',
		label: MODE_LABEL.local,
		accent: MODE_ACCENT.local,
		description: 'Locations, NAP consistency, GBP profile, reviews, local rank grid.',
		defaultColumns: [
			'p.identity.url',
			'p.local.isLocationPage',
			'p.local.napOnPage',
			'p.local.localBusinessSchema',
			'p.local.embeddedMap',
			'e.local.reviewsAvgGoogle',
			'e.local.rankGeogrid',
			'p.indexing.statusCode',
			'p.action.topAction',
		],
		hiddenByDefault: [],
	},

	// ──────────────────────────────────────────────────────────────────
	// 9b. Social & Brand — posts, impressions, engagement, sentiment
	// ──────────────────────────────────────────────────────────────────
	socialBrand: {
		id: 'socialBrand',
		label: MODE_LABEL.socialBrand,
		accent: MODE_ACCENT.socialBrand,
		description: 'Social posts, impressions, engagement, sentiment, and brand action queue.',
		defaultColumns: [
			'p.identity.url',
			'p.social.shares.total',
			's.social.profiles',
			's.social.mentions.volume',
			's.social.mentions.sentiment',
			's.social.engagementRate.twitter',
			'p.content.eeatScore',
			'p.search.gsc.clicks',
			'p.action.topAction',
		],
		hiddenByDefault: [],
	},

	// ──────────────────────────────────────────────────────────────────
	// 10. Competitors — overlap, share of voice, backlink gap, pricing
	// ──────────────────────────────────────────────────────────────────
	competitors: {
		id: 'competitors',
		label: MODE_LABEL.competitors,
		accent: MODE_ACCENT.competitors,
		description: 'Competitor overlap, organic share of voice, paid share of voice, backlink gap, pricing.',
		defaultColumns: [
			'e.competitor.domain',
			'e.competitor.kwOverlap',
			'e.competitor.sovOrganic',
			'e.competitor.sovPaid',
			'e.competitor.backlinkOverlap',
			'e.competitor.pricing',
			'e.competitor.contentVelocity',
			'e.competitor.wins',
			'e.competitor.losses',
		],
		hiddenByDefault: [],
	},

	// ──────────────────────────────────────────────────────────────────
	// 11. AI & Answer Engines — bots, extractability, citations, llms.txt
	// ──────────────────────────────────────────────────────────────────
	ai: {
		id: 'ai',
		label: MODE_LABEL.ai,
		accent: MODE_ACCENT.ai,
		description: 'AI bot access, content extractability, citation rate, llms.txt, action queue.',
		defaultColumns: [
			'p.identity.url',
			'p.ai.botsAllowed',
			'p.ai.extractability',
			'p.ai.citation.rate',
			'p.ai.llmsTxt',
			'p.ai.entityCoverage',
			'p.ai.schemaForAI',
			'p.content.eeatScore',
			'p.action.topAction',
		],
		hiddenByDefault: [],
	},
};

// ── Helper functions ────────────────────────────────────────────────

/**
 * Get the ModeConfig for a given mode.
 */
export function getModeConfig(mode: Mode): ModeConfig {
	return MODE_CONFIGS[mode];
}

/**
 * Get the default grid column keys for a given mode.
 */
export function getDefaultGridColumns(mode: Mode): readonly string[] {
	return MODE_CONFIGS[mode].defaultColumns;
}

/**
 * Get all modes that have a given metric key in their default columns.
 */
export function getModesForMetric(metricKey: string): Mode[] {
	return (Object.keys(MODE_CONFIGS) as Mode[]).filter(mode =>
		MODE_CONFIGS[mode].defaultColumns.includes(metricKey),
	);
}

/**
 * Get the hidden-by-default namespaces for a mode.
 * These namespaces are only shown when the fingerprint indicates relevance.
 */
export function getHiddenNamespaces(mode: Mode): readonly string[] {
	return MODE_CONFIGS[mode].hiddenByDefault;
}

/**
 * List all mode IDs in a sensible display order (Full Audit first).
 */
export const MODE_ORDER: readonly Mode[] = [
	'fullAudit',
	'wqa',
	'technical',
	'content',
	'linksAuthority',
	'uxConversion',
	'paid',
	'commerce',
	'socialBrand',
	'ai',
	'competitors',
	'local',
] as const;
