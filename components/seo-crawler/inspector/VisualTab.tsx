import React from 'react';

export default function VisualTab({ page }: { page: any }) {
    if (!page.screenshotUrl) {
        return (
            <div className="p-4 text-[12px] text-[var(--brand-text-mid)]] text-center">
                No screenshot captured for this page. Ensure Visual Regression is enabled in settings.
            </div>
        );
    }

    return (
        <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-[12px] font-bold text-[var(--brand-text-strong)] uppercase tracking-wider">Page Screenshot</h3>
                {page.visualChangeDetected && (
                    <span className="bg-red-500/20 text-red-400 px-2 py-1 text-[10px] rounded uppercase font-bold tracking-widest">
                        Visual Change Detected
                    </span>
                )}
            </div>
            
            <div className="border border-[var(--brand-surface-4)]] rounded-lg overflow-hidden bg-[var(--brand-surface-2)]]">
                <img 
                    src={page.screenshotUrl} 
                    alt={`Screenshot of ${page.url}`} 
                    className="w-full h-auto object-top" 
                />
            </div>
        </div>
    );
}
