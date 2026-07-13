// apps/server/src/routes/crawl.ts
// ── Crawl Management Routes ──────────────────────────────────────────
// CRUD operations for crawl sessions plus start/stop/status endpoints.
// All routes are thin handlers that delegate to services/ and db/.

import { Hono } from 'hono';
import { authMiddleware, getUserId } from '../services/auth';
import { getCrawlOrchestrator } from '../services/CrawlOrchestrator';
import type { CrawlOrchestratorConfig } from '../services/CrawlOrchestrator';
import {
  getCrawlSessions,
  getCrawlSession,
  deleteCrawlSession,
  getCrawlPages,
  updateCrawlSession,
  getCrawlStatus,
  type CrawlSessionRow,
} from '../db/turso';

export const crawlRoutes = new Hono();

// All crawl routes require authentication
crawlRoutes.use('*', authMiddleware);

// ── GET /api/crawl ──────────────────────────────────────────────────
// List all crawl sessions.
crawlRoutes.get('/', async (c) => {
  try {
    const userId = getUserId(c);
    const sessions = await getCrawlSessions(userId);
    return c.json({
      total: sessions.length,
      sessions,
    });
  } catch (err) {
    return c.json({ error: (err as Error).message }, 500);
  }
});

// ── GET /api/crawl/:id ──────────────────────────────────────────────
// Get a single crawl session by ID.
crawlRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');

  try {
    const session = await getCrawlSession(id);
    if (!session) {
      return c.json({ error: `Session not found: ${id}` }, 404);
    }
    return c.json(session);
  } catch (err) {
    return c.json({ error: (err as Error).message }, 500);
  }
});

// ── POST /api/crawl/start ───────────────────────────────────────────
// Start a new crawl session. Accepts a start URL and optional config.
// Returns the new session ID immediately; the pipeline runs asynchronously.
crawlRoutes.post('/start', async (c) => {
  try {
    const body = await c.req.json<{
      url?: string;
      startUrl?: string;
      config?: CrawlOrchestratorConfig;
    }>();

    const startUrl = body.url ?? body.startUrl;
    if (!startUrl) {
      return c.json({ error: 'URL is required (provide "url" or "startUrl")' }, 400);
    }

    // Validate URL
    let parsed: URL;
    try {
      parsed = new URL(startUrl.startsWith('http') ? startUrl : `https://${startUrl}`);
    } catch {
      return c.json({ error: 'Invalid URL format' }, 400);
    }

    const config: CrawlOrchestratorConfig = {
      ...body.config,
      startUrls: body.config?.startUrls ?? [parsed.href],
    };

    const orchestrator = getCrawlOrchestrator();
    const { sessionId, jobId } = await orchestrator.startCrawl(parsed.href, config);

    return c.json(
      {
        sessionId,
        jobId,
        url: parsed.href,
        status: 'pending',
        message: 'Crawl started. Use GET /api/crawl/:id/status to track progress.',
      },
      201,
    );
  } catch (err) {
    return c.json({ error: `Failed to start crawl: ${(err as Error).message}` }, 500);
  }
});

// ── POST /api/crawl/:id/stop ────────────────────────────────────────
// Stop a running crawl session.
crawlRoutes.post('/:id/stop', async (c) => {
  const id = c.req.param('id');

  try {
    const orchestrator = getCrawlOrchestrator();
    await orchestrator.stopCrawl(id);

    await updateCrawlSession(id, { status: 'cancelled' });

    return c.json({
      sessionId: id,
      status: 'cancelled',
      message: 'Crawl stopped.',
    });
  } catch (err) {
    const message = (err as Error).message;
    if (message.includes('not found')) {
      return c.json({ error: message }, 404);
    }
    if (message.includes('not running')) {
      return c.json({ error: message }, 409);
    }
    return c.json({ error: message }, 500);
  }
});

// ── GET /api/crawl/:id/status ───────────────────────────────────────
// Get detailed crawl status including progress, current layer, and
// error information.
crawlRoutes.get('/:id/status', async (c) => {
  const id = c.req.param('id');

  try {
    // Check in-memory orchestrator first
    const orchestrator = getCrawlOrchestrator();
    const job = orchestrator.getStatus(id);

    if (job) {
      return c.json({
        sessionId: job.sessionId,
        status: job.status,
        progress: job.progress,
        createdAt: job.createdAt,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        error: job.error,
      });
    }

    // Fall back to DB status
    const dbStatus = await getCrawlStatus(id);
    if (dbStatus) {
      return c.json({
        sessionId: id,
        status: dbStatus.status,
        progress: {
          total: 0,
          completed: dbStatus.urls_crawled,
          errors: 0,
          percentComplete: dbStatus.progress,
          currentUrl: dbStatus.current_url,
        },
        currentLayer: dbStatus.event_type,
        eventMessage: dbStatus.event_message,
        updatedAt: dbStatus.updated_at,
      });
    }

    // Check if session exists at all
    const session = await getCrawlSession(id);
    if (session) {
      return c.json({
        sessionId: id,
        status: session.status,
        progress: {
          total: 0,
          completed: 0,
          errors: 0,
          percentComplete: 0,
        },
      });
    }

    return c.json({ error: `Session not found: ${id}` }, 404);
  } catch (err) {
    return c.json({ error: (err as Error).message }, 500);
  }
});

// ── GET /api/crawl/:id/pages ────────────────────────────────────────
// Get paginated crawl pages for a session. Supports sorting by
// various columns.
crawlRoutes.get('/:id/pages', async (c) => {
  const id = c.req.param('id');
  const page = Math.max(1, parseInt(c.req.query('page') || '1', 10));
  const limit = Math.min(200, Math.max(1, parseInt(c.req.query('limit') || '50', 10)));
  const sort = c.req.query('sort') || 'health_score';
  const order = (c.req.query('order') || 'desc') as 'asc' | 'desc';

  try {
    const session = await getCrawlSession(id);
    if (!session) {
      return c.json({ error: `Session not found: ${id}` }, 404);
    }

    const { rows, total } = await getCrawlPages(id, page, limit, sort, order);
    const totalPages = Math.ceil(total / limit);

    return c.json({
      sessionId: id,
      page,
      limit,
      sort,
      order,
      total,
      totalPages,
      hasMore: page < totalPages,
      pages: rows,
    });
  } catch (err) {
    return c.json({ error: (err as Error).message }, 500);
  }
});

// ── DELETE /api/crawl/:id ───────────────────────────────────────────
// Delete a crawl session and all associated data.
crawlRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id');

  try {
    // Check if session exists
    const session = await getCrawlSession(id);
    if (!session) {
      return c.json({ error: `Session not found: ${id}` }, 404);
    }

    // Don't allow deleting running crawls
    const orchestrator = getCrawlOrchestrator();
    const job = orchestrator.getStatus(id);
    if (job?.status === 'running' || job?.status === 'pending') {
      return c.json(
        { error: 'Cannot delete a running crawl. Stop it first.' },
        409,
      );
    }

    await deleteCrawlSession(id);

    return c.json({
      sessionId: id,
      message: 'Session deleted.',
    });
  } catch (err) {
    return c.json({ error: (err as Error).message }, 500);
  }
});

// ── GET /api/crawl/:id/summary ──────────────────────────────────────
// Get a high-level summary of a crawl session (page count, issue count,
// score overview).
crawlRoutes.get('/:id/summary', async (c) => {
  const id = c.req.param('id');

  try {
    const session = await getCrawlSession(id);
    if (!session) {
      return c.json({ error: `Session not found: ${id}` }, 404);
    }

    const { rows: pages, total: totalPages } = await getCrawlPages(id, 1, 1);

    // Compute summary stats from the first page of results
    const allPages = pages.length > 0 ? (await getCrawlPages(id, 1, 10000)).rows : [];
    const avgHealth = allPages.length > 0
      ? allPages.reduce((sum, p) => sum + (p.health_score ?? 0), 0) / allPages.length
      : 0;
    const totalClicks = allPages.reduce((sum, p) => sum + (p.gsc_clicks ?? 0), 0);
    const totalImpressions = allPages.reduce((sum, p) => sum + (p.gsc_impressions ?? 0), 0);

    return c.json({
      sessionId: id,
      url: session.url,
      status: session.status,
      createdAt: session.created_at,
      stats: {
        totalPages,
        avgHealthScore: Math.round(avgHealth),
        totalGscClicks: totalClicks,
        totalGscImpressions: totalImpressions,
        sslValidCount: allPages.filter((p) => p.ssl_valid === 1).length,
        brokenLinksCount: allPages.filter((p) => p.status_code && p.status_code >= 400).length,
      },
    });
  } catch (err) {
    return c.json({ error: (err as Error).message }, 500);
  }
});
