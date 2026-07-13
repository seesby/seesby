// services/jobs/BackgroundMetricsStore.ts
// ── Background Metrics Store ───────────────────────────────────────
// Simple key-value store for persisting background metric timestamps
// and metadata. Uses localStorage on the client, in-memory on server.

export interface BackgroundMetricEntry {
  key: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

type StorageAdapter = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

function createStorage(): StorageAdapter {
  if (typeof localStorage !== 'undefined') {
    return localStorage;
  }
  const mem = new Map<string, string>();
  return {
    getItem: (k) => mem.get(k) ?? null,
    setItem: (k, v) => { mem.set(k, v); },
  };
}

const STORAGE_KEY = 'seesby:background-metrics';
const storage = createStorage();

function loadAll(): Record<string, BackgroundMetricEntry> {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAll(data: Record<string, BackgroundMetricEntry>): void {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // quota exceeded — degrade silently
  }
}

export const BackgroundMetricsStore = {
  /** Record a job completion timestamp with optional metadata */
  record(key: string, metadata?: Record<string, unknown>): void {
    const all = loadAll();
    all[key] = { key, timestamp: Date.now(), metadata };
    saveAll(all);
  },

  /** Get the last run timestamp for a metric key */
  getLastRun(key: string): number | null {
    const all = loadAll();
    return all[key]?.timestamp ?? null;
  },

  /** Get a full metric entry including metadata */
  getEntry(key: string): BackgroundMetricEntry | null {
    const all = loadAll();
    return all[key] ?? null;
  },

  /** Get all background metric entries */
  getAll(): Record<string, BackgroundMetricEntry> {
    return loadAll();
  },

  /** Check if a metric key was run within the given duration (ms) */
  isFresh(key: string, maxAgeMs: number): boolean {
    const ts = this.getLastRun(key);
    if (!ts) return false;
    return Date.now() - ts < maxAgeMs;
  },

  /** Get all sessions from IndexedDB that have GSC connections */
  async getConnectedSessions(provider: string): Promise<Array<{
    sessionId: string;
    projectId: string;
    startUrl: string;
    siteUrl?: string;
    propertyId?: string;
    accessToken?: string;
    googleEmail?: string;
  }>> {
    try {
      const { crawlDb } = await import('../CrawlDatabase');
      const { getProjectCachedCrawlerIntegrations } = await import('../CrawlerIntegrationsService');

      // Get all sessions (both completed and running — enrichments may need active sessions too)
      const sessions = await crawlDb.sessions.toArray();

      const connected: Array<any> = [];
      for (const session of sessions) {
        try {
          const integrations = getProjectCachedCrawlerIntegrations(session.projectId);
          const google = integrations?.google;
          if (!google?.hasCredentials) continue;

          const entry: any = {
            sessionId: session.id,
            projectId: session.projectId,
            startUrl: session.startUrl,
            // Access tokens are managed server-side and stripped from cached credentials.
            // Jobs should use the token refresh flow via GoogleOAuthHelper to get fresh tokens.
            accessToken: undefined, // Will be refreshed on-demand by the job
            googleEmail: google.accountLabel || undefined,
            needsTokenRefresh: true,
          };

          if (provider === 'gsc') {
            entry.siteUrl = google.selection?.siteUrl || google.sync?.siteUrl;
            if (!entry.siteUrl) continue;
          } else if (provider === 'ga4') {
            entry.propertyId = google.selection?.propertyId || google.sync?.propertyId;
            if (!entry.propertyId) continue;
          } else if (provider === 'backlinks') {
            // Check for Ahrefs/Semrush connections
            const ahrefs = (integrations as any)?.ahrefs;
            const semrush = (integrations as any)?.semrush;
            if (!ahrefs?.hasCredentials && !semrush?.hasCredentials) continue;
            entry.ahrefsToken = (ahrefs?.credentials as any)?.apiKey;
            entry.semrushApiKey = (semrush?.credentials as any)?.apiKey;
          }

          connected.push(entry);
        } catch {
          // skip sessions with missing integration data
        }
      }

      return connected;
    } catch {
      return [];
    }
  },
};
