// services/crawler/browser-pool/index.ts
// ── Browser Pool: Public API ────────────────────────────────────────
//
// Proxies fetch() calls through the user's browser session via Web
// Workers so that requests carry the user's cookies / session tokens.
// Includes per-target quota management, CAPTCHA detection & solving,
// and a pool of workers for concurrent scraping.

export { BrowserPoolManager } from './BrowserPoolManager';
export type { PoolConfig, ScrapeResult } from './BrowserPoolManager';

export { TargetQuotaManager } from './TargetQuotaManager';
export type { TargetQuota, QuotaConfig } from './TargetQuotaManager';

export { CaptchaSolver } from './CaptchaSolver';
export type { CaptchaResult } from './CaptchaSolver';

export type {
  WorkerMessage,
  WorkerFetchMessage,
  WorkerAbortMessage,
  WorkerFetchResult,
  WorkerFetchError,
  WorkerResponseMessage,
} from './ProxyWorker';
