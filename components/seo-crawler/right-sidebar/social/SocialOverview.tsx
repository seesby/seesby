import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useSocialInsights } from '../_hooks/useSocialInsights'
import { Card } from '../_shared/Card'
import { KpiTile } from '../_shared/KpiTile'
import { ProgressRing } from '../_shared/ProgressRing'
import { SingleCrawlNotice } from '../_shared/blocks/SingleCrawlNotice'
import { EmptyState } from '../_shared/empty'
import { compactNum, fmtPct } from '../_shared/format'

const CHANNEL_ICONS: Record<string, string> = {
  instagram: 'IG', tiktok: 'TT', x: 'X', twitter: 'X', linkedin: 'IN',
  youtube: 'YT', facebook: 'FB',
}

export function SocialOverview() {
  const { socialProfiles } = useSeoCrawler() as any
  const s = useSocialInsights()

  if (!socialProfiles?.length && !s.profilesList.length) {
    return <EmptyState title="No social profiles connected" hint="Connect social accounts to see brand insights." />
  }

  const grade = s.score >= 80 ? 'A' : s.score >= 60 ? 'B' : s.score >= 40 ? 'C' : 'D'

  return (
    <div className="flex flex-col gap-3 p-3">
      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-[#888]">Brand score</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-bold tabular-nums text-white">{s.score}</span>
              <span className="text-sm font-medium text-[#666]">{grade}</span>
            </div>
          </div>
          <ProgressRing value={s.score} size={72} />
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-2">
        <KpiTile
          label="Followers"
          value={compactNum(s.totalFollowers)}
          delta={s.hasPrior ? `across ${s.profilesList.length} platforms` : undefined}
        />
        <KpiTile
          label="Sentiment"
          value={s.sentimentLabel}
          tone={s.sentimentLabel === 'Positive' ? 'good' : s.sentimentLabel === 'Negative' ? 'bad' : 'warn'}
        />
        <KpiTile
          label="Engagement"
          value={fmtPct(s.avgEngRate * 100, 1)}
          delta={s.hasPrior ? `${s.engagement.posts30d} posts` : undefined}
        />
        <KpiTile
          label="Alerts"
          value={s.alerts.length}
          tone={s.alerts.length > 0 ? 'warn' : 'good'}
        />
      </div>

      <Card padded={false}>
        <div className="px-3 py-2 border-b border-[#1f1f1f]">
          <span className="text-[11px] text-[#888]">Connected profiles</span>
        </div>
        <div className="flex flex-col border-t border-[#1f1f1f]">
          {s.profilesList.map((p: any) => (
            <div key={p.id} className="flex items-center justify-between px-3 py-2 border-b border-[#1f1f1f] last:border-b-0">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded bg-[#1a1a1a] flex items-center justify-center text-[9px] font-bold text-[#888]">
                  {CHANNEL_ICONS[p.channel] || p.channel.slice(0, 2).toUpperCase()}
                </span>
                <div>
                  <div className="text-[11px] font-medium text-white">{p.handle}</div>
                  <div className="text-[10px] text-[#666] capitalize">{p.channel}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] font-mono text-white">{compactNum(p.followers)}</div>
                {s.hasPrior && p.growthPct !== 0 && (
                  <div className={`text-[10px] font-mono ${p.growthPct > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {p.growthPct > 0 ? '+' : ''}{(p.growthPct * 100).toFixed(1)}%
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {s.alerts.length > 0 && (
        <Card padded={false}>
          <div className="px-3 py-2 border-b border-[#1f1f1f]">
            <span className="text-[11px] text-[#888]">Alerts</span>
          </div>
          <div className="flex flex-col border-t border-[#1f1f1f]">
            {s.alerts.map(a => (
              <div key={a.id} className="flex items-start gap-2 px-3 py-2 border-b border-[#1f1f1f] last:border-b-0">
                <span className={`mt-0.5 w-1.5 h-1.5 rounded-full shrink-0 ${
                  a.severity === 'high' ? 'bg-red-500' :
                  a.severity === 'medium' ? 'bg-amber-500' :
                  'bg-blue-500'
                }`} />
                <div className="min-w-0">
                  <div className="text-[11px] text-white leading-snug">{a.text}</div>
                  <div className="text-[10px] text-[#666]">{a.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {!s.hasPrior && <SingleCrawlNotice />}
    </div>
  )
}
