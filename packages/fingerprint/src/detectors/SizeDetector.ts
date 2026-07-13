import type { DetectorStep } from './types';

// ---------------------------------------------------------------------------
// T3 — Parse sitemap URL count from HTML if pages include sitemap data
// ---------------------------------------------------------------------------
const detectSizeFromSitemapUrls: DetectorStep<number> = async (ctx) => {
	for (const s of ctx.htmlSamples) {
		const html = s.html;
		if (!html) continue;

		// Check for sitemap index references with url count hints
		const sitemapUrlMatch = html.match(/<sitemapindex[\s\S]*?<\/sitemapindex>/i);
		if (sitemapUrlMatch) {
			// Count <sitemap> entries as a proxy for sitemap size
			const sitemapCount = (sitemapUrlMatch[0].match(/<sitemap>/gi) ?? []).length;
			if (sitemapCount > 0) {
				// Each sitemap typically holds up to 50k URLs
				const estimatedUrls = sitemapCount * 50000;
				return {
					value: estimatedUrls,
					confidence: 0.5,
					tier: 'T3',
					provider: 'fingerprint.size.sitemapIndex',
					sampleSize: ctx.htmlSamples.length,
					tags: ['scrape'],
				};
			}
		}

		// Count <url> entries in a sitemap response
		const urlCount = (html.match(/<url>/gi) ?? []).length;
		if (urlCount > 0) {
			return {
				value: urlCount,
				confidence: 0.9,
				tier: 'T3',
				provider: 'fingerprint.size.sitemapUrls',
				sampleSize: ctx.htmlSamples.length,
				tags: ['scrape'],
			};
		}
	}
	return null;
};

// ---------------------------------------------------------------------------
// T7 — Estimate from HTML content density
// ---------------------------------------------------------------------------
const detectSizeFromDiscoveryCount: DetectorStep<number> = async (ctx) => {
	// The number of HTML samples from L0 discovery is itself a signal.
	// If we crawled N pages during discovery, that gives a lower bound.
	const discoveryCount = ctx.htmlSamples.length;
	if (discoveryCount < 3) return null;

	// Rough heuristic: discovery typically covers 5-20% of a site
	// Use a conservative multiplier based on sample count
	const multiplier = discoveryCount >= 20 ? 10 : discoveryCount >= 10 ? 20 : 50;
	const estimated = discoveryCount * multiplier;

	return {
		value: estimated,
		confidence: 0.3,
		tier: 'T7',
		provider: 'fingerprint.size.discoveryEstimate',
		sampleSize: discoveryCount,
		tags: ['scrape'],
	};
};

// ---------------------------------------------------------------------------
// T3 — Count navigation links as a rough page count proxy
// ---------------------------------------------------------------------------
const detectSizeFromNavLinks: DetectorStep<number> = async (ctx) => {
	const linkCounts: number[] = [];

	for (const s of ctx.htmlSamples) {
		const html = s.html;
		if (!html) continue;

		// Count internal navigation links as a rough proxy
		const hostname = ctx.hostname;
		const internalLinks = html.match(new RegExp(`href=["'][^"']*${escapeRegex(hostname)}`, 'gi'));
		if (internalLinks) {
			linkCounts.push(internalLinks.length);
		}
	}

	if (linkCounts.length === 0) return null;

	const avgLinks = linkCounts.reduce((a, b) => a + b, 0) / linkCounts.length;
	// Nav link count is usually a fraction of total pages
	// Very rough: multiply by 3-5x for typical sites
	const estimated = Math.round(avgLinks * 4);

	return {
		value: estimated,
		confidence: 0.2,
		tier: 'T3',
		provider: 'fingerprint.size.navLinks',
		sampleSize: ctx.htmlSamples.length,
		tags: ['scrape'],
	};
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function escapeRegex(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ---------------------------------------------------------------------------
// Cascade definition
// ---------------------------------------------------------------------------
export const SIZE_CASCADE: ReadonlyArray<DetectorStep<number>> = [
	detectSizeFromSitemapUrls,     // T3 — sitemap URL count (most accurate)
	detectSizeFromDiscoveryCount,  // T7 — discovery page count estimate
	detectSizeFromNavLinks,        // T3 — nav link density estimate
];
