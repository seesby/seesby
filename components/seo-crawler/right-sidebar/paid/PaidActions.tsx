import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { usePaidInsights } from '../_hooks/usePaidInsights'
import { useAlerts } from '../_hooks/useAlerts'
import { useActions } from '../_hooks/useActions'
import { Card } from '../_shared/Card'
import { KpiTile } from '../_shared/KpiTile'
import { Distribution } from '../_shared/Distribution'
import { RowItem } from '../_shared/RowItem'
import { AlertsBlock } from '../_shared/blocks/AlertsBlock'
import { RecommendedActionsBlock } from '../_shared/blocks/RecommendedActionsBlock'
import { EmptyState } from '../_shared/empty'

export function PaidActions() {
  const { paidCampaigns } = useSeoCrawler() as any
  const s = usePaidInsights()
  const alerts = useAlerts('paid')
  const actions = useActions('paid')

  if (!paidCampaigns?.length) return <EmptyState title="No paid data yet" />

  const bandRows = [
    { label: 'Critical', value: s.actions.critical },
    { label: 'High', value: s.actions.high },
    { label: 'Medium', value: s.actions.med },
    { label: 'Low', value: s.actions.low },
  ].filter(r => r.value > 0)

  // Map RsAlert to AlertsBlock Alert format
  const alertItems = alerts.map(a => ({
    id: a.id,
    tone: a.tone as 'bad' | 'warn',
    text: a.title + (a.count ? ` (${a.count})` : ''),
  }))

  // Map RsAction to RecommendedActionsBlock format
  const actionItems = actions.map(a => ({
    id: a.id,
    title: a.title,
    subtitle: a.detail,
    priority: a.tone === 'critical' ? 'critical' as const
      : a.tone === 'high' ? 'high' as const
      : a.tone === 'med' ? 'med' as const
      : 'low' as const,
    pagesAffected: 1,
    effortMin: a.effortMinutes,
    expectedDelta: { value: a.forecastClicks || 0, unit: 'clicks' },
    confidence: a.confidence,
    category: a.category,
  }))

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* Action KPIs */}
      <div className="grid grid-cols-3 gap-2">
        <KpiTile label="Open" value={String(s.actions.open)} tone={s.actions.open > 3 ? 'warn' : 'good'} />
        <KpiTile label="Done" value={String(s.actions.done)} />
        <KpiTile label="Snoozed" value={String(s.actions.snoozed)} />
      </div>

      {/* Priority band */}
      {bandRows.length > 0 && (
        <Card title="Priority">
          <Distribution rows={bandRows} />
        </Card>
      )}

      {/* By reason */}
      {s.actions.byReason.length > 0 && (
        <Card title="By reason" padded={false}>
          <div className="flex flex-col border-t border-[#1f1f1f]">
            {s.actions.byReason.map((r) => (
              <RowItem
                key={r.id}
                title={r.label}
                badge={<span className="text-[10px] font-mono text-[#f59e0b]">{r.open}</span>}
              />
            ))}
          </div>
        </Card>
      )}

      {/* Alerts */}
      {alertItems.length > 0 && (
        <AlertsBlock title="Top alerts" items={alertItems} />
      )}

      {/* Recommended actions */}
      {actionItems.length > 0 && (
        <RecommendedActionsBlock items={actionItems} />
      )}
    </div>
  )
}
