import React, { useCallback } from 'react';
import { DataTable } from '../../_shared/DataTable';
import { useDensity } from '../../_hooks/useDensity';
import { useExportRegistration } from '../../_hooks/useExportRegistration';
import { useUxPages } from '../selectors/useUxPages.tsx';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';
import type { RowSelectionState } from '@tanstack/react-table';

export default function UxPagesView() {
  const ctx = useSeoCrawler() as any;
  const { setSelectedPageUrl, setInspectorOpen, selectedRows, setSelectedRows } = ctx;
  const { rows, columns } = useUxPages();
  const [density] = useDensity();

  useExportRegistration(
    () => rows,
    () => (columns as any[]).map(c => ({ key: c.accessorKey as string, label: c.header as string }))
  );

  const selected: RowSelectionState = {};
  if (selectedRows) {
    for (const id of selectedRows) selected[id] = true;
  }

  const handleSelectedChange = useCallback((next: RowSelectionState) => {
    const ids = new Set(Object.keys(next).filter(k => next[k]));
    setSelectedRows(ids);
  }, [setSelectedRows]);

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
        onOpenInspector={(id) => { setSelectedPageUrl?.(id); setInspectorOpen?.(true); }}
        emptyText="No UX data yet."
      />
    </div>
  );
}
