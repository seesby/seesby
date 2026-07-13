import React, { useEffect, useState } from 'react';
import { Copy, KeyRound, Trash2, Webhook as WebhookIcon } from 'lucide-react';
import { SettingsSection, SettingsInput, SettingsSelect } from './shared';
import { useOptionalProject } from '../../../services/ProjectContext';
import { ApiKeyService, type ApiKeyRecord } from '../../../services/ApiKeyService';
import WebhookService, { type ManagedWebhookRecord } from '../../../services/WebhookService';

const WEBHOOK_EVENT_OPTIONS = [
  'crawl.started',
  'crawl.completed',
  'crawl.failed',
  'issue.new',
  'issue.fixed',
  'score.changed',
  'page.changed',
  'task.created',
  'task.completed'
];

const API_SCOPE_OPTIONS = ['read', 'write', 'crawl'];

export default function APIWebhooksTab() {
  const projectContext = useOptionalProject();
  const activeProject = projectContext?.activeProject || null;
  const [apiKeys, setApiKeys] = useState<ApiKeyRecord[]>([]);
  const [webhooks, setWebhooks] = useState<ManagedWebhookRecord[]>([]);
  const [keyName, setKeyName] = useState('Automation Key');
  const [keyScope, setKeyScope] = useState('read');
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [webhookName, setWebhookName] = useState('Primary Webhook');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookEvent, setWebhookEvent] = useState('crawl.completed');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const projectId = activeProject?.id || '';

  const loadData = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const [keyRes, webhookRes] = await Promise.all([
        ApiKeyService.list(projectId),
        WebhookService.list(projectId)
      ]);
      setApiKeys(keyRes.data);
      setWebhooks(webhookRes.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData().catch((error) => {
      console.error('[APIWebhooksTab] Failed to load project API resources:', error);
    });
  }, [projectId]);

  const createApiKey = async () => {
    if (!projectId) return;
    const result = await ApiKeyService.create(projectId, {
      name: keyName.trim() || 'Automation Key',
      scopes: [keyScope]
    });
    setGeneratedToken(result.token);
    setApiKeys((prev) => [result.record, ...prev]);
  };

  const createWebhook = async () => {
    if (!projectId || !webhookUrl.trim()) return;
    const result = await WebhookService.create(projectId, {
      name: webhookName.trim() || 'Webhook',
      url: webhookUrl.trim(),
      events: [webhookEvent],
      secret: webhookSecret.trim()
    });
    setWebhooks((prev) => [result.record, ...prev]);
    setWebhookUrl('');
    setWebhookSecret('');
  };

  return (
    <div className="space-y-6">
      <SettingsSection
        title="REST API"
        description={projectId ? `API access for project ${activeProject?.name || projectId}.` : 'Select a project to manage API keys.'}
      >
        <div className="grid grid-cols-2 gap-4">
          <SettingsInput
            label="Key Name"
            value={keyName}
            onChange={setKeyName}
            placeholder="Agency Sync"
          />
          <SettingsSelect
            label="Primary Scope"
            value={keyScope}
            onChange={setKeyScope}
            options={API_SCOPE_OPTIONS.map((scope) => ({ label: scope, value: scope }))}
          />
        </div>
        <button
          onClick={() => createApiKey().catch((error) => window.alert(error.message))}
          disabled={!projectId}
          className="px-4 py-2 rounded-lg bg-[#F59E0B] text-white text-[12px] font-bold disabled:opacity-50"
        >
          Generate API Key
        </button>
        {generatedToken && (
          <div className="p-3 bg-[#111] border border-[#222] rounded-lg space-y-2">
            <div className="text-[11px] font-bold text-white flex items-center gap-2">
              <KeyRound size={14} className="text-[#F59E0B]" /> Copy this key now
            </div>
            <div className="text-[11px] font-mono break-all text-emerald-300">{generatedToken}</div>
            <button
              onClick={() => navigator.clipboard.writeText(generatedToken)}
              className="px-3 py-1.5 rounded border border-[#333] text-[11px] text-white flex items-center gap-2"
            >
              <Copy size={12} /> Copy
            </button>
          </div>
        )}
        <div className="space-y-2">
          {apiKeys.map((key) => (
            <div key={key.id} className="flex items-center justify-between p-3 bg-[#111] border border-[#222] rounded-lg">
              <div>
                <div className="text-[12px] font-medium text-white">{key.name}</div>
                <div className="text-[10px] text-[#777]">
                  Scopes: {key.scopes.join(', ')} · Rate: {key.rateLimitPerMinute}/min · Last used: {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleString() : 'Never'}
                </div>
              </div>
              <button
                onClick={() => ApiKeyService.revoke(projectId, key.id).then(loadData).catch((error) => window.alert(error.message))}
                className="p-2 rounded border border-red-500/20 text-red-400 hover:bg-red-500/10"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
          {!loading && apiKeys.length === 0 && (
            <div className="text-[11px] text-[#666]">No API keys generated yet.</div>
          )}
        </div>
      </SettingsSection>

      <SettingsSection title="Webhooks" description="Receive crawl and issue events on your own endpoint.">
        <div className="grid grid-cols-2 gap-4">
          <SettingsInput
            label="Webhook Name"
            value={webhookName}
            onChange={setWebhookName}
            placeholder="Slack Relay"
          />
          <SettingsSelect
            label="Primary Event"
            value={webhookEvent}
            onChange={setWebhookEvent}
            options={WEBHOOK_EVENT_OPTIONS.map((eventName) => ({ label: eventName, value: eventName }))}
          />
        </div>
        <SettingsInput
          label="Webhook URL"
          value={webhookUrl}
          onChange={setWebhookUrl}
          placeholder="https://hooks.example.com/seesby"
        />
        <SettingsInput
          label="Signing Secret"
          description="Used to generate the X-Seesby-Signature HMAC header."
          value={webhookSecret}
          onChange={setWebhookSecret}
          placeholder="Optional but recommended"
        />
        <button
          onClick={() => createWebhook().catch((error) => window.alert(error.message))}
          disabled={!projectId || !webhookUrl.trim()}
          className="px-4 py-2 rounded-lg bg-[#111] border border-[#333] text-white text-[12px] font-bold disabled:opacity-50"
        >
          Register Webhook
        </button>
        <div className="space-y-2">
          {webhooks.map((hook) => (
            <div key={hook.id} className="p-3 bg-[#111] border border-[#222] rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-[12px] font-medium text-white flex items-center gap-2">
                  <WebhookIcon size={13} className="text-blue-400" /> {hook.name}
                </div>
                <button
                  onClick={() => WebhookService.remove(projectId, hook.id).then(loadData).catch((error) => window.alert(error.message))}
                  className="p-2 rounded border border-red-500/20 text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 size={12} />
                </button>
              </div>
              <div className="text-[10px] text-[#777] break-all">{hook.url}</div>
              <div className="text-[10px] text-[#777]">Events: {hook.events.join(', ')}</div>
              <div className="text-[10px] text-[#777]">
                Last delivery: {hook.lastDeliveryAt ? new Date(hook.lastDeliveryAt).toLocaleString() : 'Never'}
              </div>
            </div>
          ))}
          {!loading && webhooks.length === 0 && (
            <div className="text-[11px] text-[#666]">No webhooks registered yet.</div>
          )}
        </div>
      </SettingsSection>
    </div>
  );
}
