import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Minimize2, Pause, Square, Zap } from 'lucide-react';
import { useSeoCrawler } from '../../contexts/SeoCrawlerContext';

const getLogTone = (log: any) => {
    if (log.type === 'error') return 'text-red-400';
    if (log.type === 'success') return 'text-green-400';
    if (log.type === 'warn') return 'text-amber-400';
    return 'text-[#c6c6cb]';
};

const formatEta = (queued: number, crawlRate: string | number) => {
    const rate = Number(crawlRate);
    if (!Number.isFinite(rate) || rate <= 0 || queued <= 0) return 'Calculating...';
    const seconds = Math.ceil(queued / rate);
    if (seconds < 60) return `~${seconds}s`;
    if (seconds < 3600) return `~${Math.ceil(seconds / 60)}m`;
    return `~${Math.ceil(seconds / 3600)}h`;
};

export default function CrawlProgressOverlay() {
    const {
        isCrawling,
        crawlRuntime,
        crawlRate,
        elapsedTime,
        pages,
        logs,
        stats,
        config,
        handleStartPause,
        clearCrawlerWorkspace,
        healthScore
    } = useSeoCrawler();

    const [isMinimized, setIsMinimized] = useState(false);
    const feedRef = useRef<HTMLDivElement | null>(null);

    const liveFeed = useMemo(
        () => logs.filter((entry) => entry.source === 'crawler').slice(-20),
        [logs]
    );

    const progress = useMemo(() => {
        const maxPages = parseInt(String(config.limit || 0), 10) || 0;
        const total = maxPages > 0 ? maxPages : crawlRuntime.discovered || crawlRuntime.crawled;
        return total > 0 ? Math.min(100, (crawlRuntime.crawled / total) * 100) : 0;
    }, [config.limit, crawlRuntime]);

    const statusCounts = useMemo(() => ({
        ok: pages.filter((page) => page.statusCode >= 200 && page.statusCode < 300).length,
        redirects: pages.filter((page) => page.statusCode >= 300 && page.statusCode < 400).length,
        broken: pages.filter((page) => page.statusCode >= 400 && page.statusCode < 500).length,
        server: pages.filter((page) => page.statusCode >= 500).length
    }), [pages]);

    useEffect(() => {
        if (!feedRef.current) return;
        feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }, [liveFeed]);

    useEffect(() => {
        if (!isCrawling) {
            setIsMinimized(false);
        }
    }, [isCrawling]);

    if (!isCrawling) return null;

    const eta = formatEta(crawlRuntime.queued, crawlRate);

    if (isMinimized) {
        return (
            <button
                type="button"
                onClick={() => setIsMinimized(false)}
                className="fixed bottom-0 left-0 right-0 z-40 flex h-[40px] items-center gap-4 border-t border-[#222] bg-[#111] px-4 text-left"
            >
                <div className="flex items-center gap-2 text-[11px] font-semibold text-white">
                    <Zap size={13} className="text-[#F59E0B]" />
                    Crawl in progress
                </div>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#1c1c20]">
                    <div className="h-full rounded-full bg-gradient-to-r from-[#F59E0B] via-[#ff6b7d] to-[#f8b4bd]" style={{ width: `${progress}%` }} />
                </div>
                <div className="hidden text-[11px] text-[#9a9aa0] md:block">{crawlRuntime.crawled} pages · {crawlRate} p/s · {elapsedTime}</div>
                <div className="flex items-center gap-2" onClick={(event) => event.stopPropagation()}>
                    <button onClick={() => handleStartPause()} className="rounded border border-[#2e2e33] px-2 py-1 text-[10px] font-bold text-[#ddd] hover:border-[#444]">
                        <Pause size={11} />
                    </button>
                    <button onClick={() => clearCrawlerWorkspace()} className="rounded border border-[#44262a] px-2 py-1 text-[10px] font-bold text-[#ff8d99] hover:border-[#6b3037]">
                        <Square size={11} />
                    </button>
                </div>
            </button>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-[2px]">
            <div className="w-full max-w-[720px] overflow-hidden rounded-2xl border border-[#27272b] bg-[#111] shadow-[0_30px_100px_rgba(0,0,0,0.6)]">
                <div className="border-b border-[#222] bg-[#151518] px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#777]">Live Crawl</div>
                            <h2 className="mt-1 flex items-center gap-2 text-[22px] font-black tracking-tight text-white">
                                <Zap size={20} className="text-[#F59E0B]" />
                                Crawl in Progress
                            </h2>
                        </div>
                        <button
                            onClick={() => setIsMinimized(true)}
                            className="inline-flex items-center gap-2 rounded-lg border border-[#2e2e33] px-3 py-2 text-[11px] font-semibold text-[#bbb] hover:border-[#3a3a41] hover:text-white"
                        >
                            <Minimize2 size={14} />
                            Minimize
                        </button>
                    </div>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#1d1d21]">
                        <div className="h-full rounded-full bg-gradient-to-r from-[#F59E0B] via-[#ff6b7d] to-[#f8b4bd] transition-all" style={{ width: `${progress}%` }} />
                    </div>
                </div>

                <div className="grid gap-6 p-6 md:grid-cols-[1.1fr_0.9fr]">
                    <div className="space-y-5">
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: 'Pages crawled', value: `${crawlRuntime.crawled} / ~${Math.max(crawlRuntime.discovered, crawlRuntime.crawled)}` },
                                { label: 'Rate', value: `${crawlRate} p/s` },
                                { label: 'Queue remaining', value: crawlRuntime.queued },
                                { label: 'Elapsed', value: elapsedTime },
                                { label: 'Errors', value: (stats?.broken || 0) + statusCounts.server },
                                { label: 'ETA', value: eta }
                            ].map((metric) => (
                                <div key={metric.label} className="rounded-xl border border-[#212126] bg-[#0d0d10] p-4">
                                    <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#666]">{metric.label}</div>
                                    <div className="mt-2 text-[20px] font-black text-white">{metric.value}</div>
                                </div>
                            ))}
                        </div>

                        <div className="rounded-xl border border-[#212126] bg-[#0d0d10] p-4">
                            <div className="mb-3 flex items-center justify-between">
                                <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#666]">Live status feed</div>
                                <div className="text-[10px] text-[#666]">{liveFeed.length} latest entries</div>
                            </div>
                            <div ref={feedRef} className="max-h-[280px] overflow-y-auto rounded-lg border border-[#1a1a1d] bg-[#09090b] p-3 font-mono text-[11px] custom-scrollbar">
                                {liveFeed.length === 0 ? (
                                    <div className="text-[#555]">Crawler is warming up...</div>
                                ) : (
                                    liveFeed.map((entry, index) => (
                                        <div key={`${entry.time}-${index}`} className={`border-b border-[#141418] py-2 last:border-b-0 ${getLogTone(entry)}`}>
                                            <span className="mr-2 text-[#555]">{new Date(entry.time).toLocaleTimeString()}</span>
                                            <span>{entry.msg}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-5">
                        <div className="rounded-xl border border-[#212126] bg-[#0d0d10] p-4">
                            <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#666]">Runtime</div>
                            <div className="mt-3 grid gap-3 text-[12px] text-[#c3c3c8]">
                                <div className="flex items-center justify-between"><span>Stage</span><span className="font-semibold text-white">{crawlRuntime.stage}</span></div>
                                <div className="flex items-center justify-between"><span>Workers</span><span className="font-semibold text-white">{crawlRuntime.activeWorkers}/{crawlRuntime.concurrency}</span></div>
                                <div className="flex items-center justify-between"><span>Utilization</span><span className="font-semibold text-white">{Math.round(Number(crawlRuntime.workerUtilization || 0))}%</span></div>
                                <div className="flex items-center justify-between"><span>Max depth seen</span><span className="font-semibold text-white">{crawlRuntime.maxDepthSeen}</span></div>
                                <div className="flex items-center justify-between"><span>Mode</span><span className="font-semibold text-white">{crawlRuntime.mode}</span></div>
                                <div className="flex items-center justify-between"><span>Health so far</span><span className="font-semibold text-white">{healthScore.score}/100</span></div>
                            </div>
                        </div>

                        <div className="rounded-xl border border-[#212126] bg-[#0d0d10] p-4">
                            <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#666]">Live stats</div>
                            <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold">
                                <span className="rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-green-300">2xx: {statusCounts.ok}</span>
                                <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-amber-300">3xx: {statusCounts.redirects}</span>
                                <span className="rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-red-300">4xx: {statusCounts.broken}</span>
                                <span className="rounded-full border border-red-700/20 bg-red-700/10 px-3 py-1 text-red-200">5xx: {statusCounts.server}</span>
                                <span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-sky-300">Score: {healthScore.score}</span>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={() => handleStartPause()}
                                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#2e2e33] bg-[#18181c] px-4 py-3 text-[12px] font-bold text-white hover:border-[#3d3d44]"
                            >
                                <Pause size={14} />
                                Pause
                            </button>
                            <button
                                onClick={() => clearCrawlerWorkspace()}
                                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#5a242c] bg-[#2a0d12] px-4 py-3 text-[12px] font-bold text-[#ffb2bb] hover:border-[#7a2e39]"
                            >
                                <Square size={14} />
                                Stop
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
