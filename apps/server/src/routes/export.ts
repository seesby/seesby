// apps/server/src/routes/export.ts
// ── CSV/XLSX Export Routes ───────────────────────────────────────────
// Provides endpoints for exporting crawl data in CSV and XLSX formats.
// Supports full session exports and dataset-specific exports.

import { Hono } from 'hono';
import { authMiddleware, getUserId } from '../services/auth';
import {
  getAllCrawlPages,
  getCrawlSession,
  getCrawlRuns,
  getCrawlIssues,
  getPageInsights,
  type CrawlPageRow,
} from '../db/turso';

export const exportRoutes = new Hono();

// All export routes require authentication
exportRoutes.use('*', authMiddleware);

// ── Available Export Datasets ────────────────────────────────────────

type ExportDataset =
  | 'pages'
  | 'issues'
  | 'actions'
  | 'keywords'
  | 'links'
  | 'scores'
  | 'insights'
  | 'runs';

const VALID_DATASETS: ExportDataset[] = [
  'pages', 'issues', 'actions', 'keywords', 'links',
  'scores', 'insights', 'runs',
];

// ── Helpers ──────────────────────────────────────────────────────────

/**
 * Escape a value for CSV output. Wraps in quotes if the value contains
 * commas, quotes, or newlines.
 */
function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Convert an array of objects to CSV string.
 * Uses the first row to determine column headers.
 */
function toCsv(rows: Record<string, unknown>[], columns?: string[]): string {
  if (rows.length === 0) return '';

  const cols = columns ?? Object.keys(rows[0]);
  const header = cols.map(csvEscape).join(',');
  const body = rows
    .map((row) => cols.map((col) => csvEscape(row[col])).join(','))
    .join('\n');

  return `${header}\n${body}\n`;
}

// ── GET /api/export/csv/:sessionId ───────────────────────────────────
// Export all pages for a session as CSV.
exportRoutes.get('/csv/:sessionId', async (c) => {
  const sessionId = c.req.param('sessionId');

  // Verify session exists and user has access
  const session = await getCrawlSession(sessionId);
  if (!session) {
    return c.json({ error: 'Session not found' }, 404);
  }

  try {
    const pages = await getAllCrawlPages(sessionId);

    const csvColumns = [
      'url', 'title', 'status_code', 'load_time', 'health_score',
      'gsc_clicks', 'gsc_impressions', 'internal_pagerank',
      'ssl_valid', 'dom_node_count', 'has_hsts',
      'content_hash', 'last_modified',
    ];

    const csvRows = pages.map((p) => ({
      url: p.url,
      title: p.title,
      status_code: p.status_code,
      load_time: p.load_time,
      health_score: p.health_score,
      gsc_clicks: p.gsc_clicks,
      gsc_impressions: p.gsc_impressions,
      internal_pagerank: p.internal_pagerank,
      ssl_valid: p.ssl_valid,
      dom_node_count: p.dom_node_count,
      has_hsts: p.has_hsts,
      content_hash: p.content_hash,
      last_modified: p.last_modified,
    }));

    const csv = toCsv(csvRows, csvColumns);

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="crawl-pages-${sessionId}.csv"`,
      },
    });
  } catch (err) {
    return c.json({ error: `Export failed: ${(err as Error).message}` }, 500);
  }
});

// ── GET /api/export/dataset/:sessionId/:dataset ──────────────────────
// Export a specific dataset for a session as CSV.
exportRoutes.get('/dataset/:sessionId/:dataset', async (c) => {
  const sessionId = c.req.param('sessionId');
  const dataset = c.req.param('dataset') as ExportDataset;

  if (!VALID_DATASETS.includes(dataset)) {
    return c.json(
      { error: `Invalid dataset: ${dataset}`, validDatasets: VALID_DATASETS },
      400,
    );
  }

  // Verify session exists
  const session = await getCrawlSession(sessionId);
  if (!session) {
    return c.json({ error: 'Session not found' }, 404);
  }

  try {
    let csv: string;

    switch (dataset) {
      case 'pages': {
        const pages = await getAllCrawlPages(sessionId);
        csv = toCsv(
          pages.map((p) => ({
            url: p.url,
            title: p.title,
            status_code: p.status_code,
            load_time: p.load_time,
            health_score: p.health_score,
            gsc_clicks: p.gsc_clicks,
            gsc_impressions: p.gsc_impressions,
            internal_pagerank: p.internal_pagerank,
            ssl_valid: p.ssl_valid,
            dom_node_count: p.dom_node_count,
            has_hsts: p.has_hsts,
          })),
          ['url', 'title', 'status_code', 'load_time', 'health_score',
           'gsc_clicks', 'gsc_impressions', 'internal_pagerank',
           'ssl_valid', 'dom_node_count', 'has_hsts'],
        );
        break;
      }

      case 'issues': {
        // Get all runs for the session, then all issues for each run
        const runs = await getCrawlRuns(sessionId);
        const allIssues = [];
        for (const run of runs) {
          const issues = await getCrawlIssues(run.id);
          allIssues.push(...issues);
        }
        csv = toCsv(
          allIssues.map((i) => ({
            category: i.category,
            title: i.title,
            description: i.description,
            priority: i.priority,
            issue_type: i.issue_type,
            affected_count: i.affected_count,
            effort: i.effort,
            score_impact: i.score_impact,
            trend: i.trend,
            ai_fix: i.ai_fix,
          })),
          ['category', 'title', 'description', 'priority', 'issue_type',
           'affected_count', 'effort', 'score_impact', 'trend', 'ai_fix'],
        );
        break;
      }

      case 'insights': {
        const insights = await getPageInsights(sessionId, 1, 10000);
        csv = toCsv(
          insights.rows.map((i) => ({
            url: i.url,
            is_changed: i.is_changed,
            is_top_page: i.is_top_page,
            has_severe_issues: i.has_severe_issues,
            severity_rank: i.severity_rank,
            priority_score: i.priority_score,
          })),
          ['url', 'is_changed', 'is_top_page', 'has_severe_issues',
           'severity_rank', 'priority_score'],
        );
        break;
      }

      case 'runs': {
        const runs = await getCrawlRuns(sessionId);
        csv = toCsv(
          runs.map((r) => ({
            id: r.id,
            status: r.status,
            crawl_mode: r.crawl_mode,
            url_crawled: r.url_crawled,
            created_at: r.created_at,
            completed_at: r.completed_at,
          })),
          ['id', 'status', 'crawl_mode', 'url_crawled', 'created_at', 'completed_at'],
        );
        break;
      }

      default:
        return c.json(
          { error: `Dataset "${dataset}" export not yet implemented` },
          501,
        );
    }

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${dataset}-${sessionId}.csv"`,
      },
    });
  } catch (err) {
    return c.json({ error: `Export failed: ${(err as Error).message}` }, 500);
  }
});

// ── GET /api/export/json/:sessionId ──────────────────────────────────
// Export all session data as a single JSON blob (useful for backup or
// migration).
exportRoutes.get('/json/:sessionId', async (c) => {
  const sessionId = c.req.param('sessionId');

  const session = await getCrawlSession(sessionId);
  if (!session) {
    return c.json({ error: 'Session not found' }, 404);
  }

  try {
    const [pages, runs] = await Promise.all([
      getAllCrawlPages(sessionId),
      getCrawlRuns(sessionId),
    ]);

    const allIssues = [];
    const allInsights = [];
    for (const run of runs) {
      const [issues, insights] = await Promise.all([
        getCrawlIssues(run.id),
        getPageInsights(sessionId, 1, 10000),
      ]);
      allIssues.push(...issues);
      allInsights.push(...insights.rows);
    }

    const exportData = {
      session,
      pages,
      runs,
      issues: allIssues,
      insights: allInsights,
      exportedAt: new Date().toISOString(),
      counts: {
        pages: pages.length,
        runs: runs.length,
        issues: allIssues.length,
        insights: allInsights.length,
      },
    };

    return new Response(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="crawl-export-${sessionId}.json"`,
      },
    });
  } catch (err) {
    return c.json({ error: `Export failed: ${(err as Error).message}` }, 500);
  }
});
