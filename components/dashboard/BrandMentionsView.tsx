import React, { useState, useEffect } from 'react';
import { Link as LinkIcon, Loader2, Globe, Bell } from 'lucide-react';
import { useProject } from '../../services/ProjectContext';
import { listBrandMentions, seedBrandMentions } from '../../services/DashboardDataService';

export const BrandMentionsView = () => {
    const { activeProject } = useProject();
    const [mentions, setMentions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadMentions = async () => {
            if (!activeProject) { setLoading(false); return; }
            setLoading(true);
            const data = await seedBrandMentions(activeProject.id, activeProject.name);
            const sorted = await listBrandMentions(activeProject.id);
            setMentions(sorted.length > 0 ? sorted : data || []);
            setLoading(false);
        };
        loadMentions();
    }, [activeProject?.id]);

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="animate-spin text-brand-amber" size={32} />
            </div>
        );
    }

    if (mentions.length === 0) {
        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                <h2 className="text-2xl font-bold font-heading text-white">Brand Mentions</h2>
                <div className="p-12 text-center bg-[var(--brand-surface-1)]] rounded-3xl border border-[var(--brand-border-1)] border-dashed">
                    <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-purple-500">
                        <Bell size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No Mentions Found Yet</h3>
                    <p className="text-[var(--brand-text-faint)] max-w-md mx-auto">Once your brand gets mentioned across the web, they'll show up here. We check news sites, blogs, forums, and social media.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <h2 className="text-2xl font-bold font-heading text-white">Brand Mentions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {mentions.map((m: any) => (
                    <div key={m.id} className="bg-[var(--brand-surface-1)]] rounded-2xl border border-[var(--brand-border-1)] p-5 flex flex-col hover:border-[var(--brand-border-2)] transition-all">
                        <div className="flex justify-between items-start mb-3">
                            <span className="text-xs font-bold text-[var(--brand-text-faint)] uppercase tracking-wide">{m.type}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${m.sentiment === 'positive' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                    m.sentiment === 'negative' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                        'bg-gray-500/10 text-[var(--brand-text-faint)] border-gray-500/20'
                                }`}>{m.sentiment}</span>
                        </div>
                        <p className="text-sm text-[var(--brand-text-mid)] mb-4 line-clamp-3 leading-relaxed flex-1">"{m.text}"</p>
                        <div className="flex justify-between items-center pt-4 border-t border-[var(--brand-border-1)]">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-white">{m.source}</span>
                                <span className="text-[10px] text-[var(--brand-text-muted)]">{new Date(m.detected_at).toLocaleDateString()}</span>
                            </div>
                            {m.is_linkable && (
                                <button className="text-[10px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1">
                                    <LinkIcon size={10} /> Claim Link
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
