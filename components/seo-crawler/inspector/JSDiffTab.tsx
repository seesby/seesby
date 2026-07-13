import React from 'react';
import { useSeoCrawler } from '../../../contexts/SeoCrawlerContext';

export default function JSDiffTab({ page }: { page: any }) {
    if (!page.jsRenderDiff) {
        return (
            <div className="p-4 text-[12px] text-[var(--brand-text-mid)]] text-center">
                JS Rendering Diff was not enabled or not successful for this page.
            </div>
        );
    }

    const { jsRenderDiff } = page;

    return (
        <div className="p-4 space-y-6">
            <div>
                <h3 className="text-[12px] font-bold text-[var(--brand-text-strong)] uppercase tracking-wider mb-2">JS Rendering Overview</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[var(--brand-surface-2)]] border border-[var(--brand-border-2)]] rounded p-3">
                        <div className="text-[10px] text-[var(--brand-text-faint)]] uppercase">Text Difference</div>
                        <div className="text-[14px] text-[var(--brand-text-strong)] font-mono">{jsRenderDiff.textDiffPercent}%</div>
                    </div>
                    <div className="bg-[var(--brand-surface-2)]] border border-[var(--brand-border-2)]] rounded p-3">
                        <div className="text-[10px] text-[var(--brand-text-faint)]] uppercase">JS-Only Links</div>
                        <div className="text-[14px] text-[var(--brand-text-strong)] font-mono">{jsRenderDiff.jsOnlyLinks}</div>
                    </div>
                    <div className="bg-[var(--brand-surface-2)]] border border-[var(--brand-border-2)]] rounded p-3">
                        <div className="text-[10px] text-[var(--brand-text-faint)]] uppercase">JS-Only Images</div>
                        <div className="text-[14px] text-[var(--brand-text-strong)] font-mono">{jsRenderDiff.jsOnlyImages}</div>
                    </div>
                    <div className="bg-[var(--brand-surface-2)]] border border-[var(--brand-border-2)]] rounded p-3">
                        <div className="text-[10px] text-[var(--brand-text-faint)]] uppercase">Critical Content</div>
                        <div className={`text-[12px] font-bold ${jsRenderDiff.criticalContentJsOnly ? 'text-red-400' : 'text-green-400'}`}>
                            {jsRenderDiff.criticalContentJsOnly ? 'Dependent on JS' : 'Available in HTML'}
                        </div>
                    </div>
                    <div className="bg-[var(--brand-surface-2)]] border border-[var(--brand-border-2)]] rounded p-3">
                        <div className="text-[10px] text-[var(--brand-text-faint)]] uppercase">Schema (LD+JSON)</div>
                        <div className={`text-[12px] font-bold ${jsRenderDiff.jsOnlySchema ? 'text-yellow-400' : 'text-green-400'}`}>
                            {jsRenderDiff.jsOnlySchema ? 'Injected by JS' : 'Present in HTML'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
