import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip, BarChart, Bar, Cell, PieChart, Pie } from 'recharts';
import { MonitorPlay, Target, Share2, Activity, HelpCircle, Sparkles, Send, Plus, SearchCheck, ArrowUp, ArrowDown, ArrowRight, AlertTriangle, CheckCircle2, Zap } from 'lucide-react';
import { KPICard } from './Widgets';
import { performanceData, sparklineData1, sparklineData2, sparklineData3, sparklineData4, distributionData } from '../../data/mockData';
import { useProject } from '../../services/ProjectContext';
import { fetchProjectCrawlerIntegrations } from '../../services/CrawlerIntegrationsService';
import { getLatestAuditResult, getAuditAggregatedMetrics, getAuditPages } from '../../services/CrawlPersistenceService';
import { generateDashboardInsights } from '../../services/AppIntelligenceService';
import { getProjectMetrics } from '../../services/DashboardDataService';
import { openCrawler } from '../../services/CrawlerLauncher';

export const DashboardOverview = ({ openPanel, topMovers, competitorData, showHelp }: any) => {
    const { activeProject } = useProject();
    const [chatInput, setChatInput] = useState('');
    const [insights, setInsights] = useState<any[]>([]);
    const [loadingInsights, setLoadingInsights] = useState(true);
    const [visibilityScore, setVisibilityScore] = useState<number | null>(null);
    const [visibilityTrend, setVisibilityTrend] = useState<string | null>(null);
    const [avgPosition, setAvgPosition] = useState<string>('...');
    const [mentionCount, setMentionCount] = useState<string>('...');
    const [siteHealthScore, setSiteHealthScore] = useState<string>('...');
    const [gscData, setGscData] = useState<any[]>([]);
    const [totalClicks, setTotalClicks] = useState<number | null>(null);
    const [totalSessions, setTotalSessions] = useState<number | null>(null);
    const [loadingGsc, setLoadingGsc] = useState(true);
    const [crawlStatus, setCrawlStatus] = useState<any>(null);

    useEffect(() => {
        const fetchInsights = async () => {
            if (!activeProject) return;
            setLoadingInsights(true);
            try {
                const generated = await generateDashboardInsights(activeProject.id);
                if (generated) {
                    setInsights(generated.insights);
                    setVisibilityScore(generated.visibility.overallScore);
                    const trendPrefix = generated.visibility.trend === 'up' ? '+' : '-';
                    setVisibilityTrend(`${trendPrefix}${generated.visibility.trendValue}%`);
                }

                const projectMetrics = await getProjectMetrics(activeProject.id);
                setAvgPosition(projectMetrics.avgPosition ? projectMetrics.avgPosition.toFixed(1) : '—');
                setMentionCount(projectMetrics.mentionCount.toLocaleString());

                const latestAudit = await getLatestAuditResult(activeProject.id);
                if (latestAudit) {
                    setSiteHealthScore(latestAudit.score?.toString() || '—');
                    
                    // Fetch aggregated metrics from the audit instead of real-time API call
                    const metrics = await getAuditAggregatedMetrics(latestAudit.id);
                    if (metrics && (metrics.gscClicks > 0 || metrics.ga4Sessions > 0)) {
                        setTotalClicks(metrics.gscClicks);
                        setTotalSessions(metrics.ga4Sessions);
                        setLoadingGsc(false);
                    }

                    const auditPages = await getAuditPages(latestAudit.id, 0, 8);
                    const syncedPages = auditPages.pages
                        .filter((page: any) => Number(page.gsc_clicks || 0) > 0 || Number(page.ga4_sessions || 0) > 0)
                        .map((page: any) => ({
                            keys: [page.url],
                            clicks: Number(page.gsc_clicks || 0),
                            impressions: Number(page.gsc_impressions || 0),
                            position: Number(page.gsc_position || 0),
                            sessions: Number(page.ga4_sessions || 0)
                        }));
                    setGscData(syncedPages);
                } else {
                    setSiteHealthScore('—');
                }

                // Fallback to real-time fetch if no audit data exists or if specifically requested
                if (loadingGsc) {
                    const integrationResult = await fetchProjectCrawlerIntegrations(activeProject.id);
                    const gscConnection = integrationResult.connections.google;

                    if (gscConnection && (gscConnection.selection?.siteUrl || gscConnection.metadata?.siteUrl)) {
                        console.info('[DashboardOverview] GSC fallback skipped because crawler integrations no longer expose client-side tokens.');
                    }
                    setLoadingGsc(false);
                }

            } finally {
                setLoadingGsc(false);
                setLoadingInsights(false);
            }
        };

        fetchInsights();

        if (activeProject?.id) {
            setCrawlStatus(null);
        }
    }, [activeProject?.id]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-bold font-heading text-white">Project Performance</h2>
                <button 
                    onClick={() => openCrawler(activeProject?.id, { view: 'main' })}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                >
                    <Zap size={14} />
                    Open in Crawler
                </button>
            </div>

            {/* Live Crawl Banner */}
            {crawlStatus && crawlStatus.status === 'running' && (
                <div className="bg-brand-amber/10 border border-brand-amber/20 rounded-xl p-4 flex items-center justify-between animate-pulse mb-6">
                    <div className="flex items-center gap-4">
                        <div className="bg-brand-amber p-2 rounded-lg shadow-lg shadow-brand-amber/20">
                            <Activity size={20} className="text-white" />
                        </div>
                        <div>
                            <h4 className="text-white font-bold text-sm">Site Audit in Progress</h4>
                            <p className="text-brand-amber/70 text-xs mt-0.5">Crawling {crawlStatus.currentUrl || 'site'}... {crawlStatus.urlsCrawled} pages found.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden md:block">
                            <span className="text-white font-bold text-sm font-mono">{crawlStatus.progress}%</span>
                            <div className="w-32 bg-white/10 rounded-full h-1 mt-1">
                                <div className="bg-brand-amber h-full rounded-full transition-all duration-500" style={{ width: `${crawlStatus.progress}%` }}></div>
                            </div>
                        </div>
                        <button onClick={() => openPanel('crawler_progress')} className="bg-brand-amber hover:bg-brand-amber/80 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors">
                            View Progress
                        </button>
                    </div>
                </div>
            )}

            {/* 1. Modern KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                    title="Visibility Score"
                    value={visibilityScore ? `${visibilityScore}%` : '—'}
                    trend={visibilityTrend || '—'}
                    status={visibilityTrend?.startsWith('+') ? 'up' : 'down'}
                    data={sparklineData1}
                    icon={<MonitorPlay size={18} />}
                    showHelp={() => showHelp("Visibility Score", "An aggregated metric representing your average position and impression share for tracked keywords.")}
                />
                <KPICard
                    title="Avg Position"
                    value={avgPosition}
                    trend="-0.4"
                    status="up" // Up is good for position decreasing
                    data={sparklineData2}
                    icon={<Target size={18} />}
                    showHelp={() => showHelp("Avg Position", "The average ranking of your website across all tracked keywords in Search Console.")}
                />
                <KPICard
                    title="Brand Mentions"
                    value={mentionCount}
                    trend="+12%"
                    status="up"
                    data={sparklineData3}
                    icon={<Share2 size={18} />}
                    showHelp={() => showHelp("Brand Mentions", "Total number of times your brand was mentioned across the web in the last 30 days.")}
                />
                <KPICard
                    title="Site Health"
                    value={siteHealthScore !== '—' ? `${siteHealthScore}%` : '—'}
                    trend={Number(siteHealthScore) > 90 ? 'Healthy' : 'Needs Work'}
                    status={Number(siteHealthScore) > 85 ? 'up' : 'down'}
                    data={sparklineData4}
                    icon={<Activity size={18} />}
                    showHelp={() => showHelp("Site Health", "A technical SEO score based on crawl errors, performance metrics, and content quality.")}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 2. Primary Traffic Chart */}
                <div className="lg:col-span-2 bg-[#0F0F0F] rounded-3xl border border-white/5 p-6 shadow-2xl h-[450px] flex flex-col relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand-amber/5 blur-[100px] rounded-full pointer-events-none"></div>
                    
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 z-10">
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-lg font-bold text-white font-heading">Organic Performance</h3>
                                <button onClick={() => showHelp("Organic Performance", "Combines clicks from Search Console and sessions from Google Analytics.")} className="text-gray-600 hover:text-white transition-colors"><HelpCircle size={14} /></button>
                            </div>
                            <p className="text-gray-500 text-xs mt-1 uppercase tracking-widest font-bold">Clicks & Sessions Trend</p>
                        </div>
                        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
                            <button className="px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-white text-black shadow-xl">30 Days</button>
                            <button className="px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-white transition-colors">90 Days</button>
                        </div>
                    </div>

                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={performanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#222" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#666', fontSize: 10 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#444', fontSize: 10 }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0A0A0A', border: '1px solid #222', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                                />
                                <Area type="monotone" dataKey="clicks" stroke="#F59E0B" strokeWidth={3} fillOpacity={1} fill="url(#colorClicks)" name="GSC Clicks" />
                                <Area type="monotone" dataKey="sessions" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorSessions)" name="GA4 Sessions" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/5 z-10">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Total Clicks</span>
                            <span className="text-xl font-bold text-white font-mono mt-1">{totalClicks?.toLocaleString() || '—'}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Total Sessions</span>
                            <span className="text-xl font-bold text-white font-mono mt-1">{totalSessions?.toLocaleString() || '—'}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">CTR</span>
                            <span className="text-xl font-bold text-brand-green font-mono mt-1">3.2%</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Bounce Rate</span>
                            <span className="text-xl font-bold text-orange-500 font-mono mt-1">42.1%</span>
                        </div>
                    </div>
                </div>

                {/* 3. AI Insights / Copilot Panel */}
                <div className="lg:col-span-1 bg-gradient-to-br from-[#111] to-[#0A0A0A] rounded-3xl border border-white/5 shadow-2xl flex flex-col h-[450px] relative overflow-hidden group">
                    <div className="p-6 border-b border-white/5 flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="bg-brand-purple p-2 rounded-lg shadow-lg shadow-brand-purple/20">
                                <Sparkles size={18} className="text-white" />
                            </div>
                            <h3 className="font-bold text-white font-heading">Copilot Insights</h3>
                        </div>
                        <span className="text-[10px] font-bold text-brand-purple uppercase tracking-widest bg-brand-purple/10 px-2 py-1 rounded">Live</span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide min-h-0">
                        {loadingInsights ? (
                            <div className="flex flex-col gap-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse"></div>
                                ))}
                            </div>
                        ) : insights.length > 0 ? (
                            insights.map((insight, idx) => (
                                <div key={idx} className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 hover:border-brand-purple/30 transition-all group/insight cursor-pointer hover:bg-white/[0.05]">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-xs font-bold text-gray-200 group-hover/insight:text-white transition-colors">{insight.title}</h4>
                                        <ArrowRight size={14} className="text-gray-600 group-hover/insight:translate-x-1 transition-all" />
                                    </div>
                                    <p className="text-[11px] text-gray-500 leading-relaxed group-hover/insight:text-gray-400 transition-colors">{insight.detail}</p>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12">
                                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Plus size={20} className="text-gray-600" />
                                </div>
                                <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">No New Insights</p>
                            </div>
                        )}
                    </div>

                    {/* Chat Input */}
                    <div className="p-4 border-t border-white/5 bg-[#050505] shrink-0">
                        <div className="relative">
                            <input
                                type="text"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                placeholder="Ask Copilot anything..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-xs text-white focus:outline-none focus:border-brand-purple/50 transition-all placeholder:text-gray-600"
                            />
                            <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-brand-purple hover:bg-brand-purple/80 text-white p-2 rounded-lg transition-colors">
                                <Send size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 4. Secondary Row: Rankings & Competitors */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
                <div className="bg-[#0F0F0F] rounded-3xl border border-white/5 p-6 h-[400px] flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-white">Top Performing Pages</h3>
                            <button onClick={() => showHelp("Top Performing Pages", "The pages on your site receiving the most organic search traffic based on GSC clicks.")} className="text-gray-600 hover:text-white transition-colors"><HelpCircle size={14} /></button>
                        </div>
                        <button onClick={() => openPanel('rank_tracker')} className="text-[10px] font-bold text-gray-500 hover:text-white uppercase tracking-widest">Full Tracker</button>
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <div className="overflow-x-auto h-full scrollbar-hide">
                            <table className="w-full text-left">
                                <thead className="text-[10px] font-bold text-gray-600 uppercase tracking-widest border-b border-white/5">
                                    <tr>
                                        <th className="pb-4">URL</th>
                                        <th className="pb-4 text-center">Clicks</th>
                                        <th className="pb-4 text-center">Impressions</th>
                                        <th className="pb-4 text-right">Avg Pos</th>
                                    </tr>
                                </thead>
                                <tbody className="text-xs">
                                    {loadingGsc ? (
                                        [1, 2, 3, 4, 5].map(i => (
                                            <tr key={i} className="animate-pulse">
                                                <td className="py-4"><div className="h-3 w-48 bg-white/5 rounded"></div></td>
                                                <td className="py-4 text-center"><div className="h-3 w-12 bg-white/5 rounded mx-auto"></div></td>
                                                <td className="py-4 text-center"><div className="h-3 w-16 bg-white/5 rounded mx-auto"></div></td>
                                                <td className="py-4 text-right"><div className="h-3 w-8 bg-white/5 rounded ml-auto"></div></td>
                                            </tr>
                                        ))
                                    ) : gscData.length > 0 ? (
                                        gscData.map((row, i) => (
                                            <tr key={i} className="group border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={() => openPanel('url_detail', { url: row.keys[0] })}>
                                                <td className="py-4 max-w-[200px] truncate text-blue-400 font-mono group-hover:text-blue-300">{row.keys[0]}</td>
                                                <td className="py-4 text-center font-bold text-white">{row.clicks.toLocaleString()}</td>
                                                <td className="py-4 text-center text-gray-500">{row.impressions.toLocaleString()}</td>
                                                <td className="py-4 text-right text-white">
                                                    <span className={`px-2 py-1 rounded ${row.position < 3 ? 'bg-green-500/10 text-green-500' : row.position < 10 ? 'bg-blue-500/10 text-blue-500' : 'bg-gray-500/10 text-gray-500'}`}>
                                                        {row.position.toFixed(1)}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="py-12 text-center text-gray-600">
                                                <SearchCheck size={32} className="mx-auto mb-3 opacity-20" />
                                                <p className="text-xs font-bold uppercase tracking-widest">Connect Search Console to see data</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="bg-[#0F0F0F] rounded-3xl border border-white/5 p-6 h-[400px] flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-white">Market Positioning</h3>
                            <button onClick={() => showHelp("Market Positioning", "How your search visibility compares to your primary competitors.")} className="text-gray-600 hover:text-white transition-colors"><HelpCircle size={14} /></button>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 text-[10px] text-gray-500 font-bold uppercase">
                                <div className="w-2 h-2 rounded-full bg-brand-amber"></div> You
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-gray-500 font-bold uppercase ml-2">
                                <div className="w-2 h-2 rounded-full bg-gray-600"></div> Competitors
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={distributionData} layout="vertical">
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={100} tick={{ fill: '#888', fontSize: 11, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ fill: 'white', fillOpacity: 0.05 }} contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }} />
                                <Bar dataKey="visibility" radius={[0, 4, 4, 0]} barSize={20}>
                                    {distributionData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.name === 'You' ? '#F59E0B' : '#333'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-6 bg-white/5 rounded-2xl p-4 border border-white/5">
                        <div className="flex items-start gap-3">
                            <Activity size={16} className="text-orange-500 mt-0.5" />
                            <p className="text-[11px] text-gray-400 leading-relaxed">
                                <span className="text-white font-bold">Threat Detected:</span> Competitor <span className="text-white">Acme Corp</span> has gained 12% impression share on your top 5 commercial keywords this week.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
