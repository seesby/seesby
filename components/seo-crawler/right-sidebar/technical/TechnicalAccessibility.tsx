import React, { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useTechnicalInsights } from '../_hooks/useTechnicalInsights'
import { useDrill } from '../_shared/drill'
import { Card } from '../_shared/Card'
import { KpiTile } from '../_shared/KpiTile'
import { HealthStrip } from '../_shared/HealthStrip'
import { Distribution } from '../_shared/Distribution'
import { TopList } from '../_shared/lists'
import { EmptyState } from '../_shared/empty'
import { fmtNum, fmtPct } from '../_shared/format'

export function TechnicalAccessibility() {
  const { pages = [] } = useSeoCrawler() as any
  const s = useTechnicalInsights()
  const drill = useDrill()

  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  const worst = useMemo(() =>
    [...pages].filter((p: any) => p.a11yScore != null).sort((a: any, b: any) => Number(a.a11yScore) - Number(b.a11yScore)).slice(0, 5),
  [pages])

  const totalIssues = s.a11y.total
  const impactedPages = useMemo(() =>
    pages.filter((p: any) =>
      Number(p.missingAltImages || 0) > 0 ||
      Number(p.formsWithoutLabels || 0) > 0 ||
      Number(p.invalidAriaCount || 0) > 0 ||
      p.hasSkipLink === false ||
      p.hasMainLandmark === false ||
      p.viewportNoScale === true
    ).length,
  [pages])

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="grid grid-cols-2 gap-2">
        <KpiTile label="Issues" value={fmtNum(totalIssues)} tone={totalIssues > 0 ? 'warn' : 'good'} />
        <KpiTile label="Pages affected" value={fmtNum(impactedPages)} tone={impactedPages > 0 ? 'warn' : 'good'} />
      </div>

      <Card title="Issue type">
        <Distribution rows={[
          { label: 'Missing alt', value: s.a11y.altMissing, tone: 'warn' },
          { label: 'Forms no label', value: s.a11y.formsNoLabel, tone: 'warn' },
          { label: 'Invalid ARIA', value: s.a11y.invalidAria, tone: 'warn' },
          { label: 'Generic links', value: s.a11y.genericLinks, tone: 'warn' },
          { label: 'Tables no header', value: s.a11y.tablesNoHeader, tone: 'warn' },
        ]} />
      </Card>

      <Card title="Page structure">
        <Distribution rows={[
          { label: 'Skip link missing', value: s.a11y.skipLinkMissing, tone: 'warn' },
          { label: 'Main landmark missing', value: s.a11y.mainLandmarkMissing, tone: 'warn' },
          { label: 'Small tap targets', value: s.a11y.smallTap, tone: 'warn' },
          { label: 'Small fonts', value: s.a11y.smallFonts, tone: 'warn' },
          { label: 'Zoom disabled', value: s.a11y.zoomDisabled, tone: 'bad' },
        ]} />
      </Card>

      {worst.length > 0 && (
        <Card title="Worst pages">
          <TopList items={worst.map((p: any) => ({
            id: p.url, primary: p.title || p.url, secondary: p.url,
            tail: fmtPct(p.a11yScore), onClick: () => drill.toPage(p),
          }))} />
        </Card>
      )}
    </div>
  )
}
