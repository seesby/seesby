import React, { Suspense, useMemo } from 'react';
import { X } from 'lucide-react';
import { useSeoCrawler } from '../../../contexts/SeoCrawlerContext';
import { getInspectorTabsFor, getTabComponent } from './InspectorRegistry';
import { useHasTrend } from '../right-sidebar/_hooks/useSessionsCount';

export default function FullDetailDrawer({
    page,
    open,
    onClose
}: {
    page: any | null;
    open: boolean;
    onClose: () => void;
}) {
    const { mode } = useSeoCrawler();
    const hasTrend = useHasTrend();
    const tabs = useMemo(() => getInspectorTabsFor(mode), [mode]);

    if (!open || !page) return null;

    return (
        <div className="fixed inset-0 z-[80] flex justify-end">
            <div className="absolute inset-0 bg-black/55" onClick={onClose} />
            <aside className="relative h-full w-full max-w-[560px] bg-[#0d0d0d] border-l border-[#2a2a2a] shadow-2xl flex flex-col">
                <div className="h-[52px] border-b border-[#222] px-3 flex items-center justify-between shrink-0 bg-[#111]">
                    <div className="min-w-0">
                        <div className="text-[11px] text-[#F59E0B] uppercase tracking-widest font-bold">Full Page Inspector</div>
                        <div className="text-[11px] text-blue-400 font-mono truncate">{page.url}</div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-[#888] hover:text-white p-1.5 rounded hover:bg-[#222] transition-colors"
                        title="Close drawer"
                    >
                        <X size={15} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-8">
                    {tabs.map(({ id, label }) => {
                        const TabComponent = getTabComponent(mode, id);
                        return (
                            <section key={id} id={`drawer-${id}`} className="border border-[#222] rounded-lg bg-[#111] overflow-hidden">
                                <div className="px-3 py-2 border-b border-[#222] text-[11px] font-black uppercase tracking-widest text-[#bbb] bg-[#141414]">
                                    {label}
                                </div>
                                <div className="p-3">
                                    {TabComponent ? (
                                        <Suspense fallback={<div className="text-[#666] text-[12px] italic p-2">Loading...</div>}>
                                            <TabComponent page={page} hasTrend={hasTrend} />
                                        </Suspense>
                                    ) : (
                                        <div className="text-[#666] text-[12px] italic p-2">Not available</div>
                                    )}
                                </div>
                            </section>
                        );
                    })}
                </div>
            </aside>
        </div>
    );
}
