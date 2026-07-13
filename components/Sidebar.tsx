import React, { useState, useRef, useEffect } from 'react';
import {
    ChevronLeft, ChevronDown, Plus, LayoutDashboard, Search, Sparkles,
    Globe, Target, Share2, Activity, Lightbulb, Briefcase, BellRing,
    Settings, Users, Trash2, X, LogOut, CheckSquare
} from 'lucide-react';
import { ViewType } from '../types';
import { useProject } from '../services/ProjectContext';
import { IndustryType } from '../services/app-types';
import { useAuth } from '../services/AuthContext';
import { useNavigate } from 'react-router-dom';
import { BeeMark } from './BeeMark';

interface SidebarProps {
    currentView: ViewType;
    setCurrentView: (view: ViewType) => void;
}

// Custom Logo Component
const SeesbyLogo = ({ collapsed }: { collapsed?: boolean }) => (
    <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
        <BeeMark size={32} glow />
        {!collapsed && (
            <div className="flex flex-col justify-center transition-opacity duration-300">
                <span className="text-[var(--brand-text-strong)] font-extrabold text-lg tracking-wider uppercase font-heading">Seesby</span>
            </div>
        )}
    </div>
);

const SidebarItem = ({ icon, label, active, onClick, hasNotification, badge, collapsed, indent }: any) => {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative ${active
                ? 'bg-[var(--brand-surface-3)] text-[var(--brand-text-strong)] shadow-glow-sm border border-[var(--brand-border-1)]'
                : 'text-[var(--brand-text-mid)] hover:text-[var(--brand-text-strong)] hover:bg-[var(--brand-surface-3)] border border-transparent'
                } ${collapsed ? 'justify-center px-2' : ''} ${indent ? 'pl-8' : ''}`}
            title={collapsed ? label : undefined}
        >
            <div className={`transition-transform duration-200 ${active ? 'scale-110 text-brand-amber' : 'group-hover:scale-110'}`}>
                {icon}
            </div>
            {!collapsed && (
                <span className={`text-sm font-medium ${active ? 'text-[var(--brand-text-strong)]' : ''} truncate`}>
                    {label}
                </span>
            )}
            {hasNotification && (
                <div className={`absolute w-2 h-2 rounded-full bg-brand-amber border-2 border-[var(--brand-surface-0)] ${collapsed ? 'top-2 right-2' : 'right-3 top-1/2 -translate-y-1/2'}`}></div>
            )}
            {badge && !collapsed && (
                <span className={`ml-auto text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${active ? 'bg-[var(--brand-surface-4)] text-[var(--brand-text-strong)]' : 'bg-brand-amber/10 text-brand-amber'
                    }`}>
                    {badge}
                </span>
            )}
        </button>
    );
};

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView }) => {
    const { projects, activeProject, switchProject, addProject, isCollapsed, setIsCollapsed } = useProject();
    const { user, profile, signOut } = useAuth();
    const navigate = useNavigate();
    const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectUrl, setNewProjectUrl] = useState('');
    const [newProjectIndustry, setNewProjectIndustry] = useState<IndustryType>('saas');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const projectMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (projectMenuRef.current && !projectMenuRef.current.contains(event.target as Node)) {
                setIsProjectMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <aside
            className={`${isCollapsed ? 'w-[80px]' : 'w-[260px]'} relative shrink-0 hidden lg:flex flex-col border-r border-[var(--border-subtle)] bg-[var(--brand-sidebar)] z-40 transition-all duration-300 ease-in-out`}
        >
            {/* Collapse Toggle */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute -right-3 top-[26px] w-6 h-6 bg-[var(--brand-surface-3)] border border-[var(--brand-border-2)] rounded-full flex items-center justify-center text-[var(--brand-text-mid)] hover:text-[var(--brand-text-strong)] hover:border-brand-amber transition-all z-50 cursor-pointer shadow-lg group"
            >
                <ChevronLeft size={12} className={`transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''} group-hover:scale-110`} />
            </button>

            {/* A. Workspace / Project Switcher (Top of Sidebar) */}
            <div className={`pt-4 pb-2 flex flex-col gap-2 ${isCollapsed ? 'px-2 items-center' : 'px-4'}`}>
                {/* Logo Area */}
                <div className={`h-10 flex items-center ${isCollapsed ? 'justify-center' : ''}`}>
                    <SeesbyLogo collapsed={isCollapsed} />
                </div>

                {/* Project Select */}
                <div className="relative mt-2" ref={projectMenuRef}>
                    <button
                        onClick={() => !isCollapsed && setIsProjectMenuOpen(!isProjectMenuOpen)}
                        className={`w-full flex items-center gap-3 bg-[var(--brand-surface-2)] border border-[var(--brand-border-2)] rounded-xl hover:border-[var(--brand-border-3)] hover:bg-[var(--brand-surface-3)] transition-all group ${isCollapsed ? 'p-2 justify-center h-12' : 'p-3'
                            }`}
                    >
                        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-[10px] font-bold text-[var(--brand-text-strong)] shadow-lg shrink-0 uppercase">
                            {activeProject ? activeProject.name.substring(0, 2) : '?'}
                        </div>
                        {!isCollapsed && (
                            <div className="flex-1 text-left min-w-0">
                                <p className="text-xs font-bold text-[var(--brand-text-strong)] truncate">{activeProject ? activeProject.name : 'No Project'}</p>
                                <p className="text-[10px] text-[var(--brand-text-mid)] truncate">{activeProject ? activeProject.url : 'Add to start'}</p>
                            </div>
                        )}
                        {!isCollapsed && <ChevronDown size={14} className="text-[var(--brand-text-mid)] group-hover:text-[var(--brand-text-strong)] transition-colors" />}
                    </button>

                    {/* Project Dropdown */}
                    {isProjectMenuOpen && !isCollapsed && (
                        <div className="absolute top-full left-0 w-full mt-2 bg-[var(--brand-surface-3)] border border-[var(--brand-border-2)] rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            <div className="p-2 border-b border-[var(--brand-border-1)]">
                                <input type="text" placeholder="Find project..." className="w-full bg-black/30 text-xs text-[var(--brand-text-strong)] p-2 rounded-lg border border-[var(--brand-border-1)] focus:outline-none focus:border-brand-amber/50" />
                            </div>
                            <div className="max-h-48 overflow-y-auto scrollbar-thin">
                                {projects.map((p) => (
                                    <button
                                        key={p.id}
                                        onClick={() => { 
                                            navigate(`/project/${p.id}/dashboard?view=${currentView}`);
                                            setIsProjectMenuOpen(false); 
                                        }}
                                        className={`w-full flex items-center gap-3 p-2 hover:bg-[var(--brand-surface-3)] transition-colors ${activeProject?.id === p.id ? 'bg-[var(--brand-surface-3)]' : ''}`}
                                    >
                                        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-brand-amber to-orange-500 flex items-center justify-center text-[10px] font-bold text-[var(--brand-text-strong)] uppercase">
                                            {p.name.substring(0, 2)}
                                        </div>
                                        <div className="text-left">
                                            <p className="text-xs font-bold text-[var(--brand-text-strong)]">{p.name}</p>
                                            <p className="text-[10px] text-[var(--brand-text-mid)]">{p.url}</p>
                                        </div>
                                    </button>
                                ))}
                                {projects.length === 0 && (
                                    <div className="p-4 text-center text-xs text-[var(--brand-text-mid)]">No projects yet.</div>
                                )}
                            </div>
                            <div className="p-2 border-t border-[var(--brand-border-1)] bg-[var(--brand-surface-2)]">
                                <button
                                    onClick={() => { setIsProjectMenuOpen(false); setIsAddModalOpen(true); }}
                                    className="w-full flex items-center justify-center gap-2 p-2 rounded-lg border border-[var(--brand-border-1)] text-xs text-[var(--brand-text-faint)] hover:text-[var(--brand-text-strong)] hover:bg-[var(--brand-surface-3)] transition-colors"
                                >
                                    <Plus size={12} /> Add Project
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* New Analysis Action */}
                <button
                    onClick={() => setCurrentView('content_predictor')}
                    className={`mt-2 bg-gradient-to-r from-brand-amber to-[#FF5065] text-[var(--brand-text-strong)] rounded-xl flex items-center justify-center gap-2 group shadow-glow-sm hover:shadow-glow transition-all
                    ${isCollapsed ? 'w-10 h-10 p-0' : 'w-full py-2.5 px-4'}`}
                    title="New Analysis"
                >
                    <Plus size={16} className="text-[var(--brand-text-strong)] transition-transform" />
                    {!isCollapsed && <span className="text-xs font-bold uppercase tracking-wide">New Analysis</span>}
                </button>
            </div>

            {/* B. Navigation Groups */}
            <div className="flex-1 overflow-y-auto px-3 flex flex-col gap-6 py-4 scrollbar-hide">

                {/* Core */}
                <div className="flex flex-col gap-1">
                    {!isCollapsed && (
                        <div className="px-4 mb-1 animate-in fade-in duration-300">
                            <span className="text-[10px] font-bold text-[var(--brand-text-faint)] uppercase tracking-widest font-heading">Core</span>
                        </div>
                    )}
                    <SidebarItem 
                        icon={<LayoutDashboard size={18} />} 
                        label="Overview" 
                        active={currentView === 'dashboard'} 
                        onClick={() => {
                            if (activeProject) navigate(`/project/${activeProject.id}/dashboard`);
                            else setCurrentView('dashboard');
                        }} 
                        collapsed={isCollapsed} 
                    />
                </div>

                {/* Intelligence (Strategy) */}
                <div className="flex flex-col gap-1">
                    {!isCollapsed && (
                        <div className="px-4 mb-1 animate-in fade-in duration-300">
                            <span className="text-[10px] font-bold text-[var(--brand-text-faint)] uppercase tracking-widest font-heading">Intelligence</span>
                        </div>
                    )}
                    <SidebarItem 
                        icon={<Search size={18} />} 
                        label="Keyword Research" 
                        active={currentView === 'keyword_research'} 
                        onClick={() => {
                            if (activeProject) navigate(`/project/${activeProject.id}/dashboard?view=keyword_research`);
                            else setCurrentView('keyword_research');
                        }} 
                        collapsed={isCollapsed} 
                    />
                    <SidebarItem 
                        icon={<Sparkles size={18} />} 
                        label="Content Predictor" 
                        active={currentView === 'content_predictor'} 
                        onClick={() => {
                            if (activeProject) navigate(`/project/${activeProject.id}/dashboard?view=content_predictor`);
                            else setCurrentView('content_predictor');
                        }} 
                        badge="AI" 
                        collapsed={isCollapsed} 
                    />
                    <SidebarItem 
                        icon={<Globe size={18} />} 
                        label="Competitors" 
                        active={currentView === 'competitors'} 
                        onClick={() => {
                            if (activeProject) navigate(`/project/${activeProject.id}/dashboard?view=competitors`);
                            else setCurrentView('competitors');
                        }} 
                        collapsed={isCollapsed} 
                    />
                </div>

                {/* Performance (Tracking) */}
                <div className="flex flex-col gap-1">
                    {!isCollapsed && (
                        <div className="px-4 mb-1 animate-in fade-in duration-300">
                            <span className="text-[10px] font-bold text-[var(--brand-text-faint)] uppercase tracking-widest font-heading">Performance</span>
                        </div>
                    )}
                    <SidebarItem 
                        icon={<Target size={18} />} 
                        label="Rank Tracker" 
                        active={currentView === 'rank_tracker'} 
                        onClick={() => {
                            if (activeProject) navigate(`/project/${activeProject.id}/dashboard?view=rank_tracker`);
                            else setCurrentView('rank_tracker');
                        }} 
                        collapsed={isCollapsed} 
                    />
                    <SidebarItem 
                        icon={<Share2 size={18} />} 
                        label="Mentions" 
                        active={currentView === 'mentions'} 
                        onClick={() => {
                            if (activeProject) navigate(`/project/${activeProject.id}/dashboard?view=mentions`);
                            else setCurrentView('mentions');
                        }} 
                        collapsed={isCollapsed} 
                    />
                    <SidebarItem 
                        icon={<Activity size={18} />} 
                        label="Site Audit" 
                        active={currentView === 'site_audit'} 
                        onClick={() => {
                            if (activeProject) navigate(`/project/${activeProject.id}/dashboard?view=site_audit`);
                            else setCurrentView('site_audit');
                        }} 
                        hasNotification 
                        collapsed={isCollapsed} 
                    />
                </div>

                {/* Operations (Execution) */}
                <div className="flex flex-col gap-1">
                    {!isCollapsed && (
                        <div className="px-4 mb-1 animate-in fade-in duration-300">
                            <span className="text-[10px] font-bold text-[var(--brand-text-faint)] uppercase tracking-widest font-heading">Operations</span>
                        </div>
                    )}
                    <SidebarItem 
                        icon={<Lightbulb size={18} />} 
                        label="Opportunities" 
                        active={currentView === 'opportunities'} 
                        onClick={() => {
                            if (activeProject) navigate(`/project/${activeProject.id}/dashboard?view=opportunities`);
                            else setCurrentView('opportunities');
                        }} 
                        collapsed={isCollapsed} 
                    />
                    <SidebarItem 
                        icon={<CheckSquare size={18} />} 
                        label="Tasks" 
                        active={window.location.pathname.includes('/tasks')} 
                        onClick={() => {
                            if (activeProject) navigate(`/project/${activeProject.id}/tasks`);
                        }} 
                        collapsed={isCollapsed} 
                    />
                    <SidebarItem icon={<Briefcase size={18} />} label="Agency Hub" active={currentView === 'agency_hub'} onClick={() => {
                        if (activeProject) navigate(`/project/${activeProject.id}/dashboard?view=agency_hub`);
                        else setCurrentView('agency_hub');
                    }} collapsed={isCollapsed} />
                    <SidebarItem icon={<BellRing size={18} />} label="Automations" active={currentView === 'automation'} onClick={() => {
                        if (activeProject) navigate(`/project/${activeProject.id}/dashboard?view=automation`);
                        else setCurrentView('automation');
                    }} collapsed={isCollapsed} />
                </div>
            </div>

            {/* C. Footer: Settings & Profile */}
            <div className="p-3 bg-[var(--brand-sidebar)] border-t border-[var(--border-subtle)] flex flex-col gap-1">
                <SidebarItem
                    icon={<Settings size={18} />}
                    label="Project Settings"
                    active={currentView === 'settings_project'}
                    onClick={() => {
                        if (activeProject) navigate(`/project/${activeProject.id}/dashboard?view=settings_project`);
                        else setCurrentView('settings_project');
                    }}
                    collapsed={isCollapsed}
                />
                <SidebarItem
                    icon={<Users size={18} />}
                    label="Account Settings"
                    active={currentView === 'settings_account'}
                    onClick={() => {
                        if (activeProject) navigate(`/project/${activeProject.id}/dashboard?view=settings_account`);
                        else setCurrentView('settings_account');
                    }}
                    collapsed={isCollapsed}
                />

                {!isCollapsed ? (
                    <div className="mt-3 bg-[var(--brand-surface-2)] rounded-xl border border-[var(--brand-border-1)] p-3 flex flex-col gap-2">
                        <div className="flex justify-between items-end">
                            <span className="text-[10px] text-[var(--brand-text-mid)] font-bold uppercase">Credits</span>
                            <span className="text-xs text-[var(--brand-text-strong)] font-bold">4.2k <span className="text-[var(--brand-text-faint)]">/ 5k</span></span>
                        </div>
                        <div className="h-1 w-full bg-[var(--brand-surface-3)] rounded-full overflow-hidden">
                            <div className="h-full w-[84%] bg-brand-amber"></div>
                        </div>
                    </div>
                ) : (
                    <div className="mt-2 flex justify-center">
                        <div className="w-8 h-1 bg-[var(--brand-surface-3)] rounded-full overflow-hidden">
                            <div className="w-[84%] h-full bg-brand-amber"></div>
                        </div>
                    </div>
                )}

                <div className={`mt-2 flex items-center gap-3 px-1 py-1.5 rounded-lg hover:bg-[var(--brand-surface-3)] transition-all group ${isCollapsed ? 'justify-center' : ''}`}>
                    <div className="w-8 h-8 rounded-full bg-brand-card border border-[var(--brand-border-2)] flex items-center justify-center text-[10px] font-bold text-[var(--brand-text-faint)] overflow-hidden shrink-0 uppercase">
                        {user?.fullName?.split(' ').map(n => n[0]).join('').substring(0, 2) || '??'}
                    </div>
                    {!isCollapsed && (
                        <>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-[var(--brand-text-strong)] truncate">{user?.fullName || 'User Account'}</p>
                                <p className="text-[10px] text-[var(--brand-text-faint)] truncate leading-tight capitalize">
                                    {(profile?.subscription_status || 'Free') + ' Plan'}
                                </p>
                            </div>
                            <button 
                                onClick={() => signOut()}
                                className="p-2 text-[var(--brand-text-mid)] hover:text-[#F59E0B] hover:bg-[#F59E0B]/10 rounded-lg transition-all"
                                title="Sign Out"
                            >
                                <LogOut size={14} />
                            </button>
                        </>
                    )}
                </div>
            </div>
            {/* Add Project Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center backdrop-blur-sm p-4">
                    <div className="bg-[var(--brand-surface-2)] border border-[var(--brand-border-2)] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
                        <div className="p-5 border-b border-[var(--brand-border-1)] flex justify-between items-center bg-[var(--brand-surface-2)]">
                            <h3 className="text-lg font-bold text-[var(--brand-text-strong)]">Create New Project</h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-[var(--brand-text-mid)] hover:text-[var(--brand-text-strong)]">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-[var(--brand-text-faint)] mb-1">Project Name</label>
                                <input
                                    type="text"
                                    value={newProjectName}
                                    onChange={e => setNewProjectName(e.target.value)}
                                    placeholder="e.g. Acme Corp"
                                    className="w-full bg-[var(--brand-surface-1)] border border-[var(--brand-border-2)] rounded-lg p-3 text-sm text-[var(--brand-text-strong)] focus:outline-none focus:border-brand-amber transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[var(--brand-text-faint)] mb-1">Website URL</label>
                                <input
                                    type="url"
                                    value={newProjectUrl}
                                    onChange={e => setNewProjectUrl(e.target.value)}
                                    placeholder="https://acme.com"
                                    className="w-full bg-[var(--brand-surface-1)] border border-[var(--brand-border-2)] rounded-lg p-3 text-sm text-[var(--brand-text-strong)] focus:outline-none focus:border-brand-amber transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[var(--brand-text-faint)] mb-1">Industry</label>
                                <select
                                    value={newProjectIndustry}
                                    onChange={e => setNewProjectIndustry(e.target.value as any)}
                                    className="w-full bg-[var(--brand-surface-1)] border border-[var(--brand-border-2)] rounded-lg p-3 text-sm text-[var(--brand-text-strong)] focus:outline-none focus:border-brand-amber transition-colors appearance-none"
                                >
                                    <option value="saas">SaaS / B2B</option>
                                    <option value="ecommerce">E-Commerce</option>
                                    <option value="local">Local Services</option>
                                    <option value="elearning">E-Learning</option>
                                </select>
                            </div>

                            <button
                                disabled={!newProjectName || !newProjectUrl || isSubmitting}
                                onClick={async () => {
                                    setIsSubmitting(true);
                                    const proj = await addProject(newProjectName, newProjectUrl, newProjectIndustry);
                                    setIsSubmitting(false);
                                    if (proj) {
                                        setIsAddModalOpen(false);
                                        setNewProjectName('');
                                        setNewProjectUrl('');
                                    }
                                }}
                                className="w-full mt-4 bg-brand-amber text-[var(--brand-text-strong)] font-bold py-3 rounded-xl hover:bg-brand-amber/90 transition-colors disabled:opacity-50"
                            >
                                {isSubmitting ? 'Creating...' : 'Create Project'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </aside>
    );
};
