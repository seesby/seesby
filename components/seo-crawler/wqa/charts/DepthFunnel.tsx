import React from 'react';
import { WQA_SIDEBAR_TOKENS as T } from '../sidebar/tokens';

export default function DepthFunnel({ levels }: { levels: Array<{ depth: number; count: number }> }) {
    const max = Math.max(1, ...levels.map((l) => l.count));
    return (
        <div className="space-y-1">
            {levels.map((l) => {
                const pct = (l.count / max) * 100;
                return (
                    <div key={l.depth} className="flex items-center gap-2 text-[10px]">
                        <div className="w-10 text-[var(--brand-text-mid)]]">D{l.depth}</div>
                        <div className="flex-1 h-3 rounded-sm overflow-hidden" style={{ background: T.border }}>
                            <div style={{ width: `${pct}%`, background: T.accent, height: '100%' }} />
                        </div>
                        <div className="w-10 text-right font-mono text-[var(--brand-text-strong)]">{l.count}</div>
                    </div>
                );
            })}
        </div>
    );
}
