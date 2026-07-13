// ColumnPickerPopover.tsx
// Bridges the ViewToolbar column picker with the actual `visibleColumns` state in
// SeoCrawlerContext, so toggling columns here is immediately reflected in the main grid.
import React, { useMemo, useState } from 'react';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';
import { ALL_COLUMNS } from '@/components/seo-crawler/constants';
import { getMetricDef, isMetricVisible } from '@seesby/metrics';

// Group columns by their group label for organised display
type ColEntry = { key: string; label: string; group: string; format?: string; source?: string };
type GroupedColumns = { group: string; cols: ColEntry[] }[];

function groupColumns(cols: ColEntry[]): GroupedColumns {
  const map = new Map<string, ColEntry[]>();
  for (const col of cols) {
    const g = col.group ?? 'General';
    if (!map.has(g)) map.set(g, []);
    map.get(g)!.push(col);
  }
  return Array.from(map.entries()).map(([group, entries]) => ({ group, cols: entries }));
}

export function ColumnPickerPopover({ mode }: { mode?: string }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { visibleColumns, setVisibleColumns, markColumnsOverridden, fingerprint, connected, capabilities, mode: ctxMode } = useSeoCrawler();

  const toggle = (key: string) => {
    markColumnsOverridden();
    setVisibleColumns(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  // Filter columns by MetricRole 'G' and mode visibility
  const filtered = useMemo(() => {
    const visCtx = {
      mode: (mode ?? ctxMode ?? 'fullAudit') as any,
      industry: (fingerprint?.industry?.value ?? 'general') as any,
      cms: (fingerprint?.cms?.value ?? 'custom') as any,
      language: (fingerprint?.languagePrimary?.value ?? 'en') as any,
      connectedIntegrations: Object.keys(connected ?? {}),
      capabilities: capabilities ?? [],
    };

    const visible = ALL_COLUMNS.filter(col => {
      const def = getMetricDef(col.key);
      if (def) {
        // Registry column — check role 'G' and mode visibility
        if (!def.roles?.includes('G' as any)) return false;
        return isMetricVisible(def, visCtx, 'grid');
      }
      // Legacy column — show if no registry equivalent exists
      return true;
    });

    const entries: ColEntry[] = visible.map(c => ({
      key: c.key,
      label: c.label,
      group: c.group ?? 'General',
      format: (c as any).format,
      source: (c as any).source,
    }));

    const grouped = groupColumns(entries);

    if (!search) return grouped;
    const q = search.toLowerCase();
    return grouped.map(g => ({
      group: g.group,
      cols: g.cols.filter(c => c.label.toLowerCase().includes(q) || c.key.toLowerCase().includes(q)),
    })).filter(g => g.cols.length > 0);
  }, [search, mode, ctxMode, fingerprint, connected, capabilities]);

  return (
    <div className="relative">
      <button
        id="column-picker-btn"
        onClick={() => setOpen(o => !o)}
        className="h-7 px-2 text-[11px] text-[#999] hover:text-white border border-[#1a1a1a] rounded bg-[#0c0c0c] transition-colors"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        ⊞ Columns
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          <div
            className="absolute right-0 top-full mt-1 w-72 max-h-[480px] flex flex-col bg-[#0d0d0d] border border-[#1e1e1e] rounded-lg shadow-2xl z-50"
            role="dialog"
            aria-label="Column picker"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-[#1a1a1a] shrink-0">
              <span className="text-[10px] uppercase tracking-widest text-[#555]">Columns</span>
              <button
                onClick={() => setVisibleColumns(ALL_COLUMNS.map(c => c.key))}
                className="text-[10px] text-[#666] hover:text-white transition-colors"
              >
                Show all
              </button>
            </div>

            {/* Search */}
            <div className="px-2 py-1.5 border-b border-[#1a1a1a] shrink-0">
              <input
                autoFocus
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Filter columns…"
                className="w-full bg-[#111] border border-[#1e1e1e] rounded px-2 py-1 text-[11px] text-[#ddd] placeholder:text-[#444] focus:outline-none focus:border-[#333]"
              />
            </div>

            {/* Column list */}
            <div className="overflow-y-auto custom-scrollbar flex-1">
              {filtered.map(({ group, cols }) => (
                <div key={group}>
                  <div className="px-3 pt-2 pb-0.5 text-[9px] uppercase tracking-widest text-[#444] font-bold">
                    {group}
                  </div>
                  {cols.map(c => {
                    const on = visibleColumns.includes(c.key);
                    const fmt = (c as Record<string, unknown>).format as string | undefined;
                    const src = (c as Record<string, unknown>).source as string | null | undefined;
                    return (
                      <label
                        key={c.key}
                        className="flex items-center gap-2 px-3 py-[5px] hover:bg-[#141414] cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={on}
                          onChange={() => toggle(c.key)}
                          className="w-3 h-3 accent-[#F59E0B] cursor-pointer shrink-0"
                        />
                        <span className={`text-[11px] leading-tight flex-1 ${on ? 'text-white' : 'text-[#666]'}`}>
                          {c.label}
                        </span>
                        {fmt && (
                          <span className="text-[8px] px-1 py-px rounded bg-[#1a1a1a] text-[#555] uppercase shrink-0 leading-none">
                            {fmt}
                          </span>
                        )}
                        {src && (
                          <span className="text-[8px] px-1 py-px rounded bg-[#1a1118] text-[#8b5cf6] shrink-0 leading-none">
                            {src}
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-3 py-2 border-t border-[#1a1a1a] shrink-0 flex items-center justify-between">
              <span className="text-[10px] text-[#555]">{visibleColumns.length} visible</span>
              <button
                onClick={() => setOpen(false)}
                className="text-[10px] text-[#666] hover:text-white transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
