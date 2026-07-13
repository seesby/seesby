import { beforeAll, describe, expect, it } from 'vitest';
import type { Industry, ProjectFingerprint } from '@seesby/types';
import { initCatalog } from '../catalog';
import { MetricRegistry } from '../registry';

beforeAll(() => initCatalog());

describe('MetricRegistry', () => {
  it('loads the scaffold catalog without duplicate keys', () => {
    expect(MetricRegistry.size()).toBeGreaterThan(5);
  });

  it('resolves legacy aliases', () => {
    expect(MetricRegistry.get('gscClicks')?.key).toBe('p.search.gsc.clicks');
    expect(MetricRegistry.get('hasMenuSchema')?.key).toBe('s.local.hasMenuSchema');
  });

  it('gates commerce metrics out of saas mode', () => {
    const fp = makeFp({ industry: 'saas' });
    const cols = MetricRegistry.columnsFor({ mode: 'wqa', fp, connectedIntegrations: ['gsc'], capabilities: [] });
    expect(cols.find((c) => c.key === 'p.commerce.feed.errors')).toBeUndefined();
  });

  it('includes restaurant menu schema only on restaurant industry', () => {
    const fp = makeFp({ industry: 'restaurant' });
    const cols = MetricRegistry.columnsFor({ mode: 'local', fp, connectedIntegrations: [], capabilities: [] });
    expect(cols.find((c) => c.key === 's.local.hasMenuSchema')).toBeDefined();
  });
});

function makeFp(input: { industry: Industry }): ProjectFingerprint {
  const source = { tier: 'T8' as const, tags: ['default'] as const, provider: 'test', observedAt: new Date(0).toISOString() };
  return {
    industry: { value: input.industry, confidence: 1, source },
    cms: { value: 'custom', confidence: 1, source },
    languagePrimary: { value: 'en', confidence: 1, source },
    stack: {},
    size: { urls: { value: 10, confidence: 1, source } },
  };
}
