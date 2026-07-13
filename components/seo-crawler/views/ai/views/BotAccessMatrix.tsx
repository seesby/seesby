'use client'

import React from 'react'
import { SURFACE, TEXT, STATUS, R } from '../../_shared/tokens'

const AI_BOTS = ['GPTBot', 'PerplexityBot', 'ClaudeBot', 'Gemini', 'BingBot', 'AppleBot'] as const

type BotAccessMatrixProps = {
  robots: Record<string, string>
  meta: Record<string, string>
  headers: Record<string, string>
}

function BotLabel(bot: string): string {
  if (bot === 'GPTBot') return 'GPT'
  if (bot === 'PerplexityBot') return 'Perplexity'
  if (bot === 'ClaudeBot') return 'Claude'
  if (bot === 'AppleBot') return 'Apple'
  return bot
}

export function BotAccessMatrix({ robots, meta, headers }: BotAccessMatrixProps) {
  const matrixRows = [
    { label: 'robots.txt', data: robots },
    { label: 'Meta tags', data: meta },
    { label: 'HTTP headers', data: headers },
  ]

  return (
    <div className="shrink-0" style={{ borderTop: `1px solid ${SURFACE.br1}`, background: SURFACE.bg0 }}>
      <div style={{ padding: '6px 12px', borderBottom: `1px solid ${SURFACE.br1}` }}>
        <span className="text-[10px] uppercase tracking-widest" style={{ color: TEXT.muted }}>Bot access matrix</span>
      </div>
      <div className="overflow-x-auto">
        <table style={{ width: '100%', fontSize: 10 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${SURFACE.br1}` }}>
              <th style={{ padding: '4px 12px', textAlign: 'left', color: TEXT.muted, fontWeight: 400, width: 80 }}></th>
              {AI_BOTS.map(bot => (
                <th key={bot} style={{ padding: '4px 8px', textAlign: 'center', color: TEXT.muted, fontWeight: 400 }}>
                  {BotLabel(bot)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrixRows.map(row => (
              <tr key={row.label} style={{ borderBottom: `1px solid ${SURFACE.br0}` }}>
                <td style={{ padding: '4px 12px', color: TEXT.tertiary }}>{row.label}</td>
                {AI_BOTS.map(bot => {
                  const status = row.data[bot] ?? 'unknown'
                  return (
                    <td key={bot} style={{ padding: '4px 8px', textAlign: 'center' }}>
                      <div
                        className="mx-auto"
                        style={{
                          width: 16, height: 16,
                          borderRadius: R.sm,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: status === 'allowed' ? 'rgba(34,197,94,0.09)' : status === 'blocked' ? 'rgba(239,68,68,0.09)' : 'transparent',
                        }}
                      >
                        {status === 'allowed' ? (
                          <span style={{ color: STATUS.good, fontSize: 9 }}>&#10003;</span>
                        ) : status === 'blocked' ? (
                          <span style={{ color: STATUS.bad, fontSize: 9 }}>&#10007;</span>
                        ) : (
                          <span style={{ color: TEXT.muted, fontSize: 9 }}>&#8212;</span>
                        )}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
