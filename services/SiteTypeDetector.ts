import type { Industry, CmsKey, LanguageCode } from '@seesby/types';

export interface SiteTypeResult {
	detectedIndustry: Industry;
	detectedIndustrySecondary?: Industry;
	detectedLanguage: LanguageCode;
	detectedLanguages: LanguageCode[];
	detectedCms: CmsKey;
	isMultiLanguage: boolean;
	isLowConfidence: boolean;
	industryConfidence: number;
	cmsConfidence: number;
}

/** 
 * Frozen export for UI compatibility. 
 * In the browser, this should ideally be passed an existingFingerprint.
 * If not, it returns a default result to avoid breaking the UI.
 */
export async function detectSiteType(
    _pages: unknown[], 
    _sessionId?: string,
    existingFingerprint?: any
): Promise<SiteTypeResult> {
	const fp = existingFingerprint || {
        industry: { value: 'general', confidence: 0 },
        cms: { value: 'custom', confidence: 0 },
        languagePrimary: { value: 'en' },
        languageSet: []
    };
    
	return {
		detectedIndustry: fp.industry?.value || 'general',
		detectedIndustrySecondary: fp.industrySecondary?.value,
		detectedLanguage: fp.languagePrimary?.value || 'en',
		detectedLanguages: (fp.languageSet || []).map((l: any) => l.code),
		detectedCms: fp.cms?.value || 'custom',
		isMultiLanguage: (fp.languageSet || []).length > 1,
		isLowConfidence: (fp.industry?.confidence || 0) < 0.5,
		industryConfidence: fp.industry?.confidence || 0,
		cmsConfidence: fp.cms?.confidence || 0,
	};
}

