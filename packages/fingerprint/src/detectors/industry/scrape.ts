// packages/fingerprint/src/detectors/industry/scrape.ts
import { type Industry } from '@seesby/types';
import { detectSiteType } from '../../../../services/SiteTypeDetector';
import type { DetectorStep } from '../types';

export const detectIndustryFromHtmlScrape: DetectorStep<Industry> = async (ctx) => {
	const res = detectSiteType(ctx.htmlSamples as any);
	if (!res || res.confidence < 5) return null;
	return {
		value: res.industry as Industry,
		confidence: res.confidence / 100,
		tier: 'T7',
		provider: 'fingerprint.industry.scrape',
		sampleSize: ctx.htmlSamples.length,
		tags: ['scrape'],
	};
};
