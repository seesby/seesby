import React, { useState, useEffect } from 'react';
import { Zap, ArrowRight, Plus, Trash2, Loader2, X, Workflow } from 'lucide-react';
import { useProject } from '../../services/ProjectContext';
import { addAutomationRule, deleteAutomationRule, listAutomationRules, updateAutomationRule } from '../../services/DashboardDataService';

export const AutomationView = () => {
    const { activeProject } = useProject();
    const [rules, setRules] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [newName, setNewName] = useState('');
    const [newTrigger, setNewTrigger] = useState('');
    const [newAction, setNewAction] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const loadRules = async () => {
            if (!activeProject) { setLoading(false); return; }
            setLoading(true);
            const data = await listAutomationRules(activeProject.id);
            setRules(data || []);
            setLoading(false);
        };
        loadRules();
    }, [activeProject?.id]);

    const addRule = async () => {
        if (!activeProject || !newName || !newTrigger || !newAction) return;
        setSaving(true);
        const data = await addAutomationRule(activeProject.id, {
            name: newName,
            trigger_condition: newTrigger,
            action: newAction
        });
        if (data) {
            setRules(prev => [data, ...prev]);
            setNewName(''); setNewTrigger(''); setNewAction('');
            setIsAddOpen(false);
        }
        setSaving(false);
    };

    const toggleRule = async (id: string, currentState: boolean) => {
        await updateAutomationRule(activeProject.id, id, { is_active: !currentState });
        setRules(prev => prev.map(r => r.id === id ? { ...r, is_active: !currentState } : r));
    };

    const deleteRule = async (id: string) => {
        await deleteAutomationRule(activeProject.id, id);
        setRules(prev => prev.filter(r => r.id !== id));
    };

    if (loading) {
        return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-brand-amber" size={32} /></div>;
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold font-heading text-white">Automation Rules</h2>
                <button onClick={() => setIsAddOpen(true)} className="bg-[var(--brand-surface-3)] text-black px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors flex items-center gap-2">
                    <Plus size={16} /> New Rule
                </button>
            </div>

            {rules.length === 0 ? (
                <div className="p-12 text-center bg-[var(--brand-surface-1)] rounded-3xl border border-[var(--brand-border-1)] border-dashed">
                    <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-yellow-500">
                        <Workflow size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No Automation Rules</h3>
                    <p className="text-[var(--brand-text-faint)] mb-4 max-w-md mx-auto">Set up rules to get notified or take action automatically when something changes in your SEO data.</p>
                    <button onClick={() => setIsAddOpen(true)} className="bg-[var(--brand-surface-3)] hover:bg-[var(--brand-surface-4)] border border-[var(--brand-border-2)] text-white px-6 py-2 rounded-xl text-sm font-bold transition-colors">
                        Create Your First Rule
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {rules.map((rule) => (
                        <div key={rule.id} className="bg-[var(--brand-surface-1)] rounded-2xl border border-[var(--brand-border-1)] p-6 flex items-center justify-between group hover:border-[var(--brand-border-2)] transition-all">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${rule.is_active ? 'bg-brand-green/10 text-brand-green' : 'bg-gray-800 text-[var(--brand-text-faint)]'}`}>
                                    <Zap size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white">{rule.name}</h3>
                                    <div className="flex items-center gap-2 mt-1 text-xs text-[var(--brand-text-mid)]">
                                        <span>If: <strong className="text-[var(--brand-text-mid)]">{rule.trigger_condition}</strong></span>
                                        <ArrowRight size={10} />
                                        <span>Then: <strong className="text-[var(--brand-text-mid)]">{rule.action}</strong></span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <button onClick={() => deleteRule(rule.id)} className="text-[var(--brand-text-muted)] hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                    <Trash2 size={16} />
                                </button>
                                <span className={`text-xs font-bold uppercase ${rule.is_active ? 'text-brand-green' : 'text-[var(--brand-text-faint)]'}`}>
                                    {rule.is_active ? 'Active' : 'Paused'}
                                </span>
                                <div
                                    onClick={() => toggleRule(rule.id, rule.is_active)}
                                    className={`w-10 h-6 rounded-full p-1 transition-colors cursor-pointer ${rule.is_active ? 'bg-brand-green' : 'bg-gray-700'}`}
                                >
                                    <div className={`w-4 h-4 bg-[var(--brand-surface-3)] rounded-full transition-transform ${rule.is_active ? 'translate-x-4' : ''}`}></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Rule Modal */}
            {isAddOpen && (
                <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center backdrop-blur-sm p-4">
                    <div className="bg-[var(--brand-surface-2)] border border-[var(--brand-border-2)] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
                        <div className="p-5 border-b border-[var(--brand-border-1)] flex justify-between items-center bg-[var(--brand-surface-2)]">
                            <h3 className="text-lg font-bold text-white">New Automation Rule</h3>
                            <button onClick={() => setIsAddOpen(false)} className="text-[var(--brand-text-faint)] hover:text-[var(--brand-text-strong)]"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-[var(--brand-text-mid)] mb-1">Rule Name</label>
                                <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Rank Drop Alert"
                                    className="w-full bg-[var(--brand-surface-0)] border border-[var(--brand-border-2)] rounded-lg p-3 text-sm text-white focus:outline-none focus:border-brand-amber transition-colors" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[var(--brand-text-mid)] mb-1">Trigger (If...)</label>
                                <input type="text" value={newTrigger} onChange={e => setNewTrigger(e.target.value)} placeholder="e.g. Keyword drops below position 10"
                                    className="w-full bg-[var(--brand-surface-0)] border border-[var(--brand-border-2)] rounded-lg p-3 text-sm text-white focus:outline-none focus:border-brand-amber transition-colors" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[var(--brand-text-mid)] mb-1">Action (Then...)</label>
                                <input type="text" value={newAction} onChange={e => setNewAction(e.target.value)} placeholder="e.g. Send email notification"
                                    className="w-full bg-[var(--brand-surface-0)] border border-[var(--brand-border-2)] rounded-lg p-3 text-sm text-white focus:outline-none focus:border-brand-amber transition-colors" />
                            </div>
                            <button disabled={!newName || !newTrigger || !newAction || saving} onClick={addRule}
                                className="w-full mt-4 bg-brand-amber text-white font-bold py-3 rounded-xl hover:bg-brand-amber/90 transition-colors disabled:opacity-50">
                                {saving ? 'Creating...' : 'Create Rule'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
