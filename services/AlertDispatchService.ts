export async function dispatchSlackAlert(webhookUrl: string, data: {
  siteName: string;
  event: string;
  details: string;
  score?: number;
  link?: string;
}) {
  const blocks: any[] = [
    { type: 'header', text: { type: 'plain_text', text: `Seesby: ${data.event}` } },
    { type: 'section', text: { type: 'mrkdwn', text: `*${data.siteName}*\n${data.details}` } },
  ];

  if (data.score !== undefined) {
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: `Health Score: *${data.score}/100*` }
    });
  }

  if (data.link) {
    blocks.push({
      type: 'actions',
      elements: [{ type: 'button', text: { type: 'plain_text', text: 'View Report' }, url: data.link }]
    });
  }

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ blocks })
  });
}

export async function dispatchEmailAlert(to: string, subject: string, html: string) {
  const resendApiKey = import.meta.env.VITE_RESEND_API_KEY;
  if (!resendApiKey) return;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'Seesby <alerts@seesby.app>',
      to,
      subject,
      html
    })
  });
}
