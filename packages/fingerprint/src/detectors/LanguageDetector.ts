// packages/fingerprint/src/detectors/LanguageDetector.ts
import { normalizeLanguage, type LanguageCode } from '@seesby/types';
import type { DetectorStep } from './types';
import { stripTags, iso6393to1 } from './lang/util';

export const detectLanguageFromContentLanguageHeader: DetectorStep<LanguageCode> = async (ctx) => {
	const h = ctx.headers['content-language'];
	if (!h) return null;
	const code = normalizeLanguage(h.split(',')[0]);
	if (code === 'unknown') return null;
	return { value: code, confidence: 0.95, tier: 'T7', provider: 'fingerprint.lang.contentLanguage', tags: ['source'] };
};

export const detectLanguageFromHtmlAttr: DetectorStep<LanguageCode> = async (ctx) => {
	const counts = new Map<LanguageCode, number>();
	for (const s of ctx.htmlSamples) {
		const m = s.html.match(/<html[^>]+lang=["']([^"']+)["']/i);
		if (!m) continue;
		const c = normalizeLanguage(m[1]);
		if (c !== 'unknown') counts.set(c, (counts.get(c) ?? 0) + 1);
	}
	if (!counts.size) return null;
	const [code, hits] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
	return { value: code, confidence: Math.min(1, 0.5 + hits / ctx.htmlSamples.length * 0.5), tier: 'T7', provider: 'fingerprint.lang.htmlAttribute', sampleSize: ctx.htmlSamples.length, tags: ['scrape'] };
};

export const detectLanguageFromCld3: DetectorStep<LanguageCode> = async (ctx) => {
	// runs only when html-attr returned null. Uses cld3-asm or franc as the wasm backend.
	try {
		const { default: franc } = await import('franc-min');
		const joined = ctx.htmlSamples.slice(0, 5).map((s) => stripTags(s.html)).join('\n').slice(0, 8000);
		if (joined.length < 200) return null;
		const iso6393 = (franc as any)(joined);
		const code = normalizeLanguage(iso6393to1(iso6393));
		if (code === 'unknown') return null;
		return { value: code, confidence: 0.7, tier: 'T7', provider: 'fingerprint.lang.cld', tags: ['scrape'] };
	} catch {
		return null;
	}
};

export const LANGUAGE_CASCADE = [
	detectLanguageFromContentLanguageHeader,
	detectLanguageFromHtmlAttr,
	detectLanguageFromCld3,
] as const;
