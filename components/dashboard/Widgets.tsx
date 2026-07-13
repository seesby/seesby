import React from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { ArrowUp, ArrowDown, HelpCircle, Check, CheckCircle2, Lock, AlertTriangle, X, Link as LinkIcon, ArrowRight } from 'lucide-react';

export const KPICard: React.FC<any> = ({ title, value, trend, trendGood = true, icon, chartData, strokeColor, isScore, helpText, onHelp }) => (
    <div className="bg-[var(--brand-surface-1)] p-5 rounded-2xl border border-[var(--brand-border-1)] hover:border-[var(--brand-border-2)] hover:bg-[var(--brand-surface-3)]/[0.04] transition-all group relative overflow-hidden h-[140px] flex flex-col justify-between shadow-lg">
        
        {/* Top Row */}
        <div className="flex justify-between items-start relative z-10">
            <div>
                 <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-[var(--brand-text-faint)] uppercase tracking-wider block">{title}</span>
                    {helpText && (
                        <button onClick={(e) => { e.stopPropagation(); onHelp(title, helpText); }} className="text-[var(--brand-text-muted)] hover:text-[var(--brand-text-strong)] transition-colors">
                            <HelpCircle size={12}/>
                        </button>
                    )}
                 </div>
                 <div className="flex items-baseline gap-2">
                    <h3 className="text-2xl font-bold font-heading text-white tracking-tight">{value}{isScore && <span className="text-sm text-[var(--brand-text-muted)] font-normal">/100</span>}</h3>
                 </div>
            </div>
            <div className={`p-2 rounded-lg bg-[var(--brand-surface-3)] text-[var(--brand-text-mid)] group-hover:text-[var(--brand-text-strong)] transition-colors group-hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]`}>
                {icon}
            </div>
        </div>
        
        {/* Bottom Row: Sparkline & Trend */}
        <div className="relative h-10 w-full flex items-end justify-between mt-2">
            <div className="flex items-center gap-1.5 mb-1">
                <span className={`flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded ${trendGood ? 'text-brand-green bg-brand-green/10 border border-brand-green/20' : 'text-red-400 bg-red-400/10 border border-red-400/20'}`}>
                    {trendGood ? <ArrowUp size={10} className="mr-0.5"/> : <ArrowDown size={10} className="mr-0.5"/>}
                    {trend}
                </span>
                <span className="text-[10px] text-[var(--brand-text-muted)]">vs 30d</span>
            </div>
            
            {/* Sparkline */}
            <div className="absolute right-0 bottom-0 w-24 h-full opacity-50 group-hover:opacity-100 transition-opacity">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id={`grad-${title}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={strokeColor} stopOpacity={0.3}/>
                                <stop offset="95%" stopColor={strokeColor} stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <Area 
                            type="monotone" 
                            dataKey="v" 
                            stroke={strokeColor} 
                            strokeWidth={2} 
                            fill={`url(#grad-${title})`} 
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    </div>
);

export const StrategicCard: React.FC<any> = ({ title, value, sub, desc, trend, severity, icon }) => (
    <div className={`p-6 rounded-3xl border backdrop-blur-md bg-[var(--brand-surface-1)] transition-all hover:bg-[var(--brand-surface-3)]/[0.04] group hover:-translate-y-1 duration-300 ${
        severity === 'critical' ? 'border-red-500/20 hover:border-red-500/40 hover:shadow-[0_0_20px_rgba(239,68,68,0.1)]' : 
        severity === 'warning' ? 'border-orange-500/20 hover:border-orange-500/40 hover:shadow-[0_0_20px_rgba(249,115,22,0.1)]' : 
        'border-[var(--brand-border-2)] hover:border-[var(--brand-border-3)] hover:shadow-lg'
    }`}>
        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-2xl ${
                severity === 'critical' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                severity === 'warning' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' :
                'bg-brand-green/10 text-brand-green border border-brand-green/20'
            }`}>
                {icon}
            </div>
            {severity === 'critical' && <span className="px-2 py-1 rounded text-[10px] font-bold bg-red-500 text-white uppercase tracking-wide shadow-glow-sm">Critical</span>}
        </div>
        <span className="text-xs font-bold text-[var(--brand-text-faint)] uppercase tracking-wider block mb-1">{title}</span>
        <div className="flex items-baseline gap-2 mb-3">
            <span className="text-3xl font-extrabold text-white tracking-tight font-heading">{value}</span>
            <span className="text-xs text-[var(--brand-text-mid)] font-medium">{sub}</span>
        </div>
        <p className="text-xs text-[var(--brand-text-mid)] leading-relaxed group-hover:text-[var(--brand-text-mid)] transition-colors">{desc}</p>
    </div>
);

export const DataCard = ({ title, value, status, icon }: any) => (
    <div className="bg-[var(--brand-surface-1)] rounded-2xl border border-[var(--brand-border-1)] p-5 flex flex-col justify-between hover:border-[var(--brand-border-3)] transition-all group">
        <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-[var(--brand-text-faint)] uppercase tracking-wide group-hover:text-[var(--brand-text-mid)] transition-colors">{title}</span>
            <div className={`p-2 rounded-lg ${status === 'good' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                {icon}
            </div>
        </div>
        <div className="text-2xl font-bold text-white font-heading">{value}</div>
    </div>
);

export const TechCard: React.FC<any> = ({ title, metric, status, desc, color, icon }) => (
    <div className="bg-[var(--brand-surface-1)] rounded-3xl border border-[var(--brand-border-1)] p-6 relative overflow-hidden group hover:border-[var(--brand-border-3)] transition-all">
        <div className={`absolute top-0 right-0 w-32 h-32 opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 transition-opacity duration-500 ${color === 'red' ? 'bg-red-500 group-hover:opacity-20' : 'bg-brand-green group-hover:opacity-20'}`}></div>
        <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className={`p-2 rounded-lg ${color === 'red' ? 'bg-red-500/10 text-red-500' : 'bg-brand-green/10 text-brand-green'}`}>
                {icon}
            </div>
            <div>
                <h3 className="font-bold text-white text-sm">{title}</h3>
                <p className="text-[10px] text-[var(--brand-text-faint)]">{desc}</p>
            </div>
        </div>
        <div className="flex items-end justify-between relative z-10">
            <div className="text-3xl font-bold text-white font-heading">{metric}</div>
            <span className={`text-xs font-bold px-2 py-1 rounded border ${
                color === 'red' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-brand-green/10 text-brand-green border-brand-green/20'
            }`}>{status}</span>
        </div>
        <div className="w-full h-1.5 bg-[var(--brand-surface-2)] rounded-full overflow-hidden mt-4 relative z-10">
            <div className={`h-full rounded-full ${color === 'red' ? 'bg-red-500 w-[80%]' : 'bg-brand-green w-[20%]'}`}></div>
        </div>
    </div>
);

export const TechnicalRow: React.FC<any> = ({ label, status, msg }) => (
    <div className="flex items-center justify-between group hover:bg-[var(--brand-surface-3)]/[0.02] p-2 rounded-lg -mx-2 transition-colors cursor-default">
        <span className="text-sm text-[var(--brand-text-mid)] font-medium group-hover:text-[var(--brand-text-strong)] transition-colors">{label}</span>
        <div className="flex items-center gap-3">
            {msg && <span className="text-xs font-bold text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">{msg}</span>}
            {status === 'secure' && <div className="flex items-center gap-2 text-brand-green text-xs font-bold"><Lock size={14}/> Secure</div>}
            {status === 'good' && <div className="w-6 h-6 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green border border-brand-green/20 shadow-[0_0_8px_rgba(34,197,94,0.2)]"><Check size={12} strokeWidth={3}/></div>}
            {status === 'warning' && <div className="w-6 h-6 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/20 shadow-[0_0_8px_rgba(249,115,22,0.2)]"><AlertTriangle size={12}/></div>}
            {status === 'error' && <div className="w-6 h-6 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20 shadow-[0_0_8px_rgba(239,68,68,0.2)]"><X size={12}/></div>}
        </div>
    </div>
);

export const FilterButton = ({ label, count, active, onClick, color = 'gray' }: any) => {
    const activeClass = 
        color === 'red' ? 'bg-red-50 text-white border-red-500 shadow-glow-sm' :
        color === 'orange' ? 'bg-orange-50 text-white border-orange-500 shadow-glow-sm' :
        color === 'blue' ? 'bg-blue-50 text-white border-blue-500 shadow-glow-sm' :
        color === 'green' ? 'bg-green-50 text-white border-green-500 shadow-glow-sm' :
        'bg-[var(--brand-surface-3)] text-black border-[var(--brand-border-2)] shadow-lg';

    const inactiveClass = 'bg-[var(--brand-surface-3)]/[0.03] text-[var(--brand-text-mid)] border-[var(--brand-border-2)] hover:bg-[var(--brand-surface-4)] hover:text-[var(--brand-text-strong)]';

    return (
        <button 
            onClick={onClick}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase flex items-center gap-2 border transition-all duration-300 ${active ? activeClass : inactiveClass}`}
        >
            {label} <span className={`px-1.5 py-0.5 rounded text-[10px] ${active ? 'bg-black/20 text-white' : 'bg-[var(--brand-surface-4)] text-[var(--brand-text-faint)]'}`}>{count}</span>
        </button>
    )
}

export const LinkOpportunity: React.FC<any> = ({ source, target, anchor, impact }) => (
    <div className="p-4 bg-[var(--brand-surface-3)]/[0.03] rounded-2xl border border-[var(--brand-border-1)] flex flex-col gap-4 hover:border-[var(--brand-border-2)] transition-colors group">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-2 py-1 rounded border uppercase tracking-wide ${
                    impact === 'High' ? 'bg-brand-green/10 text-brand-green border-brand-green/20' : 
                    'bg-gray-500/10 text-[var(--brand-text-faint)] border-gray-500/20'
                }`}>{impact} Value</span>
            </div>
            <button className="text-xs font-bold text-white bg-brand-amber hover:bg-brand-amberHover px-3 py-1.5 rounded-lg transition-all shadow-glow-sm opacity-0 group-hover:opacity-100 flex items-center gap-1">
                Auto-Link <LinkIcon size={10}/>
            </button>
        </div>
        <div className="flex items-center gap-3 text-xs relative">
            {/* Visual connector line */}
            <div className="absolute left-[50%] top-1/2 -translate-y-1/2 w-4 h-[1px] bg-[var(--brand-surface-4)]"></div>
            
            <div className="flex-1 p-3 bg-black/40 rounded-xl border border-[var(--brand-border-1)] text-[var(--brand-text-mid)] group-hover:border-[var(--brand-border-2)] transition-colors">
                <span className="text-[var(--brand-text-muted)] block text-[9px] uppercase font-bold mb-1">Source Page</span>
                <div className="truncate font-medium">{source}</div>
            </div>
            <div className="z-10 bg-[var(--brand-surface-2)] p-1 rounded-full border border-[var(--brand-border-2)] text-[var(--brand-text-faint)]"><ArrowRight size={12}/></div>
             <div className="flex-1 p-3 bg-black/40 rounded-xl border border-[var(--brand-border-1)] text-white group-hover:border-[var(--brand-border-2)] transition-colors">
                <span className="text-brand-green block text-[9px] uppercase font-bold mb-1">Target Page</span>
                <div className="truncate font-medium">{target}</div>
            </div>
        </div>
        <div className="text-xs text-[var(--brand-text-faint)] px-1 flex items-center gap-2">
            Suggested Text: <span className="text-white font-mono bg-[var(--brand-surface-4)] px-2 py-0.5 rounded border border-[var(--brand-border-1)]">"{anchor}"</span>
        </div>
    </div>
);

export const ExternalLinkIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--brand-text-muted)] hover:text-[var(--brand-text-strong)] cursor-pointer">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
        <polyline points="15 3 21 3 21 9"></polyline>
        <line x1="10" y1="14" x2="21" y2="3"></line>
    </svg>
)
