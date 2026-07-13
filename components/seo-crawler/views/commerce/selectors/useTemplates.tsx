import { useMemo } from 'react';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';
import type { ColumnDef } from '@tanstack/react-table';
import { fmtCompact, fmtPct, fmtMs } from '../../_shared/formatters';

export type TemplateRow = {
  id: string;
  name: string;
  pageType: string;
  count: number;
  qualityAvg: number;
  schemaValid: boolean;
  lcpP50: number;
  convRate: number;
  primaryIssue: string;
};

export type TemplateDiff = {
  a: string;
  b: string;
  aOnly: string[];
  bOnly: string[];
};

export function useTemplates() {
  const { products = [], collections = [] } = useSeoCrawler() as any;

  const rows: TemplateRow[] = useMemo(() => {
    const groups = new Map<string, {
      pageType: string;
      count: number;
      qualitySum: number;
      schemaHits: number;
      lcpSum: number;
      convSum: number;
      convCount: number;
    }>();

    const all = [
      ...products.map((p: any) => ({ ...p, pageType: 'product' })),
      ...collections.map((c: any) => ({ ...c, pageType: 'collection' })),
    ];

    for (const p of all) {
      const key = p.template ?? 'default';
      const cur = groups.get(key) ?? {
        pageType: p.pageType, count: 0, qualitySum: 0, schemaHits: 0,
        lcpSum: 0, convSum: 0, convCount: 0,
      };
      cur.count += 1;
      cur.qualitySum += p.content?.qualityScore ?? 70;
      if (hasRequiredSchema(p)) cur.schemaHits += 1;
      cur.lcpSum += p.cwv?.lcp ?? p.lcp ?? 0;
      if (p.analytics?.cr30d) { cur.convSum += p.analytics.cr30d; cur.convCount += 1; }
      groups.set(key, cur);
    }

    return Array.from(groups.entries()).map(([key, g]) => {
      const n = g.count || 1;
      const qualityAvg = g.qualitySum / n;
      const schemaValid = g.schemaHits / n >= 0.9;
      const lcpP50 = g.lcpSum / n;
      const convRate = g.convCount > 0 ? g.convSum / g.convCount : 0;

      let primaryIssue = '\u2014';
      if (!schemaValid) primaryIssue = g.pageType === 'product' ? 'schema bug' : 'add schema';
      else if (lcpP50 > 4000) primaryIssue = 'render blocker';
      else if (qualityAvg < 50) primaryIssue = 'content thin';

      return {
        id: key,
        name: key,
        pageType: g.pageType,
        count: g.count,
        qualityAvg,
        schemaValid,
        lcpP50,
        convRate,
        primaryIssue,
      };
    }).sort((a, b) => b.count - a.count);
  }, [products, collections]);

  const perfData = useMemo(() =>
    rows.map(r => ({
      name: r.name,
      pages: r.count,
    })),
  [rows]);

  const diff: TemplateDiff | null = useMemo(() => {
    if (rows.length < 2) return null;
    const a = rows[0];
    const b = rows[1];
    const aFeatures: string[] = [];
    const bFeatures: string[] = [];
    if (a.schemaValid && !b.schemaValid) { aFeatures.push('Review schema'); }
    if (b.schemaValid && !a.schemaValid) { bFeatures.push('Review schema'); }
    if (a.convRate > b.convRate * 1.5) { aFeatures.push('Higher conversion'); }
    if (b.convRate > a.convRate * 1.5) { bFeatures.push('Higher conversion'); }
    if (a.lcpP50 < b.lcpP50 * 0.8) { aFeatures.push(`LCP ${fmtMs(a.lcpP50)}`); }
    if (b.lcpP50 < a.lcpP50 * 0.8) { bFeatures.push(`LCP ${fmtMs(b.lcpP50)}`); }
    if (aFeatures.length === 0 && bFeatures.length === 0) return null;
    return { a: a.name, b: b.name, aOnly: aFeatures, bOnly: bFeatures };
  }, [rows]);

  const columns: ColumnDef<TemplateRow>[] = [
    { accessorKey: 'name', header: 'Template', size: 140 },
    { accessorKey: 'pageType', header: 'Type', size: 100 },
    { accessorKey: 'count', header: 'Pages', size: 80 },
    { accessorKey: 'qualityAvg', header: 'Q-avg', size: 80, cell: c => (c.getValue() as number).toFixed(0) },
    { accessorKey: 'schemaValid', header: 'Schema valid', size: 110, cell: c => c.getValue() ? <span className="text-[#22c55e]">valid</span> : <span className="text-[#f59e0b]">invalid \u26a0</span> },
    { accessorKey: 'lcpP50', header: 'LCP (p50)', size: 100, cell: c => {
      const v = c.getValue() as number;
      return <span className={v <= 2500 ? 'text-[#22c55e]' : v <= 4000 ? 'text-[#f59e0b]' : 'text-[#ef4444]'}>{fmtMs(v)}</span>;
    }},
    { accessorKey: 'convRate', header: 'Conv. rate', size: 100, cell: c => {
      const v = c.getValue() as number;
      return v > 0 ? <span className={v >= 0.03 ? 'text-[#22c55e]' : v >= 0.01 ? 'text-[#f59e0b]' : 'text-[#ef4444]'}>{fmtPct(v)}</span> : 'n/a';
    }},
    { accessorKey: 'primaryIssue', header: 'Primary issue', size: 140, cell: c => {
      const v = c.getValue() as string;
      return v === '\u2014' ? <span className="text-[var(--brand-text-faint)]]">{v}</span> : <span className="text-[#f59e0b]">{v}</span>;
    }},
  ];

  return { rows, columns, perfData, diff };
}

function hasRequiredSchema(p: any) {
  const types: string[] = p.schema?.types ?? [];
  if (p.pageType === 'product') return types.includes('Product');
  return types.includes('CollectionPage') || types.includes('ItemList');
}
