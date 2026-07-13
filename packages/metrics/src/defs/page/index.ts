import type { MetricDef } from '@seesby/types';

export const pageMetrics: MetricDef[] = [
  {
    key: 'p.content.category',
    namespace: 'p.content',
    level: 'P',
    roles: ['S', 'K'],
    sources: ['T0'],
    format: 'enum',
    i18nLabelKey: 'metric.p.content.category',
    tags: ['defaultVisible', 'legacy:pageCategory'],
  },
  {
    key: 'p.commerce.feed.errors',
    namespace: 'p.commerce',
    level: 'P',
    roles: ['G', 'I', 'A', 'E'],
    sources: ['T0', 'T3'],
    format: 'number',
    i18nLabelKey: 'metric.p.commerce.feed.errors',
    gate: { industries: ['ecommerce'], modes: ['commerce', 'fullAudit'] },
  },
];
