import { useMemo } from 'react';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';
import { STATUS_HEX } from '../../_shared/shared-columns';

export type FeedStatusItem = {
  label: string;
  count: number;
  pct: number;
  color: string;
};

export type FeedSegment = {
  label: string;
  count: number;
  color: string;
};

export type ErrorBreakdownItem = {
  type: string;
  count: number;
  fix: string;
};

export type ParityRow = {
  sku: string;
  feedPrice: number;
  sitePrice: number;
  feedAvailable: boolean;
  siteAvailable: boolean;
};

export function useFeed() {
  const { feedDiagnostics = [], products = [] } = useSeoCrawler() as any;

  const statusSummary: FeedStatusItem[] = useMemo(() => {
    const total = feedDiagnostics.length || 1;
    const approved = feedDiagnostics.filter((d: any) => d.severity === 'info').length;
    const warnings = feedDiagnostics.filter((d: any) => d.severity === 'warn').length;
    const errors = feedDiagnostics.filter((d: any) => d.severity === 'critical').length;
    const missing = Math.max(0, products.length - feedDiagnostics.length);
    return [
      { label: 'Approved', count: approved, pct: (approved / total) * 100, color: STATUS_HEX.good },
      { label: 'Warnings', count: warnings, pct: (warnings / total) * 100, color: STATUS_HEX.warn },
      { label: 'Errors', count: errors, pct: (errors / total) * 100, color: STATUS_HEX.bad },
      { label: 'Missing', count: missing, pct: (missing / (products.length || 1)) * 100, color: '#71717a' },
    ];
  }, [feedDiagnostics, products]);

  const statusSegments: FeedSegment[] = useMemo(() => {
    const segs: FeedSegment[] = [];
    for (const s of statusSummary) {
      if (s.count > 0) segs.push({ label: s.label, count: s.count, color: s.color });
    }
    return segs;
  }, [statusSummary]);

  const errorBreakdown: ErrorBreakdownItem[] = useMemo(() => {
    const groups = new Map<string, { count: number; fix: string }>();
    for (const d of feedDiagnostics) {
      if (d.severity !== 'critical' && d.severity !== 'warn') continue;
      const key = d.field || d.message;
      const cur = groups.get(key) ?? { count: 0, fix: getFix(d.field) };
      cur.count += 1;
      groups.set(key, cur);
    }
    return Array.from(groups.entries())
      .map(([type, v]) => ({ type, count: v.count, fix: v.fix }))
      .sort((a, b) => b.count - a.count);
  }, [feedDiagnostics]);

  const parityRows: ParityRow[] = useMemo(() => {
    return products
      .filter((p: any) => p.parity)
      .map((p: any) => ({
        sku: p.sku ?? '',
        feedPrice: p.parity?.feedPrice ?? 0,
        sitePrice: p.parity?.sitePrice ?? 0,
        feedAvailable: p.parity?.feedAvailable ?? true,
        siteAvailable: p.parity?.siteAvailable ?? true,
      }));
  }, [products]);

  return { statusSummary, statusSegments, errorBreakdown, parityRows };
}

function getFix(field: string): string {
  const fixes: Record<string, string> = {
    title: 'add to product',
    description: 'add to product',
    price: 'reconcile feed vs site',
    availability: 'reconcile feed vs site',
    image: 'upload \u2265800px',
    gtin: 'add to product',
    brand: 'add to product',
  };
  return fixes[field] ?? 'add to product';
}
