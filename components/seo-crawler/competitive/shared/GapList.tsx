import React from 'react';

export interface GapItem {
    keyword: string;
    intent?: string;
    volume?: number | null;
    competitorPosition?: number | null;
}

interface GapListProps {
    items: GapItem[];
    emptyMessage?: string;
    maxItems?: number;
}

const INTENT_COLORS: Record<string, string> = {
    informational: 'text-blue-400 bg-blue-400/10',
    commercial: 'text-purple-400 bg-purple-400/10',
    transactional: 'text-green-400 bg-green-400/10',
    navigational: 'text-yellow-400 bg-yellow-400/10',
};

export default function GapList({ items, emptyMessage = 'No gaps found.', maxItems = 20 }: GapListProps) {
    if (items.length === 0) {
        return <div className="py-4 text-center text-[11px] text-[var(--brand-text-faint)]">{emptyMessage}</div>;
    }

    return (
        <div className="custom-scrollbar max-h-[300px] space-y-1 overflow-y-auto">
            {items.slice(0, maxItems).map((item, i) => (
                <div key={`${item.keyword}-${i}`} className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-[var(--brand-surface-2)]">
                    <span className="flex-1 truncate text-[11px] text-[var(--brand-text-strong)]">{item.keyword}</span>
                    {item.intent && (
                        <span
                            className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${
                                INTENT_COLORS[item.intent.toLowerCase()] || 'bg-[var(--brand-surface-2)] text-[var(--brand-text-faint)]'
                            }`}
                        >
                            {item.intent.slice(0, 4)}
                        </span>
                    )}
                    {item.volume != null && <span className="font-mono text-[10px] text-[var(--brand-text-faint)]">{item.volume.toLocaleString()}</span>}
                    {item.competitorPosition != null && (
                        <span className="font-mono text-[10px] text-[#F59E0B]">#{item.competitorPosition}</span>
                    )}
                </div>
            ))}
            {items.length > maxItems && (
                <div className="py-1 text-center text-[10px] text-[var(--brand-text-faint)]">+{items.length - maxItems} more</div>
            )}
        </div>
    );
}
