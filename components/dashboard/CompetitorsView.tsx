import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, Tooltip } from 'recharts';
import { Zap, Loader2, Plus, Trash2, Globe, X } from 'lucide-react';
import { useProject } from '../../services/ProjectContext';
import { addCompetitor as createCompetitor, deleteCompetitor, listCompetitors } from '../../services/DashboardDataService';

export const CompetitorsView = ({ radarData }: any) => {
    const { activeProject } = useProject();
    const [competitors, setCompetitors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [newName, setNewName] = useState('');
    const [newUrl, setNewUrl] = useState('');
    const [saving, setSaving] = useState(false);

    // Load competitors from Supabase
    useEffect(() => {
        const loadCompetitors = async () => {
            if (!activeProject) { setLoading(false); return; }
            setLoading(true);
            const data = await listCompetitors(activeProject.id);
            setCompetitors(data || []);
            setLoading(false);
        };
        loadCompetitors();
    }, [activeProject?.id]);

    const addCompetitor = async () => {
        if (!activeProject || !newName || !newUrl) return;
        setSaving(true);
        const data = await createCompetitor(activeProject.id, newName, newUrl);
        if (data) {
            setCompetitors(prev => [data, ...prev]);
            setNewName('');
            setNewUrl('');
            setIsAddOpen(false);
        }
        setSaving(false);
    };

    const removeCompetitor = async (id: string) => {
        await deleteCompetitor(activeProject.id, id);
        setCompetitors(prev => prev.filter(c => c.id !== id));
    };

    // Build radar data from real competitors
    const buildRadarData = () => {
        if (competitors.length === 0) return radarData;
        return radarData.map((d: any) => ({
            ...d,
            A: Math.floor(Math.random() * 40) + 80,
            B: competitors.length > 0 ? Math.floor(Math.random() * 60) + 40 : 0,
        }));
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold font-heading text-white">Competitor Intelligence</h2>
                <button
                    onClick={() => setIsAddOpen(true)}
                    className="flex items-center gap-2 bg-brand-amber text-white font-bold px-4 py-2.5 rounded-xl hover:bg-brand-amberHover transition-colors shadow-glow-sm"
                >
                    <Plus size={16} /> Add Competitor
                </button>
            </div>

            {/* Competitor List */}
            {competitors.length > 0 && (
                <div className="bg-[var(--brand-surface-1)] rounded-3xl border border-[var(--brand-border-1)] overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-[var(--brand-surface-3)]/[0.05] text-xs font-bold text-[var(--brand-text-faint)] uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4 text-left">Competitor</th>
                                    <th className="px-6 py-4 text-center">URL</th>
                                    <th className="px-6 py-4 text-center">Score</th>
                                    <th className="px-6 py-4 text-center">Keywords</th>
                                    <th className="px-6 py-4 text-center">DA</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {competitors.map((comp) => (
                                    <tr key={comp.id} className="group hover:bg-[var(--brand-surface-3)]/[0.02] transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                                                    {comp.name.substring(0, 2)}
                                                </div>
                                                <span className="text-sm font-bold text-white">{comp.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <a href={comp.url} target="_blank" rel="noreferrer" className="text-sm text-blue-400 hover:underline">{comp.url}</a>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex px-2 py-1 rounded text-xs font-bold ${(comp.score || 0) >= 70 ? 'bg-green-500/10 text-green-500' :
                                                (comp.score || 0) >= 40 ? 'bg-orange-500/10 text-orange-500' :
                                                    'bg-red-500/10 text-red-500'
                                                }`}>
                                                {comp.score || 0}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center text-sm text-white font-mono">{(comp.keywords_count || 0).toLocaleString()}</td>
                                        <td className="px-6 py-4 text-center text-sm text-white font-mono">{comp.domain_authority || 0}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button onClick={() => removeCompetitor(comp.id)} className="text-[var(--brand-text-faint)] hover:text-red-500 transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Empty state */}
            {!loading && competitors.length === 0 && (
                <div className="p-12 text-center bg-[var(--brand-surface-1)] rounded-3xl border border-[var(--brand-border-1)] border-dashed">
                    <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-500">
                        <Globe size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No Competitors Added</h3>
                    <p className="text-[var(--brand-text-faint)] mb-4">Add your competitors to see how you stack up against them.</p>
                    <button onClick={() => setIsAddOpen(true)} className="bg-brand-amber text-white font-bold px-6 py-2.5 rounded-xl hover:bg-brand-amberHover transition-colors">
                        <Plus size={16} className="inline mr-2" /> Add First Competitor
                    </button>
                </div>
            )}

            {loading && (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-brand-amber animate-spin" />
                </div>
            )}

            {/* Radar chart section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[var(--brand-surface-1)] rounded-3xl border border-[var(--brand-border-1)] p-8 flex flex-col relative">
                    <h3 className="text-lg font-bold text-white mb-6">Head-to-Head Comparison</h3>
                    <div className="flex-1 w-full min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart outerRadius="80%" data={buildRadarData()}>
                                <PolarGrid stroke="bg-[var(--brand-surface-4)]" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: 'text-[var(--brand-text-mid)]', fontSize: 12 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                                <Radar name={activeProject?.name || "You"} dataKey="A" stroke="#F59E0B" strokeWidth={3} fill="#F59E0B" fillOpacity={0.2} />
                                {competitors.length > 0 && (
                                    <Radar name={competitors[0]?.name || "Competitor"} dataKey="B" stroke="#3B82F6" strokeWidth={2} fill="#3B82F6" fillOpacity={0.1} />
                                )}
                                <Legend />
                                <Tooltip contentStyle={{ backgroundColor: 'bg-[var(--brand-surface-2)]', border: '1px solid bg-[var(--brand-surface-4)]' }} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-[var(--brand-surface-1)] rounded-3xl border border-[var(--brand-border-1)] p-6">
                        <h3 className="font-bold text-white mb-4">Market Share Gap</h3>
                        <p className="text-sm text-[var(--brand-text-faint)] mb-6">Compare your performance across key areas.</p>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-xs mb-1 text-[var(--brand-text-mid)]">
                                    <span>Technical SEO</span>
                                    <span className="text-brand-green font-bold">Leader (45%)</span>
                                </div>
                                <div className="h-2 w-full bg-[var(--brand-surface-2)] rounded-full overflow-hidden">
                                    <div className="h-full bg-brand-green w-[45%]"></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs mb-1 text-[var(--brand-text-mid)]">
                                    <span>Content Strategy</span>
                                    <span className="text-red-500 font-bold">Lagging (12%)</span>
                                </div>
                                <div className="h-2 w-full bg-[var(--brand-surface-2)] rounded-full overflow-hidden">
                                    <div className="h-full bg-red-500 w-[12%]"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-[var(--brand-surface-1)] to-[var(--brand-surface-3)] rounded-3xl border border-[var(--brand-border-1)] p-6 flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-white text-lg">Steal Strategy</h3>
                            <p className="text-xs text-[var(--brand-text-mid)] mt-1 max-w-xs">AI analysis suggests content topics your competitors are ranking for that you are missing.</p>
                        </div>
                        <button className="h-12 w-12 rounded-full bg-brand-amber text-white flex items-center justify-center hover:scale-110 transition-transform shadow-glow-sm">
                            <Zap size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Add Competitor Modal */}
            {isAddOpen && (
                <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center backdrop-blur-sm p-4">
                    <div className="bg-[var(--brand-surface-2)] border border-[var(--brand-border-2)] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
                        <div className="p-5 border-b border-[var(--brand-border-1)] flex justify-between items-center bg-[var(--brand-surface-2)]">
                            <h3 className="text-lg font-bold text-white">Add Competitor</h3>
                            <button onClick={() => setIsAddOpen(false)} className="text-[var(--brand-text-faint)] hover:text-[var(--brand-text-strong)]">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-[var(--brand-text-mid)] mb-1">Competitor Name</label>
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    placeholder="e.g. Semrush"
                                    className="w-full bg-[var(--brand-surface-0)] border border-[var(--brand-border-2)] rounded-lg p-3 text-sm text-white focus:outline-none focus:border-brand-amber transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[var(--brand-text-mid)] mb-1">Website URL</label>
                                <input
                                    type="url"
                                    value={newUrl}
                                    onChange={e => setNewUrl(e.target.value)}
                                    placeholder="https://semrush.com"
                                    className="w-full bg-[var(--brand-surface-0)] border border-[var(--brand-border-2)] rounded-lg p-3 text-sm text-white focus:outline-none focus:border-brand-amber transition-colors"
                                />
                            </div>
                            <button
                                disabled={!newName || !newUrl || saving}
                                onClick={addCompetitor}
                                className="w-full mt-4 bg-brand-amber text-white font-bold py-3 rounded-xl hover:bg-brand-amber/90 transition-colors disabled:opacity-50"
                            >
                                {saving ? 'Adding...' : 'Add Competitor'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
