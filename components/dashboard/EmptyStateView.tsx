import React from 'react';

export const EmptyStateView = ({ title, icon, desc }: {title: string, icon: any, desc: string}) => (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8 bg-[var(--brand-surface-1)]] rounded-3xl border border-[var(--brand-border-1)] border-dashed">
        <div className="p-6 rounded-full bg-[var(--brand-surface-3)] text-[var(--brand-text-faint)] mb-6">
            {icon}
        </div>
        <h2 className="text-2xl font-bold font-heading text-white mb-2">{title}</h2>
        <p className="text-[var(--brand-text-faint)] max-w-md mb-8">{desc}</p>
        <button className="px-6 py-3 bg-[var(--brand-surface-3)] text-black font-bold rounded-xl hover:bg-gray-200 transition-colors">
            Setup Now
        </button>
    </div>
);
