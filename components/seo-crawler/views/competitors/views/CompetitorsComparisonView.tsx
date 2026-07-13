import React from 'react';
import { DataTable } from '../../_shared/DataTable';
import { useDensity } from '../../_hooks/useDensity';
import { useExportRegistration } from '../../_hooks/useExportRegistration';
import { useCompetitorComparison } from '../selectors/useCompetitorComparison';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';
import { SURFACE, TEXT, STATUS, S } from '../../_shared/tokens';

export default function CompetitorsComparisonView() {
  const ctx = useSeoCrawler() as any;
  const { setSelectedPageUrl, setInspectorOpen, setRsTab, selectedRows, setSelectedRows, pages = [] } = ctx;
  const { rows, columns, stats, hostList } = useCompetitorComparison();
  const [density] = useDensity();

  useExportRegistration(
    () => rows,
    () => columns.map(c => ({ key: (c as any).accessorKey ?? (c as any).id, label: String((c as any).header) })),
  );

  const selected: Record<string, boolean> = {};
  if (selectedRows) for (const id of selectedRows) selected[id] = true;

  const handleSelectedChange = (next: Record<string, boolean>) => {
    const ids = new Set(Object.keys(next).filter(k => next[k]));
    setSelectedRows(ids);
  };

  const handleOpenInspector = (id: string) => {
    const pageUrl = pages[0]?.url ?? '';
    if (pageUrl) {
      setSelectedPageUrl?.(pageUrl);
      setRsTab?.('competitors', 'comp_overview');
      setInspectorOpen?.(true);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      <div className="flex-1 min-h-0 overflow-hidden">
        <DataTable
          key={density}
          rows={rows}
          columns={columns}
          getRowId={r => r.id}
          density={density}
          selected={selected}
          onSelectedChange={handleSelectedChange}
          onOpenInspector={handleOpenInspector}
          emptyText="Add competitors from the left sidebar to compare keyword rankings."
        />
      </div>

      {hostList.length > 1 && (
        <SerpOverlapBar hostList={hostList} stats={stats} />
      )}
    </div>
  );
}

function SerpOverlapBar({ hostList, stats }: { hostList: string[]; stats: { total: number; wins: number; losses: number; gaps: number; highOpp: number } }) {
  const sharedPct = stats.total > 0 ? Math.round(((stats.total - stats.gaps) / stats.total) * 100) : 0;
  const ourOnly = Math.max(0, Math.round((100 - sharedPct) / 2));
  const theirOnly = Math.max(0, 100 - sharedPct - ourOnly);

  return (
    <div className="shrink-0" style={{ padding: `${S[2]}px ${S[3]}px`, borderTop: `1px solid ${SURFACE.br0}`, background: SURFACE.bg0 }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
        <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', color: TEXT.tertiary }}>SERP overlap</span>
        <span style={{ fontSize: 10, color: TEXT.tertiary, fontVariantNumeric: 'tabular-nums' }}>{sharedPct}% shared</span>
      </div>
      <div style={{ display: 'flex', height: 6, borderRadius: 999, overflow: 'hidden', background: SURFACE.br0 }}>
        <div style={{ transition: 'all', background: STATUS.info, width: `${ourOnly}%` }} />
        <div style={{ transition: 'all', background: '#a78bfa', width: `${sharedPct}%` }} />
        <div style={{ transition: 'all', background: STATUS.bad, width: `${theirOnly}%` }} />
      </div>
      <div className="flex justify-between" style={{ marginTop: 4, fontSize: 9, color: TEXT.muted }}>
        <span>Our only</span>
        <span>Shared</span>
        <span>Their only</span>
      </div>
    </div>
  );
}
