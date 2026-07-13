// packages/fingerprint/src/detectors/CmsCascade.ts
import { detectCmsFromHeaders } from './cms/headers';        // T7 headers
import { detectCmsFromMetaGenerator } from './cms/meta';      // T7 meta
import { detectCmsFromHtmlPatterns } from './cms/scrape';     // T7 html patterns
import { detectCmsFromVendorApi } from './cms/vendor-api';    // T2 — hits vendor REST APIs
import { detectCmsFromAi } from './cms/ai';                   // T6 fallback
import type { DetectorStep } from './types';
import type { CmsKey } from '@seesby/types';

export const CMS_CASCADE: ReadonlyArray<DetectorStep<CmsKey>> = [
	detectCmsFromVendorApi,        // T2 first — highest signal
	detectCmsFromHeaders,          // T7
	detectCmsFromMetaGenerator,    // T7
	detectCmsFromHtmlPatterns,     // T7 — existing scoring
	detectCmsFromAi,               // T6 fallback
];
