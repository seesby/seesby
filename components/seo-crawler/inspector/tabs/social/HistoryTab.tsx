import React from 'react';
import {
  DataRow, Card, MetricPill,
  formatNumber, formatPercent, formatSignedNumber,
} from '../../shared';
import { Sparkline } from '../../../right-sidebar/_shared';

export default function HistoryTab({ page, hasTrend }: { page: any; hasTrend?: boolean }) {
  if (!hasTrend) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-[13px] text-[#666] max-w-[280px]">
          Trend data available after 2+ crawls. Run another crawl to see historical trends.
        </div>
      </div>
    );
  }

  const mentionTrend = page?.mentionTrend || [];
  const engagementTrend = page?.engagementTrend || [];
  const socialTrafficTrend = page?.socialTrafficTrend || [];
  const followerTrend = page?.followerTrend || [];
  const sentimentTrend = page?.sentimentTrend || [];

  const currentMentions = page?.brandMentionCount ?? 0;
  const prevMentions = page?.prevBrandMentionCount ?? 0;
  const currentEngagement = page?.socialEngagementRate ?? 0;
  const prevEngagement = page?.prevSocialEngagementRate ?? 0;
  const currentTraffic = page?.socialTrafficSessions ?? 0;
  const prevTraffic = page?.prevSocialTrafficSessions ?? 0;
  const currentFollowers = page?.totalFollowers ?? 0;
  const prevFollowers = page?.prevTotalFollowers ?? 0;
  const currentSentiment = page?.sentimentScore ?? 0;
  const prevSentiment = page?.prevSentimentScore ?? 0;

  const metrics = [
    { label: 'Mentions', current: currentMentions, prev: prevMentions, trend: mentionTrend, format: (v: number) => formatNumber(v) },
    { label: 'Engagement', current: currentEngagement, prev: prevEngagement, trend: engagementTrend, format: (v: number) => formatPercent(v) },
    { label: 'Traffic', current: currentTraffic, prev: prevTraffic, trend: socialTrafficTrend, format: (v: number) => formatNumber(v) },
    { label: 'Followers', current: currentFollowers, prev: prevFollowers, trend: followerTrend, format: (v: number) => formatNumber(v) },
    { label: 'Sentiment', current: currentSentiment, prev: prevSentiment, trend: sentimentTrend, format: (v: number) => formatPercent(v) },
  ];

  return (
    <div className="space-y-4">
      {/* Metrics comparison */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {metrics.map((m, i) => {
          const diff = m.current - m.prev;
          const isPositive = m.label === 'Sentiment' ? diff >= 0 : diff >= 0;
          return (
            <Card key={i} title={m.label}>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div className="text-center">
                  <div className="text-[10px] text-[#555] uppercase tracking-widest">Current</div>
                  <div className="text-[12px] font-bold text-white">{m.format(m.current)}</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] text-[#555] uppercase tracking-widest">Previous</div>
                  <div className="text-[12px] font-bold text-[#888]">{m.format(m.prev)}</div>
                </div>
              </div>
              <div className="text-center mb-2">
                <span className={`text-[11px] font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                  {formatSignedNumber(diff)}
                </span>
              </div>
              {m.trend.length > 0 && (
                <div className="bg-[#0a0a0a] border border-[#222] rounded p-2">
                  <Sparkline values={m.trend} tone={isPositive ? 'good' : 'bad'} />
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* All trends stacked */}
      <Card title="Historical Trends">
        <div className="space-y-4">
          {mentionTrend.length > 0 && (
            <div>
              <div className="text-[10px] text-[#555] uppercase tracking-widest mb-1">Mentions</div>
              <div className="bg-[#0a0a0a] border border-[#222] rounded p-2">
                <Sparkline values={mentionTrend} tone="info" />
              </div>
            </div>
          )}
          {engagementTrend.length > 0 && (
            <div>
              <div className="text-[10px] text-[#555] uppercase tracking-widest mb-1">Engagement</div>
              <div className="bg-[#0a0a0a] border border-[#222] rounded p-2">
                <Sparkline values={engagementTrend} tone="good" />
              </div>
            </div>
          )}
          {socialTrafficTrend.length > 0 && (
            <div>
              <div className="text-[10px] text-[#555] uppercase tracking-widest mb-1">Social Traffic</div>
              <div className="bg-[#0a0a0a] border border-[#222] rounded p-2">
                <Sparkline values={socialTrafficTrend} tone="info" />
              </div>
            </div>
          )}
          {followerTrend.length > 0 && (
            <div>
              <div className="text-[10px] text-[#555] uppercase tracking-widest mb-1">Followers</div>
              <div className="bg-[#0a0a0a] border border-[#222] rounded p-2">
                <Sparkline values={followerTrend} tone="info" />
              </div>
            </div>
          )}
          {sentimentTrend.length > 0 && (
            <div>
              <div className="text-[10px] text-[#555] uppercase tracking-widest mb-1">Sentiment</div>
              <div className="bg-[#0a0a0a] border border-[#222] rounded p-2">
                <Sparkline values={sentimentTrend} tone="good" />
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
