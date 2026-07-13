import { turso } from './turso';

function createToken() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().replace(/-/g, '');
  }
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
}

export async function createPublicReport(projectId: string, sessionId: string, expiryDays: number = 30) {
  const token = createToken();
  const expiresAt = new Date(Date.now() + expiryDays * 86400000).toISOString();

  await turso().execute({
    sql: `INSERT INTO public_reports (id, project_id, session_id, token, expires_at, created_at)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [token, projectId, sessionId, token, expiresAt, new Date().toISOString()]
  });

  return `https://seesby.app/report/${token}`;
}
