import React from 'react';
import { Funnel } from '../../_shared/Funnel';
import { useCommerceFunnel } from '../selectors/useCommerceFunnel.tsx';
import { fmtPct } from '../../_shared/formatters';

const CARD = 'rounded border border-[var(--brand-surface-3)] bg-[var(--brand-surface-0)] p-3 min-h-0';

export default function CommerceFunnelView() {
  const { steps, counts, dropOff, deviceFunnels, templateFunnels, cvr, aov, hasData } = useCommerceFunnel();

  if (!hasData) {
    return (
      <div className="flex-1 flex items-center justify-center text-[13px] text-[var(--brand-text-faint)]">
        Connect analytics or upload funnel data to see checkout flow.
      </div>
    );
  }

  const funnelSteps = steps.map((s, i) => ({
    label: s,
    value: counts[i] ?? 0,
  }));

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <div className="flex-1 min-h-0 overflow-auto custom-scrollbar">
        <div className="p-3 space-y-3">
          <div className="flex items-center gap-3 text-[11px]">
            <span className="text-[var(--brand-text-mid)]">Range:</span>
            <span className="text-[var(--brand-text-strong)]">28d</span>
            <span className="text-[var(--brand-text-faint)]">|</span>
            <span className="text-[var(--brand-text-mid)]">Source:</span>
            <span className="text-[var(--brand-text-strong)]">analytics upload</span>
          </div>

          <div className={`${CARD}`}>
            <div className="text-[10px] uppercase tracking-wider text-[var(--brand-text-faint)] mb-2">Funnel</div>
            <Funnel steps={funnelSteps} accent="#10b981" />
            <div className="mt-2 text-[11px] text-[var(--brand-text-mid)]">
              conv {fmtPct(cvr)} {aov > 0 ? `\u00b7 AOV $${aov.toFixed(0)}` : ''}
            </div>
          </div>

          {dropOff.length > 0 && (
            <div className={`${CARD}`}>
              <div className="text-[10px] uppercase tracking-wider text-[var(--brand-text-faint)] mb-2">Drop-off diagnosis</div>
              <div className="space-y-2">
                {dropOff.map(d => (
                  <div key={d.from} className="flex items-start gap-3 text-[11px]">
                    <span className="text-[var(--brand-text-mid)] min-w-[140px]">{d.from} <span className="text-[var(--brand-text-faint)]">\u2192</span> {d.to}</span>
                    <span className="text-[#ef4444] min-w-[60px]">{fmtPct(d.dropPct)} drop</span>
                    <span className="text-[var(--brand-text-mid)]">{d.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {deviceFunnels.length > 0 && (
              <div className={`${CARD}`}>
                <div className="text-[10px] uppercase tracking-wider text-[var(--brand-text-faint)] mb-2">Funnel by device</div>
                <div className="space-y-2">
                  {deviceFunnels.map(df => (
                    <div key={df.device}>
                      <div className="text-[11px] text-[var(--brand-text-strong)] mb-1">{df.device}</div>
                      <Funnel
                        steps={df.steps.map((s, i) => ({ label: s, value: df.counts[i] ?? 0 }))}
                        accent="#10b981"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {templateFunnels.length > 0 && (
              <div className={`${CARD}`}>
                <div className="text-[10px] uppercase tracking-wider text-[var(--brand-text-faint)] mb-2">Funnel by template</div>
                <div className="space-y-2">
                  {templateFunnels.map(tf => (
                    <div key={tf.template}>
                      <div className="text-[11px] text-[var(--brand-text-strong)] mb-1">{tf.template}</div>
                      <Funnel
                        steps={tf.steps.map((s, i) => ({ label: s, value: tf.counts[i] ?? 0 }))}
                        accent="#10b981"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
