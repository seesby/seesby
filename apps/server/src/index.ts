// apps/server/src/index.ts
// ── Seesby Server Entry Point ─────────────────────────────────────
// Hono-based HTTP server for the Seesby crawler API. Provides
// crawl management, metric registry, export, and authentication routes.

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { initializeSchema } from './db/turso';

// ── Route Imports ────────────────────────────────────────────────────

import { crawlRoutes } from './routes/crawl';
import { metricsRoutes } from './routes/metrics';
import { exportRoutes } from './routes/export';
import { authRoutes } from './routes/auth';

// ── App Setup ────────────────────────────────────────────────────────

const app = new Hono();

// ── Global Middleware ────────────────────────────────────────────────

app.use('*', cors({
  origin: process.env.CORS_ORIGIN || '*',
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Disposition'],
  maxAge: 86400,
}));

app.use('*', logger());

// ── Routes ───────────────────────────────────────────────────────────

app.route('/api/crawl', crawlRoutes);
app.route('/api/metrics', metricsRoutes);
app.route('/api/export', exportRoutes);
app.route('/api/auth', authRoutes);

// ── Health Check ─────────────────────────────────────────────────────

app.get('/api/health', async (c) => {
  return c.json({
    status: 'ok',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ── 404 Fallback ─────────────────────────────────────────────────────

app.notFound((c) => {
  return c.json(
    {
      error: 'Not found',
      path: c.req.url,
      hint: 'Try GET /api/health to verify the server is running.',
    },
    404,
  );
});

// ── Error Handler ────────────────────────────────────────────────────

app.onError((err, c) => {
  console.error(`[Server Error] ${err.message}`, err.stack);
  return c.json(
    {
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    },
    500,
  );
});

// ── Server Startup ───────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT || '3001', 10);

async function main() {
  // Initialize database schema on startup
  console.info('[Seesby] Initializing database schema...');
  try {
    await initializeSchema();
    console.info('[Seesby] Database schema ready.');
  } catch (err) {
    console.error('[Seesby] Failed to initialize database:', (err as Error).message);
    // Continue anyway — the server can still serve metrics and auth routes
  }

  console.info(`[Seesby] Starting server on port ${PORT}...`);
}

// Run startup
main().catch((err) => {
  console.error('[Seesby] Startup failed:', err);
  process.exit(1);
});

// ── Export ───────────────────────────────────────────────────────────

export default {
  port: PORT,
  fetch: app.fetch,
};
