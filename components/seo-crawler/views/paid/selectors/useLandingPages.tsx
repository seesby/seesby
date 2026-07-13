import React, { useMemo } from 'react';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';
import type { ColumnDef } from '@tanstack/react-table';
import { fmtPct, fmtUrl, fmtCompact } from '../../_shared/formatters';
import { STATUS, STATUS_HEX, scoreHex, cwvHex } from '../../_shared/shared-columns';
import { filterByVisibleColumns } from '../../_shared/filterByVisibleColumns';

function bounceColor(bounce: number) {
  if (bounce < 0.4) return STATUS_HEX.good;
  if (bounce < 0.6) return STATUS_HEX.warn;
  return STATUS_HEX.bad;
}

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

function intentColor(v: number) {
  if (v >= 0.8) return STATUS_HEX.good;
  if (v >= 0.6) return STATUS_HEX.warn;
  return STATUS_HEX.bad;
}

export function useLandingPages() {
  const { paid = {}, visibleColumns = [], foundationActionsMap } = useSeoCrawler() as any;

  const rows = useMemo(() => (paid.landingPages ?? []).map((p: any, i: number) => {
    const sessions = p.sessions ?? 0;
    const conv = p.conv ?? 0;
    return {
      ...p,
      id: p.url ?? `lp-${i}`,
      convRate: sessions > 0 ? conv / sessions : 0,
      revenuePerSession: sessions > 0 ? (p.revenue ?? 0) / sessions : 0,
      actions: foundationActionsMap?.get?.(p.url) ?? p.actions ?? [],
    };
  }), [paid.landingPages, foundationActionsMap]);

  const columns = useMemo<ColumnDef<any>[]>(() => [
    { id: 'p.identity.url', header: 'LP URL', size: 230, accessorFn: (row: any) => row.url, cell: c => <span className="text-[#bdb6ff]">{fmtUrl(c.getValue() as string)}</span> },
    {
      accessorKey: 'campaignCount', header: 'Camp count', size: 85,
      cell: c => {
        const v = c.getValue() as number;
        return <span className="text-[var(--brand-text-strong)] tabular-nums">{v ?? '—'}</span>;
      },
    },
    {
      id: 'p.paid.paidSessions', header: 'Paid sess', size: 85,
      accessorFn: (row: any) => row.sessions,
      cell: c => fmtCompact(c.getValue() as number),
    },
    {
      id: 'p.ga.bounce', header: 'Bounce', size: 70,
      accessorFn: (row: any) => row.bounce,
      cell: c => {
        const v = c.getValue() as number;
        return <span style={{ color: bounceColor(v) }}>{fmtPct(v)}</span>;
      },
    },
    {
      id: 'p.ga.conversionRate', header: 'Conv. Rate', size: 75,
      accessorFn: (row: any) => row.convRate,
      cell: c => {
        const v = c.getValue() as number;
        return <span style={{ color: scoreHex(v >= 0.03 ? 80 : v >= 0.01 ? 50 : 20) }}>{fmtPct(v)}</span>;
      },
    },
    {
      id: 'p.paid.qsLpComponent', header: 'Quality Score', size: 90,
      accessorFn: (row: any) => row.qualityScore,
      cell: c => {
        const v = c.getValue() as number;
        return v > 0 ? <span style={{ color: qsColor(v) }}>{qsLabel(v)}</span> : '—';
      },
    },
    {
      accessorKey: 'intentMatch', header: 'Intent', size: 70,
      cell: c => {
        const v = c.getValue() as number;
        if (v == null) return '—';
        return (
          <span style={{ color: intentColor(v) }}>
            {v.toFixed(2)} {v >= 0.7 ? '✓' : ''}
          </span>
        );
      },
    },
    {
      id: 'p.tech.cwv.lcp', header: 'CWV', size: 90,
      accessorFn: (row: any) => row.cwvLcp,
      cell: c => {
        const lcp = c.getValue() as number;
        const inp = c.row.original.cwvInp ?? 0;
        if (!lcp) return '—';
        return (
          <span className="text-[11px]">
            <span style={{ color: cwvHex(lcp) }}>LCP {(lcp / 1000).toFixed(1)}s</span>
            {' '}
            <span style={{ color: cwvHex(inp) }}>INP {inp}</span>
          </span>
        );
      },
    },
    {
      accessorKey: 'issues', header: 'Issues', size: 70,
      cell: c => {
        const v = c.getValue() as number;
        if (!v) return <span className="text-[var(--brand-text-faint)]">—</span>;
        return <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-400">{v} issues</span>;
      },
    },
    {
      id: 'paidRecommendation', header: 'Recommendation', size: 110,
      cell: c => {
        const row = c.row.original;
        const bounce = row.bounce ?? 0;
        const convRate = row.convRate ?? 0;
        const issues = row.issues ?? 0;
        const intent = row.intentMatch ?? 0;

        // stop sending: very high bounce + low conv + issues
        if (bounce > 0.65 && convRate < 0.01 && issues >= 3) {
          return <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-medium">⚠ stop sending</span>;
        }
        // rewrite / pause: high bounce + issues
        if (bounce > 0.55 && issues >= 2) {
          return <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">Rewrite / pause</span>;
        }
        // improve: has issues or low intent
        if (issues > 0 || intent < 0.6) {
          return <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400">Improve</span>;
        }
        return <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400">Keep</span>;
      },
    },
  ], []);

  const filtered = useMemo(
    () => filterByVisibleColumns(columns, visibleColumns),
    [columns, visibleColumns],
  );

  return { rows, columns: filtered };
}
