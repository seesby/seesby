import React, { useState } from 'react';
import { useForms } from '../selectors/useForms.tsx';
import { fmtPct, fmtUrl, fmtMs } from '../../_shared/formatters';
import { STATUS_HEX } from '../../_shared/shared-columns';

export default function UxFormsView() {
  const forms = useForms();
  const [selectedId, setSelectedId] = useState<string | null>(forms[0]?.id ?? null);
  const selected = forms.find((f: any) => f.id === selectedId) ?? forms[0];

  return (
    <div className="flex-1 grid grid-cols-12 gap-0 min-h-0">
      {/* Form list */}
      <div className="col-span-5 border-r border-[var(--brand-surface-3)] bg-[var(--brand-surface-0)] flex flex-col min-h-0">
        <div className="h-9 px-3 flex items-center border-b border-[var(--brand-surface-3)] shrink-0">
          <span className="text-[11px] text-[var(--brand-text-faint)] uppercase tracking-wider">
            {forms.length} form{forms.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex-1 overflow-auto custom-scrollbar">
          {forms.length === 0 ? (
            <div className="p-4 text-[12px] text-[var(--brand-text-faint)]">No forms detected.</div>
          ) : (
            forms.map((f: any) => {
              const sel = f.id === selectedId;
              return (
                <button
                  key={f.id}
                  onClick={() => setSelectedId(f.id)}
                  className={`w-full text-left px-3 py-2.5 border-b border-[var(--brand-surface-2)] transition-colors ${
                    sel ? 'bg-[var(--brand-surface-1)]' : 'hover:bg-[var(--brand-surface-1)]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-[var(--brand-text-strong)] truncate">{f.name}</span>
                    <span className={`text-[10px] font-mono tabular-nums ${
                      f.abandonRate < 0.3 ? 'text-[#22c55e]' : f.abandonRate < 0.6 ? 'text-[#f59e0b]' : 'text-[#ef4444]'
                    }`}>
                      {fmtPct(f.abandonRate)} drop
                    </span>
                  </div>
                  <div className="text-[10px] text-[var(--brand-text-faint)] mt-0.5 truncate">{fmtUrl(f.pageUrl)}</div>
                  <div className="text-[10px] text-[var(--brand-text-faint)] mt-0.5">
                    {f.starts} starts · {f.completes} completes
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Form detail */}
      <div className="col-span-7 bg-[var(--brand-surface-0)] flex flex-col min-h-0 overflow-auto custom-scrollbar">
        {selected ? (
          <div className="p-4 space-y-4">
            {/* Header */}
            <div>
              <div className="text-[13px] text-[var(--brand-text-strong)]">{selected.name}</div>
              <div className="text-[10px] text-[var(--brand-text-faint)] truncate">{selected.pageUrl}</div>
              <div className="text-[11px] text-[var(--brand-text-mid)] mt-1">
                {selected.fields.length} fields · {selected.starts} starts · {selected.completes} completes ({fmtPct(selected.completes / (selected.starts || 1))})
              </div>
            </div>

            {/* Field-by-field funnel */}
            {selected.fields.length > 0 && (
              <div className="rounded border border-[var(--brand-surface-3)] bg-[var(--brand-surface-1)] p-4">
                <div className="text-[10px] uppercase tracking-wider text-[var(--brand-text-faint)] mb-3">Field-by-field drop-off</div>
                <div className="space-y-1.5">
                  {selected.fields.map((field: any, i: number) => {
                    const fieldRate = selected.starts > 0 ? Math.max(0, 1 - field.abandonRate) : 0;
                    const w = Math.max(0, Math.min(100, fieldRate * 100));
                    return (
                      <div key={field.id} className="flex items-center gap-2">
                        <div className="w-24 truncate text-[11px] text-[var(--brand-text-mid)]">{field.label}</div>
                        <div className="flex-1 h-3 rounded bg-[var(--brand-surface-3)] overflow-hidden">
                          <div
                            className="h-full rounded"
                            style={{
                              width: `${w}%`,
                              background: field.abandonRate > 0.3 ? STATUS_HEX.bad : field.abandonRate > 0.1 ? STATUS_HEX.warn : '#f43f5e',
                              opacity: 0.85,
                            }}
                          />
                        </div>
                        <div className="w-12 text-right text-[10px] font-mono text-[var(--brand-text-mid)] tabular-nums">
                          {Math.round(w)}%
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Field analytics table */}
            {selected.fields.length > 0 && (
              <div className="rounded border border-[var(--brand-surface-3)] bg-[var(--brand-surface-1)] p-4">
                <div className="text-[10px] uppercase tracking-wider text-[var(--brand-text-faint)] mb-3">Field analytics</div>
                <table className="w-full text-[11px]">
                  <thead className="text-[10px] uppercase text-[var(--brand-text-faint)]">
                    <tr>
                      <th className="text-left py-1 font-normal">Field</th>
                      <th className="text-right font-normal">Abandon</th>
                      <th className="text-right font-normal">Errors</th>
                      <th className="text-right font-normal">Avg fill</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.fields.map((field: any) => (
                      <tr key={field.id} className="border-t border-[var(--brand-surface-3)]">
                        <td className="py-1.5 text-[var(--brand-text-mid)]">{field.label}</td>
                        <td className="text-right font-mono tabular-nums text-[var(--brand-text-mid)]">{fmtPct(field.abandonRate)}</td>
                        <td className="text-right font-mono tabular-nums text-[var(--brand-text-mid)]">{fmtPct(field.errorRate)}</td>
                        <td className="text-right font-mono tabular-nums text-[var(--brand-text-mid)]">{fmtMs(field.avgFillMs)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 grid place-items-center text-[12px] text-[var(--brand-text-faint)]">
            Select a form to see details.
          </div>
        )}
      </div>
    </div>
  );
}
