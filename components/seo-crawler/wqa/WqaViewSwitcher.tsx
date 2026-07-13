import React, { useEffect } from 'react';
import { LayoutGrid, Network, BarChart3 } from 'lucide-react';
import { useSeoCrawler } from '../../../contexts/SeoCrawlerContext';
import { WqaViewMode } from '../../../services/WebsiteQualityModeTypes';

const VIEWS: Array<{ id: WqaViewMode; label: string; Icon: React.ElementType; shortcut: string }> = [
    { id: 'grid',    label: 'Grid',    Icon: LayoutGrid, shortcut: '1' },
    { id: 'map',     label: 'Map',     Icon: Network,    shortcut: '2' },
    { id: 'reports', label: 'Reports', Icon: BarChart3,  shortcut: '3' },
];

export default function WqaViewSwitcher() {
    const { wqaState, setWqaViewMode } = useSeoCrawler() as any;
    const current = (wqaState?.viewMode || 'grid') as WqaViewMode;

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLElement && ['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
            if (e.metaKey || e.ctrlKey || e.altKey) return;
            const match = VIEWS.find((v) => v.shortcut === e.key);
            if (match) setWqaViewMode(match.id);
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [setWqaViewMode]);

    return (
        <div className="flex items-center bg-[var(--brand-surface-0)]] rounded-md border border-[var(--brand-surface-3)]] p-0.5 gap-0.5">
            {VIEWS.map(({ id, label, Icon, shortcut }) => {
                const active = current === id;
                return (
                    <button
                        key={id}
                        onClick={() => setWqaViewMode(id)}
                        title={`${label} (${shortcut})`}
                        className={`group relative px-2.5 h-[26px] text-[11px] font-medium rounded flex items-center gap-1.5 transition-colors ${
                            active
                                ? 'bg-[var(--brand-surface-3)]] text-[var(--brand-text-strong)]'
                                : 'text-[var(--brand-text-mid)]] hover:text-[var(--brand-text-mid)]] hover:bg-[var(--brand-surface-2)]]'
                        }`}
                    >
                        <Icon size={12} className={active ? 'text-[#F59E0B]' : ''} />
                        <span>{label}</span>
                    </button>
                );
            })}
        </div>
    );
}
