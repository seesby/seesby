import type { Industry } from '@seesby/types';
import { extractJson } from '../parse';
import type { Prompt } from '../types';

interface In {
  cmsHint: string | null;
  samples: Array<{ url: string; path: string[]; schemas: string[]; titleSlice: string }>;
}

interface Out {
  primary: Industry | null;
  secondary: Industry | null;
  confidence: number;
  reasons: string[];
}

export const fingerprintIndustryClassify: Prompt<In, Out> = {
  id: 'fingerprint.industry.classify',
  version: 'v1.0.0',
  tier: 'S',
  taskType: 'classify',
  system: `You classify a website by industry from at most 8 page samples.
Valid industries: ecommerce, saas, blog, news, finance, education, healthcare, local, jobBoard, realEstate, restaurant, portfolio, media, government, nonprofit, general.
Decide from path tokens, JSON-LD schema types, page titles, and the CMS hint. Use schema first, then path, then title text. Prefer specific ("restaurant", "jobBoard", "realEstate") over generic ("local", "general").
Return JSON: { primary, secondary, confidence, reasons[] }. confidence is 0..1. reasons is up to 3 short strings.
If you cannot decide above 0.55, set primary to "general".`,
  render: (i) => `CMS hint: ${i.cmsHint ?? 'unknown'}
Samples:
${i.samples.map((s, n) => `
[${n + 1}] ${s.url}
  path: ${s.path.join('/') || '(root)'}
  schemas: ${s.schemas.join(', ') || '(none)'}
  title: ${s.titleSlice}`).join('\n')}

Return JSON only.`,
  parse: (t) => {
    try {
      const j = JSON.parse(extractJson(t));
      return {
        primary: (j.primary ?? null) as Industry | null,
        secondary: (j.secondary ?? null) as Industry | null,
        confidence: clamp(Number(j.confidence ?? 0), 0, 1),
        reasons: Array.isArray(j.reasons) ? j.reasons.slice(0, 3).map(String) : [],
      };
    } catch {
      return { primary: null, secondary: null, confidence: 0, reasons: [] };
    }
  },
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
