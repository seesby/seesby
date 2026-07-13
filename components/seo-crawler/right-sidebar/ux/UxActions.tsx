import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useUxInsights } from '../_hooks/useUxInsights'
import { useDrill } from '../_shared/drill'
import { Card } from '../_shared/Card'
import { KpiTile } from '../_shared/KpiTile'
import { HealthStrip } from '../_shared/HealthStrip'
import { Distribution } from '../_shared/Distribution'
import { SegmentTable } from '../_shared/SegmentTable'
import { RowItem } from '../_shared/RowItem'
import { TabbedAlertsBlock, ActionsBlock } from '../_shared'
import { EmptyState } from '../_shared/empty'
import { compactNum } from '../_shared/format'

export function UxActions() {
  const { pages } = useSeoCrawler()
  const s = useUxInsights()
  const drill = useDrill()

  if (!s.total) return <EmptyState title="No crawl data yet" />

  const totalActions = s.actions.critical + s.actions.high + s.actions.med + s.actions.low
  const actionRate = s.total > 0 ? (totalActions / s.total * 100).toFixed(0) : '0'

  const priorityRows = [
    { label: 'Critical', value: s.actions.critical, tone: 'bad' as const },
    { label: 'High', value: s.actions.high, tone: 'warn' as const },
    { label: 'Medium', value: s.actions.med, tone: 'good' as const },
    { label: 'Low', value: s.actions.low, tone: 'neutral' as const },
  ]

  // Pages with most actions
  const pagesWithActions = [...(pages || [])]
    .filter((p: any) => p.actions?.length > 0 || p.primaryAction)
    .sort((a: any, b: any) => (b.actions?.length || 0) - (a.actions?.length || 0))
    .slice(0, 8)

  // Action type distribution
  const actionTypes: Record<string, number> = {}
  ;(pages || []).forEach((p: any) => {
    ;(p.actions || []).forEach((a: any) => {
      const type = a.type || 'other'
      actionTypes[type] = (actionTypes[type] || 0) + 1
    })
  })
  const typeRows = Object.entries(actionTypes)
    .map(([label, value]) => ({ label, value, tone: 'good' as const }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)

  // Effort estimation
  const quickWins = (pages || []).filter((p: any) =>
    p.actionPriority === 'low' || p.primaryActionCategory === 'content'
  ).length
  const majorProjects = (pages || []).filter((p: any) =>
    p.actionPriority === 'critical' || p.actionPriority === 'high'
  ).length

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 gap-2">
        <KpiTile
          label="Open actions"
          value={String(s.actions.open)}
          tone={s.actions.critical > 0 ? 'bad' : s.actions.high > 0 ? 'warn' : 'good'}
          sub={`${actionRate}% of pages`}
        />
        <KpiTile
          label="Critical"
          value={String(s.actions.critical)}
          tone={s.actions.critical > 0 ? 'bad' : 'good'}
          sub={`${s.actions.high} high`}
        />
        <KpiTile
          label="Quick wins"
          value={String(quickWins)}
          tone={quickWins > 0 ? 'good' : 'neutral'}
          sub="Low effort"
        />
        <KpiTile
          label="Major projects"
          value={String(majorProjects)}
          tone={majorProjects > 0 ? 'warn' : 'good'}
          sub="High priority"
        />
      </div>

      {/* Priority bands */}
      <Card title="Priority">
        <HealthStrip
          total={totalActions || 1}
          segments={priorityRows.map(r => ({
            label: r.label,
            value: r.value,
            color: r.tone === 'bad' ? '#ef4444' : r.tone === 'warn' ? '#f59e0b' : r.tone === 'good' ? '#60a5fa' : 'text-[var(--brand-text-faint)]',
          }))}
        />
      </Card>

      {/* Action types */}
      <Card title="Action types">
        {typeRows.length > 0 ? (
          <Distribution rows={typeRows} />
        ) : (
          <div className="text-[11px] text-[var(--brand-text-faint)]">No action types recorded.</div>
        )}
      </Card>

      {/* By reason */}
      <Card title="By reason">
        {s.actions.byReason.length > 0 ? (
          <SegmentTable
            headers={['Reason', 'Open', 'Affected']}
            rows={s.actions.byReason.map((r: any) => ({
              id: r.id, label: r.label,
              values: [r.open, r.affected],
            }))}
          />
        ) : (
          <div className="text-[11px] text-[var(--brand-text-faint)]">No reason data available.</div>
        )}
      </Card>

      {/* Pages with most actions */}
      <Card title="Most actions">
        {pagesWithActions.length > 0 ? (
          <div className="flex flex-col border-t border-[var(--brand-surface-3)]">
            {pagesWithActions.slice(0, 6).map((p: any, i: number) => (
              <RowItem
                key={i}
                title={(p.title || p.url || '').slice(0, 50)}
                meta={p.primaryAction || `${p.actions?.length || 0} actions`}
                badge={
                  <span className={`text-[10px] font-mono ${
                    p.actionPriority === 'critical' || p.actionPriority === 'high'
                      ? 'text-[#ef4444]'
                      : p.actionPriority === 'medium'
                        ? 'text-[#f59e0b]'
                        : 'text-[var(--brand-text-mid)]'
                  }`}>
                    {p.actions?.length || 0}
                  </span>
                }
                onClick={() => drill.toPage(p)}
              />
            ))}
          </div>
        ) : (
          <div className="text-[11px] text-[var(--brand-text-faint)]">No pages with actions.</div>
        )}
      </Card>

      {/* Alerts */}
      <TabbedAlertsBlock tabId="uxConversion" />

      {/* Actions */}
      <ActionsBlock tabId="uxConversion" max={12} />
    </div>
  )
}
