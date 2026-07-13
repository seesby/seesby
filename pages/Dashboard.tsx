import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    Search, Calendar, ChevronDown, Command, Bot, Info, Globe, Target, Sparkles, X, Lightbulb, Activity, Users, LayoutDashboard, Share2, Briefcase, BellRing, Settings,
    AlertTriangle, CheckCircle2, Flame, ArrowRight, ExternalLink, ChevronRight, Clock, Code, FileText, Link as LinkIcon, Lock, Zap
} from 'lucide-react';

import { Sidebar } from '../components/Sidebar';
import { CopilotOverlay } from '../components/CopilotOverlay';
import { ViewType, PanelType } from '../types';

// Data Imports
import {
    topMovers, competitorData, opportunities, mentionData, automationRules, radarData, allAuditChecks
} from '../data/mockData';

// View Imports
import { DashboardOverview } from '../components/dashboard/DashboardOverview';
import { RankTrackerView } from '../components/dashboard/RankTrackerView';
import { SiteAuditView } from '../components/dashboard/SiteAuditView';
import { AgencyHubView } from '../components/dashboard/AgencyHubView';
import { CompetitorsView } from '../components/dashboard/CompetitorsView';
import { ContentPredictorView } from '../components/dashboard/ContentPredictorView';
import { AutomationView } from '../components/dashboard/AutomationView';
import { BrandMentionsView } from '../components/dashboard/BrandMentionsView';
import { ProjectSettingsView } from '../components/dashboard/ProjectSettingsView';
import { EmptyStateView } from '../components/dashboard/EmptyStateView';
import { OnboardingWizard } from '../components/dashboard/OnboardingWizard';
import { NotificationBell } from '../components/NotificationBell';
import { Button } from '../components/Button';
import { useProject } from '../services/ProjectContext';
import { useAuth } from '../services/AuthContext';

const DASHBOARD_VIEWS: ViewType[] = [
    'dashboard',
    'content_predictor',
    'keyword_research',
    'competitors',
    'rank_tracker',
    'mentions',
    'site_audit',
    'web_vitals',
    'agency_hub',
    'automation',
    'opportunities',
    'settings_project',
    'settings_account'
];

const isDashboardView = (value: string | null): value is ViewType => {
    return value !== null && DASHBOARD_VIEWS.includes(value as ViewType);
};

export const Dashboard: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const { profile } = useAuth();
    const { projects, loading: projectsLoading, isCollapsed, setIsCollapsed } = useProject();
    const [dateRange, setDateRange] = useState('30d');
    const [copilotOpen, setCopilotOpen] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const currentView: ViewType = (() => {
        const view = searchParams.get('view');
        return isDashboardView(view) ? view : 'dashboard';
    })();

    // Run once when projects load to determine if we should show onboarding
    React.useEffect(() => {
        if (!projectsLoading && projects.length === 0) {
            setShowOnboarding(true);
        }
    }, [projectsLoading]);

    const setCurrentView = React.useCallback((nextView: ViewType) => {
        const nextParams = new URLSearchParams(searchParams);

        if (nextView === 'dashboard') nextParams.delete('view');
        else nextParams.set('view', nextView);

        if (nextParams.toString() !== searchParams.toString()) {
            setSearchParams(nextParams, { replace: true });
        }
    }, [searchParams, setSearchParams]);

    // Right Panel State
    const [activePanel, setActivePanel] = useState<PanelType>(null);
    const [panelData, setPanelData] = useState<any>(null);
    // Panel Tab State for URL Detail
    const [panelTab, setPanelTab] = useState('issues');

    const openPanel = (type: PanelType, data?: any) => {
        setActivePanel(type);
        setPanelData(data);
        setPanelTab('issues'); // Reset tab on open
    };

    const closePanel = () => {
        setActivePanel(null);
        setPanelData(null);
    };

    // Helper for Context Help
    const showHelp = (title: string, desc: string) => {
        openPanel('context_help', { title, desc });
    }

    // Helper to find related issues for a URL (mock logic)
    const getIssuesForUrl = (url: string) => {
        // In a real app, this would query the backend. Here we filter mock data randomly or by preview match
        return allAuditChecks.filter(check =>
            check.type !== 'passed' && (check.preview?.some(p => url.includes(p)) || Math.random() > 0.8)
        );
    }

    return (
        <div className="flex h-screen bg-brand-bg font-sans overflow-hidden selection:bg-brand-amber selection:text-white relative text-[var(--brand-text-mid)]">

            {/* Background Grid Pattern */}
            <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none z-0"></div>
            <div className="absolute inset-0 bg-gradient-radial from-brand-amber/5 via-transparent to-transparent opacity-20 pointer-events-none z-0"></div>

            {/* 1. Sidebar */}
            <Sidebar
                currentView={currentView}
                setCurrentView={setCurrentView}
            />

            {/* 2. Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 relative z-10 bg-[var(--brand-surface-0)]">

                {/* Header */}
                <header className="h-[76px] border-b border-[var(--brand-border-2)] flex items-center justify-between px-8 bg-[var(--brand-surface-0)]/80 backdrop-blur-md sticky top-0 z-30">
                    {/* Context */}
                    <div className="flex items-center gap-4">
                        <h1 className="text-lg font-heading font-bold text-white capitalize">
                            {currentView.replace('_', ' ')}
                        </h1>

                        <div className="h-6 w-px bg-[var(--brand-surface-3)]/10"></div>

                        {/* Global Filters */}
                        <div className="flex items-center gap-2">
                            <div className="relative group">
                                <button className="flex items-center gap-2 text-xs font-bold text-[var(--brand-text-mid)] bg-transparent hover:text-[var(--brand-text-strong)] transition-colors">
                                    <Calendar size={14} />
                                    {dateRange === '7d' ? 'Last 7 Days' : dateRange === '30d' ? 'Last 30 Days' : 'Last 90 Days'}
                                    <ChevronDown size={12} />
                                </button>
                                <div className="absolute top-full left-0 mt-2 w-32 bg-[var(--brand-surface-2)] border border-[var(--brand-border-2)] rounded-lg shadow-xl py-1 hidden group-hover:block z-50">
                                    <button onClick={() => setDateRange('7d')} className="w-full text-left px-3 py-2 text-xs text-[var(--brand-text-mid)] hover:text-[var(--brand-text-strong)] hover:bg-[var(--brand-surface-3)]/5">Last 7 Days</button>
                                    <button onClick={() => setDateRange('30d')} className="w-full text-left px-3 py-2 text-xs text-[var(--brand-text-mid)] hover:text-[var(--brand-text-strong)] hover:bg-[var(--brand-surface-3)]/5">Last 30 Days</button>
                                    <button onClick={() => setDateRange('90d')} className="w-full text-left px-3 py-2 text-xs text-[var(--brand-text-mid)] hover:text-[var(--brand-text-strong)] hover:bg-[var(--brand-surface-3)]/5">Last 90 Days</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center px-4 py-2 bg-[var(--brand-surface-3)] border border-[var(--brand-border-2)] rounded-xl gap-3 text-sm text-[var(--brand-text-mid)] w-72 hover:border-[var(--brand-border-3)] transition-colors cursor-text group focus-within:border-brand-amber/50 focus-within:bg-black/20">
                            <Search size={14} className="group-hover:text-[var(--brand-text-strong)] transition-colors" />
                            <span className="text-xs">Search projects, keywords...</span>
                            <div className="ml-auto flex items-center gap-1">
                                <span className="text-[10px] bg-[var(--brand-surface-3)]/5 px-1.5 py-0.5 rounded border border-[var(--brand-border-2)] text-[var(--brand-text-faint)]"><Command size={10} className="inline" /> K</span>
                            </div>
                        </div>
                        <div className="h-8 w-px bg-[var(--brand-surface-3)]/5 mx-2"></div>

                        <NotificationBell />

                        <button
                            onClick={() => setCopilotOpen(true)}
                            className="w-9 h-9 rounded-full bg-[var(--brand-surface-3)] border border-[var(--brand-border-2)] flex items-center justify-center hover:bg-[var(--brand-surface-3)]/10 hover:border-[var(--brand-border-3)] transition-colors relative group hover:shadow-glow-sm"
                        >
                            <Bot size={18} className="text-[var(--brand-text-mid)] group-hover:text-[var(--brand-text-strong)] transition-colors" />
                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-amber opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-amber border-2 border-brand-bg"></span>
                            </span>
                        </button>
                    </div>
                </header>

                {/* Dynamic Content Views */}
                <main className="flex-1 overflow-y-auto p-6 lg:p-10 scrollbar-hide">
                    {showOnboarding ? (
                        <OnboardingWizard onComplete={() => setShowOnboarding(false)} />
                    ) : (
                        <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500 pb-10">

                            {currentView === 'dashboard' && (
                                <DashboardOverview
                                    openPanel={openPanel}
                                    topMovers={topMovers}
                                    competitorData={competitorData}
                                    opportunities={opportunities}
                                    showHelp={showHelp}
                                />
                            )}

                            {/* Intelligence Views */}
                            {currentView === 'keyword_research' && <EmptyStateView title="Keyword Research" icon={<Search size={48} />} desc="Discover high-opportunity keywords your competitors are missing." />}
                            {currentView === 'content_predictor' && <ContentPredictorView />}
                            {currentView === 'competitors' && <CompetitorsView radarData={radarData} />}

                            {/* Performance Views */}
                            {currentView === 'rank_tracker' && <RankTrackerView />}
                            {currentView === 'mentions' && <BrandMentionsView />}
                            {currentView === 'site_audit' && <SiteAuditView showHelp={showHelp} openPanel={openPanel} />}
                            {currentView === 'web_vitals' && <EmptyStateView title="Core Web Vitals" icon={<Activity size={48} />} desc="Real-time user experience metrics monitoring." />}

                            {/* Operations Views */}
                            {currentView === 'opportunities' && <EmptyStateView title="Strategic Opportunities" icon={<Lightbulb size={48} />} desc="AI-prioritized list of high impact actions." />}
                            {currentView === 'agency_hub' && (
                                profile?.role === 'VISITOR'
                                    ? <EmptyStateView title="Agency Hub" icon={<Briefcase size={48} />} desc="Upgrade your plan to unlock Agency features." />
                                    : <AgencyHubView />
                            )}
                            {currentView === 'automation' && (
                                profile?.role === 'VISITOR'
                                    ? <EmptyStateView title="Automation" icon={<Zap size={48} />} desc="Upgrade your plan to unlock Automations." />
                                    : <AutomationView />
                            )}

                            {/* Settings Views */}
                            {currentView === 'settings_project' && <ProjectSettingsView />}
                            {currentView === 'settings_account' && <EmptyStateView title="Account Settings" icon={<Users size={48} />} desc="Manage your team, billing, and global preferences." />}

                        </div>
                    )}
                </main>

                {/* 3. Slide-Over Panel */}
                {activePanel && (
                    <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity" onClick={closePanel}></div>
                )}

                <div
                    className={`absolute inset-y-0 right-0 w-full sm:w-[550px] bg-[var(--brand-surface-1)]/95 backdrop-blur-2xl border-l border-[var(--brand-border-2)] z-50 transform transition-transform duration-300 ease-in-out shadow-2xl flex flex-col
            ${activePanel ? 'translate-x-0' : 'translate-x-full'}`}
                >
                    <div className="h-[76px] flex items-center justify-between px-6 border-b border-[var(--brand-border-1)] bg-transparent shrink-0">
                        <h3 className="text-lg font-heading font-bold text-white flex items-center gap-2 truncate pr-4">
                            {activePanel === 'competitor_add' && <><Globe size={18} className="text-brand-amber shrink-0" /> Add Competitor</>}
                            {activePanel === 'keyword_detail' && <><Target size={18} className="text-brand-amber shrink-0" /> Keyword Detail</>}
                            {activePanel === 'insight' && <><Sparkles size={18} className="text-brand-amber shrink-0" /> AI Insight</>}
                            {activePanel === 'context_help' && <><Info size={18} className="text-brand-amber shrink-0" /> Context & Definitions</>}
                            {activePanel === 'audit_issue_detail' && <><AlertTriangle size={18} className="text-brand-amber shrink-0" /> Issue Details</>}
                            {activePanel === 'url_detail' && <><Globe size={18} className="text-brand-amber shrink-0" /> URL Inspection</>}
                        </h3>
                        <button onClick={closePanel} className="text-[var(--brand-text-faint)] hover:text-[var(--brand-text-strong)] transition-colors p-2 hover:bg-[var(--brand-surface-3)]/10 rounded-full">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-0 scrollbar-hide">

                        {/* --- PANEL CONTENT: AUDIT ISSUE DETAILS --- */}
                        {activePanel === 'audit_issue_detail' && panelData && (
                            <div className="flex flex-col h-full">
                                <div className="p-6 border-b border-[var(--brand-border-1)] bg-[var(--brand-surface-2)]">
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wide border ${panelData.priority === 'Critical' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                            panelData.priority === 'High' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                                                'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                            }`}>
                                            {panelData.priority} Priority
                                        </span>
                                        <span className="text-xs text-[var(--brand-text-faint)] font-bold">{panelData.category}</span>
                                    </div>
                                    <h2 className="text-2xl font-bold text-white mb-2 leading-tight">{panelData.title}</h2>
                                    <p className="text-[var(--brand-text-mid)] text-sm leading-relaxed">{panelData.desc}</p>
                                </div>

                                <div className="p-6 space-y-8 flex-1">
                                    {/* AI Insight Section */}
                                    <div className="bg-brand-purple/5 border border-brand-purple/10 rounded-2xl p-5 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-10"><Sparkles size={48} /></div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <Bot size={16} className="text-brand-purple" />
                                            <span className="text-xs font-bold uppercase text-brand-purple tracking-wide">AI Recommendation</span>
                                        </div>
                                        <p className="text-sm text-[var(--brand-text-mid)] leading-relaxed relative z-10">{panelData.aiFix}</p>
                                        <div className="mt-4 flex gap-3">
                                            <Button size="sm" variant="primary" className="bg-brand-purple hover:bg-brand-purple/80 text-white border-none text-[10px]">Apply Fix with AI</Button>
                                            <Button size="sm" variant="secondary" className="bg-transparent border-brand-purple/30 text-brand-purple hover:bg-brand-purple/10 text-[10px]">Learn More</Button>
                                        </div>
                                    </div>

                                    {/* Affected Pages List */}
                                    <div>
                                        <div className="flex justify-between items-end mb-4">
                                            <h3 className="text-sm font-bold text-white uppercase tracking-wide">Affected Pages ({panelData.count})</h3>
                                            <button className="text-xs text-brand-amber font-bold hover:underline">Export CSV</button>
                                        </div>
                                        <div className="bg-[var(--brand-surface-2)] rounded-xl border border-[var(--brand-border-1)] overflow-hidden">
                                            {(panelData.preview || []).map((url: string, i: number) => (
                                                <div key={i} className="flex items-center justify-between p-3 border-b border-[var(--brand-border-1)] last:border-0 hover:bg-[var(--brand-surface-3)]/5 transition-colors group">
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <div className="p-1.5 bg-[var(--brand-surface-3)]/5 rounded text-[var(--brand-text-mid)]"><ExternalLink size={12} /></div>
                                                        <span className="text-sm text-[var(--brand-text-mid)] truncate font-mono">{url}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => openPanel('url_detail', { url, status: 200 })}
                                                        className="opacity-0 group-hover:opacity-100 px-3 py-1 bg-[var(--brand-surface-3)] text-black text-[10px] font-bold rounded hover:bg-gray-200 transition-all"
                                                    >
                                                        Inspect
                                                    </button>
                                                </div>
                                            ))}
                                            {panelData.count > (panelData.preview?.length || 0) && (
                                                <div className="p-3 text-center text-xs text-[var(--brand-text-faint)] border-t border-[var(--brand-border-1)] bg-[var(--brand-surface-3)]">
                                                    + {panelData.count - (panelData.preview?.length || 0)} more pages
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* --- PANEL CONTENT: URL DETAIL INSPECTOR --- */}
                        {activePanel === 'url_detail' && panelData && (
                            <div className="flex flex-col h-full bg-[var(--brand-surface-0)]">
                                {/* URL Header */}
                                <div className="p-6 border-b border-[var(--brand-border-1)] bg-[var(--brand-surface-2)]">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/10 text-green-500 border border-green-500/20">200 OK</span>
                                        <span className="text-xs text-[var(--brand-text-faint)]">text/html</span>
                                        <span className="text-xs text-[var(--brand-text-faint)]">• 15KB</span>
                                    </div>
                                    <h2 className="text-xl font-bold text-white mb-4 font-mono break-all">{panelData.url}</h2>
                                    <div className="flex gap-4">
                                        <a href={`https://${panelData.url.replace(/^\//, '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300">
                                            <ExternalLink size={12} /> Open URL
                                        </a>
                                        <button className="flex items-center gap-1.5 text-xs font-bold text-[var(--brand-text-mid)] hover:text-[var(--brand-text-strong)]">
                                            <Clock size={12} /> History
                                        </button>
                                    </div>
                                </div>

                                {/* Tabs */}
                                <div className="flex items-center px-6 border-b border-[var(--brand-border-1)] bg-[var(--brand-surface-1)]">
                                    {['issues', 'performance', 'links', 'code'].map(tab => (
                                        <button
                                            key={tab}
                                            onClick={() => setPanelTab(tab)}
                                            className={`px-4 py-3 text-xs font-bold uppercase tracking-wide border-b-2 transition-colors ${panelTab === tab
                                                ? 'text-brand-amber border-brand-amber'
                                                : 'text-[var(--brand-text-faint)] border-transparent hover:text-[var(--brand-text-strong)]'
                                                }`}
                                        >
                                            {tab}
                                        </button>
                                    ))}
                                </div>

                                {/* Tab Content */}
                                <div className="flex-1 p-6 bg-[var(--brand-surface-0)]">
                                    {panelTab === 'issues' && (
                                        <div className="space-y-4">
                                            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                                <AlertTriangle size={14} className="text-orange-500" /> Detected Issues
                                            </h3>
                                            {getIssuesForUrl(panelData.url).length > 0 ? (
                                                getIssuesForUrl(panelData.url).map((issue: any) => (
                                                    <div key={issue.id} className="p-4 bg-[var(--brand-surface-3)] border border-[var(--brand-border-1)] rounded-xl hover:border-[var(--brand-border-2)] transition-colors cursor-pointer" onClick={() => openPanel('audit_issue_detail', issue)}>
                                                        <div className="flex justify-between items-start mb-1">
                                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${issue.priority === 'Critical' ? 'bg-red-500/10 text-red-500' : 'bg-orange-500/10 text-orange-500'
                                                                }`}>{issue.priority}</span>
                                                            <ChevronRight size={14} className="text-[var(--brand-text-muted)]" />
                                                        </div>
                                                        <h4 className="text-sm font-bold text-[var(--brand-text-mid)] mt-2">{issue.title}</h4>
                                                        <p className="text-xs text-[var(--brand-text-faint)] mt-1 line-clamp-2">{issue.desc}</p>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-center py-10 opacity-50">
                                                    <CheckCircle2 size={32} className="mx-auto text-green-500 mb-2" />
                                                    <p className="text-sm text-[var(--brand-text-mid)]">No issues detected on this page.</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {panelTab === 'performance' && (
                                        <div className="space-y-6">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="p-4 bg-[var(--brand-surface-3)] rounded-xl border border-[var(--brand-border-1)]">
                                                    <span className="text-xs text-[var(--brand-text-faint)]">LCP</span>
                                                    <p className="text-xl font-bold text-brand-green">1.2s</p>
                                                </div>
                                                <div className="p-4 bg-[var(--brand-surface-3)] rounded-xl border border-[var(--brand-border-1)]">
                                                    <span className="text-xs text-[var(--brand-text-faint)]">CLS</span>
                                                    <p className="text-xl font-bold text-orange-500">0.15</p>
                                                </div>
                                                <div className="p-4 bg-[var(--brand-surface-3)] rounded-xl border border-[var(--brand-border-1)]">
                                                    <span className="text-xs text-[var(--brand-text-faint)]">FID</span>
                                                    <p className="text-xl font-bold text-brand-green">12ms</p>
                                                </div>
                                                <div className="p-4 bg-[var(--brand-surface-3)] rounded-xl border border-[var(--brand-border-1)]">
                                                    <span className="text-xs text-[var(--brand-text-faint)]">TTFB</span>
                                                    <p className="text-xl font-bold text-white">85ms</p>
                                                </div>
                                            </div>
                                            <div className="p-4 bg-black rounded-xl border border-[var(--brand-border-2)] font-mono text-xs text-[var(--brand-text-mid)]">
                                                <div className="flex justify-between mb-2"><span>DNS Lookup</span><span>12ms</span></div>
                                                <div className="flex justify-between mb-2"><span>TCP Handshake</span><span>24ms</span></div>
                                                <div className="flex justify-between mb-2"><span>SSL Handshake</span><span>35ms</span></div>
                                                <div className="flex justify-between text-white font-bold border-t border-[var(--brand-border-2)] pt-2"><span>Total</span><span>71ms</span></div>
                                            </div>
                                        </div>
                                    )}

                                    {panelTab === 'links' && (
                                        <div className="space-y-6">
                                            <div className="flex gap-4">
                                                <div className="flex-1 p-4 bg-[var(--brand-surface-3)] rounded-xl border border-[var(--brand-border-1)] text-center">
                                                    <span className="block text-2xl font-bold text-white">12</span>
                                                    <span className="text-xs text-[var(--brand-text-faint)]">Internal In-Links</span>
                                                </div>
                                                <div className="flex-1 p-4 bg-[var(--brand-surface-3)] rounded-xl border border-[var(--brand-border-1)] text-center">
                                                    <span className="block text-2xl font-bold text-white">4</span>
                                                    <span className="text-xs text-[var(--brand-text-faint)]">External Out-Links</span>
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-bold text-[var(--brand-text-mid)] uppercase tracking-wide mb-3">Linked From</h4>
                                                <div className="space-y-2">
                                                    {['/home', '/blog', '/features/analytics'].map((l, i) => (
                                                        <div key={i} className="flex items-center gap-2 text-xs p-2 rounded hover:bg-[var(--brand-surface-3)]/5 transition-colors cursor-pointer">
                                                            <LinkIcon size={12} className="text-[var(--brand-text-muted)]" />
                                                            <span className="text-blue-400">{l}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {panelTab === 'code' && (
                                        <div className="bg-[var(--brand-surface-0)] rounded-xl border border-[var(--brand-border-2)] p-4 font-mono text-xs overflow-x-auto text-[var(--brand-text-mid)] leading-relaxed">
                                            <div className="text-[var(--brand-text-faint)] select-none mb-2">view-source:{panelData.url}</div>
                                            <span className="text-blue-400">&lt;!DOCTYPE html&gt;</span><br />
                                            <span className="text-blue-400">&lt;html</span> <span className="text-purple-400">lang</span>=<span className="text-orange-300">"en"</span><span className="text-blue-400">&gt;</span><br />
                                            &nbsp;&nbsp;<span className="text-blue-400">&lt;head&gt;</span><br />
                                            &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-blue-400">&lt;title&gt;</span><span className="text-white">Page Title | Seesby</span><span className="text-blue-400">&lt;/title&gt;</span><br />
                                            &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-blue-400">&lt;meta</span> <span className="text-purple-400">name</span>=<span className="text-orange-300">"description"</span> <span className="text-purple-400">content</span>=<span className="text-orange-300">"..."</span><span className="text-blue-400">/&gt;</span><br />
                                            &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[var(--brand-text-faint)]">&lt;!-- Missing Canonical --&gt;</span><br />
                                            &nbsp;&nbsp;<span className="text-blue-400">&lt;/head&gt;</span><br />
                                            ...
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Context Help Panel Content */}
                        {activePanel === 'context_help' && panelData && (
                            <div className="p-6 space-y-6">
                                <div className="p-4 bg-[var(--brand-surface-3)] rounded-xl border border-[var(--brand-border-2)]">
                                    <h4 className="text-lg font-bold text-white mb-2">{panelData.title}</h4>
                                    <p className="text-[var(--brand-text-mid)] leading-relaxed text-sm">{panelData.desc}</p>
                                </div>

                                <div className="border-t border-[var(--brand-border-2)] pt-4">
                                    <h5 className="text-xs font-bold text-[var(--brand-text-faint)] uppercase tracking-widest mb-3">Why this matters</h5>
                                    <ul className="space-y-3">
                                        <li className="flex gap-3 text-sm text-[var(--brand-text-mid)]">
                                            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-green"></div>
                                            It directly impacts your ability to rank in search results.
                                        </li>
                                        <li className="flex gap-3 text-sm text-[var(--brand-text-mid)]">
                                            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-green"></div>
                                            Improving this usually leads to more traffic.
                                        </li>
                                    </ul>
                                </div>

                                <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20 flex gap-3">
                                    <Lightbulb className="text-blue-400 shrink-0" size={20} />
                                    <div>
                                        <p className="text-sm font-bold text-blue-400 mb-1">Quick Tip</p>
                                        <p className="text-xs text-[var(--brand-text-mid)]">Ask the AI Copilot to "Audit my site for {panelData.title}" to get specific fixes.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activePanel === 'competitor_add' && (
                            <div className="p-6 text-center text-[var(--brand-text-faint)]">Competitor Add Form Placeholder</div>
                        )}
                        {activePanel === 'keyword_detail' && (
                            <div className="p-6 text-center text-[var(--brand-text-faint)]">Keyword Detail Placeholder</div>
                        )}
                        {activePanel === 'insight' && (
                            <div className="p-6 text-center text-[var(--brand-text-faint)]">Insight Placeholder</div>
                        )}

                    </div>
                </div>

                {/* AI Copilot Overlay */}
                <CopilotOverlay isOpen={copilotOpen} onClose={() => setCopilotOpen(false)} />

            </div>
        </div>
    );
};

export default Dashboard;
