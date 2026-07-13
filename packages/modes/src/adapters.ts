import type { CmsKey, Industry, ProjectFingerprint, SourceTier } from '@seesby/types';
import { CMS_LABELS, INDUSTRY_LABELS, SOURCE_TIER_LABEL } from '@seesby/types';

export interface UiFingerprintVocabulary {
  industry: Industry;
  industryLabel: string;
  cms: CmsKey;
  cmsLabel: string;
  language: string;
  sourceTier: SourceTier;
  sourceTierLabel: string;
}

export function normalizeIndustry(input: Industry | string | null | undefined): Industry {
  switch (input) {
    case 'jobBoard':
      return 'jobBoard';
    case 'realEstate':
      return 'realEstate';
    case 'ecommerce':
    case 'saas':
    case 'blog':
    case 'news':
    case 'finance':
    case 'education':
    case 'healthcare':
    case 'local':
    case 'jobBoard':
    case 'realEstate':
    case 'restaurant':
    case 'portfolio':
    case 'media':
    case 'government':
    case 'nonprofit':
    case 'general':
      return input;
    default:
      return 'general';
  }
}

export function normalizeCms(input: CmsKey | string | null | undefined): CmsKey {
  const value = String(input ?? '').toLowerCase();
  switch (value) {
    case 'hubspot':
      return 'hubspot-cms';
    case 'salesforce':
      return 'salesforce-commerce';
    case 'nextjs':
      return 'nextjs-headless';
    case 'wordpress':
    case 'shopify':
    case 'wix':
    case 'squarespace':
    case 'hubspot-cms':
    case 'ghost':
    case 'medium':
    case 'substack':
    case 'magento':
    case 'webflow':
    case 'framer':
    case 'drupal':
    case 'joomla':
    case 'bigcommerce':
    case 'salesforce-commerce':
    case 'woocommerce':
    case 'bitrix':
    case 'duda':
    case 'intercom':
    case 'astro':
    case 'jekyll':
    case 'hugo':
    case 'notion':
    case 'contentful':
    case 'sanity':
    case 'strapi':
    case 'nextjs-headless':
    case 'gatsby':
    case 'custom':
      return value;
    default:
      return 'custom';
  }
}

export function formatIndustryLabel(industry: Industry | string): string {
  return INDUSTRY_LABELS[normalizeIndustry(industry)];
}

export function formatCmsLabel(cms: CmsKey | string | null | undefined): string {
  return CMS_LABELS[normalizeCms(cms)];
}

export function toPickerIndustry(industry: Industry | string | null | undefined): Industry | 'all' {
  const normalized = normalizeIndustry(industry);
  return normalized === 'restaurant' ? 'local' : normalized;
}

export function fingerprintToUiVocabulary(fp: ProjectFingerprint): UiFingerprintVocabulary {
  const industry = normalizeIndustry(fp.industry.value);
  const cms = normalizeCms(fp.cms?.value);
  const sourceTier = fp.industry.source.tier;
  return {
    industry,
    industryLabel: INDUSTRY_LABELS[industry],
    cms,
    cmsLabel: CMS_LABELS[cms],
    language: fp.languagePrimary?.value ?? 'en',
    sourceTier,
    sourceTierLabel: SOURCE_TIER_LABEL[sourceTier],
  };
}
