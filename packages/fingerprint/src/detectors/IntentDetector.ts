import type { DetectorStep } from './types';

// ---------------------------------------------------------------------------
// T7 — Heuristic: scan HTML for conversion / content signals
// ---------------------------------------------------------------------------
const detectIntentFromConversionSignals: DetectorStep<string> = async (ctx) => {
	let transactionalHits = 0;
	let leadGenHits = 0;
	let contentHits = 0;

	const transactionalPatterns = [
		/buy\s*now/i, /add\s*to\s*cart/i, /checkout/i, /pricing/i,
		/plans?\b/i, /purchase/i, /shop\s*now/i, /order\s*now/i,
		/add.*cart/i, /price/i, /cost/i,
	];
	const leadGenPatterns = [
		/sign\s*up/i, /free\s*trial/i, /request\s*a?\s*demo/i,
		/contact\s*us/i, /get\s*started/i, /subscribe/i,
		/book\s*a?\s*demo/i, /schedule\s*a?\s*demo/i,
		/talk\s*to\s*sales/i, /request\s*pricing/i, /get\s*a?\s*quote/i,
	];
	const contentPatterns = [
		/blog/i, /articles?/i, /guides?/i, /tutorials?/i,
		/learn/i, /documentation/i, /docs?\b/i, /knowledge/i,
		/resources?/i, /news\b/i, /insights?/i,
	];

	for (const s of ctx.htmlSamples) {
		const html = s.html;
		if (!html) continue;

		for (const p of transactionalPatterns) { if (p.test(html)) transactionalHits++; }
		for (const p of leadGenPatterns) { if (p.test(html)) leadGenHits++; }
		for (const p of contentPatterns) { if (p.test(html)) contentHits++; }
	}

	const total = transactionalHits + leadGenHits + contentHits;
	if (total === 0) return null;

	// Determine primary intent based on strongest signal
	const max = Math.max(transactionalHits, leadGenHits, contentHits);

	// If the top two categories are within 2 hits of each other, it's hybrid
	const sorted = [transactionalHits, leadGenHits, contentHits].sort((a, b) => b - a);
	const isHybrid = sorted[0] > 0 && sorted[1] > 0 && sorted[0] - sorted[1] <= 2;

	if (isHybrid) {
		return {
			value: 'hybrid',
			confidence: Math.min(1, 0.4 + (total / ctx.htmlSamples.length) * 0.1),
			tier: 'T7',
			provider: 'fingerprint.intent.conversionSignals',
			sampleSize: ctx.htmlSamples.length,
			tags: ['scrape'],
		};
	}

	let intent: string;
	if (max === transactionalHits) intent = 'transactional';
	else if (max === leadGenHits) intent = 'lead-gen';
	else intent = 'content-only';

	return {
		value: intent,
		confidence: Math.min(1, 0.5 + (max / ctx.htmlSamples.length) * 0.15),
		tier: 'T7',
		provider: 'fingerprint.intent.conversionSignals',
		sampleSize: ctx.htmlSamples.length,
		tags: ['scrape'],
	};
};

// ---------------------------------------------------------------------------
// T7 — Schema.org structured data signals
// ---------------------------------------------------------------------------
const detectIntentFromSchema: DetectorStep<string> = async (ctx) => {
	let productSchema = false;
	let articleSchema = false;
	let softwareSchema = false;
	let offerSchema = false;

	const schemaRe = /"@type"\s*:\s*"(Product|Article|BlogPosting|SoftwareApplication|Offer|WebPagePosting)"/gi;

	for (const s of ctx.htmlSamples) {
		if (!s.html) continue;
		let match: RegExpExecArray | null;
		while ((match = schemaRe.exec(s.html)) !== null) {
			const type = match[1];
			switch (type) {
				case 'Product': productSchema = true; break;
				case 'Offer': offerSchema = true; break;
				case 'Article':
				case 'BlogPosting': articleSchema = true; break;
				case 'SoftwareApplication': softwareSchema = true; break;
			}
		}
	}

	// Check for price-related markup
	const hasPrice = ctx.htmlSamples.some((s) =>
		s.html && /itemprop=["']price["']/i.test(s.html)
	);

	if (productSchema || offerSchema || hasPrice) {
		return {
			value: 'transactional',
			confidence: productSchema ? 0.95 : 0.8,
			tier: 'T7',
			provider: 'fingerprint.intent.schemaProduct',
			sampleSize: ctx.htmlSamples.length,
			tags: ['scrape'],
		};
	}

	if (softwareSchema) {
		return {
			value: 'lead-gen',
			confidence: 0.9,
			tier: 'T7',
			provider: 'fingerprint.intent.schemaSoftware',
			sampleSize: ctx.htmlSamples.length,
			tags: ['scrape'],
		};
	}

	if (articleSchema) {
		return {
			value: 'content-only',
			confidence: 0.9,
			tier: 'T7',
			provider: 'fingerprint.intent.schemaArticle',
			sampleSize: ctx.htmlSamples.length,
			tags: ['scrape'],
		};
	}

	return null;
};

// ---------------------------------------------------------------------------
// Cascade definition
// ---------------------------------------------------------------------------
export const INTENT_CASCADE: ReadonlyArray<DetectorStep<string>> = [
	detectIntentFromSchema,              // T7 — structured data (highest confidence)
	detectIntentFromConversionSignals,   // T7 — keyword heuristic
];
