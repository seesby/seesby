import type { Mode } from '@seesby/types';
import { getMode } from '@seesby/modes';
import { getPageIssues } from './UnifiedIssueTaxonomy';

export type FacetCounts = Record<string /* countKey */, Record<string /* value */, number>>;

export interface FacetComputeContext {
	mode: Mode;
	pages: ReadonlyArray<any>;
	rootHostname?: string;
}

// Pure, deterministic. Runs in a Web Worker if dataset > 10k pages.
export function computeFacets(ctx: FacetComputeContext): FacetCounts {
	const desc = getMode(ctx.mode);
	const out: FacetCounts = {};
	const sections = desc.lsSections.filter(s => s.kind === 'facet');
	for (const section of sections) {
        if (section.kind !== 'facet') continue;
		const counts: Record<string, number> = {};
		if (section.buckets) {
			for (const b of section.buckets) counts[b.value] = 0;  // pre-seed for stable order
		}
		out[section.countKey] = counts;
	}
	for (const page of ctx.pages) {
		for (const section of sections) {
            if (section.kind !== 'facet') continue;
			const counts = out[section.countKey];
			const extractor = FACET_EXTRACTORS[section.countKey];
			if (!extractor) continue;
			const hits = extractor(page, ctx);
			for (const v of hits) counts[v] = (counts[v] || 0) + 1;
		}
	}
	return out;
}

// One extractor per countKey. Add new keys here when defining a new facet section.
// `hits` is an array because a page can match multiple buckets (multi-select labels).
type FacetExtractor = (page: any, ctx: FacetComputeContext) => ReadonlyArray<string>;

export const FACET_EXTRACTORS: Record<string, FacetExtractor> = {
	// system + universal
	'page.statusClass':     p => [statusClass(p.statusCode)],
	'page.indexability':    p => [indexabilityBucket(p)],
	'page.depth':           p => [depthBucket(p.crawlDepth)],
	'page.exactDepth':      p => {
		const n = Number(p.crawlDepth || 0);
		return [n >= 5 ? '5+' : String(n)];
	},
	'page.category':        p => [String(p.pageCategory || 'uncategorized')],
	'page.template':        p => [String(p.template || 'unknown')],
	'page.cms':             p => p.cms ? [String(p.cms)] : [],
	'page.lang':            p => p.lang ? [String(p.lang)] : [],

	// WQA
	'wqa.priority':         p => [`P${p.priorityLevel ?? 3}`],
	'wqa.searchPerf':       p => [searchPerfBucket(p)],
	'wqa.contentAge':       p => [contentAgeBucket(p)],
	'wqa.valueTier':        p => [String(p.pageValueTier || '☆')],
	'wqa.funnelStage':      p => p.funnelStage ? [String(p.funnelStage)] : [],
	'wqa.trafficStatus':    p => [trafficStatusBucket(p)],

	// Technical
	'tech.rendering':       p => [p.requiresJs ? 'js' : 'html'],
	'tech.cwv':             p => [cwvBucket(p)],
	'tech.security':        p => [securityGrade(p)],
	'tech.robots':          p => [robotsBucket(p)],
	'tech.a11y':            p => [a11yBucket(p)],

	// Content
	'content.cluster':      p => p.topicCluster ? [String(p.topicCluster)] : [],
	'content.type':         p => [String(p.contentType || p.pageCategory || 'page')],
	'content.author':       p => p.author ? [String(p.author)] : [],
	'content.freshness':    p => [contentAgeBucket(p)],
	'content.quality':      p => [contentQualityBucket(p)],
	'content.duplication':  p => p.duplicateClusterId ? [`cluster:${p.duplicateClusterId}`] : ['unique'],

	// Links & Authority
	'links.source':         p => {
        const bls = p.backlinks;
        if (!Array.isArray(bls)) return [];
        return Array.from(new Set(bls.map((b: any) => b.sourceDomain).filter(Boolean)));
    },
	'links.type':           p => uniqueLinkTypes(p),
	'links.attribute':      p => uniqueLinkAttributes(p),
	'links.toxicity':       p => [toxicityBucket(p)],

	// Commerce
	'commerce.availability': p => p.availability ? [String(p.availability)] : [],
	'commerce.template':     p => [commerceTemplate(p)],
	'commerce.priceBand':    p => p.price != null ? [priceBand(p.price)] : [],

	// Local
	'local.location':       p => p.locationId ? [String(p.locationId)] : [],
	'local.napStatus':      p => [napStatus(p)],
	'local.reviewMood':     p => [reviewMoodBucket(p)],

	// Paid
	'paid.network':         p => p.adNetwork ? [String(p.adNetwork)] : [],
	'paid.campaignType':    p => p.campaignType ? [String(p.campaignType)] : [],
	'paid.qualityScore':    p => [qsBucket(p)],
	'paid.creativeHealth':  p => [creativeHealthBucket(p)],

	// UX & Conversion
	'ux.intent':            p => p.intent ? [String(p.intent)] : [],
	'ux.device':            p => p.device ? [String(p.device)] : [],
	'ux.frictionSignal':    p => uniqueFrictionSignals(p),
	'ux.experimentStatus':  p => p.experimentStatus ? [String(p.experimentStatus)] : [],

	// Social & Brand
	'social.profile':       p => p.profileId ? [String(p.profileId)] : [],
	'social.contentType':   p => p.socialContentType ? [String(p.socialContentType)] : [],
	'social.postStatus':    p => p.postStatus ? [String(p.postStatus)] : [],
	'social.influencerTier': p => p.influencerTier ? [String(p.influencerTier)] : [],

	// AI & Answer Engines
	'ai.engine':            p => {
        const cits = p.aiCitations;
        if (!Array.isArray(cits)) return [];
        return Array.from(new Set(cits.map((c: any) => c.engine).filter(Boolean)));
    },
	'ai.citationStatus':    p => [aiCitationBucket(p)],
	'ai.snippetType':       p => p.aiSnippetType ? [String(p.aiSnippetType)] : [],

	// Competitors
	'comp.competitor':      p => p.competitorId ? [String(p.competitorId)] : [],
	'comp.gapClass':        p => p.gapClass ? [String(p.gapClass)] : [],
	'comp.shareOfVoice':    p => [sovBucket(p)],

	// Scope
	'scope.kind': p => {
		const hits = ['all'];
		if (p.indexable) hits.push('indexable');
		if (p.inSitemap) hits.push('sitemap');
		if ((p.inlinks ?? 0) === 0) hits.push('orphans');
		if (p.statusCode >= 300 && p.statusCode < 400) hits.push('redirects');
		if (p.statusCode >= 400) hits.push('errors');
		return hits;
	},
	// Issues
	'issue.category': p => {
		const issues = getPageIssues(p);
		const hits = new Set<string>();
		for (const issue of issues) {
			const cat = (issue as any).category || 'technical';
			const mapped = ISSUE_CATEGORY_MAP[cat] || 'Tech';
			hits.add(mapped);
		}
		return Array.from(hits);
	},
};

const ISSUE_CATEGORY_MAP: Record<string, string> = {
	'http': 'Tech',
	'dns_ssl': 'Tech',
	'crawlability': 'Tech',
	'performance': 'Performance',
	'links': 'Links',
	'url_structure': 'Tech',
	'security_privacy': 'Tech',
	'js_rendering': 'Tech',
	'resource_optimization': 'Performance',
	'title_meta': 'Content',
	'headings_content': 'Content',
	'images': 'Tech',
	'structured_data': 'Schema',
	'technical': 'Tech',
	'mobile': 'Performance',
	'content_intelligence': 'Content',
	'keyword_intelligence': 'Content',
	'issue_intelligence': 'Content',
	'ai': 'Content',
	'business_signals': 'Content',
	'social_media': 'Content',
	'competitor': 'Content',
	'citations': 'Content',
	'ads_ppc': 'Content',
	'conversion_ux': 'Performance',
	'tech_debt': 'Tech',
	'ecommerce': 'Content',
	'local': 'Content',
	'news': 'Content',
	'saas': 'Content',
	'healthcare': 'Content',
	'finance': 'Content',
	'education': 'Content',
};

// Bucket helpers
function statusClass(code?: number): string {
	if (!code) return 'unknown';
	if (code < 300) return '2xx';
	if (code < 400) return '3xx';
	if (code < 500) return '4xx';
	return '5xx';
}
function indexabilityBucket(p: any): string {
	if (p.statusCode >= 300 && p.statusCode < 400) return 'redirect';
	if (p.statusCode >= 400) return 'error';
	if (p.indexable === false) return 'blocked';
	return 'indexed';
}
function depthBucket(d?: number): string {
	const n = Number(d || 0);
	if (n <= 2) return '0-2';
	if (n <= 4) return '3-4';
	if (n <= 6) return '5-6';
	return '7+';
}
function searchPerfBucket(p: any): string {
	if (p.gscImpressions === 0) return 'noImpressions';
	if (p.isLosingTraffic) return 'losers';
	if (p.isGainingTraffic) return 'winners';
	return 'stagnant';
}
function contentAgeBucket(p: any): string {
	const t = p.lastModified || p.visibleDate;
	if (!t) return 'nodate';
	const months = (Date.now() - new Date(t).getTime()) / (1000 * 60 * 60 * 24 * 30);
	if (months <= 6)  return 'fresh';
	if (months <= 18) return 'aging';
	return 'stale';
}
function trafficStatusBucket(p: any): string {
	if (p.isGainingTraffic) return 'growing';
	if (p.isLosingTraffic)  return 'declining';
	if ((p.ga4Sessions || 0) === 0) return 'none';
	return 'stable';
}
function cwvBucket(p: any): string {
	if (p.cwvBucket) return String(p.cwvBucket);
	const lcp = Number(p.lcp || 0), cls = Number(p.cls || 0), inp = Number(p.inp || 0);
	const poor = lcp > 2500 || cls > 0.1 || inp > 200;
	const ni   = lcp > 4000 || cls > 0.25 || inp > 500;
	if (ni)   return 'poor';
	if (poor) return 'needs-improvement';
	return 'good';
}
function securityGrade(p: any): string { return String(p.securityGrade || 'unknown'); }
function robotsBucket(p: any): string { return p.robotsBlocked ? 'blocked' : (p.indexable === false ? 'noindex' : 'allow'); }
function a11yBucket(p: any): string {
	const s = Number(p.a11yScore || 0);
	if (s >= 90) return 'good';
	if (s >= 60) return 'needs-improvement';
	return 'poor';
}
function contentQualityBucket(p: any): string {
	const wc = Number(p.wordCount || 0);
	if (wc < 300) return 'thin';
	if (p.isDuplicate) return 'duplicate';
	if (Number(p.qualityScore || 0) >= 80) return 'high';
	return 'standard';
}
function uniqueLinkTypes(p: any): string[] {
	const out = new Set<string>();
    const list = Array.isArray(p.outlinks) ? p.outlinks : (Array.isArray(p.outlinksList) ? p.outlinksList : []);
	for (const l of list) {
        if (typeof l === 'string') {
            // Basic heuristic if we only have URLs
            try {
                const host = new URL(l).hostname;
                out.add(host.includes(window.location.hostname) ? 'internal' : 'external');
            } catch { out.add('internal'); }
        } else {
            out.add(l.type || 'internal');
        }
    }
	return [...out];
}
function uniqueLinkAttributes(p: any): string[] {
	const out = new Set<string>();
    const list = Array.isArray(p.outlinks) ? p.outlinks : [];
	for (const l of list) {
		if (l.rel?.includes('nofollow')) out.add('nofollow');
		else out.add('dofollow');
		if (l.rel?.includes('sponsored')) out.add('sponsored');
		if (l.rel?.includes('ugc'))       out.add('ugc');
	}
	return [...out];
}
function toxicityBucket(p: any): string {
	const s = Number(p.toxicityScore || 0);
	if (s >= 70) return 'toxic';
	if (s >= 40) return 'suspicious';
	return 'clean';
}
function commerceTemplate(p: any): string {
	if (p.pageCategory === 'product')  return 'PDP';
	if (p.pageCategory === 'category') return 'PLP';
	if (p.pageCategory === 'cart')     return 'cart';
	if (p.pageCategory === 'checkout') return 'checkout';
	return 'other';
}
function priceBand(price: number): string {
	if (price < 50)  return 'lt50';
	if (price < 200) return '50-200';
	return 'gt200';
}
function napStatus(p: any): string { return p.napMatchWithHomepage === false ? 'mismatch' : 'match'; }
function reviewMoodBucket(p: any): string {
	const s = Number(p.reviewSentiment || 0);
	if (s >= 0.5) return 'overjoyed';
	if (s >= 0)   return 'neutral';
	if (s >= -0.5)return 'frustrated';
	return 'unresolved';
}
function qsBucket(p: any): string {
	const q = Number(p.qualityScore || 0);
	if (q >= 8) return 'high';
	if (q >= 5) return 'mid';
	return 'low';
}
function creativeHealthBucket(p: any): string { return String(p.creativeHealth || 'unknown'); }
function uniqueFrictionSignals(p: any): string[] { return Array.from(new Set(p.frictionSignals || [])); }
function aiCitationBucket(p: any): string {
    const cits = p.aiCitations;
	if (!Array.isArray(cits) || cits.length === 0) return 'uncited';
	if (cits.some((c: any) => c.isLosing)) return 'losing';
	return 'cited';
}
function sovBucket(p: any): string {
	const sov = Number(p.shareOfVoice || 0);
	if (sov >= 0.5) return 'leader';
	if (sov >= 0.2) return 'rising';
	return 'declining';
}
