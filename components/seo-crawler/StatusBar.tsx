import React from 'react';
import { Clock, Layers, Keyboard, Cpu, Route, GitCompare, Save, Terminal } from 'lucide-react';
import { useSeoCrawler } from '../../contexts/SeoCrawlerContext';
import { SURFACE, TEXT, STATUS, R, S } from './views/_shared/tokens';

const getSafeHostname = (url: string | undefined | null) => {
    if (!url) return '';
    try {
        return new URL(url).hostname;
    } catch {
        return url;
    }
};

export default function StatusBar() {
    const {
        isCrawling, elapsedTime, crawlRate, crawlRuntime, isAuthenticated, viewMode, pages, trialPagesLimit, crawlHistory, setShowComparisonView, saveCrawlSession, activeViewType, setShowLogsDialog,
        selectedRows, setSelectedRows
    } = useSeoCrawler() as any;

    const selCount = selectedRows?.size ?? 0;

    const statusMeta = (() => {
        if (isCrawling || crawlRuntime.stage === 'crawling' || crawlRuntime.stage === 'connecting') {
            return {
                dotColor: STATUS.good,
                dotPulse: true,
                label: crawlRuntime.stage === 'connecting' ? 'Connecting Scanner' : 'Scanning Site'
            };
        }

        if (crawlRuntime.stage === 'completed') {
            return {
                dotColor: STATUS.info,
                dotPulse: false,
                label: 'Scan Complete'
            };
        }

        if (crawlRuntime.stage === 'paused') {
            return {
                dotColor: STATUS.warn,
                dotPulse: false,
                label: 'Scan Paused'
            };
        }

        if (crawlRuntime.stage === 'error') {
            return {
                dotColor: STATUS.bad,
                dotPulse: false,
                label: 'Scan Error'
            };
        }

        return {
            dotColor: 'rgba(59,130,246,0.5)',
            dotPulse: false,
            label: 'Ready to Scan'
        };
    })();

    // Selection bar (shown when rows are selected)
    if (selCount > 0) {
        const totalPages = pages?.length ?? 0;
        const crawled = crawlRuntime?.crawled ?? 0;
        const progress = totalPages > 0 ? Math.round((crawled / totalPages) * 10) : 0;
        const progressDots = '●'.repeat(progress) + '○'.repeat(10 - progress);

        return (
            <div className="flex items-center justify-between shrink-0" style={{ height: 28, background: SURFACE.sidebar, borderTop: `1px solid ${SURFACE.br1}`, padding: `0 ${S[3]}px`, fontSize: 11, color: TEXT.tertiary, userSelect: 'none' }}>
                {/* Left: selection info + actions */}
                <div className="flex items-center" style={{ gap: S[3] }}>
                    <span style={{ color: TEXT.secondary, fontWeight: 500 }}>{selCount} selected</span>
                    <span style={{ color: SURFACE.br2 }}>·</span>
                    <button style={{ padding: '2px 8px', borderRadius: R.sm, background: SURFACE.bg3, color: TEXT.secondary, fontSize: 11, border: 'none', cursor: 'pointer' }}>Tag</button>
                    <button style={{ padding: '2px 8px', borderRadius: R.sm, background: SURFACE.bg3, color: TEXT.secondary, fontSize: 11, border: 'none', cursor: 'pointer' }}>Re-check</button>
                    <button style={{ padding: '2px 8px', borderRadius: R.sm, background: SURFACE.bg3, color: TEXT.secondary, fontSize: 11, border: 'none', cursor: 'pointer' }}>Export</button>
                    <button style={{ padding: '2px 8px', borderRadius: R.sm, background: SURFACE.bg3, color: TEXT.secondary, fontSize: 11, border: 'none', cursor: 'pointer' }}>Compare…</button>
                </div>

                {/* Right: crawl progress */}
                <div className="flex items-center" style={{ gap: S[3] }}>
                    <span style={{ color: TEXT.muted }}>Crawl</span>
                    <span style={{ fontFamily: 'monospace', color: TEXT.secondary, letterSpacing: '-0.02em' }}>{progressDots}</span>
                    <span style={{ fontFamily: 'monospace', color: TEXT.secondary }}>{crawled}/{totalPages}</span>
                    <span style={{ color: SURFACE.br2 }}>·</span>
                    <span style={{ fontFamily: 'monospace', color: TEXT.secondary }}>ETA {elapsedTime || '—'}</span>
                    <span style={{ color: SURFACE.br2 }}>·</span>
                    <span style={{ color: STATUS.good }}>3 new found</span>
                    <span style={{ color: SURFACE.br2 }}>|</span>
                    <button onClick={() => setSelectedRows(new Set())} style={{ color: TEXT.tertiary, fontSize: 11, background: 'none', border: 'none', cursor: 'pointer' }}>Clear</button>
                </div>
            </div>
        );
    }

    // Normal status bar
    return (
        <div className="flex items-center justify-between shrink-0" style={{ height: 28, background: SURFACE.sidebar, borderTop: `1px solid ${SURFACE.br1}`, padding: `0 ${S[3]}px`, fontSize: 11, color: TEXT.tertiary, userSelect: 'none' }}>
            {/* Left side: Status */}
            <div className="flex items-center" style={{ gap: S[4] }}>
                <span className="flex items-center" style={{ gap: S[2] }}>
                    <div style={{ width: 6, height: 6, borderRadius: 999, background: statusMeta.dotColor, animation: statusMeta.dotPulse ? 'pulse 2s infinite' : undefined }}></div>
                    <span style={{ color: TEXT.muted }}>{statusMeta.label}</span>
                </span>

                <span style={{ color: SURFACE.br2 }}>|</span>
                <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: TEXT.muted }}>Beta</span>

                {activeViewType !== 'competitor_matrix' && (
                    <>
                        {pages[0]?.url ? (
                            <>
                                <span style={{ color: SURFACE.br2 }}>|</span>
                                <span style={{ color: TEXT.secondary, fontWeight: 500, letterSpacing: '-0.02em' }}>
                                    {getSafeHostname(pages[0].url)}
                                </span>
                            </>
                        ) : crawlHistory?.length > 0 && (
                            <>
                                <span style={{ color: SURFACE.br2 }}>|</span>
                                <span style={{ color: TEXT.muted }}>{crawlHistory.length} Sessions in History</span>
                            </>
                        )}
                    </>
                )}

                {(isCrawling || crawlRuntime.stage === 'completed' || crawlRuntime.stage === 'paused' || crawlRuntime.stage === 'error') && activeViewType !== 'competitor_matrix' && (
                    <>
                        <span style={{ color: SURFACE.br2 }}>|</span>
                        <span className="flex items-center" style={{ gap: 4, fontFamily: 'monospace', color: TEXT.secondary }}>
                            <Clock size={11} style={{ color: TEXT.muted }} /> {elapsedTime}
                        </span>
                        <span style={{ color: SURFACE.br2 }}>|</span>
                        <span style={{ fontFamily: 'monospace', color: TEXT.secondary }}>{crawlRate} p/s</span>
                        <span style={{ color: SURFACE.br2 }}>|</span>
                        <span className="flex items-center" style={{ gap: 4, fontFamily: 'monospace', color: TEXT.secondary }}>
                            <Route size={11} style={{ color: TEXT.muted }} /> {crawlRuntime.queued} queued
                        </span>
                        <span style={{ color: SURFACE.br2 }}>|</span>
                        <span className="flex items-center" style={{ gap: 4, fontFamily: 'monospace', color: TEXT.secondary }}>
                            <Cpu size={11} style={{ color: TEXT.muted }} /> {crawlRuntime.activeWorkers}/{crawlRuntime.concurrency}
                        </span>
                    </>
                )}
            </div>

            {/* Right side: Helpers */}
            <div className="flex items-center" style={{ gap: S[4], color: TEXT.tertiary }}>
                <button
                    onClick={() => setShowLogsDialog(true)}
                    className="flex items-center"
                    style={{ gap: 6, color: TEXT.tertiary, fontSize: 11, background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.1s' }}
                >
                    <Terminal size={12} style={{ color: TEXT.muted }} />
                    Activity
                </button>

                <span style={{ color: SURFACE.br2 }}>|</span>

                <button
                    onClick={() => saveCrawlSession('completed')}
                    disabled={pages.length === 0}
                    className="flex items-center"
                    style={{ gap: 6, color: TEXT.tertiary, fontSize: 11, background: 'none', border: 'none', cursor: 'pointer', opacity: pages.length === 0 ? 0.3 : 1, transition: 'color 0.1s' }}
                >
                    <Save size={12} style={{ color: TEXT.muted }} />
                    Save
                </button>

                <span style={{ color: SURFACE.br2 }}>|</span>

                <button
                    onClick={() => setShowComparisonView(true)}
                    disabled={crawlHistory.length < 2}
                    className="flex items-center"
                    style={{ gap: 6, color: TEXT.tertiary, fontSize: 11, background: 'none', border: 'none', cursor: 'pointer', opacity: crawlHistory.length < 2 ? 0.3 : 1, transition: 'color 0.1s' }}
                >
                    <GitCompare size={12} style={{ color: TEXT.muted }} />
                    Compare
                </button>

                <span style={{ color: SURFACE.br2 }}>|</span>

                <button
                    onClick={() => window.dispatchEvent(new CustomEvent('open-shortcuts'))}
                    className="flex items-center"
                    style={{ gap: 6, color: TEXT.muted, fontSize: 11, background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.1s' }}
                    title="Keyboard shortcuts"
                >
                    <Keyboard size={12} /> Shortcuts
                </button>

                {!isAuthenticated ? (
                    <span style={{ color: 'rgba(251,146,60,0.8)' }}>Guest Mode ({trialPagesLimit} URL limit)</span>
                ) : (
                    <span style={{ color: 'rgba(96,165,250,0.8)' }}>Signed In</span>
                )}

                <span style={{ color: SURFACE.br2 }}>|</span>

                <span style={{ fontSize: 10, color: TEXT.muted }}>© 2024 - {new Date().getFullYear()} Seesby SEO</span>
            </div>
        </div>
    );
}
