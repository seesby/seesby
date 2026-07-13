import React, { useMemo } from 'react';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';
import type { ColumnDef } from '@tanstack/react-table';
import { fmtPct, fmtCompact } from '../../_shared/formatters';
import { STATUS_HEX } from '../../_shared/shared-columns';

function qsColor(qs: number) {
  if (qs >= 7) return STATUS_HEX.good;
  if (qs >= 5) return STATUS_HEX.warn;
  return STATUS_HEX.bad;
}

function qsLabel(v: number) {
  if (v >= 8) return 'abv';
  if (v >= 6) return 'avg';
  return 'bel';
}

function qsLabelColor(v: number) {
  if (v >= 8) return STATUS_HEX.good;
  if (v >= 6) return STATUS_HEX.warn;
  return STATUS_HEX.bad;
}

function posBadge(pos: number) {
  if (pos <= 3) return <span className="text-[9px] px-1 py-0.5 rounded bg-emerald-500/15 text-emerald-400">top3</span>;
  if (pos <= 10) return <span className="text-[9px] px-1 py-0.5 rounded bg-amber-500/15 text-amber-400">pg1</span>;
  return <span className="text-[9px] px-1 py-0.5 rounded bg-red-500/15 text-red-400">pg2+</span>;
}

export function usePaidKeywords() {
  const { paid = {} } = useSeoCrawler() as any;

  const rows = useMemo(() => (paid.keywords ?? []).map((k: any, i: number) => ({
    id: k.id ?? `${k.text}|${i}`, ...k,
  })), [paid.keywords]);

  const columns: ColumnDef<any>[] = [
    { accessorKey: 'text', header: 'Keyword', size: 200 },
    { accessorKey: 'matchType', header: 'Match', size: 70 },
    { accessorKey: 'campaign', header: 'Camp', size: 130, cell: c => {
      const v = c.getValue() as string;
      return <span className="truncate block max-w-[130px]">{v?.length > 14 ? v.slice(0, 14) + '…' : v}</span>;
    }},
    {
      accessorKey: 'cost', header: 'Cost', size: 80,
      cell: c => {
        const row = c.row.original;
        const cost = row.cost ?? (row.clicks ?? 0) * (row.cpc ?? 0);
        return <span className="font-mono">${fmtCompact(cost)}</span>;
      },
    },
    {
      accessorKey: 'cpc', header: 'CPC', size: 60,
      cell: c => <span className="font-mono">${fmtCompact(c.getValue() as number)}</span>,
    },
    {
      accessorKey: 'qualityScore', header: 'Quality Score', size: 90,
      cell: c => {
        const v = c.getValue() as number;
        if (v <= 0) return '—';
        const warn = v < 7;
        return (
          <span className="font-mono" style={{ color: qsColor(v) }}>
            {v}{warn && '⚠'}
          </span>
        );
      },
    },
    {
      accessorKey: 'expectedCtr', header: 'ExpCTR', size: 55,
      cell: c => {
        const v = c.getValue() as number;
        if (v <= 0) return '—';
        const label = qsLabel(v);
        const color = qsLabelColor(v);
        const warn = v < 6;
        return <span style={{ color }}>{label}{warn && '⚠'}</span>;
      },
    },
    {
      accessorKey: 'adRelevance', header: 'AdRel', size: 55,
      cell: c => {
        const v = c.getValue() as number;
        if (v <= 0) return '—';
        const label = qsLabel(v);
        const color = qsLabelColor(v);
        const warn = v < 6;
        return <span style={{ color }}>{label}{warn && '⚠'}</span>;
      },
    },
    {
      accessorKey: 'lpExperience', header: 'LPExp', size: 55,
      cell: c => {
        const v = c.getValue() as number;
        if (v <= 0) return '—';
        const label = qsLabel(v);
        const color = qsLabelColor(v);
        const warn = v < 6;
        return <span style={{ color }}>{label}{warn && '⚠'}</span>;
      },
    },
    {
      accessorKey: 'ctr', header: 'CTR', size: 55,
      cell: c => <span className="font-mono">{fmtPct(c.getValue() as number)}</span>,
    },
    {
      accessorKey: 'impressions', header: 'Impressions', size: 80,
      cell: c => <span className="font-mono">{fmtCompact(c.getValue() as number)}</span>,
    },
    {
      accessorKey: 'avgPosition', header: 'Position', size: 65,
      cell: c => {
        const v = c.getValue() as number;
        return v > 0 ? posBadge(v) : '—';
      },
    },
    { accessorKey: 'conv', header: 'Conv', size: 55, cell: c => <span className="font-mono">{c.getValue() as number}</span> },
    {
      accessorKey: 'cpa', header: 'CPA', size: 65,
      cell: c => {
        const v = c.getValue() as number;
        if (v <= 0) return '—';
        const high = v >= 100;
        return (
          <span className="font-mono" style={{ color: high ? STATUS_HEX.bad : v >= 50 ? STATUS_HEX.warn : STATUS_HEX.good }}>
            ${fmtCompact(v)}{high && '⚠'}
          </span>
        );
      },
    },
    {
      accessorKey: 'searchTerms', header: 'Terms', size: 80,
      cell: c => {
        const v = c.getValue() as number;
        const irrel = c.row.original.irrelevantTerms ?? 0;
        if (v <= 0) return '—';
        return (
          <span className="text-[11px]">
            <span className="text-[var(--brand-text-mid)]">{v}→</span>
            {irrel > 0 && <span className="text-amber-400 ml-1">{irrel} irrel</span>}
          </span>
        );
      },
    },
    {
      accessorKey: 'wasted', header: 'Neg?', size: 50,
      cell: c => {
        const v = c.getValue() as boolean;
        const irrel = c.row.original.irrelevantTerms ?? 0;
        if (!v && irrel <= 0) return <span className="text-[var(--brand-text-faint)]">─</span>;
        if (irrel > 5) return <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-medium cursor-pointer">add!</span>;
        return <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 cursor-pointer">add?</span>;
      },
    },
    {
      accessorKey: 'delta7d', header: 'Δ7d', size: 55,
      cell: c => {
        const v = c.getValue() as number;
        if (v === undefined || v === null) return <span className="text-[var(--brand-text-faint)]">flat</span>;
        if (v === 0) return <span className="text-[var(--brand-text-faint)]">flat</span>;
        return (
          <span style={{ color: v > 0 ? STATUS_HEX.good : STATUS_HEX.bad }}>
            {v > 0 ? '▲' : '▼'}{Math.abs(v)}%
          </span>
        );
      },
    },
  ];
  return { rows, columns };
}
