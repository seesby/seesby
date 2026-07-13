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
import { compactNum, fmtPct, fmtMs } from '../_shared/format'

export function SocialTraffic() {
  const { pages } = useSeoCrawler()
  const s = useSocialInsights()

  if (!pages?.length) {
    return <EmptyState title="No crawl data yet" hint="Run a crawl to see social traffic data." />
  }

  return (
    <div className="flex flex-col gap-3 p-3">
      <Card>
        <Section title="Social sessions (30d)" dense
          action={s.hasPrior && s.traffic.series.length > 0
            ? <Sparkline values={s.traffic.series} tone="info" width={80} height={20} />
            : undefined}>
          <div className="flex items-baseline gap-2">
            <span className="text-[24px] font-bold font-mono text-white">{compactNum(s.traffic.sessions)}</span>
            {s.hasPrior && (
              <TrendDelta current={s.traffic.sessions} previous={s.traffic.sessionsPrev} />
            )}
          </div>
        </Section>
      </Card>

      <div className="grid grid-cols-2 gap-2">
        <KpiTile
          label="Conv. rate"
          value={fmtPct(s.traffic.cvr * 100, 1)}
          sub="from social"
          delta={s.hasPrior ? `${fmtPct((s.traffic.cvr - s.traffic.cvrPrev) * 100, 1)}` : undefined}
          deltaTone={s.traffic.cvr > s.traffic.cvrPrev ? 'up' : 'down'}
        />
        <KpiTile
          label="Bounce"
          value={fmtPct(s.traffic.bounce * 100, 0)}
          tone={s.traffic.bounce < 0.6 ? 'good' : 'warn'}
          delta={s.hasPrior ? `${fmtPct((s.traffic.bounce - s.traffic.bouncePrev) * 100, 0)}` : undefined}
          deltaTone={s.traffic.bounce < s.traffic.bouncePrev ? 'up' : 'down'}
        />
        <KpiTile
          label="Avg time"
          value={fmtMs(s.traffic.avgTimeOnSite)}
        />
        <KpiTile
          label="Pages/session"
          value={s.traffic.pagesPerSession.toFixed(1)}
        />
      </div>

      <Card>
        <Section title="By channel" dense>
          <Distribution rows={[
            { label: 'X', value: s.traffic.byChannel.twitter, tone: 'info' },
            { label: 'LinkedIn', value: s.traffic.byChannel.linkedin, tone: 'info' },
            { label: 'Facebook', value: s.traffic.byChannel.facebook, tone: 'info' },
            { label: 'YouTube', value: s.traffic.byChannel.youtube, tone: 'info' },
            { label: 'Reddit', value: s.traffic.byChannel.reddit, tone: 'info' },
          ]} />
        </Section>
      </Card>

      <Card>
        <Section title="Devices" dense>
          <Distribution rows={[
            { label: 'Mobile', value: s.traffic.mobile, tone: 'info' },
            { label: 'Desktop', value: s.traffic.desktop, tone: 'info' },
            { label: 'Tablet', value: s.traffic.tablet, tone: 'info' },
          ]} />
        </Section>
      </Card>

      {s.traffic.topLandingPages.length > 0 && (
        <Card padded={false}>
          <div className="px-3 py-2 border-b border-[#1f1f1f]">
            <span className="text-[11px] text-[#888]">Top landing pages</span>
          </div>
          <div className="flex flex-col border-t border-[#1f1f1f]">
            {s.traffic.topLandingPages.slice(0, 5).map((page, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2 border-b border-[#1f1f1f] last:border-b-0">
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] text-white truncate">{page.title || page.url}</div>
                  <div className="text-[10px] text-[#666] truncate">{page.url}</div>
                </div>
                <span className="text-[10px] font-mono text-[#888] ml-2 shrink-0">{compactNum(page.sessions)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {s.traffic.topPosts.length > 0 && (
        <Card padded={false}>
          <div className="px-3 py-2 border-b border-[#1f1f1f]">
            <span className="text-[11px] text-[#888]">Top referring posts</span>
          </div>
          <div className="flex flex-col border-t border-[#1f1f1f]">
            {s.traffic.topPosts.slice(0, 4).map(p => (
              <div key={p.id} className="px-3 py-2 border-b border-[#1f1f1f] last:border-b-0">
                <div className="text-[11px] text-white leading-snug line-clamp-2">{p.text}</div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] text-[#666]">{p.channel}</span>
                  <span className="text-[10px] font-mono text-[#888]">{compactNum(p.sessions)} sessions</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {s.traffic.byCampaign.length > 0 && (
        <Card padded={false}>
          <div className="px-3 py-2 border-b border-[#1f1f1f]">
            <span className="text-[11px] text-[#888]">By campaign</span>
          </div>
          <div className="flex flex-col border-t border-[#1f1f1f]">
            {s.traffic.byCampaign.map(c => (
              <div key={c.id} className="flex items-center justify-between px-3 py-2 border-b border-[#1f1f1f] last:border-b-0">
                <div>
                  <div className="text-[11px] text-white">{c.name}</div>
                  <div className="text-[10px] text-[#666]">{compactNum(c.sessions)} sessions</div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] font-mono text-white">{fmtPct(c.cvr * 100, 1)}</div>
                  <div className="text-[10px] text-[#666]">conv.</div>
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
