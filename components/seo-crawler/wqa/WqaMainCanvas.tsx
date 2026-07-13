import React from 'react';
import { useSeoCrawler } from '../../../contexts/SeoCrawlerContext';
import WqaViewRouter     from './views/WqaViewRouter';
import EmptyViewState    from './views/shared/EmptyViewState';

export default function WqaMainCanvas() {
    const { pages } = useSeoCrawler() as any;

    if (!pages || pages.length === 0) {
        return (
            <EmptyViewState
                title="No crawl data yet"
                subtitle="Start a crawl from the header to populate this view."
            />
        );
    }

    return (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <React.Suspense fallback={<div className="p-12 text-[var(--brand-border-2)] text-[12px] font-mono animate-pulse text-center">Loading view engine...</div>}>
                <WqaViewRouter />
            </React.Suspense>
        </div>
    );
}
