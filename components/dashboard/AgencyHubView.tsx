import React, { useMemo } from 'react';
import { Target, MessageSquare, Check, Users } from 'lucide-react';
import { useProject } from '../../services/ProjectContext';

export const AgencyHubView = () => {
    const { projects } = useProject();

    const activeProjectCount = useMemo(() => {
        return projects ? projects.length : 0;
    }, [projects]);

    return (
        <div className="space-y-8">
            <div className="bg-gradient-to-r from-brand-amber/20 to-[#111] rounded-2xl border border-brand-amber/20 p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-brand-amber/10 blur-[100px] rounded-full pointer-events-none"></div>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-amber/10 border border-brand-amber/20 text-brand-amber text-xs font-bold uppercase tracking-wide mb-3">
                            <Target size={12} /> Scale Plan Active
                        </div>
                        <h1 className="text-3xl font-heading font-extrabold text-white mb-2">Agency Hub</h1>
                        <p className="text-gray-300 max-w-xl mb-4">Your dedicated team is working on your growth. Track deliverables, usage, and strategy here.</p>

                        <div className="flex items-center gap-6 text-sm text-gray-400">
                            <div className="flex items-center gap-2">
                                <Users size={16} className="text-gray-500" />
                                <span><strong className="text-white">{activeProjectCount}</strong> Active Projects</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden md:block">
                            <p className="text-sm font-bold text-white">Sarah Jenkins</p>
                            <p className="text-xs text-gray-500">Account Manager</p>
                        </div>
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah" className="w-12 h-12 rounded-full border-2 border-brand-card bg-white" alt="AM" />
                        <button className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:bg-gray-200 transition-colors shadow-glow-sm">
                            <MessageSquare size={18} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#0F0F0F] rounded-2xl border border-white/5 p-6">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-4">Hours Used (This Month)</h3>
                    <div className="flex items-end gap-2 mb-2">
                        <span className="text-4xl font-bold text-white font-heading">12.5</span>
                        <span className="text-sm text-gray-500 mb-1">/ 20 hrs</span>
                    </div>
                    <div className="w-full h-2 bg-[#222] rounded-full overflow-hidden mb-4">
                        <div className="h-full bg-brand-amber shadow-[0_0_10px_rgba(245,158,11,0.5)]" style={{ width: '62%' }}></div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Content Writing</span>
                            <span className="text-white">6.0 hrs</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Technical Fixes</span>
                            <span className="text-white">4.5 hrs</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Strategy Calls</span>
                            <span className="text-white">2.0 hrs</span>
                        </div>
                    </div>
                </div>

                <div className="bg-[#0F0F0F] rounded-2xl border border-white/5 p-6 md:col-span-2">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-4">Current Sprint Deliverables</h3>
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                            <div className="w-5 h-5 rounded-full border-2 border-brand-green bg-brand-green/20 flex items-center justify-center">
                                <Check size={12} className="text-brand-green" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-bold text-white line-through text-opacity-50">Competitor Gap Analysis</p>
                            </div>
                            <span className="text-xs font-bold text-brand-green bg-brand-green/10 px-2 py-1 rounded">Completed</span>
                        </div>
                        <div className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                            <div className="w-5 h-5 rounded-full border-2 border-orange-500 bg-transparent"></div>
                            <div className="flex-1">
                                <p className="text-sm font-bold text-white">3 Blog Posts for "AI Marketing"</p>
                            </div>
                            <span className="text-xs font-bold text-orange-500 bg-orange-500/10 px-2 py-1 rounded">In Progress</span>
                        </div>
                        <div className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                            <div className="w-5 h-5 rounded-full border-2 border-gray-600 bg-transparent"></div>
                            <div className="flex-1">
                                <p className="text-sm font-bold text-white">Technical Audit Implementation</p>
                            </div>
                            <span className="text-xs font-bold text-gray-500 bg-white/5 px-2 py-1 rounded">Scheduled</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-[#0F0F0F] rounded-2xl border border-white/5 p-6">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-6">Upcoming Strategy</h3>
                <div className="flex flex-col md:flex-row gap-6 relative">
                    <div className="absolute top-8 left-0 w-full h-0.5 bg-white/10 hidden md:block z-0"></div>

                    {[1, 2, 3].map((step) => (
                        <div key={step} className="flex-1 relative z-10">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mb-4 border-4 border-brand-card ${step === 1 ? 'bg-white text-black' : 'bg-[#222] text-gray-500'}`}>
                                {step}
                            </div>
                            <h4 className="text-white font-bold mb-1">
                                {step === 1 ? 'Foundation' : step === 2 ? 'Growth' : 'Scale'}
                            </h4>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                {step === 1 ? 'Fixing technical errors and establishing baseline content.' : step === 2 ? 'Aggressive content expansion and link velocity.' : 'Market dominance and brand authority.'}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
