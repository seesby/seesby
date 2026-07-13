import React from 'react';
import {
  DataRow, Card, MetricPill, StatusBadge,
  formatNumber, formatPercent, formatSignedNumber,
} from '../../shared';
import { Sparkline } from '../../../right-sidebar/_shared';

export default function PerformanceTab({ page, hasTrend }: { page: any; hasTrend?: boolean }) {
  const reach = page?.socialReach ?? page?.totalReach ?? 0;
  const impressions = page?.socialImpressions ?? page?.totalImpressions ?? 0;
  const engagementRate = page?.socialEngagementRate ?? page?.engagementRate ?? 0;
  const followerGrowth = page?.followerGrowthRate ?? page?.socialFollowerGrowth ?? 0;
  const totalFollowers = page?.totalFollowers ?? page?.socialTotalFollowers ?? 0;
  const viralityRate = page?.viralityRate ?? page?.socialViralityRate ?? 0;
  const amplificationRate = page?.amplificationRate ?? page?.socialAmplificationRate ?? 0;
  const videoViews = page?.socialVideoViews ?? page?.totalVideoViews ?? 0;
  const clickThroughRate = page?.socialCtr ?? page?.socialClickThroughRate ?? 0;

  const platformStats = page?.socialPlatformStats || page?.platformPerformance || [];

  const prevEngagement = page?.prevSocialEngagementRate ?? 0;
  const prevReach = page?.prevSocialReach ?? 0;
  const prevFollowers = page?.prevTotalFollowers ?? 0;

  return (
    <div className="space-y-4">
      {/* Quick metrics */}
      <div className="grid grid-cols-5 gap-2">
        <MetricPill label="Reach" value={formatNumber(reach)} good={reach > 0} />
        <MetricPill label="Impressions" value={formatNumber(impressions)} good={impressions > 0} />
        <MetricPill label="Engagement" value={formatPercent(engagementRate)} good={Number(engagementRate) >= 0.03} />
        <MetricPill label="Followers" value={formatNumber(totalFollowers)} good={totalFollowers > 0} />
        <MetricPill label="Video Views" value={formatNumber(videoViews)} good={videoViews > 0} />
      </div>

      {/* Trend sparklines */}
      {hasTrend && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <Card title="Engagement Trend">
            <div className="bg-[#0a0a0a] border border-[#222] rounded p-3">
              <Sparkline values={page?.engagementTrend || []} tone="good" />
            </div>
          </Card>
          <Card title="Reach Trend">
            <div className="bg-[#0a0a0a] border border-[#222] rounded p-3">
              <Sparkline values={page?.reachTrend || page?.socialReachTrend || []} tone="info" />
            </div>
          </Card>
        </div>
      )}

      {/* Growth comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card title="Growth">
          <DataRow label="Engagement" value={formatPercent(engagementRate)} status={Number(engagementRate) >= 0.03 ? 'pass' : 'warn'} />
          <DataRow label="vs Previous" value={formatSignedNumber((Number(engagementRate) - Number(prevEngagement)) * 100) + '%'} status={Number(engagementRate) >= Number(prevEngagement) ? 'pass' : 'fail'} />
          <DataRow label="Follower Growth" value={formatPercent(followerGrowth)} status={Number(followerGrowth) >= 0 ? 'pass' : 'fail'} />
          <DataRow label="Reach" value={formatNumber(reach)} />
          <DataRow label="vs Previous" value={formatSignedNumber(reach - prevReach)} status={reach >= prevReach ? 'pass' : 'fail'} />
          <DataRow label="Total Followers" value={formatNumber(totalFollowers)} />
        </Card>

        <Card title="Advanced Metrics">
          <DataRow label="Virality Rate" value={formatPercent(viralityRate)} status={Number(viralityRate) >= 0.01 ? 'pass' : 'warn'} />
          <DataRow label="Amplification" value={formatPercent(amplificationRate)} status={Number(amplificationRate) >= 0.005 ? 'pass' : 'warn'} />
          <DataRow label="Click-through" value={formatPercent(clickThroughRate)} status={Number(clickThroughRate) >= 0.01 ? 'pass' : 'warn'} />
          <DataRow label="Impressions" value={formatNumber(impressions)} />
          <DataRow label="Impression/Reach" value={reach > 0 ? `${(impressions / reach).toFixed(1)}x` : '—'} />
        </Card>
      </div>

      {/* Platform breakdown */}
      <Card title="Platform Performance">
        {platformStats.length > 0 ? platformStats.map((ps: any, i: number) => {
          const platform = ps.platform || ps.name || `Platform ${i + 1}`;
          const followers = ps.followers ?? 0;
          const eng = ps.engagementRate ?? ps.engagement ?? 0;
          const growth = ps.growthRate ?? ps.growth ?? 0;
          const impressions = ps.impressions ?? 0;
          return (
            <div key={i} className="py-2 border-b border-[#141414] last:border-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[12px] text-[#ccc] font-medium">{platform}</span>
                <StatusBadge
                  status={Number(eng) >= 0.03 ? 'pass' : Number(eng) >= 0.01 ? 'warn' : 'fail'}
                  label={formatPercent(eng)}
                />
              </div>
              <div className="grid grid-cols-3 gap-3 text-[10px]">
                <div>
                  <span className="text-[#555]">Followers: </span>
                  <span className="text-[#ccc]">{formatNumber(followers)}</span>
                </div>
                <div>
                  <span className="text-[#555]">Growth: </span>
                  <span className={Number(growth) >= 0 ? 'text-green-400' : 'text-red-400'}>{formatPercent(growth)}</span>
                </div>
                <div>
                  <span className="text-[#555]">Impressions: </span>
                  <span className="text-[#ccc]">{formatNumber(impressions)}</span>
                </div>
              </div>
            </div>
          );
        }) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {['Twitter', 'Facebook', 'LinkedIn', 'Instagram', 'YouTube', 'TikTok'].map((platform) => (
              <div key={platform} className="py-2">
                <div className="text-[11px] text-[#ccc] font-medium mb-1">{platform}</div>
                <div className="text-[10px] text-[#555]">No data</div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
