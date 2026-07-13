// packages/metrics/src/catalog.ts
import type { MetricDef } from '@seesby/types';

import { IDENTITY_METRICS } from './defs/p.identity';
import { INDEXING_METRICS } from './defs/p.indexing';
import { TECH_METRICS } from './defs/p.tech';
import { CONTENT_METRICS } from './defs/p.content';
import { LINKS_METRICS } from './defs/p.links';
import { UX_METRICS } from './defs/p.ux';
import { COMMERCE_METRICS } from './defs/p.commerce';
import { LOCAL_METRICS } from './defs/p.local';
import { SEARCH_METRICS } from './defs/p.search';
import { AI_METRICS } from './defs/p.ai';
import { SOCIAL_METRICS } from './defs/p.social';
import { PAID_METRICS } from './defs/p.paid';
import { GA_METRICS } from './defs/p.ga';
import { CONV_METRICS } from './defs/p.conv';
import { SCORE_METRICS } from './defs/p.score';
import { ACTIONS_METRICS } from './defs/p.actions';
import { ISSUES_METRICS } from './defs/p.issues';
import { FP_METRICS } from './defs/fp';
import { clusterMetrics } from './defs/cluster';
import { keywordMetrics } from './defs/keyword';
import { linkMetrics } from './defs/link';
import { entityMetrics } from './defs/entity';
import { backgroundMetrics } from './defs/background';
import { userMetrics } from './defs/universal';
import { siteMetrics } from './defs/site';
import { pageMetrics } from './defs/page';

export const ALL_METRICS: MetricDef[] = [
	...IDENTITY_METRICS,
	...INDEXING_METRICS,
	...TECH_METRICS,
	...CONTENT_METRICS,
	...LINKS_METRICS,
	...UX_METRICS,
	...COMMERCE_METRICS,
	...LOCAL_METRICS,
	...SEARCH_METRICS,
	...AI_METRICS,
	...SOCIAL_METRICS,
	...PAID_METRICS,
	...GA_METRICS,
	...CONV_METRICS,
	...SCORE_METRICS,
	...ACTIONS_METRICS,
	...ISSUES_METRICS,
	...FP_METRICS,
	...clusterMetrics,
	...keywordMetrics,
	...linkMetrics,
	...entityMetrics,
	...backgroundMetrics,
	...userMetrics,
	...siteMetrics,
	...pageMetrics,
];

const METRIC_MAP = new Map<string, MetricDef>(ALL_METRICS.map(m => [m.key, m]));

// Index legacy aliases so getMetricDef resolves renamed keys.
for (const m of ALL_METRICS) {
	if (m.legacyAlias) {
		for (const alias of m.legacyAlias) {
			if (!METRIC_MAP.has(alias)) METRIC_MAP.set(alias, m);
		}
	}
}

export function getMetricDef(key: string): MetricDef | undefined {
	return METRIC_MAP.get(key);
}

export function getMetricsByNamespace(ns: string): MetricDef[] {
	return ALL_METRICS.filter(m => m.namespace === ns || m.namespace.startsWith(ns + '.'));
}

export * from './visibility';
