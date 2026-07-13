import React, { useMemo, useCallback } from 'react';
import { DataTable } from '../../_shared/DataTable';
import { useDensity } from '../../_hooks/useDensity';
import { usePaidKeywords } from '../selectors/usePaidKeywords.tsx';
import { useExportRegistration } from '../../_hooks/useExportRegistration';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';
import { fmtCompact, fmtPct } from '../../_shared/formatters';
import type { RowSelectionState } from '@tanstack/react-table';
import clsx from 'clsx';

/* ── tiny pill badge ──────────────────────────────────────────── */
function Pill({ label, value, tone }: { label: string; value: React.ReactNode; tone?: 'good' | 'warn' | 'bad' | 'neutral' }) {
  const bg = tone === 'good' ? 'bg-[#22c55e]/10 border-[#22c55e]/20' :
             tone === 'warn' ? 'bg-[#f59e0b]/10 border-[#f59e0b]/20' :
             tone === 'bad'  ? 'bg-[#ef4444]/10 border-[#ef4444]/20' :
                               'bg-[#111] border-[#1a1a1a]';
  const fg = tone === 'good' ? 'text-[#22c55e]' :
             tone === 'warn' ? 'text-[#f59e0b]' :
             tone === 'bad'  ? 'text-[#ef4444]' :
                               'text-white';
  return (
    <span className={clsx('inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] tabular-nums', bg)}>
      <span className="text-[#666] text-[10px]">{label}</span>
      <span className={clsx('font-medium', fg)}>{value}</span>
    </span>
  );
}

export default function PaidKeywordsView() {
  const { rows, columns } = usePaidKeywords();
  const [density] = useDensity();
  const ctx = useSeoCrawler() as any;
  const { setSelectedPageUrl, setInspectorOpen, setRsTab, selectedRows, setSelectedRows } = ctx;

  const selected: RowSelectionState = useMemo(() => {
    const s: RowSelectionState = {};
    if (selectedRows) for (const id of selectedRows) s[id] = true;
    return s;
  }, [selectedRows]);

  const handleSelectedChange = useCallback((next: RowSelectionState) => {
    const ids = new Set(Object.keys(next).filter(k => next[k]));
    setSelectedRows(ids);
  }, [setSelectedRows]);

  const summary = useMemo(() => {
    if (rows.length === 0) return null;
    const totalCost = rows.reduce((s: number, r: any) => {
      const cost = r.cost ?? (r.clicks ?? 0) * (r.cpc ?? 0);
      return s + cost;
    }, 0);
    const totalConv = rows.reduce((s: number, r: any) => s + (r.conv ?? 0), 0);
    const avgQs = rows.reduce((s: number, r: any) => s + (r.qualityScore ?? 0), 0) / rows.length;
    const wasted = rows.filter((r: any) => r.wasted).length;
    const avgCpc = rows.reduce((s: number, r: any) => s + (r.cpc ?? 0), 0) / rows.length;
    const avgCtr = rows.reduce((s: number, r: any) => s + (r.ctr ?? 0), 0) / rows.length;
    const irrelTotal = rows.reduce((s: number, r: any) => s + (r.irrelevantTerms ?? 0), 0);
    const wastedTotal = rows.filter((r: any) => r.wasted).reduce((s: number, r: any) => {
      return s + (r.cost ?? (r.clicks ?? 0) * (r.cpc ?? 0));
    }, 0);

    return { totalCost, totalConv, avgQs, wasted, count: rows.length, avgCpc, avgCtr, irrelTotal, wastedTotal };
  }, [rows]);

  const selectedIds = useMemo(() => {
    if (!selectedRows || selectedRows.size === 0) return [];
    return [...selectedRows];
  }, [selectedRows]);

  useExportRegistration(
    () => rows,
    () => columns.map(c => ({ key: (c as any).accessorKey as string, label: String((c as any).header) }))
  );

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Summary strip — pill badges */}
      {summary && (
        <div className="px-3 py-2 border-b border-[#1a1a1a] bg-[#0a0a0a] shrink-0 flex items-center gap-1.5 flex-wrap">
          <Pill label="kw" value={summary.count.toLocaleString()} />
          <Pill label="spend" value={`$${fmtCompact(summary.totalCost)}`} />
          <Pill label="CPC" value={`$${summary.avgCpc.toFixed(2)}`} />
          <Pill label="CTR" value={fmtPct(summary.avgCtr)} />
          <Pill
            label="QS"
            value={summary.avgQs.toFixed(1)}
            tone={summary.avgQs >= 7 ? 'good' : summary.avgQs >= 5 ? 'warn' : 'bad'}
          />
          {summary.totalConv > 0 && <Pill label="conv" value={summary.totalConv} />}
        </div>
      )}

      <DataTable
        key={density}
        rows={rows}
        columns={columns}
        getRowId={r => r.id}
        density={density}
        selected={selected}
        onSelectedChange={handleSelectedChange}
        onOpenInspector={(id) => {
          setSelectedPageUrl?.(id);
          setRsTab?.('paid', 'keywords');
          setInspectorOpen?.(true);
        }}
        emptyText="No keywords synced."
      />

      {/* Action bar — visible when rows selected */}
      {selectedIds.length > 0 && (
        <div className="px-3 py-1.5 border-t border-[#1a1a1a] bg-[#0c0c0c] shrink-0 flex items-center gap-2 text-[11px]">
          <span className="text-[#888] tabular-nums">{selectedIds.length} selected</span>
          <div className="w-[1px] h-3 bg-[#222]" />
          {['Pause', 'Adjust bid', 'Add as negative', 'Move campaign'].map(label => (
            <button key={label} className="h-6 px-2 rounded bg-[#1a1a1a] text-[#ccc] hover:bg-[#222] hover:text-white transition-colors">
              {label}
            </button>
          ))}
          <button className="h-6 px-2 rounded bg-[#1a1a1a] text-[#06b6d4] hover:bg-[#0c2a2e] transition-colors">
            ◐ Compare
          </button>
        </div>
      )}

    </div>
  );
}
