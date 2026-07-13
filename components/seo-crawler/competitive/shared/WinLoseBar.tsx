import React from 'react';

interface WinLoseBarProps {
    domain: string;
    wins: number;
    losses: number;
    ties: number;
}

export default function WinLoseBar({ domain, wins, losses, ties }: WinLoseBarProps) {
    const total = wins + losses + ties || 1;

    return (
        <div className="flex items-center gap-2 py-1.5">
            <span className="w-[120px] truncate text-[11px] text-[var(--brand-text-mid)]" title={domain}>
                {domain}
            </span>
            <div className="flex h-2.5 flex-1 overflow-hidden rounded-full bg-[var(--brand-surface-3)]">
                <div className="bg-green-500 transition-all" style={{ width: `${(wins / total) * 100}%` }} />
                <div className="bg-[var(--brand-border-2)] transition-all" style={{ width: `${(ties / total) * 100}%` }} />
                <div className="bg-red-500 transition-all" style={{ width: `${(losses / total) * 100}%` }} />
            </div>
            <div className="flex min-w-[92px] justify-end gap-2 text-[10px] font-mono">
                <span className="text-green-400">{wins}W</span>
                <span className="text-[var(--brand-text-faint)]">{ties}T</span>
                <span className="text-red-400">{losses}L</span>
            </div>
        </div>
    );
}
