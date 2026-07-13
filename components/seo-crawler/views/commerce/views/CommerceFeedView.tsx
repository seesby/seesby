import React from 'react';
import { DistributionStrip } from '../../_shared/DistributionStrip';
import { useFeed } from '../selectors/useFeed.tsx';

const CARD = 'rounded border border-[var(--brand-surface-3)]] bg-[var(--brand-surface-0)]] p-3 min-h-0';

export default function CommerceFeedView() {
  const { statusSummary, statusSegments, errorBreakdown, parityRows } = useFeed();

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <div className="flex-1 min-h-0 overflow-auto custom-scrollbar">
        <div className="p-3 space-y-3">
          <div className="flex items-center gap-3 text-[11px]">
            <span className="text-[var(--brand-text-mid)]]">Feed source:</span>
            <span className="text-[var(--brand-text-strong)]">Google Merchant Center</span>
            <span className="text-[var(--brand-text-faint)]]">|</span>
            <span className="text-[var(--brand-text-mid)]]">Last sync:</span>
            <span className="text-[var(--brand-text-strong)]">2h ago</span>
          </div>

          <div className={`${CARD}`}>
            <div className="text-[10px] uppercase tracking-wider text-[var(--brand-text-faint)]] mb-3">Feed status summary</div>
            <div className="space-y-1.5">
              {statusSummary.map(s => (
                <div key={s.label} className="flex items-center gap-3 text-[11px]">
                  <span className="w-20 text-[var(--brand-text-mid)]]">{s.label}</span>
                  <div className="flex-1 h-3 rounded bg-[var(--brand-surface-3)]] overflow-hidden">
                    <div className="h-full rounded" style={{ width: `${s.pct}%`, background: s.color }} />
                  </div>
                  <span className="w-12 text-right font-mono text-[var(--brand-text-strong)]">{s.count}</span>
                </div>
              ))}
            </div>
          </div>

          {statusSegments.length > 0 && (
            <div className={`${CARD}`}>
              <DistributionStrip title="Status" segments={statusSegments} />
            </div>
          )}

          {errorBreakdown.length > 0 && (
            <div className={`${CARD}`}>
              <div className="text-[10px] uppercase tracking-wider text-[var(--brand-text-faint)]] mb-2">Errors breakdown</div>
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-[var(--brand-text-faint)]] border-b border-[var(--brand-surface-3)]]">
                    <th className="text-left py-1.5 font-normal">Error</th>
                    <th className="text-right py-1.5 font-normal">Items</th>
                    <th className="text-left py-1.5 font-normal pl-4">Fix</th>
                  </tr>
                </thead>
                <tbody>
                  {errorBreakdown.map(e => (
                    <tr key={e.type} className="border-b border-[var(--brand-surface-2)]]">
                      <td className="py-1.5 text-[var(--brand-text-mid)]]">{e.type}</td>
                      <td className="py-1.5 text-right font-mono text-[var(--brand-text-strong)]">{e.count}</td>
                      <td className="py-1.5 text-[var(--brand-text-mid)]] pl-4">{e.fix}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {parityRows.length > 0 && (
            <div className={`${CARD}`}>
              <div className="text-[10px] uppercase tracking-wider text-[var(--brand-text-faint)]] mb-2">Feed vs site parity</div>
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-[var(--brand-text-faint)]] border-b border-[var(--brand-surface-3)]]">
                    <th className="text-left py-1.5 font-normal">SKU</th>
                    <th className="text-right py-1.5 font-normal">Feed price</th>
                    <th className="text-right py-1.5 font-normal">Site price</th>
                    <th className="text-left py-1.5 font-normal pl-2">Feed avail</th>
                    <th className="text-left py-1.5 font-normal pl-2">Site avail</th>
                    <th className="text-left py-1.5 font-normal pl-2">Delta</th>
                  </tr>
                </thead>
                <tbody>
                  {parityRows.map(p => (
                    <tr key={p.sku} className="border-b border-[var(--brand-surface-2)]]">
                      <td className="py-1.5 text-[var(--brand-text-mid)]]">{p.sku}</td>
                      <td className="py-1.5 text-right font-mono text-[var(--brand-text-strong)]">${p.feedPrice.toFixed(0)}</td>
                      <td className="py-1.5 text-right font-mono text-[var(--brand-text-strong)]">${p.sitePrice.toFixed(0)}</td>
                      <td className="py-1.5 pl-2">{p.feedAvailable ? <span className="text-[#22c55e]">in</span> : <span className="text-[#ef4444]">out</span>}</td>
                      <td className="py-1.5 pl-2">{p.siteAvailable ? <span className="text-[#22c55e]">in</span> : <span className="text-[#ef4444]">out</span>}</td>
                      <td className="py-1.5 pl-2">
                        {p.feedPrice !== p.sitePrice || p.feedAvailable !== p.siteAvailable
                          ? <span className="text-[#f59e0b]">{p.feedPrice !== p.sitePrice ? 'price diff' : 'avail diff'}</span>
                          : <span className="text-[#22c55e]">ok</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
