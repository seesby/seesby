import React, { useMemo, useState } from 'react';
import { DataTable } from '../../_shared/DataTable';
import { useDensity } from '../../_hooks/useDensity';
import { useLocations, type LocationRow } from '../selectors/useLocations';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';
import { useExportRegistration } from '../../_hooks/useExportRegistration';
import { SURFACE, TEXT, STATUS, R, S } from '../../_shared/tokens';

type FilterId = 'verified' | 'napIssues' | 'lowRating' | 'packMissing';

const FILTERS: { id: FilterId; label: string }[] = [
  { id: 'verified',    label: 'Verified' },
  { id: 'napIssues',   label: 'NAP Issues' },
  { id: 'lowRating',   label: 'Rating <4' },
  { id: 'packMissing', label: 'Pack Missing' },
];

export default function LocalLocationsView() {
  const { rows, columns } = useLocations();
  const [density] = useDensity();
  const { setSelectedPageUrl, setInspectorOpen, setRsTab } = useSeoCrawler() as any;
  const [activeFilters, setActiveFilters] = useState<Set<FilterId>>(new Set());

  const toggleFilter = (id: FilterId) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredRows = useMemo(() => {
    if (activeFilters.size === 0) return rows;
    return rows.filter((r: LocationRow) => {
      if (activeFilters.has('verified') && !r.gbpVerified) return false;
      if (activeFilters.has('napIssues') && r.napConsistency >= 0.9) return false;
      if (activeFilters.has('lowRating') && r.rating >= 4) return false;
      if (activeFilters.has('packMissing') && r.rankAvg !== null) return false;
      return true;
    });
  }, [rows, activeFilters]);

  useExportRegistration(
    () => filteredRows,
    () => columns.map(c => ({ key: (c as any).accessorKey ?? c.id, label: (c as any).header ?? c.id }))
  );

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <DataTable
        key={density}
        rows={filteredRows}
        columns={columns}
        getRowId={r => r.id}
        density={density}
        onOpenInspector={(id) => {
          setSelectedPageUrl?.(id);
          setRsTab?.('local', 'local_overview');
          setInspectorOpen?.(true);
        }}
        emptyText="Connect Google Business Profile to import locations."
      />

      <div className="shrink-0 flex items-center" style={{ borderTop: `1px solid ${SURFACE.br0}`, background: SURFACE.bg0, padding: `${S[1]}px ${S[3]}px`, gap: S[2], fontSize: 10 }}>
        {FILTERS.map(f => {
          const active = activeFilters.has(f.id);
          return (
            <button
              key={f.id}
              onClick={() => toggleFilter(f.id)}
              style={{
                height: 22,
                padding: '0 8px',
                borderRadius: R.sm,
                border: `1px solid ${active ? 'rgba(249,115,22,0.3)' : SURFACE.br1}`,
                background: active ? 'rgba(249,115,22,0.15)' : SURFACE.bg1,
                color: active ? STATUS.info : TEXT.secondary,
                transition: 'all 0.1s',
              }}
            >
              {f.label}
            </button>
          );
        })}
        {activeFilters.size > 0 && (
          <button
            onClick={() => setActiveFilters(new Set())}
            style={{ height: 22, padding: '0 8px', fontSize: 10, color: TEXT.tertiary }}
          >
            Clear
          </button>
        )}
        <span className="ml-auto" style={{ color: TEXT.muted }}>
          {filteredRows.length === rows.length ? rows.length : `${filteredRows.length} of ${rows.length}`}
        </span>
      </div>
    </div>
  );
}
