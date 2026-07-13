import React, { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown, Search, Plus, Loader2, RefreshCw } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { useProject } from '../../services/ProjectContext';
import { addKeyword, listKeywords, listRankHistory, refreshKeywordRanks } from '../../services/DashboardDataService';

type Keyword = {
    id: string;
    keyword: string;
    intent: 'Informational' | 'Commercial' | 'Transactional' | 'Navigational' | null;
    volume: number | null;
    kd: number | null; // Using kd to map to cpc or keeping it generic for now
    position: number | null;
    change: number | null;
    created_at: string;
};

export const RankTrackerView = () => {
    const { activeProject } = useProject();
    const [keywords, setKeywords] = useState<Keyword[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [newKeyword, setNewKeyword] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [rankHistories, setRankHistories] = useState<Record<string, any[]>>({});

    useEffect(() => {
        if (activeProject) {
            fetchKeywords();
        } else {
            setKeywords([]);
            setLoading(false);
        }
    }, [activeProject]);

    const fetchKeywords = async () => {
        setLoading(true);
        try {
            const data = await listKeywords(activeProject!.id);
            const formattedData = (data || []).map(kw => ({
                ...kw,
                kd: kw.kd ?? 45,
                google: true,
                gpt: true,
                perplexity: true,
            }));
            setKeywords(formattedData as any);
        } catch (error) {
            console.error('Error fetching keywords:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadRankHistories = async () => {
        if (!activeProject) return;
        const kws = await listKeywords(activeProject.id);
        const histories: Record<string, any[]> = {};
        for (const kw of kws) {
            const data = await listRankHistory(activeProject.id, kw.id);
            if (data && data.length > 0) {
                histories[kw.id] = data.map(d => ({ pos: d.position }));
            }
        }
        setRankHistories(histories);
    };

    useEffect(() => {
        if (keywords.length > 0) loadRankHistories();
    }, [keywords]);

    const refreshRanks = async () => {
        if (!activeProject) return;
        setIsRefreshing(true);
        try {
            await refreshKeywordRanks(activeProject.id);
            await fetchKeywords();
        } catch (err) {
            console.error('Error refreshing ranks:', err);
        }
        setIsRefreshing(false);
    };

    const handleAddKeyword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newKeyword.trim() || !activeProject) return;

        try {
            await addKeyword(activeProject.id, newKeyword.trim());
            setIsAdding(false);
            setNewKeyword('');
            fetchKeywords(); // Refresh the list
        } catch (error) {
            console.error('Error adding keyword:', error);
        }
    };

    if (!activeProject) {
        return (
            <div className="flex flex-col items-center justify-center h-96 text-[var(--brand-text-faint)]">
                <Search size={48} className="mb-4 opacity-50" />
                <h3 className="text-xl font-bold text-white mb-2">No Project Selected</h3>
                <p className="text-sm">Please select or create a project to view keyword rankings.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold font-heading text-white">Rank Tracker</h2>
                    <p className="text-[var(--brand-text-mid)] text-sm mt-1">Monitoring {keywords.length} keywords for {activeProject.name}.</p>
                </div>
                {!isAdding ? (
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsAdding(true)}
                            className="bg-brand-amber hover:bg-brand-amberHover text-white px-4 py-2 rounded-xl text-sm font-bold shadow-glow-sm transition-colors flex items-center gap-2"
                        >
                            <Plus size={16} /> Add Keyword
                        </button>
                        <button
                            onClick={refreshRanks}
                            disabled={isRefreshing}
                            className="bg-[var(--brand-surface-3)] hover:bg-[var(--brand-surface-4)] border border-[var(--brand-border-2)] text-[var(--brand-text-mid)] px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
                            {isRefreshing ? 'Refreshing...' : 'Refresh Rankings'}
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleAddKeyword} className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Enter keyword..."
                            value={newKeyword}
                            onChange={(e) => setNewKeyword(e.target.value)}
                            className="bg-[var(--brand-surface-3)] border border-[var(--brand-border-2)] rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-amber w-64"
                            autoFocus
                        />
                        <button type="submit" className="bg-brand-amber hover:bg-brand-amberHover text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors">
                            Save
                        </button>
                        <button type="button" onClick={() => setIsAdding(false)} className="bg-[var(--brand-surface-3)] hover:bg-[var(--brand-surface-4)] text-[var(--brand-text-mid)] px-4 py-2 rounded-xl text-sm font-bold transition-colors">
                            Cancel
                        </button>
                    </form>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin text-brand-amber" size={32} />
                </div>
            ) : keywords.length === 0 ? (
                <div className="bg-[var(--brand-surface-1)]] rounded-3xl border border-[var(--brand-border-1)] p-12 text-center text-[var(--brand-text-faint)]">
                    <Search size={48} className="mx-auto mb-4 opacity-20" />
                    <h3 className="text-lg font-bold text-white mb-2">No Keywords Tracked</h3>
                    <p className="text-sm mb-6">Add your first keyword to start tracking rankings.</p>
                    <button
                        onClick={() => setIsAdding(true)}
                        className="bg-[var(--brand-surface-3)] hover:bg-[var(--brand-surface-4)] border border-[var(--brand-border-2)] text-white px-6 py-2 rounded-xl text-sm font-bold transition-colors inline-block"
                    >
                        Add Keyword
                    </button>
                </div>
            ) : (
                <div className="bg-[var(--brand-surface-1)]] rounded-3xl border border-[var(--brand-border-1)] overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-[var(--brand-border-1)] text-xs font-bold text-[var(--brand-text-faint)] uppercase tracking-wider bg-[var(--brand-surface-3)]/[0.02]">
                                    <th className="p-4 pl-6">Keyword</th>
                                    <th className="p-4">Intent</th>
                                    <th className="p-4 text-center">Volume</th>
                                    <th className="p-4 text-center">KD%</th>
                                    <th className="p-4 text-center">Pos</th>
                                    <th className="p-4 text-center">Trend</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {keywords.map((kw: any) => (
                                    <tr key={kw.id} className="group hover:bg-[var(--brand-surface-3)]/[0.02] transition-colors">
                                        <td className="p-4 pl-6">
                                            <span className="font-bold text-[var(--brand-text-mid)] block">{kw.keyword}</span>
                                        </td>
                                        <td className="p-4">
                                            {kw.intent && (
                                                <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded border ${kw.intent === 'Commercial' || kw.intent === 'Transactional' ? 'bg-brand-green/10 text-brand-green border-brand-green/20' :
                                                    'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                                    }`}>
                                                    {kw.intent}
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-center text-sm text-[var(--brand-text-mid)] font-mono">{kw.volume}</td>
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="w-16 h-1.5 bg-[var(--brand-border-2)]] rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full ${kw.kd > 60 ? 'bg-red-500' : kw.kd > 40 ? 'bg-orange-500' : 'bg-brand-green'}`} style={{ width: `${kw.kd}%` }}></div>
                                                </div>
                                                <span className="text-xs text-[var(--brand-text-faint)] w-6">{kw.kd}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className={`text-lg font-bold font-heading ${kw.position !== null && kw.position <= 3 ? 'text-brand-green' : 'text-white'}`}>{kw.position || '-'}</span>
                                                {kw.change !== 0 && kw.change !== null && (
                                                    <span className={`text-[10px] font-bold flex items-center ${kw.change > 0 ? 'text-brand-green' : 'text-red-500'}`}>
                                                        {kw.change > 0 ? <ArrowUp size={8} /> : <ArrowDown size={8} />} {Math.abs(kw.change)}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            {rankHistories[kw.id] && rankHistories[kw.id].length > 1 ? (
                                                <div className="w-20 h-8 mx-auto">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <LineChart data={rankHistories[kw.id]}>
                                                            <Line
                                                                type="monotone"
                                                                dataKey="pos"
                                                                stroke={kw.change >= 0 ? '#2DD4BF' : '#EF4444'}
                                                                strokeWidth={1.5}
                                                                dot={false}
                                                            />
                                                        </LineChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            ) : (
                                                <span className="text-[10px] text-[var(--brand-text-muted)]">No data</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};
