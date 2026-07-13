// services/WebhookService.ts

export interface WebhookConfig {
    url: string;
    events: string[];
    secret: string;
}

export interface ManagedWebhookRecord {
    id: string;
    projectId: string;
    name: string;
    url: string;
    events: string[];
    secretConfigured: boolean;
    lastDeliveryAt: string | null;
    createdAt: string;
}

const configuredCrawlerApiUrl = (import.meta as any).env?.VITE_CRAWLER_API_URL;
const apiBase = configuredCrawlerApiUrl || (typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}:3001`
    : 'http://localhost:3001');

async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${apiBase}${path}`, {
        headers: {
            'Content-Type': 'application/json',
            ...(init?.headers || {})
        },
        ...init
    });

    if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Request failed with ${response.status}`);
    }

    return response.json() as Promise<T>;
}

class WebhookService {
    static list(projectId: string) {
        return request<{ data: ManagedWebhookRecord[] }>(`/api/internal/projects/${projectId}/webhooks`);
    }

    static create(projectId: string, payload: { name: string; url: string; events: string[]; secret?: string }) {
        return request<{ record: ManagedWebhookRecord }>(`/api/internal/projects/${projectId}/webhooks`, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    }

    static remove(projectId: string, webhookId: string) {
        return request<{ success: boolean }>(`/api/internal/projects/${projectId}/webhooks/${webhookId}`, {
            method: 'DELETE'
        });
    }

    static async dispatch(config: WebhookConfig, event: string, payload: any) {
        if (!config.url || !config.events.includes(event)) return;

        try {
            const res = await fetch(config.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Seesby-Event': event,
                    'X-Seesby-Signature': this.computeSignature(payload, config.secret)
                },
                body: JSON.stringify({
                    event,
                    timestamp: new Date().toISOString(),
                    payload
                })
            });
            return res.status;
        } catch (e) {
            console.error(`Webhook dispatch failed to ${config.url}:`, e);
            return 500;
        }
    }

    static computeSignature(payload: any, secret: string) {
        // Simple placeholder for HMAC-SHA256
        return `sha256=${secret || 'seesby'}-${JSON.stringify(payload).length}`;
    }
}

export default WebhookService;
