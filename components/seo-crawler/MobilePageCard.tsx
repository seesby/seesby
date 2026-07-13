import React, { useMemo } from 'react';
import { ChevronRight } from 'lucide-react';
import { getPageIssues } from './IssueTaxonomy';

interface MobilePageCardProps {
    page: any;
    index: number;
    onOpen: (page: any) => void;
}

const getStatusTone = (statusCode: number) => {
    if (statusCode >= 500) return 'text-red-300 bg-red-500/10 border-red-500/20';
    if (statusCode >= 400) return 'text-red-200 bg-red-500/10 border-red-500/20';
    if (statusCode >= 300) return 'text-amber-200 bg-amber-500/10 border-amber-500/20';
    return 'text-emerald-200 bg-emerald-500/10 border-emerald-500/20';
};

export default function MobilePageCard({ page, index, onOpen }: MobilePageCardProps) {
    const issues = useMemo(() => getPageIssues(page), [page]);
    const primaryIssue = issues[0];
    const pathname = useMemo(() => {
        try {
            return new URL(page.url).pathname || '/';
        } catch {
            return page.url;
        }
    }, [page.url]);

    return (
        <button
            type="button"
            onClick={() => onOpen(page)}
            className="w-full rounded-2xl border border-[var(--brand-border-2)] bg-[var(--brand-surface-1)] p-4 text-left shadow-[0_8px_24px_rgba(0,0,0,0.25)] transition-colors hover:border-[#313138]"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-[0.24em] text-[var(--brand-text-faint)]">Page {index + 1}</div>
                    <div className="mt-1 truncate text-[14px] font-semibold text-[var(--brand-text-strong)]">{pathname}</div>
                    <div className="mt-1 truncate text-[11px] text-[#6d93ff]">{page.url}</div>
                </div>
                <div className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${getStatusTone(Number(page.statusCode || 0))}`}>
                    {page.statusCode || '---'}
                </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-[11px]">
                <div className="rounded-xl border border-[var(--brand-surface-3)] bg-[var(--brand-surface-0)] p-3">
                    <div className="text-[var(--brand-text-faint)]">Score</div>
                    <div className="mt-1 text-[16px] font-black text-[var(--brand-text-strong)]">{page.healthScore ?? '--'}</div>
                </div>
                <div className="rounded-xl border border-[var(--brand-surface-3)] bg-[var(--brand-surface-0)] p-3">
                    <div className="text-[var(--brand-text-faint)]">LCP</div>
                    <div className="mt-1 text-[16px] font-black text-[var(--brand-text-strong)]">{page.lcp ? `${(Number(page.lcp) / 1000).toFixed(1)}s` : '--'}</div>
                </div>
                <div className="rounded-xl border border-[var(--brand-surface-3)] bg-[var(--brand-surface-0)] p-3">
                    <div className="text-[var(--brand-text-faint)]">Words</div>
                    <div className="mt-1 text-[16px] font-black text-[var(--brand-text-strong)]">{page.wordCount ?? 0}</div>
                </div>
            </div>

            <div className="mt-4 flex items-center justify-between rounded-xl border border-[#22252a] bg-[#0b0c10] px-3 py-2.5">
                <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-[0.22em] text-[var(--brand-text-faint)]">Primary issue</div>
                    <div className="mt-1 truncate text-[12px] text-[var(--brand-text-mid)]">{primaryIssue?.label || 'No major issues detected'}</div>
                </div>
                <ChevronRight size={16} className="shrink-0 text-[var(--brand-text-mid)]" />
            </div>
        </button>
    );
}
