import React, { useMemo, useState } from 'react';
import { useExperiments } from '../selectors/useExperiments.tsx';
import { useExportRegistration } from '../../_hooks/useExportRegistration';
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext';
import { fmtPct, fmtUrl, fmtDate } from '../../_shared/formatters';

const COLUMNS = ['ideas', 'design', 'live', 'won', 'lost', 'inconclusive'] as const;
const COL_LABEL: Record<string, string> = {
  ideas: 'Ideas', design: 'Design', live: 'Live', won: 'Won', lost: 'Lost', inconclusive: 'Inconclusive',
};

export default function UxExperimentsView() {
  const rows = useExperiments();
  const { setSelectedPageUrl, setInspectorOpen } = useSeoCrawler() as any;

  const grouped = useMemo(() => {
    const map: Record<string, typeof rows> = {};
    COLUMNS.forEach(c => { map[c] = []; });
    rows.forEach((r: any) => {
      const status = r.status || 'ideas';
      if (map[status]) map[status].push(r);
      else map.ideas.push(r);
    });
    return map;
  }, [rows]);

  return (
    <div className="flex-1 flex min-h-0 overflow-x-auto">
      {COLUMNS.map(col => (
        <div key={col} className="flex-1 min-w-[200px] border-r border-[var(--brand-surface-3)] flex flex-col">
          <div className="h-9 px-3 flex items-center gap-2 border-b border-[var(--brand-surface-3)] bg-[var(--brand-surface-0)] shrink-0">
            <span className="text-[11px] text-[var(--brand-text-mid)] uppercase tracking-wider">{COL_LABEL[col]}</span>
            <span className="text-[10px] text-[var(--brand-text-faint)] font-mono">{grouped[col].length}</span>
          </div>
          <div className="flex-1 overflow-auto custom-scrollbar p-2 space-y-2">
            {grouped[col].map((exp: any) => (
              <button
                key={exp.id}
                onClick={() => { setSelectedPageUrl?.(exp.pageUrl); setInspectorOpen?.(true); }}
                className="w-full text-left rounded border border-[var(--brand-surface-3)] bg-[var(--brand-surface-1)] p-2.5 hover:border-[var(--brand-border-3)] transition-colors"
              >
                <div className="text-[11px] text-[var(--brand-text-strong)] truncate mb-1">{exp.name}</div>
                <div className="text-[10px] text-[var(--brand-text-faint)] truncate mb-1.5">{fmtUrl(exp.pageUrl)}</div>
                <div className="flex items-center gap-2 flex-wrap">
                  {exp.metric && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--brand-surface-3)] text-[var(--brand-text-mid)]">{exp.metric}</span>
                  )}
                  {exp.uplift != null && (
                    <span className={`text-[10px] font-mono tabular-nums ${exp.uplift > 0 ? 'text-[#22c55e]' : exp.uplift < 0 ? 'text-[#ef4444]' : 'text-[var(--brand-text-faint)]'}`}>
                      {exp.uplift > 0 ? '+' : ''}{fmtPct(exp.uplift)}
                    </span>
                  )}
                  {exp.significance != null && (
                    <span className={`text-[9px] font-mono ${Math.round((1 - exp.significance) * 100) >= 95 ? 'text-[#22c55e]' : 'text-[var(--brand-text-faint)]'}`}>
                      {Math.round((1 - exp.significance) * 100)}% conf
                    </span>
                  )}
                  {exp.variants && (
                    <span className="text-[9px] text-[var(--brand-text-faint)]">{exp.variants.length}v</span>
                  )}
                </div>
                {exp.startedAt && (
                  <div className="text-[9px] text-[var(--brand-text-faint)] mt-1.5">{fmtDate(exp.startedAt)}</div>
                )}
              </button>
            ))}
            {grouped[col].length === 0 && (
              <div className="text-[11px] text-[var(--brand-border-2)] text-center py-4">Empty</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
