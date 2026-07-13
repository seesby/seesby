import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
    Settings, X, HelpCircle,
    LogIn, LogOut, User, CreditCard, Key, Database,
    Sparkles, Bot,
    FolderOpen, Plus, ChevronDown, Check, ArrowRight,
    Pause, Play, Pencil, Trash2
} from 'lucide-react';
import { useSeoCrawler } from '../../contexts/SeoCrawlerContext';
import { useOptionalProject } from '../../services/ProjectContext';
import { NotificationBell } from '../NotificationBell';
import { useNavigate } from 'react-router-dom';
import { BeeMark } from '../BeeMark';
import { MODE_ACCENT } from './views/_shared/tokens';
import { allModes, registerAllModes } from '../../packages/modes/src';
import { allIndustries, INDUSTRY_LABEL, MODE_LABEL, type Mode } from '@seesby/types';
import { getMode } from '@seesby/modes';
import { MODE_DOT_CLASS } from './left-sidebar/tokens';

registerAllModes();

// ─── Mini "New Project" form rendered inside the dropdown ───────────────────

const extractDomain = (url: string) => {
    try {
        const hostname = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
        return hostname.replace(/^www\./, '');
    } catch {
        return url;
    }
};

interface NewProjectFormProps {
    onCreated: () => void;
    onCancel: () => void;
}

function NewProjectForm({ onCreated, onCancel }: NewProjectFormProps) {
    const projectCtx = useOptionalProject();
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [url, setUrl] = useState('');
    const [industry, setIndustry] = useState('all');
    const [loading, setLoading] = useState(false);

    const handleUrlChange = (value: string) => {
        const domain = extractDomain(value);
        setUrl(value);
        if (!name || name === extractDomain(url)) setName(domain);
    };

    const handleCreate = async () => {
        if (!url.trim() || !projectCtx) return;
        setLoading(true);
        try {
            const newProject = await projectCtx.addProject(name || extractDomain(url), url, industry as any);
            if (newProject) {
                navigate(`/project/${newProject.id}/crawler?setup=true`);
                onCreated();
            }
        } catch (err) {
            console.error('Failed to create project:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-3 border-t border-[var(--brand-border-2)]] space-y-2.5">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--brand-text-faint)]] mb-1">New Project</div>

            <input
                autoFocus
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Project name (optional)"
                className="w-full h-8 px-3 bg-[var(--brand-surface-0)]] border border-[var(--brand-border-2)]] rounded text-[12px] text-[var(--brand-text-strong)] placeholder-[var(--brand-border-2)]] focus:outline-none focus:border-[#F59E0B] transition-colors"
            />
            <input
                value={url}
                onChange={e => handleUrlChange(e.target.value)}
                placeholder="https://example.com"
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                className="w-full h-8 px-3 bg-[var(--brand-surface-0)]] border border-[var(--brand-border-2)]] rounded text-[12px] text-[var(--brand-text-strong)] placeholder-[var(--brand-border-2)]] focus:outline-none focus:border-[#F59E0B] transition-colors"
            />
            <select
                value={industry}
                onChange={e => setIndustry(e.target.value)}
                className="w-full h-8 px-2 bg-[var(--brand-surface-0)]] border border-[var(--brand-border-2)]] rounded text-[12px] text-[var(--brand-text-strong)] focus:outline-none appearance-none cursor-pointer"
            >
                {INDUSTRY_FILTERS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
            </select>

            <div className="flex gap-2 pt-0.5">
                <button
                    onClick={onCancel}
                    className="flex-1 h-7 text-[11px] font-medium text-[var(--brand-text-faint)]] hover:text-[var(--brand-text-mid)]] border border-[var(--brand-border-2)]] rounded transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={handleCreate}
                    disabled={loading || !url.trim()}
                    className="flex-1 h-7 text-[11px] font-bold bg-[var(--brand-surface-3)] hover:bg-[#eee] disabled:opacity-30 disabled:cursor-not-allowed text-black rounded flex items-center justify-center gap-1 transition-all"
                >
                    {loading ? 'Creating…' : <><ArrowRight size={11} /> Create</>}
                </button>
            </div>
        </div>
    );
}

// ─── Project Selector Dropdown ───────────────────────────────────────────────

function ProjectSelector() {
    const projectCtx = useOptionalProject();
    const { isCrawling, crawlRuntime, clearCrawlerWorkspace } = useSeoCrawler();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [showNewForm, setShowNewForm] = useState(false);
    const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({ name: '', url: '' });
    const ref = useRef<HTMLDivElement>(null);

    const projects = projectCtx?.projects ?? [];
    const active = projectCtx?.activeProject ?? null;

    // Progress calculation
    const isActive = isCrawling || crawlRuntime.stage === 'crawling' || crawlRuntime.stage === 'connecting' || crawlRuntime.stage === 'paused';
    const isError = crawlRuntime.stage === 'error';
    const progress = Math.min(100, Math.max(0, (crawlRuntime.crawled / Math.max(1, crawlRuntime.discovered)) * 100));

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
                setShowNewForm(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const handleSwitch = (id: string) => {
        // Clear old project data/workspace before switching
        clearCrawlerWorkspace();
        projectCtx?.switchProject(id, { persist: false });
        navigate(`/project/${id}/crawler`);
        setOpen(false);
        setShowNewForm(false);
    };

    const handleDelete = (e: React.MouseEvent, id: string, name: string) => {
        e.stopPropagation();
        if (confirm(`Are you sure you want to delete project "${name}"? This will permanently remove all associated crawl data.`)) {
            projectCtx?.deleteProject(id);
            if (active?.id === id) {
                navigate('/crawler');
            }
        }
    };

    const handleEdit = (e: React.MouseEvent, p: any) => {
        e.stopPropagation();
        setEditingProjectId(p.id);
        setEditForm({ name: p.name, url: p.url || p.domain || '' });
    };

    const handleCancelEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingProjectId(null);
    };

    const handleSaveEdit = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!editForm.name.trim() || !editForm.url.trim()) return;

        const domain = editForm.url.replace(/^https?:\/\//, '').split('/')[0];
        const url = editForm.url.startsWith('http') ? editForm.url : `https://${editForm.url}`;

        await projectCtx?.updateProject(id, { 
            name: editForm.name, 
            url,
            domain
        });
        setEditingProjectId(null);
    };

    return (
        <div ref={ref} className="relative flex-1 max-w-[340px]">
            {/* Trigger */}
            <button
                id="crawler-project-selector"
                onClick={() => { setOpen(o => !o); setShowNewForm(false); }}
                className={`w-full h-[32px] flex items-center gap-2 px-3 rounded-md text-[13px] transition-all duration-200
                    bg-gradient-to-b from-[var(--brand-surface-2)]] to-[var(--brand-surface-0)]] border shadow-[inset_0_1px_4px_rgba(0,0,0,0.5)] relative overflow-hidden
                    ${open ? 'border-[#F59E0B]/40 shadow-[0_0_10px_rgba(245,158,11,0.08)]' : 'border-[var(--brand-border-2)] hover:border-[var(--brand-border-3)]'}`}
                style={isActive ? {
                    backgroundImage: `linear-gradient(to right, ${isError ? 'rgba(245, 54, 78, 0.2)' : 'rgba(34, 197, 94, 0.2)'} ${progress}%, transparent ${progress}%), linear-gradient(to bottom, bg-[var(--brand-surface-2)], bg-[var(--brand-surface-0)])`
                } : {}}
            >
                <FolderOpen size={13} className="shrink-0 text-[var(--brand-text-faint)]] relative z-10" />
                <span className="flex-1 text-left truncate text-[var(--brand-text-mid)]] relative z-10">
                    {active ? active.name : <span className="text-[var(--brand-text-faint)]]">Select a project…</span>}
                </span>
                {active?.domain && (
                    <span className="text-[10px] text-[var(--brand-text-faint)]] truncate max-w-[100px] hidden sm:block relative z-10">{active.domain}</span>
                )}
                <ChevronDown
                    size={11}
                    className={`shrink-0 text-[var(--brand-text-faint)]] transition-transform duration-200 relative z-10 ${open ? 'rotate-180' : ''}`}
                />
            </button>

            {/* Dropdown panel */}
            {open && (
                <div className="absolute left-0 top-full mt-1 w-full min-w-[280px] max-w-[380px] bg-[var(--brand-surface-2)]] border border-[var(--brand-border-3)]] rounded-lg shadow-2xl z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">

                    {/* Project list */}
                    {projects.length > 0 ? (
                        <div className="max-h-[220px] overflow-y-auto">
                            {projects.map(p => (
                                <div key={p.id}>
                                    {editingProjectId === p.id ? (
                                        <div 
                                            className="px-3 py-2 space-y-2 bg-[var(--brand-surface-3)]] border-y border-[var(--brand-border-3)]]"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <input 
                                                autoFocus
                                                value={editForm.name}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                                className="w-full bg-black border border-[var(--brand-border-2)] rounded px-2 py-1 text-[11px] text-[var(--brand-text-strong)] focus:outline-none focus:border-[#F59E0B]/50"
                                                placeholder="Project Name"
                                            />
                                            <div className="flex items-center gap-2">
                                                <input 
                                                    value={editForm.url}
                                                    onChange={(e) => setEditForm(prev => ({ ...prev, url: e.target.value }))}
                                                    className="flex-1 bg-black border border-[var(--brand-border-2)] rounded px-2 py-1 text-[11px] text-[var(--brand-text-mid)]] focus:outline-none focus:border-[#F59E0B]/50"
                                                    placeholder="URL or Domain"
                                                />
                                                <div className="flex items-center gap-1">
                                                    <button 
                                                        onClick={(e) => handleSaveEdit(e, p.id)}
                                                        className="p-1 rounded hover:bg-green-500/20 text-green-500 transition-colors"
                                                    >
                                                        <Check size={12} />
                                                    </button>
                                                    <button 
                                                        onClick={handleCancelEdit}
                                                        className="p-1 rounded hover:bg-[var(--brand-surface-4)] text-[var(--brand-text-faint)]] hover:text-[var(--brand-text-strong)] transition-colors"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div
                                            onClick={() => handleSwitch(p.id)}
                                            className={`group/item w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors cursor-pointer
                                                ${p.id === active?.id
                                                    ? 'bg-[var(--brand-surface-3)]] text-[var(--brand-text-strong)]'
                                                    : 'text-[var(--brand-text-mid)]] hover:bg-[var(--brand-surface-3)]] hover:text-[var(--brand-text-strong)]'
                                                }`}
                                        >
                                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${p.id === active?.id ? 'bg-[#F59E0B]' : 'bg-[var(--brand-surface-4)]]'}`} />
                                            <span className="flex-1 text-[12px] font-medium truncate">{p.name}</span>
                                            <span className="text-[10px] text-[var(--brand-border-2)]] truncate max-w-[80px] hidden sm:block">{p.domain}</span>
                                            
                                            {/* Action Buttons */}
                                            <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={(e) => handleEdit(e, p)}
                                                    className="p-1 rounded hover:bg-[var(--brand-surface-4)] text-[var(--brand-text-strong)]/40 hover:text-[var(--brand-text-strong)] transition-colors"
                                                    title="Edit Project"
                                                >
                                                    <Pencil size={10} />
                                                </button>
                                                <button 
                                                    onClick={(e) => handleDelete(e, p.id, p.name)}
                                                    className="p-1 rounded hover:bg-red-500/20 text-[var(--brand-text-strong)]/40 hover:text-red-400 transition-colors"
                                                    title="Delete Project"
                                                >
                                                    <Trash2 size={10} />
                                                </button>
                                            </div>

                                            {p.id === active?.id && <Check size={10} className="shrink-0 text-[#F59E0B]" />}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="px-3 py-4 text-center text-[11px] text-[var(--brand-text-faint)]]">
                            No projects yet
                        </div>
                    )}

                    {/* New Project toggle */}
                    {!showNewForm ? (
                        <div className="border-t border-[var(--brand-surface-3)]]">
                            <button
                                onClick={() => setShowNewForm(true)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-bold text-[#F59E0B] hover:bg-[#F59E0B]/5 transition-colors"
                            >
                                <Plus size={12} />
                                New Project
                            </button>
                        </div>
                    ) : (
                        <NewProjectForm
                            onCreated={() => { setOpen(false); setShowNewForm(false); }}
                            onCancel={() => setShowNewForm(false)}
                        />
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Profile Dropdown ──────────────────────────────────────────────────────

function ProfileDropdown({ isAuthenticated, user, profile }: { isAuthenticated: boolean; user: any; profile: any }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    if (!isAuthenticated) {
        return (
            <button
                onClick={() => window.location.assign('/auth')}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-[#F59E0B]/10 hover:bg-[#F59E0B]/20 border border-[#F59E0B]/30 rounded text-[11px] font-bold text-[#F59E0B] transition-colors"
                title="Sign in for unlimited scans and saved history"
            >
                <LogIn size={11}/> Sign in
            </button>
        );
    }

    const initials = (profile?.full_name || user?.email || '?')[0].toUpperCase();
    const firstName = (profile?.full_name || user?.email?.split('@')[0] || 'User').split(' ')[0];

    return (
        <div ref={ref} className="relative ml-1">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-1.5 px-1.5 py-1 bg-[var(--brand-surface-3)]] border border-[var(--brand-border-2)]] rounded hover:border-[var(--brand-surface-4)]] transition-colors"
                title={user?.email || ''}
            >
                <div className="w-5 h-5 rounded-full bg-[#F59E0B]/20 flex items-center justify-center text-[9px] font-bold text-[#F59E0B]">
                    {initials}
                </div>
                <span className="text-[10px] text-[var(--brand-text-mid)]] hidden xl:block">{firstName}</span>
                <ChevronDown size={10} className={`text-[var(--brand-text-faint)]] transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-1 w-52 bg-[var(--brand-surface-2)]] border border-[var(--brand-surface-4)]] rounded-lg shadow-2xl z-[100] py-1 animate-in fade-in slide-in-from-top-1 duration-100">
                    <div className="px-3 py-2 border-b border-[var(--brand-border-2)]]">
                        <div className="text-[11px] font-medium text-[var(--brand-text-strong)] truncate">{profile?.full_name || user?.email?.split('@')[0]}</div>
                        <div className="text-[10px] text-[var(--brand-text-faint)]] truncate">{user?.email}</div>
                    </div>
                    <button
                        onClick={() => { window.location.assign('/account'); setOpen(false); }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-[var(--brand-text-mid)]] hover:bg-[var(--brand-surface-3)]] transition-colors"
                    >
                        <User size={12} /> Account
                    </button>
                    <button
                        onClick={() => { window.location.assign('/team'); setOpen(false); }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-[var(--brand-text-mid)]] hover:bg-[var(--brand-surface-3)]] transition-colors"
                    >
                        <User size={12} /> Team
                    </button>
                    <button
                        onClick={() => { window.location.assign('/usage'); setOpen(false); }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-[var(--brand-text-mid)]] hover:bg-[var(--brand-surface-3)]] transition-colors"
                    >
                        <Database size={12} /> Usage
                    </button>
                    <button
                        onClick={() => { window.location.assign('/api-keys'); setOpen(false); }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-[var(--brand-text-mid)]] hover:bg-[var(--brand-surface-3)]] transition-colors"
                    >
                        <Key size={12} /> API Keys
                    </button>
                    <button
                        onClick={() => { window.location.assign('/billing'); setOpen(false); }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-[var(--brand-text-mid)]] hover:bg-[var(--brand-surface-3)]] transition-colors"
                    >
                        <CreditCard size={12} /> Billing
                    </button>
                    <div className="border-t border-[var(--brand-border-2)]] mt-1 pt-1">
                        <button
                            onClick={() => { window.location.assign('/auth/signout'); setOpen(false); }}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-[var(--brand-text-mid)]] hover:bg-[var(--brand-surface-3)]] hover:text-[#F59E0B] transition-colors"
                        >
                            <LogOut size={12} /> Sign out
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Main Header ─────────────────────────────────────────────────────────────

export default function CrawlerHeader() {
    const {
        mode, setMode,
        isCrawling, handleStartPause,
        pages,
        showSettings, setShowSettings,
        isAuthenticated, user, profile,
        crawlRuntime,
        clearCrawlerWorkspace,
        analysisRuntime, runCompleteAnalysis,
        setShowAiChat,
        fingerprint, setWqaIndustryOverride,
    } = useSeoCrawler() as any;

    const [showShortcuts, setShowShortcuts] = useState(false);
    const isPausedSession = !isCrawling && crawlRuntime.stage === 'paused' && pages.length > 0;

    // Listen for shortcuts panel open from StatusBar
    useEffect(() => {
        const handler = () => setShowShortcuts(true);
        window.addEventListener('open-shortcuts', handler);
        return () => window.removeEventListener('open-shortcuts', handler);
    }, []);
    const isActiveSession = isCrawling || crawlRuntime.stage === 'crawling' || crawlRuntime.stage === 'connecting';

    const modeAccent = MODE_ACCENT[mode] || '#94a3b8';

    const activeModeDescriptor = useMemo(() => {
        try { return getMode(mode); } catch { return null; }
    }, [mode]);

    // Mode-specific primary action labels
    const MODE_ACTION: Record<string, string> = useMemo(() => ({
        fullAudit: 'New Crawl',
        wqa: 'Rescore',
        technical: 'Sub-crawl',
        content: 'New Brief',
        linksAuthority: 'Import CSV',
        ai: 'Run Prompts',
        competitors: 'Add Competitor',
        commerce: 'Feed Check',
        local: 'New Post',
        uxConversion: 'New Test',
        paid: 'Sync Ads',
        socialBrand: 'New Audit',
    }), []);
    const primaryActionLabel = MODE_ACTION[mode] || 'New Scan';

    return (
        <header className="h-[48px] bg-[var(--brand-card)] border-b border-[var(--brand-border-1)] flex items-center px-3 justify-between shrink-0 relative z-40">
            {/* ── Left: Logo + Breadcrumb ── */}
            <div className="flex items-center gap-3 min-w-0">
                {/* Logo */}
                <div className="flex items-center gap-2 relative shrink-0">
                    {isCrawling && (
                        <div className="absolute -inset-2 bg-[#F59E0B]/20 rounded-full blur-md animate-pulse z-0 hidden md:block" />
                    )}
                    <BeeMark size={22} className={`shrink-0 relative z-10 transition-all duration-500 ${isCrawling ? 'drop-shadow-[0_0_12px_rgba(245,158,11,0.8)]' : 'drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]'}`} />
                    <span className="font-bold text-[var(--brand-text-strong)] text-[14px] tracking-tight relative z-10">Seesby <span className="text-gray-500 font-medium">Scanner</span></span>
                </div>

                <span className="text-[var(--brand-surface-4)]] text-[14px]">|</span>

                {/* Project */}
                <div className="shrink-0">
                    <ProjectSelector />
                </div>

                <span className="text-[var(--brand-surface-4)]] text-[14px]">|</span>

                {/* Mode */}
                <div className="relative flex items-center gap-1.5 h-[28px] px-2 bg-[var(--brand-surface-0)]] border border-[var(--brand-border-2)]] rounded hover:border-[var(--brand-surface-4)]] transition-colors shrink-0">
                    {activeModeDescriptor && (
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${MODE_DOT_CLASS[activeModeDescriptor.accent] || 'bg-[var(--brand-surface-3)]'}`} />
                    )}
                    <select
                        value={mode}
                        onChange={(e) => setMode(e.target.value as Mode)}
                        className="bg-transparent text-[11px] text-[var(--brand-text-mid)]] focus:outline-none appearance-none cursor-pointer"
                    >
                        {allModes().map((entry) => (
                            <option key={entry.id} value={entry.id}>{MODE_LABEL[entry.id]}</option>
                        ))}
                    </select>
                    <ChevronDown size={10} className="text-[var(--brand-text-faint)]] pointer-events-none" />
                </div>

                <span className="text-[var(--brand-surface-4)]] text-[14px]">|</span>

                {/* Industry */}
                <div className="relative h-[28px] flex items-center">
                    <select
                        value={fingerprint?.industry?.value || 'general'}
                        onChange={(e) => setWqaIndustryOverride?.(e.target.value || null)}
                        className="h-full pl-2 pr-6 bg-[var(--brand-surface-0)]] border border-[var(--brand-border-2)]] rounded text-[11px] text-[var(--brand-text-mid)]] hover:border-[var(--brand-surface-4)]] focus:outline-none appearance-none cursor-pointer transition-colors"
                    >
                        {allIndustries().map((industry) => (
                            <option key={industry} value={industry}>{INDUSTRY_LABEL[industry]}</option>
                        ))}
                    </select>
                    <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[var(--brand-text-faint)]] pointer-events-none" />
                </div>
            </div>

            {/* ── Right: Actions + Profile ── */}
            <div className="flex items-center gap-1.5 shrink-0">
                {/* Clear */}
                <button
                    onClick={clearCrawlerWorkspace}
                    disabled={pages.length === 0 || isCrawling}
                    className="flex items-center gap-1 px-2 py-1 bg-transparent hover:bg-[var(--brand-border-2)]] border border-[var(--brand-surface-4)]] rounded text-[10px] font-medium text-[var(--brand-text-mid)]] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Clear workspace"
                >
                    <X size={10} /> Clear
                </button>

                {/* Analyze + AI (xl+) */}
                <div className="hidden xl:flex items-center gap-1.5">
                    {pages.length > 0 && !isCrawling && (
                        <>
                            <button
                                onClick={() => runCompleteAnalysis()}
                                disabled={analysisRuntime.isAnalyzing}
                                className={`relative flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold transition-all overflow-hidden ${
                                    analysisRuntime.isAnalyzing
                                    ? 'bg-[var(--brand-surface-3)]] text-gray-400 border border-[var(--brand-surface-4)]] cursor-wait'
                                    : 'bg-gradient-to-t from-[#D97706] to-[#F59E0B] text-black hover:to-[#FBBF24]'
                                }`}
                            >
                                {analysisRuntime.isAnalyzing && (
                                    <div className="absolute inset-0 bg-[var(--brand-surface-3)] transition-all duration-500" style={{ width: `${analysisRuntime.progress}%` }} />
                                )}
                                <div className="relative z-10 flex items-center gap-1">
                                    {analysisRuntime.isAnalyzing ? (
                                        <>
                                            <svg className="w-3 h-3 -rotate-90" viewBox="0 0 24 24">
                                                <circle className="text-[var(--brand-text-strong)]/10" strokeWidth="3.5" stroke="currentColor" fill="transparent" r="10" cx="12" cy="12" />
                                                <circle className="text-[var(--brand-text-strong)] transition-all duration-700" strokeWidth="3.5" strokeDasharray={62.83} strokeDashoffset={62.83 * (1 - analysisRuntime.progress / 100)} strokeLinecap="round" stroke="currentColor" fill="transparent" r="10" cx="12" cy="12" />
                                            </svg>
                                            <span className="truncate">{analysisRuntime.label}</span>
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles size={10} className={analysisRuntime.stage === 'completed' ? 'text-green-400' : 'text-[var(--brand-text-strong)]'} fill="currentColor" />
                                            <span>{analysisRuntime.stage === 'completed' ? 'Done' : 'Analyze'}</span>
                                        </>
                                    )}
                                </div>
                            </button>

                            <button
                                onClick={() => setShowAiChat(true)}
                                className="flex items-center gap-1 px-2 py-1 bg-[var(--brand-amber-soft)] hover:bg-[var(--brand-amber-soft-2)] border border-[var(--brand-amber-border-soft)] text-[var(--brand-amber)] rounded text-[10px] font-bold transition-all"
                            >
                                <Bot size={10} /> AI
                            </button>
                        </>
                    )}
                </div>

                {/* Utilities */}
                <div className="flex items-center gap-0.5 border-l border-[var(--brand-border-3)]] pl-2">
                    <NotificationBell />
                    <a href="https://docs.seesby.com" target="_blank" rel="noopener noreferrer" className="p-1.5 rounded text-[var(--brand-text-faint)]] hover:bg-[var(--brand-border-2)]] hover:text-[var(--brand-text-strong)] transition-colors" title="Help">
                        <HelpCircle size={13}/>
                    </a>
                    <button onClick={() => setShowSettings(!showSettings)} className={`p-1.5 rounded transition-colors ${showSettings ? 'bg-[var(--brand-surface-4)]] text-[var(--brand-text-strong)]' : 'text-[var(--brand-text-faint)]] hover:bg-[var(--brand-border-2)]] hover:text-[var(--brand-text-strong)]'}`} title="Settings">
                        <Settings size={13}/>
                    </button>
                </div>

                {/* Profile */}
                <ProfileDropdown isAuthenticated={isAuthenticated} user={user} profile={profile} />

                {/* Primary Action */}
                <button
                    onClick={() => handleStartPause()}
                    className={`h-[28px] px-3 rounded-md text-[11px] font-bold transition-all duration-300 flex items-center justify-center gap-1.5 shadow-sm ${
                        isActiveSession
                        ? 'bg-[#1a0508] text-[#F59E0B] border border-[#F59E0B]/30 hover:bg-[#2a080d]'
                        : isPausedSession
                        ? 'bg-[#1c1403] text-amber-400 border border-amber-500/30 hover:bg-[#261a04]'
                        : 'text-[var(--brand-text-strong)] hover:opacity-90 border border-transparent'
                    }`}
                    style={!isActiveSession && !isPausedSession ? { backgroundColor: modeAccent } : undefined}
                >
                    {isActiveSession ? <Pause size={11} fill="currentColor" /> : <Play size={11} fill="currentColor" />}
                    {primaryActionLabel}
                </button>
            </div>
        </header>
    );
}
