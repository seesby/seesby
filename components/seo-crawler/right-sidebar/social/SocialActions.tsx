import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useSocialInsights } from '../_hooks/useSocialInsights'
import { Card } from '../_shared/Card'
import { Section } from '../_shared/Section'
import { KpiTile } from '../_shared/KpiTile'
import { Distribution } from '../_shared/bars'
import { RecommendedActionsBlock } from '../_shared/blocks/RecommendedActionsBlock'
import { EmptyState } from '../_shared/empty'
import { compactNum } from '../_shared/format'

export function SocialActions() {
  const { socialProfiles } = useSeoCrawler() as any
  const s = useSocialInsights()

  if (!socialProfiles?.length && !s.profilesList.length) {
    return <EmptyState title="No social profiles connected" hint="Connect social accounts to see action items." />
  }

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="grid grid-cols-3 gap-2">
        <KpiTile
          label="Open"
          value={s.actions.open}
          tone={s.actions.open > 5 ? 'bad' : s.actions.open > 2 ? 'warn' : 'good'}
        />
        <KpiTile label="Done" value={s.actions.done} tone="good" />
        <KpiTile label="Snoozed" value={s.actions.snoozed} />
      </div>

      <Card>
        <Section title="Priority" dense>
          <Distribution rows={[
            { label: 'Critical', value: s.actions.critical, tone: 'bad' },
            { label: 'High', value: s.actions.high, tone: 'warn' },
            { label: 'Medium', value: s.actions.med, tone: 'info' },
            { label: 'Low', value: s.actions.low, tone: 'neutral' },
          ]} />
        </Section>
      </Card>

      {s.alerts.length > 0 && (
        <Card padded={false}>
          <div className="px-3 py-2 border-b border-[var(--brand-surface-3)]]">
            <span className="text-[11px] text-[var(--brand-text-mid)]]">Priority alerts</span>
          </div>
          <div className="flex flex-col border-t border-[var(--brand-surface-3)]]">
            {s.alerts.map(a => (
              <div key={a.id} className="flex items-start gap-2 px-3 py-2 border-b border-[var(--brand-surface-3)]] last:border-b-0">
                <span className={`mt-0.5 w-1.5 h-1.5 rounded-full shrink-0 ${
                  a.severity === 'high' ? 'bg-red-500' :
                  a.severity === 'medium' ? 'bg-amber-500' :
                  'bg-blue-500'
                }`} />
                <div className="min-w-0">
                  <div className="text-[11px] text-[var(--brand-text-strong)] leading-snug">{a.text}</div>
                  <div className="text-[10px] text-[var(--brand-text-faint)]]">{a.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {s.actions.byReason.length > 0 && (
        <Card padded={false}>
          <div className="px-3 py-2 border-b border-[var(--brand-surface-3)]]">
            <span className="text-[11px] text-[var(--brand-text-mid)]]">By reason</span>
          </div>
          <div className="flex flex-col border-t border-[var(--brand-surface-3)]]">
            {s.actions.byReason.map(r => (
              <div key={r.id} className="flex items-center justify-between px-3 py-2 border-b border-[var(--brand-surface-3)]] last:border-b-0">
                <span className="text-[11px] text-[var(--brand-text-strong)]">{r.label}</span>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-amber-400">{r.open} open</span>
                  <span className="text-[10px] font-mono text-emerald-400">{r.done} done</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <RecommendedActionsBlock
        title="Recommended actions"
        items={s.actions.recommended}
        emptyText="No actions recommended yet."
      />
    </div>
  )
}
