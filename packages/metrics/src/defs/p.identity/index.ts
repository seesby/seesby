// packages/metrics/src/defs/p.identity/index.ts
import type { MetricDef } from '@seesby/types';

export const IDENTITY_METRICS: MetricDef[] = [
	{
		key: 'p.identity.url',
		namespace: 'p.identity',
		level: 'P',
		roles: ['K', 'G', 'I', 'X'],
		sources: ['T0', 'T7'],
		surfaces: ['grid', 'inspector', 'export'],
		format: 'url',
		i18nLabelKey: 'metric.p.identity.url.label',
		description: 'The canonical URL of the page.',
		legacyAlias: ['url', 'canonical'],
		defaultVisible: true,
	},
	{
		key: 'p.identity.category',
		namespace: 'p.identity',
		level: 'P',
		roles: ['L', 'G', 'I'],
		sources: ['T6', 'T7'],
		surfaces: ['grid', 'sidebar', 'inspector'],
		format: 'enum',
		i18nLabelKey: 'metric.p.identity.category.label',
		description: 'Page type category (Product, Article, Category, etc.)',
		legacyAlias: ['pageType', 'category'],
	}
];
