// packages/types/src/languages.ts

export type LanguageCode =
	| 'en' | 'es' | 'fr' | 'de' | 'pt' | 'it' | 'nl' | 'pl' | 'tr'
	| 'ru' | 'uk' | 'cs' | 'da' | 'fi' | 'hu' | 'no' | 'ro' | 'sv'
	| 'ja' | 'ko' | 'zh' | 'ar' | 'he' | 'hi' | 'id' | 'vi' | 'th'
	| 'fa' | 'ur'
	| 'unknown';

export type ReadabilityFormula =
	| 'flesch-en'
	| 'fernandez-huerta-es'
	| 'kandel-moles-fr'
	| 'wiener-de'
	| 'flesch-pt'
	| 'flesch-it'
	| 'flesch-nl'
	| 'pisarek-pl'
	| 'osman-ar'
	| 'character-count' // CJK / Thai etc. — no syllable model; uses char-per-sentence
	| 'none';

export interface LanguageDescriptor {
	code: LanguageCode;
	label: string;
	native: string;
	rtl: boolean;
	script: 'latin' | 'cyrillic' | 'arabic' | 'hebrew' | 'devanagari' | 'cjk' | 'thai' | 'unknown';
	readabilityFormula: ReadabilityFormula;
	avgWordsPerMinute: number;
}

export const LANGUAGES: Record<LanguageCode, LanguageDescriptor> = {
	en: { code: 'en', label: 'English',    native: 'English',    rtl: false, script: 'latin',    readabilityFormula: 'flesch-en',          avgWordsPerMinute: 230 },
	es: { code: 'es', label: 'Spanish',    native: 'Español',    rtl: false, script: 'latin',    readabilityFormula: 'fernandez-huerta-es', avgWordsPerMinute: 218 },
	fr: { code: 'fr', label: 'French',     native: 'Français',   rtl: false, script: 'latin',    readabilityFormula: 'kandel-moles-fr',     avgWordsPerMinute: 195 },
	de: { code: 'de', label: 'German',     native: 'Deutsch',    rtl: false, script: 'latin',    readabilityFormula: 'wiener-de',           avgWordsPerMinute: 179 },
	pt: { code: 'pt', label: 'Portuguese', native: 'Português',  rtl: false, script: 'latin',    readabilityFormula: 'flesch-pt',           avgWordsPerMinute: 215 },
	it: { code: 'it', label: 'Italian',    native: 'Italiano',   rtl: false, script: 'latin',    readabilityFormula: 'flesch-it',           avgWordsPerMinute: 188 },
	nl: { code: 'nl', label: 'Dutch',      native: 'Nederlands', rtl: false, script: 'latin',    readabilityFormula: 'flesch-nl',           avgWordsPerMinute: 202 },
	pl: { code: 'pl', label: 'Polish',     native: 'Polski',     rtl: false, script: 'latin',    readabilityFormula: 'pisarek-pl',          avgWordsPerMinute: 166 },
	tr: { code: 'tr', label: 'Turkish',    native: 'Türkçe',     rtl: false, script: 'latin',    readabilityFormula: 'character-count',     avgWordsPerMinute: 166 },
	ru: { code: 'ru', label: 'Russian',    native: 'Русский',    rtl: false, script: 'cyrillic', readabilityFormula: 'character-count',     avgWordsPerMinute: 184 },
	uk: { code: 'uk', label: 'Ukrainian',  native: 'Українська',  rtl: false, script: 'cyrillic', readabilityFormula: 'character-count',     avgWordsPerMinute: 180 },
	cs: { code: 'cs', label: 'Czech',      native: 'Čeština',    rtl: false, script: 'latin',    readabilityFormula: 'character-count',     avgWordsPerMinute: 170 },
	da: { code: 'da', label: 'Danish',     native: 'Dansk',      rtl: false, script: 'latin',    readabilityFormula: 'character-count',     avgWordsPerMinute: 195 },
	fi: { code: 'fi', label: 'Finnish',    native: 'Suomi',      rtl: false, script: 'latin',    readabilityFormula: 'character-count',     avgWordsPerMinute: 161 },
	hu: { code: 'hu', label: 'Hungarian',  native: 'Magyar',     rtl: false, script: 'latin',    readabilityFormula: 'character-count',     avgWordsPerMinute: 162 },
	no: { code: 'no', label: 'Norwegian',  native: 'Norsk',      rtl: false, script: 'latin',    readabilityFormula: 'character-count',     avgWordsPerMinute: 195 },
	ro: { code: 'ro', label: 'Romanian',   native: 'Română',     rtl: false, script: 'latin',    readabilityFormula: 'character-count',     avgWordsPerMinute: 186 },
	sv: { code: 'sv', label: 'Swedish',    native: 'Svenska',    rtl: false, script: 'latin',    readabilityFormula: 'character-count',     avgWordsPerMinute: 199 },
	ja: { code: 'ja', label: 'Japanese',   native: '日本語',     rtl: false, script: 'cjk',      readabilityFormula: 'character-count',     avgWordsPerMinute: 357 },
	ko: { code: 'ko', label: 'Korean',     native: '한국어',     rtl: false, script: 'cjk',      readabilityFormula: 'character-count',     avgWordsPerMinute: 270 },
	zh: { code: 'zh', label: 'Chinese',    native: '中文',       rtl: false, script: 'cjk',      readabilityFormula: 'character-count',     avgWordsPerMinute: 255 },
	ar: { code: 'ar', label: 'Arabic',     native: 'العربية', rtl: true,  script: 'arabic',   readabilityFormula: 'osman-ar',            avgWordsPerMinute: 138 },
	he: { code: 'he', label: 'Hebrew',     native: 'עברית',     rtl: true,  script: 'hebrew',   readabilityFormula: 'character-count',     avgWordsPerMinute: 187 },
	hi: { code: 'hi', label: 'Hindi',      native: 'हिन्दी',      rtl: false, script: 'devanagari', readabilityFormula: 'character-count',   avgWordsPerMinute: 200 },
	id: { code: 'id', label: 'Indonesian', native: 'Indonesia',  rtl: false, script: 'latin',    readabilityFormula: 'character-count',     avgWordsPerMinute: 180 },
	vi: { code: 'vi', label: 'Vietnamese', native: 'Tiếng Việt',rtl: false, script: 'latin',    readabilityFormula: 'character-count',     avgWordsPerMinute: 160 },
	th: { code: 'th', label: 'Thai',       native: 'ไทย',       rtl: false, script: 'thai',     readabilityFormula: 'character-count',     avgWordsPerMinute: 200 },
	fa: { code: 'fa', label: 'Persian',    native: 'فارسی',     rtl: true,  script: 'arabic',   readabilityFormula: 'character-count',     avgWordsPerMinute: 150 },
	ur: { code: 'ur', label: 'Urdu',       native: 'اردو',       rtl: true,  script: 'arabic',   readabilityFormula: 'character-count',     avgWordsPerMinute: 140 },
	unknown: { code: 'unknown', label: 'Unknown', native: '', rtl: false, script: 'unknown', readabilityFormula: 'none', avgWordsPerMinute: 200 },
};

export const LANGUAGE_CODES: ReadonlyArray<LanguageCode> = Object.keys(LANGUAGES) as LanguageCode[];

export function isLanguageCode(value: unknown): value is LanguageCode {
	return typeof value === 'string' && value in LANGUAGES;
}

export function normalizeLanguage(value: unknown): LanguageCode {
	if (!value) return 'unknown';
	const k = String(value).toLowerCase().split('-')[0];
	return isLanguageCode(k) ? k : 'unknown';
}
