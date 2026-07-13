import React, { useMemo } from 'react';

interface Props { pages: any[] }

function pct(n: number, d: number) { return d > 0 ? Math.round((n / d) * 100) : 0; }

export default function MapCoverageStrip({ pages }: Props) {
    const stats = useMemo(() => {
        const total = pages.length || 1;
        const html = pages.filter(p => p.isHtmlPage && p.statusCode === 200);
        const htmlTotal = html.length || 1;
        return {
            total: pages.length,
            indexed:  pct(html.filter(p => p.indexable !== false).length, htmlTotal),
            sitemap:  pct(pages.filter(p => p.inSitemap).length, total),
            orphans:  pct(html.filter(p => (p.inlinks || 0) === 0).length, htmlTotal),
            broken:   pct(pages.filter(p => (p.statusCode || 0) >= 400).length, total),
            depth3:   pct(html.filter(p => (p.crawlDepth || 0) >= 3).length, htmlTotal),
            schema:   pct(html.filter(p => (p.schemaTypes || []).length > 0).length, htmlTotal),
        };
    }, [pages]);

    const cells: Array<{ label: string; value: number; tone: 'good' | 'warn' | 'bad' | 'neutral' }> = [
        { label: 'Indexed',       value: stats.indexed,  tone: stats.indexed >= 90 ? 'good' : stats.indexed >= 70 ? 'warn' : 'bad' },
        { label: 'In sitemap',    value: stats.sitemap,  tone: stats.sitemap >= 90 ? 'good' : stats.sitemap >= 60 ? 'warn' : 'bad' },
        { label: 'Orphans',       value: stats.orphans,  tone: stats.orphans <= 2 ? 'good' : stats.orphans <= 8 ? 'warn' : 'bad' },
        { label: 'Broken',        value: stats.broken,   tone: stats.broken === 0 ? 'good' : stats.broken <= 2 ? 'warn' : 'bad' },
        { label: 'Depth ≥ 3',     value: stats.depth3,   tone: stats.depth3 <= 25 ? 'good' : stats.depth3 <= 50 ? 'warn' : 'bad' },
        { label: 'Schema',        value: stats.schema,   tone: stats.schema >= 80 ? 'good' : stats.schema >= 50 ? 'warn' : 'bad' },
    ];

    const TONE = {
        good:    'text-green-400',
        warn:    'text-orange-400',
        bad:     'text-red-400',
        neutral: 'text-[var(--brand-text-strong)]',
    } as const;

    return (
        <div className="h-[44px] shrink-0 border-b border-[var(--brand-surface-3)] bg-[var(--brand-surface-0)] flex items-stretch">
            <div className="px-4 flex items-center gap-1.5 border-r border-[var(--brand-surface-3)] shrink-0">
                <span className="text-[10px] uppercase tracking-widest text-[var(--brand-text-faint)]">Coverage</span>
                <span className="text-[11px] font-mono text-[var(--brand-text-strong)]">{stats.total.toLocaleString()} pages</span>
            </div>
            <div className="flex flex-1 min-w-0">
                {cells.map(c => (
                    <div key={c.label} className="flex-1 min-w-0 px-3 flex flex-col justify-center border-r border-[var(--brand-surface-3)] last:border-r-0">
                        <span className="text-[9px] uppercase tracking-widest text-[var(--brand-text-faint)] truncate">{c.label}</span>
                        <div className="flex items-center gap-2">
                            <span className={`text-[12px] font-mono font-bold ${TONE[c.tone]}`}>{c.value}%</span>
                            <div className="h-1 flex-1 bg-[var(--brand-surface-2)] rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full"
                                    style={{
                                        width: `${c.value}%`,
                                        background: c.tone === 'good' ? '#22c55e' : c.tone === 'warn' ? '#f59e0b' : c.tone === 'bad' ? '#ef4444' : '#F59E0B',
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
