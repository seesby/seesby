import type { DetectorStep } from './types';

// ---------------------------------------------------------------------------
// TLD → Country mapping
// ---------------------------------------------------------------------------
const TLD_MAP: Record<string, string> = {
	'.co.uk': 'GB', '.uk': 'GB',
	'.de': 'DE', '.at': 'AT', '.ch': 'CH',
	'.fr': 'FR', '.be': 'BE',
	'.es': 'ES', '.pt': 'PT', '.it': 'IT',
	'.nl': 'NL',
	'.ru': 'RU',
	'.br': 'BR',
	'.pl': 'PL', '.cz': 'CZ', '.sk': 'SK',
	'.se': 'SE', '.no': 'NO', '.dk': 'DK', '.fi': 'FI',
	'.ie': 'IE',
	'.ro': 'RO', '.hu': 'HU', '.bg': 'BG', '.hr': 'HR',
	'.gr': 'GR',
	'.ua': 'UA',
	'.jp': 'JP',
	'.cn': 'CN',
	'.kr': 'KR',
	'.tw': 'TW',
	'.in': 'IN',
	'.au': 'AU', '.com.au': 'AU',
	'.nz': 'NZ',
	'.ca': 'CA',
	'.mx': 'MX',
	'.ar': 'AR',
	'.co': 'CO', '.cl': 'CL',
	'.za': 'ZA',
	'.ng': 'NG',
	'.ke': 'KE',
	'.sg': 'SG',
	'.hk': 'HK',
	'.th': 'TH', '.vn': 'VN', '.id': 'ID', '.my': 'MY', '.ph': 'PH',
	'.ae': 'AE', '.sa': 'SA', '.il': 'IL',
	'.tr': 'TR',
	'.com.br': 'BR', '.com.mx': 'MX', '.com.cn': 'CN', '.co.jp': 'JP', '.co.kr': 'KR', '.co.in': 'IN', '.com.sg': 'SG', '.co.th': 'TH',
};

// lang tag → country code (subset of common locales)
const LANG_TO_COUNTRY: Record<string, string> = {
	'en-US': 'US', 'en-GB': 'GB', 'en-AU': 'AU', 'en-CA': 'CA', 'en-IN': 'IN', 'en-ZA': 'ZA', 'en-NZ': 'NZ', 'en-IE': 'IE', 'en-SG': 'SG',
	'en': 'US',  // default English → US
	'de': 'DE', 'de-DE': 'DE', 'de-AT': 'AT', 'de-CH': 'CH',
	'fr': 'FR', 'fr-FR': 'FR', 'fr-BE': 'BE', 'fr-CA': 'CA',
	'es': 'ES', 'es-ES': 'ES', 'es-MX': 'MX', 'es-AR': 'AR', 'es-CO': 'CO',
	'pt': 'PT', 'pt-BR': 'BR', 'pt-PT': 'PT',
	'it': 'IT', 'it-IT': 'IT',
	'nl': 'NL', 'nl-NL': 'NL', 'nl-BE': 'NL',
	'ja': 'JP', 'ja-JP': 'JP',
	'zh': 'CN', 'zh-CN': 'CN', 'zh-TW': 'TW', 'zh-Hans': 'CN', 'zh-Hant': 'TW',
	'ko': 'KR', 'ko-KR': 'KR',
	'ru': 'RU', 'ru-RU': 'RU',
	'pl': 'PL', 'pl-PL': 'PL',
	'cs': 'CZ', 'cs-CZ': 'CZ',
	'sk': 'SK', 'sk-SK': 'SK',
	'sv': 'SE', 'sv-SE': 'SE',
	'nb': 'NO', 'nn': 'NO', 'no': 'NO',
	'da': 'DK', 'da-DK': 'DK',
	'fi': 'FI', 'fi-FI': 'FI',
	'ro': 'RO', 'ro-RO': 'RO',
	'hu': 'HU', 'hu-HU': 'HU',
	'el': 'GR', 'el-GR': 'GR',
	'tr': 'TR', 'tr-TR': 'TR',
	'th': 'TH', 'th-TH': 'TH',
	'vi': 'VN', 'vi-VN': 'VN',
	'id': 'ID', 'id-ID': 'ID',
	'ms': 'MY', 'ms-MY': 'MY',
	'ar': 'SA', 'ar-SA': 'SA',
	'hi': 'IN', 'hi-IN': 'IN',
	'he': 'IL', 'he-IL': 'IL',
	'uk': 'UA', 'uk-UA': 'UA',
};

// ---------------------------------------------------------------------------
// T7 — Parse HTML lang attribute for geo hint
// ---------------------------------------------------------------------------
const detectGeoFromHtmlLang: DetectorStep<string> = async (ctx) => {
	const counts = new Map<string, number>();
	for (const s of ctx.htmlSamples) {
		const m = s.html.match(/<html[^>]+lang=["']([^"']+)["']/i);
		if (!m) continue;
		const tag = m[1];
		const country = LANG_TO_COUNTRY[tag];
		if (country) counts.set(country, (counts.get(country) ?? 0) + 1);
	}
	if (!counts.size) return null;
	const [code, hits] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
	return {
		value: code,
		confidence: Math.min(1, 0.5 + (hits / ctx.htmlSamples.length) * 0.4),
		tier: 'T7',
		provider: 'fingerprint.geo.htmlLang',
		sampleSize: ctx.htmlSamples.length,
		tags: ['scrape'],
	};
};

// ---------------------------------------------------------------------------
// T7 — Parse URL TLD for geo hint
// ---------------------------------------------------------------------------
const detectGeoFromTld: DetectorStep<string> = async (ctx) => {
	const hostname = ctx.hostname.toLowerCase();

	// Check compound TLDs first (longest match)
	const sorted = Object.keys(TLD_MAP).sort((a, b) => b.length - a.length);
	for (const tld of sorted) {
		if (hostname.endsWith(tld)) {
			return {
				value: TLD_MAP[tld],
				confidence: 0.85,
				tier: 'T7',
				provider: 'fingerprint.geo.tld',
				tags: ['source'],
			};
		}
	}
	return null;
};

// ---------------------------------------------------------------------------
// T7 — Parse hreflang tags for locale hints
// ---------------------------------------------------------------------------
const detectGeoFromHreflang: DetectorStep<string> = async (ctx) => {
	const counts = new Map<string, number>();
	const hreflangRe = /hreflang=["']([a-z]{2}(?:-[A-Z]{2})?)["']/g;

	for (const s of ctx.htmlSamples) {
		if (!s.html) continue;
		let match: RegExpExecArray | null;
		while ((match = hreflangRe.exec(s.html)) !== null) {
			const tag = match[1];
			// hreflang="x-default" or hreflang="en" — skip generic ones
			if (tag === 'x-default') continue;
			const country = LANG_TO_COUNTRY[tag] ?? tag.split('-')[1];
			if (country && country.length === 2) {
				counts.set(country, (counts.get(country) ?? 0) + 1);
			}
		}
	}

	if (!counts.size) return null;
	const [code, hits] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
	return {
		value: code.toUpperCase(),
		confidence: Math.min(1, 0.6 + (hits / ctx.htmlSamples.length) * 0.3),
		tier: 'T7',
		provider: 'fingerprint.geo.hreflang',
		sampleSize: ctx.htmlSamples.length,
		tags: ['scrape'],
	};
};

// ---------------------------------------------------------------------------
// Cascade definition
// ---------------------------------------------------------------------------
export const GEO_CASCADE: ReadonlyArray<DetectorStep<string>> = [
	detectGeoFromTld,         // T7 — TLD (highest single-signal confidence)
	detectGeoFromHtmlLang,    // T7 — HTML lang attribute
	detectGeoFromHreflang,    // T7 — hreflang alternate links
];
