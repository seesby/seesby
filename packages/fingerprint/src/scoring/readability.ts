// packages/fingerprint/src/scoring/readability.ts
import { LANGUAGES, type LanguageCode } from '@seesby/types';

// Stubs for formula functions - would be implemented in formulas/*.ts
const flesch = (t: string, o: any) => 70;
const fernandezHuerta = (t: string) => 70;
const kandelMoles = (t: string) => 70;
const wienerSachtextformel = (t: string) => 70;
const pisarek = (t: string) => 70;
const osman = (t: string) => 70;
const charCountReadability = (t: string) => 70;
const estSyllablesEn = (w: string) => 1.5;
const estSyllablesPt = (w: string) => 1.5;
const estSyllablesIt = (w: string) => 1.5;
const estSyllablesNl = (w: string) => 1.5;

export function readabilityScore(text: string, lang: LanguageCode): number {
	const desc = LANGUAGES[lang];
	switch (desc.readabilityFormula) {
		case 'flesch-en':              return flesch(text, { syllablesPerWord: estSyllablesEn });
		case 'fernandez-huerta-es':    return fernandezHuerta(text);
		case 'kandel-moles-fr':        return kandelMoles(text);
		case 'wiener-de':              return wienerSachtextformel(text);
		case 'flesch-pt':              return flesch(text, { syllablesPerWord: estSyllablesPt });
		case 'flesch-it':              return flesch(text, { syllablesPerWord: estSyllablesIt });
		case 'flesch-nl':              return flesch(text, { syllablesPerWord: estSyllablesNl });
		case 'pisarek-pl':             return pisarek(text);
		case 'osman-ar':               return osman(text);
		case 'character-count':        return charCountReadability(text);
		case 'none':                   return -1;
		default:                       return -1;
	}
}
