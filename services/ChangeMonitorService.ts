// services/ChangeMonitorService.ts

export interface MonitorConfig {
    watchedUrls: string[];
    checkInterval: '15min' | '1hr' | '6hr' | 'daily';
    alertOn: string[]; // ['statusChange', 'contentChange', 'titleChange', 'schemaChange', 'canonicalChange', 'robotsChange']
    notifyVia: string[]; // ['inApp', 'email', 'slack', 'webhook']
}

export interface PageSnapshot {
    url: string;
    contentHash: string;
    title: string;
    metaDesc: string;
    canonical: string;
    statusCode: number;
    schemaTypes: string[];
    robots: string;
    snapshotAt: string;
}

const storageKey = (projectId: string) => `seesby:monitor:snapshots:${projectId}`;

class ChangeMonitorService {
    static compareSnapshots(oldSnap: PageSnapshot, newSnap: PageSnapshot) {
        const changes: string[] = [];
        if (oldSnap.statusCode !== newSnap.statusCode) changes.push('status');
        if (oldSnap.contentHash !== newSnap.contentHash) changes.push('content');
        if (oldSnap.title !== newSnap.title) changes.push('title');
        if (oldSnap.metaDesc !== newSnap.metaDesc) changes.push('metaDesc');
        if (oldSnap.canonical !== newSnap.canonical) changes.push('canonical');
        if (oldSnap.robots !== newSnap.robots) changes.push('robots');
        
        const oldSchema = (oldSnap.schemaTypes || []).sort().join(',');
        const newSchema = (newSnap.schemaTypes || []).sort().join(',');
        if (oldSchema !== newSchema) changes.push('schema');
        
        return changes;
    }

    static buildSnapshot(page: any): PageSnapshot {
        return {
            url: page.url,
            contentHash: String(page.contentHash || page.textHash || `${page.title || ''}:${page.wordCount || 0}`),
            title: String(page.title || ''),
            metaDesc: String(page.metaDesc || ''),
            canonical: String(page.canonical || ''),
            statusCode: Number(page.statusCode || 0),
            schemaTypes: Array.isArray(page.schemaTypes) ? page.schemaTypes : [],
            robots: String(page.metaRobots1 || page.robots || ''),
            snapshotAt: new Date().toISOString()
        };
    }

    static saveSnapshots(projectId: string, pages: any[]) {
        if (typeof window === 'undefined') return;
        const snapshots = Object.fromEntries(pages.map((page) => [page.url, this.buildSnapshot(page)]));
        window.localStorage.setItem(storageKey(projectId), JSON.stringify(snapshots));
    }

    static loadSnapshots(projectId: string): Record<string, PageSnapshot> {
        if (typeof window === 'undefined') return {};
        try {
            return JSON.parse(window.localStorage.getItem(storageKey(projectId)) || '{}');
        } catch {
            return {};
        }
    }

    static detectChanges(projectId: string, pages: any[]) {
        const previous = this.loadSnapshots(projectId);
        return pages
            .map((page) => {
                const next = this.buildSnapshot(page);
                const prev = previous[page.url];
                if (!prev) return null;
                const changes = this.compareSnapshots(prev, next);
                return changes.length ? { url: page.url, changes, previous: prev, current: next } : null;
            })
            .filter((item): item is { url: string; changes: string[]; previous: PageSnapshot; current: PageSnapshot } => Boolean(item));
    }

    static async getWatchedUrls(pages: any[], limit = 50) {
        // Simple heuristic: top pages by impressions or traffic
        return pages
            .sort((a, b) => (b.gscImpressions || 0) - (a.gscImpressions || 0))
            .slice(0, limit)
            .map(p => p.url);
    }
}

export default ChangeMonitorService;
