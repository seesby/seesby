// services/AlertDispatcher.ts
import { dispatchSlackAlert, dispatchEmailAlert } from './AlertDispatchService';

export type AlertChannel = 'email' | 'inApp' | 'slack' | 'webhook';

export interface AlertPayload {
  type: 'score_drop' | 'new_404s' | 'new_issues' | 'crawl_complete';
  title: string;
  body: string;
  severity: 'critical' | 'warning' | 'info';
  projectId: string;
  projectName: string;
  projectUrl: string;
  data?: Record<string, any>;
}

export async function dispatchAlert(
  payload: AlertPayload,
  channels: Record<AlertChannel, boolean>,
  config: { webhookUrl?: string; slackWebhookUrl?: string; notificationEmail?: string }
) {
  const dispatched: string[] = [];

  // 1. In-App Notification
  if (channels.inApp) {
    try {
      // Need to import dynamically to avoid circular deps
      const { createNotification } = await import('./ActivityService');
      await createNotification(payload.projectId, 'owner', {
        type: 'alert',
        title: payload.title,
        body: payload.body,
        linkUrl: `/project/${payload.projectId}/crawler`,
        entityType: 'crawl',
        entityId: payload.projectId
      });
      dispatched.push('in-app');
    } catch (err) {
      console.error('[Alert] In-app failed:', err);
    }
  }

  // 2. Webhook
  if (channels.webhook && config.webhookUrl) {
    try {
      await fetch(config.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: payload.type,
          timestamp: new Date().toISOString(),
          severity: payload.severity,
          title: payload.title,
          body: payload.body,
          project: { id: payload.projectId, name: payload.projectName, url: payload.projectUrl },
          data: payload.data
        })
      });
      dispatched.push('webhook');
    } catch (err) {
      console.error('[Alert] Webhook failed:', err);
    }
  }

  // 3. Slack
  if (channels.slack && config.slackWebhookUrl) {
    try {
      await dispatchSlackAlert(config.slackWebhookUrl, {
        siteName: payload.projectName,
        event: payload.title,
        details: payload.body,
        score: typeof payload.data?.score === 'number' ? payload.data.score : undefined,
        link: payload.projectUrl
      });
      dispatched.push('slack');
    } catch (err) {
      console.error('[Alert] Slack failed:', err);
    }
  }

  // 4. Email (Proxy via Worker)
  if (channels.email && config.notificationEmail) {
    try {
      await dispatchEmailAlert(
        config.notificationEmail,
        `[Seesby] ${payload.title}`,
        `<h2>${payload.title}</h2><p>${payload.body}</p><p><small>${payload.projectName} — ${payload.projectUrl}</small></p>`
      );
      dispatched.push('email');
    } catch (err) {
      // Fallback to configured relay worker if Resend is not available or fails.
      try {
        const emailWorkerUrl = (import.meta as any).env?.VITE_EMAIL_WORKER_URL;
        if (emailWorkerUrl) {
          await fetch(`${emailWorkerUrl}/api/send-alert`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: config.notificationEmail,
              subject: `[Seesby] ${payload.title}`,
              html: `<h2>${payload.title}</h2><p>${payload.body}</p><p><small>${payload.projectName} — ${payload.projectUrl}</small></p>`
            })
          });
          dispatched.push('email');
        }
      } catch (fallbackError) {
        console.error('[Alert] Email failed:', fallbackError || err);
      }
    }
  }

  return dispatched;
}
