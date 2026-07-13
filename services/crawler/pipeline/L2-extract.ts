// services/crawler/pipeline/L2-extract.ts
// ── L2 Extract: Single-pass extraction from raw HTML ────────────────
//
// Extracts: content, links, schema, robots, render diff, regex,
//           content hash, images, meta — all in one pass over the DOM

import type { FingerprintResult } from '@seesby/fingerprint';
import type { FetchResult } from './L1-fetch';

// ── Types ───────────────────────────────────────────────────────────

export interface ExtractionResult {
  url: string;
  finalUrl: string;

  // Content extraction
  content: ContentData;

  // Link extraction
  links: LinkData;

  // Schema / structured data
  schema: SchemaData;

  // Robots / indexability
  robots: RobotsData;

  // Render diff (static vs client-rendered)
  renderDiff: RenderDiffData;

  // Regex patterns found in content
  regexPatterns: RegexPatternData;

  // Content hash for duplicate detection
  contentHash: ContentHashData;

  // Image analysis
  images: ImageData;

  // Meta tags
  meta: MetaData;

  // Raw extraction timestamp
  extractedAt: string;
  extractionTimeMs: number;
}

export interface ContentData {
  title: string;
  metaDescription: string;
  h1: string[];
  h2: string[];
  h3: string[];
  h4: string[];
  h5: string[];
  h6: string[];
  wordCount: number;
  charCount: number;
  readabilityScore: number | null;
  language: string;
  paragraphs: number;
  lists: number;
  tables: number;
  codeBlocks: number;
  wordCountBySection: { heading: string; words: number }[];
}

export interface LinkData {
  internalLinks: LinkInfo[];
  externalLinks: LinkInfo[];
  nofollowLinks: LinkInfo[];
  anchorTextDistribution: Record<string, number>;
  totalInternal: number;
  totalExternal: number;
  totalNofollow: number;
}

export interface LinkInfo {
  href: string;
  text: string;
  rel: string[];
  isNofollow: boolean;
  isInternal: boolean;
}

export interface SchemaData {
  jsonLd: Record<string, unknown>[];
  schemaTypes: string[];
  hasOrganization: boolean;
  hasBreadcrumb: boolean;
  hasWebPage: boolean;
  hasArticle: boolean;
  hasProduct: boolean;
  hasFAQ: boolean;
  hasHowTo: boolean;
  hasLocalBusiness: boolean;
  hasEvent: boolean;
  hasJobPosting: boolean;
  schemaCount: number;
}

export interface RobotsData {
  metaRobots: string | null;
  xRobotsTag: string | null;
  canonical: string | null;
  canonicalSelfReferencing: boolean;
  hreflang: { code: string; url: string }[];
  hreflangValid: boolean;
  noindex: boolean;
  nofollow: boolean;
  noarchive: boolean;
  nosnippet: boolean;
  isIndexable: boolean;
}

export interface RenderDiffData {
  hasDiff: boolean;
  staticWordCount: number;
  renderedWordCount: number;
  diffPercentage: number;
  missingInStatic: string[];
  renderMethod: 'fastFetch' | 'browserRender';
}

export interface RegexPatternData {
  phoneNumbers: string[];
  emailAddresses: string[];
  streetAddresses: string[];
  prices: string[];
  dates: string[];
  socialMediaUrls: string[];
}

export interface ContentHashData {
  simhash: string;
  minhash: string[];
  similarity?: number; // Computed during L4 duplicate detection
}

export interface ImageData {
  total: number;
  missingAlt: number;
  emptyAlt: number;
  missingWidth: number;
  missingHeight: number;
  lazyLoaded: number;
  formats: Record<string, number>; // { webp: 5, avif: 2, jpeg: 10, ... }
  totalSizeEstimate: number;
}

export interface MetaData {
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  ogType: string | null;
  ogUrl: string | null;
  twitterCard: string | null;
  twitterTitle: string | null;
  twitterDescription: string | null;
  twitterImage: string | null;
  viewport: string | null;
  charset: string | null;
  lang: string | null;
  author: string | null;
  generator: string | null;
  themeColor: string | null;
}

// ── Main Entry ──────────────────────────────────────────────────────

/**
 * Single-pass extraction from a fetched page.
 * All sub-extractors run over the same parsed HTML for efficiency.
 */
export function extractPage(
  fetchResult: FetchResult,
  fingerprint?: FingerprintResult | null,
): ExtractionResult {
  const t0 = performance.now();
  const hostname = extractHostname(fetchResult.finalUrl);
  const html = fetchResult.html;

  // Single-parse of the HTML document
  const doc = parseHtml(html);

  const content = extractContent(doc);
  const links = extractLinks(doc, hostname);
  const schema = extractSchema(doc);
  const robots = extractRobots(doc);
  const renderDiff = buildRenderDiff(fetchResult, content);
  const regexPatterns = extractRegexPatterns(content);
  const contentHash = computeContentHash(html, content);
  const images = extractImages(doc);
  const meta = extractMeta(doc);

  return {
    url: fetchResult.url,
    finalUrl: fetchResult.finalUrl,
    content,
    links,
    schema,
    robots,
    renderDiff,
    regexPatterns,
    contentHash,
    images,
    meta,
    extractedAt: new Date().toISOString(),
    extractionTimeMs: Math.round(performance.now() - t0),
  };
}

/**
 * Batch extraction for multiple fetched pages.
 */
export function extractPageBatch(
  fetchResults: FetchResult[],
  fingerprint?: FingerprintResult | null,
  onProgress?: (extracted: number, total: number) => void,
): ExtractionResult[] {
  const results: ExtractionResult[] = [];
  for (let i = 0; i < fetchResults.length; i++) {
    const fetchResult = fetchResults[i];
    if (!fetchResult.html || fetchResult.error) {
      // Skip pages that failed to fetch
      onProgress?.(i + 1, fetchResults.length);
      continue;
    }
    results.push(extractPage(fetchResult, fingerprint));
    onProgress?.(i + 1, fetchResults.length);
  }
  return results;
}

// ── HTML Parser ─────────────────────────────────────────────────────

interface ParsedDoc {
  title: string;
  metaTags: Record<string, string>;
  headings: Map<string, string[]>; // tag -> texts
  links: ParsedLink[];
  jsonLdBlocks: Record<string, unknown>[];
  scripts: string[];
  styles: string[];
  images: ParsedImage[];
  bodyText: string;
  rawHtml: string;
}

interface ParsedLink {
  href: string;
  text: string;
  rel: string[];
}

interface ParsedImage {
  src: string;
  alt: string;
  width: string | null;
  height: string | null;
  loading: string | null;
}

function parseHtml(html: string): ParsedDoc {
  // Lightweight HTML parsing using regex-based extraction
  // (no external DOM parser dependency in this layer)
  const title = extractTagContent(html, 'title');
  const metaTags = extractMetaTags(html);
  const headings = extractHeadings(html);
  const links = extractLinksFromHtml(html);
  const jsonLdBlocks = extractJsonLd(html);
  const scripts = extractTags(html, 'script');
  const styles = extractTags(html, 'style');
  const images = extractImagesFromHtml(html);
  const bodyText = extractBodyText(html);

  return {
    title,
    metaTags,
    headings,
    links,
    jsonLdBlocks,
    scripts,
    styles,
    images,
    bodyText,
    rawHtml: html,
  };
}

// ── Sub-Extractors ──────────────────────────────────────────────────

function extractContent(doc: ParsedDoc): ContentData {
  const title = doc.title;
  const metaDescription = doc.metaTags['description'] ?? '';
  const h1 = doc.headings.get('h1') ?? [];
  const h2 = doc.headings.get('h2') ?? [];
  const h3 = doc.headings.get('h3') ?? [];
  const h4 = doc.headings.get('h4') ?? [];
  const h5 = doc.headings.get('h5') ?? [];
  const h6 = doc.headings.get('h6') ?? [];
  const bodyText = doc.bodyText;
  const words = bodyText.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const charCount = bodyText.length;

  // Readability: simplified Flesch-Kincaid approximation
  const sentences = bodyText.split(/[.!?]+/).filter(Boolean).length || 1;
  const syllableCount = estimateSyllableCount(words);
  const readabilityScore = computeFleschKincaid(wordCount, sentences, syllableCount);

  // Language detection from lang attribute
  const language = doc.metaTags['lang'] ?? doc.metaTags['content-language'] ?? 'en';

  // Content structure
  const paragraphs = (doc.rawHtml.match(/<p[\s>]/gi) || []).length;
  const lists = (doc.rawHtml.match(/<[uo]l[\s>]/gi) || []).length;
  const tables = (doc.rawHtml.match(/<table[\s>]/gi) || []).length;
  const codeBlocks = (doc.rawHtml.match(/<pre[\s>]/gi) || []).length;

  // Word count by section
  const wordCountBySection = computeWordCountBySection(doc);

  return {
    title,
    metaDescription,
    h1, h2, h3, h4, h5, h6,
    wordCount,
    charCount,
    readabilityScore,
    language,
    paragraphs,
    lists,
    tables,
    codeBlocks,
    wordCountBySection,
  };
}

function extractLinks(doc: ParsedDoc, currentHostname: string): LinkData {
  const internalLinks: LinkInfo[] = [];
  const externalLinks: LinkInfo[] = [];
  const nofollowLinks: LinkInfo[] = [];
  const anchorTextDistribution: Record<string, number> = {};

  for (const parsed of doc.links) {
    const isInternal = isSameHost(parsed.href, currentHostname);
    const isNofollow = parsed.rel.includes('nofollow');

    const info: LinkInfo = {
      href: parsed.href,
      text: parsed.text,
      rel: parsed.rel,
      isNofollow,
      isInternal,
    };

    if (isInternal) internalLinks.push(info);
    else externalLinks.push(info);
    if (isNofollow) nofollowLinks.push(info);

    // Anchor text distribution
    const anchorText = parsed.text.trim().toLowerCase();
    if (anchorText) {
      anchorTextDistribution[anchorText] = (anchorTextDistribution[anchorText] ?? 0) + 1;
    }
  }

  return {
    internalLinks,
    externalLinks,
    nofollowLinks,
    anchorTextDistribution,
    totalInternal: internalLinks.length,
    totalExternal: externalLinks.length,
    totalNofollow: nofollowLinks.length,
  };
}

function extractSchema(doc: ParsedDoc): SchemaData {
  const jsonLd = doc.jsonLdBlocks;
  const schemaTypes: string[] = [];

  let hasOrganization = false;
  let hasBreadcrumb = false;
  let hasWebPage = false;
  let hasArticle = false;
  let hasProduct = false;
  let hasFAQ = false;
  let hasHowTo = false;
  let hasLocalBusiness = false;
  let hasEvent = false;
  let hasJobPosting = false;

  for (const block of jsonLd) {
    const type = (block as any)?.['@type'];
    if (!type) continue;

    const types = Array.isArray(type) ? type : [type];
    for (const t of types) {
      schemaTypes.push(t);
      const tl = t.toLowerCase();
      if (tl === 'organization') hasOrganization = true;
      if (tl === 'breadcrumblist') hasBreadcrumb = true;
      if (tl === 'webpage') hasWebPage = true;
      if (['article', 'newsarticle', 'blogposting'].includes(tl)) hasArticle = true;
      if (tl === 'product') hasProduct = true;
      if (tl === 'faqpage') hasFAQ = true;
      if (tl === 'howto') hasHowTo = true;
      if (tl === 'localbusiness') hasLocalBusiness = true;
      if (tl === 'event') hasEvent = true;
      if (tl === 'jobposting') hasJobPosting = true;
    }
  }

  return {
    jsonLd,
    schemaTypes: [...new Set(schemaTypes)],
    hasOrganization,
    hasBreadcrumb,
    hasWebPage,
    hasArticle,
    hasProduct,
    hasFAQ,
    hasHowTo,
    hasLocalBusiness,
    hasEvent,
    hasJobPosting,
    schemaCount: schemaTypes.length,
  };
}

function extractRobots(doc: ParsedDoc): RobotsData {
  // Meta robots
  const metaRobots = doc.metaTags['robots'] ?? doc.metaTags['googlebot'] ?? null;
  const xRobotsTag = null; // Would come from HTTP headers

  // Canonical
  const canonical = doc.metaTags['canonical'] ?? null;
  const canonicalSelfReferencing = canonical === null; // Will be compared in caller

  // Hreflang
  const hreflang: { code: string; url: string }[] = [];
  const hreflangPattern = /hreflang="([a-z-]+)"/gi;
  const linkPattern = /href="([^"]+)"/gi;
  // Simplified extraction - production would use proper DOM
  const hreflangTags = (doc.rawHtml.match(/<link[^>]*hreflang[^>]*>/gi) || []);
  for (const tag of hreflangTags) {
    const codeMatch = tag.match(/hreflang="([a-z-]+)"/i);
    const urlMatch = tag.match(/href="([^"]+)"/i);
    if (codeMatch?.[1] && urlMatch?.[1]) {
      hreflang.push({ code: codeMatch[1], url: urlMatch[1] });
    }
  }

  // Parse robots directives
  const noindex = /noindex/i.test(metaRobots ?? '');
  const nofollow = /nofollow/i.test(metaRobots ?? '');
  const noarchive = /noarchive/i.test(metaRobots ?? '');
  const nosnippet = /nosnippet/i.test(metaRobots ?? '');

  // hreflang validation (simplified: check if return links exist)
  const hreflangCodes = hreflang.map((h) => h.code);
  const hreflangValid = hreflang.length === 0 || hreflangCodes.length > 0;

  return {
    metaRobots,
    xRobotsTag,
    canonical,
    canonicalSelfReferencing,
    hreflang,
    hreflangValid,
    noindex,
    nofollow,
    noarchive,
    nosnippet,
    isIndexable: !noindex,
  };
}

function buildRenderDiff(fetchResult: FetchResult, content: ContentData): RenderDiffData {
  const renderMethod = fetchResult.renderMethod;
  const staticWordCount = content.wordCount;

  // For browser-rendered pages, we assume the rendered content matches what we extracted
  // In production, this would compare static HTML text vs rendered text
  return {
    hasDiff: renderMethod === 'browserRender',
    staticWordCount: renderMethod === 'fastFetch' ? staticWordCount : 0,
    renderedWordCount: staticWordCount,
    diffPercentage: renderMethod === 'browserRender' ? 100 : 0,
    missingInStatic: [],
    renderMethod,
  };
}

function extractRegexPatterns(content: ContentData): RegexPatternData {
  const text = [
    content.title,
    content.metaDescription,
    ...content.h1,
    ...content.h2,
  ].join(' ');

  return {
    phoneNumbers: extractPhoneNumbers(text),
    emailAddresses: extractEmailAddresses(text),
    streetAddresses: extractStreetAddresses(text),
    prices: extractPrices(text),
    dates: extractDates(text),
    socialMediaUrls: extractSocialMediaUrls(text),
  };
}

function computeContentHash(html: string, content: ContentData): ContentHashData {
  // Simplified simhash: compute feature-based hash from content
  const text = `${content.title} ${content.metaDescription} ${content.h1.join(' ')}`;

  // Simple hash based on character frequencies (production uses proper simhash)
  const chars = new Array(64).fill(0);
  for (const ch of text.toLowerCase()) {
    const idx = ch.charCodeAt(0) % 64;
    chars[idx] = (chars[idx] + 1) % 256;
  }
  const simhash = chars.map((c) => c.toString(16).padStart(2, '0')).join('');

  // Minhash: hash of top N n-grams
  const ngrams = getTopNgrams(text, 20);
  const minhash = ngrams.map((ng) => simpleHash(ng).toString(16));

  return { simhash, minhash };
}

function extractImages(doc: ParsedDoc): ImageData {
  const images = doc.images;
  const formats: Record<string, number> = {};
  let missingAlt = 0;
  let emptyAlt = 0;
  let missingWidth = 0;
  let missingHeight = 0;
  let lazyLoaded = 0;

  for (const img of images) {
    if (!img.alt) missingAlt++;
    else if (img.alt.trim() === '') emptyAlt++;
    if (!img.width) missingWidth++;
    if (!img.height) missingHeight++;
    if (img.loading === 'lazy') lazyLoaded++;

    // Detect format from src
    const src = img.src.toLowerCase();
    if (src.includes('.webp')) formats['webp'] = (formats['webp'] ?? 0) + 1;
    else if (src.includes('.avif')) formats['avif'] = (formats['avif'] ?? 0) + 1;
    else if (src.includes('.png')) formats['png'] = (formats['png'] ?? 0) + 1;
    else if (src.includes('.svg')) formats['svg'] = (formats['svg'] ?? 0) + 1;
    else if (src.includes('.gif')) formats['gif'] = (formats['gif'] ?? 0) + 1;
    else formats['jpeg'] = (formats['jpeg'] ?? 0) + 1;
  }

  return {
    total: images.length,
    missingAlt,
    emptyAlt,
    missingWidth,
    missingHeight,
    lazyLoaded,
    formats,
    totalSizeEstimate: 0, // Would require actual image downloads
  };
}

function extractMeta(doc: ParsedDoc): MetaData {
  const mt = doc.metaTags;
  return {
    ogTitle: mt['og:title'] ?? null,
    ogDescription: mt['og:description'] ?? null,
    ogImage: mt['og:image'] ?? null,
    ogType: mt['og:type'] ?? null,
    ogUrl: mt['og:url'] ?? null,
    twitterCard: mt['twitter:card'] ?? null,
    twitterTitle: mt['twitter:title'] ?? null,
    twitterDescription: mt['twitter:description'] ?? null,
    twitterImage: mt['twitter:image'] ?? null,
    viewport: mt['viewport'] ?? null,
    charset: mt['charset'] ?? null,
    lang: mt['lang'] ?? null,
    author: mt['author'] ?? null,
    generator: mt['generator'] ?? null,
    themeColor: mt['theme-color'] ?? null,
  };
}

// ── Regex Extractors ────────────────────────────────────────────────

function extractPhoneNumbers(text: string): string[] {
  const matches = text.match(/\+?[\d\s\-().]{7,20}/g) || [];
  return [...new Set(matches.map((m) => m.trim()))];
}

function extractEmailAddresses(text: string): string[] {
  const matches = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
  return [...new Set(matches)];
}

function extractStreetAddresses(text: string): string[] {
  // Simplified: look for common address patterns
  const matches = text.match(/\d+\s+[\w\s]+(?:St|Ave|Blvd|Rd|Dr|Ln|Way|Ct|Pl)\b[^.]{0,50}/gi) || [];
  return [...new Set(matches.map((m) => m.trim()))];
}

function extractPrices(text: string): string[] {
  const matches = text.match(/[$\u20ac\u00a3]\s*[\d,]+\.?\d*/g) || [];
  return [...new Set(matches)];
}

function extractDates(text: string): string[] {
  const matches = text.match(/\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/g) || [];
  return [...new Set(matches)];
}

function extractSocialMediaUrls(text: string): string[] {
  const patterns = [
    /https?:\/\/(?:www\.)?facebook\.com\/[^\s]+/gi,
    /https?:\/\/(?:www\.)?twitter\.com\/[^\s]+/gi,
    /https?:\/\/(?:www\.)?linkedin\.com\/[^\s]+/gi,
    /https?:\/\/(?:www\.)?instagram\.com\/[^\s]+/gi,
    /https?:\/\/(?:www\.)?youtube\.com\/[^\s]+/gi,
  ];
  const results: string[] = [];
  for (const pattern of patterns) {
    const matches = text.match(pattern) || [];
    results.push(...matches);
  }
  return [...new Set(results)];
}

// ── HTML Parsing Helpers ────────────────────────────────────────────

function extractTagContent(html: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i');
  const match = html.match(regex);
  return match?.[1]?.trim() ?? '';
}

function extractMetaTags(html: string): Record<string, string> {
  const tags: Record<string, string> = {};
  const metaPattern = /<meta\s+[^>]*>/gi;
  const matches = html.match(metaPattern) || [];

  for (const tag of matches) {
    // name="..." content="..."
    const nameMatch = tag.match(/name=["']([^"']+)["']/i) || tag.match(/property=["']([^"']+)["']/i);
    const contentMatch = tag.match(/content=["']([^"']+)["']/i);
    if (nameMatch?.[1] && contentMatch?.[1]) {
      tags[nameMatch[1].toLowerCase()] = contentMatch[1];
    }
    // charset
    const charsetMatch = tag.match(/charset=["']?([^"'\s>]+)["']?/i);
    if (charsetMatch?.[1]) tags['charset'] = charsetMatch[1];
  }

  // Canonical link
  const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
  if (canonicalMatch?.[1]) tags['canonical'] = canonicalMatch[1];

  // Lang attribute
  const langMatch = html.match(/<html[^>]*lang=["']([^"']+)["']/i);
  if (langMatch?.[1]) tags['lang'] = langMatch[1];

  return tags;
}

function extractHeadings(html: string): Map<string, string[]> {
  const headings = new Map<string, string[]>();
  for (let i = 1; i <= 6; i++) {
    const tag = `h${i}`;
    const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'gi');
    const matches = html.matchAll(regex);
    const texts: string[] = [];
    for (const match of matches) {
      texts.push(stripHtmlTags(match[1]).trim());
    }
    headings.set(tag, texts);
  }
  return headings;
}

function extractLinksFromHtml(html: string): ParsedLink[] {
  const links: ParsedLink[] = [];
  const linkPattern = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  const matches = html.matchAll(linkPattern);

  for (const match of matches) {
    const href = match[1];
    const text = stripHtmlTags(match[2]).trim();
    const relMatch = match[0].match(/rel=["']([^"']+)["']/i);
    const rel = relMatch?.[1]?.split(/\s+/) ?? [];
    links.push({ href, text, rel });
  }

  return links;
}

function extractJsonLd(html: string): Record<string, unknown>[] {
  const blocks: Record<string, unknown>[] = [];
  const pattern = /<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  const matches = html.matchAll(pattern);

  for (const match of matches) {
    try {
      const data = JSON.parse(match[1]);
      if (Array.isArray(data)) {
        blocks.push(...data);
      } else if (typeof data === 'object') {
        blocks.push(data);
      }
    } catch {
      // skip malformed JSON-LD
    }
  }

  return blocks;
}

function extractTags(html: string, tag: string): string[] {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'gi');
  return [...html.matchAll(regex)].map((m) => m[1] ?? '');
}

function extractImagesFromHtml(html: string): ParsedImage[] {
  const images: ParsedImage[] = [];
  const pattern = /<img\s+[^>]*>/gi;
  const matches = html.match(pattern) || [];

  for (const tag of matches) {
    const srcMatch = tag.match(/src=["']([^"']+)["']/i);
    const altMatch = tag.match(/alt=["']([^"']*)["']/i);
    const widthMatch = tag.match(/width=["']?(\d+)["']?/i);
    const heightMatch = tag.match(/height=["']?(\d+)["']?/i);
    const loadingMatch = tag.match(/loading=["']([^"']+)["']/i);

    images.push({
      src: srcMatch?.[1] ?? '',
      alt: altMatch?.[1] ?? '',
      width: widthMatch?.[1] ?? null,
      height: heightMatch?.[1] ?? null,
      loading: loadingMatch?.[1] ?? null,
    });
  }

  return images;
}

function extractBodyText(html: string): string {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const bodyHtml = bodyMatch?.[1] ?? html;
  return stripHtmlTags(bodyHtml).replace(/\s+/g, ' ').trim();
}

function stripHtmlTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ');
}

// ── Content Analysis Helpers ────────────────────────────────────────

function computeWordCountBySection(doc: ParsedDoc): { heading: string; words: number }[] {
  // Walk through headings and count words between each
  const sections: { heading: string; words: number }[] = [];
  const headings = doc.headings;

  for (let i = 1; i <= 6; i++) {
    const tag = `h${i}`;
    const texts = headings.get(tag) ?? [];
    for (const text of texts) {
      sections.push({ heading: `[${tag}] ${text}`, words: 0 });
    }
  }

  // Simplified: distribute body word count equally among sections
  if (sections.length > 0) {
    const totalWords = doc.bodyText.split(/\s+/).filter(Boolean).length;
    const perSection = Math.floor(totalWords / sections.length);
    for (const section of sections) {
      section.words = perSection;
    }
  }

  return sections;
}

function estimateSyllableCount(words: string[]): number {
  let count = 0;
  for (const word of words) {
    count += countSyllables(word);
  }
  return count;
}

function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 3) return 1;

  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');

  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}

function computeFleschKincaid(wordCount: number, sentenceCount: number, syllableCount: number): number {
  if (wordCount === 0 || sentenceCount === 0) return 0;
  return Math.round(
    206.835 - 1.015 * (wordCount / sentenceCount) - 84.6 * (syllableCount / wordCount),
  );
}

function getTopNgrams(text: string, n: number): string[] {
  const words = text.toLowerCase().split(/\s+/).filter(Boolean);
  const ngramCounts: Record<string, number> = {};

  for (let i = 0; i <= words.length - 2; i++) {
    const bigram = `${words[i]} ${words[i + 1]}`;
    ngramCounts[bigram] = (ngramCounts[bigram] ?? 0) + 1;
  }

  return Object.entries(ngramCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([gram]) => gram);
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + ch;
    hash |= 0;
  }
  return Math.abs(hash);
}

// ── Utility ─────────────────────────────────────────────────────────

function extractHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

function isSameHost(url: string, hostname: string): boolean {
  try {
    const urlHost = new URL(url).hostname;
    return urlHost === hostname || urlHost.endsWith(`.${hostname}`);
  } catch {
    return false;
  }
}
