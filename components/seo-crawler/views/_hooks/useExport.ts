// useExport.ts — currently a stub; reads visible rows / columns when wired.
import { useCallback } from 'react';

export function useExport() {
  const exportCsv = useCallback(() => {
    // Implementation hooks into the active view's `getRows`/`getColumns` registered
    // via a small ExportContext. For now triggers window.print() as a placeholder.
    window.dispatchEvent(new CustomEvent('seesby:export', { detail: { format: 'csv' } }));
  }, []);
  const exportJson = useCallback(() => {
    window.dispatchEvent(new CustomEvent('seesby:export', { detail: { format: 'json' } }));
  }, []);
  const copyAsTable = useCallback(() => {
    window.dispatchEvent(new CustomEvent('seesby:export', { detail: { format: 'tsv' } }));
  }, []);
  return { exportCsv, exportJson, copyAsTable };
}
