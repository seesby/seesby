import type { DetectorStep, ProbeContext } from './types';

export type FpStack = { hosting: string; cdn: string; framework: string; analytics: string[] };

// ---------------------------------------------------------------------------
// T7 — Heuristic: parse HTTP headers + HTML for hosting, CDN, framework, analytics
// ---------------------------------------------------------------------------
const detectStackFromHeadersAndHtml: DetectorStep<FpStack> = async (ctx) => {
	const hosting = detectHosting(ctx);
	const cdn = detectCdn(ctx);
	const framework = detectFramework(ctx);
	const analytics = detectAnalytics(ctx);

	const confidence =
		(hosting !== 'unknown' ? 0.3 : 0) +
		(cdn !== 'unknown' ? 0.2 : 0) +
		(framework !== 'unknown' ? 0.3 : 0) +
		(analytics.length > 0 ? 0.2 : 0);

	if (confidence === 0) return null;

	return {
		value: { hosting, cdn, framework, analytics },
		confidence: Math.min(1, confidence),
		tier: 'T7',
		provider: 'fingerprint.stack.headersHtml',
		sampleSize: ctx.htmlSamples.length,
		tags: ['scrape'],
	};
};

// ---------------------------------------------------------------------------
// Hosting detection — HTTP response headers
// ---------------------------------------------------------------------------
function detectHosting(ctx: ProbeContext): string {
	const h = lowerKeys(ctx.headers);

	// Vercel / Next.js — check before nginx since Vercel may also serve via nginx
	if (h['x-vercel-id'] || h['x-nextjs-cache']) return 'Vercel';

	// Cloudflare
	if (h['server'] === 'cloudflare') return 'Cloudflare';

	// AWS / Elastic Beanstalk
	if (h['server']?.includes('AmazonS3')) return 'AWS S3';
	if (h['server']?.includes('amazons3')) return 'AWS S3';
	if (h['x-powered-by']?.includes('EB')) return 'AWS Elastic Beanstalk';

	// Nginx / Apache / LiteSpeed
	if (h['server']?.includes('nginx')) return 'Nginx';
	if (h['server']?.includes('Apache')) return 'Apache';
	if (h['server']?.includes('LiteSpeed')) return 'LiteSpeed';

	// Google App Engine
	if (h['server'] === 'Google Frontend' || h['via']?.includes('Google Frontend')) return 'Google App Engine';

	// Express / Node
	if (h['x-powered-by']?.includes('Express')) return 'Express';
	if (h['x-powered-by']?.includes('Node.js')) return 'Node.js';

	// IIS
	if (h['server']?.includes('Microsoft-IIS')) return 'Microsoft IIS';

	// Shopify
	if (h['server'] === 'cloudflare' && h['x-shopify-stage'] !== undefined) return 'Shopify';

	return 'unknown';
}

// ---------------------------------------------------------------------------
// CDN detection — HTTP response headers
// ---------------------------------------------------------------------------
function detectCdn(ctx: ProbeContext): string {
	const h = lowerKeys(ctx.headers);

	// Cloudflare CDN
	if (h['cf-ray'] || h['cf-cache-status']) return 'Cloudflare';

	// AWS CloudFront
	if (h['x-amz-cf-id'] || h['x-amz-cf-pop'] || h['via']?.includes('CloudFront')) return 'CloudFront';

	// Fastly
	if (h['x-served-by']?.startsWith('cache-') || h['x-fastly-request-id']) return 'Fastly';

	// Akamai
	if (h['x-akamai-transformed'] || h['x-cache-key']?.includes('akamai') || h['x-akamai-request-id']) return 'Akamai';

	// CDN77
	if (h['x-cdn']?.includes('cdn77') || h['cdn-pullzone']) return 'CDN77';

	// KeyCDN
	if (h['x-cdn']?.includes('KeyCDN')) return 'KeyCDN';

	// Vercel (edge CDN)
	if (h['x-vercel-id']) return 'Vercel';

	return 'unknown';
}

// ---------------------------------------------------------------------------
// Framework detection — HTML signatures
// ---------------------------------------------------------------------------
function detectFramework(ctx: ProbeContext): string {
	for (const s of ctx.htmlSamples) {
		const html = s.html;
		if (!html) continue;

		// Next.js
		if (html.includes('__NEXT_DATA__')) return 'Next.js';

		// Nuxt
		if (html.includes('__nuxt') || html.includes('nuxt-data')) return 'Nuxt';

		// Gatsby
		if (html.includes('__gatsby') || html.includes('gatsby-')) return 'Gatsby';

		// Remix
		if (html.includes('__remixContext')) return 'Remix';

		// SvelteKit
		if (html.includes('sveltekit')) return 'SvelteKit';

		// WordPress
		if (/<meta\s+name=["']generator["']\s+content=["']WordPress/i.test(html)) return 'WordPress';
		if (html.includes('/wp-content/') || html.includes('/wp-includes/')) return 'WordPress';

		// Shopify
		if (/Shopify\.theme|cdn\.shopify\.com/i.test(html)) return 'Shopify';

		// Squarespace
		if (html.includes('squarespace.com') || html.includes('squarespace-cdn')) return 'Squarespace';

		// Webflow
		if (html.includes('webflow.com') || html.includes('wf-')) return 'Webflow';

		// Drupal
		if (/drupal/i.test(html) || html.includes('/sites/default/files')) return 'Drupal';

		// Wix
		if (html.includes('wix.com') || html.includes('wixstatic')) return 'Wix';
	}

	return 'unknown';
}

// ---------------------------------------------------------------------------
// Analytics detection — HTML script/link references
// ---------------------------------------------------------------------------
function detectAnalytics(ctx: ProbeContext): string[] {
	const found = new Set<string>();

	for (const s of ctx.htmlSamples) {
		const html = s.html;
		if (!html) continue;

		// Google Analytics / GTM
		if (/google-analytics\.com\/gtag|googletagmanager\.com|googletagmanager\.com\/gtm/i.test(html)) found.add('Google Analytics');

		// Plausible
		if (/plausible\.io/i.test(html)) found.add('Plausible');

		// Fathom
		if (/cdn\.usefathom\.com|fathom\.analytics/i.test(html)) found.add('Fathom');

		// Hotjar
		if (/hotjar\.com/i.test(html)) found.add('Hotjar');

		// Microsoft Clarity
		if (/clarity\.ms/i.test(html)) found.add('Microsoft Clarity');

		// Segment
		if (/segment\.com\/analytics|cdn\.segment\.com/i.test(html)) found.add('Segment');

		// Mixpanel
		if (/mixpanel\.com/i.test(html)) found.add('Mixpanel');

		// Amplitude
		if (/amplitude\.com/i.test(html)) found.add('Amplitude');

		// PostHog
		if (/posthog/i.test(html)) found.add('PostHog');

		// Facebook Pixel
		if (/connect\.facebook\.net|fbq\(/i.test(html)) found.add('Facebook Pixel');

		// LinkedIn Insight
		if (/snap\.licdn\.com|linkedin\.com\/px/i.test(html)) found.add('LinkedIn Insight');

		// Twitter/X Pixel
		if (/static\.ads-twitter\.com/i.test(html)) found.add('Twitter Pixel');

		// TikTok Pixel
		if (/analytics\.tiktok\.com/i.test(html)) found.add('TikTok Pixel');

		// Yandex Metrica
		if (/mc\.yandex\.ru|yandex\.ru\/metric/i.test(html)) found.add('Yandex Metrica');

		// Matomo (Piwik)
		if (/matomo|piwik/i.test(html)) found.add('Matomo');
	}

	return [...found];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function lowerKeys(obj: Record<string, string>): Record<string, string | undefined> {
	const result: Record<string, string | undefined> = {};
	for (const [k, v] of Object.entries(obj)) {
		result[k.toLowerCase()] = v;
	}
	return result;
}

// ---------------------------------------------------------------------------
// Cascade definition
// ---------------------------------------------------------------------------
export const STACK_CASCADE: ReadonlyArray<DetectorStep<FpStack>> = [
	detectStackFromHeadersAndHtml,  // T7 — headers + HTML combined
];

export const emptyStack = (): FpStack => ({ hosting: 'unknown', cdn: 'unknown', framework: 'unknown', analytics: [] });
