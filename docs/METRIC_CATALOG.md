# Seesby Metric Catalog

> **Single source of truth** for all metrics in the Seesby Crawler Pipeline.
> ~1,700 distinct fields across 18 namespaces, 8 levels, 13 roles, 9 source tiers.

---

## Table of Contents

1. [Overview](#overview)
   - [Levels](#levels)
   - [Roles](#roles)
   - [Source Tiers](#source-tiers)
   - [Tag Chips](#tag-chips)
   - [Freshness Classes](#freshness-classes)
   - [Formats](#formats)
2. [Fingerprint `fp.*`](#fp-fingerprint-26-metrics)
3. [Page Fundamentals `p.*`](#pf-page-fundamentals-53-metrics)
4. [Content `p.content.*`](#ct-content-116-metrics)
5. [Technical `p.tech.*`](#tl-technical-55-metrics)
6. [Links `p.links.*` + `l.*`](#lk-links-42-metrics)
7. [Search `p.search.*` + `q.*`](#sr-search-60-metrics)
8. [Analytics / Conversion `p.ga.*` + `p.conv.*`](#ga-analytics--conversion-50-metrics)
9. [AI Discoverability `p.ai.*`](#ai-ai-discoverability-22-metrics)
10. [Social `p.social.*` + `s.social.*`](#so-social-35-metrics)
11. [Paid `p.paid.*` + `s.paid.*`](#pa-paid-27-metrics)
12. [Commerce `p.commerce.*` + `s.commerce.*`](#cm-commerce-43-metrics)
13. [Local `p.local.*` + `s.local.*` + `e.local.*`](#lo-local-49-metrics)
14. [UX `p.ux.*` + `s.ux.*`](#ux-ux-21-metrics)
15. [Email `s.email.*` + `p.email.*`](#em-email-16-metrics)
16. [Competitor `e.competitor.*`](#cp-competitor-17-metrics)
17. [Site-wide Scores `s.score.*`](#sc-site-wide-scores-17-metrics)
18. [Background `b.*`](#bg-background-25-metrics)
19. [Universal `u.*`](#un-universal-15-metrics)
20. [UI Mapping Table](#ui-mapping-table)
21. [Adaptive Visibility Rules](#adaptive-visibility-rules)
22. [Conversion Event Packs](#conversion-event-packs)
23. [Deterministic vs AI Routing](#deterministic-vs-ai-routing)
24. [Score Component Formulas](#score-component-formulas)
25. [Action Reverse-Mapping](#action-reverse-mapping)
26. [Action Trigger Conditions](#action-trigger-conditions)

---

## Overview

### Levels

| Level | Scope | Storage | Recompute |
|-------|-------|---------|-----------|
| **P** | Page-level (per URL row) | pages table | each crawl of that URL |
| **S** | Site-level (one row per property) | site aggregate table | end of each crawl session |
| **K** | Cluster-level (topic/section cluster) | cluster table | end of session |
| **Q** | Keyword-level (per keyword × URL) | keywords table | daily from GSC, weekly rank |
| **L** | Link-level (per edge source→target) | links table | each crawl |
| **E** | Entity-level (per entity) | entities table | weekly |
| **B** | Background (computed out-of-band) | side table | scheduled or event-driven |
| **U** | Universal (tokens, thresholds) | config | on config change |
| **F** | Fingerprint (site detection) | fingerprint table | on crawl |

### Roles

| Role | Meaning |
|------|---------|
| **G** | Grid table column (visible or default-hidden) |
| **I** | Inspector tab |
| **R** | Right-sidebar aggregation |
| **L** | Left-sidebar filter / facet |
| **H** | Header / subheader chip |
| **B** | Bottom bar stat stripe |
| **V** | View canvas (chart, heatmap, map) |
| **X** | Export only (CSV/XLSX), not UI |
| **K** | KPI tile candidate |
| **A** | Drives an action |
| **S** | Drives a score component |
| **T** | Compare / time-series drill |
| **E** | Alert / event trigger |

### Source Tiers

| Tier | Source | Tag |
|------|--------|-----|
| **T0** | User's authenticated connection (GSC, GA4, GBP, Meta Ads) | ●source |
| **T1** | Authoritative public API free tier (CrUX, Bing WMT, PSI) | ●source |
| **T2** | User's browser offload (their session, their cookies) | ◐browser |
| **T3** | Free-tier scrape rotation (Ahrefs, Semrush, SimilarWeb, etc.) | ◑scrape |
| **T4** | CommonCrawl / BigQuery public datasets | ◑scrape |
| **T5** | SERP scrape via headless rotation (proxies, CAPTCHA bypass) | ◑scrape |
| **T6** | AI enrichment from raw HTML + text | ◌ai |
| **T7** | Internal formula / heuristic | ◌est |
| **T8** | Industry default (last resort) | ◌default |

### Tag Chips

| Chip | Meaning |
|------|---------|
| ●source | Authoritative (T0/T1) |
| ◐browser | User browser / cookie offload (T2) |
| ◑scrape | Free-tier scrape or rotation (T3/T4/T5) |
| ◌ai | AI-extracted or AI-estimated (T6) |
| ◌est | Internal formula (T7) |
| ◌default | Industry/global default (T8) |
| ⟲stale | Older than metric's TTL |
| ⚠low-n | Sample < threshold |

### Freshness Classes

| Class | Threshold | Symbol |
|-------|-----------|--------|
| live | < 5min | ● |
| recent | < 24h | ● |
| fresh | < 7d | ◐ |
| ok | < 30d | ◑ |
| stale | > 30d | ○ |
| unknown | — | · |

### Formats

number, percent, duration, bytes, date, enum, text, score, money, boolean, url, list, json

---

## FP: Fingerprint `fp.*` (26 metrics)

Runs before the full crawl on a probe sample. Every later layer reads `fp.*`.

---

### `fp.industry`
| Field | Value |
|-------|-------|
| Level | F |
| Roles | [H,R,L,A] |
| Sources | T0(user) > T6(AI probe) > T7(URL/schema heuristic) > T8(all) |
| Format | enum |
| Gate | always |
| Recompute | on-crawl |
| Values | ecommerce, saas, blog, news, finance, education, healthcare, local, jobboard, real_estate, restaurant, portfolio, media, government, nonprofit, general |
| Description | Primary industry classification of the site |

### `fp.industry.secondary`
| Field | Value |
|-------|-------|
| Level | F |
| Roles | [R,A] |
| Sources | T6 (AI multi-label) |
| Format | text |
| Gate | always |
| Recompute | on-crawl |
| Description | Secondary/compound industry label (e.g. "saas + content-led") |

### `fp.language.primary`
| Field | Value |
|-------|-------|
| Level | F |
| Roles | [H,R,L,A] |
| Sources | T1 html-lang > T6 AI > T7 URL pattern |
| Format | enum |
| Gate | always |
| Recompute | on-crawl |
| Description | Primary content language (ISO 639-1) |

### `fp.language.set`
| Field | Value |
|-------|-------|
| Level | F |
| Roles | [R,L] |
| Sources | T1 hreflang + URL pattern + content sample |
| Format | list |
| Gate | always |
| Recompute | on-crawl |
| Description | Set of all languages detected across the site |

### `fp.cms`
| Field | Value |
|-------|-------|
| Level | F |
| Roles | [R,L,A] |
| Sources | T1 BuiltWith free > T2 DOM fingerprint > T6 AI > T7 pattern |
| Format | enum |
| Gate | always |
| Recompute | on-crawl |
| Values | wordpress, shopify, woocommerce, webflow, wix, squarespace, framer, ghost, contentful, sanity, strapi, drupal, joomla, magento, bigcommerce, salesforce-commerce, hubspot-cms, nextjs-headless, gatsby, astro, jekyll, hugo, medium, substack, notion, custom |
| Description | Content management system detected |

### `fp.stack.hosting`
| Field | Value |
|-------|-------|
| Level | F |
| Roles | [R,X] |
| Sources | T1 Cloudflare/Vercel/AWS headers > T2 DNS > T6 AI |
| Format | enum |
| Gate | always |
| Description | Hosting provider (Vercel, Cloudflare Pages, AWS, Heroku, etc.) |

### `fp.stack.cdn`
| Field | Value |
|-------|-------|
| Level | F |
| Roles | [R,X] |
| Sources | T1 response headers > T2 ASN lookup |
| Format | enum |
| Gate | always |
| Description | CDN detected (Cloudflare, CloudFront, Fastly, Akamai, etc.) |

### `fp.stack.framework`
| Field | Value |
|-------|-------|
| Level | F |
| Roles | [R,X] |
| Sources | T1 DOM signatures |
| Format | enum |
| Gate | always |
| Description | Frontend framework (Next.js, Nuxt, React, Vue, Angular, etc.) |

### `fp.stack.ssg`
| Field | Value |
|-------|-------|
| Level | F |
| Roles | [R,X] |
| Sources | T1 build-id patterns, generator meta |
| Format | enum |
| Gate | fp.stack.framework ∈ {nextjs, gatsby, astro, hugo, jekyll} |
| Description | Static site generator if applicable |

### `fp.stack.analytics`
| Field | Value |
|-------|-------|
| Level | F |
| Roles | [R,X] |
| Sources | T2 HTML script/link scanning |
| Format | list |
| Gate | always |
| Description | Analytics platforms detected (GA4, Plausible, Fathom, Umami, Adobe, Matomo, Mixpanel, PostHog, Amplitude) |

### `fp.stack.adPlatforms`
| Field | Value |
|-------|-------|
| Level | F |
| Roles | [R,X] |
| Sources | T2 HTML script/tag scanning |
| Format | list |
| Gate | always |
| Description | Advertising platforms detected (Google Ads, Meta Pixel, LinkedIn Insight, TikTok, X, Reddit, Pinterest, Microsoft) |

### `fp.stack.behavior`
| Field | Value |
|-------|-------|
| Level | F |
| Roles | [R,X] |
| Sources | T2 HTML script scanning |
| Format | list |
| Gate | always |
| Description | Behavior analytics tools (Hotjar, Clarity, FullStory, LogRocket, Mouseflow, Smartlook) |

### `fp.stack.experiments`
| Field | Value |
|-------|-------|
| Level | F |
| Roles | [R,X] |
| Sources | T2 HTML script scanning |
| Format | list |
| Gate | always |
| Description | A/B testing platforms (Optimizely, VWO, GrowthBook, Statsig, Split) |

### `fp.stack.chat`
| Field | Value |
|-------|-------|
| Level | F |
| Roles | [R,X] |
| Sources | T2 HTML script scanning |
| Format | list |
| Gate | always |
| Description | Live chat widgets (Intercom, Drift, Crisp, Tawk, Tidio, Olark, Zendesk) |

### `fp.stack.email`
| Field | Value |
|-------|-------|
| Level | F |
| Roles | [R,X] |
| Sources | T2 HTML form/script scanning |
| Format | list |
| Gate | always |
| Description | Email marketing platforms (Mailchimp, Klaviyo, Customer.io, Braze, Marketo, HubSpot, SendGrid, ActiveCampaign, ConvertKit, Beehiiv, Substack) |

### `fp.stack.ecom`
| Field | Value |
|-------|-------|
| Level | F |
| Roles | [R,X] |
| Sources | T2 HTML/meta scanning |
| Format | list |
| Gate | always |
| Description | E-commerce platforms detected (Stripe, Shopify, WooCommerce, Snipcart, BigCommerce) |

### `fp.stack.schemaStack`
| Field | Value |
|-------|-------|
| Level | F |
| Roles | [R,X] |
| Sources | T2 JSON-LD in nav, Organization, WebSite presence |
| Format | list |
| Gate | always |
| Description | Schema/structured data stack present in navigation |

### `fp.size.urls`
| Field | Value |
|-------|-------|
| Level | F |
| Roles | [H,R,L] |
| Sources | T1 sitemap count + crawl count |
| Format | number |
| Gate | always |
| Description | Estimated total URL count of the site |

### `fp.size.employees`
| Field | Value |
|-------|-------|
| Level | F |
| Roles | [R,X] |
| Sources | T1 LinkedIn scrape free > T3 Crunchbase free > T6 AI |
| Format | number |
| Gate | always |
| Description | Estimated employee count |

### `fp.size.funding`
| Field | Value |
|-------|-------|
| Level | F |
| Roles | [R,X] |
| Sources | T3 Crunchbase > T6 AI |
| Format | money |
| Gate | always |
| Description | Total funding raised (USD) |

### `fp.size.revenue`
| Field | Value |
|-------|-------|
| Level | F |
| Roles | [R,X] |
| Sources | T3 SimilarWeb free > T6 AI |
| Format | money |
| Gate | always |
| Description | Estimated annual revenue (USD) |

### `fp.geo.primary`
| Field | Value |
|-------|-------|
| Level | F |
| Roles | [H,R,L] |
| Sources | T0 GSC country > T1 hreflang > T7 TLD |
| Format | enum |
| Gate | always |
| Description | Primary geographic target (country code) |

### `fp.geo.locales`
| Field | Value |
|-------|-------|
| Level | F |
| Roles | [R,L] |
| Sources | T1 hreflang set |
| Format | list |
| Gate | always |
| Description | All locale targets detected via hreflang |

### `fp.intent.primary`
| Field | Value |
|-------|-------|
| Level | F |
| Roles | [H,R,A] |
| Sources | T6 AI on homepage + top 20 pages |
| Format | enum |
| Gate | always |
| Values | lead-gen, transactional, content-only, hybrid |
| Description | Primary site intent classification |

### `fp.readiness.seo`
| Field | Value |
|-------|-------|
| Level | F |
| Roles | [R] |
| Sources | T7 composite of fp.stack signals + schema presence |
| Format | score |
| Gate | always |
| Description | SEO readiness score (0-100) based on stack and schema signals |

### `fp.readiness.ai`
| Field | Value |
|-------|-------|
| Level | F |
| Roles | [R] |
| Sources | T7 llms.txt + bot rules + schema + freshness |
| Format | score |
| Gate | always |
| Description | AI discoverability readiness score (0-100) |

---

## PF: Page Fundamentals `p.*` (53 metrics)

---

### `p.url`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,X] |
| Sources | T0 crawl |
| Format | url |
| Description | Original URL as discovered |

### `p.finalUrl`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,X,A] |
| Sources | T0 crawl |
| Format | url |
| Description | Final URL after redirects |

### `p.statusCode`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,R,L,V,A,E] |
| Sources | T0 crawl |
| Format | number |
| Description | HTTP response status code |

### `p.contentType`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,X,L] |
| Sources | T0 crawl |
| Format | enum |
| Description | Content-Type header value |

### `p.isHtmlPage`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,L] |
| Sources | T0 crawl |
| Format | boolean |
| Description | Whether the page is an HTML document |

### `p.canonical`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,A] |
| Sources | T0 crawl |
| Format | url |
| Description | Canonical URL from link rel=canonical |

### `p.canonicalIsSelf`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,L,A] |
| Sources | T7 derived |
| Format | boolean |
| Description | Whether canonical points to the same URL |

### `p.canonicalChain`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,A] |
| Sources | T7 derived |
| Format | list |
| Description | Chain of canonical redirects (detects loops) |

### `p.meta.robots`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,A] |
| Sources | T0 crawl |
| Format | text |
| Description | Meta robots directive content |

### `p.xRobots`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,A] |
| Sources | T0 crawl |
| Format | text |
| Description | X-Robots-Tag header value |

### `p.indexable`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,R,L,S,A,E] |
| Sources | T7 derived (robots + canonical + noindex + status) |
| Format | boolean |
| Description | Whether the page is indexable by search engines |

### `p.indexabilityReason`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 derived |
| Format | enum |
| Description | Reason for indexability status (noindex, canonical, robots, 4xx, 5xx, etc.) |

### `p.inSitemap`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,L,A] |
| Sources | T0 sitemap + crawl cross-check |
| Format | boolean |
| Description | Whether URL appears in any sitemap |

### `p.sitemap.priority`
| Field | Value |
|-------|-------|
| Level | P |
    Roles | [I,X] |
| Sources | T0 sitemap |
| Format | number |
| Description | Priority value from sitemap XML |

### `p.sitemap.lastmod`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X,A] |
| Sources | T0 sitemap |
| Format | date |
| Description | Lastmod date from sitemap XML |

### `p.sitemap.changefreq`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T0 sitemap |
| Format | enum |
| Description | Change frequency from sitemap XML |

### `p.depth.crawl`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,R,L,V,A,S] |
| Sources | T7 derived |
| Format | number |
| Description | Click depth from homepage during crawl |

### `p.depth.folder`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,L] |
| Sources | T7 URL parse |
| Format | number |
| Description | URL folder depth (number of path segments) |

### `p.redirect.url`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,A] |
| Sources | T0 crawl |
| Format | url |
| Description | Redirect target URL if redirected |

### `p.redirect.chain`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,A,E] |
| Sources | T0 crawl |
| Format | list |
| Description | Full redirect chain (URLs in order) |

### `p.redirect.loop`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,E] |
| Sources | T7 derived |
| Format | boolean |
| Description | Whether a redirect loop was detected |

### `p.redirect.type`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T0 crawl |
| Format | enum |
| Description | Redirect type (301, 302, meta, javascript) |

### `p.httpVersion`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X,R] |
| Sources | T0 fetch |
| Format | enum |
| Description | HTTP version used (HTTP/1.1, HTTP/2, HTTP/3) |

### `p.responseHeaders`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T0 fetch |
| Format | json |
| Description | Full response headers (stored blob) |

### `p.language.html`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,L] |
| Sources | T0 html lang attr |
| Format | enum |
| Description | Language from HTML lang attribute |

### `p.language.detected`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,L] |
| Sources | T6 AI or T7 cld3/franc |
| Format | enum |
| Description | Language detected from content body |

### `p.language.match`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,E] |
| Sources | T7 compare html vs content |
| Format | boolean |
| Description | Whether HTML lang matches detected content language |

### `p.locale.detected`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,L] |
| Sources | T7 html + content |
| Format | enum |
| Description | Locale detected (e.g. en-US, en-GB) |

### `p.hreflang.set`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 crawl |
| Format | list |
| Description | Set of hreflang annotations for this URL |

### `p.hreflang.errors`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,E] |
| Sources | T7 derived |
| Format | list |
| Description | Hreflang errors (missing self, broken links, mutual mismatch) |

### `p.url.length`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I] |
| Sources | T7 derived |
| Format | number |
| Description | URL character length |

### `p.url.hasQuery`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,L] |
| Sources | T7 parse |
| Format | boolean |
| Description | Whether URL contains query parameters |

### `p.url.hasUppercase`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,L,A] |
| Sources | T7 parse |
| Format | boolean |
| Description | Whether URL path contains uppercase characters |

### `p.url.hasSessionId`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,L,A] |
| Sources | T7 parse |
| Format | boolean |
| Description | Whether URL contains session ID parameters |

### `p.url.hasSpacesEncoded`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,L,A] |
| Sources | T7 parse |
| Format | boolean |
| Description | Whether URL contains %20 encoded spaces |

### `p.url.trailingSlash`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,L] |
| Sources | T7 parse |
| Format | enum |
| Description | Trailing slash state (present, absent, inconsistent) |

### `p.url.depthSlug`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,L] |
| Sources | T7 parse |
| Format | number |
| Description | Number of slug segments in URL |

### `p.url.readableSlug`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T6 AI |
| Format | boolean |
| Description | Whether URL slug is human-readable |

### `p.url.hasDate`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,L] |
| Sources | T7 regex |
| Format | boolean |
| Description | Whether URL contains a date pattern (news pattern) |

### `p.favicon`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I] |
| Sources | T0 head parse |
| Format | url |
| Description | Favicon URL |

### `p.charset`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 head parse |
| Format | enum |
| Description | Character encoding declared |

### `p.viewport.meta`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,L,A] |
| Sources | T0 head parse |
| Format | text |
| Description | Viewport meta tag content |

### `p.viewport.width`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I] |
| Sources | T0 head parse |
| Format | number |
| Description | Viewport width value |

### `p.viewport.userScalable`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 head parse |
| Format | boolean |
| Description | Whether user-scalable is enabled (accessibility) |

### `p.rssFeed`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,L] |
| Sources | T0 head parse |
| Format | url |
| Description | RSS/Atom feed URL if present |

### `p.serviceWorker`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,L] |
| Sources | T7 derived |
| Format | boolean |
| Description | Whether a service worker is registered |

### `p.webManifest`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,L] |
| Sources | T0 head parse |
| Format | url |
| Description | Web app manifest URL if present |

### `p.isSoft404`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,L,A,E] |
| Sources | T7 derived (title + length + noindex heuristic) |
| Format | boolean |
| Description | Whether page is a soft 404 (200 status but thin/error content) |

---

## CT: Content `p.content.*` (116 metrics)

---

### `p.content.title`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,V,A,S] |
| Sources | T0 crawl |
| Format | text |
| Description | Page title (title tag content) |

### `p.content.titleLength`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,A,S] |
| Sources | T7 derived |
| Format | number |
| Description | Title length in characters |

### `p.content.titlePixelWidth`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,A] |
| Sources | T7 derived |
| Format | number |
| Description | Title pixel width at 16px font (truncation estimate) |

### `p.content.metaDesc`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,V,A,S] |
| Sources | T0 crawl |
| Format | text |
| Description | Meta description content |

### `p.content.metaDescLength`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,A] |
| Sources | T7 derived |
| Format | number |
| Description | Meta description length in characters |

### `p.content.metaDescPixel`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,A] |
| Sources | T7 derived |
| Format | number |
| Description | Meta description pixel width at 16px |

### `p.content.h1.text`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,A] |
| Sources | T0 crawl |
| Format | text |
| Description | First H1 tag text content |

### `p.content.h1.count`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,A,E] |
| Sources | T0 crawl |
| Format | number |
| Description | Number of H1 tags on page |

### `p.content.hTree`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 crawl |
| Format | json |
| Description | Full heading outline (h1..h6 hierarchy) |

### `p.content.hOrderValid`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,E] |
| Sources | T7 derived |
| Format | boolean |
| Description | Whether heading hierarchy is properly nested (no skipped levels) |

### `p.content.wordCount`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,R,V,L,S,A] |
| Sources | T0 crawl |
| Format | number |
| Description | Total visible word count |

### `p.content.sentenceCount`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T7 derived |
| Format | number |
| Description | Estimated sentence count |

### `p.content.paragraphCount`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T7 derived |
| Format | number |
| Description | Count of paragraph elements |

### `p.content.readability.flesch`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,S,A] |
| Sources | T7 per-lang model (EN: Flesch-Kincaid; ES: Fernández Huerta; DE: Wiener Sachtextformel; etc.) |
| Format | score |
| Description | Flesch reading ease score (0-100), language-aware formula |

### `p.content.readability.gradeLevel`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,S,A] |
| Sources | T7 derived |
| Format | number |
| Description | US grade level equivalent (Flesch-Kincaid Grade Level) |

### `p.content.readability.model`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T7 config |
| Format | enum |
| Description | Which readability formula was used (lang-aware) |

### `p.content.readability.lang`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T7 lang gated |
| Format | enum |
| Description | Language of the readability model applied |

### `p.content.textRatio`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 derived |
| Format | percent |
| Description | Ratio of visible text to total HTML |

### `p.content.hash`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [X,A] |
| Sources | T7 simhash/minhash |
| Format | text |
| Description | Content hash for near-duplicate detection |

### `p.content.duplicate.exact`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,L,A,E] |
| Sources | T7 derived |
| Format | boolean |
| Description | Whether page has an exact duplicate |

### `p.content.duplicate.cluster`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,L,V,A] |
| Sources | T7 derived |
| Format | text |
| Description | Duplicate cluster ID |

### `p.content.duplicate.nearMatch`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,A] |
| Sources | T7 derived |
| Format | list |
| Description | List of sibling URLs with near-duplicate content |

### `p.content.duplicate.ratio`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,A] |
| Sources | T7 derived |
| Format | percent |
| Description | Percentage of content shared with nearest duplicate |

### `p.content.semanticSimilarity`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,V,A] |
| Sources | T6 AI embeddings |
| Format | score |
| Description | Semantic similarity to siblings in cluster (0-1) |

### `p.content.cannibalization`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,L,A,E] |
| Sources | T7 derived |
| Format | boolean |
| Description | Whether 2+ pages target the same search intent |

### `p.content.cannibal.partners`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 derived |
| Format | list |
| Description | URLs competing for the same keywords |

### `p.content.spellingErrors`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T6 AI (language-aware) |
| Format | number |
| Description | Count of spelling errors detected |

### `p.content.grammarErrors`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T6 AI |
| Format | number |
| Description | Count of grammar errors detected |

### `p.content.hasLoremIpsum`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,E] |
| Sources | T7 regex |
| Format | boolean |
| Description | Whether placeholder lorem ipsum text is present |

### `p.content.visibleDate`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 crawl |
| Format | date |
| Description | Date shown on page (byline, published date) |

### `p.content.lastModified.http`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 crawl (Last-Modified header) |
| Format | date |
| Description | Last-Modified header value |

### `p.content.lastModified.detected`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T6 AI (from byline, schema, git, CMS) |
| Format | date |
| Description | Detected last modification date from multiple signals |

### `p.content.freshness.days`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,R,V,A,S] |
| Sources | T7 derived |
| Format | number |
| Description | Days since last content update |

### `p.content.freshness.class`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,L,V] |
| Sources | T7 derived |
| Format | enum |
| Values | live, recent, fresh, ok, stale, unknown |
| Description | Freshness classification bucket |

### `p.content.contentDecay`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,V,A] |
| Sources | T0 GSC trend model |
| Format | boolean |
| Description | Whether content is experiencing traffic decay |

### `p.content.decay.start`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 inflection detection |
| Format | date |
| Description | Date when traffic decay began |

### `p.content.decay.velocity`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 clicks/wk slope |
| Format | number |
| Description | Rate of traffic decline (clicks per week) |

### `p.content.aiGenerated.prob`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,L,A] |
| Sources | T6 AI classifier |
| Format | percent |
| Description | Probability that content is AI-generated (0-1) |

### `p.content.humanSignals`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,L,A,S] |
| Sources | T7 composite (byline + photo + author bio + commenting + real typos) |
| Format | score |
| Description | Composite score of human-authorship signals |

### `p.content.author`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T0 crawl |
| Format | text |
| Description | Author name from byline or schema |

### `p.content.author.isLinked`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,E] |
| Sources | T7 derived |
| Format | boolean |
| Description | Whether author name links to a profile page |

### `p.content.author.bio.present`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 derived |
| Format | boolean |
| Description | Whether author bio section exists on page |

### `p.content.author.credential`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,S] |
| Sources | T6 AI |
| Format | text |
| Description | Author credentials (important for YMYL pages) |

### `p.content.reviewer`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T6 AI |
| Format | text |
| Description | Medical/finance reviewer name (YMYL pages) |

### `p.content.editorial.policy.link`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 crawl |
| Format | url |
| Description | Link to editorial policy page |

### `p.content.eeat.score`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,R,V,S,A] |
| Sources | T6 AI composite |
| Format | score |
| Description | Overall E-E-A-T composite score (0-100) |

### `p.content.eeat.experience`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,S,A] |
| Sources | T6 AI |
| Format | score |
| Description | Experience dimension of E-E-A-T |

### `p.content.eeat.expertise`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,S,A] |
| Sources | T6 AI |
| Format | score |
| Description | Expertise dimension of E-E-A-T |

### `p.content.eeat.authoritativeness`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,S,A] |
| Sources | T6 AI |
| Format | score |
| Description | Authoritativeness dimension of E-E-A-T |

### `p.content.eeat.trust`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,S,A] |
| Sources | T6 AI |
| Format | score |
| Description | Trust dimension of E-E-A-T |

### `p.content.og.title`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X,A] |
| Sources | T0 crawl |
| Format | text |
| Description | Open Graph title tag |

### `p.content.og.description`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X,A] |
| Sources | T0 crawl |
| Format | text |
| Description | Open Graph description tag |

### `p.content.og.image`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X,A,E] |
| Sources | T0 crawl |
| Format | url |
| Description | Open Graph image URL |

### `p.content.og.imageRatio`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 derived |
| Format | text |
| Description | OG image aspect ratio (e.g. "1.91:1") |

### `p.content.og.imageBytes`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 fetch |
| Format | bytes |
| Description | OG image file size |

### `p.content.og.type`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X,A] |
| Sources | T0 crawl |
| Format | enum |
| Description | og:type value (article, website, product, etc.) |

### `p.content.twitter.card`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X,A] |
| Sources | T0 crawl |
| Format | enum |
| Description | Twitter card type (summary, summary_large_image, etc.) |

### `p.content.twitter.creator`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T0 crawl |
| Format | text |
| Description | Twitter creator handle |

### `p.content.socialLinks`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T0 crawl |
| Format | list |
| Description | Social media links found (fb/x/ig/yt/tt/li/pinterest/threads/bsky) |

### `p.content.schema.types`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,R,V,A] |
| Sources | T0 crawl |
| Format | list |
| Description | JSON-LD schema types present on page |

### `p.content.schema.errors`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,A,E] |
| Sources | T7 validator |
| Format | list |
| Description | Schema validation errors |

### `p.content.schema.warnings`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 validator |
| Format | list |
| Description | Schema validation warnings |

### `p.content.schema.richResultEligible`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,R,A] |
| Sources | T7 Google rich-result validator equivalent |
| Format | boolean |
| Description | Whether page qualifies for Google rich results |

### `p.content.schema.coverage`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,R,S,A] |
| Sources | T7 derived |
| Format | score |
| Description | Percentage of required schema types present for this page type |

### `p.content.schema.missing`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 derived |
| Format | list |
| Description | List of missing expected schema types |

### `p.content.schema.deprecated`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,E] |
| Sources | T7 validator |
| Format | list |
| Description | Deprecated schema types or properties in use |

### `p.content.schema.validator.log`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [X] |
| Sources | T7 validator |
| Format | json |
| Description | Detailed validation error blob |

### `p.content.breadcrumb.present`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 crawl |
| Format | boolean |
| Description | Whether breadcrumb navigation exists |

### `p.content.breadcrumb.valid`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 derived |
| Format | boolean |
| Description | Whether breadcrumb schema matches visible breadcrumbs |

### `p.content.topic.cluster`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,V,L,A] |
| Sources | T6 AI embeddings |
| Format | text |
| Description | Topic cluster assignment (cluster ID/name) |

### `p.content.topic.coverage`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,A] |
| Sources | T7 gap-to-SERP |
| Format | score |
| Description | Topic coverage score vs top SERP results |

### `p.content.topic.depth`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,A] |
| Sources | T6 AI |
| Format | score |
| Description | Depth of topic coverage (0-1) |

### `p.content.entities.list`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T6 AI |
| Format | list |
| Description | Named entities extracted (wikidata-linkable) |

### `p.content.entities.coverage`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,S,A] |
| Sources | T6 AI |
| Format | score |
| Description | Entity coverage vs cluster expected entities |

### `p.content.entities.salience`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T6 AI |
| Format | score |
| Description | Average entity salience score |

### `p.content.intent.search`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,L,V,A] |
| Sources | T6 AI |
| Format | enum |
| Values | informational, navigational, commercial, transactional, local |
| Description | Search intent classification |

### `p.content.intent.funnel`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,L,V,A] |
| Sources | T6 AI |
| Format | enum |
| Values | TOFU, MOFU, BOFU, retention |
| Description | Funnel stage classification |

### `p.content.intent.match`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,A,S] |
| Sources | T6 AI (title+H1+content vs top-10 SERP) |
| Format | score |
| Description | How well page matches search intent for its ranking keywords |

### `p.content.questions.list`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T6 AI |
| Format | list |
| Description | Questions the page answers (PAA-style) |

### `p.content.answerBox.fit`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,R,A,S] |
| Sources | T6 AI |
| Format | score |
| Description | Extractability for featured snippets / answer boxes |

### `p.content.definitionFit`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,S] |
| Sources | T6 AI |
| Format | score |
| Description | Fitness for definition-style featured snippets |

### `p.content.qaStructureFit`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,S] |
| Sources | T6 AI |
| Format | score |
| Description | Fitness for Q&A-style featured snippets |

### `p.content.passageFitness`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,S] |
| Sources | T6 AI |
| Format | score |
| Description | Google passage ranking fitness score |

### `p.content.speakableScore`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,S] |
| Sources | T6 AI |
| Format | score |
| Description | Speakable schema / voice assistant fitness |

### `p.content.listStructurePresent`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 crawl |
| Format | boolean |
| Description | Whether page uses list structures (ol/ul) |

### `p.content.tableStructurePresent`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 crawl |
| Format | boolean |
| Description | Whether page uses table structures |

### `p.content.images.total`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I] |
| Sources | T0 crawl |
| Format | number |
| Description | Total image count on page |

### `p.content.images.missingAlt`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,R,A,E] |
| Sources | T0 crawl |
| Format | number |
| Description | Images missing alt text |

### `p.content.images.longAlt`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 derived |
| Format | number |
| Description | Images with excessively long alt text (>100 chars) |

### `p.content.images.emptyAlt`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 derived |
| Format | number |
| Description | Images with empty alt="" (decorative) |

### `p.content.images.duplicateAlt`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 derived |
| Format | number |
| Description | Images sharing identical alt text |

### `p.content.images.legacyFmt`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,A] |
| Sources | T0 crawl |
| Format | number |
| Description | Images in legacy formats (PNG, JPG, GIF) |

### `p.content.images.modernFmt`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 crawl |
| Format | number |
| Description | Images in modern formats (WebP, AVIF) |

### `p.content.images.noSrcset`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 crawl |
| Format | number |
| Description | Images without srcset (not responsive) |

### `p.content.images.noLazy`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 crawl |
| Format | number |
| Description | Images without lazy loading |

### `p.content.images.noDimensions`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 crawl |
| Format | number |
| Description | Images without width/height attributes |

### `p.content.images.originalSize`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 derived |
| Format | bytes |
| Description | Total image payload size |

### `p.content.images.decorative`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I] |
| Sources | T7 derived |
| Format | number |
| Description | Count of decorative images (alt="" or role="presentation") |

### `p.content.images.hasEXIF`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I] |
| Sources | T7 derived |
| Format | boolean |
| Description | Whether images contain EXIF data |

### `p.content.video.total`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I] |
| Sources | T0 crawl |
| Format | number |
| Description | Total video embeds on page |

### `p.content.video.hasSchema`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 crawl |
| Format | boolean |
| Description | Whether videos have VideoObject schema |

### `p.content.video.transcript`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 derived |
| Format | boolean |
| Description | Whether a transcript is provided for videos |

### `p.content.audio.total`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I] |
| Sources | T0 crawl |
| Format | number |
| Description | Total audio embeds on page |

### `p.content.audio.transcript`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 derived |
| Format | boolean |
| Description | Whether a transcript is provided for audio |

### `p.content.tables.count`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I] |
| Sources | T0 crawl |
| Format | number |
| Description | Count of table elements |

### `p.content.codeBlocks.count`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I] |
| Sources | T0 crawl |
| Format | number |
| Description | Count of code block elements |

### `p.content.faq.present`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 crawl |
| Format | boolean |
| Description | Whether FAQ section exists on page |

### `p.content.faq.schemaMatch`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 derived |
| Format | boolean |
| Description | Whether visible FAQ matches FAQPage schema |

### `p.content.howto.present`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 crawl |
| Format | boolean |
| Description | Whether how-to steps are present |

### `p.content.outline.valid`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 derived |
| Format | boolean |
| Description | Whether content outline is logically structured |

### `p.content.contentType.classified`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,L,A] |
| Sources | T6 AI |
| Format | enum |
| Values | article, product, category, landing, docs, glossary, tool, calculator, guide, video, podcast |
| Description | Content type classification |

### `p.content.regex.prices`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T7 regex |
| Format | list |
| Description | Price patterns found on page |

### `p.content.regex.emails`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T7 regex |
| Format | list |
| Description | Email addresses found on page |

### `p.content.regex.phones`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T7 regex |
| Format | list |
| Description | Phone numbers found on page |

### `p.content.regex.custom`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T7 regex |
| Format | list |
| Description | User-defined regex pattern matches |

### `p.content.pagination.pattern`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 crawl |
| Format | enum |
| Description | Pagination pattern detected (rel=next/prev, load-more, infinite scroll) |

### `p.content.pagination.integrity`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,E] |
| Sources | T7 derived |
| Format | boolean |
| Description | Whether pagination links are valid and non-self-referencing |

### `p.content.relatedContent.count`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I] |
| Sources | T0 crawl |
| Format | number |
| Description | Count of related content links on page |

### `p.content.updateBadge`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 crawl |
| Format | boolean |
| Description | Whether "last updated X" badge is present |

### `p.content.ctaDensity`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,A,S] |
| Sources | T6 AI |
| Format | score |
| Description | Density and prominence of call-to-action elements |

### `p.content.trustSignalScore`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,R,S,A] |
| Sources | T7 composite |
| Format | score |
| Description | Composite trust signal score (testimonials, badges, guarantees, etc.) |

---

## TL: Technical `p.tech.*` (55 metrics)

---

### `p.tech.perf.loadClass`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,R,L,V,S,A,E] |
| Sources | T1 CrUX > T2 PSI > T5 synthetic |
| Format | enum |
| Values | fast, ok, slow, veryslow |
| Description | Overall performance classification bucket |

### `p.tech.perf.raw`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T1/T2/T5 |
| Format | json |
| Description | Raw performance data blob: {loadMs, ttfb, dns, sizeKb, resources…} for inspector |

### `p.tech.cwv.lcp.s`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,S,A] |
| Sources | T1 CrUX > T2 PSI > T5 synthetic |
| Format | duration |
| Description | Largest Contentful Paint (seconds, p75) |

### `p.tech.cwv.inp.ms`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,S,A] |
| Sources | T1 CrUX > T2 PSI > T5 synthetic |
| Format | duration |
| Description | Interaction to Next Paint (milliseconds, p75) |

### `p.tech.cwv.cls`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,S,A] |
| Sources | T1 CrUX > T2 PSI > T5 synthetic |
| Format | number |
| Description | Cumulative Layout Shift (unitless, p75) |

### `p.tech.cwv.bucket`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,R,L,V,S,A,E] |
| Sources | T1/T2/T5 |
| Format | enum |
| Values | good, needs-improvement, poor |
| Description | Combined CWV bucket for grid display |

### `p.tech.cwv.device`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,L,V] |
| Sources | T1 CrUX |
| Format | enum |
| Values | mobile, desktop |
| Description | Device type for CWV measurement |

### `p.tech.cwv.sampleSize`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I] |
| Sources | T1 CrUX |
| Format | number |
| Description | CrUX sample size (triggers low-n tag if small) |

### `p.tech.cwv.deltaMoM`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,A,E,T] |
| Sources | T7 trend |
| Format | number |
| Description | Month-over-month CWV delta |

### `p.tech.renderBlocking`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 crawl |
| Format | number |
| Description | Count of render-blocking resources |

### `p.tech.thirdPartyScripts`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 crawl |
| Format | number |
| Description | Count of third-party scripts loaded |

### `p.tech.thirdPartyDomains`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 crawl |
| Format | number |
| Description | Count of unique third-party domains loaded |

### `p.tech.jsRenderDep`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,R,L,A,S] |
| Sources | T7 render diff |
| Format | percent |
| Description | Percentage of content dependent on JavaScript rendering |

### `p.tech.jsDiff.linksDelta`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,E] |
| Sources | T7 render diff |
| Format | number |
| Description | Difference in link count between static and rendered DOM |

### `p.tech.jsDiff.imagesDelta`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,E] |
| Sources | T7 render diff |
| Format | number |
| Description | Difference in image count between static and rendered DOM |

### `p.tech.jsDiff.schemaDelta`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,E] |
| Sources | T7 render diff |
| Format | number |
| Description | Difference in schema count between static and rendered DOM |

### `p.tech.jsDiff.wordDelta`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,E] |
| Sources | T7 render diff |
| Format | number |
| Description | Difference in word count between static and rendered DOM |

### `p.tech.jsDiff.hydrationMismatch`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,E] |
| Sources | T7 render diff |
| Format | boolean |
| Description | Whether hydration caused content mismatches |

### `p.tech.mobileFriendly`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,L,A,S] |
| Sources | T2 PSI + T7 heuristic |
| Format | boolean |
| Description | Whether page passes mobile-friendly test |

### `p.tech.sec.grade`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,R,S] |
| Sources | T7 composite |
| Format | enum |
| Values | A, B, C, D, E, F |
| Description | Security grade (HSTS + CSP + TLS + headers + mixed content + cookies) |

### `p.tech.sec.hsts`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 crawl |
| Format | boolean |
| Description | Whether HSTS header is present |

### `p.tech.sec.csp`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 crawl |
| Format | boolean |
| Description | Whether Content-Security-Policy header is present |

### `p.tech.sec.mixedContent`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,E] |
| Sources | T0 crawl |
| Format | number |
| Description | Count of mixed content resources (HTTP on HTTPS page) |

### `p.tech.sec.exposedKeys`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,E] |
| Sources | T7 scan |
| Format | number |
| Description | Exposed API keys found (redacted but counted) |

### `p.tech.sec.exposedEmails`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 regex |
| Format | number |
| Description | Email addresses exposed in HTML source |

### `p.tech.sec.cookies`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 crawl |
| Format | json |
| Description | Cookie security analysis: {insecure, sameSite, secure, httpOnly} counts |

### `p.tech.sec.sri.missing`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 crawl |
| Format | number |
| Description | External scripts/styles missing Subresource Integrity |

### `p.tech.sec.sslDays`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,E] |
| Sources | T1 SSL check |
| Format | number |
| Description | Days until SSL certificate expires |

### `p.tech.sec.tlsVersion`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I] |
| Sources | T0 crawl |
| Format | enum |
| Description | TLS version in use (TLS 1.2, TLS 1.3) |

### `p.tech.sec.openRedirect`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,E] |
| Sources | T7 scan |
| Format | boolean |
| Description | Whether open redirect vulnerability exists |

### `p.tech.sec.blacklist`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,E] |
| Sources | T1 Google SafeBrowsing, Spamhaus, abuse.ch |
| Format | boolean |
| Description | Whether domain is on any security blacklist |

### `p.tech.a11y.score`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,R,V,S,A] |
| Sources | T7 axe + WCAG 2.2 AA |
| Format | score |
| Description | Accessibility score (0-100) from axe audit |

### `p.tech.a11y.violations`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 axe |
| Format | number |
| Description | Total axe violation count |

### `p.tech.a11y.contrast`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 axe |
| Format | number |
| Description | Contrast ratio violations count |

### `p.tech.a11y.altMissing`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 axe |
| Format | number |
| Description | Missing alt text violations count |

### `p.tech.a11y.landmarks`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 axe |
| Format | boolean |
| Description | Whether ARIA landmarks are properly used |

### `p.tech.a11y.skipLink`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 axe |
| Format | boolean |
| Description | Whether skip navigation link exists |

### `p.tech.a11y.tapTargets`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 axe |
| Format | number |
| Description | Tap target size violations (mobile) |

### `p.tech.a11y.fontMin`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 axe |
| Format | boolean |
| Description | Whether minimum font size is met (12px) |

### `p.tech.a11y.formLabels`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 axe |
| Format | number |
| Description | Form inputs without associated labels |

### `p.tech.a11y.aria`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 axe |
| Format | number |
| Description | ARIA attribute violations |

### `p.tech.a11y.headingOrder`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 axe |
| Format | boolean |
| Description | Whether heading order is logical |

### `p.tech.a11y.tablesHeaders`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 axe |
| Format | boolean |
| Description | Whether tables have proper header associations |

### `p.tech.a11y.viewportZoom`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 axe |
| Format | boolean |
| Description | Whether viewport allows zoom (accessibility requirement) |

### `p.tech.energy.carbonPerView`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,R,V,S] |
| Sources | T7 greenweb.org + sizeKb formula |
| Format | number |
| Description | Estimated carbon emissions per page view (grams CO2) |

### `p.tech.consent.mode`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,R] |
| Sources | T2 GA4 consent mode detection |
| Format | enum |
| Values | v1, v2, none |
| Description | Google Consent Mode version detected |

### `p.tech.cookieless`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,R] |
| Sources | T7 passage signals |
| Format | boolean |
| Description | Whether site has cookieless tracking signals |

### `p.tech.coreUpdate.flag`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,T,A] |
| Sources | T7 overlay Google update events |
| Format | text |
| Description | Google core update event overlay on trend data |

### `p.tech.logFile.signals`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,A] |
| Sources | T0 log ingestion |
| Format | json |
| Description | Log file analysis signals (if enabled) |

### `p.tech.crawlBudget.spent`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,A] |
| Sources | T0 log file |
| Format | number |
| Description | Googlebot crawl budget spent on this URL |

### `p.tech.crawlBudget.waste`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,A,E] |
| Sources | T7 derived |
| Format | percent |
| Description | Percentage of crawl budget wasted (duplicates, params, 404s) |

### `p.tech.domNodes`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 crawl |
| Format | number |
| Description | Total DOM node count |

---

## LK: Links `p.links.*` + `l.*` (42 metrics)

---

### `p.links.inlinks`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,R,V,S,A] |
| Sources | T0 crawl + T3 backlink APIs |
| Format | number |
| Description | Total internal inlinks to this page |

### `p.links.uniqueInlinks`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,A,S] |
| Sources | T0 crawl |
| Format | number |
| Description | Unique internal pages linking to this page |

### `p.links.outlinks`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I] |
| Sources | T0 crawl |
| Format | number |
| Description | Total outgoing links from this page |

### `p.links.externalOutlinks`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I] |
| Sources | T0 crawl |
| Format | number |
| Description | External outgoing links |

### `p.links.uniqueExternalDomains`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I] |
| Sources | T0 crawl |
| Format | number |
| Description | Unique external domains linked to |

### `p.links.internalPagerank`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,V,S,A] |
| Sources | T7 PageRank computation |
| Format | score |
| Description | Internal PageRank score (computed via link graph) |

### `p.links.linkEquity`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,V,S,A] |
| Sources | T7 derived |
| Format | score |
| Description | Link equity passed to this page |

### `p.links.linkScore`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,S] |
| Sources | T7 composite |
| Format | score |
| Description | Overall link profile quality score |

### `p.links.broken`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,A,E] |
| Sources | T0 crawl |
| Format | number |
| Description | Count of broken (4xx/5xx) outgoing links |

### `p.links.insecure`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,A,E] |
| Sources | T0 crawl |
| Format | number |
| Description | Count of HTTP (insecure) links on HTTPS page |

### `p.links.redirectsIn`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,A] |
| Sources | T0 crawl |
| Format | number |
| Description | Count of internal links that redirect |

### `p.links.orphan`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,L,V,A,E] |
| Sources | T7 derived |
| Format | boolean |
| Description | Whether page has zero internal inlinks (orphan page) |

### `p.links.nearOrphan`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,L,A] |
| Sources | T7 derived |
| Format | boolean |
| Description | Whether page has ≤2 internal inlinks |

### `p.links.clickDepth`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,V,A,S] |
| Sources | T7 derived |
| Format | number |
| Description | Click depth from homepage |

### `p.links.navLinks`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T0 crawl |
| Format | number |
| Description | Links from navigation elements |

### `p.links.footerLinks`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T0 crawl |
| Format | number |
| Description | Links from footer elements |

### `p.links.referringDomains`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,R,V,S,A] |
| Sources | T0 Ahrefs/Semrush > T3 scrape > T4 CommonCrawl |
| Format | number |
| Description | Unique referring domains (backlinks) |

### `p.links.backlinks`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,R,V] |
| Sources | T0/T3/T4 |
| Format | number |
| Description | Total backlinks to this URL |

### `p.links.urlRating`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,R,V,S] |
| Sources | T0/T3 |
| Format | score |
| Description | URL authority rating (0-100) |

### `p.links.anchorTextDiversity`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,S] |
| Sources | T3/T4 |
| Format | score |
| Description | Diversity score of anchor text distribution |

### `p.links.anchorCloud`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Sources | T3/T4 |
| Format | json |
| Description | Anchor text frequency cloud data |

### `p.links.anchorCloudMovement`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,T,A] |
| Sources | T7 trend |
| Format | json |
| Description | Anchor text distribution change over time |

### `p.links.genericAnchorCount`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T3/T4 |
| Format | number |
| Description | Count of generic anchors ("click here", "read more", etc.) |

### `p.links.toxicBacklinkShare`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,A,E,S] |
| Sources | T3/T4 |
| Format | percent |
| Description | Percentage of toxic backlinks |

### `p.links.lostBacklinks7d`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,E] |
| Sources | T3/T4 |
| Format | number |
| Description | Backlinks lost in last 7 days |

### `p.links.newBacklinks7d`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T3/T4 |
| Format | number |
| Description | New backlinks gained in last 7 days |

### `p.links.velocity`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,T] |
| Sources | T3/T4 trend |
| Format | number |
| Description | Link acquisition velocity (links per week) |

### `p.links.brandedAnchor.pct`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T3/T4 |
| Format | percent |
| Description | Percentage of branded anchor text |

### `p.links.exactMatchAnchor.pct`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T3/T4 |
| Format | percent |
| Description | Percentage of exact-match anchor text (spam signal if >30%) |

### `p.links.redirectLoss`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,E] |
| Sources | T7 derived |
| Format | score |
| Description | Link equity lost through redirect chains |

### Link-level `l.*` metrics (per edge)

### `l.source`
| Field | Value |
|-------|-------|
| Level | L |
| Roles | [X,I] |
| Format | url |
| Description | Source URL of the link |

### `l.target`
| Field | Value |
|-------|-------|
| Level | L |
| Roles | [X,I] |
| Format | url |
| Description | Target URL of the link |

### `l.anchor`
| Field | Value |
|-------|-------|
| Level | L |
| Roles | [X,I] |
| Format | text |
| Description | Anchor text content |

### `l.anchorLen`
| Field | Value |
|-------|-------|
| Level | L |
| Roles | [X] |
| Format | number |
| Description | Anchor text character length |

### `l.context.snippet`
| Field | Value |
|-------|-------|
| Level | L |
| Roles | [I,X] |
| Format | text |
| Description | Surrounding text context around the link |

### `l.rel`
| Field | Value |
|-------|-------|
| Level | L |
| Roles | [X,I] |
| Format | text |
| Description | rel attribute value (nofollow, sponsored, ugc, etc.) |

### `l.isFollow`
| Field | Value |
|-------|-------|
| Level | L |
| Roles | [X] |
| Format | boolean |
| Description | Whether link passes PageRank (not nofollow) |

### `l.isNav`
| Field | Value |
|-------|-------|
| Level | L |
| Roles | [X] |
| Format | boolean |
| Description | Whether link is in navigation |

### `l.isFooter`
| Field | Value |
|-------|-------|
| Level | L |
| Roles | [X] |
| Format | boolean |
| Description | Whether link is in footer |

### `l.isContentBody`
| Field | Value |
|-------|-------|
| Level | L |
| Roles | [X] |
| Format | boolean |
| Description | Whether link is in main content body |

### `l.firstSeen`
| Field | Value |
|-------|-------|
| Level | L |
| Roles | [X] |
| Format | date |
| Description | First crawl date this link was discovered |

### `l.lastSeen`
| Field | Value |
|-------|-------|
| Level | L |
| Roles | [X] |
| Format | date |
| Description | Most recent crawl date this link was confirmed |

---

## SR: Search `p.search.*` + `q.*` (60 metrics)

---

### `p.search.gsc.clicks`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,R,V,K,S,A,T] |
| Sources | T0 GSC |
| Format | number |
| Description | Total GSC clicks (28d) |

### `p.search.gsc.impr`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,R,V,K,S,A,T] |
| Sources | T0 GSC |
| Format | number |
| Description | Total GSC impressions (28d) |

### `p.search.gsc.ctr`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,R,V,S,A,T] |
| Sources | T0 GSC |
| Format | percent |
| Description | GSC click-through rate (28d) |

### `p.search.gsc.position`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,R,V,S,A,T] |
| Sources | T0 GSC |
| Format | number |
| Description | Average GSC position (28d) |

### `p.search.gsc.deltaClicks28d`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,V,A,E,T] |
| Sources | T0 GSC |
| Format | number |
| Description | Click delta vs previous 28d period |

### `p.search.gsc.deltaPosition28d`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,V,A,E,T] |
| Sources | T0 GSC |
| Format | number |
| Description | Position delta vs previous 28d period |

### `p.search.gsc.isLosing`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,L,V,A,E] |
| Sources | T7 derived |
| Format | boolean |
| Description | Whether page is losing search traffic |

### `p.search.gsc.isGaining`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,L,V,A] |
| Sources | T7 derived |
| Format | boolean |
| Description | Whether page is gaining search traffic |

### `p.search.gsc.branded.pct`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,S,A] |
| Sources | T0 GSC |
| Format | percent |
| Description | Percentage of clicks from branded queries |

### `p.search.bing.clicks`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,R,V,T] |
| Sources | T0 Bing WMT |
| Format | number |
| Description | Bing clicks (28d) |

### `p.search.bing.impr`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,R,V,T] |
| Sources | T0 Bing WMT |
| Format | number |
| Description | Bing impressions (28d) |

### `p.search.bing.position`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,V,T] |
| Sources | T0 Bing WMT |
| Format | number |
| Description | Average Bing position |

### `p.search.bing.crawlErrors`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,E] |
| Sources | T0 Bing WMT |
| Format | number |
| Description | Bing crawl errors for this URL |

### `p.search.mainKw`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,A] |
| Sources | T0 GSC + T6 AI |
| Format | text |
| Description | Primary keyword driving traffic to this page |

### `p.search.mainKwPos`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,A] |
| Sources | T0 GSC |
| Format | number |
| Description | Rank position for primary keyword |

### `p.search.mainKwVolume`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,A] |
| Sources | T3/T5 |
| Format | number |
| Description | Monthly search volume for primary keyword |

### `p.search.bestKw`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,A] |
| Sources | T0 GSC |
| Format | text |
| Description | Best-performing keyword for this page |

### `p.search.bestKwPos`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,A] |
| Sources | T0 GSC |
| Format | number |
| Description | Rank position for best keyword |

### `p.search.bestKwVolume`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,A] |
| Sources | T3/T5 |
| Format | number |
| Description | Monthly search volume for best keyword |

### `p.search.volumeMethod`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | metadata |
| Format | enum |
| Description | Method used to estimate search volume |

### `p.search.topKeywords`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,R,V] |
| Sources | T0 GSC |
| Format | list |
| Description | Top 10 keywords by clicks for this page |

### `p.search.totalKeywords`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,R,V,S,A] |
| Sources | T0 GSC |
| Format | number |
| Description | Total keywords ranking for this page |

### `p.search.keywordsTop3`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,R,V,S,A] |
| Sources | T0 GSC |
| Format | number |
| Description | Keywords ranking in positions 1-3 |

### `p.search.keywordsTop10`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,R,V,S,A] |
| Sources | T0 GSC |
| Format | number |
| Description | Keywords ranking in positions 1-10 |

### `p.search.keywordsTop20`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,R,V] |
| Sources | T0 GSC |
| Format | number |
| Description | Keywords ranking in positions 11-20 |

### `p.search.keywordsTop100`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Sources | T0 GSC |
| Format | number |
| Description | Keywords ranking in positions 21-100 |

### `p.search.keywordsLost28d`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,A,E,T] |
| Sources | T0 GSC |
| Format | number |
| Description | Keywords lost from top-100 in last 28d |

### `p.search.keywordsNew28d`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,A,T] |
| Sources | T0 GSC |
| Format | number |
| Description | New keywords entering top-100 in last 28d |

### `p.search.serpFeatures`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,V,A] |
| Sources | T5 SERP scrape |
| Format | list |
| Description | SERP features present (FS, PAA, image, video, sitelink, news, local, shopping, knowledge) |

### `p.search.serpFeaturesOwned`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,V,S,A] |
| Sources | T5 SERP scrape |
| Format | list |
| Description | SERP features this page owns |

### `p.search.featuredSnippet.own`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,V,A] |
| Sources | T5 SERP scrape |
| Format | boolean |
| Description | Whether this page owns the featured snippet |

### `p.search.peopleAlsoAsk.owned`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T5 SERP scrape |
| Format | boolean |
| Description | Whether page appears in PAA results |

### `p.search.snippet.cannibalized`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,E] |
| Sources | T5 SERP scrape |
| Format | boolean |
| Description | Whether snippet is being cannibalized by another page |

### `p.search.sitelinks.present`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T5 SERP scrape |
| Format | boolean |
| Description | Whether sitelinks are shown for this page |

### `p.search.knowledgePanel`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,R,S,A] |
| Sources | T5 SERP scrape |
| Format | boolean |
| Description | Whether a knowledge panel exists for this entity/page |

### `p.search.brandSERP`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,R,V,S] |
| Sources | T5 SERP scrape |
| Format | json |
| Description | Brand SERP analysis data |

### `p.search.entityInKG`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,R,S,A] |
| Sources | T5 SERP scrape |
| Format | boolean |
| Description | Whether entity appears in Google Knowledge Graph |

### `p.search.discover.impressions`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,T] |
| Sources | T0 GSC Discover |
| Format | number |
| Description | Google Discover impressions |

### `p.search.news.impressions`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,T] |
| Sources | T0 GSC News |
| Format | number |
| Description | Google News impressions |

### `p.search.trendFit`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,A] |
| Sources | T3 Google Trends |
| Format | score |
| Description | How well page aligns with rising trends |

### `p.search.coreUpdate.impact`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,A,T] |
| Sources | T7 derived at update event |
| Format | number |
| Description | Impact score from Google core update |

### `p.search.internalSearch.terms`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,X] |
| Sources | T0 site-search ingestion |
| Format | list |
| Description | Internal search terms leading to this page |

### Keyword-level `q.*` metrics

### `q.kw`
| Field | Value |
|-------|-------|
| Level | Q |
| Roles | [G,I,V,X] |
| Format | text |
| Description | Keyword phrase |

### `q.intent`
| Field | Value |
|-------|-------|
| Level | Q |
| Roles | [G,L,A] |
| Format | enum |
| Description | Keyword search intent |

### `q.funnel`
| Field | Value |
|-------|-------|
| Level | Q |
| Roles | [G,L,A] |
| Format | enum |
| Description | Funnel stage for this keyword |

### `q.volume`
| Field | Value |
|-------|-------|
| Level | Q |
| Roles | [G,V] |
| Format | number |
| Description | Monthly search volume |

### `q.difficulty`
| Field | Value |
|-------|-------|
| Level | Q |
| Roles | [G,V] |
| Format | score |
| Description | Keyword difficulty (0-100) |

### `q.ourRank`
| Field | Value |
|-------|-------|
| Level | Q |
| Roles | [G,V,T] |
| Format | number |
| Description | Our current ranking position |

### `q.bestRankUrl`
| Field | Value |
|-------|-------|
| Level | Q |
| Roles | [G,I,A,E] |
| Format | url |
| Description | URL ranking best for this keyword (cannibalization detection) |

### `q.serpFeatures`
| Field | Value |
|-------|-------|
| Level | Q |
| Roles | [I] |
| Format | list |
| Description | SERP features for this keyword |

### `q.localized`
| Field | Value |
|-------|-------|
| Level | Q |
| Roles | [L] |
| Format | text |
| Description | Country/language for localized ranking |

### `q.seasonality`
| Field | Value |
|-------|-------|
| Level | Q |
| Roles | [I,V] |
| Format | json |
| Description | Seasonal trend pattern (time-series) |

### `q.trendSlope`
| Field | Value |
|-------|-------|
| Level | Q |
| Roles | [I,V,A] |
| Format | number |
| Description | Trend slope (rising/flat/declining) |

### `q.clusterId`
| Field | Value |
|-------|-------|
| Level | Q |
| Roles | [L,V] |
| Format | text |
| Description | Topic cluster assignment |

### `q.opportunityScore`
| Field | Value |
|-------|-------|
| Level | Q |
| Roles | [G,V,A] |
| Sources | T7 formula |
| Format | score |
| Description | Opportunity score = (vol × (1-rank/20)) × kdBonus |

---

## GA: Analytics / Conversion `p.ga.*` + `p.conv.*` (50 metrics)

---

### `p.ga.sessions`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,R,V,K,S,A,T] |
| Sources | T0 GA4 > T1 Plausible/Fathom/Umami/Matomo > T6 AI est |
| Format | number |
| Description | Total sessions (28d) |

### `p.ga.users`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,V] |
| Sources | T0 GA4 |
| Format | number |
| Description | Unique users (28d) |

### `p.ga.views`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,V] |
| Sources | T0 GA4 |
| Format | number |
| Description | Page views (28d) |

### `p.ga.engagementRate`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,V,A,S] |
| Sources | T0 GA4 |
| Format | percent |
| Description | GA4 engagement rate |

### `p.ga.engagementTime`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,V,A] |
| Sources | T0 GA4 |
| Format | duration |
| Description | Average engagement time |

### `p.ga.bounce`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,V,A] |
| Sources | T0 GA4 |
| Format | percent |
| Description | Bounce rate (non-engaged sessions / total) |

### `p.ga.scroll.p50`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,A] |
| Sources | T0 GA4 |
| Format | percent |
| Description | Median scroll depth |

### `p.ga.scroll.p90`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,A] |
| Sources | T0 GA4 |
| Format | percent |
| Description | 90th percentile scroll depth |

### `p.ga.conversions`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,R,V,K,S,A,T] |
| Sources | T0 GA4 |
| Format | number |
| Description | Total conversion events (28d) |

### `p.ga.conversionRate`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,R,V,K,S,A,T] |
| Sources | T0 GA4 |
| Format | percent |
| Description | Conversion rate (conversions / sessions) |

### `p.ga.revenue`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,R,V,K,S,A,T] |
| Sources | T0 GA4 |
| Format | money |
| Description | Total revenue (28d) |

### `p.ga.transactions`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,V] |
| Sources | T0 GA4 |
| Format | number |
| Description | E-commerce transactions |

### `p.ga.addToCart`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,V,A] |
| Sources | T0 GA4 |
| Format | number |
| Description | Add-to-cart events (ecom gated) |

### `p.ga.checkouts`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,V,A] |
| Sources | T0 GA4 |
| Format | number |
| Description | Checkout initiation events |

### `p.ga.goalCompletions`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Sources | T0 GA4 |
| Format | number |
| Description | Goal completions |

### `p.ga.sessionsDelta`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,V,A,E,T] |
| Sources | T0 GA4 |
| Format | number |
| Description | Session delta vs previous 28d |

### `p.ga.sessionsDeltaPct`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,V,A,E,T] |
| Sources | T0 GA4 |
| Format | percent |
| Description | Session percentage change vs previous 28d |

### `p.ga.channel.organic`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Sources | T0 GA4 |
| Format | number |
| Description | Organic search sessions |

### `p.ga.channel.direct`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Sources | T0 GA4 |
| Format | number |
| Description | Direct sessions |

### `p.ga.channel.social`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Sources | T0 GA4 |
| Format | number |
| Description | Social sessions |

### `p.ga.channel.paid`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Sources | T0 GA4 |
| Format | number |
| Description | Paid search sessions |

### `p.ga.channel.email`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Sources | T0 GA4 |
| Format | number |
| Description | Email sessions |

### `p.ga.channel.referral`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Sources | T0 GA4 |
| Format | number |
| Description | Referral sessions |

### `p.ga.newVsReturn`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Sources | T0 GA4 |
| Format | json |
| Description | New vs returning user breakdown |

### `p.ga.revenuePerView`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,R,V,K,S,A] |
| Sources | T0 GA4 |
| Format | money |
| Description | Revenue per page view |

### `p.ga.revenuePerSession`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,V,K] |
| Sources | T0 GA4 |
| Format | money |
| Description | Revenue per session |

### `p.ga.isRevenueLosing`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,L,A,E] |
| Sources | T7 derived |
| Format | boolean |
| Description | Whether revenue is declining |

### Conversion `p.conv.*` metrics

### `p.conv.cvr`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,V,K,S,A] |
| Sources | T0 GA4 |
| Format | percent |
| Description | Conversion rate for this page's goal |

### `p.conv.funnel.steps`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,A] |
| Sources | T0 GA4 |
| Format | number |
| Description | Number of funnel steps on this page |

### `p.conv.funnel.dropMax`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,A,E] |
| Sources | T0 GA4 |
| Format | percent |
| Description | Maximum funnel drop-off percentage |

### `p.conv.form.fieldMetrics`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,A] |
| Sources | T2 behavior tools |
| Format | json |
| Description | Field-by-field form interaction metrics |

### `p.conv.form.abandon`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,A,E] |
| Sources | T2 behavior tools |
| Format | percent |
| Description | Form abandonment rate |

### `p.conv.form.errorRate`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,A,E] |
| Sources | T2 behavior tools |
| Format | percent |
| Description | Form validation error rate |

### `p.conv.experiments.active`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Sources | T2 experiment platform |
| Format | number |
| Description | Number of active A/B tests on this page |

### `p.conv.experiments.lift`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,A,T] |
| Sources | T2 experiment platform |
| Format | percent |
| Description | Conversion lift from winning experiment variant |

### `p.conv.rageClicks`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,L,V,A,E] |
| Sources | T2 behavior tools |
| Format | number |
| Description | Rage click count (frustration signal) |

### `p.conv.deadClicks`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,L,A] |
| Sources | T2 behavior tools |
| Format | number |
| Description | Dead click count (clicks on non-interactive elements) |

### `p.conv.errorClicks`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T2 behavior tools |
| Format | number |
| Description | Error click count |

### `p.conv.uTurns`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T2 behavior tools |
| Format | number |
| Description | U-turn navigation count (user reversal) |

### `p.conv.scrollDead`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T2 behavior tools |
| Format | number |
| Description | Dead scroll areas (no interaction zones) |

### `p.conv.messageMatch.toAd`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,A] |
| Sources | T6 AI |
| Format | score |
| Description | Ad-to-landing-page message match score (paid LPs) |

### `p.conv.messageMatch.toSerp`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,A] |
| Sources | T6 AI |
| Format | score |
| Description | SERP snippet-to-page message match score |

### `p.conv.conversionPaths`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Sources | T0 GA4 |
| Format | json |
| Description | Top conversion paths through this page |

### `p.conv.replaySampleCount`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I] |
| Sources | T2 behavior tools |
| Format | number |
| Description | Number of session replays available |

### `p.conv.heatmap.present`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I] |
| Sources | T2 behavior tools |
| Format | boolean |
| Description | Whether heatmap data exists for this page |

---

## AI: AI Discoverability `p.ai.*` (22 metrics)

---

### `p.ai.botsAllowed`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,R,L,A,E] |
| Sources | T0 robots.txt + T7 parse |
| Format | boolean |
| Description | Whether valuable AI bots (GPTBot, ClaudeBot, PerplexityBot, etc.) are allowed |

### `p.ai.botsBlocked`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 robots.txt |
| Format | list |
| Description | List of AI bots explicitly blocked |

### `p.ai.llmsTxt`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,R,A] |
| Sources | T0 fetch |
| Format | boolean |
| Description | Whether llms.txt file exists and is accessible |

### `p.ai.llmsFullTxt`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 fetch |
| Format | boolean |
| Description | Whether llms-full.txt file exists |

### `p.ai.extractability`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,R,S,A] |
| Sources | T6 AI + T7 content analysis |
| Format | score |
| Description | Structured content density for AI extraction |

### `p.ai.answerBoxFit`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,R,S,A] |
| Sources | T6 AI |
| Format | score |
| Description | Fitness for AI answer box extraction |

### `p.ai.definitionFit`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,S,A] |
| Sources | T6 AI |
| Format | score |
| Description | Fitness for definition-style AI answers |

### `p.ai.qaStructureFit`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,S,A] |
| Sources | T6 AI |
| Format | score |
| Description | Fitness for Q&A-style AI answers |

### `p.ai.passageFitness`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,S,A] |
| Sources | T6 AI |
| Format | score |
| Description | Passage-level extractability for AI engines |

### `p.ai.speakable`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,S,A] |
| Sources | T7 schema |
| Format | boolean |
| Description | Whether speakable schema is present for voice AI |

### `p.ai.entityCoverage`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,R,S,A] |
| Sources | T6 AI |
| Format | score |
| Description | Entity coverage score for AI comprehension |

### `p.ai.entityLinking`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T6 AI |
| Format | percent |
| Description | Wikidata resolution rate of extracted entities |

### `p.ai.schemaForAI`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,S,A] |
| Sources | T7 schema |
| Format | boolean |
| Description | Whether answer-ready schema types are present |

### `p.ai.citation.openai`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,V,T,A] |
| Sources | T5 prompt harness |
| Format | boolean |
| Description | Whether page is cited by OpenAI/ChatGPT |

### `p.ai.citation.anthropic`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,V,T,A] |
| Sources | T5 prompt harness |
| Format | boolean |
| Description | Whether page is cited by Anthropic/Claude |

### `p.ai.citation.gemini`
| Field | Value |
|-------|-------|
| Level | P |
    Roles | [G,I,V,T,A] |
| Sources | T5 prompt harness |
| Format | boolean |
| Description | Whether page is cited by Google Gemini |

### `p.ai.citation.perplexity`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,V,T,A] |
| Sources | T5 prompt harness |
| Format | boolean |
| Description | Whether page is cited by Perplexity |

### `p.ai.citation.bing`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,T,A] |
| Sources | T5 prompt harness |
| Format | boolean |
| Description | Whether page is cited by Bing Copilot |

### `p.ai.citation.you`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,T] |
| Sources | T5 prompt harness |
| Format | boolean |
| Description | Whether page is cited by You.com |

### `p.ai.citation.meta-ai`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,T] |
| Sources | T5 prompt harness |
| Format | boolean |
| Description | Whether page is cited by Meta AI |

### `p.ai.citation.duckAssist`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,T] |
| Sources | T5 prompt harness |
| Format | boolean |
| Description | Whether page is cited by DuckDuckGo AI Assist |

### `p.ai.citation.rate`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,R,V,K,S,A] |
| Sources | T5 avg across engines |
| Format | percent |
| Description | Average citation rate across all AI engines |

### `p.ai.sourceDiversity`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,A] |
| Sources | T5 |
| Format | score |
| Description | How often we appear alongside our topic cluster |

### `p.ai.overviewPresence`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,A] |
| Sources | T5 SERP scrape |
| Format | boolean |
| Description | Whether page appears in AI Overview |

### `p.ai.aiOverview.ourPosition`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,A] |
| Sources | T5 SERP scrape |
| Format | number |
| Description | Position within AI Overview expansion |

---

## SO: Social `p.social.*` + `s.social.*` (35 metrics)

---

### `p.social.shares.fb`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,A] |
| Sources | T3 free counter APIs (Sharedcount), T5 scrape |
| Format | number |
| Description | Facebook share count |

### `p.social.shares.linkedin`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,A] |
| Sources | T3/T5 |
| Format | number |
| Description | LinkedIn share count |

### `p.social.shares.x`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,A] |
| Sources | T3/T5 |
| Format | number |
| Description | X/Twitter share count |

### `p.social.shares.pinterest`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,A] |
| Sources | T3/T5 |
| Format | number |
| Description | Pinterest pin count |

### `p.social.shares.reddit`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,A] |
| Sources | T3/T5 |
| Format | number |
| Description | Reddit share count |

### `p.social.shares.total`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,V,S] |
| Sources | T3/T5 |
| Format | number |
| Description | Total social shares across all platforms |

### `p.social.og.previewOk`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,A,E] |
| Sources | T7 validator |
| Format | boolean |
| Description | Whether OG tags render correctly on all 6 platforms |

### `p.social.og.missingTags`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,A,E] |
| Sources | T7 validator |
| Format | list |
| Description | Missing OG tags |

### `p.social.embeds.x`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I] |
| Sources | T0 crawl |
| Format | number |
| Description | X/Twitter embeds on page |

### `p.social.embeds.instagram`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I] |
| Sources | T0 crawl |
| Format | number |
| Description | Instagram embeds on page |

### `p.social.embeds.youtube`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I] |
| Sources | T0 crawl |
| Format | number |
| Description | YouTube embeds on page |

### `p.social.embeds.tiktok`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I] |
| Sources | T0 crawl |
| Format | number |
| Description | TikTok embeds on page |

### `p.social.sourceLinks`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I] |
| Sources | T3 social search |
| Format | list |
| Description | Social media posts linking to this page |

### Site-level social metrics

### `s.social.profiles`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,V] |
| Format | list |
| Description | Social profiles detected (9 platforms + Threads, Bluesky) |

### `s.social.followers.{plat}`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,V,T,K] |
| Sources | T0 platform API > T3 free-scrape |
| Format | number |
| Description | Follower count per platform |

### `s.social.growth.{plat}`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,V,T] |
| Sources | T0/T3 trend |
| Format | number |
| Description | Follower growth rate per platform |

### `s.social.postingCadence.{plat}`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,V] |
| Sources | T0/T3 |
| Format | number |
| Description | Posts per week per platform |

### `s.social.engagementRate.{plat}`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,V,S] |
| Sources | T0/T3 |
| Format | percent |
| Description | Engagement rate per platform |

### `s.social.bestTime.{plat}`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,V] |
| Sources | T0/T3 |
| Format | text |
| Description | Best posting time per platform |

### `s.social.bestType.{plat}`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,V] |
| Sources | T0/T3 |
| Format | enum |
| Description | Best content type per platform |

### `s.social.mentions.volume`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,V,T,K] |
| Sources | T0 Brandwatch > T3 free social search > T5 scrape |
| Format | number |
| Description | Brand mention volume (28d) |

### `s.social.mentions.sentiment`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,V,T,K,E] |
| Sources | T6 AI sentiment |
| Format | score |
| Description | Sentiment score (-1 to 1) |

### `s.social.mentions.sov`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,V,T,K] |
| Sources | T7 derived |
| Format | percent |
| Description | Share of voice vs competitors |

### `s.social.mentions.unlinked`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,V,A] |
| Sources | T3/T5 |
| Format | number |
| Description | Brand mentions without a link (link opportunity) |

### `s.social.crisis.signal`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,E] |
| Sources | T6 velocity + sentiment |
| Format | boolean |
| Description | Crisis detection signal (spike + negative sentiment) |

### Brand-level metrics

### `s.brand.podcastMentions`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,V,E] |
| Sources | T3 Listen Notes free > T5 transcripts |
| Format | number |
| Description | Podcast mention count |

### `s.brand.youtubeTranscriptMentions`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,V,E] |
| Sources | T1 YT data API free > T5 transcripts |
| Format | number |
| Description | YouTube transcript mention count |

### `s.brand.newsCoverage`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,V] |
| Sources | T3 GDELT > T6 AI scan |
| Format | number |
| Description | News coverage mention count (28d) |

### `s.brand.reviewAvg`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,V,K] |
| Sources | T3 Trustpilot/G2/Capterra/Google |
| Format | score |
| Description | Average review score across platforms |

### `s.brand.reviewVelocity`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,V] |
| Sources | T3 |
| Format | number |
| Description | Review velocity (reviews per week) |

### `s.brand.influencers`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [R,V] |
| Format | list |
| Description | Influencers mentioning the brand |

---

## PA: Paid `p.paid.*` + `s.paid.*` (27 metrics)

Gate: mode=Paid OR fp.stack.adPlatforms non-empty

---

### `s.paid.spend30d.{net}`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,V,K,T] |
| Sources | T0 Ads API |
| Format | money |
| Description | Ad spend by network (28d) |

### `s.paid.conv30d.{net}`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,V,K,T] |
| Sources | T0 Ads API |
| Format | number |
| Description | Conversions from paid (28d) |

### `s.paid.roas.{net}`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,V,K,T] |
| Sources | T0 Ads API |
| Format | score |
| Description | Return on ad spend by network |

### `s.paid.qsAvg.{net}`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,V,S] |
| Sources | T0 Ads API |
| Format | number |
| Description | Average Quality Score by network |

### `s.paid.imprShare.{net}`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,V,T,A] |
| Sources | T0 Ads API |
| Format | percent |
| Description | Impression share by network |

### `s.paid.imprShareLost.*`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,V,A,E] |
| Sources | T0 Ads API |
| Format | json |
| Description | Impression share lost (budget vs rank) |

### `s.paid.auction.overlap.{comp}`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,V,T,A] |
| Sources | T0 Ads API |
| Format | percent |
| Description | Auction overlap with competitor |

### `s.paid.campaignCount`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R] |
| Sources | T0 Ads API |
| Format | number |
| Description | Total campaign count |

### `s.paid.kwCount`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R] |
| Sources | T0 Ads API |
| Format | number |
| Description | Total paid keywords |

### `s.paid.adCount`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R] |
| Sources | T0 Ads API |
| Format | number |
| Description | Total ad count |

### `p.paid.isLandingPage`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,L,A] |
| Sources | T0 crawl refs paid URL list |
| Format | boolean |
| Description | Whether page is used as a paid landing page |

### `p.paid.campaignsUsing`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,V] |
| Sources | T0 Ads API |
| Format | list |
| Description | Campaigns targeting this page |

### `p.paid.paidSessions`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,V] |
| Sources | T0 GA4 source=paid |
| Format | number |
| Description | Sessions from paid channels |

### `p.paid.paidBounce`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,V,A] |
| Sources | T0 GA4 |
| Format | percent |
| Description | Bounce rate for paid traffic |

### `p.paid.paidCvr`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,V] |
| Sources | T0 GA4 |
| Format | percent |
| Description | Conversion rate for paid traffic |

### `p.paid.qsLpComponent`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,V,A,S] |
| Sources | T7 derived |
| Format | score |
| Description | Landing page experience Quality Score component |

### `p.paid.adIntentMatch`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,V,A,S] |
| Sources | T6 AI |
| Format | score |
| Description | Ad copy to landing page intent match score |

### `p.paid.cwvPaidUa`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,A] |
| Sources | T1 CrUX paid-user-agent |
| Format | json |
| Description | CWV isolated for paid traffic user agent |

### `s.paid.est.adBudget`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,V] |
| Sources | T3 SpyFu free > T3 Semrush free > T5 scrape > T6 AI |
| Format | money |
| Description | Estimated monthly ad budget |

### `s.paid.est.ppcClicks`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,V] |
| Sources | T3/T5/T6 |
| Format | number |
| Description | Estimated PPC click volume |

### `s.paid.est.ppcKeywords`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,V] |
| Sources | T3/T5/T6 |
| Format | number |
| Description | Estimated PPC keyword count |

### `s.paid.displayAdsCount`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,V] |
| Sources | T5 Ad library scrape |
| Format | number |
| Description | Display ad count in ad libraries |

### `s.paid.adPlatformsDetected`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,V] |
| Sources | fp.stack.adPlatforms |
| Format | list |
| Description | Ad platforms detected via fingerprint |

### `s.paid.conversionTracking`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,A] |
| Sources | T2 crawl |
| Format | boolean |
| Description | Whether conversion tracking is properly installed |

### `s.paid.remarketingTags`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,A] |
| Sources | T2 crawl |
| Format | boolean |
| Description | Whether remarketing tags are present |

---

## CM: Commerce `p.commerce.*` + `s.commerce.*` (43 metrics)

Gate: fp.industry = ecommerce OR fp.stack.ecom present

---

### `p.commerce.isProduct`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,L,A] |
| Sources | T0 schema + URL + DOM |
| Format | boolean |
| Description | Whether page is a product page |

### `p.commerce.isCategory`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,L] |
| Sources | T0 crawl |
| Format | boolean |
| Description | Whether page is a category/collection page |

### `p.commerce.sku`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T0 schema |
| Format | text |
| Description | Product SKU |

### `p.commerce.price`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,V,A] |
| Sources | T0 schema + DOM |
| Format | money |
| Description | Product price |

### `p.commerce.priceSchema`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 schema |
| Format | boolean |
| Description | Whether price is in Product schema |

### `p.commerce.currency`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T0 schema |
| Format | enum |
| Description | Currency code (USD, EUR, etc.) |

### `p.commerce.priceHistory`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,T,B] |
| Sources | T3/T5 price monitoring |
| Format | json |
| Description | Historical price data (time-series) |

### `p.commerce.compareAtPrice`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 DOM |
| Format | money |
| Description | Original/compare-at price (strikethrough) |

### `p.commerce.discountPct`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,V] |
| Sources | T7 derived |
| Format | percent |
| Description | Discount percentage |

### `p.commerce.availability`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,L,V,A,E] |
| Sources | T0 schema + DOM |
| Format | enum |
| Values | in_stock, oos, backorder, preorder |
| Description | Product availability status |

### `p.commerce.oosDuration`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,E] |
| Sources | T7 trend |
| Format | duration |
| Description | How long product has been out of stock |

### `p.commerce.variantCount`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Sources | T0 schema + DOM |
| Format | number |
| Description | Number of product variants |

### `p.commerce.reviews.count`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,V,S,A] |
| Sources | T0 schema |
| Format | number |
| Description | Review count |

### `p.commerce.reviews.avg`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,V,K,S] |
| Sources | T0 schema |
| Format | score |
| Description | Average review rating |

### `p.commerce.reviews.schemaOk`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 validator |
| Format | boolean |
| Description | Whether review schema is valid |

### `p.commerce.faq.present`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 crawl |
| Format | boolean |
| Description | Whether product FAQ exists |

### `p.commerce.sizeGuide.present`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 crawl |
| Format | boolean |
| Description | Whether size guide is present |

### `p.commerce.shippingInfo`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 schema + content |
| Format | boolean |
| Description | Whether shipping information is present |

### `p.commerce.returnsInfo`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 schema + content |
| Format | boolean |
| Description | Whether returns information is present |

### `p.commerce.productVideo`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 crawl |
| Format | boolean |
| Description | Whether product video exists |

### `p.commerce.imagesPerProduct`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 crawl |
| Format | number |
| Description | Number of product images |

### `p.commerce.altImageCoverage`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 derived |
| Format | percent |
| Description | Alt text coverage on product images |

### `p.commerce.breadcrumbValid`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 derived |
| Format | boolean |
| Description | Whether breadcrumb matches category hierarchy |

### `p.commerce.inCategory`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [L,X] |
| Sources | T0 crawl |
| Format | text |
| Description | Category/collection this product belongs to |

### `p.commerce.crossSell.present`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I] |
| Sources | T0 crawl |
| Format | boolean |
| Description | Whether cross-sell recommendations exist |

### `p.commerce.upsell.present`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I] |
| Sources | T0 crawl |
| Format | boolean |
| Description | Whether upsell recommendations exist |

### `p.commerce.addToCartRate`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,V] |
| Sources | T0 GA4 |
| Format | percent |
| Description | Add-to-cart rate |

### `p.commerce.checkoutRate`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,V] |
| Sources | T0 GA4 |
| Format | percent |
| Description | Checkout initiation rate |

### `p.commerce.abandonRate`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,V,A,E] |
| Sources | T0 GA4 |
| Format | percent |
| Description | Cart abandonment rate |

### `p.commerce.search.on-site.rank`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Sources | T0 site search |
| Format | number |
| Description | On-site search ranking for this product |

### `p.commerce.feed.present`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,R,A] |
| Sources | T0 feed check |
| Format | boolean |
| Description | Whether product appears in merchant feed |

### `p.commerce.feed.errors`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,E] |
| Sources | T0 feed check |
| Format | list |
| Description | Feed validation errors for this product |

### `p.commerce.feed.attrs.missing`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,E] |
| Sources | T0 feed check |
| Format | list |
| Description | Required feed attributes missing |

### `p.commerce.feed.price.mismatch`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,E] |
| Sources | T7 derived |
| Format | boolean |
| Description | Whether feed price mismatches page price |

### `p.commerce.shopping.ranks`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,T] |
| Sources | T5 Google Shopping scrape |
| Format | json |
| Description | Google Shopping ranking positions |

### Site-level commerce

### `s.commerce.catalogSize`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | number |
| Description | Total product count |

### `s.commerce.categoryDepth.avg`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,V] |
| Format | number |
| Description | Average category nesting depth |

### `s.commerce.productsNoLinks`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,A,E] |
| Format | number |
| Description | Products with zero internal links |

### `s.commerce.oos.pct`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,V,A,E] |
| Format | percent |
| Description | Percentage of products out of stock |

### `s.commerce.reviews.vol`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,V,K] |
| Format | number |
| Description | Total review volume across all products |

### `s.commerce.priceComparison`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,V] |
| Sources | T5 Google Shopping scrape |
| Format | json |
| Description | Price comparison vs competitors |

### `s.commerce.competitors.price`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [V,B] |
| Format | json |
| Description | Competitor price monitoring data |

---

## LO: Local `p.local.*` + `s.local.*` + `e.local.*` (49 metrics)

Gate: fp.industry ∈ {local, restaurant, healthcare, finance-branch, real_estate} OR multi-location detected

---

### `s.local.locations.count`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | number |
| Description | Total location count |

### `s.local.locations.list`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [R,V] |
| Format | list |
| Description | List of all locations |

### Entity-level local metrics

### `e.local.nap.score`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [V,A] |
| Format | score |
| Description | NAP consistency score across citations |

### `e.local.gbp.linked`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [V,A] |
| Format | boolean |
| Description | Whether GBP listing is linked to website |

### `e.local.gbp.verified`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [V,A] |
| Format | boolean |
| Description | Whether GBP listing is verified |

### `e.local.gbp.completeness`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [V,S,A] |
| Format | score |
| Description | GBP profile completeness score |

### `e.local.gbp.hours`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [V] |
| Format | json |
| Description | Business hours configuration |

### `e.local.gbp.categories`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [V] |
| Format | list |
| Description | GBP primary and secondary categories |

### `e.local.gbp.images.count`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [V] |
| Format | number |
| Description | Number of GBP images |

### `e.local.gbp.posts.cadence`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [V] |
| Format | number |
| Description | GBP posts per week |

### `e.local.reviews.count.google`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [V,K] |
| Format | number |
| Description | Google review count |

### `e.local.reviews.avg.google`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [V,K,S] |
| Format | score |
| Description | Google review average rating |

### `e.local.reviews.velocity`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [V] |
| Format | number |
| Description | Review velocity (reviews per week) |

### `e.local.reviews.recency`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [V,A] |
| Format | duration |
| Description | Days since last review |

### `e.local.reviews.quality`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [V,A] |
| Sources | T6 AI |
| Format | score |
| Description | AI-analyzed review quality score |

### `e.local.reviews.negative`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [V,A,E] |
| Format | number |
| Description | Negative review count (1-2 stars) |

### `e.local.reviews.responseRate`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [V,A] |
| Format | percent |
| Description | Owner response rate to reviews |

### `e.local.reviews.trustpilot`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [V] |
| Format | score |
| Description | Trustpilot rating |

### `e.local.reviews.yelp`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [V] |
| Format | score |
| Description | Yelp rating |

### `e.local.reviews.tripadvisor`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [V] |
| Format | score |
| Description | TripAdvisor rating |

### `e.local.reviews.industry`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [V] |
| Format | json |
| Description | Industry-specific review platform ratings (opentable, zocdoc, avvo, etc.) |

### `e.local.rankGeogrid`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [V,T] |
| Sources | T5 geogrid scrape |
| Format | json |
| Description | Local pack ranking across geographic grid |

### `e.local.citations.count`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [V,A] |
| Format | number |
| Description | Total citation count across directories |

### `e.local.citations.quality`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [V,A] |
| Format | score |
| Description | Citation quality score (authority of directories) |

### `e.local.citations.missing`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [V,A] |
| Format | list |
| Description | Missing citation sources |

### `e.local.duplicates`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [V,A,E] |
| Format | number |
| Description | Duplicate GBP listings detected |

### `e.local.serviceArea.pages`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [V,A] |
| Format | number |
| Description | Service area landing pages present |

### `e.local.serviceArea.coverage`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [V,A] |
| Format | score |
| Description | Service area geographic coverage score |

### Page-level local metrics

### `p.local.embeddedMap`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Format | boolean |
| Description | Whether Google Maps embed is present |

### `p.local.napOnPage`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Format | boolean |
| Description | Whether NAP info is visible on page |

### `p.local.hoursOnPage`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Format | boolean |
| Description | Whether business hours are visible on page |

### `p.local.localBusinessSchema`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Format | boolean |
| Description | Whether LocalBusiness schema is present |

### `p.local.isLocationPage`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,L] |
| Format | boolean |
| Description | Whether page is a location-specific landing page |

---

## UX: UX `p.ux.*` + `s.ux.*` (21 metrics)

---

### `s.ux.cvrSite`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | percent |
| Description | Site-wide conversion rate |

### `s.ux.engagementAvg`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | score |
| Description | Average engagement score |

### `s.ux.ragePerK`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K,E] |
| Format | number |
| Description | Rage clicks per 1,000 sessions |

### `s.ux.testsRunning`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | number |
| Description | Currently running A/B tests |

### `s.ux.testWins90d`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,V] |
| Format | number |
| Description | Winning test variants in last 90 days |

### `s.ux.cumulativeLift90d`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,V] |
| Format | percent |
| Description | Cumulative conversion lift from tests (90d) |

### `s.ux.replaysRetained`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R] |
| Format | number |
| Description | Session replays retained |

### `s.ux.heatmapsTracked`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R] |
| Format | number |
| Description | Pages with heatmap tracking |

### `p.ux.roleClassified`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,L,A] |
| Sources | T6 AI |
| Format | enum |
| Values | entry, mid, conv, form, confirm, utility |
| Description | Page role classification |

---

## EM: Email `s.email.*` + `p.email.*` (16 metrics)

Gate: fp.stack.email detected

---

### `s.email.provider`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R] |
| Format | enum |
| Description | Email marketing provider (Mailchimp, Klaviyo, etc.) |

### `s.email.listSize`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Sources | T0 provider API |
| Format | number |
| Description | Email subscriber list size |

### `s.email.growth30d`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,V,T] |
| Sources | T0 provider API |
| Format | number |
| Description | Subscriber growth (28d) |

### `s.email.openRate`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,V,K,S] |
| Sources | T0 provider API |
| Format | percent |
| Description | Average email open rate |

### `s.email.ctr`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,V,K,S] |
| Sources | T0 provider API |
| Format | percent |
| Description | Average email click-through rate |

### `s.email.bounceRate`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,V,A,E] |
| Sources | T0 provider API |
| Format | percent |
| Description | Email bounce rate |

### `s.email.unsubRate`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,V,A] |
| Sources | T0 provider API |
| Format | percent |
| Description | Unsubscribe rate |

### `s.email.spamRate`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,V,A,E] |
| Sources | T0 provider API |
| Format | percent |
| Description | Spam complaint rate |

### `s.email.domainAuth.spf`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,A] |
| Format | boolean |
| Description | SPF record configured |

### `s.email.domainAuth.dkim`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,A] |
| Format | boolean |
| Description | DKIM configured |

### `s.email.domainAuth.dmarc`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,A,E] |
| Format | boolean |
| Description | DMARC configured |

### `s.email.bimi`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,A] |
| Format | boolean |
| Description | BIMI logo configured |

### `s.email.subjectLine.score`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,A] |
| Sources | T6 AI |
| Format | score |
| Description | AI-analyzed subject line quality score |

### `s.email.inboxPlacement`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,V,A,E] |
| Sources | T3 GlockApps free / seed list |
| Format | percent |
| Description | Inbox placement rate |

### `s.email.deliverability`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,V] |
| Format | score |
| Description | Overall deliverability score |

### `s.email.optInQuality`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,A,S] |
| Format | score |
| Description | Opt-in quality score |

### `s.email.doubleOptIn`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,A] |
| Format | boolean |
| Description | Whether double opt-in is enabled |

### `s.email.preferenceCenter`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,A] |
| Format | boolean |
| Description | Whether preference center exists |

### `s.email.lifecycleCoverage`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,V,A] |
| Format | list |
| Description | Lifecycle emails present (welcome, onboarding, abandon, win-back) |

### `p.email.signupCta`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,A] |
| Format | boolean |
| Description | Whether email signup CTA is present on page |

### `p.email.leadMagnet`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Format | boolean |
| Description | Whether a lead magnet is offered |

### `p.email.preferenceLink`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Format | boolean |
| Description | Whether email preference center link is present |

---

## CP: Competitor `e.competitor.*` (17 metrics)

---

### `e.competitor.domain`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [R,V,X] |
| Format | url |
| Description | Competitor domain |

### `e.competitor.kwOverlap`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [R,V,K] |
| Format | number |
| Description | Number of overlapping ranking keywords |

### `e.competitor.serp.overlap`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [V] |
| Format | percent |
| Description | SERP result overlap percentage |

### `e.competitor.sov.organic`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [V,K,T] |
| Format | percent |
| Description | Organic share of voice vs competitor |

### `e.competitor.sov.paid`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [V,T] |
| Format | percent |
| Description | Paid share of voice vs competitor |

### `e.competitor.sov.social`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [V,T] |
| Format | percent |
| Description | Social share of voice vs competitor |

### `e.competitor.backlinkOverlap`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [V] |
| Format | number |
| Description | Shared referring domains |

### `e.competitor.contentVelocity`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [V] |
| Format | number |
| Description | New content pieces per week |

### `e.competitor.pricing`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [V,B] |
| Format | json |
| Description | Competitor pricing data |

### `e.competitor.employeeEst`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [V] |
| Sources | T3 LinkedIn scrape |
| Format | number |
| Description | Estimated employee count |

### `e.competitor.funding`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [V] |
| Format | money |
| Description | Total funding raised |

### `e.competitor.rev.est`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [V] |
| Format | money |
| Description | Estimated annual revenue |

### `e.competitor.techStack`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [V] |
| Format | list |
| Description | Technology stack detected (BuiltWith) |

### `e.competitor.wins`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [V,A] |
| Format | list |
| Description | Keywords/topics where competitor ranks and we don't |

### `e.competitor.losses`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [V,A] |
| Format | list |
| Description | Keywords/topics where we lost to competitor |

### `e.competitor.priceDelta`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [V,A,E] |
| Format | money |
| Description | Price difference vs competitor |

### `e.competitor.contentGap.shared`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [V,A] |
| Format | list |
| Description | Shared content gap topics |

---

## SC: Site-wide Scores `s.score.*` (17 metrics)

---

### `s.score.qOverall`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [H,R,K,T,E] |
| Format | score |
| Description | Overall quality score (0-100) |

### `s.score.content`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [H,R,K,T] |
| Format | score |
| Description | Content quality score |

### `s.score.search`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [H,R,K,T] |
| Format | score |
| Description | Search performance score |

### `s.score.tech`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [H,R,K,T] |
| Format | score |
| Description | Technical health score |

### `s.score.links`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [H,R,K,T] |
| Format | score |
| Description | Link authority score |

### `s.score.ai`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [H,R,K,T] |
| Format | score |
| Description | AI discoverability score |

### `s.score.eeat`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [H,R,K,T] |
| Format | score |
| Description | E-E-A-T score |

### `s.score.social`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [H,R,K,T] |
| Format | score |
| Description | Social presence score |

### `s.score.paid`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [H,R,K,T] |
| Format | score |
| Description | Paid media score |

### `s.score.commerce`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [H,R,K,T] |
| Format | score |
| Description | E-commerce health score |

### `s.score.local`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [H,R,K,T] |
| Format | score |
| Description | Local SEO score |

### `s.score.ux`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [H,R,K,T] |
| Format | score |
| Description | User experience score |

### `s.score.email`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [H,R,K,T] |
| Format | score |
| Description | Email marketing score |

### `s.score.compliance`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | score |
| Description | Compliance score (accessibility + privacy + security) |

### `s.score.opportunity`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | score |
| Description | Opportunity score (sum of action-forecasted deltas) |

### `s.score.business`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | score |
| Description | Composite business value score |

### `s.score.strategic.priority`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K,A] |
| Format | enum |
| Values | critical, high, medium, low |
| Description | Strategic priority bucket |

---

## BG: Background `b.*` (25 metrics)

---

### `b.backlinks.refresh`
| Field | Value |
|-------|-------|
| Level | B |
| Recompute | weekly |
| Sources | T0 > T3 > T4 CommonCrawl |
| Description | Backlink data refresh job |

### `b.wayback.age`
| Field | Value |
|-------|-------|
| Level | B |
| Recompute | once/domain |
| Sources | T4 archive.org |
| Description | Wayback Machine domain age |

### `b.whois.age`
| Field | Value |
|-------|-------|
| Level | B |
| Recompute | once/domain |
| Sources | T3 RDAP free |
| Description | WHOIS domain age |

### `b.bing.wmt`
| Field | Value |
|-------|-------|
| Level | B |
| Recompute | daily |
| Sources | T0 Bing WMT |
| Description | Bing Webmaster Tools daily sync |

### `b.gsc.daily`
| Field | Value |
|-------|-------|
| Level | B |
| Recompute | daily |
| Sources | T0 GSC |
| Description | Google Search Console daily sync |

### `b.ga4.daily`
| Field | Value |
|-------|-------|
| Level | B |
| Recompute | daily |
| Sources | T0 GA4 |
| Description | Google Analytics 4 daily sync |

### `b.crux.monthly`
| Field | Value |
|-------|-------|
| Level | B |
| Recompute | monthly |
| Sources | T1 CrUX |
| Description | Chrome UX Report monthly sync |

### `b.serp.scrape`
| Field | Value |
|-------|-------|
| Level | B |
| Recompute | weekly-per-kw |
| Sources | T5 SERP scrape |
| Description | SERP position tracking scrape |

### `b.ai.harness`
| Field | Value |
|-------|-------|
| Level | B |
| Recompute | weekly |
| Sources | T5 prompt set × 5 engines |
| Description | AI citation harness (prompt each engine, track citations) |

### `b.social.mentions`
| Field | Value |
|-------|-------|
| Level | B |
| Recompute | hourly |
| Sources | T0 > T5 |
| Description | Social mention monitoring |

### `b.social.followers`
| Field | Value |
|-------|-------|
| Level | B |
| Recompute | daily |
| Sources | T0/T3 |
| Description | Social follower count sync |

### `b.news.coverage`
| Field | Value |
|-------|-------|
| Level | B |
| Recompute | daily |
| Sources | T3 GDELT + T5 Google News |
| Description | News coverage monitoring |

### `b.podcast.mentions`
| Field | Value |
|-------|-------|
| Level | B |
| Recompute | daily |
| Sources | T3 Listen Notes free + T5 |
| Description | Podcast mention monitoring |

### `b.youtube.transcripts`
| Field | Value |
|-------|-------|
| Level | B |
| Recompute | daily |
| Sources | T1 YT data API + T5 |
| Description | YouTube transcript mention extraction |

### `b.commerce.prices`
| Field | Value |
|-------|-------|
| Level | B |
| Recompute | daily |
| Sources | T3/T5 |
| Description | Competitor price monitoring |

### `b.brand.reviews`
| Field | Value |
|-------|-------|
| Level | B |
| Recompute | daily |
| Sources | T3 Trustpilot/G2/Capterra/Google |
| Description | Brand review monitoring |

### `b.blacklist`
| Field | Value |
|-------|-------|
| Level | B |
| Recompute | daily |
| Sources | T1 Google SafeBrowsing, Spamhaus, abuse.ch |
| Description | Security blacklist monitoring |

### `b.core.update.events`
| Field | Value |
|-------|-------|
| Level | B |
| Recompute | event-driven |
| Sources | Google announcement + SERP scan |
| Description | Google core update event detection |

### `b.logfile.ingest`
| Field | Value |
|-------|-------|
| Level | B |
| Recompute | continuous |
| Sources | T0 log ingestion |
| Description | Server log file continuous ingestion |

### `b.internal.search.ingest`
| Field | Value |
|-------|-------|
| Level | B |
| Recompute | daily |
| Sources | T0 site search |
| Description | Internal search query ingestion |

### `b.shopping.feed`
| Field | Value |
|-------|-------|
| Level | B |
| Recompute | daily |
| Sources | T0 merchant feed |
| Description | Shopping feed sync and validation |

### `b.gbp.sync`
| Field | Value |
|-------|-------|
| Level | B |
| Recompute | daily |
| Sources | T0 GBP API |
| Description | Google Business Profile sync |

### `b.ad.library.scan`
| Field | Value |
|-------|-------|
| Level | B |
| Recompute | weekly |
| Sources | T5 Meta ad library, Google ads transparency |
| Description | Ad library monitoring |

---

## UN: Universal `u.*` (15 metrics)

Config-level constants used across all other metrics.

---

### `u.thresholds`
| Field | Value |
|-------|-------|
| Level | U |
| Roles | [X] |
| Format | json |
| Description | Thresholds for metric classification (e.g. wordCount thin=300, CWV poor lcp=4.0) |

### `u.scoringWeights`
| Field | Value |
|-------|-------|
| Level | U |
| Roles | [X] |
| Format | json |
| Description | Weights for composite score computation per namespace |

### `u.industryDefaults`
| Field | Value |
|-------|-------|
| Level | U |
| Roles | [X] |
| Format | json |
| Description | Industry-specific default values when data is unavailable |

### `u.actionFormula`
| Field | Value |
|-------|-------|
| Level | U |
| Roles | [X] |
| Format | json |
| Description | Action scoring formula constants and band multipliers |

### `u.sourceWeights`
| Field | Value |
|-------|-------|
| Level | U |
| Roles | [X] |
| Format | json |
| Description | Tier priority weights for source ladder resolution |

### `u.freshnessTTL`
| Field | Value |
|-------|-------|
| Level | U |
| Roles | [X] |
| Format | json |
| Description | Time-to-live for each freshness class per metric |

### `u.gateRules`
| Field | Value |
|-------|-------|
| Level | U |
| Roles | [X] |
| Format | json |
| Description | Global metric visibility gating rules |

### `u.industryConversionPacks`
| Field | Value |
|-------|-------|
| Level | U |
| Roles | [X] |
| Format | json |
| Description | Conversion event packs per industry |

### `u.readabilityFormulas`
| Field | Value |
|-------|-------|
| Level | U |
| Roles | [X] |
| Format | json |
| Description | Language-specific readability formula mappings |

### `u.aiTierRouting`
| Field | Value |
|-------|-------|
| Level | U |
| Roles | [X] |
| Format | json |
| Description | AI model routing tiers (XS/S/M/L) and provider assignments |

### `u.browserQuotas`
| Field | Value |
|-------|-------|
| Level | U |
| Roles | [X] |
| Format | json |
| Description | Browser-offload quotas per target domain |

### `u.actionBands`
| Field | Value |
|-------|-------|
| Level | U |
| Roles | [X] |
| Format | json |
| Description | Priority band definitions and multipliers |

### `u.scoreCeilings`
| Field | Value |
|-------|-------|
| Level | U |
| Roles | [X] |
| Format | json |
| Description | Score dimension ceilings for normalization |

### `u.modeColumnDefaults`
| Field | Value |
|-------|-------|
| Level | U |
| Roles | [X] |
| Format | json |
| Description | Default grid columns per mode |

### `u.fingerprintGates`
| Field | Value |
|-------|-------|
| Level | U |
| Roles | [X] |
| Format | json |
| Description | Fingerprint-based visibility gate definitions |

---

## UI Mapping Table

| Namespace | Default Grid Columns | Inspector Tabs | Right-Sidebar Tabs | Left-Sidebar Filters | Header/Bottom | Views/Charts |
|-----------|---------------------|----------------|--------------------|---------------------|---------------|--------------|
| `p.*` fundamentals | url, status, indexable, depth | Summary, Req/Resp | Overview, Tech | status, indexable, depth | — / bottom stripe | Site map, structure |
| `p.content.*` | title, wordCount, duplicates, freshness | Copy, Readability, Entities, Duplication | Content | duplicates, freshness, lang, topic, AI-gen | — | Duplicates graph, topic treemap |
| `p.tech.*` | cwv bucket, perfClass, secGrade, a11y | Req/Resp, DOM, Security, A11y | Tech, Crawl, Render, Security, A11y | cwv, sec grade, a11y, render-dep | — | CWV hist, render diff, sec matrix |
| `p.links.*` | inlinks, internalPR, RD, broken | Link summary, Source, Target, Anchor, Context | Internal, External, Anchors, Toxic | orphan, broken, toxic anchor | — | Link graph, anchor cloud |
| `p.search.*` | gsc clicks, impr, pos, top3/10 | Search, SERP preview | Search, Queries | intent, has clicks, losing, lost | header (session) / bottom | Rank tracker, cannibalization, trend |
| `p.ga.*` + `p.conv.*` | sessions, cvr, revenue, rage | CWV, Replays, Funnels, Forms | Overview, Friction, Funnels, Tests, Actions | intent-bucket, friction, device, experiment | — / bottom | Funnels, heatmaps, replays |
| `p.ai.*` | aiCitationRate, extractability, llmsTxt | Bot access, Extractable, Schema, Citations, Prompts | Crawlability, Citations, Entities, Schema | bot access, citation engine, llms.txt | — | Citation timeline, entity graph |
| `p.social.*` | socialShares, ogOk | Meta tags, Platform previews | Overview, Mentions, Engagement, Traffic | OG issues, platform | — | Meta audit matrix |
| `p.paid.*` | paidSessions, qsLp, adMatch | Ad copy match, QS-LP, CWV paid UA | Overview, Spend, Quality, Competition, Actions | QS, disapproved, network | header / bottom | Auction matrix, QS dist |
| `p.commerce.*` | price, stock, reviews, schema | Product, Variants, Schema, Feed, Search | Inventory, Schema, Feed, Funnel | OOS, no schema, no reviews | — / bottom | Cat tree, price, funnel |
| `p.local.*` + `e.local.*` | nap, gbp, reviews, rank | NAP, GBP, Reviews, Citations, Schema | NAP, GBP, Reviews, Local Pack | verified, nap-issue, no-gbp | — | Geogrid, pin map |
| `p.ux.*` | role, engage, rage, scroll | Heatmap, Scroll, Friction, Forms, CWV | Overview, Friction, Funnels, Tests | role, friction, intent | — | Heatmap, funnel |
| `s.*` scores | — (one per site) | — | Overview KPI tiles | — | header Q-score chip | KPI tiles, Q-score trend |
| `e.*` competitors | competitor, SoV | Summary, Pages, Links, SERP, Actions | Gap, Wins, Losses | tier, overlap | — | Gap matrix, SERP overlap, SoV stream |
| `q.*` keywords | kw, vol, rank, url | Keyword detail | Top kw, Rising, Lost | intent, funnel, cluster, opportunity | — | Rank tracker, opportunity scatter |
| `l.*` links | source, target, anchor | Link detail | — | anchor type, rel, nofollow | — | Graph, anchor chord |
| `b.*` background | — | — | freshness chips on relevant values | — | — | — |

---

## Adaptive Visibility Rules

### Gating Keys
`fp.industry` · `fp.language.primary` · `fp.cms` · `fp.stack.*` · `fp.size.urls` · mode · user role

### Gate Function
```
show(metric) = mode ∈ metric.modes ∧ fp matches metric.gateRules ∧ userRole permits
```

### Industry Gates

| Metric Namespace | Gate Rule |
|------------------|-----------|
| `p.commerce.*` | fp.industry ∈ {ecommerce} OR fp.stack.ecom present |
| `p.local.*` | fp.industry ∈ {local, restaurant, healthcare, finance-branch, real_estate} OR multi-location |
| `p.email.*` | fp.stack.email detected OR p.email.signupCta found |
| `p.news.*` | fp.industry ∈ {news, media} OR NewsArticle schema present |
| `p.jobs.*` | fp.industry = jobboard OR JobPosting schema |
| `p.paid.*` | mode=Paid OR fp.stack.adPlatforms non-empty |
| `p.search.discover` | fp.industry ∈ {news, blog, ecommerce} |

### CMS-Specific Columns

| CMS | Additional Columns |
|-----|-------------------|
| wordpress | wp.plugins.count, wp.theme, wp.yoast.score, wp.rankmath.score, wp.acf.present |
| shopify | shopify.app.count, shopify.theme, shopify.metaobject, shopify.json-ld-pack |
| webflow | webflow.cms.item, webflow.staticHtml |
| nextjs | next.isr, next.staticOrSsr, next.hydrationMismatch |
| contentful/sanity | headless.buildInfo, headless.previewBleed |
| framer/wix/squarespace | "limited structured access" advisory |
| ghost | ghost.memberArea, ghost.portalEnabled |
| substack | substack.paywall, substack.subscribeRate |

### Language-Specific Columns

| Language | Behavior |
|----------|----------|
| zh/ja/ko | Char-count instead of word-count; CJK-specific readability |
| ar/he/fa/ur | RTL alignment forced; add p.rtl.mirrorIssues |
| ≠ en | Disable Grammarly-style grammar; use AI grammar for that lang |
| multi-lang | Show hreflang matrix, p.lang.match, per-locale duplicates |

---

## Conversion Event Packs

### Per-Industry Primary Events

| Industry | Primary Events | Secondary | Micro |
|----------|---------------|-----------|-------|
| ecommerce | purchase, add_to_cart, begin_checkout | add_to_wishlist, subscribe | product_view, use_search, view_cart |
| saas | sign_up, start_trial, request_demo | contact_sales, book_meeting | pricing_view, docs_view, video_watch |
| blog/creator | newsletter_sub, sponsor_click, affiliate | share, comment, save | scroll_90, time_on_page_60s |
| news/media | subscription, paywall_convert, sign_in | newsletter_sub, push_opt-in | article_complete, 3_articles_session |
| finance | application_start, application_complete | calculator_complete, contact | calculator_view, docs_download |
| healthcare | appt_booked, contact_form, call_clicked | insurance_check, tele-consult | symptom_checker_use, dr_profile_view |
| education | application_start, application_complete | program_inquiry, apply_now | course_view, syllabus_download |
| job_board | application_submitted, job_alert_sub | employer_contact | job_view, save_job, resume_upload |
| local | call, direction, booking | form_submit, menu_view | hours_view, photo_view |
| real_estate | lead_form, book_viewing, call | save_listing, mortgage_calc | photo_gallery, share_listing |
| restaurant | reservation, order_online, call | menu_view, delivery_start | hours_view |
| nonprofit | donate, volunteer, newsletter_sub | petition_sign, share | story_read |
| government | form_submit, permit_apply | pay_fee | info_found |
| portfolio | contact_form, hire_click, email_click | download_cv | case_study_view |

---

## Deterministic vs AI Routing

### Never Route to AI (Purely Deterministic)

- Status codes / redirects / canonical / robots / x-robots / sitemap
- Title / metaDesc / H-tree / hreflang / OG / Twitter
- Word count / sentence count / hash / exact dup / near-dup (minhash+simhash)
- Schema presence, type list, validation against JSON-LD spec
- Images (alt, srcset, lazy, dims, format, bytes)
- All tech.perf/cwv (CrUX + PSI)
- All security headers + cookies + SRI + CSP + TLS
- All a11y axe rules (WCAG 2.2 AA)
- URL shape rules (length, case, param, session)
- Regex metrics (prices, emails, phones, custom)
- URL → role classification via URL+schema patterns
- OG image ratio + bytes
- Content hash → duplicate cluster via MinHash LSH
- Simple readability formulas (lang-supported)
- isSoft404 (title + size + 200)
- Mobile-friendly heuristics (viewport + tap targets + font)
- Form detection via `<form>` presence
- Link graph (inlinks, PR, equity, broken)
- JS render diff (DOM compare)
- SSL / blacklist check (API calls, not AI)

### Route to AI Only

- Intent classification (search, funnel)
- Topic cluster assignment (embeddings + AI naming)
- Cannibalization detection (embedding cosine + AI arbitration)
- aiGenerated detection (small classifier, can be local)
- Author / E-E-A-T extraction from HTML
- Entity extraction + linking
- Action reasoning + forecasting
- Competitor gap matrix scoring
- Sentiment analysis
- Summary generation
- Rewrite suggestions
- Content briefs
- Auto-generated meta tags
- Prompt-citation harness
- Strategic priority arbitration

---

## EXPANSION: Additional Metrics to Reach ~1,700

> The following metrics expand the catalog from ~647 base metrics to ~1,700.
> Categories: device breakdowns, temporal variants, country/language splits,
> per-engine detail, aggregate summaries, comparison deltas, scoring components,
> entity-level expansions, and granular sub-metrics.

---

## EX-A: Page Fundamentals Expansion (47 additional)

### `p.statusCode.mobile`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,L] |
| Sources | T0 crawl (mobile UA) |
| Format | number |
| Description | Status code when crawled with mobile user agent |

### `p.statusCode.desktop`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,L] |
| Sources | T0 crawl (desktop UA) |
| Format | number |
| Description | Status code when crawled with desktop user agent |

### `p.statusCode.delta`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,E,T] |
| Sources | T7 trend |
| Format | number |
| Description | Status code change vs previous crawl |

### `p.redirect.count`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,A] |
| Sources | T0 crawl |
| Format | number |
| Description | Number of redirects in chain |

### `p.redirect.hops`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 crawl |
| Format | list |
| Description | Each hop in the redirect chain with status code and time |

### `p.redirect.totalTime`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 crawl |
| Format | duration |
| Description | Total time spent following redirects (ms) |

### `p.canonical.matchSitemap`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 cross-check |
| Format | boolean |
| Description | Whether canonical URL matches sitemap entry |

### `p.canonical.matchIndex`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,E] |
| Sources | T7 derived |
| Format | boolean |
| Description | Whether canonical is actually indexed (cross-check with GSC) |

### `p.robots.directives`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T0 crawl |
| Format | json |
| Description | Full robots directives parsed: {noindex, nofollow, nosnippet, max-snippet, etc.} |

### `p.robots.xRobotsDirectives`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T0 crawl |
| Format | json |
| Description | X-Robots-Tag header directives |

### `p.indexability.signals`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 composite |
| Format | json |
| Description | All indexability signals: {robots, canonical, noindex, status, depth, sitemap} |

### `p.indexability.conflict`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,E] |
| Sources | T7 derived |
| Format | boolean |
| Description | Whether conflicting indexability signals exist (e.g. noindex + in-sitemap) |

### `p.sitemap.present`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,L] |
| Sources | T0 cross-check |
| Format | boolean |
| Description | Whether URL appears in any sitemap (cross-validated) |

### `p.sitemap.indexCount`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T0 sitemap |
| Format | number |
| Description | Number of sitemaps containing this URL |

### `p.depth.crawl.mobile`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,L] |
| Sources | T7 mobile crawl |
| Format | number |
| Description | Click depth from homepage on mobile crawl |

### `p.depth.crawl.desktop`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,L] |
| Sources | T7 desktop crawl |
| Format | number |
| Description | Click depth from homepage on desktop crawl |

### `p.depth.crawl.delta`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,T] |
| Sources | T7 trend |
| Format | number |
| Description | Click depth change vs previous crawl |

### `p.httpVersion.mobile`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T0 mobile fetch |
| Format | enum |
| Description | HTTP version for mobile user agent |

### `p.httpVersion.delta`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,T] |
| Sources | T7 trend |
| Format | enum |
| Description | HTTP version change vs previous crawl (e.g. HTTP/1.1 → HTTP/2) |

### `p.language.htmlValid`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 derived |
| Format | boolean |
| Description | Whether HTML lang attribute is a valid ISO 639-1 code |

### `p.language.contentMatch`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,E] |
| Sources | T6 AI + T7 comparison |
| Format | score |
| Description | Confidence score that content matches declared language (0-1) |

### `p.hreflang.selfPresent`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 derived |
| Format | boolean |
| Description | Whether hreflang set includes self-referencing entry |

### `p.hreflang.returnPresent`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 derived |
| Format | boolean |
| Description | Whether all hreflang alternatives have return tags pointing back |

### `p.hreflang.validCount`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 derived |
| Format | number |
| Description | Count of valid hreflang annotations |

### `p.hreflang.errorCount`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,A,E] |
| Sources | T7 derived |
| Format | number |
| Description | Count of hreflang errors |

### `p.url.canonicalized`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,A] |
| Sources | T7 derived |
| Format | boolean |
| Description | Whether URL is the canonical version of a group |

### `p.url.parameters`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T7 parse |
| Format | list |
| Description | Query parameter names present in URL |

### `p.url.parameterCount`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,A] |
| Sources | T7 parse |
| Format | number |
| Description | Number of query parameters |

### `p.url.utmPresent`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 parse |
| Format | boolean |
| Description | Whether UTM tracking parameters are present |

### `p.url.hashPresent`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I] |
| Sources | T7 parse |
| Format | boolean |
| Description | Whether URL fragment (#) is present |

### `p.url.protocol`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,L] |
| Sources | T7 parse |
| Format | enum |
| Description | URL protocol (http, https) |

### `p.url.domain`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T7 parse |
| Format | text |
| Description | Domain portion of URL |

### `p.url.subdomain`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,L] |
| Sources | T7 parse |
| Format | text |
| Description | Subdomain portion (www, blog, docs, etc.) |

### `p.url.tld`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,L] |
| Sources | T7 parse |
| Format | enum |
| Description | Top-level domain (com, org, co.uk, etc.) |

### `p.url.pathSegments`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T7 parse |
| Format | list |
| Description | Individual path segments as array |

### `p.url.hasTrailingSlash`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,L] |
| Sources | T7 parse |
| Format | boolean |
| Description | Whether URL has trailing slash |

### `p.url.isCanonical`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,A] |
| Sources | T7 derived |
| Format | boolean |
| Description | Whether this URL is the canonical version (self-referencing) |

### `p.url.canonicalGroup`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 derived |
| Format | list |
| Description | All URLs in the same canonical group |

### `p.url.canonicalGroupSize`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,E] |
| Sources | T7 derived |
| Format | number |
| Description | Number of URLs pointing to same canonical (large = potential issue)

### `p.contentLength.bytes`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T0 crawl |
| Format | bytes |
| Description | Total HTML response size in bytes

### `p.contentLength.compressed`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T0 crawl |
| Format | bytes |
| Description | Compressed (gzip/brotli) response size

### `p.contentLength.textBytes`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 derived |
| Format | bytes |
| Description | Visible text content size in bytes

### `p.contentLength.htmlOverhead`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 derived |
| Format | percent |
| Description | Percentage of HTML that is markup overhead vs visible text

### `p.responseTime.total`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,R,V,S,A] |
| Sources | T0 crawl |
| Format | duration |
| Description | Total response time (DNS + connect + TLS + TTFB + download)

### `p.responseTime.dns`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T0 crawl |
| Format | duration |
| Description | DNS resolution time

### `p.responseTime.connect`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T0 crawl |
| Format | duration |
| Description | TCP connection time

### `p.responseTime.tls`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T0 crawl |
| Format | duration |
| Description | TLS handshake time

### `p.responseTime.ttfb`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,V,S,A] |
| Sources | T0 crawl |
| Format | duration |
| Description | Time to first byte

### `p.responseTime.download`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T0 crawl |
| Format | duration |
| Description | Content download time

### `p.responseTime.totalMobile`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,L] |
| Sources | T0 mobile crawl |
| Format | duration |
| Description | Total response time from mobile user agent

### `p.responseTime.delta`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,T] |
| Sources | T7 trend |
| Format | duration |
| Description | Response time change vs previous crawl

---

## EX-B: Content Expansion (78 additional)

### `p.content.title.duplicate`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,A,E] |
| Sources | T7 cross-check |
| Format | boolean |
| Description | Whether title is duplicated across multiple pages

### `p.content.title.duplicateCount`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,E] |
| Sources | T7 cross-check |
| Format | number |
| Description | Number of pages sharing this exact title

### `p.content.title.duplicateUrls`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 cross-check |
| Format | list |
| Description | URLs sharing this title

### `p.content.title.matchH1`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 derived |
| Format | boolean |
| Description | Whether title matches H1 text

### `p.content.title.matchKw`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T6 AI + T0 GSC |
| Format | boolean |
| Description | Whether title contains primary keyword

### `p.content.title.sentiment`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T6 AI |
| Format | enum |
| Description | Title sentiment (positive, neutral, negative)

### `p.content.title.powerWords`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T6 AI |
| Format | list |
| Description | Power/emotional words detected in title

### `p.content.title.numberPresent`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 regex |
| Format | boolean |
| Description | Whether title contains a number (listicle signal)

### `p.content.title.questionPresent`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 regex |
| Format | boolean |
| Description | Whether title is phrased as a question

### `p.content.metaDesc.duplicate`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,A,E] |
| Sources | T7 cross-check |
| Format | boolean |
| Description | Whether meta description is duplicated across pages

### `p.content.metaDesc.matchKw`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T6 AI + T0 GSC |
| Format | boolean |
| Description | Whether meta description contains primary keyword

### `p.content.metaDesc.hasCTA`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T6 AI |
| Format | boolean |
| Description | Whether meta description contains a call-to-action

### `p.content.metaDesc.ctaWords`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T6 AI |
| Format | list |
| Description | CTA words detected in meta description

### `p.content.h1.duplicate`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,E] |
| Sources | T7 cross-check |
| Format | boolean |
| Description | Whether H1 is duplicated across pages

### `p.content.h1.matchTitle`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 derived |
| Format | boolean |
| Description | Whether H1 closely matches page title

### `p.content.h1.matchKw`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T6 AI + T0 GSC |
| Format | boolean |
| Description | Whether H1 contains primary keyword

### `p.content.h1.length`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 derived |
| Format | number |
| Description | H1 character length

### `p.content.hTree.depth`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 derived |
| Format | number |
| Description | Maximum heading nesting depth

### `p.content.hTree.count`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T7 derived |
| Format | number |
| Description | Total heading count (h1-h6)

### `p.content.hTree.h2Count`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 derived |
| Format | number |
| Description | Count of H2 headings

### `p.content.hTree.h3Count`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 derived |
| Format | number |
| Description | Count of H3 headings

### `p.content.hTree.avgLength`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 derived |
| Format | number |
| Description | Average heading text length

### `p.content.wordCount.mobile`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,L] |
| Sources | T0 mobile crawl |
| Format | number |
| Description | Word count on mobile-rendered version

### `p.content.wordCount.delta`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,T] |
| Sources | T7 trend |
| Format | number |
| Description | Word count change vs previous crawl

### `p.content.wordCount.bucket`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,L] |
| Sources | T7 derived |
| Format | enum |
| Values | thin (<300), short (300-800), medium (800-1500), long (1500-3000), comprehensive (>3000) |
| Description | Word count bucket for filtering

### `p.content.readability.fleschMobile`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I] |
| Sources | T0 mobile crawl + T7 |
| Format | score |
| Description | Readability score on mobile-rendered content

### `p.content.readability.gradeLevelMobile`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I] |
| Sources | T0 mobile crawl + T7 |
| Format | number |
| Description | Grade level on mobile-rendered content

### `p.content.readability.fleschDelta`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,T] |
| Sources | T7 trend |
| Format | number |
| Description | Readability change vs previous crawl

### `p.content.readability.gradeBucket`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,L] |
| Sources | T7 derived |
| Format | enum |
| Values | easy (college), medium (high-school), hard (college+), very-hard (graduate) |
| Description | Grade level bucket for filtering

### `p.content.duplicate.exactMobile`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 mobile crawl |
| Format | boolean |
| Description | Whether mobile version has exact duplicates

### `p.content.duplicate.crossDevice`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,E] |
| Sources | T7 cross-check |
| Format | boolean |
| Description | Whether mobile and desktop versions differ (cloaking risk)

### `p.content.freshness.publishDate`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 schema + byline |
| Format | date |
| Description | Original publish date detected

### `p.content.freshness.modifiedDate`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 schema + HTTP header |
| Format | date |
| Description | Last modified date detected

### `p.content.freshness.daysSincePublish`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,R,V,A] |
| Sources | T7 derived |
| Format | number |
| Description | Days since original publish date

### `p.content.freshness.daysSinceModified`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,R,V,A] |
| Sources | T7 derived |
| Format | number |
| Description | Days since last modification

### `p.content.freshness.updateFrequency`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 trend |
| Format | duration |
| Description | Average time between content updates

### `p.content.freshness.isEvergreen`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,L,A] |
| Sources | T6 AI + T7 trend |
| Format | boolean |
| Description | Whether content is evergreen (timeless topic)

### `p.content.freshness.decayRisk`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,A,E] |
| Sources | T7 trend model |
| Format | score |
| Description | Risk score for content becoming outdated

### `p.content.freshness.updateBadgePresent`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 crawl |
| Format | boolean |
| Description | Whether visible "last updated" badge is shown

### `p.content.freshness.schemaDateMatch`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 cross-check |
| Format | boolean |
| Description | Whether schema datePublished/dateModified match visible dates

### `p.content.eeat.authorEntity`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T6 AI |
| Format | text |
| Description | Author entity resolved (name + credentials + links)

### `p.content.eeat.authorLinks`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 derived |
| Format | list |
| Description | Author-related links (social profiles, bio pages, publications)

### `p.content.eeat.authorTopicality`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,S,A] |
| Sources | T6 AI |
| Format | score |
| Description | Author's topical authority in this content's domain

### `p.content.eeat.citationSources`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T6 AI |
| Format | list |
| Description | External sources cited in the content

### `p.content.eeat.citationAuthority`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,S,A] |
| Sources | T6 AI + T3 |
| Format | score |
| Description | Average authority of cited sources

### `p.content.eeat.originalAnalysis`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T6 AI |
| Format | boolean |
| Description | Whether content contains original analysis/data/opinions

### `p.content.eeat.firstHandExperience`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T6 AI |
| Format | boolean |
| Description | Whether content demonstrates first-hand experience

### `p.content.eeat.recency`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,S,A] |
| Sources | T7 derived |
| Format | score |
| Description | E-E-A-T recency signal (how up-to-date information is)

### `p.content.entities.resolved`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T6 AI |
| Format | list |
| Description | Entities with Wikipedia/Wikidata links resolved

### `p.content.entities.count`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,A] |
| Sources | T6 AI |
| Format | number |
| Description | Total entity count

### `p.content.entities.named`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T6 AI |
| Format | number |
| Description | Count of named entities (people, orgs, places)

### `p.content.entities.topical`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T6 AI |
| Format | list |
| Description | Topical entities (concepts, not named entities)

### `p.content.entities.sentiment`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T6 AI |
| Format | json |
| Description | Per-entity sentiment scores

### `p.content.topic.subtopics`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T6 AI |
| Format | list |
| Description | Sub-topics covered within the main topic

### `p.content.topic.keywords`
| Field | Value |
|-------|-------|
| Level | P |
    Roles | [I,X] |
| Sources | T6 AI + T0 GSC |
| Format | list |
| Description | Topic-relevant keywords found in content

### `p.content.topic.keywordCount`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T6 AI |
| Format | number |
| Description | Count of topic-relevant keywords used

### `p.content.topic.keywordDensity`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 derived |
| Format | percent |
| Description | Primary keyword density percentage

### `p.content.topic.keywordProminence`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 derived |
| Format | score |
| Description | Keyword prominence (position in title, H1, first paragraph)

### `p.content.topic.freshness`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T3 Google Trends |
| Format | score |
| Description | Topic trend score (rising, stable, declining)

### `p.content.topic.seasonality`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Sources | T3 Google Trends |
| Format | json |
| Description | Topic seasonality pattern

### `p.content.topic.competition`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T3/T5 |
| Format | score |
| Description | Topic competition level from SERP analysis

### `p.content.topic.gap`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T6 AI + T5 SERP |
| Format | list |
| Description | Sub-topics covered by competitors but missing here

### `p.content.topic.depth.score`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,S,A] |
| Sources | T6 AI |
| Format | score |
| Description | Topic depth score (0-1) vs top SERP results

### `p.content.topic.breadth`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T6 AI |
| Format | score |
| Description | Topic breadth score (how many sub-topics covered)

### `p.content.topic.authority`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,S,A] |
| Sources | T6 AI + T0 GSC |
| Format | score |
| Description | Topic authority score for this page

### `p.content.intent.matchTitle`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T6 AI |
| Format | score |
| Description | Title-to-intent match score

### `p.content.intent.matchContent`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T6 AI |
| Format | score |
| Description | Content body-to-intent match score

### `p.content.intent.matchSERP`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T6 AI + T5 |
| Format | score |
| Description | Page vs top-10 SERP intent alignment

### `p.content.cta.count`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T6 AI |
| Format | number |
| Description | Number of CTA elements on page

### `p.content.cta.prominence`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 derived |
| Format | score |
| Description | CTA prominence score (above fold, visual weight)

### `p.content.cta.types`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T6 AI |
| Format | list |
| Description | CTA types detected (button, link, form, popup, sticky bar)

### `p.content.cta.aboveFold`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 derived |
| Format | boolean |
| Description | Whether a CTA appears above the fold

### `p.content.internalLinks.inContent`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 crawl |
| Format | number |
| Description | Internal links within content body (not nav/footer)

### `p.content.internalLinks.toCluster`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 derived |
| Format | number |
| Description | Internal links to same topic cluster pages

### `p.content.internalLinks.fromCluster`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 derived |
| Format | number |
| Description | Internal links from same topic cluster pages

### `p.content.internalLinks.topicalRelevance`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T6 AI |
| Format | score |
| Description | Topical relevance of internal links (anchor text match)

### `p.content.externalLinks.outContent`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 crawl |
| Format | number |
| Description | External links within content body

### `p.content.externalLinks.authority`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T3 |
| Format | score |
| Description | Average authority of externally linked domains

### `p.content.externalLinks.relevance`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T6 AI |
| Format | score |
| Description | Topical relevance of external links

---

## EX-C: Technical Expansion (85 additional)

### `p.tech.perf.loadClassMobile`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,L] |
| Sources | T1 CrUX mobile |
| Format | enum |
| Description | Performance classification for mobile

### `p.tech.perf.loadClassDesktop`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,L] |
| Sources | T1 CrUX desktop |
| Format | enum |
| Description | Performance classification for desktop

### `p.tech.perf.loadClassDelta`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,T] |
| Sources | T7 trend |
| Format | enum |
| Description | Performance class change vs previous crawl

### `p.tech.perf.ttfb.bucket`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,L] |
| Sources | T1 CrUX |
| Format | enum |
| Values | fast (<800ms), moderate (800-1800ms), slow (>1800ms) |
| Description | TTFB bucket for grid filtering

### `p.tech.perf.fcp.s`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,S,A] |
| Sources | T1 CrUX > T2 PSI |
| Format | duration |
| Description | First Contentful Paint (seconds, p75)

### `p.tech.perf.fcp.bucket`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,L] |
| Sources | T1 CrUX |
| Format | enum |
| Values | fast (<1.8s), moderate (1.8-3.0s), slow (>3.0s) |
| Description | FCP bucket

### `p.tech.perf.sii`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,A] |
| Sources | T2 PSI |
| Format | score |
| Description | Speed Index score

### `p.tech.perf.tbt`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,A] |
| Sources | T2 PSI |
| Format | duration |
| Description | Total Blocking Time (ms)

### `p.tech.perf.lcp.bucket`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,L] |
| Sources | T1 CrUX |
| Format | enum |
| Values | fast (<2.5s), moderate (2.5-4.0s), slow (>4.0s) |
| Description | LCP bucket for grid filtering

### `p.tech.perf.inp.bucket`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,L] |
| Sources | T1 CrUX |
| Format | enum |
| Values | good (<200ms), needs-improvement (200-500ms), poor (>500ms) |
| Description | INP bucket for grid filtering

### `p.tech.perf.cls.bucket`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,L] |
| Sources | T1 CrUX |
| Format | enum |
| Values | good (<0.1), needs-improvement (0.1-0.25), poor (>0.25) |
| Description | CLS bucket for grid filtering

### `p.tech.cwv.lcp.bucket`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,L] |
| Sources | T1 CrUX |
| Format | enum |
| Description | LCP bucket (same as p.tech.perf.lcp.bucket)

### `p.tech.cwv.inp.bucket`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,L] |
| Sources | T1 CrUX |
| Format | enum |
| Description | INP bucket

### `p.tech.cwv.cls.bucket`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,L] |
| Sources | T1 CrUX |
| Format | enum |
| Description | CLS bucket

### `p.tech.cwv.lcp.p50`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Sources | T1 CrUX |
| Format | duration |
| Description | LCP 50th percentile

### `p.tech.cwv.lcp.p90`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Sources | T1 CrUX |
| Format | duration |
| Description | LCP 90th percentile

### `p.tech.cwv.lcp.good`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Sources | T1 CrUX |
| Format | percent |
| Description | LCP good experiences percentage

### `p.tech.cwv.lcp.poor`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Sources | T1 CrUX |
| Format | percent |
| Description | LCP poor experiences percentage

### `p.tech.cwv.inp.p50`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Sources | T1 CrUX |
| Format | duration |
| Description | INP 50th percentile

### `p.tech.cwv.inp.p90`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Sources | T1 CrUX |
| Format | duration |
| Description | INP 90th percentile

### `p.tech.cwv.inp.good`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Sources | T1 CrUX |
| Format | percent |
| Description | INP good experiences percentage

### `p.tech.cwv.inp.poor`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Sources | T1 CrUX |
| Format | percent |
| Description | INP poor experiences percentage

### `p.tech.cwv.cls.p50`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Sources | T1 CrUX |
| Format | number |
| Description | CLS 50th percentile

### `p.tech.cwv.cls.p90`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Sources | T1 CrUX |
| Format | number |
| Description | CLS 90th percentile

### `p.tech.cwv.cls.good`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Sources | T1 CrUX |
| Format | percent |
| Description | CLS good experiences percentage

### `p.tech.cwv.cls.poor`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Sources | T1 CrUX |
| Format | percent |
| Description | CLS poor experiences percentage

### `p.tech.cwv.lcp.delta7d`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,T] |
| Sources | T1 CrUX trend |
| Format | duration |
| Description | LCP delta vs 7 days ago

### `p.tech.cwv.lcp.delta28d`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,T] |
| Sources | T1 CrUX trend |
| Format | duration |
| Description | LCP delta vs 28 days ago

### `p.tech.cwv.inp.delta7d`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,T] |
| Sources | T1 CrUX trend |
| Format | duration |
| Description | INP delta vs 7 days ago

### `p.tech.cwv.inp.delta28d`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,T] |
| Sources | T1 CrUX trend |
| Format | duration |
| Description | INP delta vs 28 days ago

### `p.tech.cwv.cls.delta7d`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,T] |
| Sources | T1 CrUX trend |
| Format | number |
| Description | CLS delta vs 7 days ago

### `p.tech.cwv.cls.delta28d`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,T] |
| Sources | T1 CrUX trend |
| Format | number |
| Description | CLS delta vs 28 days ago

### `p.tech.cwv.lcp.trend`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,T] |
| Sources | T1 CrUX trend |
| Format | json |
| Description | LCP trend data (time-series for charts)

### `p.tech.cwv.inp.trend`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,T] |
| Sources | T1 CrUX trend |
| Format | json |
| Description | INP trend data

### `p.tech.cwv.cls.trend`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,T] |
| Sources | T1 CrUX trend |
| Format | json |
| Description | CLS trend data

### `p.tech.renderBlocking.css`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 crawl |
| Format | number |
| Description | Render-blocking CSS resources

### `p.tech.renderBlocking.js`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 crawl |
| Format | number |
| Description | Render-blocking JavaScript resources

### `p.tech.renderBlocking.total`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,A] |
| Sources | T0 crawl |
| Format | number |
| Description | Total render-blocking resources

### `p.tech.renderBlocking.bytes`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 crawl |
| Format | bytes |
| Description | Total size of render-blocking resources

### `p.tech.thirdParty.scripts.count`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 crawl |
| Format | number |
| Description | Third-party script count

### `p.tech.thirdParty.scripts.bytes`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 crawl |
| Format | bytes |
| Description | Third-party script payload size

### `p.tech.thirdParty.domains.count`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 crawl |
| Format | number |
| Description | Unique third-party domain count

### `p.tech.thirdParty.domains.list`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T0 crawl |
| Format | list |
| Description | List of third-party domains loaded

### `p.tech.thirdParty.css.count`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 crawl |
| Format | number |
| Description | Third-party CSS file count

### `p.tech.thirdParty.css.bytes`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 crawl |
| Format | bytes |
| Description | Third-party CSS payload size

### `p.tech.thirdParty.images.count`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 crawl |
| Format | number |
| Description | Third-party image count

### `p.tech.thirdParty.images.bytes`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 crawl |
| Format | bytes |
| Description | Third-party image payload size

### `p.tech.thirdParty.fonts.count`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 crawl |
| Format | number |
| Description | Third-party font count

### `p.tech.thirdParty.fonts.bytes`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 crawl |
| Format | bytes |
| Description | Third-party font payload size

### `p.tech.jsRenderDep.mobile`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,L] |
| Sources | T7 mobile render diff |
| Format | percent |
| Description | JS render dependency on mobile

### `p.tech.jsRenderDep.delta`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,T] |
| Sources | T7 trend |
| Format | number |
| Description | JS render dependency change vs previous crawl

### `p.tech.sec.grade.mobile`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,L] |
| Sources | T7 mobile |
| Format | enum |
| Description | Security grade on mobile

### `p.tech.sec.headers.count`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T0 crawl |
| Format | number |
| Description | Count of security-related headers present

### `p.tech.sec.headers.missing`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 derived |
| Format | list |
| Description | Missing security headers (HSTS, CSP, X-Frame-Options, etc.)

### `p.tech.sec.xFrameOptions`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 crawl |
| Format | boolean |
| Description | X-Frame-Options header present

### `p.tech.sec.xContentTypeOptions`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 crawl |
| Format | boolean |
| Description | X-Content-Type-Options header present

### `p.tech.sec.referrerPolicy`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 crawl |
| Format | boolean |
| Description | Referrer-Policy header present

### `p.tech.sec.permissionsPolicy`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 crawl |
| Format | boolean |
| Description | Permissions-Policy header present

### `p.tech.sec.hsts.maxAge`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T0 crawl |
| Format | number |
| Description | HSTS max-age directive value

### `p.tech.sec.hsts.includeSubDomains`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T0 crawl |
| Format | boolean |
| Description | HSTS includeSubDomains directive

### `p.tech.sec.hsts.preload`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 crawl |
| Format | boolean |
| Description | HSTS preload directive

### `p.tech.sec.csp.directiveCount`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T0 crawl |
| Format | number |
| Description | Number of CSP directives

### `p.tech.sec.csp.reportOnly`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 crawl |
| Format | boolean |
| Description | Whether CSP is in report-only mode

### `p.tech.sec.cookies.total`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T0 crawl |
| Format | number |
| Description | Total cookie count

### `p.tech.sec.cookies.insecure`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,E] |
| Sources | T0 crawl |
| Format | number |
| Description | Insecure cookies (not Secure flag on HTTPS)

### `p.tech.sec.cookies.sameSite`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 crawl |
| Format | number |
| Description | Cookies with SameSite attribute

### `p.tech.sec.cookies.httpOnly`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 crawl |
| Format | number |
| Description | Cookies with HttpOnly flag

### `p.tech.sec.cookies.thirdParty`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 crawl |
| Format | number |
| Description | Third-party cookies detected

### `p.tech.sec.ssl.issuer`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T1 SSL check |
| Format | text |
| Description | SSL certificate issuer

### `p.tech.sec.ssl.subject`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T1 SSL check |
| Format | text |
| Description | SSL certificate subject

### `p.tech.sec.ssl.wildcard`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T1 SSL check |
| Format | boolean |
| Description | Whether SSL cert is wildcard

### `p.tech.sec.ssl.selfSigned`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,E] |
| Sources | T1 SSL check |
| Format | boolean |
| Description | Whether SSL cert is self-signed

### `p.tech.sec.mixedContent.types`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T0 crawl |
| Format | list |
| Description | Types of mixed content (image, script, iframe, etc.)

### `p.tech.a11y.score.mobile`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,L] |
| Sources | T7 axe mobile |
| Format | score |
| Description | Accessibility score on mobile viewport

### `p.tech.a11y.score.delta`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,T] |
| Sources | T7 trend |
| Format | number |
| Description | Accessibility score change vs previous crawl

### `p.tech.a11y.violations.critical`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,E] |
| Sources | T7 axe |
| Format | number |
| Description | Critical accessibility violations

### `p.tech.a11y.violations.serious`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 axe |
| Format | number |
| Description | Serious accessibility violations

### `p.tech.a11y.violations.moderate`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 axe |
| Format | number |
| Description | Moderate accessibility violations

### `p.tech.a11y.violations.minor`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 axe |
| Format | number |
| Description | Minor accessibility violations

### `p.tech.a11y.violations.types`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T7 axe |
| Format | list |
| Description | Unique violation rule IDs triggered

### `p.tech.a11y.passes`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T7 axe |
| Format | number |
| Description | Number of axe rules passed

### `p.tech.a11y.incomplete`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T7 axe |
| Format | number |
| Description | Number of axe rules needing manual review

### `p.tech.a11y.inapplicable`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T7 axe |
| Format | number |
| Description | Number of axe rules not applicable

### `p.tech.energy.carbonPerViewMobile`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Sources | T7 formula mobile |
| Format | number |
| Description | Carbon per view for mobile rendering

### `p.tech.energy.rating`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,L] |
| Sources | T7 derived |
| Format | enum |
| Values | A+, A, B, C, D, E, F |
| Description | Carbon efficiency grade

### `p.tech.energy.transferSize`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T0 crawl |
| Format | bytes |
| Description | Total page transfer size (all resources)

### `p.tech.energy.requests`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T0 crawl |
| Format | number |
| Description | Total HTTP requests

### `p.tech.crawlBudget.wasted_pct`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 derived |
| Format | percent |
| Description | Percentage of crawl budget wasted (duplicates, params, 404s)

### `p.tech.crawlBudget.googlebotHits`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,A] |
| Sources | T0 log file |
| Format | number |
| Description | Googlebot crawl hits in last 30 days

### `p.tech.crawlBudget.lastCrawl`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 log file |
| Format | date |
| Description | Last date Googlebot crawled this page

### `p.tech.crawlBudget.crawlFrequency`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 derived |
| Format | number |
| Description | Average Googlebot visits per week

### `p.tech.crawlBudget.vsTraffic`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 derived |
| Format | score |
| Description | Crawl budget efficiency vs traffic value

### `p.tech.coreUpdate.impact.lcp`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,T] |
| Sources | T7 overlay |
| Format | number |
| Description | LCP change during core update period

### `p.tech.coreUpdate.impact.content`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,T] |
| Sources | T7 overlay |
| Format | number |
| Description | Content-related ranking impact during update

### `p.tech.coreUpdate.impact.links`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,T] |
| Sources | T7 overlay |
| Format | number |
| Description | Link-related ranking impact during update

### `p.tech.consent.modeDetected`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,R] |
| Sources | T2 crawl |
| Format | boolean |
| Description | Whether consent mode is detected

### `p.tech.consent.gdprCompliant`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,R,A] |
| Sources | T2 crawl |
| Format | boolean |
| Description | Whether GDPR consent flow appears compliant

### `p.tech.cookieless.trackers`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T2 crawl |
| Format | list |
| Description | Cookieless tracking technologies detected

### `p.tech.cookieless.count`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,R] |
| Sources | T2 crawl |
| Format | number |
| Description | Count of cookieless tracking methods

### `p.tech.domNodes.mobile`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 mobile crawl |
| Format | number |
| Description | DOM node count on mobile

### `p.tech.domNodes.delta`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,T] |
| Sources | T7 trend |
| Format | number |
| Description | DOM node count change vs previous crawl

### `p.tech.httpVersion.isModern`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 derived |
| Format | boolean |
| Description | Whether using HTTP/2 or HTTP/3 (modern)

---

## EX-D: Links Expansion (38 additional)

### `p.links.inlinks.mobile`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,L] |
| Sources | T0 mobile crawl |
| Format | number |
| Description | Internal inlinks found on mobile crawl

### `p.links.inlinks.delta7d`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,T] |
| Sources | T3/T4 trend |
| Format | number |
| Description | Inlink change vs 7 days ago

### `p.links.inlinks.delta28d`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,T] |
| Sources | T3/T4 trend |
| Format | number |
| Description | Inlink change vs 28 days ago

### `p.links.inlinks.trend`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,T] |
| Sources | T3/T4 trend |
| Format | json |
| Description | Inlink count time-series

### `p.links.outlinks.internal`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 crawl |
| Format | number |
| Description | Internal outgoing links

### `p.links.outlinks.external`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 crawl |
| Format | number |
| Description | External outgoing links

### `p.links.outlinks.nofollow`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 crawl |
| Format | number |
| Description | Nofollow outgoing links

### `p.links.outlinks.sponsored`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 crawl |
| Format | number |
| Description | Sponsored outgoing links

### `p.links.outlinks.ugc`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 crawl |
| Format | number |
| Description | UGC outgoing links

### `p.links.outlinks.toSameDomain`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 crawl |
| Format | number |
| Description | Links to same domain (internal)

### `p.links.outlinks.toSubdomain`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 crawl |
| Format | number |
| Description | Links to different subdomain

### `p.links.referringDomains.trend`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,T] |
| Sources | T3/T4 trend |
| Format | json |
| Description | Referring domains count time-series

### `p.links.referringDomains.delta7d`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,T] |
| Sources | T3/T4 |
| Format | number |
| Description | Referring domain change vs 7 days ago

### `p.links.referringDomains.delta28d`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,T] |
| Sources | T3/T4 |
| Format | number |
| Description | Referring domain change vs 28 days ago

### `p.links.referringDomains.quality`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,S,A] |
| Sources | T3/T4 |
| Format | score |
| Description | Average quality of referring domains

### `p.links.referringDomains.topList`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T3/T4 |
| Format | list |
| Description | Top 10 referring domains by authority

### `p.links.backlinks.trend`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,T] |
| Sources | T3/T4 trend |
| Format | json |
| Description | Backlink count time-series

### `p.links.backlinks.new30d`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T3/T4 |
| Format | number |
| Description | New backlinks in last 30 days

### `p.links.backlinks.lost30d`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,E] |
| Sources | T3/T4 |
| Format | number |
| Description | Lost backlinks in last 30 days

### `p.links.backlinks.net30d`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 derived |
| Format | number |
| Description | Net backlink gain/loss in 30 days

### `p.links.urlRating.bucket`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,L] |
| Sources | T3 |
| Format | enum |
| Values | high (70-100), medium (40-69), low (10-39), none (0-9) |
| Description | URL rating bucket

### `p.links.urlRating.trend`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,T] |
| Sources | T3 trend |
| Format | json |
| Description | URL rating time-series

### `p.links.urlRating.delta`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,T] |
| Sources | T3 trend |
| Format | number |
| Description | URL rating change vs previous month

### `p.links.internalPagerank.bucket`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,L] |
| Sources | T7 PageRank |
| Format | enum |
| Values | high, medium, low, none |
| Description | Internal PageRank bucket

### `p.links.internalPagerank.percentile`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 PageRank |
| Format | number |
| Description | Internal PageRank percentile within site

### `p.links.internalPagerank.trend`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,T] |
| Sources | T7 trend |
| Format | json |
| Description | Internal PageRank time-series

### `p.links.linkEquity.bucket`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,L] |
| Sources | T7 derived |
| Format | enum |
| Values | high, medium, low, none |
| Description | Link equity bucket

### `p.links.broken.count`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,A,E] |
| Sources | T0 crawl |
| Format | number |
| Description | Total broken link count

### `p.links.broken.internal`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 crawl |
| Format | number |
| Description | Broken internal links

### `p.links.broken.external`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 crawl |
| Format | number |
| Description | Broken external links

### `p.links.broken.newSinceLastCrawl`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,E] |
| Sources | T7 trend |
| Format | number |
| Description | New broken links since last crawl

### `p.links.anchorCloud.topAnchors`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T3/T4 |
| Format | list |
| Description | Top 20 anchor text phrases

### `p.links.anchorCloud.topAnchorsByCount`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T3/T4 |
| Format | list |
| Description | Top 20 anchors sorted by count

### `p.links.anchorCloud.brandedCount`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T3/T4 |
| Format | number |
| Description | Count of branded anchor variations

### `p.links.anchorCloud.exactMatchCount`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T3/T4 |
| Format | number |
| Description | Count of exact-match anchor variations

### `p.links.anchorCloud.partialMatchCount`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T3/T4 |
| Format | number |
| Description | Count of partial-match anchor variations

### `p.links.anchorCloud.nakedUrlCount`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T3/T4 |
| Format | number |
| Description | Count of naked URL anchors

### `p.links.toxicBacklinkShare.bucket`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,L] |
| Sources | T3/T4 |
| Format | enum |
| Values | clean (<2%), low (2-5%), moderate (5-15%), high (>15%) |
| Description | Toxic backlink share bucket

### `p.links.toxicBacklinkCount`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T3/T4 |
| Format | number |
| Description | Absolute count of toxic backlinks

---

## EX-E: Search Expansion (53 additional)

### `p.search.gsc.clicks7d`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,A,T] |
| Sources | T0 GSC |
| Format | number |
| Description | GSC clicks (7d)

### `p.search.gsc.impr7d`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,A,T] |
| Sources | T0 GSC |
| Format | number |
| Description | GSC impressions (7d)

### `p.search.gsc.ctr7d`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,A,T] |
| Sources | T0 GSC |
| Format | percent |
| Description | GSC CTR (7d)

### `p.search.gsc.position7d`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,A,T] |
| Sources | T0 GSC |
| Format | number |
| Description | GSC average position (7d)

### `p.search.gsc.clicks90d`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,A,T] |
| Sources | T0 GSC |
| Format | number |
| Description | GSC clicks (90d)

### `p.search.gsc.impr90d`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,A,T] |
| Sources | T0 GSC |
| Format | number |
| Description | GSC impressions (90d)

### `p.search.gsc.ctr90d`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,A,T] |
| Sources | T0 GSC |
| Format | percent |
| Description | GSC CTR (90d)

### `p.search.gsc.position90d`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,A,T] |
| Sources | T0 GSC |
| Format | number |
| Description | GSC average position (90d)

### `p.search.gsc.clicks365d`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,T] |
| Sources | T0 GSC |
| Format | number |
| Description | GSC clicks (365d)

### `p.search.gsc.impr365d`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,T] |
| Sources | T0 GSC |
| Format | number |
| Description | GSC impressions (365d)

### `p.search.gsc.ctrTrend`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,T] |
| Sources | T0 GSC |
| Format | json |
| Description | CTR trend time-series (weekly data points)

### `p.search.gsc.positionTrend`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,T] |
| Sources | T0 GSC |
| Format | json |
| Description | Position trend time-series

### `p.search.gsc.clicksTrend`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,T] |
| Sources | T0 GSC |
| Format | json |
| Description | Clicks trend time-series

### `p.search.gsc.imprTrend`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,T] |
| Sources | T0 GSC |
| Format | json |
| Description | Impressions trend time-series

### `p.search.gsc.device.clicks`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Sources | T0 GSC |
| Format | json |
| Description | Clicks breakdown by device (mobile/desktop)

### `p.search.gsc.device.impr`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Sources | T0 GSC |
| Format | json |
| Description | Impressions breakdown by device

### `p.search.gsc.device.ctr`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Sources | T0 GSC |
| Format | json |
| Description | CTR breakdown by device

### `p.search.gsc.device.position`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Sources | T0 GSC |
| Format | json |
| Description | Position breakdown by device

### `p.search.gsc.country.clicks`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Sources | T0 GSC |
| Format | json |
| Description | Clicks breakdown by country (top 10)

### `p.search.gsc.country.impr`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Sources | T0 GSC |
| Format | json |
| Description | Impressions breakdown by country

### `p.search.gsc.country.position`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Sources | T0 GSC |
| Format | json |
| Description | Position breakdown by country

### `p.search.gsc.query.top10`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T0 GSC |
| Format | list |
| Description | Top 10 queries by clicks

### `p.search.gsc.query.top10impr`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T0 GSC |
| Format | list |
| Description | Top 10 queries by impressions

### `p.search.gsc.query.top10position`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T0 GSC |
| Format | list |
| Description | Top 10 queries by best position

### `p.search.gsc.query.branded`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T0 GSC |
| Format | list |
| Description | Branded queries driving traffic

### `p.search.gsc.query.nonBranded`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T0 GSC |
| Format | list |
| Description | Non-branded queries driving traffic

### `p.search.gsc.query.new28d`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T0 GSC |
| Format | list |
| Description | New queries appearing in last 28 days

### `p.search.gsc.query.lost28d`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T0 GSC |
| Format | list |
| Description | Queries lost in last 28 days

### `p.search.gsc.query.gaining28d`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T0 GSC |
| Format | list |
| Description | Queries with improving position

### `p.search.gsc.query.losing28d`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T0 GSC |
| Format | list |
| Description | Queries with declining position

### `p.search.gscCTR.bucket`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,L] |
| Sources | T7 derived |
| Format | enum |
| Values | high (>5%), average (2-5%), low (1-2%), very-low (<1%) |
| Description | CTR bucket relative to position

### `p.search.gscCTR.vsExpected`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 ExpectedCtrCurve |
| Format | number |
| Description | CTR vs expected CTR for current position

### `p.search.gscCTR.optimizable`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 derived |
| Format | boolean |
| Description | Whether CTR is significantly below expected (optimization opportunity)

### `p.search.totalKeywords.bucket`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,L] |
| Sources | T0 GSC |
| Format | enum |
| Values | high (>100), medium (20-100), low (5-20), minimal (<5) |
| Description | Keyword count bucket

### `p.search.keywordsTop3.bucket`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,L] |
| Sources | T0 GSC |
| Format | enum |
| Values | high (>10), medium (3-10), low (1-3), none (0) |
| Description | Top-3 keyword count bucket

### `p.search.keywordsTop10.bucket`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,L] |
| Sources | T0 GSC |
| Format | enum |
| Values | high (>20), medium (5-20), low (1-5), none (0) |
| Description | Top-10 keyword count bucket

### `p.search.serpFeatures.count`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T5 SERP scrape |
| Format | number |
| Description | Total SERP features present on this SERP

### `p.search.serpFeatures.owned.count`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T5 SERP scrape |
| Format | number |
| Description | Count of SERP features this page owns

### `p.search.featuredSnippet.position`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T5 SERP scrape |
| Format | number |
| Description | Position within featured snippet (if present)

### `p.search.peopleAlsoAsk.count`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T5 SERP scrape |
| Format | number |
| Description | Total PAA questions on this SERP

### `p.search.peopleAlsoAsk.ourAnswers`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T5 SERP scrape |
| Format | number |
| Description | PAA questions where we appear

### `p.search.knowledgePanel.position`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T5 SERP scrape |
| Format | number |
| Description | Position of our entity in knowledge panel

### `p.search.discover.clicks`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,T] |
| Sources | T0 GSC Discover |
| Format | number |
| Description | Google Discover clicks

### `p.search.discover.ctr`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Sources | T0 GSC Discover |
| Format | percent |
| Description | Google Discover CTR

### `p.search.discover.trend`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,T] |
| Sources | T0 GSC Discover |
| Format | json |
| Description | Google Discover trend time-series

### `p.search.news.clicks`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,T] |
| Sources | T0 GSC News |
| Format | number |
| Description | Google News clicks

### `p.search.news.ctr`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Sources | T0 GSC News |
| Format | percent |
| Description | Google News CTR

### `p.search.news.trend`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,T] |
| Sources | T0 GSC News |
| Format | json |
| Description | Google News trend time-series

### `p.search.trendFit.score`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,A] |
| Sources | T3 Google Trends |
| Format | score |
| Description | Trend fit score (0-1, how well page matches rising trends)

### `p.search.trendFit.topics`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T3 Google Trends |
| Format | list |
| Description | Related rising topics

### `p.search.internalSearch.terms.count`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 site search |
| Format | number |
| Description | Number of internal search terms leading here

### `p.search.internalSearch.terms.top`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T0 site search |
| Format | list |
| Description | Top internal search terms

### `p.search.internalSearch.satisfaction`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 site search + T7 |
| Format | score |
| Description | Internal search satisfaction score (did users find what they wanted?)

---

## EX-F: Analytics / Conversion Expansion (45 additional)

### `p.ga.sessions7d`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,A,T] |
| Sources | T0 GA4 |
| Format | number |
| Description | Sessions (7d)

### `p.ga.sessions90d`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,T] |
| Sources | T0 GA4 |
| Format | number |
| Description | Sessions (90d)

### `p.ga.sessions365d`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,T] |
| Sources | T0 GA4 |
| Format | number |
| Description | Sessions (365d)

### `p.ga.sessionsTrend`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,T] |
| Sources | T0 GA4 |
| Format | json |
| Description | Sessions trend time-series (weekly)

### `p.ga.conversionsTrend`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,T] |
| Sources | T0 GA4 |
| Format | json |
| Description | Conversions trend time-series

### `p.ga.revenueTrend`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,T] |
| Sources | T0 GA4 |
| Format | json |
| Description | Revenue trend time-series

### `p.ga.device.sessions`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Sources | T0 GA4 |
| Format | json |
| Description | Sessions by device (mobile/desktop/tablet)

### `p.ga.device.cvr`
| Field | Value |
|-------|-------|
| Level | P |
    Roles | [I,V] |
| Sources | T0 GA4 |
| Format | json |
| Description | Conversion rate by device

### `p.ga.device.revenue`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Sources | T0 GA4 |
| Format | json |
| Description | Revenue by device

### `p.ga.device.bounce`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Sources | T0 GA4 |
| Format | json |
| Description | Bounce rate by device

### `p.ga.country.sessions`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Sources | T0 GA4 |
| Format | json |
| Description | Sessions by country (top 10)

### `p.ga.country.cvr`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Sources | T0 GA4 |
| Format | json |
| Description | Conversion rate by country

### `p.ga.country.revenue`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Sources | T0 GA4 |
| Format | json |
| Description | Revenue by country

### `p.ga.channel.organic.sessions`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Sources | T0 GA4 |
| Format | number |
| Description | Organic sessions (28d)

### `p.ga.channel.organic.cvr`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Sources | T0 GA4 |
| Format | percent |
| Description | Organic conversion rate

### `p.ga.channel.organic.revenue`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Sources | T0 GA4 |
| Format | money |
| Description | Organic revenue

### `p.ga.channel.paid.sessions`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Sources | T0 GA4 |
| Format | number |
| Description | Paid sessions (28d)

### `p.ga.channel.paid.cvr`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Sources | T0 GA4 |
| Format | percent |
| Description | Paid conversion rate

### `p.ga.channel.paid.revenue`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Sources | T0 GA4 |
| Format | money |
| Description | Paid revenue

### `p.ga.channel.social.sessions`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Sources | T0 GA4 |
| Format | number |
| Description | Social sessions (28d)

### `p.ga.channel.social.cvr`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Sources | T0 GA4 |
| Format | percent |
| Description | Social conversion rate

### `p.ga.channel.email.sessions`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Sources | T0 GA4 |
| Format | number |
| Description | Email sessions (28d)

### `p.ga.channel.email.cvr`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Sources | T0 GA4 |
| Format | percent |
| Description | Email conversion rate

### `p.ga.channel.referral.sessions`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Sources | T0 GA4 |
| Format | number |
| Description | Referral sessions (28d)

### `p.ga.channel.referral.cvr`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Sources | T0 GA4 |
| Format | percent |
| Description | Referral conversion rate

### `p.ga.channel.direct.sessions`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Sources | T0 GA4 |
| Format | number |
| Description | Direct sessions (28d)

### `p.ga.channel.direct.cvr`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Sources | T0 GA4 |
| Format | percent |
| Description | Direct conversion rate

### `p.ga.channel.organic.trend`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,T] |
| Sources | T0 GA4 |
| Format | json |
| Description | Organic sessions trend

### `p.ga.channel.paid.trend`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,T] |
| Sources | T0 GA4 |
| Format | json |
| Description | Paid sessions trend

### `p.ga.revenuePerView.bucket`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,L] |
| Sources | T7 derived |
| Format | enum |
| Values | high, medium, low, none |
| Description | Revenue per view bucket

### `p.ga.isRevenueLosing.velocity`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,E] |
| Sources | T7 trend |
| Format | money |
| Description | Rate of revenue decline (per week)

### `p.ga.conversionRate.bucket`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,L] |
| Sources | T7 derived |
| Format | enum |
| Values | high (>5%), average (1-5%), low (0.5-1%), very-low (<0.5%) |
| Description | Conversion rate bucket

### `p.ga.conversionRate.vsAvg`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 derived |
| Format | number |
| Description | Conversion rate vs site average (multiplier)

### `p.ga.funnel.entry`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Sources | T0 GA4 |
| Format | number |
| Description | Funnel entry count (users entering funnel here)

### `p.ga.funnel.exit`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Sources | T0 GA4 |
| Format | number |
| Description | Funnel exit count (users dropping off here)

### `p.ga.funnel.conversion`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Sources | T0 GA4 |
| Format | number |
| Description | Funnel conversion count (users completing this step)

### `p.conv.rageClicks.bucket`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,L] |
| Sources | T7 derived |
| Format | enum |
| Values | none, low, medium, high |
| Description | Rage click severity bucket

### `p.conv.rageClicks.trend`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,T] |
| Sources | T2 behavior tools |
| Format | json |
| Description | Rage click trend time-series

### `p.conv.deadClicks.bucket`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,L] |
| Sources | T7 derived |
| Format | enum |
| Values | none, low, medium, high |
| Description | Dead click severity bucket

### `p.conv.errorClicks.bucket`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,L] |
| Sources | T7 derived |
| Format | enum |
| Values | none, low, medium, high |
| Description | Error click severity bucket

### `p.conv.uTurns.bucket`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,L] |
| Sources | T7 derived |
| Format | enum |
| Values | none, low, medium, high |
| Description | U-turn severity bucket

### `p.conv.scrollDead.bucket`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,L] |
| Sources | T7 derived |
| Format | enum |
| Values | none, low, medium, high |
| Description | Scroll dead zone severity bucket

### `p.conv.frictionScore`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,R,V,A] |
| Sources | T7 composite |
| Format | score |
| Description | Composite friction score (rage + dead + error + u-turns)

---

## EX-G: AI Expansion (22 additional)

### `p.ai.bots.detail`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T0 robots.txt |
| Format | json |
| Description | Per-bot status: {botName: allowed/blocked/unknown} for all 20+ AI bots

### `p.ai.bots.blockedList`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 robots.txt |
| Format | list |
| Description | Names of specifically blocked AI bots

### `p.ai.bots.allowedList`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T0 robots.txt |
| Format | list |
| Description | Names of explicitly allowed AI bots

### `p.ai.bots.noRule`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 robots.txt |
| Format | list |
| Description | AI bots with no specific rule (default behavior)

### `p.ai.llmsTxt.sections`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T0 fetch |
| Format | list |
| Description | Sections present in llms.txt (overview, preferred, discouraged)

### `p.ai.llmsTxt.linkCount`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 fetch |
| Format | number |
| Description | Number of links in llms.txt

### `p.ai.llmsTxt.freshness`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 fetch |
| Format | date |
| Description | Last modified date of llms.txt

### `p.ai.extractability.headings`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 derived |
| Format | score |
| Description | Heading structure quality for AI extraction

### `p.ai.extractability.lists`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 derived |
| Format | score |
| Description | List structure quality for AI extraction

### `p.ai.extractability.tables`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 derived |
| Format | score |
| Description | Table structure quality for AI extraction

### `p.ai.extractability.schema`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 derived |
| Format | score |
| Description | Schema markup quality for AI extraction

### `p.ai.extractability.overall`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,R,S,A] |
| Sources | T7 composite |
| Format | score |
| Description | Overall extractability composite score

### `p.ai.citation.allEngines`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T5 |
| Format | json |
| Description | Citation status across all engines: {openai: bool, anthropic: bool, ...}

### `p.ai.citation.count`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,A] |
| Sources | T5 |
| Format | number |
| Description | Number of AI engines citing this page

### `p.ai.citation.rate.bucket`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,L] |
| Sources | T7 derived |
| Format | enum |
| Values | high (>60%), medium (20-60%), low (5-20%), none (<5%) |
| Description | Citation rate bucket

### `p.ai.citation.trend`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,T] |
| Sources | T5 trend |
| Format | json |
| Description | Citation rate trend time-series

### `p.ai.overviewPresence.position`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T5 SERP scrape |
| Format | number |
| Description | Position within AI Overview (1-based)

### `p.ai.overviewPresence.quoteText`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T5 SERP scrape |
| Format | text |
| Description | Text excerpt used in AI Overview from our page

### `p.ai.overviewPresence.confidence`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T5 SERP scrape |
| Format | score |
| Description | Confidence that our page is cited in AI Overview

### `p.ai.sourceDiversity.count`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T5 |
| Format | number |
| Description | Number of pages from our domain cited alongside competitors

### `p.ai.sourceDiversity.share`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T5 |
| Format | percent |
| Description | Our share of AI citations among topic competitors

### `p.ai.entityLinking.rate`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T6 AI |
| Format | percent |
| Description | Percentage of entities linked to Wikipedia/Wikidata

### `p.ai.entityLinking.unlinked`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T6 AI |
| Format | list |
| Description | Entities without Wikipedia/Wikidata links

---

## EX-H: Social Expansion (18 additional)

### `p.social.shares.total.trend`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,T] |
| Sources | T3/T5 trend |
| Format | json |
| Description | Total social shares trend time-series

### `p.social.shares.fb.trend`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,T] |
| Sources | T3/T5 trend |
| Format | json |
| Description | Facebook shares trend

### `p.social.shares.x.trend`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,T] |
| Sources | T3/T5 trend |
| Format | json |
| Description | X/Twitter shares trend

### `p.social.shares.linkedin.trend`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,T] |
| Sources | T3/T5 trend |
| Format | json |
| Description | LinkedIn shares trend

### `p.social.og.titleOk`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 validator |
| Format | boolean |
| Description | Whether OG title renders correctly

### `p.social.og.descriptionOk`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 validator |
| Format | boolean |
| Description | Whether OG description renders correctly

### `p.social.og.imageOk`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 validator |
| Format | boolean |
| Description | Whether OG image loads and renders correctly

### `p.social.og.typeOk`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 validator |
| Format | boolean |
| Description | Whether og:type is correct for content type

### `p.social.og.urlOk`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 validator |
| Format | boolean |
| Description | Whether og:url matches canonical

### `p.social.og.siteNameOk`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 validator |
| Format | boolean |
| Description | Whether og:site_name is present and correct

### `p.social.twitter.cardOk`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 validator |
| Format | boolean |
| Description | Whether Twitter card renders correctly

### `p.social.twitter.titleOk`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 validator |
| Format | boolean |
| Description | Whether Twitter title renders correctly

### `p.social.twitter.descriptionOk`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 validator |
| Format | boolean |
| Description | Whether Twitter description renders correctly

### `p.social.twitter.imageOk`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 validator |
| Format | boolean |
| Description | Whether Twitter image loads correctly

### `p.social.twitter.siteOk`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 validator |
| Format | boolean |
| Description | Whether twitter:site is present

### `p.social.twitter.creatorOk`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 validator |
| Format | boolean |
| Description | Whether twitter:creator is present

### `p.social.og.missingTagsList`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T7 validator |
| Format | list |
| Description | List of specific missing OG tags

### `p.social.preconnects`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T0 crawl |
| Format | list |
| Description | Social media preconnect hints in HTML

---

## EX-I: Paid Expansion (18 additional)

### `p.paid.adCopy.text`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T0 Ads API |
| Format | text |
| Description | Ad copy text driving traffic to this page

### `p.paid.adCopy.headlineMatch`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T6 AI |
| Format | score |
| Description | Ad headline to page title match score

### `p.paid.adCopy.descriptionMatch`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T6 AI |
| Format | score |
| Description | Ad description to page content match score

### `p.paid.qualityScore.total`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,V,A] |
| Sources | T0 Ads API |
| Format | score |
| Description | Total Quality Score (1-10)

### `p.paid.qualityScore.landingPage`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,A] |
| Sources | T0 Ads API |
| Format | score |
| Description | Landing page experience component (1-10)

### `p.paid.qualityScore.adRelevance`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 Ads API |
| Format | score |
| Description | Ad relevance component (1-10)

### `p.paid.qualityScore.expCtr`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 Ads API |
| Format | score |
| Description | Expected CTR component (1-10)

### `p.paid.qualityScore.bucket`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,L] |
| Sources | T0 Ads API |
| Format | enum |
| Values | high (7-10), average (5-6), low (1-4) |
| Description | Quality Score bucket

### `p.paid.qualityScore.trend`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,T] |
| Sources | T0 Ads API |
| Format | json |
| Description | Quality Score trend time-series

### `p.paid.adCopy.types`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T0 Ads API |
| Format | list |
| Description | Ad types using this page (RSA, DSA, etc.)

### `p.paid.adCopy.assetCount`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 Ads API |
| Format | number |
| Description | Number of ad assets/headlines used

### `p.paid.adCopy.assetCoverage`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 Ads API |
| Format | score |
| Description | Asset coverage score (how many asset slots filled)

### `p.paid.spend.total`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Sources | T0 GA4 |
| Format | money |
| Description | Total ad spend driving to this page (28d)

### `p.paid.spend.trend`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,T] |
| Sources | T0 GA4 |
| Format | json |
| Description | Spend trend time-series

### `p.paid.conversions.total`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Sources | T0 GA4 |
| Format | number |
| Description | Total paid conversions (28d)

### `p.paid.roas`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,A] |
| Sources | T0 GA4 |
| Format | score |
| Description | Return on ad spend for this landing page

### `p.paid.cpc`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Sources | T0 GA4 |
| Format | money |
| Description | Average cost per click

### `p.paid.cpa`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,A] |
| Sources | T0 GA4 |
| Format | money |
| Description | Average cost per acquisition

---

## EX-J: Commerce Expansion (18 additional)

### `p.commerce.price.formatted`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T0 DOM |
| Format | text |
| Description | Price as displayed on page (with currency symbol)

### `p.commerce.price.schemaType`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 schema |
| Format | enum |
| Description | Schema price type (price, lowPrice, highPrice)

### `p.commerce.price.normalized`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Sources | T7 derived |
| Format | money |
| Description | Price normalized to USD for comparison

### `p.commerce.price.trend`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,T] |
| Sources | T3/T5 trend |
| Format | json |
| Description | Price history time-series

### `p.commerce.availability.lastOos`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 trend |
| Format | date |
| Description | Last date product was out of stock

### `p.commerce.availability.oosFreq`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 trend |
| Format | number |
| Description | Number of OOS periods in last 90 days

### `p.commerce.reviews.count.bucket`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,L] |
| Sources | T7 derived |
| Format | enum |
| Values | high (>100), medium (10-100), low (1-10), none (0) |
| Description | Review count bucket

### `p.commerce.reviews.avg.bucket`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,L] |
| Sources | T7 derived |
| Format | enum |
| Values | excellent (4.5-5), good (4.0-4.4), average (3.0-3.9), poor (<3.0) |
| Description | Review rating bucket

### `p.commerce.reviews.trend`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,T] |
| Sources | T3 trend |
| Format | json |
| Description | Review count trend time-series

### `p.commerce.reviews.sentiment`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T6 AI |
| Format | score |
| Description | Review sentiment score (-1 to 1)

### `p.commerce.reviews.topPositive`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T3 |
| Format | list |
| Description | Top positive review snippets

### `p.commerce.reviews.topNegative`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T3 |
| Format | list |
| Description | Top negative review snippets

### `p.commerce.images.count`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 crawl |
| Format | number |
| Description | Number of product images

### `p.commerce.images.avgSize`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 crawl |
| Format | bytes |
| Description | Average product image size

### `p.commerce.images.withAlt`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 crawl |
| Format | percent |
| Description | Product images with alt text

### `p.commerce.schema.productOk`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 validator |
| Format | boolean |
| Description | Whether Product schema is valid and complete

### `p.commerce.schema.offerOk`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 validator |
| Format | boolean |
| Description | Whether Offer schema within Product is valid

### `p.commerce.schema.reviewOk`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 validator |
| Format | boolean |
| Description | Whether AggregateRating/Review schema is valid

---

## EX-K: Local Expansion (22 additional)

### `e.local.nap.consistency.phone`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [V,A] |
| Format | score |
| Description | Phone number consistency across citations

### `e.local.nap.consistency.name`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [V,A] |
| Format | score |
| Description | Business name consistency across citations

### `e.local.nap.consistency.address`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [V,A] |
| Format | score |
| Description | Address consistency across citations

### `e.local.nap.consistency.website`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [V,A] |
| Format | score |
| Description | Website URL consistency across citations

### `e.local.gbp.completeness.name`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [V] |
| Format | boolean |
| Description | GBP name field filled

### `e.local.gbp.completeness.description`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [V] |
| Format | boolean |
| Description | GBP description field filled

### `e.local.gbp.completeness.category`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [V] |
| Format | boolean |
| Description | GBP category selected

### `e.local.gbp.completeness.photos`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [V] |
| Format | boolean |
| Description | GBP photos uploaded

### `e.local.gbp.completeness.posts`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [V] |
| Format | boolean |
| Description | GBP has recent posts

### `e.local.gbp.completeness.qa`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [V] |
| Format | boolean |
| Description | GBP Q&A section populated

### `e.local.reviews.rating.distribution`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [I,V] |
| Format | json |
| Description | Star rating distribution (1-5 count)

### `e.local.reviews.keywords.positive`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [I,V] |
| Format | list |
| Description | Top positive keywords in reviews

### `e.local.reviews.keywords.negative`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [I,V] |
| Format | list |
| Description | Top negative keywords in reviews

### `e.local.reviews.responseTime`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [V,A] |
| Format | duration |
| Description | Average owner response time

### `e.local.reviews.sentiment.trend`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [V,T] |
| Format | json |
| Description | Review sentiment trend time-series

### `e.local.citations.sources.count`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [V,A] |
| Format | number |
| Description | Number of citation sources found

### `e.local.citations.sources.list`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [V,X] |
| Format | list |
| Description | List of citation sources with status

### `e.local.citations.inconsistencies`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [V,A,E] |
| Format | list |
| Description | Citations with NAP inconsistencies

### `e.local.rankGeogrid.center`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [V] |
| Format | json |
| Description | Geogrid center coordinates

### `e.local.rankGeogrid.radius`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [V] |
| Format | number |
| Description | Geogrid radius in km/miles

### `e.local.rankGeogrid.avg`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [V,K] |
| Format | number |
| Description | Average local pack rank across grid

### `e.local.rankGeogrid.trend`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [V,T] |
| Format | json |
| Description | Geogrid average rank trend

---

## EX-L: UX Expansion (12 additional)

### `p.ux.scroll.depth.p25`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Sources | T2 behavior tools |
| Format | percent |
| Description | 25th percentile scroll depth

### `p.ux.scroll.depth.p50`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Sources | T2 behavior tools |
| Format | percent |
| Description | Median scroll depth

### `p.ux.scroll.depth.p75`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Sources | T2 behavior tools |
| Format | percent |
| Description | 75th percentile scroll depth

### `p.ux.scroll.depth.p90`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Sources | T2 behavior tools |
| Format | percent |
| Description | 90th percentile scroll depth

### `p.ux.scroll.depth.avg`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,V,A] |
| Sources | T2 behavior tools |
| Format | percent |
| Description | Average scroll depth

### `p.ux.scroll.deadZones`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T2 behavior tools |
| Format | list |
| Description | Scroll dead zone areas (no engagement zones)

### `p.ux.timeOnPage.avg`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,V,A] |
| Sources | T0 GA4 |
| Format | duration |
| Description | Average time on page

### `p.ux.timeOnPage.p50`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Sources | T0 GA4 |
| Format | duration |
| Description | Median time on page

### `p.ux.timeOnPage.p90`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Sources | T0 GA4 |
| Format | duration |
| Description | 90th percentile time on page

### `p.ux.interactions.count`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T2 behavior tools |
| Format | number |
| Description | Total interaction events (clicks, scrolls, inputs)

### `p.ux.interactions.rageRate`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T2 behavior tools |
| Format | percent |
| Description | Rage click rate (rage clicks / total clicks)

### `p.ux.interactions.deadRate`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T2 behavior tools |
| Format | percent |
| Description | Dead click rate (dead clicks / total clicks)

---

## EX-M: Site-level Aggregates Expansion (55 additional)

### `s.pages.total`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [H,R,K] |
| Format | number |
| Description | Total pages crawled in this session

### `s.pages.indexable`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [H,R,K] |
| Format | number |
| Description | Total indexable pages

### `s.pages.nonIndexable`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,A] |
| Format | number |
| Description | Non-indexable pages count

### `s.pages.orphan`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,A,E] |
| Format | number |
| Description | Orphan page count

### `s.pages.nearOrphan`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,A] |
| Format | number |
| Description | Near-orphan page count (≤2 inlinks)

### `s.pages.soft404`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,A,E] |
| Format | number |
| Description | Soft 404 page count

### `s.pages.duplicate.exact`
| Field | Value |
|-------|-------|
| Level | S |
    Roles | [R,A,E] |
| Format | number |
| Description | Pages with exact duplicates

### `s.pages.duplicate.near`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,A] |
| Format | number |
| Description | Pages in near-duplicate clusters

### `s.pages.duplicate.clusterCount`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,A] |
| Format | number |
| Description | Number of duplicate clusters

### `s.pages.cannibalized`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,A,E] |
| Format | number |
| Description | Pages involved in cannibalization

### `s.pages.cannibalizationGroups`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,A] |
| Format | number |
| Description | Number of cannibalization groups

### `s.statusCodes.200`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,L] |
| Format | number |
| Description | Pages returning 200

### `s.statusCodes.301`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,L] |
| Format | number |
| Description | Pages returning 301 redirect

### `s.statusCodes.302`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,L] |
| Format | number |
| Description | Pages returning 302 redirect

### `s.statusCodes.404`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,A,E] |
| Format | number |
| Description | Pages returning 404

### `s.statusCodes.500`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,A,E] |
| Format | number |
| Description | Pages returning 500+

### `s.statusCodes.distribution`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,V] |
| Format | json |
| Description | Full status code distribution

### `s.content.wordCount.avg`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | number |
| Description | Average word count across all pages

### `s.content.wordCount.total`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | number |
| Description | Total word count across all pages

### `s.content.readability.avg`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | score |
| Description | Average readability score

### `s.content.freshness.avgDays`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | number |
| Description | Average days since last update

### `s.content.freshness.staleCount`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,A] |
| Format | number |
| Description | Pages with stale content (>180d)

### `s.content.freshness.freshCount`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | number |
| Description | Pages with fresh content (<30d)

### `s.tech.cwv.good`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | percent |
| Description | Percentage of pages with good CWV

### `s.tech.cwv.needsImprovement`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | percent |
| Description | Percentage of pages needing CWV improvement

### `s.tech.cwv.poor`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,A,E] |
| Format | percent |
| Description | Percentage of pages with poor CWV

### `s.tech.cwv.avgLcp`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | duration |
| Description | Average LCP across sampled pages

### `s.tech.cwv.avgInp`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | duration |
| Description | Average INP across sampled pages

### `s.tech.cwv.avgCls`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | number |
| Description | Average CLS across sampled pages

### `s.tech.sec.grade.distribution`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,V] |
| Format | json |
| Description | Security grade distribution across pages

### `s.tech.sec.grade.avg`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | score |
| Description | Average security score

### `s.tech.a11y.score.avg`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | score |
| Description | Average accessibility score

### `s.tech.a11y.violations.total`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,A] |
| Format | number |
| Description | Total accessibility violations across site

### `s.tech.energy.totalCarbon`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,V] |
| Format | number |
| Description | Estimated total site carbon footprint

### `s.tech.energy.avgCarbonPerView`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,V] |
| Format | number |
| Description | Average carbon per page view

### `s.tech.energy.rating`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,V] |
| Format | enum |
| Description | Site-wide carbon efficiency grade

### `s.search.totalKeywords`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [H,R,K] |
| Format | number |
| Description | Total keywords ranking for site

### `s.search.keywordsTop3`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [H,R,K] |
| Format | number |
| Description | Keywords in top 3 positions

### `s.search.keywordsTop10`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [H,R,K] |
| Format | number |
| Description | Keywords in top 10 positions

### `s.search.totalClicks`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [H,R,K] |
| Format | number |
| Description | Total GSC clicks (28d)

### `s.search.totalImpr`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [H,R,K] |
| Format | number |
| Description | Total GSC impressions (28d)

### `s.search.avgCtr`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | percent |
| Description | Site-wide average CTR

### `s.search.avgPosition`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | number |
| Description | Site-wide average position

### `s.ga.totalSessions`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [H,R,K] |
| Format | number |
| Description | Total sessions (28d)

### `s.ga.totalRevenue`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [H,R,K] |
| Format | money |
| Description | Total revenue (28d)

### `s.ga.avgCvr`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [H,R,K] |
| Format | percent |
| Description | Site-wide average conversion rate

### `s.ga.totalConversions`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [H,R,K] |
| Format | number |
| Description | Total conversions (28d)

### `s.links.totalInlinks`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | number |
| Description | Total internal inlinks across site

### `s.links.totalOutlinks`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | number |
| Description | Total outgoing links

### `s.links.totalRefDomains`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [H,R,K] |
| Format | number |
| Description | Total unique referring domains

### `s.links.totalBacklinks`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [H,R,K] |
| Format | number |
| Description | Total backlinks

### `s.links.avgPagerank`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | score |
| Description | Average internal PageRank

### `s.links.brokenCount`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,A,E] |
| Format | number |
| Description | Total broken links across site

### `s.links.redirectCount`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,A] |
| Format | number |
| Description | Total redirect links

### `s.ai.avgCitationRate`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | percent |
| Description | Average AI citation rate across all pages

### `s.ai.pagesCited`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | number |
| Description | Number of pages cited by AI engines

### `s.ai.llmsTxtPresent`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | boolean |
| Description | Whether llms.txt exists

### `s.ai.botsAllowedCount`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | number |
| Description | Number of AI bots allowed

### `s.ai.botsBlockedCount`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,A] |
| Format | number |
| Description | Number of AI bots blocked

---

## EX-N: Background Expansion (15 additional)

### `b.backlinks.lastRefresh`
| Field | Value |
|-------|-------|
| Level | B |
| Format | date |
| Description | Timestamp of last backlink data refresh

### `b.gsc.lastSync`
| Field | Value |
|-------|-------|
| Level | B |
| Format | date |
| Description | Timestamp of last GSC data sync

### `b.ga4.lastSync`
| Field | Value |
|-------|-------|
| Level | B |
| Format | date |
| Description | Timestamp of last GA4 data sync

### `b.crux.lastSync`
| Field | Value |
|-------|-------|
| Level | B |
| Format | date |
| Description | Timestamp of last CrUX data sync

### `b.serp.lastScrape`
| Field | Value |
|-------|-------|
| Level | B |
| Format | date |
| Description | Timestamp of last SERP scrape

### `b.ai.lastHarness`
| Field | Value |
|-------|-------|
| Level | B |
| Format | date |
| Description | Timestamp of last AI citation harness run

### `b.social.lastMentionCheck`
| Field | Value |
|-------|-------|
| Level | B |
| Format | date |
| Description | Timestamp of last social mention check

### `b.social.lastFollowerSync`
| Field | Value |
|-------|-------|
| Level | B |
| Format | date |
| Description | Timestamp of last follower count sync

### `b.blacklist.lastCheck`
| Field | Value |
|-------|-------|
| Level | B |
| Format | date |
| Description | Timestamp of last blacklist check

### `b.blacklist.status`
| Field | Value |
|-------|-------|
| Level | B |
| Format | enum |
| Values | clean, flagged, unknown |
| Description | Current blacklist status

### `b.logfile.lastIngest`
| Field | Value |
|-------|-------|
| Level | B |
| Format | date |
| Description | Timestamp of last log file ingestion

### `b.logfile.coverage`
| Field | Value |
|-------|-------|
| Level | B |
| Format | percent |
| Description | Percentage of pages with log data

### `b.core.update.lastEvent`
| Field | Value |
|-------|-------|
| Level | B |
| Format | date |
| Description | Date of last detected core update

### `b.gbp.lastSync`
| Field | Value |
|-------|-------|
| Level | B |
| Format | date |
| Description | Timestamp of last GBP data sync

### `b.shopping.lastFeedCheck`
| Field | Value |
|-------|-------|
| Level | B |
| Format | date |
| Description | Timestamp of last shopping feed validation

---

## EX-O: Entity Expansion (25 additional)

### `e.competitor.overview`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [R,X] |
| Format | json |
| Description | Competitor overview: {domain, traffic, keywords, da, pages}

### `e.competitor.topPages`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [R,V] |
| Format | list |
| Description | Top 10 competitor pages by traffic

### `e.competitor.topKeywords`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [R,V] |
| Format | list |
| Description | Top 20 competitor keywords

### `e.competitor.contentTypes`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [R,V] |
| Format | json |
| Description | Competitor content type distribution

### `e.competitor.updateFrequency`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [R,V] |
| Format | number |
| Description | Average content updates per week

### `e.competitor.schemaTypes`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [R,V] |
| Format | list |
| Description | Schema types used by competitor

### `e.competitor.techStackDetail`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [R,V] |
| Format | json |
| Description | Detailed tech stack breakdown

### `e.competitor.backlinks.total`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [R,V] |
| Format | number |
| Description | Competitor total backlinks

### `e.competitor.backlinks.refDomains`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [R,V] |
| Format | number |
| Description | Competitor referring domains

### `e.competitor.backlinks.da`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [R,V] |
| Format | score |
| Description | Competitor domain authority

### `e.competitor.organic.traffic`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [R,V] |
| Format | number |
| Description | Competitor estimated organic traffic

### `e.competitor.organic.keywords`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [R,V] |
| Format | number |
| Description | Competitor organic keyword count

### `e.competitor.organic.trafficTrend`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [R,V,T] |
| Format | json |
| Description | Competitor organic traffic trend

### `e.competitor.paid.traffic`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [R,V] |
| Format | number |
| Description | Competitor estimated paid traffic

### `e.competitor.paid.keywords`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [R,V] |
| Format | number |
| Description | Competitor paid keyword count

### `e.competitor.paid.spend`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [R,V] |
| Format | money |
| Description | Competitor estimated ad spend

### `e.competitor.social.profiles`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [R,V] |
| Format | list |
| Description | Competitor social media profiles

### `e.competitor.social.followers`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [R,V] |
| Format | json |
| Description | Competitor follower counts per platform

### `e.competitor.serp.features`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [R,V] |
| Format | json |
| Description | Competitor SERP feature ownership

### `e.competitor.content.quality`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [R,V] |
| Format | score |
| Description | Competitor average content quality score

### `e.competitor.content.gaps`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [R,V,A] |
| Format | list |
| Description | Topics competitors cover but we don't

### `e.competitor.content.ourGaps`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [R,V,A] |
| Format | list |
| Description | Topics we cover but competitor doesn't

### `e.competitor.link.gaps`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [R,V,A] |
| Format | list |
| Description | Link opportunities: sites linking to competitor but not us

### `e.competitor.winRate`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [R,V] |
| Format | percent |
| Description | Percentage of keywords where we outrank competitor

### `e.competitor.lossRate`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [R,V] |
| Format | percent |
| Description | Percentage of keywords where competitor outranks us

---

## EX-P: Universal Config Expansion (10 additional)

### `u.thresholds.wordCount`
| Field | Value |
|-------|-------|
| Level | U |
| Format | json |
| Description | Word count thresholds: {thin: 300, short: 800, medium: 1500, long: 3000}

### `u.thresholds.readability`
| Field | Value |
|-------|-------|
| Level | U |
| Format | json |
| Description | Readability thresholds per grade level

### `u.thresholds.cwv`
| Field | Value |
|-------|-------|
| Level | U |
| Format | json |
| Description | CWV thresholds: {lcp: {good: 2.5, poor: 4.0}, inp: {good: 200, poor: 500}, cls: {good: 0.1, poor: 0.25}}

### `u.thresholds.security`
| Field | Value |
|-------|-------|
| Level | U |
| Format | json |
| Description | Security grade thresholds and header requirements

### `u.thresholds.a11y`
| Field | Value |
|-------|-------|
| Level | U |
| Format | json |
| Description | Accessibility score thresholds and violation severity mappings

### `u.scoringWeights.content`
| Field | Value |
|-------|-------|
| Level | U |
| Format | json |
| Description | Content score dimension weights

### `u.scoringWeights.tech`
| Field | Value |
|-------|-------|
| Level | U |
| Format | json |
| Description | Tech score dimension weights

### `u.scoringWeights.search`
| Field | Value |
|-------|-------|
| Level | U |
| Format | json |
| Description | Search score dimension weights

### `u.scoringWeights.overall`
| Field | Value |
|-------|-------|
| Level | U |
| Format | json |
| Description | Overall Q-score dimension weights

### `u.actionBands.multipliers`
| Field | Value |
|-------|-------|
| Level | U |
| Format | json |
| Description | Band score multipliers: {BLOCKING: 5.0, REVENUE_LOSS: 3.0, HIGH_LEVERAGE: 2.0, STRATEGIC: 1.5, HYGIENE: 1.0}

---

## EX-Q: Final Expansion — Reaching ~1,700 Metrics

> Additional metrics covering: cluster-level aggregates, more device/country
> breakdowns, scoring sub-components, action-outcome tracking, diagnostic
> anomaly flags, more temporal variants, and granular sub-metrics.

---

## EX-Q.1: Cluster-Level `k.*` Expansion (35 additional)

### `k.name`
| Field | Value |
|-------|-------|
| Level | K |
| Roles | [G,I,R,L,V] |
| Format | text |
| Description | Cluster topic name (AI-generated)

### `k.pageCount`
| Field | Value |
|-------|-------|
| Level | K |
| Roles | [G,R,K] |
| Format | number |
| Description | Number of pages in this cluster

### `k.totalClicks`
| Field | Value |
|-------|-------|
| Level | K |
| Roles | [R,K] |
| Format | number |
| Description | Total GSC clicks for cluster (28d)

### `k.totalImpr`
| Field | Value |
|-------|-------|
| Level | K |
| Roles | [R,K] |
| Format | number |
| Description | Total GSC impressions for cluster (28d)

### `k.avgCtr`
| Field | Value |
|-------|-------|
| Level | K |
| Roles | [R,K] |
| Format | percent |
| Description | Average CTR across cluster pages

### `k.avgPosition`
| Field | Value |
|-------|-------|
| Level | K |
| Roles | [R,K] |
| Format | number |
| Description | Average ranking position across cluster

### `k.totalSessions`
| Field | Value |
|-------|-------|
| Level | K |
| Roles | [R,K] |
| Format | number |
| Description | Total GA4 sessions for cluster (28d)

### `k.totalRevenue`
| Field | Value |
|-------|-------|
| Level | K |
| Roles | [R,K] |
| Format | money |
| Description | Total revenue from cluster (28d)

### `k.avgCvr`
| Field | Value |
|-------|-------|
| Level | K |
| Roles | [R,K] |
| Format | percent |
| Description | Average conversion rate across cluster

### `k.totalKeywords`
| Field | Value |
|-------|-------|
| Level | K |
| Roles | [R,K] |
| Format | number |
| Description | Total ranking keywords for cluster

### `k.keywordsTop10`
| Field | Value |
|-------|-------|
| Level | K |
| Roles | [R,K] |
| Format | number |
| Description | Keywords in top 10 for cluster

### `k.avgWordCount`
| Field | Value |
|-------|-------|
| Level | K |
| Roles | [R,K] |
| Format | number |
| Description | Average word count across cluster pages

### `k.avgReadability`
| Field | Value |
|-------|-------|
| Level | K |
| Roles | [R,K] |
| Format | score |
| Description | Average readability score across cluster

### `k.avgFreshness`
| Field | Value |
|-------|-------|
| Level | K |
| Roles | [R,K] |
| Format | number |
| Description | Average days since last update

### `k.avgInlinks`
| Field | Value |
|-------|-------|
| Level | K |
| Roles | [R,K] |
| Format | number |
| Description | Average internal inlinks per page

### `k.avgPagerank`
| Field | Value |
|-------|-------|
| Level | K |
| Roles | [R,K] |
| Format | score |
| Description | Average internal PageRank

### `k.totalRefDomains`
| Field | Value |
|-------|-------|
| Level | K |
| Roles | [R,K] |
| Format | number |
| Description | Total referring domains to cluster pages

### `k.orphanCount`
| Field | Value |
|-------|-------|
| Level | K |
| Roles | [R,A] |
| Format | number |
| Description | Orphan pages in cluster

### `k.cannibalizedCount`
| Field | Value |
|-------|-------|
| Level | K |
| Roles | [R,A,E] |
| Format | number |
| Description | Pages involved in cannibalization within cluster

### `k.coverage.score`
| Field | Value |
|-------|-------|
| Level | K |
| Roles | [R,A] |
| Format | score |
| Description | Topic coverage score (how thoroughly cluster covers the topic)

### `k.coverage.gaps`
| Field | Value |
|-------|-------|
| Level | K |
| Roles | [R,A] |
| Format | list |
| Description | Sub-topics not covered in cluster

### `k.coverage.depth`
| Field | Value |
|-------|-------|
| Level | K |
| Roles | [R,A] |
| Format | score |
| Description | Average topic depth across cluster

### `k.score.content`
| Field | Value |
|-------|-------|
| Level | K |
| Roles | [R,K] |
| Format | score |
| Description | Cluster content quality score

### `k.score.search`
| Field | Value |
|-------|-------|
| Level | K |
| Roles | [R,K] |
| Format | score |
| Description | Cluster search performance score

### `k.score.tech`
| Field | Value |
|-------|-------|
| Level | K |
| Roles | [R,K] |
| Format | score |
| Description | Cluster technical health score

### `k.score.links`
| Field | Value |
|-------|-------|
| Level | K |
| Roles | [R,K] |
| Format | score |
| Description | Cluster link authority score

### `k.score.overall`
| Field | Value |
|-------|-------|
| Level | K |
| Roles | [R,K] |
| Format | score |
| Description | Cluster overall quality score

### `k.intent.primary`
| Field | Value |
|-------|-------|
| Level | K |
| Roles | [R,L,A] |
| Format | enum |
| Description | Primary search intent for cluster

### `k.intent.funnel`
| Field | Value |
|-------|-------|
| Level | K |
| Roles | [R,L,A] |
| Format | enum |
| Description | Primary funnel stage for cluster

### `k.trend.clicks`
| Field | Value |
|-------|-------|
| Level | K |
| Roles | [R,V,T] |
| Format | json |
| Description | Cluster clicks trend time-series

### `k.trend.sessions`
| Field | Value |
|-------|-------|
| Level | K |
| Roles | [R,V,T] |
| Format | json |
| Description | Cluster sessions trend

### `k.trend.revenue`
| Field | Value |
|-------|-------|
| Level | K |
| Roles | [R,V,T] |
| Format | json |
| Description | Cluster revenue trend

### `k.trend.keywords`
| Field | Value |
|-------|-------|
| Level | K |
| Roles | [R,V,T] |
| Format | json |
| Description | Cluster keyword count trend

### `k.internalLinks.inbound`
| Field | Value |
|-------|-------|
| Level | K |
| Roles | [R,A] |
| Format | number |
| Description | Internal links from outside the cluster

### `k.internalLinks.internal`
| Field | Value |
|-------|-------|
| Level | K |
| Roles | [R,A] |
| Format | number |
| Description | Internal links within the cluster

---

## EX-Q.2: More Site-Level Breakdowns (45 additional)

### `s.content.contentType.distribution`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,V] |
| Format | json |
| Description | Content type distribution: {article: N, product: N, landing: N, ...}

### `s.content.contentType.counts`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,L] |
| Format | json |
| Description | Count per content type classification

### `s.content.topic.clusterCount`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | number |
| Description | Number of topic clusters detected

### `s.content.topic.avgCoverage`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | score |
| Description | Average topic coverage across clusters

### `s.content.topic.avgDepth`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | score |
| Description | Average topic depth across clusters

### `s.content.topic.topClusters`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,V] |
| Format | list |
| Description | Top 10 clusters by traffic

### `s.content.schema.typesPresent`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,V] |
| Format | list |
| Description | All schema types found across site

### `s.content.schema.coverage`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | percent |
| Description | Percentage of pages with valid schema

### `s.content.schema.eligibleRich`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | percent |
| Description | Percentage of pages eligible for rich results

### `s.content.schema.errorsTotal`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,A] |
| Format | number |
| Description | Total schema validation errors across site

### `s.content.images.totalCount`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | number |
| Description | Total images across all pages

### `s.content.images.missingAltTotal`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,A] |
| Format | number |
| Description | Total images missing alt text

### `s.content.images.legacyFmtTotal`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,A] |
| Format | number |
| Description | Total images in legacy formats

### `s.content.images.avgPerProduct`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | number |
| Description | Average images per product page

### `s.tech.pages.mobileFriendly`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | percent |
| Description | Percentage of mobile-friendly pages

### `s.tech.pages.https`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | percent |
| Description | Percentage of HTTPS pages

### `s.tech.pages.http2`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | percent |
| Description | Percentage using HTTP/2+

### `s.tech.pages.renderBlocking`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,A] |
| Format | number |
| Description | Pages with render-blocking resources

### `s.tech.pages.highJsDep`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,A] |
| Format | number |
| Description | Pages with >60% JS render dependency

### `s.tech.pages.secGradeA`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,V] |
| Format | number |
| Description | Pages with security grade A/A+

### `s.tech.pages.secGradeF`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,A,E] |
| Format | number |
| Description | Pages with security grade F

### `s.tech.pages.a11yGood`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | number |
| Description | Pages with a11y score >90

### `s.tech.pages.a11yPoor`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,A] |
| Format | number |
| Description | Pages with a11y score <50

### `s.search.distribution.position1to3`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,V] |
| Format | number |
| Description | Keywords in positions 1-3

### `s.search.distribution.position4to10`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,V] |
| Format | number |
| Description | Keywords in positions 4-10

### `s.search.distribution.position11to20`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,V] |
| Format | number |
| Description | Keywords in positions 11-20

### `s.search.distribution.position21to50`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,V] |
| Format | number |
| Description | Keywords in positions 21-50

### `s.search.distribution.position51to100`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,V] |
| Format | number |
| Description | Keywords in positions 51-100

### `s.search.intent.distribution`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,V] |
| Format | json |
| Description | Keyword intent distribution: {informational: N, transactional: N, ...}

### `s.search.featuredSnippet.owned`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | number |
| Description | Featured snippets owned

### `s.search.featuredSnippet.possible`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,A] |
| Format | number |
| Description | Featured snippet opportunities (top-5 position, no snippet owned)

### `s.search.paa.owned`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | number |
| Description | People Also Ask appearances

### `s.search.serpFeatures.total`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,V] |
| Format | number |
| Description | Total SERP feature appearances

### `s.search.brand.vsNonBrand`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,V] |
| Format | json |
| Description | Brand vs non-brand traffic split

### `s.search.brand.ctr`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,V] |
| Format | percent |
| Description | Brand keyword CTR

### `s.search.nonBrand.ctr`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,V] |
| Format | percent |
| Description | Non-brand keyword CTR

### `s.ga.channel.distribution`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,V] |
| Format | json |
| Description | Traffic channel distribution: {organic: %, paid: %, social: %, ...}

### `s.ga.device.distribution`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,V] |
| Format | json |
| Description | Device distribution: {mobile: %, desktop: %, tablet: %}

### `s.ga.country.top10`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,V] |
| Format | list |
| Description | Top 10 countries by sessions

### `s.ga.newVsReturn.ratio`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,V] |
| Format | json |
| Description | New vs returning user ratio

### `s.ga.engagement.avg`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | score |
| Description | Average engagement score

### `s.links.pagerank.distribution`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,V] |
| Format | json |
| Description | Internal PageRank distribution histogram

### `s.links.pagerank.topPages`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,V] |
| Format | list |
| Description | Top 10 pages by internal PageRank

### `s.links.pagerank.bottomPages`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,A] |
| Format | list |
| Description | Bottom 10 pages by internal PageRank

### `s.links.anchorCloud.topAnchors`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,V] |
| Format | list |
| Description | Top 20 anchor text phrases site-wide

### `s.links.toxic.total`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,A] |
| Format | number |
| Description | Total toxic backlinks across site

### `s.links.toxic.share`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,A] |
| Format | percent |
| Description | Toxic backlink share site-wide

### `s.ai.citationsPerEngine`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,V] |
| Format | json |
| Description | Citation count per AI engine: {openai: N, anthropic: N, ...}

### `s.ai.extractability.avg`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | score |
| Description | Average AI extractability score

### `s.ai.llmsTxt.links`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | number |
| Description | Total links in llms.txt

---

## EX-Q.3: Action Outcome Tracking (35 additional)

### `s.actions.total`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [H,R,K] |
| Format | number |
| Description | Total actions proposed

### `s.actions.blocking`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,A] |
| Format | number |
| Description | Blocking-priority actions count

### `s.actions.revenueLoss`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,A] |
| Format | number |
| Description | Revenue-loss-priority actions count

### `s.actions.highLeverage`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,A] |
| Format | number |
| Description | High-leverage actions count

### `s.actions.strategic`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,A] |
| Format | number |
| Description | Strategic-priority actions count

### `s.actions.hygiene`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,A] |
| Format | number |
| Description | Hygiene actions count

### `s.actions.completed`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | number |
| Description | Actions completed (if tracked)

### `s.actions.pending`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | number |
| Description | Actions pending implementation

### `s.actions.estimatedDelta.clicks`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | number |
| Description | Estimated total click gain from all pending actions

### `s.actions.estimatedDelta.revenue`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | money |
| Description | Estimated total revenue gain from all pending actions

### `s.actions.estimatedDelta.rank`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | number |
| Description | Estimated average rank improvement from actions

### `s.actions.estimatedDelta.cvr`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | percent |
| Description | Estimated CVR improvement from actions

### `s.actions.byNamespace.content`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,V] |
| Format | number |
| Description | Content actions count

### `s.actions.byNamespace.tech`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,V] |
| Format | number |
| Description | Technical actions count

### `s.actions.byNamespace.links`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,V] |
| Format | number |
| Description | Link actions count

### `s.actions.byNamespace.search`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,V] |
| Format | number |
| Description | Search actions count

### `s.actions.byNamespace.ai`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,V] |
| Format | number |
| Description | AI actions count

### `s.actions.byNamespace.paid`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,V] |
| Format | number |
| Description | Paid actions count

### `s.actions.byNamespace.ux`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,V] |
| Format | number |
| Description | UX actions count

### `s.actions.byNamespace.social`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,V] |
| Format | number |
| Description | Social actions count

### `s.actions.byNamespace.commerce`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,V] |
| Format | number |
| Description | Commerce actions count

### `s.actions.byNamespace.local`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,V] |
| Format | number |
| Description | Local actions count

### `s.actions.top5.byScore`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,V] |
| Format | list |
| Description | Top 5 actions by action score

### `s.actions.top5.byImpact`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,V] |
| Format | list |
| Description | Top 5 actions by estimated impact

### `s.actions.top5.byEffort`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,V] |
| Format | list |
| Description | Top 5 easiest actions (lowest effort)

### `s.actions.outcomes.improved`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | number |
| Description | Actions with confirmed positive outcome

### `s.actions.outcomes.neutral`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | number |
| Description | Actions with no measurable change

### `s.actions.outcomes.declined`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,A] |
| Format | number |
| Description | Actions with negative outcome

### `s.actions.outcomes.avgDelta`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | number |
| Description | Average realized delta per completed action

### `s.actions.outcomes.forecastAccuracy`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | percent |
| Description | Forecast accuracy (realized vs predicted delta)

### `s.actions.roi`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | score |
| Description | Action ROI (realized impact / effort hours)

### `p.action.triggered`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,A] |
| Format | boolean |
| Description | Whether any action is triggered for this page

### `p.action.count`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,A] |
| Format | number |
| Description | Number of actions triggered for this page

### `p.action.topAction`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,A] |
| Format | text |
| Description | Highest-scoring action code for this page

### `p.action.score`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Format | score |
| Description | Top action score for this page

### `p.action.band`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,A] |
| Format | enum |
| Description | Priority band of top action

### `p.action.estimatedDelta`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Format | number |
| Description | Estimated delta from top action

### `p.action.effortMinutes`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Format | number |
| Description | Estimated effort minutes for top action

### `p.action.allActions`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Format | list |
| Description | All triggered actions for this page

---

## EX-Q.4: Diagnostic / Anomaly Flags (35 additional)

### `p.diag.statusAnomaly`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,E] |
| Format | boolean |
| Description | Status code changed unexpectedly since last crawl

### `p.diag.redirectAnomaly`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,E] |
| Format | boolean |
| Description | Redirect behavior changed since last crawl

### `p.diag.canonicalAnomaly`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,E] |
| Format | boolean |
| Description | Canonical target changed since last crawl

### `p.diag.robotsAnomaly`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,E] |
| Format | boolean |
| Description | Robots directive changed since last crawl

### `p.diag.indexabilityAnomaly`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,E] |
| Format | boolean |
| Description | Indexability status changed since last crawl

### `p.diag.titleAnomaly`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,E] |
| Format | boolean |
| Description | Title changed significantly since last crawl

### `p.diag.metaDescAnomaly`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,E] |
| Format | boolean |
| Description | Meta description changed since last crawl

### `p.diag.schemaAnomaly`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,E] |
| Format | boolean |
| Description | Schema types changed since last crawl

### `p.diag.cwvAnomaly`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,E] |
| Format | boolean |
| Description | CWV degraded significantly since last measurement

### `p.diag.contentAnomaly`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,E] |
| Format | boolean |
| Description | Content changed significantly (>30% word diff)

### `p.diag.linkAnomaly`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,E] |
| Format | boolean |
| Description | Link count changed significantly

### `p.diag.trafficAnomaly`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,E] |
| Format | boolean |
| Description | Traffic changed >50% vs previous period

### `p.diag.revenueAnomaly`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,E] |
| Format | boolean |
| Description | Revenue changed >50% vs previous period

### `p.diag.citationAnomaly`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,E] |
| Format | boolean |
| Description | AI citation status changed

### `p.diag.soft404Risk`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Format | score |
| Description | Soft 404 risk score (0-1)

### `p.diag.cloakingRisk`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,E] |
| Format | score |
| Description | Cloaking risk score (static vs rendered content diff)

### `p.diag doorwayRisk`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,E] |
| Format | score |
| Description | Doorway page risk score

### `p.diag.thinContentRisk`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Format | score |
| Description | Thin content risk score

### `p.diag.duplicateRisk`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Format | score |
| Description | Duplicate content risk score

### `p.diag.cannibalizationRisk`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Format | score |
| Description | Cannibalization risk score

### `p.diag.anchorSpamRisk`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,E] |
| Format | score |
| Description | Anchor text spam risk score

### `p.diag.linkSpamRisk`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,E] |
| Format | score |
| Description | Link spam risk score

### `p.diag.securityRisk`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,E] |
| Format | score |
| Description | Security vulnerability risk score

### `p.diag.a11yRisk`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Format | score |
| Description | Accessibility compliance risk score

### `p.diag.seoRisk`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Format | score |
| Description | Overall SEO risk composite score

### `p.diag.contentRisk`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Format | score |
| Description | Content quality risk composite score

### `p.diag.techRisk`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Format | score |
| Description | Technical risk composite score

### `p.diag.linkRisk`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Format | score |
| Description | Link profile risk composite score

### `p.diag.overallRisk`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,A] |
| Format | score |
| Description | Overall page risk score (composite of all risks)

### `p.diag.riskBucket`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,L] |
| Format | enum |
| Values | none, low, medium, high, critical |
| Description | Risk severity bucket

### `s.diag.riskPages`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,A] |
| Format | number |
| Description | Pages with high/critical risk score

### `s.diag.anomalies`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,A,E] |
| Format | number |
| Description | Total anomaly flags across site

### `s.diag.statusAnomalies`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,A,E] |
| Format | number |
| Description | Status code anomalies detected

### `s.diag.contentAnomalies`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,A,E] |
| Format | number |
| Description | Content change anomalies detected

### `s.diag.trafficAnomalies`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,A,E] |
| Format | number |
| Description | Traffic anomalies detected

---

## EX-Q.5: More Per-Metric Detail (110 additional)

### `p.content.title.chars`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Format | number |
| Description | Title character count

### `p.content.title.words`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Format | number |
| Description | Title word count

### `p.content.metaDesc.chars`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Format | number |
| Description | Meta description character count

### `p.content.metaDesc.words`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Format | number |
| Description | Meta description word count

### `p.content.metaDesc.truncated`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Format | boolean |
| Description | Whether meta description is truncated in SERP (>155 chars)

### `p.content.title.truncated`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Format | boolean |
| Description | Whether title is truncated in SERP (>60 chars)

### `p.content.h1.words`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Format | number |
| Description | H1 word count

### `p.content.h1.chars`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Format | number |
| Description | H1 character count

### `p.content.images.totalAlt`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Format | number |
| Description | Images with valid alt text

### `p.content.images.avgSize`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Format | bytes |
| Description | Average image file size

### `p.content.images.totalSize`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Format | bytes |
| Description | Total image payload

### `p.content.images.lazyLoaded`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Format | number |
| Description | Images with lazy loading

### `p.content.images.withSrcset`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Format | number |
| Description | Images with srcset (responsive)

### `p.content.images.withDimensions`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Format | number |
| Description | Images with width/height attributes

### `p.content.images.avgAltLength`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Format | number |
| Description | Average alt text length

### `p.tech.perf.resources.total`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Format | number |
| Description | Total resource requests

### `p.tech.perf.resources.js`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Format | number |
| Description | JavaScript resource count

### `p.tech.perf.resources.css`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Format | number |
| Description | CSS resource count

### `p.tech.perf.resources.img`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Format | number |
| Description | Image resource count

### `p.tech.perf.resources.font`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Format | number |
| Description | Font resource count

### `p.tech.perf.resources.other`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Format | number |
| Description | Other resource count

### `p.tech.perf.size.js`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Format | bytes |
| Description | JavaScript payload size

### `p.tech.perf.size.css`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Format | bytes |
| Description | CSS payload size

### `p.tech.perf.size.img`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Format | bytes |
| Description | Image payload size

### `p.tech.perf.size.font`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Format | bytes |
| Description | Font payload size

### `p.tech.perf.size.html`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Format | bytes |
| Description | HTML document size

### `p.tech.perf.size.total`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Format | bytes |
| Description | Total page weight

### `p.tech.perf.size.totalCompressed`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Format | bytes |
| Description | Total compressed page weight

### `p.search.gsc.query.all`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Format | list |
| Description | All queries for this page (full list)

### `p.search.gsc.device.all`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Format | json |
| Description | Full device breakdown: {mobile: {clicks, impr, ctr, pos}, desktop: {...}, tablet: {...}}

### `p.search.gsc.country.all`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Format | json |
| Description | Full country breakdown (all countries)

### `p.ga.device.all`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Format | json |
| Description | Full device breakdown: {mobile: {sessions, cvr, revenue}, ...}

### `p.ga.country.all`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Format | json |
| Description | Full country breakdown (all countries)

### `p.ga.channel.all`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Format | json |
| Description | Full channel breakdown: {organic: {sessions, cvr, revenue}, ...}

### `p.ga.events.top`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Format | list |
| Description | Top 10 events by count on this page

### `p.ga.events.conversions`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Format | list |
| Description | Conversion events triggered on this page

### `p.ga.acquisition.top`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Format | list |
| Description | Top acquisition sources

### `p.links.internal.topTargets`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Format | list |
| Description | Top internal link targets from this page

### `p.links.internal.topSources`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Format | list |
| Description | Top internal pages linking to this page

### `p.links.external.topTargets`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Format | list |
| Description | Top external domains linked to

### `p.links.external.topSources`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Format | list |
| Description | Top referring domains

### `p.content.schema.allTypes`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Format | list |
| Description | All schema types present (complete list)

### `p.content.schema.allProperties`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Format | list |
| Description | All schema properties used

### `p.content.schema.missingRequired`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Format | list |
| Description | Missing required schema properties

### `p.content.schema.missingRecommended`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Format | list |
| Description | Missing recommended schema properties

### `p.tech.sec.headers.all`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Format | json |
| Description | All response headers (full list)

### `p.tech.sec.headers.security`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Format | json |
| Description | Security-specific headers only

### `p.content.entities.all`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Format | list |
| Description | All extracted entities (complete list)

### `p.content.entities.types`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Format | json |
| Description | Entity type distribution: {person: N, org: N, place: N, ...}

### `p.content.questions.all`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Format | list |
| Description | All questions the page answers (full list)

### `p.content.subtopics`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Format | list |
| Description | Sub-topics covered in the content

### `p.content.entities.topBySalience`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Format | list |
| Description | Top 10 entities by salience score

### `p.content.topic.keywords.top`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Format | list |
| Description | Top 10 topic keywords by frequency

### `p.content.topic.keywords.missed`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Format | list |
| Description | Important topic keywords not found in content

### `p.content.internalLinks.all`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Format | list |
| Description | All internal links (complete list)

### `p.content.externalLinks.all`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Format | list |
| Description | All external links (complete list)

### `p.content.images.all`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Format | list |
| Description | All images with metadata (src, alt, size, format)

### `p.content.videos.all`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Format | list |
| Description | All video embeds with metadata

### `p.content.audio.all`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Format | list |
| Description | All audio embeds with metadata

### `p.content.tables.all`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Format | list |
| Description | All table elements with metadata

### `p.content.codeBlocks.all`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Format | list |
| Description | All code blocks with language and size

### `p.content.lists.all`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Format | list |
| Description | All list elements (ol/ul) with item counts

### `p.content.blockquotes.all`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Format | list |
| Description | All blockquote elements

### `p.search.gsc.query.branded.count`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Format | number |
| Description | Count of branded queries

### `p.search.gsc.query.nonBranded.count`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Format | number |
| Description | Count of non-branded queries

### `p.search.gsc.query.branded.clicks`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Format | number |
| Description | Clicks from branded queries

### `p.search.gsc.query.nonBranded.clicks`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Format | number |
| Description | Clicks from non-branded queries

### `p.search.gsc.query.branded.share`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Format | percent |
| Description | Branded query click share

### `p.search.gsc.query.nonBranded.share`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Format | percent |
| Description | Non-branded query click share

### `p.search.gsc.query.branded.position`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Format | number |
| Description | Average branded query position

### `p.search.gsc.query.nonBranded.position`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Format | number |
| Description | Average non-branded query position

### `p.search.gsc.query.branded.ctr`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Format | percent |
| Description | Branded query CTR

### `p.search.gsc.query.nonBranded.ctr`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Format | percent |
| Description | Non-branded query CTR

### `p.ga.channel.organic.share`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Format | percent |
| Description | Organic traffic share of total

### `p.ga.channel.paid.share`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Format | percent |
| Description | Paid traffic share of total

### `p.ga.channel.social.share`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Format | percent |
| Description | Social traffic share of total

### `p.ga.channel.direct.share`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Format | percent |
| Description | Direct traffic share of total

### `p.ga.channel.email.share`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Format | percent |
| Description | Email traffic share of total

### `p.ga.channel.referral.share`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Format | percent |
| Description | Referral traffic share of total

### `p.links.internal.topAnchors`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Format | list |
| Description | Top anchor texts for internal links on this page

### `p.links.external.topAnchors`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Format | list |
| Description | Top anchor texts for external links on this page

### `p.links.backlinks.topDomains`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Format | list |
| Description | Top referring domains by authority

### `p.links.backlinks.topAnchors`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Format | list |
| Description | Top anchor texts from backlinks

### `p.links.backlinks.nofollow.count`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Format | number |
| Description | Nofollow backlinks count

### `p.links.backlinks.follow.count`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Format | number |
| Description | Follow backlinks count

### `p.links.backlinks.dofollowRatio`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Format | percent |
| Description | Dofollow backlink ratio

### `p.content.eeat.signals`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Format | json |
| Description | All E-E-A-T signals detected: {authorBio, authorPhoto, citations, originalAnalysis, ...}

### `p.content.schema.richResultTypes`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Format | list |
| Description | Rich result types eligible for this page

### `p.content.schema.requiredForPageType`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Format | list |
| Description | Required schema types for this page's content type

### `p.content.schema.presentForPageType`
| Field | Value |
|-------|-------|
| Level | P |
    Roles | [I,A] |
| Format | list |
| Description | Schema types present matching page type requirements

### `p.content.schema.missingForPageType`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Format | list |
| Description | Schema types missing for page type requirements

### `p.content.topic.keywords.density.top`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Format | list |
| Description | Top keywords by density percentage

### `p.content.topic.keywords.prominence.top`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Format | list |
| Description | Top keywords by prominence score

### `p.content.topic.keywords.missing.high`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Format | list |
| Description | High-priority keywords missing from content

### `p.content.topic.keywords.missing.medium`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Format | list |
| Description | Medium-priority keywords missing from content

### `p.content.topic.keywords.missing.low`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Format | list |
| Description | Low-priority keywords missing from content

### `p.content.topic.relatedTopics`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Format | list |
| Description | Related topics that could strengthen the page

### `p.content.topic.competitorCoverage`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Format | json |
| Description | How top SERP competitors cover this topic

### `p.content.topic.contentBrief`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Format | json |
| Description | AI-generated content brief with recommendations

### `p.search.gsc.device.clicksMobile`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Format | number |
| Description | Mobile clicks (28d)

### `p.search.gsc.device.clicksDesktop`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Format | number |
| Description | Desktop clicks (28d)

### `p.search.gsc.device.imprMobile`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Format | number |
| Description | Mobile impressions (28d)

### `p.search.gsc.device.imprDesktop`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Format | number |
| Description | Desktop impressions (28d)

### `p.search.gsc.device.ctrMobile`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Format | percent |
| Description | Mobile CTR (28d)

### `p.search.gsc.device.ctrDesktop`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Format | percent |
| Description | Desktop CTR (28d)

### `p.search.gsc.device.posMobile`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Format | number |
| Description | Mobile average position (28d)

### `p.search.gsc.device.posDesktop`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Format | number |
| Description | Desktop average position (28d)

### `p.search.gsc.country.clicksTop1`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Format | number |
| Description | Clicks from top country

### `p.search.gsc.country.imprTop1`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Format | number |
| Description | Impressions from top country

### `p.search.gsc.country.posTop1`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Format | number |
| Description | Position in top country

### `p.search.gsc.country.ctrTop1`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V] |
| Format | percent |
| Description | CTR in top country

---

## EX-Q.6: Final Batch — Entity, Scoring, and Detail (195 metrics)

### Entity Author `e.author.*` (20 metrics)

### `e.author.name`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [R,X] |
| Format | text |
| Description | Author full name

### `e.author.pagesWritten`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [R,K] |
| Format | number |
| Description | Number of pages authored

### `e.author.totalClicks`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [R,K] |
| Format | number |
| Description | Total GSC clicks across author's pages

### `e.author.totalSessions`
| Field | Value |
|-------|-------|
| Level | E |
    Roles | [R,K] |
| Format | number |
| Description | Total GA4 sessions across author's pages

### `e.author.avgReadability`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [R,K] |
| Format | score |
| Description | Average readability of author's content

### `e.author.avgWordCount`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [R,K] |
| Format | number |
| Description | Average word count of author's content

### `e.author.avgCvr`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [R,K] |
| Format | percent |
| Description | Average conversion rate of author's pages

### `e.author.eeatScore`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [R,K] |
| Format | score |
| Description | Average E-E-A-T score of author's content

### `e.author.topicalAuthority`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [R,K] |
| Format | score |
| Description | Author's topical authority score

### `e.author.credentials`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [R,X] |
| Format | list |
| Description | Author credentials and qualifications

### `e.author.bioPresent`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [R,A] |
| Format | boolean |
| Description | Whether author has a bio on the site

### `e.author.socialProfiles`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [R,X] |
| Format | list |
| Description | Author's social media profiles

### `e.author.publications`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [R,X] |
| Format | list |
| Description | External publications by this author

### `e.author.schemaPresent`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [R,A] |
| Format | boolean |
| Description | Whether author has Person schema

### `e.author.schemaLinked`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [R,A] |
| Format | boolean |
| Description | Whether author schema links to external profiles

### `e.author.topClusters`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [R,V] |
| Format | list |
| Description | Top topic clusters this author writes about

### `e.author.contentVelocity`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [R,V] |
| Format | number |
| Description | Articles published per month

### `e.author.avgFreshness`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [R,K] |
| Format | number |
| Description | Average days since last publish

### `e.author.totalBacklinks`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [R,K] |
| Format | number |
| Description | Total backlinks to author's content

### `e.author.authority`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [R,K] |
| Format | score |
| Description | Author's overall authority score

### Entity Product `e.product.*` (15 metrics)

### `e.product.name`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [R,X] |
| Format | text |
| Description | Product name

### `e.product.url`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [R,X] |
| Format | url |
| Description | Product page URL

### `e.product.price`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [R,V] |
| Format | money |
| Description | Current price

### `e.product.availability`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [R,V,A] |
| Format | enum |
| Description | Availability status

### `e.product.reviews.count`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [R,V] |
| Format | number |
| Description | Review count

### `e.product.reviews.avg`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [R,V] |
| Format | score |
| Description | Average review rating

### `e.product.sessions`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [R,K] |
| Format | number |
| Description | Total sessions (28d)

### `e.product.revenue`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [R,K] |
| Format | money |
| Description | Total revenue (28d)

### `e.product.cvr`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [R,K] |
| Format | percent |
| Description | Conversion rate

### `e.product.organicClicks`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [R,K] |
| Format | number |
| Description | Organic clicks (28d)

### `e.product.organicPosition`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [R,K] |
| Format | number |
| Description | Average organic position

### `e.product.backlinks`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [R,K] |
| Format | number |
| Description | Total backlinks

### `e.product.refDomains`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [R,K] |
| Format | number |
| Description | Referring domains

### `e.product.schemaOk`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [R,A] |
| Format | boolean |
| Description | Product schema valid

### `e.product.feedOk`
| Field | Value |
|-------|-------|
| Level | E |
    Roles | [R,A] |
| Format | boolean |
| Description | Product in valid merchant feed

### Entity Location `e.location.*` (15 metrics)

### `e.location.name`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [R,X] |
| Format | text |
| Description | Location name

### `e.location.address`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [R,X] |
| Format | text |
| Description | Full address

### `e.location.phone`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [R,X] |
| Format | text |
| Description | Phone number

### `e.location.gbpUrl`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [R,X] |
| Format | url |
| Description | GBP listing URL

### `e.location.gbpRating`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [R,V] |
| Format | score |
| Description | Google review rating

### `e.location.gbpReviews`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [R,V] |
| Format | number |
| Description | Google review count

### `e.location.pageUrl`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [R,X] |
| Format | url |
| Description | Dedicated location page URL

### `e.location.sessions`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [R,K] |
| Format | number |
| Description | Sessions from location page (28d)

### `e.location.conversions`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [R,K] |
| Format | number |
| Description | Conversions from location (28d)

### `e.location.calls`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [R,K] |
| Format | number |
| Description | Phone call clicks (28d)

### `e.location.directions`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [R,K] |
| Format | number |
| Description | Direction requests (28d)

### `e.location.citations.count`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [R,A] |
| Format | number |
| Description | Citation count for this location

### `e.location.citations.napScore`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [R,A] |
| Format | score |
| Description | NAP consistency score

### `e.location.rankAvg`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [R,K] |
| Format | number |
| Description | Average local pack rank

### `e.location.rankGrid`
| Field | Value |
|-------|-------|
| Level | E |
| Roles | [R,V] |
| Format | json |
| Description | Geogrid rank data

### Scoring Components `s.score.detail.*` (30 additional)

### `s.score.detail.content.wordCount`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | score |
| Description | Content score component: word count quality

### `s.score.detail.content.readability`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | score |
| Description | Content score component: readability

### `s.score.detail.content.freshness`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | score |
| Description | Content score component: freshness

### `s.score.detail.content.duplicates`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | score |
| Description | Content score component: duplicate health

### `s.score.detail.content.schema`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | score |
| Description | Content score component: schema coverage

### `s.score.detail.content.eeat`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | score |
| Description | Content score component: E-E-A-T

### `s.score.detail.content.images`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | score |
| Description | Content score component: image optimization

### `s.score.detail.content.topics`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | score |
| Description | Content score component: topic coverage

### `s.score.detail.tech.cwv`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | score |
| Description | Tech score component: Core Web Vitals

### `s.score.detail.tech.security`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | score |
| Description | Tech score component: security headers

### `s.score.detail.tech.a11y`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | score |
| Description | Tech score component: accessibility

### `s.score.detail.tech.rendering`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | score |
| Description | Tech score component: rendering health

### `s.score.detail.tech.indexability`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | score |
| Description | Tech score component: indexability

### `s.score.detail.tech.https`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | score |
| Description | Tech score component: HTTPS adoption

### `s.score.detail.tech.mobile`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | score |
| Description | Tech score component: mobile friendliness

### `s.score.detail.search.clicks`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | score |
| Description | Search score component: click volume

### `s.score.detail.search.position`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | score |
| Description | Search score component: ranking positions

### `s.score.detail.search.keywords`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | score |
| Description | Search score component: keyword breadth

### `s.score.detail.search.features`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | score |
| Description | Search score component: SERP features

### `s.score.detail.search.ctr`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | score |
| Description | Search score component: CTR health

### `s.score.detail.links.refDomains`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | score |
| Description | Links score component: referring domain count

### `s.score.detail.links.quality`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | score |
| Description | Links score component: link quality

### `s.score.detail.links.internal`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | score |
| Description | Links score component: internal linking

### `s.score.detail.links.toxic`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | score |
| Description | Links score component: toxic backlink health

### `s.score.detail.links.anchorDiversity`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | score |
| Description | Links score component: anchor text diversity

### `s.score.detail.ai.citations`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | score |
| Description | AI score component: citation rate

### `s.score.detail.ai.extractability`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | score |
| Description | AI score component: content extractability

### `s.score.detail.ai.botAccess`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | score |
| Description | AI score component: bot access

### `s.score.detail.ai.schema`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | score |
| Description | AI score component: AI-ready schema

### `s.score.detail.ai.llmsTxt`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | score |
| Description | AI score component: llms.txt presence

### Comparison / Period-Over-Period (30 additional)

### `p.search.gsc.clicks.vsPrev7d`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,T] |
| Format | number |
| Description | Clicks change vs previous 7d period

### `p.search.gsc.clicks.vsPrev28d`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,T] |
| Format | number |
| Description | Clicks change vs previous 28d period

### `p.search.gsc.impr.vsPrev7d`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,T] |
| Format | number |
| Description | Impressions change vs previous 7d period

### `p.search.gsc.impr.vsPrev28d`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,T] |
| Format | number |
| Description | Impressions change vs previous 28d period

### `p.search.gsc.position.vsPrev7d`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,T] |
| Format | number |
| Description | Position change vs previous 7d period

### `p.search.gsc.position.vsPrev28d`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,T] |
| Format | number |
| Description | Position change vs previous 28d period

### `p.search.gsc.ctr.vsPrev7d`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,T] |
| Format | percent |
| Description | CTR change vs previous 7d period

### `p.search.gsc.ctr.vsPrev28d`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,T] |
| Format | percent |
| Description | CTR change vs previous 28d period

### `p.ga.sessions.vsPrev7d`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,T] |
| Format | number |
| Description | Sessions change vs previous 7d period

### `p.ga.sessions.vsPrev28d`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,T] |
| Format | number |
| Description | Sessions change vs previous 28d period

### `p.ga.conversions.vsPrev7d`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,T] |
| Format | number |
| Description | Conversions change vs previous 7d period

### `p.ga.conversions.vsPrev28d`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,T] |
| Format | number |
| Description | Conversions change vs previous 28d period

### `p.ga.revenue.vsPrev7d`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,T] |
| Format | money |
| Description | Revenue change vs previous 7d period

### `p.ga.revenue.vsPrev28d`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,T] |
| Format | money |
| Description | Revenue change vs previous 28d period

### `p.ga.cvr.vsPrev7d`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,T] |
| Format | percent |
| Description | CVR change vs previous 7d period

### `p.ga.cvr.vsPrev28d`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,T] |
| Format | percent |
| Description | CVR change vs previous 28d period

### `p.ga.bounce.vsPrev7d`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,T] |
| Format | percent |
| Description | Bounce rate change vs previous 7d

### `p.ga.bounce.vsPrev28d`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,T] |
| Format | percent |
| Description | Bounce rate change vs previous 28d

### `p.ga.engagementRate.vsPrev7d`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,T] |
| Format | percent |
| Description | Engagement rate change vs previous 7d

### `p.ga.engagementRate.vsPrev28d`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,T] |
| Format | percent |
| Description | Engagement rate change vs previous 28d

### `p.links.referringDomains.vsPrev7d`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,T] |
| Format | number |
| Description | Referring domains change vs previous 7d

### `p.links.referringDomains.vsPrev28d`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,T] |
| Format | number |
| Description | Referring domains change vs previous 28d

### `p.links.backlinks.vsPrev7d`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,T] |
| Format | number |
| Description | Backlinks change vs previous 7d

### `p.links.backlinks.vsPrev28d`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,T] |
| Format | number |
| Description | Backlinks change vs previous 28d

### `p.links.urlRating.vsPrev30d`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,T] |
| Format | number |
| Description | URL rating change vs previous 30d

### `p.tech.cwv.lcp.vsPrev30d`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,T] |
| Format | duration |
| Description | LCP change vs previous 30d measurement

### `p.tech.cwv.inp.vsPrev30d`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,T] |
| Format | duration |
| Description | INP change vs previous 30d measurement

### `p.tech.cwv.cls.vsPrev30d`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,T] |
| Format | number |
| Description | CLS change vs previous 30d measurement

### `p.ai.citation.rate.vsPrev7d`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,T] |
| Format | percent |
| Description | AI citation rate change vs previous 7d

### `p.ai.citation.rate.vsPrev30d`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,T] |
| Format | percent |
| Description | AI citation rate change vs previous 30d

### `p.social.shares.total.vsPrev7d`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,T] |
| Format | number |
| Description | Social shares change vs previous 7d

### Additional Detail Metrics (55 additional)

### `p.content.internalLinks.count`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,A] |
| Sources | T0 crawl |
| Format | number |
| Description | Internal links within content body

### `p.content.internalLinks.externalCount`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,A] |
| Sources | T0 crawl |
| Format | number |
| Description | External links within content body

### `p.content.internalLinks.total`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T0 crawl |
| Format | number |
| Description | Total links within content body

### `p.content.internalLinks.avgPerHundredWords`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 derived |
| Format | number |
| Description | Internal links per 100 words (link density)

### `p.content.internalLinks.externalAvgPerHundredWords`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 derived |
| Format | number |
| Description | External links per 100 words

### `p.content.internalLinks.topicalRelevance.avg`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T6 AI |
| Format | score |
| Description | Average topical relevance of internal links

### `p.content.internalLinks.toHighValuePages`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 derived |
| Format | number |
| Description | Internal links to high-PageRank pages

### `p.content.internalLinks.fromHighValuePages`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 derived |
| Format | number |
| Description | Internal links from high-PageRank pages

### `p.content.internalLinks.toConversionPages`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 derived |
| Format | number |
| Description | Internal links to pages with conversions

### `p.content.internalLinks.fromConversionPages`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 derived |
| Format | number |
| Description | Internal links from pages with conversions

### `p.content.externalLinks.toHighAuthDomains`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T3 |
| Format | number |
| Description | Links to high-authority domains (DA > 70)

### `p.content.externalLinks.toLowAuthDomains`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T3 |
| Format | number |
| Description | Links to low-authority domains (DA < 30)

### `p.content.externalLinks.toSameNiche`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T6 AI |
| Format | number |
| Description | Links to same-niche domains

### `p.content.externalLinks.toGovEdu`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 derived |
| Format | number |
| Description | Links to .gov and .edu domains

### `p.content.externalLinks.toNofollowDomains`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 crawl |
| Format | number |
| Description | Links to domains with nofollow policies

### `p.tech.perf.resources.jsCount`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T0 crawl |
| Format | number |
| Description | JavaScript file count

### `p.tech.perf.resources.cssCount`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T0 crawl |
| Format | number |
| Description | CSS file count

### `p.tech.perf.resources.imgCount`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T0 crawl |
| Format | number |
| Description | Image resource count

### `p.tech.perf.resources.fontCount`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T0 crawl |
| Format | number |
| Description | Font file count

### `p.tech.perf.resources.xhrCount`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T0 crawl |
| Format | number |
| Description | XHR/fetch request count

### `p.tech.perf.resources.totalSize`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T0 crawl |
| Format | bytes |
| Description | Total resource payload size

### `p.tech.perf.resources.jsSize`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T0 crawl |
| Format | bytes |
| Description | JavaScript payload size

### `p.tech.perf.resources.cssSize`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T0 crawl |
| Format | bytes |
| Description | CSS payload size

### `p.tech.perf.resources.imgSize`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T0 crawl |
| Format | bytes |
| Description | Image payload size

### `p.tech.perf.resources.totalRequests`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T0 crawl |
| Format | number |
| Description | Total HTTP requests

### `p.tech.perf.resources.totalSizeKb`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T0 crawl |
| Format | number |
| Description | Total page weight in KB

### `p.content.entities.topBySalience.first`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T6 AI |
| Format | text |
| Description | Highest salience entity name

### `p.content.entities.topBySalience.firstScore`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T6 AI |
| Format | score |
| Description | Highest salience entity score

### `p.content.entities.topBySalience.second`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T6 AI |
| Format | text |
| Description | Second highest salience entity

### `p.content.entities.topBySalience.third`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T6 AI |
| Format | text |
| Description | Third highest salience entity

### `p.content.topic.keywords.density.top1`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 derived |
| Format | percent |
| Description | Highest density keyword percentage

### `p.content.topic.keywords.density.top2`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 derived |
| Format | percent |
| Description | Second highest density keyword percentage

### `p.content.topic.keywords.density.top3`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 derived |
| Format | percent |
| Description | Third highest density keyword percentage

### `p.content.topic.keywords.prominence.top1`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 derived |
| Format | score |
| Description | Highest prominence keyword score

### `p.content.topic.keywords.prominence.top2`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 derived |
| Format | score |
| Description | Second highest prominence keyword score

### `p.content.topic.keywords.prominence.top3`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 derived |
| Format | score |
| Description | Third highest prominence keyword score

### `p.content.topic.keywords.missing.high.first`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T6 AI |
| Format | text |
| Description | Highest priority missing keyword

### `p.content.topic.keywords.missing.high.second`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T6 AI |
| Format | text |
| Description | Second highest priority missing keyword

### `p.content.topic.keywords.missing.high.third`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T6 AI |
| Format | text |
| Description | Third highest priority missing keyword

### `p.search.gsc.query.top1.url`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T0 GSC |
| Format | url |
| Description | URL ranking for top query

### `p.search.gsc.query.top1.position`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T0 GSC |
| Format | number |
| Description | Position for top query

### `p.search.gsc.query.top1.clicks`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T0 GSC |
| Format | number |
| Description | Clicks from top query

### `p.search.gsc.query.top1.impr`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T0 GSC |
| Format | number |
| Description | Impressions from top query

### `p.search.gsc.query.top1.ctr`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T0 GSC |
| Format | percent |
| Description | CTR from top query

### `p.search.gsc.query.top2.url`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T0 GSC |
| Format | url |
| Description | URL ranking for second query

### `p.search.gsc.query.top2.position`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T0 GSC |
| Format | number |
| Description | Position for second query

### `p.search.gsc.query.top3.url`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T0 GSC |
| Format | url |
| Description | URL ranking for third query

### `p.search.gsc.query.top3.position`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T0 GSC |
| Format | number |
| Description | Position for third query

### `p.search.gsc.query.top10.all`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T0 GSC |
| Format | list |
| Description | All top 10 queries with full metrics

---

## EX-Q.7: Final 35 — Completing 1,700

### `p.content.topic.competitorCount`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T5 SERP |
| Format | number |
| Description | Number of competitors ranking for same topic

### `p.content.topic.competitorAvgWordCount`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T5 SERP |
| Format | number |
| Description | Average word count of top SERP competitors

### `p.content.topic.competitorAvgBacklinks`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T3/T5 |
| Format | number |
| Description | Average backlinks of top SERP competitors

### `p.content.topic.competitorAvgEeat`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T6 AI |
| Format | score |
| Description | Average E-E-A-T of top SERP competitors

### `p.content.topic.difficulty`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,A] |
| Sources | T3/T5 |
| Format | score |
| Description | Topic difficulty score based on SERP competition

### `p.content.topic.opportunity`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,A] |
| Sources | T7 formula |
| Format | score |
| Description | Topic opportunity score (difficulty vs current rank)

### `p.content.topic.recommendations`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T6 AI |
| Format | list |
| Description | AI-generated content recommendations for topic

### `p.search.gsc.query.all.branded`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T0 GSC |
| Format | list |
| Description | All branded queries for this page

### `p.search.gsc.query.all.nonBranded`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T0 GSC |
| Format | list |
| Description | All non-branded queries for this page

### `p.search.gsc.query.all.byPosition`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T0 GSC |
| Format | json |
| Description | All queries grouped by position bucket

### `p.search.gsc.query.all.byVolume`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T3 |
| Format | json |
| Description | All queries grouped by volume bucket

### `p.search.gsc.query.all.byIntent`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T6 AI |
| Format | json |
| Description | All queries grouped by search intent

### `s.score.detail.commerce.products`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | score |
| Description | Commerce score: product page quality

### `s.score.detail.commerce.reviews`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | score |
| Description | Commerce score: review health

### `s.score.detail.commerce.feed`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | score |
| Description | Commerce score: feed health

### `s.score.detail.commerce.schema`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | score |
| Description | Commerce score: schema coverage

### `s.score.detail.commerce.pricing`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | score |
| Description | Commerce score: pricing competitiveness

### `s.score.detail.local.nap`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | score |
| Description | Local score: NAP consistency

### `s.score.detail.local.gbp`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | score |
| Description | Local score: GBP completeness

### `s.score.detail.local.reviews`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | score |
| Description | Local score: review health

### `s.score.detail.local.citations`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | score |
| Description | Local score: citation health

### `s.score.detail.local.rankings`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | score |
| Description | Local score: local pack rankings

### `s.score.detail.social.shares`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | score |
| Description | Social score: share volume

### `s.score.detail.social.mentions`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | score |
| Description | Social score: mention volume

### `s.score.detail.social.sentiment`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | score |
| Description | Social score: sentiment

### `s.score.detail.paid.quality`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | score |
| Description | Paid score: quality score health

### `s.score.detail.paid.roas`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | score |
| Description | Paid score: ROAS performance

### `s.score.detail.paid.landingPages`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | score |
| Description | Paid score: landing page quality

### `s.score.detail.email.deliverability`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | score |
| Description | Email score: deliverability

### `s.score.detail.email.domainAuth`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | score |
| Description | Email score: domain authentication

### `s.score.detail.email.engagement`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | score |
| Description | Email score: engagement metrics

### `s.score.detail.ux.engagement`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | score |
| Description | UX score: engagement metrics

### `s.score.detail.ux.friction`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | score |
| Description | UX score: friction signals

### `s.score.detail.ux.conversion`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | score |
| Description | UX score: conversion performance

### `s.score.detail.eeat.author`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | score |
| Description | E-E-A-T score: author signals

### `s.score.detail.eeat.content`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | score |
| Description | E-E-A-T score: content signals

### `s.score.detail.eeat.trust`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | score |
| Description | E-E-A-T score: trust signals

### `s.score.detail.eeat.links`
| Field | Value |
|-------|-------|
| Level | S |
| Roles | [R,K] |
| Format | score |
| Description | E-E-A-T score: link signals

---

## EX-R: Missing Metrics — CMS, Industry-Gated, Language, Regional Search (51 metrics)

> These fill the gaps identified in the audit: CMS-specific metrics that were
> listed in visibility rules but not defined, empty industry-gated namespaces,
> RTL language metrics, and regional search engine coverage.

---

## EX-R.1: CMS-Specific Metrics (20 metrics)

Gate: only shown when `fp.cms` matches the specific CMS. All P-level, appear in grid when CMS detected.

---

### WordPress `p.wp.*` (5 metrics)

Gate: `fp.cms = wordpress`

### `p.wp.plugins.count`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,A] |
| Sources | T2 DOM fingerprint > T6 AI |
| Format | number |
| Gate | fp.cms = wordpress |
| Description | Number of WordPress plugins detected on page

### `p.wp.theme`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T2 DOM fingerprint > T1 BuiltWith |
| Format | text |
| Gate | fp.cms = wordpress |
| Description | WordPress theme name detected

### `p.wp.yoast.score`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,S,A] |
| Sources | T2 DOM fingerprint |
| Format | score |
| Gate | fp.cms = wordpress AND Yoast present |
| Description | Yoast SEO score (if Yoast plugin detected)

### `p.wp.rankmath.score`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,S,A] |
| Sources | T2 DOM fingerprint |
| Format | score |
| Gate | fp.cms = wordpress AND RankMath present |
| Description | RankMath SEO score (if RankMath plugin detected)

### `p.wp.acf.present`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T2 DOM fingerprint |
| Format | boolean |
| Gate | fp.cms = wordpress |
| Description | Whether Advanced Custom Fields is in use

### Shopify `p.shopify.*` (4 metrics)

Gate: `fp.cms = shopify`

### `p.shopify.app.count`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,A] |
| Sources | T2 DOM fingerprint |
| Format | number |
| Gate | fp.cms = shopify |
| Description | Number of Shopify apps detected on page

### `p.shopify.theme`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T2 DOM fingerprint |
| Format | text |
| Gate | fp.cms = shopify |
| Description | Shopify theme name detected

### `p.shopify.metaobject`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T2 DOM fingerprint |
| Format | boolean |
| Gate | fp.cms = shopify |
| Description | Whether Shopify Metaobjects are in use (structured content)

### `p.shopify.json-ld-pack`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T2 DOM fingerprint |
| Format | boolean |
| Gate | fp.cms = shopify |
| Description | Whether a JSON-LD schema pack app is installed

### Webflow `p.webflow.*` (2 metrics)

Gate: `fp.cms = webflow`

### `p.webflow.cms.item`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T2 DOM fingerprint |
| Format | boolean |
| Gate | fp.cms = webflow |
| Description | Whether page is a Webflow CMS collection item

### `p.webflow.staticHtml`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T2 DOM fingerprint |
| Format | boolean |
| Gate | fp.cms = webflow |
| Description | Whether page is static HTML (not CMS-driven)

### Next.js `p.next.*` (3 metrics)

Gate: `fp.cms = nextjs-headless`

### `p.next.isr`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T2 build-id patterns + response headers |
| Format | boolean |
| Gate | fp.stack.framework = nextjs |
| Description | Whether page uses Incremental Static Regeneration

### `p.next.staticOrSsr`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T2 build-id + render diff |
| Format | enum |
| Values | static, ssr, isr |
| Gate | fp.stack.framework = nextjs |
| Description | Whether page is static, SSR, or ISR

### `p.next.hydrationMismatch`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,A,E] |
| Sources | T7 render diff |
| Format | boolean |
| Gate | fp.stack.framework = nextjs |
| Description | Whether hydration caused server/client content mismatch

### Headless CMS `p.headless.*` (2 metrics)

Gate: `fp.cms ∈ {contentful, sanity, strapi}`

### `p.headless.buildInfo`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,X] |
| Sources | T2 DOM/meta fingerprint |
| Format | json |
| Gate | fp.cms ∈ {contentful, sanity, strapi} |
| Description | Build/deploy info detected (preview vs production)

### `p.headless.previewBleed`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,E] |
| Sources | T2 crawl |
| Format | boolean |
| Gate | fp.cms ∈ {contentful, sanity, strapi} |
| Description | Whether preview/draft content is leaking to production

### Ghost `p.ghost.*` (2 metrics)

Gate: `fp.cms = ghost`

### `p.ghost.memberArea`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T2 DOM fingerprint |
| Format | boolean |
| Gate | fp.cms = ghost |
| Description | Whether page is behind Ghost member area

### `p.ghost.portalEnabled`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T2 DOM fingerprint |
| Format | boolean |
| Gate | fp.cms = ghost |
| Description | Whether Ghost portal (signup/signin widget) is enabled

### Substack `p.substack.*` (2 metrics)

Gate: `fp.cms = substack`

### `p.substack.paywall`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T2 DOM fingerprint |
| Format | boolean |
| Gate | fp.cms = substack |
| Description | Whether page has Substack paywall active

### `p.substack.subscribeRate`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T2 DOM fingerprint |
| Format | score |
| Gate | fp.cms = substack |
| Description | Subscribe CTA prominence score

---

## EX-R.2: News Metrics `p.news.*` (8 metrics)

Gate: `fp.industry ∈ {news, media} OR NewsArticle schema present`

---

### `p.news.headlineCount`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,A] |
| Sources | T0 crawl |
| Format | number |
| Gate | fp.industry ∈ {news, media} |
| Description | Number of headline elements on page (H1 + article headlines)

### `p.news.articleFreq`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 derived |
| Format | number |
| Gate | fp.industry ∈ {news, media} |
| Description | Publishing frequency (articles per day for this section)

### `p.news.authorDepth`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T6 AI |
| Format | score |
| Gate | fp.industry ∈ {news, media} |
| Description | Author credential depth for YMYL news (0-1)

### `p.news.breakingSpeed`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 derived |
| Format | duration |
| Gate | fp.industry ∈ {news, media} |
| Description | Time from event to article publish (for time-sensitive content)

### `p.news.paywall.type`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,A] |
| Sources | T2 DOM + T7 |
| Format | enum |
| Values | none, hard, soft, metered, freemium |
| Gate | fp.industry ∈ {news, media} |
| Description | Paywall type detected

### `p.news.paywall.previewLength`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T2 DOM |
| Format | number |
| Gate | fp.industry ∈ {news, media} AND paywall present |
| Description | Character count visible before paywall triggers

### `p.news.sitemap.newsIndex`
| Field | Value |
|-------|-------|
| Level | P |
    Roles | [I,A] |
| Sources | T0 sitemap |
| Format | boolean |
| Gate | fp.industry ∈ {news, media} |
| Description | Whether page is in Google News sitemap

### `p.news.schema.newsArticle`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,A] |
| Sources | T0 crawl |
| Format | boolean |
| Gate | fp.industry ∈ {news, media} |
| Description | Whether NewsArticle schema is present and valid

---

## EX-R.3: Job Board Metrics `p.jobs.*` (7 metrics)

Gate: `fp.industry = jobboard OR JobPosting schema present`

---

### `p.jobs.postingCount`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,K] |
| Sources | T0 crawl |
| Format | number |
| Gate | fp.industry = jobboard |
| Description | Total job postings on this listing page

### `p.jobs.applicationUrl`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 crawl |
| Format | url |
| Gate | fp.industry = jobboard |
| Description | External application URL (redirect target)

### `p.jobs.schema.valid`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,A] |
| Sources | T7 validator |
| Format | boolean |
| Gate | fp.industry = jobboard |
| Description | Whether JobPosting schema is valid and complete

### `p.jobs.salaryPresent`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 schema + content |
| Format | boolean |
| Gate | fp.industry = jobboard |
| Description | Whether salary/compensation info is present

### `p.jobs.locationPresent`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T0 schema + content |
| Format | boolean |
| Gate | fp.industry = jobboard |
| Description | Whether job location is specified

### `p.jobs.expiryPresent`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A,E] |
| Sources | T0 schema |
| Format | boolean |
| Gate | fp.industry = jobboard |
| Description | Whether job posting expiry date is set

### `p.jobs.postingFreshness`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,A] |
| Sources | T0 schema |
| Format | date |
| Gate | fp.industry = jobboard |
| Description | Date job was posted (datePosted schema property)

---

## EX-R.4: RTL Language Metric (1 metric)

---

### `p.rtl.mirrorIssues`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,A] |
| Sources | T7 derived |
| Format | list |
| Gate | fp.language.primary ∈ {ar, he, fa, ur} |
| Description | RTL layout mirroring issues detected (e.g. icons, charts, forms pointing wrong direction)

---

## EX-R.5: Regional Search Engines (15 metrics)

Gate: shown when user has the respective search engine connected or when traffic from that engine is detected in analytics.

---

### Yandex `p.search.yandex.*` (3 metrics)

### `p.search.yandex.clicks`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,R,V,T] |
| Sources | T0 Yandex Webmaster |
| Format | number |
| Gate | user connects Yandex OR geo.primary ∈ {RU, BY, KZ} |
| Description | Yandex clicks (28d)

### `p.search.yandex.impr`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,R,V,T] |
| Sources | T0 Yandex Webmaster |
| Format | number |
| Gate | user connects Yandex OR geo.primary ∈ {RU, BY, KZ} |
| Description | Yandex impressions (28d)

### `p.search.yandex.position`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,V,T] |
| Sources | T0 Yandex Webmaster |
| Format | number |
| Gate | user connects Yandex OR geo.primary ∈ {RU, BY, KZ} |
| Description | Average Yandex position

### Baidu `p.search.baidu.*` (3 metrics)

### `p.search.baidu.clicks`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,R,V,T] |
| Sources | T0 Baidu Webmaster |
| Format | number |
| Gate | user connects Baidu OR geo.primary = CN |
| Description | Baidu clicks (28d)

### `p.search.baidu.impr`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,R,V,T] |
| Sources | T0 Baidu Webmaster |
| Format | number |
| Gate | user connects Baidu OR geo.primary = CN |
| Description | Baidu impressions (28d)

### `p.search.baidu.position`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,V,T] |
| Sources | T0 Baidu Webmaster |
| Format | number |
| Gate | user connects Baidu OR geo.primary = CN |
| Description | Average Baidu position

### Naver `p.search.naver.*` (3 metrics)

### `p.search.naver.clicks`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,R,V,T] |
| Sources | T0 Naver Webmaster |
| Format | number |
| Gate | user connects Naver OR geo.primary = KR |
| Description | Naver clicks (28d)

### `p.search.naver.impr`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,R,V,T] |
| Sources | T0 Naver Webmaster |
| Format | number |
| Gate | user connects Naver OR geo.primary = KR |
| Description | Naver impressions (28d)

### `p.search.naver.position`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,V,T] |
| Sources | T0 Naver Webmaster |
| Format | number |
| Gate | user connects Naver OR geo.primary = KR |
| Description | Average Naver position

### Seznam `p.search.seznam.*` (3 metrics)

### `p.search.seznam.clicks`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,R,V,T] |
| Sources | T0 Seznam Webmaster |
| Format | number |
| Gate | user connects Seznam OR geo.primary = CZ |
| Description | Seznam clicks (28d)

### `p.search.seznam.impr`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,R,V,T] |
| Sources | T0 Seznam Webmaster |
| Format | number |
| Gate | user connects Seznam OR geo.primary = CZ |
| Description | Seznam impressions (28d)

### `p.search.seznam.position`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [G,I,V,T] |
| Sources | T0 Seznam Webmaster |
| Format | number |
| Gate | user connects Seznam OR geo.primary = CZ |
| Description | Average Seznam position

### DuckDuckGo `p.search.duck.*` (3 metrics)

### `p.search.duck.clicks`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,T] |
| Sources | T7 inferred from click patterns |
| Format | number |
| Gate | analytics shows DuckDuckGo referrer traffic |
| Description | Estimated DuckDuckGo clicks (inferred from referrer data)

### `p.search.duck.impr`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,T] |
| Sources | T5 SERP scrape |
| Format | number |
| Gate | analytics shows DuckDuckGo referrer traffic |
| Description | Estimated DuckDuckGo impressions (from SERP scrape)

### `p.search.duck.position`
| Field | Value |
|-------|-------|
| Level | P |
| Roles | [I,V,T] |
| Sources | T5 SERP scrape |
| Format | number |
| Gate | analytics shows DuckDuckGo referrer traffic |
| Description | Average DuckDuckGo position (from SERP scrape)

---

## Score Component Formulas

> Each `s.score.*` component is a weighted composite of page-level metrics.
> Weights are tunable per industry via `fp.industry` overrides.
> Default weights shown below; industry packs adjust ±20%.

### `p.score.overall` (composite of all sub-scores)

```
overall = weightedAvg(contentQuality, health, eeat, search, links, ai, social, paid, commerce, local, ux, email)
```

| Sub-score | Default Weight | Description |
|-----------|---------------|-------------|
| contentQuality | 0.18 | Content relevance, freshness, depth |
| health | 0.15 | Technical crawlability, CWV, security |
| search | 0.15 | GSC performance, keyword coverage |
| eeat | 0.12 | Experience, expertise, authority, trust |
| links | 0.10 | Internal PR, backlink quality, anchor diversity |
| ai | 0.08 | AI discoverability, bot access, citation rate |
| commerce | 0.07 | Product schema, pricing, stock (ecommerce only) |
| paid | 0.06 | Quality Score, ad relevance (paid mode) |
| ux | 0.06 | Engagement, friction, conversion |
| social | 0.04 | OG tags, share count, social proof |
| local | 0.03 | NAP consistency, GBP, local pack (local only) |
| email | 0.02 | Domain auth, deliverability (email-connected) |

**Industry weight overrides:**

| Industry | contentQuality | health | search | eeat | commerce | local | paid |
|----------|---------------|--------|--------|------|----------|-------|------|
| ecommerce | 0.14 | 0.12 | 0.14 | 0.08 | 0.20 | 0.02 | 0.08 |
| saas | 0.18 | 0.14 | 0.18 | 0.10 | 0.02 | 0.02 | 0.10 |
| blog/creator | 0.25 | 0.12 | 0.18 | 0.15 | 0.00 | 0.00 | 0.03 |
| news/media | 0.22 | 0.14 | 0.18 | 0.12 | 0.00 | 0.00 | 0.05 |
| finance | 0.15 | 0.12 | 0.14 | 0.20 | 0.00 | 0.02 | 0.06 |
| healthcare | 0.15 | 0.12 | 0.14 | 0.22 | 0.00 | 0.04 | 0.04 |
| education | 0.18 | 0.12 | 0.16 | 0.16 | 0.00 | 0.02 | 0.06 |
| local | 0.14 | 0.12 | 0.14 | 0.10 | 0.02 | 0.18 | 0.06 |
| job_board | 0.18 | 0.14 | 0.18 | 0.12 | 0.00 | 0.00 | 0.06 |
| real_estate | 0.16 | 0.12 | 0.16 | 0.10 | 0.08 | 0.10 | 0.06 |
| restaurant | 0.14 | 0.12 | 0.14 | 0.10 | 0.00 | 0.16 | 0.04 |
| nonprofit | 0.20 | 0.12 | 0.16 | 0.14 | 0.00 | 0.02 | 0.04 |

---

### `p.score.contentQuality` — Content Quality Score (0–100)

| Component Metric | Weight | Normalization |
|-----------------|--------|---------------|
| `p.content.titleLength` | 0.08 | 100 if 30–60 chars, else linear falloff |
| `p.content.metaDescLength` | 0.06 | 100 if 120–160 chars, else linear falloff |
| `p.content.h1.count` | 0.04 | 100 if =1, 60 if >1, 0 if missing |
| `p.content.hOrderValid` | 0.04 | 100 if valid, 0 if skipped levels |
| `p.content.wordCount` | 0.12 | 100 if ≥800 for informational, 100 if ≥300 for other, linear below |
| `p.content.readability.gradeLevel` | 0.10 | 100 if grade ≤8th, 80 if ≤10th, 60 if ≤12th, 40 if ≤14th, 20 if >14th |
| `p.content.freshness.days` | 0.12 | 100 if <30d, 80 if <90d, 60 if <180d, 40 if <365d, 20 if ≥365d |
| `p.content.duplicate.ratio` | 0.10 | 100 if 0, 60 if <0.3, 30 if <0.7, 0 if ≥0.7 |
| `p.content.textRatio` | 0.05 | 100 if >0.6, 80 if >0.4, 60 if >0.25, 40 if >0.15, 20 if ≤0.15 |
| `p.content.schema.richResultEligible` | 0.08 | 100 if eligible, 0 if not |
| `p.content.topic.coverage` | 0.10 | 100 if ≥0.8, 80 if ≥0.6, 60 if ≥0.4, 40 if ≥0.2, 20 if <0.2 |
| `p.content.ctaDensity` | 0.05 | 100 if 1–3 CTAs, 80 if 0, 40 if >3, 20 if >6 |
| `p.content.schema.missing` | 0.05 | 100 if none missing, 60 if 1 missing, 30 if 2+, 0 if >3 |

---

### `p.score.health` — Technical Health Score (0–100)

| Component Metric | Weight | Normalization |
|-----------------|--------|---------------|
| `p.indexing.indexable` | 0.15 | 100 if true, 0 if false |
| `p.indexing.statusCode` | 0.12 | 100 if 200, 60 if 3xx, 0 if 4xx/5xx |
| `p.tech.cwv.bucket` | 0.18 | 100 if "good", 60 if "needs-improvement", 20 if "poor" |
| `p.tech.sec.grade` | 0.12 | A=100, B=80, C=60, D=40, F=20 |
| `p.tech.a11y.score` | 0.10 | Direct pass-through (0–100) |
| `p.tech.jsRenderDep` | 0.08 | 100 if <20%, 80 if <40%, 60 if <60%, 40 if <80%, 20 if ≥80% |
| `p.indexing.redirect.chain` | 0.08 | 100 if 0, 60 if 1, 30 if 2, 0 if ≥3 |
| `p.tech.sec.mixedContent` | 0.06 | 100 if none, 0 if any |
| `p.indexing.hreflang.errors` | 0.05 | 100 if 0, 70 if 1, 40 if 2+, 0 if >3 |
| `p.content.schema.errors` | 0.06 | 100 if 0, 60 if 1, 30 if 2+, 0 if >3 |

---

### `p.score.eeat` — E-E-A-T Score (0–100)

| Component Metric | Weight | Normalization |
|-----------------|--------|---------------|
| `p.content.eeat.score` | 0.25 | Direct pass-through (0–100) |
| `p.content.author.credential` | 0.15 | 100 if linked bio + credential, 60 if bio only, 30 if name only, 0 if none |
| `p.content.eeat.experience` | 0.15 | Direct pass-through |
| `p.content.eeat.expertise` | 0.15 | Direct pass-through |
| `p.content.eeat.authoritativeness` | 0.15 | Direct pass-through |
| `p.content.eeat.trust` | 0.15 | Direct pass-through |

**YMYL multiplier:** If `fp.industry ∈ {finance, healthcare, legal, government}`, multiply final score by 1.15 (capped at 100).

---

### `p.score.search` — Search Performance Score (0–100)

| Component Metric | Weight | Normalization |
|-----------------|--------|---------------|
| `p.search.gsc.clicks` | 0.20 | 100 if ≥1000/mo, 80 if ≥500, 60 if ≥100, 40 if ≥10, 20 if >0, 0 if 0 |
| `p.search.gsc.position` | 0.18 | 100 if ≤3, 80 if ≤10, 60 if ≤20, 40 if ≤50, 20 if ≤100, 0 if >100 |
| `p.search.gsc.ctr` | 0.15 | 100 if >0.08, 80 if >0.05, 60 if >0.03, 40 if >0.01, 20 if >0, 0 if 0 |
| `p.search.totalKeywords` | 0.12 | 100 if ≥50, 80 if ≥20, 60 if ≥10, 40 if ≥5, 20 if ≥1, 0 if 0 |
| `p.search.keywordsTop3` | 0.10 | 100 if ≥5, 80 if ≥3, 60 if ≥2, 40 if ≥1, 0 if 0 |
| `p.search.serpFeaturesOwned` | 0.10 | 100 if ≥3, 80 if ≥2, 60 if ≥1, 0 if 0 |
| `p.search.gsc.isLosing` | 0.08 | 100 if false, 0 if true |
| `p.search.snippet.cannibalized` | 0.07 | 100 if false, 40 if true |

---

### `p.score.links` — Link Quality Score (0–100)

| Component Metric | Weight | Normalization |
|-----------------|--------|---------------|
| `p.links.inlinks` | 0.20 | 100 if ≥50, 80 if ≥20, 60 if ≥10, 40 if ≥5, 20 if ≥1, 0 if 0 |
| `p.links.internalPagerank` | 0.20 | 100 if top 10%, 80 if top 25%, 60 if top 50%, 40 if top 75%, 20 if bottom 25% |
| `p.links.referringDomains` | 0.15 | 100 if ≥20, 80 if ≥10, 60 if ≥5, 40 if ≥2, 20 if 1, 0 if 0 |
| `p.links.orphan` | 0.15 | 100 if false, 0 if true |
| `p.links.toxicBacklinkShare` | 0.10 | 100 if 0, 70 if <0.02, 40 if <0.05, 20 if <0.10, 0 if ≥0.10 |
| `p.links.broken` | 0.10 | 100 if 0, 60 if 1, 30 if 2+, 0 if >3 |
| `p.links.anchorTextDiversity` | 0.05 | 100 if >0.8, 80 if >0.6, 60 if >0.4, 40 if >0.2, 20 if ≤0.2 |
| `p.links.clickDepth` | 0.05 | 100 if ≤3, 80 if ≤5, 60 if ≤7, 40 if ≤10, 20 if >10 |

---

### `p.score.ai` — AI Discoverability Score (0–100)

| Component Metric | Weight | Normalization |
|-----------------|--------|---------------|
| `p.ai.botsAllowed` | 0.15 | 100 if ≥5 major bots allowed, 70 if ≥3, 40 if ≥1, 0 if none |
| `p.ai.llmsTxt` | 0.12 | 100 if llms-full.txt, 70 if llms.txt, 0 if neither |
| `p.ai.citation.rate` | 0.20 | 100 if ≥0.5, 80 if ≥0.3, 60 if ≥0.15, 40 if ≥0.05, 20 if >0, 0 if 0 |
| `p.ai.extractability` | 0.15 | Direct pass-through (0–100) |
| `p.ai.entityCoverage` | 0.12 | 100 if ≥0.8, 80 if ≥0.6, 60 if ≥0.4, 40 if ≥0.2, 20 if <0.2 |
| `p.ai.schemaForAI` | 0.10 | 100 if 3+ answer-ready types, 70 if 2, 40 if 1, 0 if none |
| `p.ai.passageFitness` | 0.08 | Direct pass-through (0–100) |
| `p.ai.speakable` | 0.08 | 100 if speakable present, 0 if not |

---

### `p.score.social` — Social Proof Score (0–100)

| Component Metric | Weight | Normalization |
|-----------------|--------|---------------|
| `p.social.shares.total` | 0.25 | 100 if ≥500, 80 if ≥100, 60 if ≥20, 40 if ≥5, 20 if >0, 0 if 0 |
| `p.social.og.previewOk` | 0.20 | 100 if all 6 platforms pass, 60 if ≥4, 30 if ≥2, 0 if <2 |
| `s.social.followers.total` | 0.20 | 100 if ≥100k, 80 if ≥10k, 60 if ≥1k, 40 if ≥100, 20 if >0, 0 if 0 |
| `s.social.engagementRate.avg` | 0.15 | 100 if >0.05, 80 if >0.03, 60 if >0.01, 40 if >0.005, 20 if >0, 0 if 0 |
| `s.social.mentions.sentiment` | 0.10 | 100 if >0.7 positive, 70 if >0.5, 40 if >0.3, 20 if ≤0.3 |
| `s.social.mentions.volume` | 0.10 | 100 if ≥50/mo, 80 if ≥20, 60 if ≥5, 40 if ≥1, 0 if 0 |

---

### `p.score.paid` — Paid Quality Score (0–100)

| Component Metric | Weight | Normalization |
|-----------------|--------|---------------|
| `p.paid.qsLpComponent` | 0.25 | 100 if ≥8, 80 if ≥6, 60 if ≥4, 40 if ≥2, 20 if ≥1, 0 if 0 |
| `p.paid.adIntentMatch` | 0.20 | 100 if ≥0.8, 80 if ≥0.6, 60 if ≥0.4, 40 if ≥0.2, 20 if <0.2 |
| `p.paid.paidCvr` | 0.20 | 100 if >0.05, 80 if >0.03, 60 if >0.015, 40 if >0.005, 20 if >0, 0 if 0 |
| `s.paid.qsAvg.all` | 0.15 | 100 if ≥8, 80 if ≥6, 60 if ≥4, 40 if ≥2, 20 if ≥1, 0 if 0 |
| `s.paid.roas.all` | 0.10 | 100 if ≥5, 80 if ≥3, 60 if ≥2, 40 if ≥1, 20 if ≥0.5, 0 if <0.5 |
| `s.paid.imprShare.all` | 0.10 | 100 if >0.5, 80 if >0.3, 60 if >0.15, 40 if >0.05, 20 if >0, 0 if 0 |

---

### `p.score.commerce` — Commerce Score (0–100)

| Component Metric | Weight | Normalization |
|-----------------|--------|---------------|
| `p.commerce.priceSchema` | 0.15 | 100 if valid, 40 if partial, 0 if missing |
| `p.commerce.availability` | 0.15 | 100 if in_stock, 50 if backorder/preorder, 0 if oos |
| `p.commerce.reviews.count` | 0.15 | 100 if ≥50, 80 if ≥20, 60 if ≥5, 40 if ≥1, 0 if 0 |
| `p.commerce.reviews.avg` | 0.12 | 100 if ≥4.5, 80 if ≥4.0, 60 if ≥3.5, 40 if ≥3.0, 20 if ≥2.0, 0 if <2.0 |
| `p.commerce.imagesPerProduct` | 0.10 | 100 if ≥5, 80 if ≥3, 60 if ≥2, 40 if 1, 0 if 0 |
| `p.commerce.altImageCoverage` | 0.10 | 100 if ≥0.9, 80 if ≥0.7, 60 if ≥0.5, 40 if ≥0.3, 20 if <0.3 |
| `p.commerce.breadcrumbValid` | 0.08 | 100 if valid, 0 if invalid/missing |
| `p.commerce.feed.errors` | 0.10 | 100 if 0, 60 if 1–2, 30 if 3+, 0 if >5 |
| `p.commerce.faq.present` | 0.05 | 100 if present, 0 if absent |

---

### `p.score.local` — Local Score (0–100)

| Component Metric | Weight | Normalization |
|-----------------|--------|---------------|
| `e.local.nap.score` | 0.20 | 100 if ≥0.95, 80 if ≥0.85, 60 if ≥0.7, 40 if ≥0.5, 20 if <0.5 |
| `e.local.gbp.verified` | 0.15 | 100 if verified, 0 if not |
| `e.local.gbp.completeness` | 0.15 | 100 if ≥90%, 80 if ≥75%, 60 if ≥50%, 40 if ≥25%, 20 if <25% |
| `e.local.reviews.avg.google` | 0.15 | 100 if ≥4.5, 80 if ≥4.0, 60 if ≥3.5, 40 if ≥3.0, 20 if ≥2.0, 0 if <2.0 |
| `e.local.reviews.count.google` | 0.10 | 100 if ≥50, 80 if ≥20, 60 if ≥5, 40 if ≥1, 0 if 0 |
| `e.local.citations.quality` | 0.10 | 100 if ≥0.9, 80 if ≥0.7, 60 if ≥0.5, 40 if ≥0.3, 20 if <0.3 |
| `p.local.localBusinessSchema` | 0.08 | 100 if present + valid, 40 if present + errors, 0 if absent |
| `e.local.rankGeogrid` | 0.07 | 100 if avg ≤3, 80 if ≤5, 60 if ≤10, 40 if ≤20, 20 if >20 |

---

### `p.score.ux` — UX Score (0–100)

| Component Metric | Weight | Normalization |
|-----------------|--------|---------------|
| `p.ga.engagementRate` | 0.20 | 100 if >0.6, 80 if >0.45, 60 if >0.3, 40 if >0.15, 20 if ≤0.15 |
| `p.ux.rageClicks` | 0.18 | 100 if 0, 70 if ≤2, 40 if ≤5, 20 if ≤10, 0 if >10 |
| `p.ga.conversionRate` | 0.18 | 100 if >0.05, 80 if >0.03, 60 if >0.015, 40 if >0.005, 20 if >0, 0 if 0 |
| `p.ux.deadClicks` | 0.12 | 100 if 0, 70 if ≤3, 40 if ≤8, 20 if >8 |
| `p.ux.scrollDead` | 0.10 | 100 if <0.1, 80 if <0.2, 60 if <0.3, 40 if <0.5, 20 if ≥0.5 |
| `p.ga.bounce` | 0.12 | 100 if <0.3, 80 if <0.45, 60 if <0.55, 40 if <0.7, 20 if ≥0.7 |
| `p.ux.uTurns` | 0.10 | 100 if 0, 70 if ≤2, 40 if ≤5, 20 if >5 |

---

### `p.score.email` — Email Score (0–100)

| Component Metric | Weight | Normalization |
|-----------------|--------|---------------|
| `s.email.domainAuth.dmarc` | 0.20 | 100 if reject/quarantine, 60 if none, 0 if p=none |
| `s.email.domainAuth.spf` | 0.15 | 100 if valid, 0 if invalid/missing |
| `s.email.domainAuth.dkim` | 0.15 | 100 if valid, 0 if invalid/missing |
| `s.email.deliverability` | 0.15 | 100 if >0.95, 80 if >0.90, 60 if >0.80, 40 if >0.70, 20 if ≤0.70 |
| `s.email.openRate` | 0.12 | 100 if >0.25, 80 if >0.20, 60 if >0.15, 40 if >0.10, 20 if >0.05, 0 if ≤0.05 |
| `s.email.ctr` | 0.12 | 100 if >0.05, 80 if >0.03, 60 if >0.02, 40 if >0.01, 20 if >0, 0 if 0 |
| `s.email.bounceRate` | 0.06 | 100 if <0.01, 80 if <0.02, 60 if <0.03, 40 if <0.05, 20 if ≥0.05 |
| `s.email.bimi` | 0.05 | 100 if present, 0 if absent |

---

### `s.score.compliance` — Compliance Score (0–100)

| Component | Weight | Source Metrics |
|-----------|--------|----------------|
| Accessibility | 0.35 | `p.tech.a11y.score` |
| Security | 0.30 | `p.tech.sec.grade` → A=100, B=80, C=60, D=40, F=20 |
| Privacy | 0.20 | `p.tech.consent.mode` → v2=100, v1=60, none=20 |
| HTTPS | 0.15 | `p.tech.sec.tlsVersion` → TLS13=100, TLS12=60, older=20 |

---

### `s.score.opportunity` — Opportunity Score (0–100)

Aggregated from action engine forecasts:

```
opportunityScore = min(100, Σ(action.expectedDelta × action.confidence) for top-10 actions)
```

Normalized to 0–100 scale where:
- 0–20: Low opportunity (few actionable improvements)
- 20–40: Moderate (some quick wins)
- 40–60: Good (multiple high-impact actions available)
- 60–80: High (significant improvement potential)
- 80–100: Critical (many blocking/revenue-loss actions)

---

### `s.score.business` — Business Value Score (0–100)

Composite of revenue-weighted metrics:

```
businessScore = weightedAvg(revenueContribution, conversionWeight, trafficWeight, strategicWeight)
```

| Component | Weight | Source |
|-----------|--------|--------|
| Revenue contribution | 0.35 | `p.ga.revenue` relative to site total |
| Conversion weight | 0.25 | `p.ga.conversionRate` × `p.ga.sessions` |
| Traffic weight | 0.20 | `p.search.gsc.clicks` + `p.ga.sessions` relative to site total |
| Strategic weight | 0.20 | `p.score.strategic.priority` (from action engine) |

---

## Action Reverse-Mapping

> For each metric, which actions it feeds. This is the reverse of the action catalog's
> `requires[]` field. Useful for understanding the downstream impact of any metric.

### Page Fundamentals `p.*`

| Metric | Feeds Actions | Impact |
|--------|--------------|--------|
| `p.indexing.statusCode` | T02 (fix_5xx), T03 (fix_4xx) | BLOCKING / HIGH_LEVERAGE |
| `p.indexing.indexable` | T01 (fix_indexability) | BLOCKING |
| `p.indexing.canonicalChain` | T16 (fix_canonical_loop) | BLOCKING |
| `p.indexing.redirectChain` | T04 (fix_redirect_chain), L06 (shorten_redirect_chain) | HIGH_LEVERAGE |
| `p.indexing.hreflangErrors` | T05 (fix_hreflang) | HIGH_LEVERAGE |
| `p.indexing.inSitemap` | T13 (fix_sitemap) | HIGH_LEVERAGE |
| `p.indexing.isSoft404` | T15 (remove_soft404) | HIGH_LEVERAGE |
| `p.indexing.statusCode` | T12 (fix_a11y_batch) — if high-traffic + 5xx | HIGH_LEVERAGE |
| `p.redirect.loop` | T04 (fix_redirect_chain) | BLOCKING |

### Content `p.content.*`

| Metric | Feeds Actions | Impact |
|--------|--------------|--------|
| `p.content.title` | C01 (rewrite_title) | HIGH_LEVERAGE |
| `p.content.metaDesc` | C02 (rewrite_meta) | HIGH_LEVERAGE |
| `p.content.freshnessDays` | C03 (refresh_content) | HIGH_LEVERAGE |
| `p.content.contentDecay` | C03 (refresh_content), C08 (redirect_to_stronger) | HIGH_LEVERAGE / REVENUE_LOSS |
| `p.content.wordCount` | C04 (expand_thin_content) | HIGH_LEVERAGE |
| `p.content.cannibalization` | C05 (merge_cannibal), C06 (split_overlap) | HIGH_LEVERAGE |
| `p.content.intentSearch` | C05 (merge_cannibal), C06 (split_overlap), S04 (expand_intent_coverage) | HIGH_LEVERAGE |
| `p.content.duplicateExact` | C07 (deprecate), C08 (redirect_to_stronger), C13 (fix_duplicate) | HIGH_LEVERAGE |
| `p.content.schemaErrors` | T06 (fix_schema_errors) | HIGH_LEVERAGE |
| `p.content.schemaCoverage` | T07 (upgrade_schema_coverage) | HIGH_LEVERAGE |
| `p.content.faqPresent` | C09 (add_faq_schema) | HIGH_LEVERAGE |
| `p.content.howtoPresent` | C10 (add_howto_schema) | HIGH_LEVERAGE |
| `p.content.eeatScore` | C11 (add_author_eeat) | STRATEGIC |
| `p.content.topicCoverage` | C12 (rebuild_topic_cluster) | STRATEGIC |
| `p.content.imagesMissingAlt` | C14 (alt_text_batch) | HYGIENE |
| `p.content.readabilityGradeLevel` | C15 (fix_readability) | HIGH_LEVERAGE |
| `p.content.aiGeneratedProb` | C16 (rewrite_ai_text) | STRATEGIC |
| `p.content.questionsList` | S04 (expand_intent_coverage) | STRATEGIC |
| `p.content.answerBoxFit` | S02 (win_featured_snippet), A03 (add_answer_structure) | STRATEGIC |
| `p.content.schemaErrors` | T06 (fix_schema_errors) | HIGH_LEVERAGE |

### Technical `p.tech.*`

| Metric | Feeds Actions | Impact |
|--------|--------------|--------|
| `p.tech.cwv.bucket` | T08 (improve_cwv) | HIGH_LEVERAGE |
| `p.tech.jsRenderDep` | T09 (reduce_js_dependency) | HIGH_LEVERAGE |
| `p.tech.sec.grade` | T10 (fix_security_headers) | HIGH_LEVERAGE |
| `p.tech.sec.sslDays` | T11 (rotate_ssl) | BLOCKING |
| `p.tech.sec.mixedContent` | T14 (fix_mixedContent) | HIGH_LEVERAGE |
| `p.tech.a11y.violations` | T12 (fix_a11y_batch) | HIGH_LEVERAGE |

### Links `p.links.*`

| Metric | Feeds Actions | Impact |
|--------|--------------|--------|
| `p.links.orphan` | L01 (add_internal_links) | HIGH_LEVERAGE |
| `p.links.internalPagerank` | L02 (redistribute_pagerank) | HIGH_LEVERAGE |
| `p.links.toxicBacklinkShare` | L03 (remove_toxic_backlinks) | HIGH_LEVERAGE |
| `p.links.broken` | L05 (fix_broken_links) | HIGH_LEVERAGE |
| `p.links.exactMatchAnchorPct` | L07 (diversify_anchors) | HIGH_LEVERAGE |

### Search `p.search.*`

| Metric | Feeds Actions | Impact |
|--------|--------------|--------|
| `p.search.gsc.position` | S01 (target_near_miss_kw), S06 (optimize_ctr) | HIGH_LEVERAGE |
| `p.search.gsc.clicks` | S01 (target_near_miss_kw), S03 (reclaim_lost_kw) | HIGH_LEVERAGE |
| `p.search.gsc.ctr` | S06 (optimize_ctr) | HIGH_LEVERAGE |
| `p.search.gsc.isLosing` | S03 (reclaim_lost_kw) | HIGH_LEVERAGE |
| `p.search.snippetCannibalized` | S05 (dedupe_serp_cannibal) | HIGH_LEVERAGE |
| `p.search.entityInKG` | A05 (claim_entity) | STRATEGIC |

### AI `p.ai.*`

| Metric | Feeds Actions | Impact |
|--------|--------------|--------|
| `p.ai.botsAllowed` | A01 (unblock_ai_bots) | STRATEGIC |
| `p.ai.llmsTxt` | A02 (add_llms_txt) | STRATEGIC |
| `p.ai.answerBoxFit` | A03 (add_answer_structure) | STRATEGIC |
| `p.ai.speakable` | A04 (add_speakable) | STRATEGIC |

### Paid `p.paid.*`

| Metric | Feeds Actions | Impact |
|--------|--------------|--------|
| `p.paid.qsLpComponent` | P04 (fix_lp_for_qs) | HIGH_LEVERAGE |
| `p.paid.adIntentMatch` | P08 (align_message_match) | HIGH_LEVERAGE |
| `s.paid.qsAvg.all` | P01 (pause_low_qs) | HIGH_LEVERAGE |
| `s.paid.roas.all` | P05 (reallocate_budget) | HIGH_LEVERAGE |

### UX `p.ux.*`

| Metric | Feeds Actions | Impact |
|--------|--------------|--------|
| `p.ux.rageClicks` | U03 (fix_rage_hotspot), U05 (run_experiment) | HIGH_LEVERAGE |
| `p.ga.conversionRate` | U04 (move_cta_above_fold), U05 (run_experiment) | HIGH_LEVERAGE |

### Social `p.social.*`

| Metric | Feeds Actions | Impact |
|--------|--------------|--------|
| `p.social.ogMissingTags` | SO01 (fix_og_tags) | HYGIENE |

### Commerce `p.commerce.*`

| Metric | Feeds Actions | Impact |
|--------|--------------|--------|
| `p.commerce.feedErrors` | E01 (fix_feed_attrs) | HIGH_LEVERAGE |
| `p.commerce.availability` | E02 (restock_visibility) | REVENUE_LOSS |
| `p.commerce.reviewsCount` | E03 (add_review_schema) | HIGH_LEVERAGE |

### Local `p.local.*` + `e.local.*`

| Metric | Feeds Actions | Impact |
|--------|--------------|--------|
| `e.local.napScore` | LO01 (fix_nap) | HIGH_LEVERAGE |
| `e.local.gbpVerified` | LO02 (claim_gbp) | BLOCKING |
| `e.local.reviewsNegative` | LO03 (respond_reviews) | HIGH_LEVERAGE |
| `e.local.serviceAreaPages` | LO04 (add_service_area_page) | STRATEGIC |

### GA/Conversion `p.ga.*`

| Metric | Feeds Actions | Impact |
|--------|--------------|--------|
| `p.ga.sessions` | T08 (improve_cwv) — only if high traffic | HIGH_LEVERAGE |
| `p.ga.conversionRate` | U04 (move_cta_above_fold), P05 (reallocate_budget) | HIGH_LEVERAGE |

---

## Action Trigger Conditions

> Detailed trigger logic for each action. These are the predicate functions
> that evaluate whether an action should fire for a given page/site.

### Content Actions

| Code | Trigger Condition | Source Metrics |
|------|------------------|----------------|
| C01 | title missing OR length <20 OR length >70 OR (gsc.clicks >0 AND gsc.ctr < expectedCtrForPosition) | `p.content.title`, `p.content.titleLength`, `p.search.gsc.ctr` |
| C02 | metaDesc missing OR length <70 OR length >160 OR truncated in SERP | `p.content.metaDesc`, `p.content.metaDescLength` |
| C03 | freshness.days >180 AND contentDecay = true AND gsc.position ≥4 AND gsc.position ≤20 | `p.content.freshnessDays`, `p.content.contentDecay`, `p.search.gsc.position` |
| C04 | wordCount <300 AND intentSearch = informational AND gsc.position <50 | `p.content.wordCount`, `p.content.intentSearch`, `p.search.gsc.position` |
| C05 | cannibalization = true AND semanticSimilarity >0.8 | `p.content.cannibalization`, `p.content.semanticSimilarity` |
| C06 | two+ distinct intent clusters detected in page content AND ranks for both | `p.content.intentSearch`, `p.content.topic.cluster` |
| C07 | gsc.clicks = 0 for 180d AND gsc.position = 0 AND inlinks <3 | `p.search.gsc.clicks`, `p.search.gsc.position`, `p.links.inlinks` |
| C08 | isSoft404 OR (statusCode ≠ 200) AND sibling with traffic exists | `p.indexing.isSoft404`, `p.indexing.statusCode`, `p.content.semanticSimilarity` |
| C09 | questions detected in content AND schema.types does not contain FAQPage | `p.content.questionsList`, `p.content.schema.types` |
| C10 | step-by-step procedure detected AND schema.types does not contain HowTo | `p.content.outline.valid`, `p.content.schema.types` |
| C11 | fp.industry ∈ YMYL AND author.name is missing AND author.bio.present = false | `fp.industry`, `p.content.author`, `p.content.author.bio.present` |
| C12 | topic.coverage <0.6 for cluster | `p.content.topic.coverage` |
| C13 | duplicate.exact = true OR duplicate.nearMatch.length >0 | `p.content.duplicate.exact`, `p.content.duplicate.nearMatch` |
| C14 | images.missingAlt ≥5 | `p.content.images.missingAlt` |
| C15 | readability.gradeLevel > expectedGradeForIntentAndLang | `p.content.readability.gradeLevel`, `p.content.intentSearch`, `fp.language.primary` |
| C16 | aiGeneratedProb >0.8 AND gsc.position <50 AND eeat.score <50 | `p.content.aiGeneratedProb`, `p.search.gsc.position`, `p.content.eeat.score` |
| C17 | (orphan = true OR nearOrphan = true) AND intentSearch matches another page | `p.links.orphan`, `p.links.nearOrphan`, `p.content.intentSearch` |

### Technical Actions

| Code | Trigger Condition | Source Metrics |
|------|------------------|----------------|
| T01 | indexable = false AND (ga.sessions >0 OR p.links.inlinks >0 OR p.search.gsc.clicks >0) | `p.indexing.indexable`, `p.ga.sessions`, `p.links.inlinks`, `p.search.gsc.clicks` |
| T02 | statusCode ≥500 | `p.indexing.statusCode` |
| T03 | statusCode = 404 AND (inlinks >0 OR referringDomains >0) | `p.indexing.statusCode`, `p.links.inlinks`, `p.links.referringDomains` |
| T04 | redirect.chain.length >1 OR redirect.loop = true | `p.indexing.redirectChain`, `p.redirect.loop` |
| T05 | hreflang.errors.length >0 | `p.indexing.hreflangErrors` |
| T06 | schema.errors.length >0 | `p.content.schemaErrors` |
| T07 | schema.missing.length >0 AND industryRequiredSchema present | `p.content.schema.missing`, `fp.industry` |
| T08 | cwv.bucket ∈ {poor, needs-improvement} AND ga.sessions >100 | `p.tech.cwv.bucket`, `p.ga.sessions` |
| T09 | jsRenderDep >0.6 AND critical content is JS-only | `p.tech.jsRenderDep`, `p.tech.jsDiff.hydrationMismatch` |
| T10 | sec.grade ∈ {D, F} | `p.tech.sec.grade` |
| T11 | sec.sslDays <30 | `p.tech.sec.sslDays` |
| T12 | a11y.violations >10 AND ga.sessions >1000 | `p.tech.a11y.violations`, `p.ga.sessions` |
| T13 | inSitemap ≠ sitemapExpected (based on indexable + type) | `p.indexing.inSitemap` |
| T14 | sec.mixedContent = true | `p.tech.sec.mixedContent` |
| T15 | isSoft404 = true | `p.indexing.isSoft404` |
| T16 | canonicalChain.length >1 (canonical points to non-self, which points elsewhere) | `p.indexing.canonicalChain` |

### Links Actions

| Code | Trigger Condition | Source Metrics |
|------|------------------|----------------|
| L01 | orphan = true OR nearOrphan = true | `p.links.orphan`, `p.links.nearOrphan` |
| L02 | internalPagerank < expectedPRForDepth AND ga.sessions >50 | `p.links.internalPagerank`, `p.depth.crawl`, `p.ga.sessions` |
| L03 | toxicBacklinkShare >0.05 AND gsc.position trending down | `p.links.toxicBacklinkShare`, `p.search.gsc.deltaPosition28d` |
| L04 | brand mention detected in external content without link (AI-detected) | `p.content.entities.list`, `p.links.referringDomains` |
| L05 | broken internal/external links on pages with ga.sessions >100 OR gsc.clicks >10 | `p.links.broken`, `p.ga.sessions`, `p.search.gsc.clicks` |
| L06 | redirect.chain.length >2 | `p.indexing.redirectChain` |
| L07 | exactMatchAnchorPct >0.3 | `p.links.exactMatchAnchorPct` |

### Search Actions

| Code | Trigger Condition | Source Metrics |
|------|------------------|----------------|
| S01 | gsc.position ≥4 AND gsc.position ≤10 AND gsc.impressions >threshold (industry-specific) | `p.search.gsc.position`, `p.search.gsc.impr` |
| S02 | gsc.position ≤5 AND answerBoxFit >0.7 AND featuredSnippet.own = false | `p.search.gsc.position`, `p.content.answerBoxFit`, `p.search.featuredSnippet.own` |
| S03 | gsc.isLosing = true AND gsc.deltaClicks28d <0 | `p.search.gsc.isLosing`, `p.search.gsc.deltaClicks28d` |
| S04 | questionsList.length >0 AND topic.coverage <0.7 | `p.content.questionsList`, `p.content.topic.coverage` |
| S05 | snippet.cannibalized = true | `p.search.snippet.cannibalized` |
| S06 | gsc.impressions >100 AND gsc.ctr < expectedCtrForPosition | `p.search.gsc.impr`, `p.search.gsc.ctr`, `p.search.gsc.position` |

### AI Actions

| Code | Trigger Condition | Source Metrics |
|------|------------------|----------------|
| A01 | valuable AI bot blocked (in p.ai.botsBlocked) AND citation.rate <0.1 | `p.ai.botsBlocked`, `p.ai.citation.rate` |
| A02 | llmsTxt = false AND fp.size.urls >1000 | `p.ai.llmsTxt`, `fp.size.urls` |
| A03 | answerBoxFit <0.4 AND intentSearch = informational | `p.ai.answerBoxFit`, `p.content.intentSearch` |
| A04 | intentSearch ∈ {navigational, local} AND speakable = false | `p.content.intentSearch`, `p.ai.speakable` |
| A05 | schema.types does not contain Organization OR knowledgePanel = false | `p.content.schema.types`, `p.search.knowledgePanel` |

### Paid Actions

| Code | Trigger Condition | Source Metrics |
|------|------------------|----------------|
| P01 | qsAvg <6 AND spend >dailyThreshold | `s.paid.qsAvg.all`, `s.paid.spend30d.all` |
| P02 | irrelevant search terms detected in query report | `p.search.gsc.query.all.nonBranded` (cross-ref with paid terms) |
| P03 | ad CTR ▼25% over 14d | `s.paid.campaignCount` (CTR trend from Ads API) |
| P04 | qsLpComponent <5 | `p.paid.qsLpComponent` |
| P05 | roas <1 AND sibling campaign roas >3 WITH budget headroom | `s.paid.roas.all` |
| P06 | ad disapproved AND campaign still active | `s.paid.adCount` (from Ads API) |
| P07 | RSA asset coverage < "Good" | `s.paid.adCount` (from Ads API) |
| P08 | adIntentMatch <0.6 | `p.paid.adIntentMatch` |

### UX Actions

| Code | Trigger Condition | Source Metrics |
|------|------------------|----------------|
| U01 | form.fieldMetrics shows single-field drop >30% | `p.conv.form.fieldMetrics` |
| U02 | form.fields >6 AND form.abandon >0.6 | `p.conv.form.fieldMetrics`, `p.conv.form.abandon` |
| U03 | rageClicks >threshold AND page is a converter | `p.ux.rageClicks`, `p.ga.conversionRate` |
| U04 | CTA below fold line AND conversionRate <expected | `p.ctaDensity`, `p.ga.conversionRate` |
| U05 | friction point detected AND ga.sessions >minSampleSize | `p.ux.rageClicks`, `p.ux.deadClicks`, `p.ga.sessions` |

### Social Actions

| Code | Trigger Condition | Source Metrics |
|------|------------------|----------------|
| SO01 | ogMissingTags >0 AND traffic from social >0 | `p.social.ogMissingTags`, `p.ga.channel.social` |
| SO02 | crisis.signal = true | `s.social.crisis.signal` |
| SO03 | postingCadence ≠ bestTime | `s.social.postingCadence`, `s.social.bestTime` |
| SO04 | short-video share <0.2 AND engagement lift from short-video detected | `s.social.bestType`, `s.social.engagementRate` |

### Commerce Actions

| Code | Trigger Condition | Source Metrics |
|------|------------------|----------------|
| E01 | feed.errors >0 AND revenue products affected | `p.commerce.feed.errors`, `p.ga.revenue` |
| E02 | availability = oos AND oosDuration >7d AND indexable = true | `p.commerce.availability`, `p.commerce.oosDuration`, `p.indexing.indexable` |
| E03 | reviews.count >0 AND schema.types does not contain Review/AggregateRating | `p.commerce.reviews.count`, `p.content.schema.types` |
| E04 | depth.folder >3 AND category with traffic | `p.depth.folder`, `p.ga.sessions` |

### Local Actions

| Code | Trigger Condition | Source Metrics |
|------|------------------|----------------|
| LO01 | nap.score <0.9 | `e.local.nap.score` |
| LO02 | gbp.verified = false OR gbp.linked = false | `e.local.gbp.verified`, `e.local.gbp.linked` |
| LO03 | reviews.negative ≥3 AND reviews.responseRate <0.5 | `e.local.reviews.negative`, `e.local.reviews.responseRate` |
| LO04 | serviceArea.coverage >0 AND serviceArea.pages = 0 | `e.local.serviceArea.coverage`, `e.local.serviceArea.pages` |

---
