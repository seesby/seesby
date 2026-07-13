import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useSocialInsights } from '../_hooks/useSocialInsights'
import { Card } from '../_shared/Card'
import { Section } from '../_shared/Section'
import { KpiTile } from '../_shared/KpiTile'
import { BarStack } from '../_shared/bars'
import { Sparkline } from '../_shared/Sparkline'
import { TrendDelta } from '../_shared/TrendDelta'
import { SingleCrawlNotice } from '../_shared/blocks/SingleCrawlNotice'
import { EmptyState } from '../_shared/empty'
import { compactNum, fmtPct } from '../_shared/format'

export function SocialMentions() {
  const { socialMentions } = useSeoCrawler() as any
  const s = useSocialInsights()

  if (!socialMentions?.length && s.mentions.total === 0) {
    return <EmptyState title="No mentions tracked" hint="Mentions will appear once social listening is set up." />
  }

  return (
    <div className="flex flex-col gap-3 p-3">
      <Card>
        <Section title="Sentiment" dense
          action={s.hasPrior && s.mentions.series.length > 0
            ? <Sparkline values={s.mentions.series} tone="info" width={80} height={20} />
            : undefined}>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[20px] font-bold font-mono text-white">{compactNum(s.mentions.total)}</span>
            <span className="text-[11px] text-[#888]">total mentions</span>
            {s.hasPrior && <TrendDelta current={s.mentions.total} previous={s.mentions.totalPrev} />}
          </div>
          <BarStack segments={[
            { value: s.sentiment.positive, tone: 'good', label: 'Positive' },
            { value: s.sentiment.neutral, tone: 'neutral', label: 'Neutral' },
            { value: s.sentiment.negative, tone: 'bad', label: 'Negative' },
          ]} />
        </Section>
      </Card>

      <div className="grid grid-cols-2 gap-2">
        <KpiTile
          label="Reach"
          value={compactNum(s.mentions.reach)}
          delta={s.hasPrior ? `${fmtPct(((s.mentions.reach - s.mentions.reachPrev) / s.mentions.reachPrev) * 100, 0)}` : undefined}
          deltaTone={s.mentions.reach > s.mentions.reachPrev ? 'up' : 'down'}
        />
        <KpiTile
          label="Impressions"
          value={compactNum(s.mentions.impressions)}
          delta={s.hasPrior ? `${fmtPct(((s.mentions.impressions - s.mentions.impressionsPrev) / s.mentions.impressionsPrev) * 100, 0)}` : undefined}
          deltaTone={s.mentions.impressions > s.mentions.impressionsPrev ? 'up' : 'down'}
        />
      </div>

      <Card padded={false}>
        <div className="px-3 py-2 border-b border-[#1f1f1f]">
          <span className="text-[11px] text-[#888]">By channel</span>
        </div>
        <div className="flex flex-col border-t border-[#1f1f1f]">
          {Object.entries(s.byChannel)
            .filter(([, v]) => (v as number) > 0)
            .sort(([, a], [, b]) => (b as number) - (a as number))
            .slice(0, 6)
            .map(([ch, count]) => (
              <div key={ch} className="flex items-center justify-between px-3 py-2 border-b border-[#1f1f1f] last:border-b-0">
                <span className="text-[11px] text-[#ccc] capitalize">{ch}</span>
                <span className="text-[10px] font-mono text-white">{compactNum(count as number)}</span>
              </div>
            ))}
        </div>
      </Card>

      <Card padded={false}>
        <div className="px-3 py-2 border-b border-[#1f1f1f]">
          <span className="text-[11px] text-[#888]">Top topics</span>
        </div>
        <div className="flex flex-col border-t border-[#1f1f1f]">
          {s.topics.list.slice(0, 5).map(t => (
            <div key={t.id} className="flex items-center justify-between px-3 py-2 border-b border-[#1f1f1f] last:border-b-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-white">{t.label}</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                  t.sentiment === 'Positive' ? 'bg-emerald-500/10 text-emerald-400' :
                  t.sentiment === 'Negative' ? 'bg-red-500/10 text-red-400' :
                  'bg-amber-500/10 text-amber-400'
                }`}>{t.sentiment}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono text-[#888]">{compactNum(t.mentions)}</span>
                {s.hasPrior && (
                  <span className="text-[10px] font-mono text-[#666]">{compactNum(t.reach)}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {s.hasPrior && s.topics.trending.length > 0 && (
        <Card padded={false}>
          <div className="px-3 py-2 border-b border-[#1f1f1f]">
            <span className="text-[11px] text-[#888]">Trending up</span>
          </div>
          <div className="flex flex-col border-t border-[#1f1f1f]">
            {s.topics.trending.map(t => (
              <div key={t.id} className="flex items-center justify-between px-3 py-2 border-b border-[#1f1f1f] last:border-b-0">
                <span className="text-[11px] text-white">{t.label}</span>
                <span className="text-[10px] font-mono text-emerald-400">+{(t.delta * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {s.mentions.top.length > 0 && (
        <Card padded={false}>
          <div className="px-3 py-2 border-b border-[#1f1f1f]">
            <span className="text-[11px] text-[#888]">Notable mentions</span>
          </div>
          <div className="flex flex-col border-t border-[#1f1f1f]">
            {s.mentions.top.slice(0, 5).map(m => (
              <div key={m.id} className="px-3 py-2 border-b border-[#1f1f1f] last:border-b-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-medium text-white">{m.author}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] text-[#666]">{m.channel}</span>
                    <span className="text-[10px] font-mono text-[#888]">{compactNum(m.engagement)}</span>
                  </div>
                </div>
                <div className="text-[10px] text-[#aaa] leading-snug line-clamp-2">{m.text}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {s.mentions.negativeList.length > 0 && (
        <Card padded={false}>
          <div className="px-3 py-2 border-b border-[#1f1f1f]">
            <span className="text-[11px] text-red-400">Needs attention</span>
          </div>
          <div className="flex flex-col border-t border-[#1f1f1f]">
            {s.mentions.negativeList.map((m: any) => (
              <div key={m.id} className="px-3 py-2 border-b border-[#1f1f1f] last:border-b-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-medium text-white">{m.author}</span>
                  <span className="text-[9px] text-[#666]">{m.channel}</span>
                </div>
                <div className="text-[10px] text-[#aaa] leading-snug line-clamp-2">{m.text}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {!s.hasPrior && <SingleCrawlNotice />}
    </div>
  )
}
