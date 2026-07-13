import React from 'react';
import { Navbar } from '../components/Navbar';
import { Card } from '../components/Card';
import { 
  TrendingUp, Users, DollarSign, Activity, 
  Calendar, Target, ArrowUpRight, ArrowDownRight,
  PieChart as PieChartIcon, BarChart2, Layers
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, LineChart, Line, ComposedChart
} from 'recharts';

// Data from Business Plan PDF (Part 6 & 9)

const revenueProjections = [
  { year: 'Year 1', agency: 0.54, saas: 0.15, total: 0.69, profit: -0.04 }, // In Millions
  { year: 'Year 2', agency: 3.36, saas: 1.26, total: 4.62, profit: 1.1 },
  { year: 'Year 3', agency: 8.64, saas: 5.04, total: 13.68, profit: 3.2 },
];

const unitEconomics = [
  { model: 'Agency', cac: 300, ltv: 198000, ratio: '1:660', payback: '0.6 mo' },
  { model: 'SaaS', cac: 38, ltv: 680, ratio: '1:18', payback: '3.5 mo' },
];

const monthlyBurn = [
    { month: 'Jan', burn: 35, revenue: 8 },
    { month: 'Feb', burn: 36, revenue: 15 },
    { month: 'Mar', burn: 38, revenue: 24 }, // Q1 End
    { month: 'Apr', burn: 40, revenue: 35 },
    { month: 'May', burn: 42, revenue: 48 },
    { month: 'Jun', burn: 45, revenue: 65 }, // Breakeven approx
];

const roadmap = [
    { phase: 'Phase 1: Foundation', time: 'Months 1-4', status: 'completed', focus: 'Core Platform & Beta' },
    { phase: 'Phase 2: Launch', time: 'Months 5-8', status: 'active', focus: 'AI Visibility Index & Sales' },
    { phase: 'Phase 3: Scale', time: 'Months 9-12', status: 'upcoming', focus: 'Automation Engine & Mobile' },
    { phase: 'Phase 4: Optimization', time: 'Months 13-18', status: 'upcoming', focus: 'White-label & Expansion' },
];

const Board: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#050505] font-sans text-gray-200 selection:bg-brand-amber selection:text-white">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
            <div>
                <h1 className="text-3xl md:text-4xl font-heading font-bold text-white mb-2">Investor Board Deck</h1>
                <p className="text-gray-400">Strategic overview, financial projections, and execution roadmap.</p>
            </div>
            <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-brand-green/10 text-brand-green text-xs font-bold border border-brand-green/20 uppercase tracking-wide flex items-center gap-2">
                    <Activity size={14} /> On Track
                </span>
                <span className="px-3 py-1 rounded-full bg-white/5 text-gray-400 text-xs font-bold border border-white/10 uppercase tracking-wide">
                    Q1 2026
                </span>
            </div>
        </div>

        {/* Top Level KPI Cards (Year 1 Targets) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <BoardCard 
                label="Revenue Target (Y1)" 
                value="$691.2K" 
                sub="Combined Agency + SaaS"
                icon={<DollarSign size={20} className="text-brand-green"/>}
            />
            <BoardCard 
                label="Current Burn Rate" 
                value="$39K" 
                sub="/ month"
                icon={<Activity size={20} className="text-red-500"/>}
            />
            <BoardCard 
                label="Runway" 
                value="14 Mo" 
                sub="Until Series A"
                icon={<Calendar size={20} className="text-brand-yellow"/>}
            />
            <BoardCard 
                label="Gross Margin" 
                value="71%" 
                sub="Target: 75%+"
                icon={<TrendingUp size={20} className="text-brand-purple"/>}
            />
        </div>

        {/* Main Financials Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
            
            {/* Revenue Projection Chart */}
            <div className="lg:col-span-2 bg-[#0F0F0F] border border-white/5 rounded-3xl p-8">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white font-heading">Financial Projections (3 Years)</h3>
                    <div className="flex gap-4 text-xs font-bold uppercase text-gray-500">
                        <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-brand-amber"></div> Agency</span>
                        <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-brand-purple"></div> SaaS</span>
                        <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-brand-green"></div> Net Profit</span>
                    </div>
                </div>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={revenueProjections} margin={{top: 20, right: 0, bottom: 0, left: 0}}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#222" />
                            <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fill: '#666', fontSize: 12}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#666', fontSize: 12}} unit="M" />
                            <Tooltip 
                                contentStyle={{backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px'}} 
                                formatter={(value: any) => [`$${value}M`, '']}
                            />
                            <Bar dataKey="agency" stackId="a" fill="#F59E0B" barSize={60} radius={[0,0,4,4]} />
                            <Bar dataKey="saas" stackId="a" fill="#7C3AED" barSize={60} radius={[4,4,0,0]} />
                            <Line type="monotone" dataKey="profit" stroke="#22C55E" strokeWidth={3} dot={{r: 6, fill: '#22C55E', stroke: '#000'}} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-6 grid grid-cols-3 gap-4 text-center border-t border-white/5 pt-6">
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold mb-1">Year 1 Rev</p>
                        <p className="text-xl font-bold text-white">$691K</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold mb-1">Year 2 Rev</p>
                        <p className="text-xl font-bold text-white">$4.62M</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold mb-1">Year 3 Rev</p>
                        <p className="text-xl font-bold text-white">$13.68M</p>
                    </div>
                </div>
            </div>

            {/* Path to Profitability */}
            <div className="bg-[#0F0F0F] border border-white/5 rounded-3xl p-8 flex flex-col">
                <h3 className="text-xl font-bold text-white font-heading mb-2">Path to Profitability</h3>
                <p className="text-sm text-gray-400 mb-6">Monthly Burn vs Revenue (Y1 First Half)</p>
                
                <div className="flex-1 min-h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={monthlyBurn}>
                            <defs>
                                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#222" />
                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#666', fontSize: 10}} />
                            <Tooltip contentStyle={{backgroundColor: '#111', border: '1px solid #333'}} />
                            <Area type="monotone" dataKey="revenue" stroke="#22C55E" fill="url(#colorRev)" name="Revenue ($K)" />
                            <Line type="step" dataKey="burn" stroke="#F59E0B" strokeDasharray="5 5" name="Burn Rate ($K)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-4 p-4 bg-brand-green/10 border border-brand-green/20 rounded-xl">
                    <div className="flex items-center gap-2 mb-1">
                        <Target size={16} className="text-brand-green" />
                        <span className="text-sm font-bold text-white">Breakeven Point</span>
                    </div>
                    <p className="text-xs text-gray-400">Projected Month 14-16. Operating cash flow positive by Q2 Year 2.</p>
                </div>
            </div>
        </div>

        {/* Unit Economics & Roadmap */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Unit Economics */}
            <div className="bg-[#0F0F0F] border border-white/5 rounded-3xl p-8">
                <h3 className="text-xl font-bold text-white font-heading mb-6">Unit Economics (Year 1)</h3>
                <div className="space-y-6">
                    {unitEconomics.map((item, i) => (
                        <div key={i} className="bg-white/[0.03] rounded-2xl p-6 border border-white/5">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="text-lg font-bold text-white">{item.model} Model</h4>
                                <span className={`px-3 py-1 rounded text-xs font-bold uppercase ${
                                    item.model === 'Agency' ? 'bg-brand-amber/10 text-brand-amber' : 'bg-brand-purple/10 text-brand-purple'
                                }`}>
                                    LTV:CAC {item.ratio}
                                </span>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold">CAC</p>
                                    <p className="text-xl font-mono text-white mt-1">${item.cac}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold">LTV</p>
                                    <p className="text-xl font-mono text-white mt-1">${item.ltv.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold">Payback</p>
                                    <p className="text-xl font-mono text-brand-green mt-1">{item.payback}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Execution Roadmap */}
            <div className="bg-[#0F0F0F] border border-white/5 rounded-3xl p-8">
                 <h3 className="text-xl font-bold text-white font-heading mb-6">Execution Roadmap (18 Months)</h3>
                 <div className="space-y-0 relative">
                     <div className="absolute top-4 bottom-4 left-[19px] w-0.5 bg-white/10"></div>
                     {roadmap.map((item, i) => (
                         <div key={i} className="relative pl-12 pb-8 last:pb-0">
                             <div className={`absolute left-0 top-1 w-10 h-10 rounded-full border-4 border-[#0F0F0F] flex items-center justify-center z-10 ${
                                 item.status === 'completed' ? 'bg-brand-green text-black' : 
                                 item.status === 'active' ? 'bg-brand-amber text-white' : 
                                 'bg-[#222] text-gray-500'
                             }`}>
                                 {item.status === 'completed' ? <ArrowDownRight size={18}/> : 
                                  item.status === 'active' ? <Activity size={18}/> : 
                                  <Layers size={18}/>}
                             </div>
                             <div className={`p-5 rounded-xl border transition-colors ${
                                 item.status === 'active' ? 'bg-white/[0.05] border-brand-amber/30' : 
                                 'bg-white/[0.02] border-white/5'
                             }`}>
                                 <div className="flex justify-between items-start mb-1">
                                     <h4 className={`font-bold ${item.status === 'active' ? 'text-white' : 'text-gray-400'}`}>{item.phase}</h4>
                                     <span className="text-[10px] uppercase font-bold bg-black/40 px-2 py-1 rounded text-gray-500">{item.time}</span>
                                 </div>
                                 <p className="text-sm text-gray-500">{item.focus}</p>
                             </div>
                         </div>
                     ))}
                 </div>
            </div>

        </div>

      </div>
    </div>
  );
};

const BoardCard = ({ label, value, sub, icon }: any) => (
    <div className="bg-[#0F0F0F] border border-white/5 p-6 rounded-2xl hover:border-white/10 transition-colors">
        <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</span>
            <div className="p-2 bg-white/5 rounded-lg border border-white/5">{icon}</div>
        </div>
        <div className="text-3xl font-bold text-white font-heading mb-1">{value}</div>
        <div className="text-xs text-gray-500 font-medium">{sub}</div>
    </div>
);

export default Board;
