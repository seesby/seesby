import React from 'react';
import {
  DataRow, MetricPill, Card, TruncatedUrl, StatusBadge,
  formatNumber, formatPercent, getActions,
} from '../../shared';

export default function SummaryTab({ page, hasTrend }: { page: any; hasTrend?: boolean }) {
  const actions = getActions(page);
  const socialIssues = actions.filter((a: any) =>
    /social|brand|mention|engagement|profile|twitter|facebook|linkedin|ugc|reply|response/i.test(a.label || a.title || '')
  ).slice(0, 5);

  const socialScore = page?.socialVisibilityScore ?? page?.socialScore ?? 0;
  const mentionCount = page?.brandMentionCount ?? page?.socialMentionCount ?? 0;
  const sentimentScore = page?.sentimentScore ?? page?.socialSentimentScore ?? 0;
  const engagementRate = page?.socialEngagementRate ?? page?.engagementRate ?? 0;
  const socialTraffic = page?.socialTrafficSessions ?? page?.trafficFromSocial ?? 0;
  const ugcCount = page?.ugcCount ?? page?.userGeneratedContentCount ?? 0;
  const topChannel = page?.topSocialChannel ?? page?.socialTopChannel ?? '—';
  const responseRate = page?.responseRate ?? page?.socialResponseRate ?? 0;
  const followerGrowth = page?.followerGrowthRate ?? page?.socialFollowerGrowth ?? 0;

  const profiles = page?.socialProfiles || page?.brandSocialProfiles || [];
  const activeProfiles = profiles.filter((p: any) => p.followers > 0 || p.exists || p.active).length || profiles.length;

  const scoreTone = socialScore >= 70 ? 'good' : socialScore >= 40 ? 'mid' : 'bad';

  return (
    <div className="space-y-4">
      {/* Hero strip */}
      <div className="flex items-center gap-3 p-2.5 rounded-lg bg-gradient-to-r from-[var(--brand-surface-1)] to-[var(--brand-surface-0)] border border-[var(--brand-surface-3)]">
        <div className="flex-1 min-w-0">
          <div className="text-[13px] text-[var(--brand-text-strong)] font-semibold truncate">{page?.title || page?.url || 'Social Page'}</div>
          <div className="text-[11px] text-[var(--brand-text-faint)] font-mono truncate mt-0.5">{page?.url}</div>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <div className="relative w-10 h-10">
            <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15" fill="none" stroke="bg-[var(--brand-surface-3)]" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15" fill="none"
                stroke={scoreTone === 'good' ? '#22c55e' : scoreTone === 'mid' ? '#f59e0b' : '#ef4444'}
                strokeWidth="3"
                strokeDasharray={`${(socialScore / 100) * 94.25} 94.25`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-[var(--brand-text-strong)]">{socialScore}</span>
          </div>
        </div>
      </div>

      {/* Quick metrics */}
      <div className="grid grid-cols-5 gap-2">
        <MetricPill label="Mentions" value={formatNumber(mentionCount)} good={mentionCount > 0} />
        <MetricPill label="Sentiment" value={formatPercent(sentimentScore)} good={Number(sentimentScore) >= 70} />
        <MetricPill label="Engagement" value={formatPercent(engagementRate)} good={Number(engagementRate) >= 0.03} />
        <MetricPill label="Traffic" value={formatNumber(socialTraffic)} good={socialTraffic > 0} />
        <MetricPill label="UGC" value={formatNumber(ugcCount)} good={ugcCount > 0} />
      </div>

      {/* 2-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Brand Overview */}
        <Card title="Brand Overview">
          <DataRow label="Social Score" value={formatNumber(socialScore)} status={socialScore >= 70 ? 'pass' : socialScore >= 40 ? 'warn' : 'fail'} />
          <DataRow label="Brand Mentions" value={formatNumber(mentionCount)} />
          <DataRow label="Sentiment" value={formatPercent(sentimentScore)} status={Number(sentimentScore) >= 70 ? 'pass' : 'warn'} />
          <DataRow label="Top Channel" value={topChannel} />
          <DataRow label="Active Profiles" value={`${activeProfiles} / ${profiles.length || 6}`} />
          <DataRow label="Response Rate" value={formatPercent(responseRate)} status={Number(responseRate) >= 0.8 ? 'pass' : 'warn'} />
          <DataRow label="Follower Growth" value={formatPercent(followerGrowth)} status={Number(followerGrowth) >= 0 ? 'pass' : 'fail'} />
        </Card>

        {/* Engagement */}
        <Card title="Engagement">
          <DataRow label="Engagement Rate" value={formatPercent(engagementRate)} status={Number(engagementRate) >= 0.03 ? 'pass' : 'warn'} />
          <DataRow label="Shares" value={formatNumber(page?.totalShares ?? page?.socialShares)} />
          <DataRow label="Likes" value={formatNumber(page?.totalLikes ?? page?.socialLikes)} />
          <DataRow label="Comments" value={formatNumber(page?.totalComments ?? page?.socialComments)} />
          <DataRow label="Saves" value={formatNumber(page?.totalSaves ?? page?.socialSaves)} />
          <DataRow label="Click-through" value={formatPercent(page?.socialCtr ?? page?.socialClickThroughRate)} />
        </Card>
      </div>

      {/* Bottom row: Profiles + Flags */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <Card title="Profiles">
          {profiles.length > 0 ? profiles.slice(0, 4).map((p: any, i: number) => (
            <div key={i} className="flex items-center justify-between py-[3px]">
              <span className="text-[11px] text-[var(--brand-text-mid)]">{p.platform || p.name || `Profile ${i + 1}`}</span>
              <StatusBadge
                status={p.active || p.health === 'good' ? 'pass' : p.health === 'warning' ? 'warn' : 'info'}
                label={formatNumber(p.followers)}
              />
            </div>
          )) : (
            <div className="text-[11px] text-[var(--brand-text-faint)]">No profiles connected</div>
          )}
        </Card>

        <Card title="Traffic">
          <DataRow label="Social Sessions" value={formatNumber(socialTraffic)} />
          <DataRow label="Conv. Rate" value={formatPercent(page?.socialConversionRate)} status={Number(page?.socialConversionRate) >= 0.02 ? 'pass' : 'warn'} />
          <DataRow label="Revenue" value={page?.socialRevenue ? `$${formatNumber(page.socialRevenue, { maximumFractionDigits: 0 })}` : '—'} />
        </Card>

        <Card title={`Issues (${socialIssues.length})`}>
          {socialIssues.length > 0 ? (
            socialIssues.map((issue: any, i: number) => (
              <div key={`${issue.id}-${i}`} className="flex items-start gap-2 py-[3px]">
                <span className={`block w-1.5 h-1.5 rounded-full mt-0.5 shrink-0 ${
                  issue.type === 'error' ? 'bg-[#ef4444]' : issue.type === 'warning' ? 'bg-[#f59e0b]' : 'bg-[#6b7280]'
                }`} />
                <span className="text-[11px] text-[var(--brand-text-mid)]">{issue.label || issue.title}</span>
              </div>
            ))
          ) : (
            <div className="text-[11px] text-[var(--brand-text-faint)]">None critical</div>
          )}
        </Card>
      </div>
    </div>
  );
}
