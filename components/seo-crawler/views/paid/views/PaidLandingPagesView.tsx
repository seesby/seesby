import React, { useMemo, useCallback } from 'react';
import { DataTable } from '../../_shared/DataTable';
import { useDensity } from '../../_hooks/useDensity';
import { useLandingPages } from '../selectors/useLandingPages.tsx';
import { useExportRegistration } from '../../_hooks/useExportRegistration';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';
import { fmtCompact } from '../../_shared/formatters';
import type { RowSelectionState } from '@tanstack/react-table';

export default function PaidLandingPagesView() {
  const { rows, columns } = useLandingPages();
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
    const withIssues = rows.filter((r: any) => (r.issues ?? 0) > 0).length;
    const wastedSessions = rows.filter((r: any) => (r.bounce ?? 0) > 0.6).reduce((s: number, r: any) => s + (r.sessions ?? 0), 0);
    return { count: rows.length, withIssues, wastedSessions };
  }, [rows]);

  useExportRegistration(
    () => rows,
    () => columns.map(c => ({ key: (c as any).accessorKey as string, label: String((c as any).header) }))
  );

  return (
    <div className="flex-1 flex flex-col min-h-0">
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
          setRsTab?.('paid', 'landingPages');
          setInspectorOpen?.(true);
        }}
        emptyText="No landing pages synced."
      />

      {/* LP-to-ad match preview */}
      <LpAdMatchPreview />
    </div>
  );
}

/* ── LP-to-ad match preview (shown when a row is selected) ────── */
function LpAdMatchPreview() {
  const ctx = useSeoCrawler() as any;
  const { selectedRows } = ctx;
  const { paid = {} } = ctx;

  const selectedId = useMemo(() => {
    if (!selectedRows || selectedRows.size === 0) return null;
    return [...selectedRows][0];
  }, [selectedRows]);

  const preview = useMemo(() => {
    if (!selectedId) return null;
    const lp = (paid.landingPages ?? []).find((p: any) => (p.url ?? '') === selectedId);
    if (!lp) return null;

    // find best matching ad by campaign overlap
    const ads = paid.ads ?? [];
    const matchingAd = ads.find((a: any) => a.campaign && lp.campaigns?.includes(a.campaign)) ?? ads[0];
    if (!matchingAd) return null;

    return {
      lpUrl: lp.url,
      lpH1: lp.h1 ?? lp.title ?? '',
      lpHero: lp.heroCopy ?? lp.description ?? '',
      adH1: (matchingAd.headlines ?? [])[0] ?? '',
      adDesc: (matchingAd.descriptions ?? [])[0] ?? '',
      matchScore: lp.intentMatch ?? 0,
    };
  }, [selectedId, paid]);

  if (!preview) return null;

  return (
    <div className="mx-3 mb-2 rounded border border-[#1a1a1a] bg-[#0c0c0c] p-3 text-[11px] shrink-0">
      <div className="text-[10px] uppercase tracking-wider text-[#666] mb-2">LP-to-ad match preview</div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-[#888] mb-0.5">Ad H1</div>
          <div className="text-white truncate">{preview.adH1}</div>
          <div className="text-[#888] mt-1 mb-0.5">Ad desc</div>
          <div className="text-[#aaa] truncate">{preview.adDesc}</div>
        </div>
        <div>
          <div className="text-[#888] mb-0.5">LP <span className="text-[#bdb6ff]">{preview.lpUrl}</span> H1</div>
          <div className="text-white truncate">{preview.lpH1}</div>
          <div className="text-[#888] mt-1 mb-0.5">LP hero copy</div>
          <div className="text-[#aaa] truncate">{preview.lpHero}</div>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-1.5">
        <span className="text-[#888]">Match score</span>
        <span className={preview.matchScore >= 0.7 ? 'text-[#22c55e]' : preview.matchScore >= 0.5 ? 'text-[#f59e0b]' : 'text-[#ef4444]'}>
          {preview.matchScore.toFixed(2)}
        </span>
        <span className={preview.matchScore >= 0.7 ? 'text-[#22c55e]' : 'text-[#f59e0b]'}>
          {preview.matchScore >= 0.7 ? '✓ strong message match' : '△ weak message match'}
        </span>
      </div>
    </div>
  );
}
