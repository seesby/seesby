// _hooks/useExportRegistration.ts
import { useEffect } from 'react';

export function useExportRegistration<T>(getRows: () => ReadonlyArray<T>, getColumns: () => ReadonlyArray<{ key: string; label: string }>) {
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { format: 'csv' | 'json' | 'tsv' };
      const rows = getRows();
      const cols = getColumns();
      if (detail.format === 'json') {
        download('export.json', JSON.stringify(rows, null, 2), 'application/json');
        return;
      }
      const sep = detail.format === 'csv' ? ',' : '\t';
      const head = cols.map(c => csv(c.label, sep)).join(sep);
      const body = rows.map(r => cols.map(c => csv((r as any)[c.key] ?? '', sep)).join(sep)).join('\n');
      download(`export.${detail.format}`, `${head}\n${body}`, 'text/plain');
    };
    window.addEventListener('seesby:export', handler);
    return () => window.removeEventListener('seesby:export', handler);
  }, [getRows, getColumns]);
}

function csv(v: any, sep: string) {
  const s = String(v ?? '');
  return /[",\n\t]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function download(name: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}
