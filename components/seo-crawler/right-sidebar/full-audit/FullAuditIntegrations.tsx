import React, { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { Card } from '../_shared/Card'
import { KpiTile } from '../_shared/KpiTile'
import { selectConnectors } from './_selectors'

function fmtAgo(iso?: string | null) {
  if (!iso) return null
  const ms = Date.now() - new Date(iso).getTime()
  const h = Math.floor(ms / 3600000)
  if (h < 1) return `${Math.floor(ms / 60000)}m ago`
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function FullAuditIntegrations() {
  const { site, openSettings } = useSeoCrawler() as any
  const connectors = useMemo(() => selectConnectors(site), [site])

  const connected = connectors.filter(c => c.state === 'connected')
  const disconnected = connectors.filter(c => c.state === 'disconnected')
  const error = connectors.filter(c => c.state === 'error')

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* Connection summary */}
      <div className="grid grid-cols-3 gap-2">
        <KpiTile label="Connected" value={connected.length} tone="good" />
        <KpiTile label="Available" value={disconnected.length} />
        <KpiTile label="Errors" value={error.length} tone={error.length > 0 ? 'bad' : 'good'} />
      </div>

      {/* Connected integrations */}
      {connected.length > 0 && (
        <Card title={`Connected (${connected.length})`} padded={false}>
          <ul className="flex flex-col border-t border-[#1f1f1f]">
            {connected.map((c) => (
              <li key={c.id} className="flex items-center justify-between border-b border-[#1a1a1a] px-3 py-2.5">
                <span className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[12px] text-[#ccc]">{c.label}</span>
                </span>
                <span className="text-[11px] text-[#666]">
                  {c.lastSyncAt ? fmtAgo(c.lastSyncAt) : 'Synced'}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Error integrations */}
      {error.length > 0 && (
        <Card title={`Needs attention (${error.length})`} padded={false}>
          <ul className="flex flex-col border-t border-[#1f1f1f]">
            {error.map((c) => (
              <li key={c.id} className="flex items-center justify-between border-b border-[#1a1a1a] px-3 py-2.5">
                <span className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                  <span className="text-[12px] text-[#ccc]">{c.label}</span>
                </span>
                <button
                  onClick={() => openSettings?.('integrations', c.id)}
                  className="text-[11px] text-[#f59e0b] hover:text-[#fbbf24] transition-colors"
                >
                  Fix
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Disconnected integrations */}
      {disconnected.length > 0 && (
        <Card title="Available" padded={false}>
          <ul className="flex flex-col border-t border-[#1f1f1f]">
            {disconnected.map((c) => (
              <li key={c.id} className="flex items-center justify-between border-b border-[#1a1a1a] px-3 py-2.5">
                <span className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#444]" />
                  <span className="text-[12px] text-[#888]">{c.label}</span>
                </span>
                <button
                  onClick={() => openSettings?.('integrations', c.id)}
                  className="text-[11px] text-[#3b82f6] hover:text-[#5b9cf6] transition-colors"
                >
                  Connect
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* All connected */}
      {connected.length > 0 && disconnected.length === 0 && error.length === 0 && (
        <Card>
          <div className="text-center py-2">
            <div className="text-[12px] text-[#ccc]">All integrations connected</div>
            <div className="text-[11px] text-[#666] mt-1">Data is synced from connected sources</div>
          </div>
        </Card>
      )}

      {/* Settings link */}
      <button
        onClick={() => openSettings?.('integrations')}
        className="text-center text-[11px] text-[#3b82f6] hover:text-[#5b9cf6] transition-colors py-1"
      >
        Manage all integrations
      </button>
    </div>
  )
}
