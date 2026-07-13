// packages/fingerprint/src/detectors/IndustryCascade.ts
import type { Industry } from '@seesby/types';
import { detectIndustryFromGsc } from './industry/gsc';
import { detectIndustryFromSchemaJsonLd } from './industry/schema';
import { detectIndustryFromHtmlScrape } from './industry/scrape';
import { detectIndustryFromAi } from './industry/ai';
import type { DetectorStep } from './types';

export const INDUSTRY_CASCADE: ReadonlyArray<DetectorStep<Industry>> = [
	detectIndustryFromGsc,            // T0 if GSC connected (top-query topic model)
	detectIndustryFromSchemaJsonLd,   // T7 schema.org Product/Article/MedicalOrganization etc.
	detectIndustryFromHtmlScrape,     // T7 keyword + path scoring
	detectIndustryFromAi,             // T6 LLM fallback (only when scrape score < 30)
];
