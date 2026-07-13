import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useSocialInsights } from '../_hooks/useSocialInsights'
import { Card } from '../_shared/Card'
import { Section } from '../_shared/Section'
import { KpiTile } from '../_shared/KpiTile'
import { Distribution } from '../_shared/bars'
import { Sparkline } from '../_shared/Sparkline'
import { TrendDelta } from '../_shared/TrendDelta'
import { SingleCrawlNotice } from '../_shared/blocks/SingleCrawlNotice'
import { EmptyState } from '../_shared/empty'
import { compactNum, fmtPct } from '../_shared/format'

export function SocialEngage() {
  const { socialProfiles } = useSeoCrawler() as any
  const s = useSocialInsights()

  if (!socialProfiles?.length && !s.profilesList.length) {
    return <EmptyState title="No social profiles connected" hint="Connect social accounts to see engagement data." />
  }

  return (
    <div className="flex flex-col gap-3 p-3">
      <Card>
        <Section title="Engagement rate" dense
          action={s.hasPrior && s.engagement.rateSeries.length > 0
            ? <Sparkline values={s.engagement.rateSeries} tone="info" width={80} height={20} />
            : undefined}>
          <div className="flex items-baseline gap-2">
            <span className="text-[24px] font-bold font-mono text-white">{fmtPct(s.engagement.rate * 100, 1)}</span>
            {s.hasPrior && (
              <TrendDelta current={s.engagement.rate * 100} previous={s.engagement.ratePrev * 100} unit="pp" />
            )}
          </div>
        </Section>
      </Card>

      <div className="grid grid-cols-2 gap-2">
        <KpiTile
          label="Posts (30d)"
          value={s.engagement.posts30d}
        />
        <KpiTile
          label="Avg reach"
          value={compactNum(s.engagement.avgReach)}
          delta={s.hasPrior ? `${fmtPct(((s.engagement.avgReach - s.engagement.avgReachPrev) / s.engagement.avgReachPrev) * 100, 0)}` : undefined}
          deltaTone={s.engagement.avgReach > s.engagement.avgReachPrev ? 'up' : 'down'}
        />
      </div>

      <Card>
        <Section title="Signals" dense>
          <div className="grid grid-cols-4 gap-1">
            {[
              { label: 'Likes', value: s.engagement.signals.likes },
              { label: 'Comments', value: s.engagement.signals.comments },
              { label: 'Shares', value: s.engagement.signals.shares },
              { label: 'Saves', value: s.engagement.signals.saves },
            ].map(sig => (
              <div key={sig.label} className="flex flex-col items-center p-2 rounded bg-[#0a0a0a]">
                <span className="text-[14px] font-bold font-mono text-white">{compactNum(sig.value)}</span>
                <span className="text-[9px] text-[#888] uppercase">{sig.label}</span>
              </div>
            ))}
          </div>
        </Section>
      </Card>

      <Card padded={false}>
        <div className="px-3 py-2 border-b border-[#1f1f1f]">
          <span className="text-[11px] text-[#888]">By channel</span>
        </div>
        <div className="flex flex-col border-t border-[#1f1f1f]">
          {s.engagement.byChannelEngagement.map(ch => (
            <div key={ch.channel} className="flex items-center justify-between px-3 py-2 border-b border-[#1f1f1f] last:border-b-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-white">{ch.channel}</span>
                <span className="text-[10px] text-[#666]">{ch.posts} posts</span>
              </div>
              <span className="text-[11px] font-mono text-white">{fmtPct(ch.rate * 100, 1)}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <Section title="Post type" dense>
          <Distribution rows={[
            { label: 'Video', value: s.engagement.byType.video, tone: 'info' },
            { label: 'Image', value: s.engagement.byType.image, tone: 'info' },
            { label: 'Text', value: s.engagement.byType.text, tone: 'info' },
            { label: 'Link', value: s.engagement.byType.link, tone: 'info' },
          ]} />
        </Section>
      </Card>

      {s.engagement.topPosts.length > 0 && (
        <Card padded={false}>
          <div className="px-3 py-2 border-b border-[#1f1f1f]">
            <span className="text-[11px] text-[#888]">Top performing</span>
          </div>
          <div className="flex flex-col border-t border-[#1f1f1f]">
            {s.engagement.topPosts.slice(0, 4).map(p => (
              <div key={p.id} className="px-3 py-2 border-b border-[#1f1f1f] last:border-b-0">
                <div className="text-[11px] text-white leading-snug line-clamp-2">{p.text}</div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] text-[#666]">{p.channel}</span>
                  <span className="text-[10px] text-[#666]">{p.relTime}</span>
                  <span className="text-[10px] font-mono text-[#888]">{compactNum(p.engagement)}</span>
                  <span className="text-[10px] font-mono text-[#666]">{compactNum(p.reach)} reach</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {s.hasPrior && s.engagement.worstPosts.length > 0 && (
        <Card padded={false}>
          <div className="px-3 py-2 border-b border-[#1f1f1f]">
            <span className="text-[11px] text-[#888]">Needs improvement</span>
          </div>
          <div className="flex flex-col border-t border-[#1f1f1f]">
            {s.engagement.worstPosts.map(p => (
              <div key={p.id} className="px-3 py-2 border-b border-[#1f1f1f] last:border-b-0">
                <div className="text-[11px] text-white leading-snug line-clamp-2">{p.text}</div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] text-[#666]">{p.channel}</span>
                  <span className="text-[10px] font-mono text-[#888]">{p.engagement} eng</span>
                  <span className="text-[10px] font-mono text-[#666]">{compactNum(p.reach)} reach</span>
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
