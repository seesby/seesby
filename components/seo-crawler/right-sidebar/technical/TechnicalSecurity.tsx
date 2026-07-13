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
import { fmtPct, fmtNum } from '../_shared/format'

export function TechnicalSecurity() {
  const { pages = [] } = useSeoCrawler() as any
  const s = useTechnicalInsights()
  const drill = useDrill()

  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  const mixedContent = useMemo(() =>
    pages.filter((p: any) => p.hasMixedContent === true).slice(0, 5),
  [pages])

  const insecurePages = useMemo(() =>
    pages.filter((p: any) =>
      p.sslValid === false || p.corsWildcard === true || p.exposedApiKeys > 0
    ).slice(0, 5),
  [pages])

  const httpsCount = s.security.httpsPages
  const totalSecurityIssues = s.security.mixedContent + s.security.sslInvalid + s.security.hstsMissing + s.security.cspMissing + s.security.xFrameMissing

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="grid grid-cols-2 gap-2">
        <KpiTile label="HTTPS" value={fmtPct(httpsCount / (s.total || 1) * 100)} tone={httpsCount >= s.total * 0.95 ? 'good' : 'warn'} />
        <KpiTile label="Issues" value={fmtNum(totalSecurityIssues)} tone={totalSecurityIssues > 0 ? 'warn' : 'good'} />
      </div>

      <Card title="SSL/TLS">
        <Distribution rows={[
          { label: 'Valid', value: s.total - s.security.sslInvalid - s.security.sslExpiringSoon, tone: 'good' },
          { label: 'Expiring soon', value: s.security.sslExpiringSoon, tone: 'warn' },
          { label: 'Invalid', value: s.security.sslInvalid, tone: 'bad' },
          { label: 'Weak TLS', value: s.security.weakTls, tone: 'bad' },
        ]} />
      </Card>

      <Card title="Security headers">
        <Distribution rows={[
          { label: 'HSTS missing', value: s.security.hstsMissing, tone: 'warn' },
          { label: 'CSP missing', value: s.security.cspMissing, tone: 'warn' },
          { label: 'CSP unsafe', value: s.security.cspUnsafe, tone: 'bad' },
          { label: 'X-Frame missing', value: s.security.xFrameMissing, tone: 'warn' },
          { label: 'X-Content missing', value: s.security.xContentMissing, tone: 'warn' },
          { label: 'Referrer missing', value: s.security.referrerMissing, tone: 'warn' },
          { label: 'Permissions missing', value: s.security.permissionsMissing, tone: 'warn' },
        ]} />
      </Card>

      <Card title="Cookies and scripts">
        <Distribution rows={[
          { label: 'Insecure cookies', value: s.security.insecureCookies, tone: 'bad' },
          { label: 'SameSite missing', value: s.security.sameSiteMissing, tone: 'warn' },
          { label: 'CORS wildcard', value: s.security.corsWildcard, tone: 'bad' },
          { label: 'Scripts no SRI', value: s.security.scriptsNoSri, tone: 'warn' },
          { label: 'Exposed keys', value: s.security.exposedKeys, tone: 'bad' },
        ]} />
      </Card>

      {mixedContent.length > 0 && (
        <Card title="Mixed content">
          <TopList items={mixedContent.map((p: any) => ({
            id: p.url, primary: p.title || p.url, secondary: p.url,
            tail: 'HTTP', onClick: () => drill.toPage(p),
          }))} />
        </Card>
      )}

      {insecurePages.length > 0 && (
        <Card title="Insecure pages">
          <TopList items={insecurePages.map((p: any) => ({
            id: p.url, primary: p.title || p.url, secondary: p.url,
            tail: p.sslValid === false ? 'SSL' : 'mixed', onClick: () => drill.toPage(p),
          }))} />
        </Card>
      )}
    </div>
  )
}
