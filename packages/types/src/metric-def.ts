// packages/types/src/metric-def.ts
import type { CmsKey } from './cms';
import type { Industry } from './industries';
import type { LanguageCode } from './languages';
import type { Mode } from './modes';
import type { MetricRole } from './roles';
import type { SourceTier, SourceStamp } from './sources';

export type MetricLevel =
	| 'P' // page
	| 'S' // site
	| 'K' // cluster
	| 'Q' // query / keyword
	| 'L' // link
	| 'E' // entity
	| 'B' // background job
	| 'U' // universal (config, flag)
	| 'F'; // fingerprint

export type MetricSurface = 'grid' | 'sidebar' | 'inspector' | 'header' | 'canvas' | 'export' | 'site';

export type MetricFormat =
	| 'number' | 'percent' | 'duration' | 'bytes' | 'date' | 'enum'
	| 'text' | 'score' | 'money' | 'boolean' | 'url' | 'list' | 'json';

export type Capability = 'cms.any' | `cms.${CmsKey}` | 'crawl' | 'serp' | 'browser' | 'ai' | 'gbp' | 'bing' | 'gsc' | 'ga4' | 'backlinks';
export type IntegrationId = 'gsc' | 'ga4' | 'gbp' | 'bing' | 'backlinks' | 'serp' | 'ads' | 'social' | 'email';

export interface MetricGate {
	modes?: ReadonlyArray<Mode>;
	industries?: ReadonlyArray<Industry>;
	excludeIndustries?: ReadonlyArray<Industry>;
	cms?: ReadonlyArray<CmsKey>;
	languages?: ReadonlyArray<LanguageCode>;
	stack?: ReadonlyArray<string>;
	minUrls?: number;
	requireConnected?: ReadonlyArray<IntegrationId>;
	requireCapability?: ReadonlyArray<Capability>;
	hideWhenLowConfidence?: boolean;
	custom?: string;
}

export type RecomputeCadence =
	| 'on-crawl'       // recompute each time the page is crawled
	| 'end-of-session' // recompute at end of each crawl session
	| 'daily'          // recompute once per day (background jobs)
	| 'weekly'         // recompute once per week
	| 'monthly'        // recompute once per month
	| 'on-change'      // recompute when upstream config/data changes
	| 'event-driven';  // recompute on specific event (core update, schema spec change)

export interface MetricDef {
	key: string;                    // dotted, e.g. 'p.content.wordCount'
	namespace: string;              // dotted prefix, e.g. 'p.content'
	level: MetricLevel;
	roles: ReadonlyArray<MetricRole>;
	sources: ReadonlyArray<SourceTier>;
	surfaces?: ReadonlyArray<MetricSurface>;
	unit?: string;
	format?: MetricFormat;
	width?: string;
	defaultVisible?: boolean;
	i18nLabelKey: string;
	gate?: MetricGate;
	description?: string;
	deprecated?: boolean;
	scoreComponent?: 'health' | 'tech' | 'content' | 'links' | 'commerce' | 'local' | 'ai' | 'social' | 'ux' | 'paid' | 'email' | 'quality';
	actionKeys?: ReadonlyArray<string>;
	fallbackKey?: string;
	legacyAlias?: ReadonlyArray<string>; // page-object property names this def replaces
	tags?: ReadonlyArray<string>;
	/** How often this metric value is revalidated in the background. */
	recomputeCadence?: RecomputeCadence;
}

export interface MetricSample {
	key: string;
	value: unknown;
	scope: 'page' | 'site' | 'cluster' | 'query' | 'link' | 'entity' | 'fingerprint';
	scopeId: string;
	stamp: SourceStamp;
}
