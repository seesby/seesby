import React from 'react'
import { motion } from 'framer-motion'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { getRsTabsFor } from './registry'
import { SURFACE, TEXT, STATUS, R, S } from '../views/_shared/tokens'

export function RsTabBar() {
    const { mode, rsTab, setRsTab, pages } = useSeoCrawler()
    const reg = getRsTabsFor(mode)
    if (!reg) return null
    const activeId = rsTab[mode] ?? reg.tabs[0]?.id
    const styleNav = {
        scrollbarWidth: 'none' as const,
        maskImage: 'linear-gradient(to right, black 95%, transparent)',
        WebkitMaskImage: 'linear-gradient(to right, black 95%, transparent)'
    }
    return (
        <nav
            className="flex items-center overflow-x-auto shrink-0 snap-x snap-mandatory"
            style={{
                gap: 2,
                borderBottom: `1px solid ${SURFACE.br0}`,
                padding: '4px 6px',
                ...styleNav,
            }}
        >
            {reg.tabs.map((tab) => {
                const active = tab.id === activeId
                const badge = tab.badge?.({ pages, site: {} })
                return (
                    <button
                        key={tab.id}
                        onClick={() => setRsTab(mode, tab.id)}
                        className="relative shrink-0 flex items-center snap-start"
                        style={{
                            padding: '4px 10px',
                            borderRadius: R.sm,
                            fontSize: 11,
                            fontWeight: 500,
                            gap: 6,
                            color: active ? TEXT.primary : TEXT.secondary,
                            transition: 'color 0.1s',
                        }}
                    >
                        {active && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute inset-0"
                                style={{ borderRadius: R.sm, background: SURFACE.bg3 }}
                                initial={false}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            />
                        )}
                        <span className="relative z-10">{tab.label}</span>
                        {badge !== undefined && badge !== '' && (
                            <span
                                className="relative z-10"
                                style={{
                                    fontSize: 9,
                                    fontFamily: 'monospace',
                                    padding: '0 4px',
                                    borderRadius: R.sm,
                                    color: active ? STATUS.bad : TEXT.muted,
                                }}
                            >
                                {badge}
                            </span>
                        )}
                    </button>
                )
            })}
        </nav>
    )
}
