import { useEffect, useState } from 'react';
import { Target, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { listCompetitors } from '@/services/DashboardDataService';
import { loadCompetitorProfiles } from '@/services/CrawlPersistenceService';

interface Props {
  projectId: string;
}

export default function CompetitiveScoreWidget({ projectId }: Props) {
  const [data, setData] = useState<{
    score: number;
    rank: number;
    total: number;
    trend: 'up' | 'down' | 'neutral';
    topThreat: string | null;
    topOpportunity: string | null;
  } | null>(null);

  useEffect(() => {
    (async () => {
      const profiles = await loadCompetitorProfiles(projectId);
      if (profiles.length === 0) { setData(null); return; }

      // Find own profile (the one matching the project domain)
      // For now, use the profile with highest overallSeoScore as "own"
      // In a real implementation, own profile is stored separately
      const competitors = await listCompetitors(projectId);
      const compDomains = new Set(competitors.map(c => {
        try { return new URL(c.url).hostname.replace(/^www\./, ''); } catch { return ''; }
      }));

      const ownProfile = profiles.find(p => !compDomains.has(p.domain));
      const compProfiles = profiles.filter(p => compDomains.has(p.domain));

      if (!ownProfile || compProfiles.length === 0) { setData(null); return; }

      // Calculate competitive score (your score vs avg competitor)
      const yourScore = ownProfile.overallSeoScore || 0;
      const avgCompScore = Math.round(
        compProfiles.reduce((s, p) => s + (p.overallSeoScore || 0), 0) / compProfiles.length
      );

      // Rank
      const allScores = [yourScore, ...compProfiles.map(p => p.overallSeoScore || 0)]
        .sort((a, b) => b - a);
      const rank = allScores.indexOf(yourScore) + 1;

      // Top threat (highest threat level competitor)
      const topThreat = compProfiles
        .filter(p => (p.threatLevel || 0) > 50)
        .sort((a, b) => (b.threatLevel || 0) - (a.threatLevel || 0))[0]?.domain || null;

      // Top opportunity (where you have highest opportunityAgainstThem)
      const topOpp = compProfiles
        .sort((a, b) => (b.opportunityAgainstThem || 0) - (a.opportunityAgainstThem || 0))[0]?.domain || null;

      setData({
        score: yourScore,
        rank,
        total: compProfiles.length + 1,
        trend: yourScore > avgCompScore ? 'up' : yourScore < avgCompScore ? 'down' : 'neutral',
        topThreat,
        topOpportunity: topOpp,
      });
    })();
  }, [projectId]);

  if (!data) {
    return (
      <div className="rounded-2xl border border-white/5 bg-[#0F0F0F] p-5">
        <div className="flex items-center gap-2 mb-3">
          <Target size={16} className="text-[#F59E0B]" />
          <span className="text-[13px] font-bold text-white">Competitive Position</span>
        </div>
        <p className="text-[12px] text-[#666]">Add competitors in the crawler to see your competitive score.</p>
      </div>
    );
  }

  const TrendIcon = data.trend === 'up' ? TrendingUp : data.trend === 'down' ? TrendingDown : Minus;
  const trendColor = data.trend === 'up' ? 'text-green-400' : data.trend === 'down' ? 'text-red-400' : 'text-[#666]';

  return (
    <div className="rounded-2xl border border-white/5 bg-[#0F0F0F] p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target size={16} className="text-[#F59E0B]" />
          <span className="text-[13px] font-bold text-white">Competitive Position</span>
        </div>
        <div className={`flex items-center gap-1 ${trendColor}`}>
          <TrendIcon size={14} />
          <span className="text-[11px] font-bold">
            {data.trend === 'up' ? 'Leading' : data.trend === 'down' ? 'Behind' : 'Even'}
          </span>
        </div>
      </div>

      {/* Score and rank */}
      <div className="flex items-end gap-4 mb-4">
        <div>
          <div className="text-[36px] font-black text-white leading-none">{data.score}</div>
          <div className="text-[11px] text-[#666] mt-1">SEO Score</div>
        </div>
        <div className="mb-1">
          <div className="text-[18px] font-bold text-[#888]">
            #{data.rank}<span className="text-[12px] text-[#555]">/{data.total}</span>
          </div>
          <div className="text-[11px] text-[#666]">Rank</div>
        </div>
      </div>

      {/* Threat / Opportunity */}
      <div className="space-y-2">
        {data.topThreat && (
          <div className="flex items-center gap-2 rounded-lg bg-red-500/5 border border-red-500/10 px-3 py-2">
            <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
            <span className="text-[11px] text-red-300">Top threat: <span className="font-medium text-red-200">{data.topThreat}</span></span>
          </div>
        )}
        {data.topOpportunity && (
          <div className="flex items-center gap-2 rounded-lg bg-green-500/5 border border-green-500/10 px-3 py-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
            <span className="text-[11px] text-green-300">Top opportunity vs: <span className="font-medium text-green-200">{data.topOpportunity}</span></span>
          </div>
        )}
      </div>
    </div>
  );
}
