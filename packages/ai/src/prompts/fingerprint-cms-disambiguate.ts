import type { CmsKey } from '@seesby/types';
import { extractJson } from '../parse';
import type { Prompt } from '../types';

interface In {
  candidates: CmsKey[];
  htmlHead: string;
  headers: Record<string, string>;
}

interface Out {
  cms: CmsKey | null;
  confidence: number;
  reason: string;
}

export const fingerprintCmsDisambiguate: Prompt<In, Out> = {
  id: 'fingerprint.cms.disambiguate',
  version: 'v1.0.0',
  tier: 'S',
  taskType: 'classify',
  system: `You break ties between CMS candidates for a website. Choose exactly one from the candidates list, using the html <head> contents and response headers as evidence.
Prefer header-based evidence (x-generator, x-shopify-stage, x-ghost-cache-status, x-magento-cache-debug) over body fingerprints. Look for unique asset paths (cdn.shopify.com, framerusercontent.com, static.wixstatic.com).
Return JSON: { cms, confidence, reason }. confidence is 0..1.`,
  render: (i) => `Candidates: ${i.candidates.join(', ')}
Headers:
${Object.entries(i.headers).slice(0, 30).map(([k, v]) => `  ${k}: ${v}`).join('\n')}
HTML head:
${i.htmlHead.slice(0, 4096)}
Return JSON only.`,
  parse: (t) => {
    try {
      const j = JSON.parse(extractJson(t));
      return {
        cms: (j.cms ?? null) as CmsKey | null,
        confidence: Number(j.confidence ?? 0),
        reason: String(j.reason ?? ''),
      };
    } catch {
      return { cms: null, confidence: 0, reason: '' };
    }
  },
};
