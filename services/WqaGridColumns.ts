// Shared cell-level helpers for the WQA Grid view.
// Keeps WqaGridView lean and avoids touching MainDataView's giant cell branch.

export const ACTION_KIND_BY_COL: Record<string, 'technical' | 'content' | 'industry' | 'monitor'> = {
    'p.tech.action':      'technical',
    'p.content.action':   'content',
    'fp.industry':        'industry',
    's.score.qOverall':   'monitor', // tinted by primaryActionCategory at render time
};

export const WQA_COLUMN_PRESETS: Array<{ id: string; label: string; columns: string[] }> = [
    {
        id: 'default',
        label: 'Default',
        columns: [
            'p.identity.url',
            'p.content.contentType.classified',
            's.score.qOverall',
            'p.tech.action',
            'p.content.action',
            'p.search.gsc.clicks',
            'p.search.gsc.impressions',
            'p.search.gsc.position',
            'p.search.gsc.ctr',
            'p.ga.sessions',
            'p.links.inlinks',
            'p.tech.cwv.bucket',
            'p.content.freshness.days',
        ],
    },
    {
        id: 'search',
        label: 'Search-focused',
        columns: [
            'p.identity.url',
            'p.content.contentType.classified',
            'p.search.mainKw',
            'p.search.mainKwPos',
            'p.search.gsc.clicks',
            'p.search.gsc.impressions',
            'p.search.gsc.ctr',
            'p.search.gsc.position',
            'p.content.intentSearch',
            'p.search.gsc.isLosing',
            'p.tech.action',
        ],
    },
    {
        id: 'quality',
        label: 'Quality-focused',
        columns: [
            'p.identity.url',
            'p.content.contentType.classified',
            's.score.qOverall',
            'p.content.wordCount',
            'p.content.readabilityFlesch',
            'p.content.eeat.score',
            'p.content.freshness.days',
            'p.content.schema.errors',
            'p.content.duplicate.status',
            'p.content.action',
        ],
    },
    {
        id: 'tech',
        label: 'Tech-focused',
        columns: [
            'p.identity.url',
            'p.indexing.statusCode',
            'p.indexing.indexable',
            'p.tech.cwv.bucket',
            'p.tech.sec.grade',
            'p.tech.a11y.score',
            'p.indexing.inSitemap',
            'p.links.inlinks',
            'p.tech.action',
        ],
    },
];

import { ALL_METRICS } from '@seesby/metrics';

export function getWqaColumnPreset(id: string) {
    return WQA_COLUMN_PRESETS.find((p) => p.id === id) || WQA_COLUMN_PRESETS[0];
}

/**
 * Dev-time validation to ensure presets don't drift from the canonical catalog.
 */
export function validateColumnPresets(): { valid: boolean; missing: string[] } {
  const catalogKeys = new Set(ALL_METRICS.map(m => m.key));
  const missing: string[] = [];

  WQA_COLUMN_PRESETS.forEach(preset => {
    preset.columns.forEach(col => {
      if (!catalogKeys.has(col)) {
        missing.push(`${preset.id}: ${col}`);
      }
    });
  });

  return {
    valid: missing.length === 0,
    missing
  };
}
