import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Plus } from 'lucide-react';
import { useSeoCrawler } from '../../contexts/SeoCrawlerContext';
import { getMode } from '@seesby/modes';
import { ViewToolbar } from './views/_shared/ViewToolbar';
import { SURFACE, TEXT, STATUS, R, S } from './views/_shared/tokens';

const FILTER_LABELS: Record<string, string> = {
    'scope.kind': 'Scope',
    'page.category': 'Template',
    'page.exactDepth': 'Depth',
    'wqa.priority': 'Priority',
    'tech.rendering': 'Rendering',
    'page.statusClass': 'Status',
    'link.type': 'Link type',
    'schema.type': 'Schema',
    'ai.crawlability': 'Crawlability',
    'local.verification': 'Verification',
    'competitor.gap': 'Gap',
    'social.platform': 'Platform',
    'paid.campaignType': 'Campaign',
    'commerce.stock': 'Stock',
    'content.freshness': 'Freshness',
    'ux.taskType': 'Task',
};

export default function CrawlerSubHeader() {
    const {
        stats, activeMacro, setActiveMacro,
        searchQuery, setSearchQuery,
        mode,
        activeViewType,
        pageFilter, toggleSelection, clearSelection,
    } = useSeoCrawler() as any;

    const [showAddFilter, setShowAddFilter] = useState(false);
    const addFilterRef = useRef<HTMLDivElement>(null);

    const activeModeDescriptor = React.useMemo(() => {
        try { return getMode(mode); } catch { return null; }
    }, [mode]);

    const availableFilters = React.useMemo(() => {
        if (!activeModeDescriptor) return [];
        return (activeModeDescriptor.lsSections || [])
            .filter((s: any) => s.kind === 'facet')
            .map((s: any) => ({ id: s.id, label: s.label, buckets: s.buckets || [] }));
    }, [activeModeDescriptor]);

    const activeChips = React.useMemo(() => {
        const chips: { key: string; field: string; label: string; value: string; rawValue: string }[] = [];
        const selections = pageFilter?.selections || {};
        for (const [key, values] of Object.entries(selections)) {
            if (!Array.isArray(values) || values.length === 0) continue;
            const fieldLabel = FILTER_LABELS[key] || key;
            for (const v of values) {
                let displayValue = v;
                for (const section of availableFilters) {
                    const bucket = section.buckets.find((b: any) => b.value === v);
                    if (bucket) { displayValue = bucket.label; break; }
                }
                chips.push({ key: `${key}__${v}`, field: key, label: fieldLabel, value: displayValue, rawValue: v });
            }
        }
        return chips;
    }, [pageFilter?.selections, availableFilters]);

    useEffect(() => {
        if (!showAddFilter) return;
        const handler = (e: MouseEvent) => {
            if (addFilterRef.current && !addFilterRef.current.contains(e.target as Node)) {
                setShowAddFilter(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [showAddFilter]);

    const isCompetitiveMode = activeViewType === 'competitor_matrix';

    const kpiMacros = React.useMemo(() => {
        if (isCompetitiveMode) return [];
        const M: { key: string; label: string; count: number; color: string }[] = [];
        if (mode === 'fullAudit' || mode === 'wqa') {
            M.push({ key: 'broken', label: 'Errors', count: stats.broken || 0, color: 'red' });
            M.push({ key: 'redirects', label: 'Redirects', count: stats.redirects || 0, color: 'orange' });
            M.push({ key: 'slow', label: 'Slow', count: stats.slowPages || 0, color: 'orange' });
            M.push({ key: 'noindex', label: 'Noindex', count: stats.nonIndexable || 0, color: 'yellow' });
        } else if (mode === 'technical') {
            M.push({ key: 'slow', label: 'Slow TTFB', count: stats.slowPages || 0, color: 'orange' });
            M.push({ key: 'errors', label: 'Server err', count: stats.serverErrors || 0, color: 'red' });
            M.push({ key: 'noindex', label: 'Blocked', count: stats.nonIndexable || 0, color: 'yellow' });
        } else if (mode === 'content') {
            M.push({ key: 'titles', label: 'No titles', count: stats.missingTitles || 0, color: 'amber' });
            M.push({ key: 'meta', label: 'Thin meta', count: stats.missingMetaDesc || 0, color: 'amber' });
        } else if (mode === 'linksAuthority') {
            M.push({ key: 'broken', label: 'Broken', count: stats.broken || 0, color: 'red' });
            M.push({ key: 'redirects', label: 'Redirects', count: stats.redirects || 0, color: 'orange' });
        } else if (mode === 'ai') {
            M.push({ key: 'noindex', label: 'Blocked', count: stats.nonIndexable || 0, color: 'red' });
            M.push({ key: 'meta', label: 'Uncited', count: stats.missingMetaDesc || 0, color: 'yellow' });
        } else {
            M.push({ key: 'broken', label: 'Errors', count: stats.broken || 0, color: 'red' });
            M.push({ key: 'slow', label: 'Slow', count: stats.slowPages || 0, color: 'orange' });
        }
        return M;
    }, [mode, stats, isCompetitiveMode]);

    const MACRO_COLORS: Record<string, { bg: string; fg: string; border: string }> = {
        red:    { bg: 'rgba(239,68,68,0.1)', fg: '#f87171', border: 'rgba(239,68,68,0.2)' },
        orange: { bg: 'rgba(249,115,22,0.1)', fg: '#fb923c', border: 'transparent' },
        yellow: { bg: 'rgba(234,179,8,0.1)', fg: '#facc15', border: 'transparent' },
        amber:  { bg: 'rgba(245,158,11,0.1)', fg: '#fbbf24', border: 'transparent' },
    };

    return (
        <div
            className="flex items-center justify-between shrink-0"
            style={{ height: 40, background: SURFACE.bg2, padding: `0 ${S[3]}px`, zIndex: 30 }}
        >
            {/* Left: Views | KPIs | Filters */}
            <div className="flex items-center min-w-0 flex-1" style={{ gap: S[2] }}>
                <ViewToolbar mode={mode} />

                {kpiMacros.length > 0 && (
                    <div className="flex items-center" style={{ gap: S[1], borderLeft: `1px solid ${SURFACE.br2}`, paddingLeft: S[2] }}>
                        {kpiMacros.map(m => {
                            const active = activeMacro === m.key;
                            const hasIssues = m.count > 0;
                            const colors = MACRO_COLORS[m.color];
                            return (
                                <button
                                    key={m.key}
                                    onClick={() => hasIssues && setActiveMacro(active ? null : m.key)}
                                    style={{
                                        padding: '2px 6px',
                                        borderRadius: R.sm,
                                        fontSize: 10,
                                        color: active ? colors.fg : hasIssues ? TEXT.secondary : TEXT.muted,
                                        background: active ? colors.bg : 'transparent',
                                        border: active ? `1px solid ${colors.border}` : '1px solid transparent',
                                        cursor: hasIssues ? 'pointer' : 'default',
                                        transition: 'all 0.1s',
                                    }}
                                >
                                    {m.label} <span style={{ opacity: hasIssues ? 0.6 : 0.4 }}>{m.count}</span>
                                </button>
                            );
                        })}
                    </div>
                )}

                {activeChips.length > 0 && (
                    <div className="flex items-center" style={{ gap: S[1], borderLeft: `1px solid ${SURFACE.br2}`, paddingLeft: S[2] }}>
                        {activeChips.map(chip => (
                            <span
                                key={chip.key}
                                className="inline-flex items-center"
                                style={{
                                    gap: 2,
                                    padding: '2px 6px',
                                    background: 'rgba(99,102,241,0.1)',
                                    border: '1px solid rgba(99,102,241,0.2)',
                                    borderRadius: R.sm,
                                    fontSize: 10,
                                    color: '#a5b4fc',
                                }}
                            >
                                <span style={{ color: TEXT.tertiary }}>{chip.label}:</span>
                                <span style={{ color: '#c7d2fe' }}>{chip.value}</span>
                                <button onClick={() => toggleSelection(chip.field, chip.rawValue)} className="ml-0.5" style={{ color: TEXT.tertiary }}>
                                    <X size={8} />
                                </button>
                            </span>
                        ))}
                        <button onClick={() => clearSelection()} style={{ fontSize: 10, color: TEXT.tertiary, marginLeft: 2 }}>
                            Clear
                        </button>
                    </div>
                )}
            </div>

            {/* Right: Add Filter + Search */}
            <div className="flex items-center shrink-0" style={{ gap: S[2] }}>
                <div ref={addFilterRef} className="relative">
                    <button
                        onClick={() => setShowAddFilter(!showAddFilter)}
                        className="flex items-center"
                        style={{
                            gap: 4,
                            padding: '2px 8px',
                            border: `1px solid ${SURFACE.br2}`,
                            borderRadius: R.sm,
                            fontSize: 10,
                            color: TEXT.tertiary,
                            transition: 'all 0.1s',
                        }}
                    >
                        <Plus size={10} /> Filter
                    </button>
                    {showAddFilter && availableFilters.length > 0 && (
                        <div
                            className="absolute right-0 top-full"
                            style={{
                                marginTop: 4,
                                width: 208,
                                background: SURFACE.bg2,
                                border: `1px solid ${SURFACE.br3}`,
                                borderRadius: R.lg,
                                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                                zIndex: 200,
                                padding: `${S[1]}px 0`,
                                maxHeight: 300,
                                overflowY: 'auto',
                            }}
                        >
                            {availableFilters.map((filter: any) => (
                                <div key={filter.id}>
                                    <div style={{ padding: '4px 8px', fontSize: 9, color: TEXT.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        {filter.label}
                                    </div>
                                    {filter.buckets.map((bucket: any) => {
                                        const isSelected = (pageFilter?.selections?.[filter.id] || []).includes(bucket.value);
                                        return (
                                            <button
                                                key={bucket.value}
                                                onClick={() => {
                                                    toggleSelection(filter.id, bucket.value);
                                                    setShowAddFilter(false);
                                                }}
                                                className="w-full flex items-center justify-between"
                                                style={{
                                                    padding: '4px 12px',
                                                    fontSize: 11,
                                                    color: isSelected ? '#a5b4fc' : TEXT.secondary,
                                                    background: isSelected ? 'rgba(99,102,241,0.1)' : 'transparent',
                                                    textAlign: 'left',
                                                    transition: 'all 0.1s',
                                                }}
                                                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = SURFACE.bg3; }}
                                                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                                            >
                                                <span>{bucket.label}</span>
                                                {isSelected && <span style={{ fontSize: 9, color: TEXT.tertiary }}>active</span>}
                                            </button>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="relative" style={{ width: 144 }}>
                    <Search className="absolute" style={{ left: 8, top: '50%', transform: 'translateY(-50%)', color: TEXT.muted }} size={10} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search (⌘F)"
                        style={{
                            width: '100%',
                            background: SURFACE.bg0,
                            border: `1px solid ${SURFACE.br3}`,
                            borderRadius: R.sm,
                            paddingLeft: 24,
                            paddingRight: 8,
                            paddingBlock: 4,
                            fontSize: 10,
                            color: TEXT.primary,
                            outline: 'none',
                            transition: 'border-color 0.1s',
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
