import type { CmsKey, Industry, ProjectFingerprint, SourceStamp } from '@seesby/types';
import { normalizeCms, normalizeIndustry } from '../packages/modes/src';
import { detectSiteType } from './SiteTypeDetector';
import { discoverFingerprintSamples } from './discoverFingerprintSamples';

type Listener = (fp: ProjectFingerprint) => void;

type PageSignal = {
  url: string;
  schemaTypes: string[];
  cmsType: string | null;
  language: string;
  industrySignals: Record<string, any>;
  wordCount: number;
  crawlDepth: number;
  statusCode: number;
  isHtmlPage: boolean;
  hasPricingPage?: boolean;
  hasEmbeddedMap?: boolean;
  hasPostalAddress?: boolean;
  phoneNumbers?: string[];
  gscImpressions?: number;
  mainKeyword?: string;
};

type StartOptions = {
  force?: boolean;
  pages?: any[];
};

const storageKey = (projectId: string) => `seesby:fingerprint:${projectId}`;

export class FingerprintHandle {
  private listeners = new Set<Listener>();
  private current: ProjectFingerprint | null = null;
  private inflight: Promise<void> | null = null;

  constructor(
    private projectId: string,
    private rootUrl: string,
  ) {}

  get fingerprint() {
    return this.current;
  }

  onUpdate(listener: Listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async start(opts: StartOptions = {}) {
    if (this.inflight) return this.inflight;

    this.inflight = (async () => {
      if (!opts.force) {
        const cached = this.load();
        if (cached) {
          this.current = cached;
          this.emit();
        }
      }

      const pages = opts.pages && opts.pages.length > 0
        ? toPageSignals(opts.pages)
        : await fetchPageSignals(this.rootUrl);

      if (pages.length === 0) return;

      const detected = detectSiteType(pages as any);
      const next = buildFingerprintFromDetection(detected, pages);
      
      if (!this.isSameFingerprint(next)) {
        this.current = next;
        this.emit();
        this.save(next);
      }
    })().finally(() => {
      this.inflight = null;
    });

    return this.inflight;
  }

  private isSameFingerprint(next: ProjectFingerprint): boolean {
    if (!this.current) return false;
    
    const c = this.current;
    const n = next;

    // Check core categorical fields
    const coreMatch = 
      c.industry?.value === n.industry?.value &&
      c.cms?.value === n.cms?.value &&
      c.languagePrimary?.value === n.languagePrimary?.value;

    if (!coreMatch) return false;

    // Check page count with a threshold to avoid updates on every single page during a crawl
    const cCount = c.size?.urls?.value ?? 0;
    const nCount = n.size?.urls?.value ?? 0;

    // Only update if count changes significantly (e.g. > 10% or cross a threshold)
    // or if we were at 0 and now have pages.
    if (cCount === 0 && nCount > 0) return false;
    
    // If we have many pages, don't update on every single one
    if (cCount > 100 && Math.abs(nCount - cCount) < 10) return true;
    if (cCount > 1000 && Math.abs(nCount - cCount) < 100) return true;

    return cCount === nCount;
  }

  private emit() {
    if (!this.current) return;
    for (const listener of this.listeners) listener(this.current);
  }

  private load(): ProjectFingerprint | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = window.localStorage.getItem(storageKey(this.projectId));
      return raw ? JSON.parse(raw) as ProjectFingerprint : null;
    } catch {
      return null;
    }
  }

  private save(fp: ProjectFingerprint) {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(storageKey(this.projectId), JSON.stringify(fp));
    } catch {
      // Ignore storage failures.
    }
  }
}

async function fetchPageSignals(rootUrl: string): Promise<PageSignal[]> {
  const samples = await discoverFingerprintSamples(rootUrl);
  const settled = await Promise.allSettled(samples.map(fetchSingleSignal));
  return settled
    .filter((item): item is PromiseFulfilledResult<PageSignal> => item.status === 'fulfilled')
    .map((item) => item.value);
}

async function fetchSingleSignal(url: string): Promise<PageSignal> {
  const response = await fetch(url, {
    headers: { 'user-agent': 'SeesbyFingerprint/1.0' },
  });
  const html = await response.text();

  const schemaTypes = extractSchemaTypes(html);
  const cmsType = detectCmsFromHtml(html);
  const language = extractLanguage(html);
  const pathname = safePathname(url);
  const words = stripHtml(html).split(/\s+/).filter(Boolean).length;
  const phoneNumbers = html.match(/(?:\+?\d[\d\s().-]{7,}\d)/g) ?? [];
  const lower = html.toLowerCase();

  return {
    url,
    schemaTypes,
    cmsType,
    language,
    industrySignals: {
      hasProductSchema: schemaTypes.includes('Product'),
      priceVisible: /[$€£]\s?\d|\b(?:usd|eur|gbp)\b/i.test(html),
      hasAuthorByline: /\bby\s+[A-Z][a-z]+/m.test(html) || /rel=["']author["']/.test(lower),
      hasRssFeed: /type=["']application\/rss\+xml["']/.test(lower),
      inNewsSitemap: /news/i.test(pathname),
      hasTimeTag: /<time\b/i.test(lower),
      currencySymbolDensity: ((html.match(/[$€£]/g) ?? []).length) / Math.max(1, html.length),
      hasAddToCartButton: /add to cart|buy now/i.test(lower),
      hasCartEndpoint: /\/cart\b|\/checkout\b/i.test(lower),
      hasMedicalAuthor: /\bmd\b|\bdoctor\b|\bmedical reviewed\b/i.test(lower),
    },
    wordCount: words,
    crawlDepth: pathname.split('/').filter(Boolean).length,
    statusCode: response.status,
    isHtmlPage: (response.headers.get('content-type') || '').includes('text/html'),
    hasPricingPage: /\/pricing\b/i.test(pathname) || /\bpricing\b/i.test(lower),
    hasEmbeddedMap: /google\.com\/maps|maps\.googleapis\.com/i.test(lower),
    hasPostalAddress: /\b(street|avenue|road|suite|zip|postal code)\b/i.test(lower),
    phoneNumbers,
  };
}

function buildFingerprintFromDetection(detected: ReturnType<typeof detectSiteType>, pages: PageSignal[]): ProjectFingerprint {
  const observedAt = new Date().toISOString();
  const industryValue = normalizeIndustry(detected.industry) as Industry;
  const cmsValue = detected.detectedCms ? normalizeCms(detected.detectedCms) : undefined;
  const urls = pages.filter((page) => page.isHtmlPage).length;

  return {
    industry: {
      value: industryValue,
      confidence: clampConfidence(detected.confidence / 100),
      source: stamp('T7', 'site-type-detector', observedAt, detected.confidence / 100),
    },
    cms: cmsValue ? {
      value: cmsValue as CmsKey,
      confidence: cmsValue === 'custom' ? 0.35 : 0.7,
      source: stamp('T7', 'html-fingerprint', observedAt, cmsValue === 'custom' ? 0.35 : 0.7),
    } : undefined,
    languagePrimary: detected.detectedLanguage && detected.detectedLanguage !== 'unknown' ? {
      value: detected.detectedLanguage,
      confidence: detected.detectedLanguages?.[0]?.percentage
        ? clampConfidence(detected.detectedLanguages[0].percentage / 100)
        : 0.5,
      source: stamp('T7', 'html-lang', observedAt),
    } : undefined,
    size: {
      urls: {
        value: urls,
        confidence: 1,
        source: stamp('T7', 'sample-scan', observedAt),
      },
    },
  };
}

function toPageSignals(pages: any[]): PageSignal[] {
  return pages.map((page) => ({
    url: String(page.url || ''),
    schemaTypes: Array.isArray(page.schemaTypes) ? page.schemaTypes : [],
    cmsType: page.cmsType || page.detectedCms || null,
    language: page.language || page.lang || 'unknown',
    industrySignals: page.industrySignals || {},
    wordCount: Number(page.wordCount || 0),
    crawlDepth: Number(page.crawlDepth || 0),
    statusCode: Number(page.statusCode || 0),
    isHtmlPage: page.isHtmlPage !== false,
    hasPricingPage: Boolean(page.hasPricingPage),
    hasEmbeddedMap: Boolean(page.hasEmbeddedMap),
    hasPostalAddress: Boolean(page.hasPostalAddress),
    phoneNumbers: Array.isArray(page.phoneNumbers) ? page.phoneNumbers : [],
    gscImpressions: Number(page.gscImpressions || 0),
    mainKeyword: page.mainKeyword,
  })).filter((page) => Boolean(page.url));
}

function extractSchemaTypes(html: string): string[] {
  const out = new Set<string>();
  const matches = html.matchAll(/"@type"\s*:\s*"([^"]+)"/g);
  for (const match of matches) out.add(match[1]);
  return [...out];
}

function detectCmsFromHtml(html: string): string | null {
  const lower = html.toLowerCase();
  if (lower.includes('wp-content/') || lower.includes('wordpress')) return 'wordpress';
  if (lower.includes('cdn.shopify.com') || lower.includes('shopify.theme')) return 'shopify';
  if (lower.includes('static.wixstatic.com')) return 'wix';
  if (lower.includes('squarespace.com')) return 'squarespace';
  if (lower.includes('framerusercontent.com')) return 'framer';
  if (lower.includes('/webflow.css') || lower.includes('webflow')) return 'webflow';
  if (lower.includes('ghost')) return 'ghost';
  return null;
}

function extractLanguage(html: string): string {
  const direct = html.match(/<html[^>]*\blang=["']([^"']+)["']/i)?.[1];
  if (direct) return direct.split('-')[0].toLowerCase();
  return 'unknown';
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function safePathname(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return '/';
  }
}

function stamp(tier: SourceStamp['tier'], provider: string, observedAt: string, confidence?: number): SourceStamp {
  return {
    tier,
    provider,
    observedAt,
    tags: ['scrape', 'fresh'],
    confidence,
  };
}

function clampConfidence(value: number): number {
  return Math.max(0, Math.min(1, value));
}
