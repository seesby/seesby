import React, { useEffect, useState } from 'react';
import { 
  Bot, 
  Play, 
  Settings2, 
  History, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ChevronRight,
  ShieldCheck,
  Monitor,
  TrendingDown,
  Link,
  PieChart,
  Users,
  Mail,
  MoreVertical,
  Activity
} from 'lucide-react';
import { useSeoCrawler } from '../../../contexts/SeoCrawlerContext';
import { useOptionalProject } from '../../../services/ProjectContext';

interface Agent {
  id: string;
  name: string;
  trigger: 'cron' | 'event';
  schedule: string;
  enabled: boolean;
  config: any;
  lastRun: {
    status: string;
    summary: string;
    completedAt: string;
  } | null;
}

interface AgentRun {
  id: string;
  status: string;
  summary: string;
  findingsCount: number;
  tasksCreated: number;
  startedAt: string;
  completedAt: string;
  durationMs: number;
}

const AGENT_ICONS: Record<string, React.ReactNode> = {
  'issue-fixer': <ShieldCheck size={18} className="text-[#F59E0B]" />,
  'content-monitor': <Monitor size={18} className="text-[#36F5A0]" />,
  'rank-guard': <TrendingDown size={18} className="text-[#36A0F5]" />,
  'link-watcher': <Link size={18} className="text-[#F5A036]" />,
  'traffic-analyst': <PieChart size={18} className="text-[#A036F5]" />,
  'competitor-scout': <Users size={18} className="text-[#F536E0]" />,
  'outreach-bot': <Mail size={18} className="text-[#E0F536]" />,
};

export default function AgentsTab() {
  const projectContext = useOptionalProject();
  const projectId = projectContext?.activeProject?.id;
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [isRunsLoading, setIsRunsLoading] = useState(false);

  const fetchAgents = async () => {
    if (!projectId) {
      setIsLoading(false);
      return;
    }
    try {
      const res = await fetch(`/api/internal/projects/${projectId}/agents`);
      const json = await res.json();
      if (json.data) setAgents(json.data);
    } catch (err) {
      console.error('Failed to fetch agents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRuns = async (agentId: string) => {
    setIsRunsLoading(true);
    try {
      const res = await fetch(`/api/internal/projects/${projectId}/agents/${agentId}/runs`);
      const json = await res.json();
      if (json.data) setRuns(json.data);
    } catch (err) {
      console.error('Failed to fetch runs:', err);
    } finally {
      setIsRunsLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, [projectId]);

  useEffect(() => {
    if (selectedAgent) fetchRuns(selectedAgent.id);
  }, [selectedAgent]);

  const toggleAgent = async (agentId: string, enabled: boolean) => {
    try {
      await fetch(`/api/internal/projects/${projectId}/agents/${agentId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ enabled })
      });
      fetchAgents();
    } catch (err) {
      console.error('Failed to toggle agent:', err);
    }
  };

  const runNow = async (agentId: string) => {
    try {
      await fetch(`/api/internal/projects/${projectId}/agents/${agentId}/run`, {
        method: 'POST'
      });
      alert('Agent run triggered in background.');
    } catch (err) {
      console.error('Failed to trigger agent:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-10 h-10 border-2 border-[#F59E0B] border-t-transparent rounded-full animate-spin" />
        <p className="text-[#888] text-[12px] font-medium">Summoning AI Agents...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {!selectedAgent ? (
        <div className="grid grid-cols-1 gap-4">
          {agents.map((agent) => (
            <div 
              key={agent.id}
              className={`group relative bg-[#0a0a0a] border border-[#222] hover:border-[#444] rounded-2xl p-5 transition-all duration-300
                         ${!agent.enabled ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 rounded-xl bg-[#111] border border-[#222] flex items-center justify-center transition-transform group-hover:scale-110 duration-300">
                    {AGENT_ICONS[agent.id] || <Bot size={18} />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-[14px] font-bold text-white">{agent.name}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider
                                    ${agent.trigger === 'cron' ? 'bg-[#36A0F5]/10 text-[#36A0F5]' : 'bg-[#F536E0]/10 text-[#F536E0]'}`}>
                        {agent.trigger}
                      </span>
                    </div>
                    <p className="text-[#666] text-[12px] line-clamp-2 mb-3">
                      {agent.id === 'issue-fixer' && 'Analyzes crawl results and generates technical fixes.'}
                      {agent.id === 'content-monitor' && 'Monitors traffic and flags content decay or stale pages.'}
                      {agent.id === 'rank-guard' && 'Tracks ranking drops and correlates them with site changes.'}
                      {agent.id === 'link-watcher' && 'Monitors internal authority and link opportunities.'}
                      {agent.id === 'traffic-analyst' && 'Analyzes GA4 anomalies and site-wide traffic health.'}
                      {agent.id === 'competitor-scout' && 'Scouts competitor strategies and content moves.'}
                      {agent.id === 'outreach-bot' && 'Drafts personalized outreach for high-potential pages.'}
                    </p>
                    
                    {agent.lastRun && (
                      <div className="flex items-center gap-4 text-[11px]">
                        <span className="flex items-center gap-1.5 text-[#888]">
                          <Clock size={12} /> Last run {new Date(agent.lastRun.completedAt).toLocaleDateString()}
                        </span>
                        <span className={`flex items-center gap-1.5 
                                      ${agent.lastRun.status === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                          {agent.lastRun.status === 'success' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                          {agent.lastRun.summary}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3">
                  <div className="flex items-center gap-2">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={agent.enabled} 
                        onChange={(e) => toggleAgent(agent.id, e.target.checked)}
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-[#222] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#F59E0B]"></div>
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => runNow(agent.id)}
                      className="p-2 rounded-lg bg-[#111] border border-[#222] text-[#888] hover:text-white hover:border-[#444] transition-all"
                      title="Run Now"
                    >
                      <Play size={14} />
                    </button>
                    <button 
                      onClick={() => setSelectedAgent(agent)}
                      className="p-2 rounded-lg bg-[#111] border border-[#222] text-[#888] hover:text-white hover:border-[#444] transition-all"
                      title="View History"
                    >
                      <History size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-[#222] pb-6">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setSelectedAgent(null)}
                className="p-2 rounded-lg hover:bg-[#111] text-[#888] hover:text-white transition-all"
              >
                <ChevronRight size={20} className="rotate-180" />
              </button>
              <div>
                <h3 className="text-[16px] font-bold text-white flex items-center gap-2">
                  {AGENT_ICONS[selectedAgent.id]} {selectedAgent.name} History
                </h3>
                <p className="text-[12px] text-[#666]">Viewing latest 50 autonomous runs</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {isRunsLoading ? (
              <div className="py-12 flex justify-center text-[#444]">Loading history...</div>
            ) : runs.length === 0 ? (
              <div className="py-20 border-2 border-dashed border-[#111] rounded-2xl flex flex-col items-center justify-center text-center">
                <Activity size={32} className="text-[#222] mb-4" />
                <p className="text-[#888] text-[14px]">No runs recorded yet.</p>
                <button onClick={() => runNow(selectedAgent.id)} className="mt-4 text-[#F59E0B] text-[12px] font-bold">Try Manual Execution</button>
              </div>
            ) : (
              runs.map((run) => (
                <div key={run.id} className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`w-2 h-2 rounded-full ${run.status === 'success' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]'}`} />
                    <div className="flex-1">
                      <p className="text-white text-[12px] font-medium mb-1">{run.summary}</p>
                      <div className="flex items-center gap-4 text-[10px] text-[#555]">
                        <span>{new Date(run.startedAt).toLocaleString()}</span>
                        <span>{Math.round(run.durationMs / 1000)}s duration</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-[11px]">
                    <div className="text-center">
                      <p className="text-white font-bold">{run.findingsCount}</p>
                      <p className="text-[#444] uppercase tracking-tighter">Findings</p>
                    </div>
                    <div className="text-center">
                      <p className="text-white font-bold">{run.tasksCreated}</p>
                      <p className="text-[#444] uppercase tracking-tighter">Tasks Created</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
