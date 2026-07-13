// packages/fingerprint/src/detectors/industry/ai.ts
import { runPrompt } from '@seesby/ai';
import { fingerprintIndustryClassify } from '@seesby/ai/prompts';
import type { DetectorStep } from '../types';
import type { Industry } from '@seesby/types';
import { extractSchemas, extractTitle } from '../lang/util';

export const detectIndustryFromAi: DetectorStep<Industry> = async (ctx) => {
	const samples = ctx.htmlSamples.slice(0, 8).map((s) => ({
		url: s.url,
		path: new URL(s.url).pathname.split('/').filter(Boolean),
		schemas: extractSchemas(s.html),
		titleSlice: extractTitle(s.html).slice(0, 80),
	}));
	const out = await runPrompt(fingerprintIndustryClassify, { cmsHint: null, samples });
	if (!out.primary || out.confidence < 0.5) return null;
	return {
		value: out.primary as Industry,
		confidence: out.confidence,
		tier: 'T6',
		provider: 'fingerprint.industry.ai',
		sampleSize: samples.length,
		tags: ['ai'],
	};
};
