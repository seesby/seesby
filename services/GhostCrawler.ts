import { normalizeUrl } from './UrlUtils';
import { crawlDb, upsertPages, type CrawledPage } from './CrawlDatabase';
import { UrlNormalization } from './UrlNormalization';
import { storageRouter } from './StorageRouter';
import { CrawlQueueService } from './CrawlQueueService';
import { extractPage, type ExtractionResult } from './crawler/pipeline/L2-extract';
import { enrichPage, type EnrichmentResult } from './crawler/pipeline/L3-enrich';
import type { CrawlConfig } from '@seesby/types';
import type { FingerprintResult } from '@seesby/fingerprint';

export interface GhostCrawlConfig {
    maxConcurrent?: number;
    maxDepth?: number;
    limit?: number;
    userAgent?: string;
    aiCategorization?: boolean;
    crawlResources?: boolean;
    /** Whether to respect robots.txt directives (default: true) */
    respectRobotsTxt?: boolean;
    /** Whether to use the L0-L8 pipeline extraction instead of simple parseHtml (default: false) */
    usePipelineExtraction?: boolean;
    /** Fingerprint result from L5 probe (enables fingerprint-gated enrichment) */
    fingerprint?: FingerprintResult | null;
    /** Crawl config for pipeline enrichment (connections, AI, etc.) */
    pipelineConfig?: CrawlConfig;
}

// ── Robots.txt Parser & Rules Engine ──────────────────────────────

interface RobotsRule {
    path: string;
    allow: boolean;
}

interface RobotsRules {
    /** Rules for our user-agent (or `*` fallback) */
    rules: RobotsRule[];
    /** Crawl-delay in seconds (0 = not specified) */
    crawlDelay: number;
    /** Sitemaps declared in robots.txt */
    sitemaps: string[];
    /** Raw robots.txt text */
    raw: string;
}

/**
 * Parse a robots.txt file into rules for a specific user-agent.
 * Follows the robots.txt spec (RFC 9309) with longest-match precedence.
 */
function parseRobotsTxt(robotsText: string, userAgent: string): RobotsRules {
    const lines = robotsText.split(/\r?\n/);
    const uaLower = userAgent.toLowerCase();

    // Collect all user-agent blocks
    // Each block starts with one or more User-agent: lines followed by rules
    const blocks: { agents: string[]; rules: RobotsRule[]; crawlDelay: number }[] = [];
    let currentBlock: { agents: string[]; rules: RobotsRule[]; crawlDelay: number } | null = null;
    const sitemaps: string[] = [];

    for (const rawLine of lines) {
        const line = rawLine.split('#')[0].trim(); // strip comments
        if (!line) continue;

        const colonIdx = line.indexOf(':');
        if (colonIdx === -1) continue;

        const field = line.slice(0, colonIdx).trim().toLowerCase();
        const value = line.slice(colonIdx + 1).trim();

        if (field === 'user-agent') {
            // Start a new block if the previous one had rules (or no rules yet)
            if (currentBlock && currentBlock.rules.length > 0) {
                blocks.push(currentBlock);
                currentBlock = null;
            }
            if (!currentBlock) {
                currentBlock = { agents: [], rules: [], crawlDelay: 0 };
            }
            currentBlock.agents.push(value.toLowerCase());
        } else if (field === 'allow' || field === 'disallow') {
            if (!currentBlock) {
                currentBlock = { agents: ['*'], rules: [], crawlDelay: 0 };
            }
            currentBlock.rules.push({
                path: value,
                allow: field === 'allow',
            });
        } else if (field === 'crawl-delay') {
            if (!currentBlock) {
                currentBlock = { agents: ['*'], rules: [], crawlDelay: 0 };
            }
            const delay = parseFloat(value);
            if (!isNaN(delay) && delay > 0) {
                currentBlock.crawlDelay = delay;
            }
        } else if (field === 'sitemap') {
            if (value) sitemaps.push(value);
        }
    }

    // Push the last block
    if (currentBlock) {
        blocks.push(currentBlock);
    }

    // Find the best matching block: exact UA match first, then wildcard
    let matchedBlock = blocks.find(b => b.agents.includes(uaLower));
    if (!matchedBlock) {
        matchedBlock = blocks.find(b => b.agents.includes('*'));
    }
    // Fallback: no rules = everything allowed
    const rules = matchedBlock?.rules ?? [];
    const crawlDelay = matchedBlock?.crawlDelay ?? 0;

    // Sort rules by path length descending (longest match wins)
    // Also filter out empty Disallow: (which means "allow all")
    const sortedRules = rules
        .filter(r => !(r.path === '' && !r.allow)) // empty Disallow = allow all
        .sort((a, b) => b.path.length - a.path.length);

    return { rules: sortedRules, crawlDelay, sitemaps, raw: robotsText };
}

/**
 * Check if a URL path is allowed by the robots.txt rules.
 * Uses longest-match precedence (RFC 9309).
 */
function isUrlAllowed(url: string, rules: RobotsRules): boolean {
    if (!rules.rules.length) return true; // no rules = everything allowed

    let path: string;
    try {
        const parsed = new URL(url);
        path = parsed.pathname + parsed.search;
    } catch {
        return true; // can't parse, allow by default
    }

    // Find the first matching rule (longest path match wins due to sorting)
    for (const rule of rules.rules) {
        if (rule.path === '') continue;
        // Support wildcards with * matching any sequence
        if (matchesRobotsPath(path, rule.path)) {
            return rule.allow;
        }
    }

    return true; // no matching rule = allowed
}

/**
 * Check if a URL path matches a robots.txt pattern.
 * Supports `*` as wildcard and `$` as end-of-path anchor.
 */
function matchesRobotsPath(urlPath: string, pattern: string): boolean {
    // Convert robots.txt pattern to a regex
    // `*` → `.*`, `$` → end anchor
    let regexStr = pattern
        .replace(/[.+?^{}()|[\]\\]/g, '\\$&') // escape regex special chars (except * and $)
        .replace(/\*/g, '.*'); // wildcard

    // Handle $ end anchor
    if (regexStr.endsWith('$')) {
        regexStr = regexStr.slice(0, -1) + '$';
    } else {
        // Without $, pattern matches as a prefix
        regexStr = regexStr + '.*';
    }

    try {
        const regex = new RegExp('^' + regexStr, 'i');
        return regex.test(urlPath);
    } catch {
        // If regex is invalid, fall back to simple startsWith
        return urlPath.startsWith(pattern);
    }
}

type GhostEvent = 'page' | 'progress' | 'complete' | 'error' | 'log' | 'sitemap';

export class GhostCrawler {
    private queue: { url: string; depth: number }[] = [];
    private visited = new Set<string>();
    private isStopped = false;
    private activeRequests = 0;
    private crawledCount = 0;
    private discoveredCount = 0;
    private maxDepthSeen = 0;
    private startTime = 0;
    private listeners: Record<string, Function[]> = {};
    private aiWorker: Worker | null = null;
    private aiWorkerReady = false;
    private runLoopActive = false;
    private baseHostname = '';
    private abortController: AbortController | null = null;
    private currentSessionId: string | null = null;
    private flushTimer: number | null = null;
    private pendingPages: CrawledPage[] = [];
    private sitemapUrls: Set<string> | null = null;
    private sitemapSources: string[] = [];
    private queueService: CrawlQueueService | null = null;
    private useRemoteQueue = false;
    private robotsRules: RobotsRules | null = null;
    private lastRequestTime = 0;
    private respectRobots = true;
    private usePipelineExtraction = false;
    private fingerprint: FingerprintResult | null = null;
    private pipelineConfig: CrawlConfig | null = null;

    constructor(private config: GhostCrawlConfig, options?: { useRemoteQueue?: boolean }) {
        if (config.aiCategorization) {
            this.initAiWorker();
        }
        if (options?.useRemoteQueue) {
            this.useRemoteQueue = true;
        }
        this.respectRobots = config.respectRobotsTxt !== false; // default true
        this.usePipelineExtraction = config.usePipelineExtraction ?? false;
        this.fingerprint = config.fingerprint ?? null;
        this.pipelineConfig = config.pipelineConfig ?? null;
    }

    private initAiWorker() {
        if (typeof window !== 'undefined' && window.Worker) {
            this.aiWorker = new Worker(new URL('../workers/ai-scoring.worker.ts', import.meta.url), { type: 'module' });
            
            this.aiWorker.onmessage = (e) => {
                if (e.data.status === 'ready') {
                    this.emit('log', 'Local AI Content Scoring Model Loaded (WebGPU/WASM)', 'success');
                    this.aiWorkerReady = true;
                } else if (e.data.status === 'progress') {
                    // Optional: show model download progress
                }
            };
            
            this.aiWorker.postMessage({ type: 'init' });
        }
    }

    on(event: GhostEvent, listener: Function) {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(listener);
    }

    private emit(event: GhostEvent, ...args: any[]) {
        this.listeners[event]?.forEach(fn => fn(...args));
    }

    getCrawledCount() {
        return this.crawledCount;
    }

    stop() {
        this.isStopped = true;
        // Abort all in-flight fetch requests immediately
        if (this.abortController) {
            this.abortController.abort();
        }
        // Stop remote queue heartbeat
        if (this.queueService) {
            this.queueService.stopHeartbeat();
            this.queueService.dispose();
            this.queueService = null;
        }
        // Clean up browser pool resources (lazy import to avoid circular deps)
        import('./crawler/pipeline/L1-fetch').then(m => m.destroyBrowserPool()).catch(() => {});

        // Fire-and-forget: flush remaining pages through StorageRouter
        // This is non-blocking so UI callers don't need to await stop()
        if (this.currentSessionId) {
            storageRouter.stopSession(this.currentSessionId).catch(err => {
                console.warn('[GhostCrawler] StorageRouter stopSession failed:', err);
            });
        }
        this.emit('log', 'Ghost Engine stopped by user.', 'info');
    }

    async start(startUrl: string, sessionId: string) {
        if (!startUrl || !sessionId) return;
        this.currentSessionId = sessionId;
        this.startTime = Date.now();
        this.abortController = new AbortController();

        // Start StorageRouter session for tiered persistence + dedup
        storageRouter.startSession(sessionId);

        // Extract base hostname for same-domain filtering
        try {
            const parsedUrl = new URL(startUrl.startsWith('http') ? startUrl : `https://${startUrl}`);
            this.baseHostname = parsedUrl.hostname.replace(/^www\./, '');
        } catch {
            this.baseHostname = '';
        }

        // If remote queue is enabled, create a DO session and use CrawlQueueService
        if (this.useRemoteQueue) {
            this.queueService = new CrawlQueueService(sessionId);
            try {
                await this.queueService.createSession({
                    sessionId,
                    startUrl,
                    maxDepth: this.config.maxDepth ?? 5,
                    maxPages: this.config.limit ?? 10000,
                    maxConcurrent: this.config.maxConcurrent ?? 5,
                    boostMode: false,
                    userAgent: this.config.userAgent ?? 'Seesby-Ghost/1.0',
                });
                this.queueService.startHeartbeat(10_000);
                this.emit('log', `Remote queue session created: ${sessionId}`, 'success');
            } catch (err: any) {
                this.emit('log', `Remote queue unavailable, falling back to local queue: ${err.message}`, 'warning');
                this.queueService = null;
                this.useRemoteQueue = false;
            }
        }

        const sitemapInfo = await this.fetchSitemapUrls(startUrl);
        this.sitemapUrls = sitemapInfo?.urls || null;
        this.sitemapSources = sitemapInfo?.sources || [];
        if (sitemapInfo) {
            this.emit('sitemap', {
                totalUrls: sitemapInfo.urls.size,
                sitemapSources: this.sitemapSources,
                coverageParsed: sitemapInfo.coverageParsed,
                urls: sitemapInfo.urls
            });
        }

        // ── Robots.txt enforcement: parse and store rules for this domain ──
        if (this.respectRobots) {
            try {
                const parsed = new URL(startUrl.startsWith('http') ? startUrl : `https://${startUrl}`);
                const base = `${parsed.protocol}//${parsed.host}`;
                const robotsText = await this.fetchText(`${base}/robots.txt`);
                if (robotsText) {
                    const ua = this.config.userAgent || 'Seesby-Ghost/1.0';
                    this.robotsRules = parseRobotsTxt(robotsText, ua);
                    const blockedCount = this.robotsRules.rules.filter(r => !r.allow).length;
                    this.emit('log', `Robots.txt parsed: ${this.robotsRules.rules.length} rules (${blockedCount} disallow), crawl-delay: ${this.robotsRules.crawlDelay}s`, 'info');

                    // If the start URL itself is blocked, warn but still crawl (user explicitly requested it)
                    if (!isUrlAllowed(startUrl, this.robotsRules)) {
                        this.emit('log', `Warning: Start URL is disallowed by robots.txt. Crawling anyway (user-initiated).`, 'warning');
                    }
                }
            } catch (err: any) {
                this.emit('log', `Robots.txt fetch failed: ${err.message}. Proceeding without robots rules.`, 'warning');
            }
        }

        this.queue.push({ url: startUrl, depth: 0 });
        this.discoveredCount = 1;
        this.emit('log', `Ghost Engine starting at ${startUrl}`, 'info');
        this.scheduleRun();
    }

    private getBridgeTarget(url: string) {
        let bridgeUrl = (import.meta as any).env?.VITE_GHOST_BRIDGE_URL;
        if (!bridgeUrl) return url;
        
        // Ensure bridge URL ends with a slash before the query param
        const base = bridgeUrl.replace(/\/$/, '');
        return `${base}/?url=${encodeURIComponent(url)}`;
    }

    private async fetchText(url: string): Promise<string | null> {
        const bridgeTarget = this.getBridgeTarget(url);
        const isUsingBridge = bridgeTarget !== url;

        try {
            const response = await fetch(bridgeTarget, {
                mode: 'cors',
                headers: { 'User-Agent': this.config.userAgent || 'Seesby-Ghost/1.0' },
                signal: this.abortController?.signal
            });

            if (response.ok) {
                return await response.text();
            }

            if (isUsingBridge) {
                this.emit('log', `Ghost Bridge error (${response.status}) fetching ${url}. Attempting direct fallback...`, 'warning');
                // Fallback to direct fetch
                const fallbackRes = await fetch(url, {
                    mode: 'cors',
                    headers: { 'User-Agent': this.config.userAgent || 'Seesby-Ghost/1.0' },
                    signal: this.abortController?.signal
                });
                if (fallbackRes.ok) {
                    this.emit('log', `Direct fetch successful for ${url}`, 'success');
                    return await fallbackRes.text();
                }
            }
            
            return null;
        } catch (err: any) {
            if (isUsingBridge) {
                this.emit('log', `Ghost Bridge failed: ${err.message}. Attempting direct fallback...`, 'warning');
                try {
                    const fallbackRes = await fetch(url, {
                        mode: 'cors',
                        headers: { 'User-Agent': this.config.userAgent || 'Seesby-Ghost/1.0' },
                        signal: this.abortController?.signal
                    });
                    if (fallbackRes.ok) return await fallbackRes.text();
                } catch { /* ignore fallback error */ }
            }
            return null;
        }
    }

    private async fetchSitemapUrls(startUrl: string): Promise<{ urls: Set<string>; sources: string[]; coverageParsed: boolean } | null> {
        try {
            const parsed = new URL(startUrl.startsWith('http') ? startUrl : `https://${startUrl}`);
            const base = `${parsed.protocol}//${parsed.host}`;
            const robotsText = await this.fetchText(`${base}/robots.txt`);
            const discoveredSitemaps = robotsText
                ? robotsText
                    .split(/\r?\n/)
                    .map((line) => line.trim())
                    .filter((line) => /^sitemap:/i.test(line))
                    .map((line) => line.split(':').slice(1).join(':').trim())
                    .filter(Boolean)
                : [];

            const targetSitemaps = discoveredSitemaps.length > 0
                ? discoveredSitemaps
                : [`${base}/sitemap.xml`];

            const collected = new Set<string>();
            const visited = new Set<string>();
            let coverageParsed = false;

            const parseSitemap = async (sitemapUrl: string) => {
                if (!sitemapUrl || visited.has(sitemapUrl)) return;
                visited.add(sitemapUrl);
                console.log(`[GhostCrawler] Fetching sitemap: ${sitemapUrl}`);

                const xmlText = await this.fetchText(sitemapUrl);
                if (!xmlText) {
                    console.log(`[GhostCrawler] Failed to fetch sitemap text: ${sitemapUrl}`);
                    return;
                }

                const xml = new DOMParser().parseFromString(xmlText, 'application/xml');
                
                // Robust method to find tags regardless of namespace or case
                const getTags = (tagName: string) => {
                    const all = xml.getElementsByTagName('*');
                    return Array.from(all).filter(el => 
                        el.localName?.toLowerCase() === tagName.toLowerCase() || 
                        el.tagName?.toLowerCase() === tagName.toLowerCase()
                    );
                };

                const nestedSitemaps = getTags('sitemap');
                if (nestedSitemaps.length > 0) {
                    console.log(`[GhostCrawler] Detected sitemap index: ${sitemapUrl} (${nestedSitemaps.length} nested)`);
                    for (const sitemapNode of nestedSitemaps) {
                        const loc = sitemapNode.getElementsByTagName('loc')[0]?.textContent?.trim() || 
                                    sitemapNode.getElementsByTagName('Loc')[0]?.textContent?.trim();
                        if (loc) await parseSitemap(loc);
                    }
                    return;
                }

                const urls = getTags('url');
                console.log(`[GhostCrawler] Found ${urls.length} URL entries in sitemap: ${sitemapUrl}`);
                urls.forEach((urlNode) => {
                    const loc = urlNode.getElementsByTagName('loc')[0]?.textContent?.trim() || 
                                urlNode.getElementsByTagName('Loc')[0]?.textContent?.trim();
                    const normalized = loc ? UrlNormalization.toCanonical(loc) : '';
                    if (normalized) {
                        coverageParsed = true;
                        collected.add(normalized);
                    } else if (loc) {
                        // Even if it doesn't normalize to our preferred format, if we see a loc, we've parsed coverage.
                        coverageParsed = true;
                    }
                });

                if (urls.length === 0) {
                    const locMatches = Array.from(xmlText.matchAll(/<loc>([\s\S]*?)<\/loc>/gi))
                        .map((match) => String(match[1] || '').replace(/<!\[CDATA\[|\]\]>/g, '').trim())
                        .filter(Boolean);

                    console.log(`[GhostCrawler] Fallback regex found ${locMatches.length} loc matches: ${sitemapUrl}`);
                    for (const loc of locMatches) {
                        const normalized = UrlNormalization.toCanonical(loc);
                        if (!normalized) continue;
                        if (/sitemap|\.xml(\?|$)|format=xml/i.test(normalized)) {
                            if (!visited.has(loc)) await parseSitemap(loc);
                            continue;
                        }
                        coverageParsed = true;
                        collected.add(normalized);
                    }
                }
            };

            for (const sitemapUrl of targetSitemaps) {
                await parseSitemap(sitemapUrl);
            }

            console.log(`[GhostCrawler] Finished sitemap parsing. Total unique URLs: ${collected.size}, coverageParsed: ${coverageParsed}`);

            if (targetSitemaps.length === 0) {
                return null;
            }

            return {
                urls: collected,
                sources: targetSitemaps,
                coverageParsed
            };
        } catch {
            return null;
        }
    }

    private scheduleRun() {
        if (this.isStopped || this.runLoopActive) return;
        this.run();
    }

    private async run() {
        this.runLoopActive = true;
        try {
            while (this.queue.length > 0 && !this.isStopped) {
                if (this.activeRequests >= (this.config.maxConcurrent || 5)) {
                    await new Promise(r => setTimeout(r, 100));
                    continue;
                }

                if (this.config.limit && this.crawledCount >= this.config.limit) {
                    this.emit('log', 'Crawl limit reached.', 'info');
                    break;
                }

                const item = this.queue.shift();
                if (!item || this.visited.has(item.url)) continue;

                this.visited.add(item.url);
                this.activeRequests++;
                
                this.crawlPage(item.url, item.depth).finally(() => {
                    this.activeRequests--;
                    this.emitProgress();
                    // Check isStopped BEFORE rescheduling — this is the key fix
                    if (this.isStopped) {
                        if (this.activeRequests === 0) {
                            this.flushPendingPages();
                            this.emit('complete');
                        }
                        return;
                    }
                    if (this.queue.length > 0) {
                        this.scheduleRun();
                    } else if (this.activeRequests === 0) {
                        this.flushPendingPages();
                        this.emit('complete');
                    }
                });
            }
        } finally {
            this.runLoopActive = false;
        }
    }

    private async crawlPage(url: string, depth: number) {
        // Early exit if stopped
        if (this.isStopped) return;

        // ── Robots.txt enforcement: check before fetching ──
        if (this.respectRobots && this.robotsRules) {
            if (!isUrlAllowed(url, this.robotsRules)) {
                this.crawledCount++;
                this.emit('page', {
                    url,
                    title: '',
                    metaDesc: '',
                    links: [],
                    depth,
                    statusCode: 200,
                    loadTime: 0,
                    wordCount: 0,
                    contentType: 'text/html',
                    timestamp: Date.now(),
                    skipped: true,
                    blockedBy: 'robots' as const,
                });
                this.emit('log', `Skipped (robots.txt disallow): ${url}`, 'info');
                return;
            }

            // ── Crawl-delay enforcement ──
            if (this.robotsRules.crawlDelay > 0) {
                const elapsed = Date.now() - this.lastRequestTime;
                const required = this.robotsRules.crawlDelay * 1000;
                if (elapsed < required) {
                    await new Promise(r => setTimeout(r, required - elapsed));
                }
            }
        }
        this.lastRequestTime = Date.now();

        try {
            const targetUrl = this.getBridgeTarget(url);

            // Skip non-HTML resources to save Worker requests unless explicitly enabled
            const lowerUrl = url.toLowerCase();
            const skipExtensions = ['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico', '.woff', '.woff2', '.ttf', '.eot', '.mp4', '.mp3', '.pdf', '.zip', '.map'];
            if (!this.config.crawlResources && skipExtensions.some(ext => lowerUrl.endsWith(ext) || lowerUrl.includes(ext + '?'))) {
                // Still record it as a discovered resource, but don't fetch through the proxy
                this.crawledCount++;
                this.emit('page', {
                    url,
                    title: '',
                    metaDesc: '',
                    links: [],
                    depth,
                    statusCode: 200,
                    loadTime: 0,
                    wordCount: 0,
                    contentType: lowerUrl.match(/\.(css|js)/) ? 'text/css' : 'image',
                    timestamp: Date.now(),
                    skipped: true
                });
                return;
            }

            const response = await fetch(targetUrl, {
                mode: 'cors',
                headers: { 'User-Agent': this.config.userAgent || 'Seesby-Ghost/1.0' },
                signal: this.abortController?.signal
            });

            if (this.isStopped) return;

            if (!response.ok) {
                const bridgeConfig = (import.meta as any).env?.VITE_GHOST_BRIDGE_URL;
                if (!bridgeConfig && response.status === 0) {
                    throw new Error('CORS Blocked. Please enable the Ghost Bridge or use a CORS extension.');
                }
                // Report the error page but don't throw
                this.crawledCount++;
                this.maxDepthSeen = Math.max(this.maxDepthSeen, depth);
                this.emit('page', {
                    url,
                    title: '',
                    metaDesc: '',
                    links: [],
                    depth,
                    statusCode: response.status,
                    loadTime: 0,
                    wordCount: 0,
                    contentType: response.headers.get('content-type') || '',
                    timestamp: Date.now()
                });
                return;
            }

            // Check content-type — only parse HTML
            const contentType = response.headers.get('content-type') || '';
            if (!contentType.includes('html') && !contentType.includes('text')) {
                this.crawledCount++;
                this.maxDepthSeen = Math.max(this.maxDepthSeen, depth);
                this.emit('page', {
                    url,
                    title: '',
                    metaDesc: '',
                    links: [],
                    depth,
                    statusCode: response.status,
                    loadTime: 0,
                    wordCount: 0,
                    contentType,
                    timestamp: Date.now()
                });
                return;
            }

            const html = await response.text();
            if (this.isStopped) return;

            const finalUrl = response.url || url;
            let pageData = this.usePipelineExtraction
                ? this.parseHtmlWithPipeline(url, html, depth, finalUrl, response)
                : this.parseHtml(url, html, depth, finalUrl);

            // Trigger AI Scoring asynchronously if worker is ready
            if (this.config.aiCategorization && this.aiWorker && this.aiWorkerReady) {
                const rawText = new DOMParser().parseFromString(html, 'text/html').body?.textContent || '';
                
                const aiResult = await new Promise((resolve) => {
                    const messageHandler = (e: MessageEvent) => {
                        if (e.data.id === url && e.data.status === 'complete') {
                            this.aiWorker?.removeEventListener('message', messageHandler);
                            resolve(e.data.result);
                        } else if (e.data.id === url && e.data.status === 'error') {
                            this.aiWorker?.removeEventListener('message', messageHandler);
                            resolve(null);
                        }
                    };
                    this.aiWorker!.addEventListener('message', messageHandler);
                    this.aiWorker!.postMessage({ id: url, url, text: rawText, type: 'score' });
                    
                    setTimeout(() => {
                        this.aiWorker?.removeEventListener('message', messageHandler);
                        resolve(null);
                    }, 5000);
                });

                if (aiResult) {
                    pageData = { ...pageData, ...aiResult as any };
                }
            }
            
            this.crawledCount++;
            this.maxDepthSeen = Math.max(this.maxDepthSeen, depth);
            
            // Queue for IndexedDB
            this.queueForPersistence(pageData);
            this.emit('page', pageData);

            if (this.config.maxDepth === undefined || depth < this.config.maxDepth) {
                this.enqueueLinks(pageData.links, depth + 1);
                
                if (this.config.crawlResources && (pageData as any).resources) {
                    this.enqueueLinks((pageData as any).resources, depth + 1);
                }
            }
        } catch (error: any) {
            // Don't emit errors for intentional aborts
            if (error.name === 'AbortError' || this.isStopped) return;
            this.emit('error', error);
            this.emit('log', `Failed ${url}: ${error.message}`, 'error');
        }
    }

    /**
     * Pipeline-enhanced HTML parsing using L2 extraction.
     * Extracts richer data: schema, content hash, render diff, images, meta, regex patterns.
     * Optionally runs L3 enrichment (GSC, GA4, CrUX, backlinks, AI) if fingerprint is available.
     */
    private parseHtmlWithPipeline(
        url: string,
        html: string,
        depth: number,
        finalUrl: string,
        response: Response,
    ): any {
        // Build a FetchResult-like object for L2 extraction
        const fetchResult = {
            url,
            finalUrl,
            html,
            statusCode: response.status,
            contentType: response.headers.get('content-type') || 'text/html',
            timingMs: 0,
            renderMethod: 'fastFetch' as const,
            headers: {} as Record<string, string>,
            contentLength: html.length,
            redirectChain: finalUrl !== url ? [url, finalUrl] : [],
        };

        // Run L2 extraction (synchronous, no network calls)
        let extraction: ExtractionResult | null = null;
        try {
            extraction = extractPage(fetchResult, this.fingerprint || undefined);
        } catch (err) {
            console.warn('[GhostCrawler] L2 extraction failed, falling back to simple parse:', err);
            return this.parseHtml(url, html, depth, finalUrl);
        }

        // Build pageData from extraction result — much richer than simple parseHtml
        const pageData: any = {
            url,
            finalUrl,
            redirectUrl: finalUrl !== url ? finalUrl : '',
            title: extraction.content.title,
            metaDesc: extraction.content.metaDescription,
            h1_1: extraction.content.h1[0] || '',
            canonical: extraction.robots.canonical || '',
            metaRobots: extraction.robots.metaRobots || '',
            links: extraction.links.internalLinks.map(l => l.href),
            externalLinks: extraction.links.externalLinks.map(l => l.href),
            internalOutlinks: extraction.links.totalInternal,
            externalOutlinks: extraction.links.totalExternal,
            depth,
            statusCode: response.status,
            loadTime: 0,
            wordCount: extraction.content.wordCount,
            contentType: fetchResult.contentType,
            imageCount: extraction.images.total,
            imagesWithoutAlt: extraction.images.missingAlt,
            indexable: extraction.robots.isIndexable,
            timestamp: Date.now(),
            // ── Pipeline-specific fields ──
            hash: extraction.contentHash.simhash,
            h2s: extraction.content.h2,
            h3s: extraction.content.h3,
            schemaTypes: extraction.schema.schemaTypes,
            hasOrgSchema: extraction.schema.hasOrganization,
            hasFaqSchema: extraction.schema.hasFAQ,
            hasArticleSchema: extraction.schema.hasArticle,
            hasBreadcrumbSchema: extraction.schema.hasBreadcrumb,
            hreflangTags: extraction.robots.hreflang,
            renderMethod: extraction.renderDiff.renderMethod,
            jsRenderDiff: {
                textDiffPercent: extraction.renderDiff.diffPercentage,
                jsOnlyLinks: 0,
                jsOnlyImages: 0,
                jsOnlySchema: false,
                criticalContentJsOnly: extraction.renderDiff.hasDiff,
                hydrationMismatch: false,
                staticWordCount: extraction.renderDiff.staticWordCount,
                renderedWordCount: extraction.renderDiff.renderedWordCount,
            },
            readabilityScore: extraction.content.readabilityScore,
            language: extraction.content.language,
            paragraphs: extraction.content.paragraphs,
            tables: extraction.content.tables,
            codeBlocks: extraction.content.codeBlocks,
            // Meta / social
            hasTwitterCard: !!extraction.meta.twitterCard,
            twitterCardType: extraction.meta.twitterCard,
            twitterImage: extraction.meta.twitterImage,
            // Regex patterns
            phoneNumbers: extraction.regexPatterns.phoneNumbers,
            emailAddresses: extraction.regexPatterns.emailAddresses,
            socialMediaUrls: extraction.regexPatterns.socialMediaUrls,
            // Resources for optional crawling
            resources: this.config.crawlResources ? this.extractResourcesFromHtml(html, url) : [],
        };

        // Run L3 enrichment asynchronously if fingerprint and config are available
        if (this.fingerprint && this.pipelineConfig) {
            this.enrichPageWithL3(url, extraction, depth)
                .then(enrichment => {
                    if (enrichment) {
                        // Update the page in IndexedDB with enrichment data
                        this.applyEnrichmentToPage(url, enrichment);
                    }
                })
                .catch(err => {
                    console.warn(`[GhostCrawler] L3 enrichment failed for ${url}:`, err);
                });
        }

        return pageData;
    }

    /**
     * Run L3 enrichment for a single page (async, non-blocking).
     */
    private async enrichPageWithL3(
        url: string,
        extraction: ExtractionResult,
        depth: number,
    ): Promise<EnrichmentResult | null> {
        if (!this.fingerprint || !this.pipelineConfig) return null;
        try {
            return await enrichPage(extraction, this.fingerprint, this.pipelineConfig);
        } catch {
            return null;
        }
    }

    /**
     * Apply L3 enrichment results to a page in the database.
     */
    private async applyEnrichmentToPage(url: string, enrichment: EnrichmentResult): Promise<void> {
        if (!this.currentSessionId) return;
        try {
            const update: Partial<CrawledPage> = {
                gscClicks: enrichment.gsc?.clicks ?? null,
                gscImpressions: enrichment.gsc?.impressions ?? null,
                gscCtr: enrichment.gsc?.ctr ?? null,
                gscPosition: enrichment.gsc?.position ?? null,
                gscEnrichedAt: Date.now(),
                ga4Sessions: enrichment.ga4?.sessions ?? null,
                ga4Users: enrichment.ga4?.users ?? null,
                ga4BounceRate: enrichment.ga4?.bounceRate ?? null,
                ga4Revenue: enrichment.ga4?.revenue ?? null,
                ga4EnrichedAt: Date.now(),
                urlRating: enrichment.backlinks?.urlRating ?? null,
                referringDomains: enrichment.backlinks?.referringDomains ?? null,
                backlinks: enrichment.backlinks?.totalBacklinks ?? null,
                backlinkEnrichedAt: Date.now(),
                fieldLcp: enrichment.crux?.lcp.p75 ?? null,
                fieldCls: enrichment.crux?.cls.p75 ?? null,
                fieldInp: enrichment.crux?.inp.p75 ?? null,
                contentQualityScore: enrichment.ai?.contentQuality ?? null,
                eeatScore: enrichment.ai?.eeatScore ?? null,
            };
            await crawlDb.pages.update(url, update);
        } catch (err) {
            console.warn(`[GhostCrawler] Failed to apply enrichment to ${url}:`, err);
        }
    }

    /**
     * Extract resource URLs (images, scripts, stylesheets) from HTML for optional crawling.
     */
    private extractResourcesFromHtml(html: string, baseUrl: string): string[] {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return [
            ...Array.from(doc.querySelectorAll('img')).map(img => img.getAttribute('src')),
            ...Array.from(doc.querySelectorAll('script')).map(s => s.getAttribute('src')),
            ...Array.from(doc.querySelectorAll('link[rel="stylesheet"]')).map(l => l.getAttribute('href')),
        ].filter(Boolean).map(src => normalizeUrl(src!, baseUrl)).filter(Boolean) as string[];
    }

    private parseHtml(url: string, html: string, depth: number, finalUrl: string) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const title = doc.querySelector('title')?.textContent || '';
        const metaDesc = doc.querySelector('meta[name="description"]')?.getAttribute('content') || '';
        const h1 = doc.querySelector('h1')?.textContent || '';
        const canonical = doc.querySelector('link[rel="canonical"]')?.getAttribute('href') || '';
        const robots = doc.querySelector('meta[name="robots"]')?.getAttribute('content') || '';
        const generator = doc.querySelector('meta[name="generator"]')?.getAttribute('content')?.toLowerCase() || '';
        
        // Universal CMS Fingerprinting
        let cmsType: string | null = null;
        if (generator.includes('wordpress')) cmsType = 'wordpress';
        else if (generator.includes('shopify') || html.includes('shopify-checkout') || html.includes('cdn.shopify.com')) cmsType = 'shopify';
        else if (generator.includes('wix') || html.includes('wix-first-interactive')) cmsType = 'wix';
        else if (generator.includes('squarespace') || html.includes('static1.squarespace.com')) cmsType = 'squarespace';
        else if (generator.includes('joomla')) cmsType = 'joomla';
        else if (generator.includes('drupal')) cmsType = 'drupal';
        else if (generator.includes('ghost')) cmsType = 'ghost';
        else if (generator.includes('webflow')) cmsType = 'webflow';
        else if (generator.includes('hubspot')) cmsType = 'hubspot';
        else if (html.includes('next.js') || html.includes('__NEXT_DATA__')) cmsType = 'nextjs';
        else if (html.includes('gatsby')) cmsType = 'gatsby';

        // Separate internal and external links
        const allLinks = Array.from(doc.querySelectorAll('a'))
            .map(a => (a as HTMLAnchorElement).getAttribute('href'))
            .filter(Boolean)
            .map(href => normalizeUrl(href!, url))
            .filter(Boolean) as string[];

        const internalLinks: string[] = [];
        const externalLinks: string[] = [];

        for (const link of allLinks) {
            if (this.isInternalUrl(link)) {
                internalLinks.push(link);
            } else {
                externalLinks.push(link);
            }
        }

        // Count images
        const images = doc.querySelectorAll('img');
        const imagesWithoutAlt = Array.from(images).filter(img => !img.getAttribute('alt')?.trim()).length;

        return {
            url,
            finalUrl,
            redirectUrl: finalUrl !== url ? finalUrl : '',
            title,
            metaDesc,
            h1_1: h1,
            canonical,
            metaRobots: robots,
            links: internalLinks,  // Only internal links for crawling
            externalLinks,         // Track external links separately
            internalOutlinks: internalLinks.length,
            externalOutlinks: externalLinks.length,
            depth,
            statusCode: 200,
            loadTime: 0,
            wordCount: html.split(/\s+/).length,
            contentType: 'text/html',
            imageCount: images.length,
            imagesWithoutAlt,
            indexable: !robots.includes('noindex'),
            cmsType,
            timestamp: Date.now(),
            // Pass these up for enqueuing if needed
            resources: this.config.crawlResources ? [
                ...Array.from(doc.querySelectorAll('img')).map(img => img.getAttribute('src')),
                ...Array.from(doc.querySelectorAll('script')).map(s => s.getAttribute('src')),
                ...Array.from(doc.querySelectorAll('link[rel="stylesheet"]')).map(l => l.getAttribute('href'))
            ].filter(Boolean).map(src => normalizeUrl(src!, url)).filter(Boolean) as string[] : []
        };
    }

    /**
     * Check if a URL belongs to the same domain as the start URL.
     */
    private isInternalUrl(url: string): boolean {
        if (!this.baseHostname) return true;
        try {
            const targetHost = new URL(url).hostname.replace(/^www\./, '');
            return targetHost === this.baseHostname;
        } catch {
            return false;
        }
    }

    private enqueueLinks(links: string[], nextDepth: number) {
        for (const link of links) {
            // Only enqueue internal URLs that haven't been visited or queued
            if (!this.isInternalUrl(link)) continue;
            if (this.visited.has(link)) continue;
            if (this.queue.some(q => q.url === link)) continue;

            this.queue.push({ url: link, depth: nextDepth });
            this.discoveredCount++;
        }
    }

    private emitProgress() {
        const elapsed = (Date.now() - this.startTime) / 1000;
        this.emit('progress', {
            queue: this.queue.length,
            crawled: this.crawledCount,
            discovered: this.discoveredCount,
            maxDepthSeen: this.maxDepthSeen,
            rate: elapsed > 0 ? this.crawledCount / elapsed : 0
        });
    }

    private queueForPersistence(page: any) {
        if (!this.currentSessionId) return;
        
        const dbPage: CrawledPage = {
            ...page,
            crawlId: this.currentSessionId,
            inSitemap: page.inSitemap ?? (this.sitemapUrls ? this.sitemapUrls.has(UrlNormalization.toCanonical(page.finalUrl || page.url)) : null),
            finalUrl: page.finalUrl || page.url,
            // ── NEW: Source & Volume ──
            mainKeywordSource: null,
            bestKeywordSource: null,
            mainKwSearchVolume: null,
            bestKwSearchVolume: null,
            mainKwEstimatedVolume: null,
            bestKwEstimatedVolume: null,
            volumeEstimationMethod: null,
            // ── NEW: Engagement ──
            sessionsDeltaAbsolute: null,
            sessionsDeltaPct: null,
            ga4EngagementTimePerPage: null,
            ga4EngagementRate: null,
            // ── NEW: Backlinks ──
            backlinkSource: null,
            backlinkUploadOverride: false,
            // ── NEW: Sync metadata ──
            gscEnrichedAt: null,
            ga4EnrichedAt: null,
            backlinkEnrichedAt: null,
            // ── NEW: HTML Flag ──
            isHtmlPage: (page.contentType || '').includes('text/html'),
            cmsType: page.cmsType || null,
            
            gscClicks: null,
            gscImpressions: null,
            gscCtr: null,
            gscPosition: null,
            mainKeyword: null,
            mainKwVolume: null,
            mainKwPosition: null,
            bestKeyword: null,
            bestKwVolume: null,
            bestKwPosition: null,
            ga4Views: null,
            ga4Sessions: null,
            ga4Users: null,
            ga4BounceRate: null,
            ga4AvgSessionDuration: null,
            ga4Conversions: null,
            ga4ConversionRate: null,
            ga4Revenue: null,
            sessionsDelta: null,
            isLosingTraffic: null,
            urlRating: null,
            referringDomains: null,
            backlinks: null,
            opportunityScore: null,
            businessValueScore: null,
            authorityScore: null,
            recommendedAction: null,
            recommendedActionReason: null,
            recommendedActionFactors: null,
            techHealthScore: null,
            contentQualityScore: null,
            searchVisibilityScore: null,
            engagementScore: null,
            authorityComputedScore: null,
            businessComputedScore: null,
            searchIntent: page.searchIntent || null,
            timestamp: Date.now()
        };

        this.pendingPages.push(dbPage);
        
        if (this.pendingPages.length >= 25) {
            this.flushPendingPages();
        } else if (!this.flushTimer) {
            this.flushTimer = window.setTimeout(() => this.flushPendingPages(), 1000);
        }
    }

    private async flushPendingPages() {
        if (this.flushTimer) {
            clearTimeout(this.flushTimer);
            this.flushTimer = null;
        }
        
        if (this.pendingPages.length === 0) return;
        
        const pagesToPush = [...this.pendingPages];
        this.pendingPages = [];
        
        try {
            // Persist through StorageRouter: handles dedup, hot tier (IndexedDB),
            // and queues lean summaries for warm tier (Turso) cloud sync
            if (this.currentSessionId) {
                const result = await storageRouter.persistPages(pagesToPush, this.currentSessionId);
                if (result.dedup.duplicates > 0) {
                    this.emit('log', `Dedup: ${result.dedup.duplicates} duplicate pages detected`, 'info');
                }
                if (result.budget.isLow) {
                    this.emit('log', `Storage budget warning: IDB ${result.budget.idbPercent}% used`, 'warning');
                }
            } else {
                // Fallback: direct IndexedDB write if no session
                await upsertPages(pagesToPush);
            }
        } catch (err) {
            console.error('[GhostCrawler] Failed to flush pages:', err);
            // Fallback to direct write on StorageRouter failure
            try {
                await upsertPages(pagesToPush);
            } catch (fallbackErr) {
                console.error('[GhostCrawler] Fallback flush also failed:', fallbackErr);
            }
        }
    }
}
