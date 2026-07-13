// services/crawler/pipeline/cms-columns.ts
//
// CMS-specific metric definitions. When the project fingerprint identifies
// a particular CMS, these columns are injected into the relevant views
// (grid, inspector, export) so users see platform-native fields.

import type { CmsKey } from '../../packages/types/src/cms';
import type { MetricDef } from '../../packages/types/src/metric-def';
import type { MetricRole } from '../../packages/types/src/roles';

// ── Helper: build a MetricDef from minimal parameters ──────────────────

function metric(
  key: string,
  namespace: string,
  label: string,
  description: string,
  extra: Partial<Pick<MetricDef, 'roles' | 'sources' | 'format' | 'unit' | 'width' | 'gate'>> = {},
): MetricDef {
  return {
    key,
    namespace,
    level: 'P',
    roles: (extra.roles as MetricRole[]) ?? ['G', 'I', 'X'],
    sources: extra.sources ?? ['T2', 'T6'],
    format: extra.format ?? 'number',
    unit: extra.unit,
    width: extra.width,
    i18nLabelKey: `metric.${key}.label`,
    description,
    gate: extra.gate,
  };
}

// ── WordPress ──────────────────────────────────────────────────────────

const WORDPRESS_METRICS: MetricDef[] = [
  metric('p.wp.pluginsCount', 'p.wp', 'Plugin Count', 'Number of active WordPress plugins detected.', {
    gate: { cms: ['wordpress'] },
  }),
  metric('p.wp.theme', 'p.wp', 'Active Theme', 'Name of the active WordPress theme.', {
    format: 'text',
    roles: ['I', 'X'],
    gate: { cms: ['wordpress'] },
  }),
  metric('p.wp.yoastScore', 'p.wp', 'Yoast SEO Score', 'Yoast SEO overall optimization score.', {
    format: 'score',
    roles: ['G', 'I', 'S'],
    gate: { cms: ['wordpress'] },
  }),
  metric('p.wp.rankMathScore', 'p.wp', 'Rank Math Score', 'Rank Math SEO optimization score.', {
    format: 'score',
    roles: ['G', 'I', 'S'],
    gate: { cms: ['wordpress'] },
  }),
  metric('p.wp.acfPresent', 'p.wp', 'ACF Present', 'Whether Advanced Custom Fields is active on this page.', {
    format: 'boolean',
    roles: ['I'],
    gate: { cms: ['wordpress'] },
  }),
];

// ── Shopify ────────────────────────────────────────────────────────────

const SHOPIFY_METRICS: MetricDef[] = [
  metric('p.shopify.appCount', 'p.shopify', 'App Count', 'Number of Shopify apps detected in use.', {
    gate: { cms: ['shopify'] },
  }),
  metric('p.shopify.theme', 'p.shopify', 'Theme', 'Name of the active Shopify theme.', {
    format: 'text',
    roles: ['I', 'X'],
    gate: { cms: ['shopify'] },
  }),
  metric('p.shopify.metaobject', 'p.shopify', 'Metaobjects Used', 'Whether Shopify Metaobjects are used on this page.', {
    format: 'boolean',
    roles: ['I'],
    gate: { cms: ['shopify'] },
  }),
  metric('p.shopify.jsonLdPack', 'p.shopify', 'JSON-LD Pack', 'Whether a JSON-LD structured data pack is present.', {
    format: 'boolean',
    roles: ['I', 'S'],
    gate: { cms: ['shopify'] },
  }),
];

// ── Webflow ────────────────────────────────────────────────────────────

const WEBFLOW_METRICS: MetricDef[] = [
  metric('p.webflow.cmsItems', 'p.webflow', 'CMS Items', 'Number of Webflow CMS items on the page.', {
    gate: { cms: ['webflow'] },
  }),
  metric('p.webflow.staticHtml', 'p.webflow', 'Static HTML', 'Whether the page uses static HTML export vs server-rendered.', {
    format: 'boolean',
    roles: ['I'],
    gate: { cms: ['webflow'] },
  }),
];

// ── Next.js ────────────────────────────────────────────────────────────

const NEXTJS_METRICS: MetricDef[] = [
  metric('p.next.isr', 'p.next', 'ISR Enabled', 'Whether the page uses Incremental Static Regeneration.', {
    format: 'boolean',
    roles: ['I', 'G'],
    gate: { cms: ['nextjs-headless'] },
  }),
  metric('p.next.staticOrSsr', 'p.next', 'Static / SSR', 'Whether the page is statically generated or server-side rendered.', {
    format: 'enum',
    roles: ['G', 'I'],
    gate: { cms: ['nextjs-headless'] },
  }),
  metric('p.next.hydrationMismatch', 'p.next', 'Hydration Mismatch', 'Number of client-server hydration mismatches detected.', {
    roles: ['I', 'S'],
    gate: { cms: ['nextjs-headless'] },
  }),
];

// ── Headless CMS (Contentful / Sanity) ────────────────────────────────

const HEADLESS_METRICS: MetricDef[] = [
  metric('p.headless.buildInfo', 'p.headless', 'Build Info', 'Build timestamp and deploy version from headless CMS.', {
    format: 'text',
    roles: ['I'],
    gate: { cms: ['contentful', 'sanity'] },
  }),
  metric('p.headless.previewBleed', 'p.headless', 'Preview Bleed', 'Whether preview/draft content may be leaking into production.', {
    format: 'boolean',
    roles: ['I', 'G', 'S'],
    gate: { cms: ['contentful', 'sanity'] },
  }),
];

// ── Scraper-limited (Framer / Wix / Squarespace) ──────────────────────

const SCRAPER_LIMITED_METRICS: MetricDef[] = [
  metric('p.scraper.isLimited', 'p.scraper', 'Scraper Limited', 'Whether scraping is restricted and full metrics are unavailable.', {
    format: 'boolean',
    roles: ['G', 'I'],
    sources: ['T8'],
    gate: { cms: ['framer', 'wix', 'squarespace'] },
  }),
];

// ── Ghost ──────────────────────────────────────────────────────────────

const GHOST_METRICS: MetricDef[] = [
  metric('p.ghost.memberArea', 'p.ghost', 'Member Area', 'Whether the page is behind a Ghost member area.', {
    format: 'boolean',
    roles: ['I'],
    gate: { cms: ['ghost'] },
  }),
  metric('p.ghost.portalEnabled', 'p.ghost', 'Portal Enabled', 'Whether the Ghost membership portal is enabled.', {
    format: 'boolean',
    roles: ['I'],
    gate: { cms: ['ghost'] },
  }),
];

// ── Substack ───────────────────────────────────────────────────────────

const SUBSTACK_METRICS: MetricDef[] = [
  metric('p.substack.paywall', 'p.substack', 'Paywall', 'Whether the post is behind a Substack paywall.', {
    format: 'boolean',
    roles: ['I', 'G'],
    gate: { cms: ['substack'] },
  }),
  metric('p.substack.subscribeRate', 'p.substack', 'Subscribe Rate', 'Estimated subscribe conversion rate from the landing CTA.', {
    format: 'percent',
    roles: ['G', 'I', 'S'],
    gate: { cms: ['substack'] },
  }),
];

// ── CMS → metrics map ─────────────────────────────────────────────────

const CMS_METRICS_MAP: Record<CmsKey, MetricDef[]> = {
  wordpress: WORDPRESS_METRICS,
  woocommerce: [...WORDPRESS_METRICS], // WooCommerce runs on WordPress
  shopify: SHOPIFY_METRICS,
  wix: SCRAPER_LIMITED_METRICS,
  squarespace: SCRAPER_LIMITED_METRICS,
  'hubspot-cms': [
    metric('p.hubspot.moduleCount', 'p.hubspot', 'Module Count', 'Number of HubSpot CMS modules on the page.', {
      gate: { cms: ['hubspot-cms'] },
    }),
  ],
  ghost: GHOST_METRICS,
  medium: [],
  substack: SUBSTACK_METRICS,
  magento: [
    metric('p.magento.blockCount', 'p.magento', 'Block Count', 'Number of Magento CMS blocks on the page.', {
      gate: { cms: ['magento'] },
    }),
  ],
  webflow: WEBFLOW_METRICS,
  framer: SCRAPER_LIMITED_METRICS,
  drupal: [
    metric('p.drupal.moduleCount', 'p.drupal', 'Module Count', 'Number of active Drupal modules detected.', {
      gate: { cms: ['drupal'] },
    }),
  ],
  joomla: [],
  bigcommerce: [
    metric('p.bigcommerce.storefront', 'p.bigcommerce', 'Storefront Theme', 'Active BigCommerce storefront theme.', {
      format: 'text',
      roles: ['I'],
      gate: { cms: ['bigcommerce'] },
    }),
  ],
  'salesforce-commerce': [
    metric('p.sfcc.cartridge', 'p.sfcc', 'Cartridge', 'Active SFCC cartridge version.', {
      format: 'text',
      roles: ['I'],
      gate: { cms: ['salesforce-commerce'] },
    }),
  ],
  bitrix: [],
  duda: SCRAPER_LIMITED_METRICS,
  astro: [],
  jekyll: [],
  hugo: [],
  notion: [],
  contentful: HEADLESS_METRICS,
  sanity: HEADLESS_METRICS,
  strapi: [
    metric('p.headless.buildInfo', 'p.headless', 'Build Info', 'Build timestamp from Strapi.', {
      format: 'text',
      roles: ['I'],
      gate: { cms: ['strapi'] },
    }),
    metric('p.headless.previewBleed', 'p.headless', 'Preview Bleed', 'Whether preview content may be leaking into production.', {
      format: 'boolean',
      roles: ['I', 'G', 'S'],
      gate: { cms: ['strapi'] },
    }),
  ],
  'nextjs-headless': NEXTJS_METRICS,
  gatsby: [],
  intercom: [],
  custom: [],
};

// ── Public API ─────────────────────────────────────────────────────────

/**
 * Return the CMS-specific metric definitions for the given CMS.
 * Returns an empty array for CMS types with no extra columns.
 */
export function getCmsSpecificColumns(cms: CmsKey): MetricDef[] {
  return CMS_METRICS_MAP[cms] ?? [];
}

/**
 * Return a flat list of all CMS-specific metrics across all CMS types.
 * Useful for building the full metric registry.
 */
export function getAllCmsColumns(): MetricDef[] {
  const out: MetricDef[] = [];
  for (const metrics of Object.values(CMS_METRICS_MAP)) {
    out.push(...metrics);
  }
  return out;
}

/**
 * Returns true if the given CMS is scraper-limited (may not provide full data).
 */
export function isScraperLimitedCms(cms: CmsKey): boolean {
  return ['framer', 'wix', 'squarespace', 'duda'].includes(cms);
}
