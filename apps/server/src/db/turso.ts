// apps/server/src/db/turso.ts
// ── Turso/libSQL Database Client ────────────────────────────────────
// Server-side database access layer. Mirrors the schema defined in
// services/turso.ts (procedural CREATE TABLE) and provides typed query
// helpers used by route handlers and the CrawlOrchestrator.

import { createClient, type Client, type ResultSet, type Row } from '@libsql/client';

// ── Client Setup ─────────────────────────────────────────────────────

const TURSO_URL = process.env.TURSO_DATABASE_URL || 'file:local.db';
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;

export const client: Client = createClient({
  url: TURSO_URL,
  authToken: TURSO_TOKEN || undefined,
});

// ── Schema Types ─────────────────────────────────────────────────────

export interface CrawlSessionRow {
  id: string;
  url: string;
  status: string;
  created_at: string;
  metadata: string | null;
  audit_modes: string | null;
  industry_filter: string | null;
}

export interface CrawlPageRow {
  id: string;
  session_id: string;
  url: string;
  title: string | null;
  status_code: number | null;
  load_time: number | null;
  gsc_clicks: number;
  gsc_impressions: number;
  internal_pagerank: number;
  health_score: number;
  content_hash: string | null;
  last_modified: string | null;
  etag: string | null;
  screenshot_url: string | null;
  metadata: string | null;
  ssl_valid: number | null;
  dom_node_count: number | null;
  has_hsts: number | null;
}

export interface CrawlJobRow {
  id: string;
  project_id: string;
  session_id: string;
  execution_mode: string;
  policy: string;
  retention_policy: string;
  entry_urls_json: string;
  limits_json: string;
  created_at: string;
}

export interface CrawlRunRow {
  id: string;
  project_id: string;
  session_id: string;
  job_id: string;
  status: string;
  crawl_mode: string;
  execution_mode: string;
  policy: string;
  retention_policy: string;
  url_crawled: string;
  summary_json: string;
  thematic_scores_json: string;
  evidence_sources_json: string;
  runtime_json: string;
  top_pages_json: string;
  issue_overview_json: string;
  created_at: string;
  completed_at: string | null;
}

export interface CrawlIssueClusterRow {
  id: string;
  run_id: string;
  project_id: string;
  category: string;
  title: string;
  description: string;
  priority: string;
  issue_type: string;
  affected_count: number;
  affected_urls_json: string;
  effort: string;
  score_impact: number;
  ai_fix: string;
  trend: string;
  evidence_json: string;
  created_at: string;
}

export interface CrawlPageInsightRow {
  id: string;
  run_id: string;
  project_id: string;
  session_id: string;
  url: string;
  is_changed: number;
  is_top_page: number;
  has_severe_issues: number;
  severity_rank: number;
  priority_score: number;
  evidence_sources_json: string;
  summary_json: string;
  full_data_json: string | null;
  created_at: string;
}

export interface CrawlStatusRow {
  project_id: string;
  status: string;
  progress: number;
  current_url: string | null;
  urls_crawled: number;
  session_id: string | null;
  event_type: string | null;
  event_message: string | null;
  updated_at: string;
}

// ── Schema Initialization ────────────────────────────────────────────

/** Ensures all required tables exist. Safe to call multiple times. */
export async function initializeSchema(): Promise<void> {
  const statements: string[] = [
    `CREATE TABLE IF NOT EXISTS crawl_sessions (
      id TEXT PRIMARY KEY,
      url TEXT NOT NULL,
      status TEXT DEFAULT 'idle',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      metadata TEXT,
      audit_modes TEXT,
      industry_filter TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS crawl_pages (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      url TEXT NOT NULL,
      title TEXT,
      status_code INTEGER,
      load_time INTEGER,
      gsc_clicks INTEGER DEFAULT 0,
      gsc_impressions INTEGER DEFAULT 0,
      internal_pagerank REAL DEFAULT 0,
      health_score INTEGER DEFAULT 100,
      content_hash TEXT,
      last_modified TEXT,
      etag TEXT,
      screenshot_url TEXT,
      metadata TEXT,
      ssl_valid INTEGER,
      dom_node_count INTEGER,
      has_hsts INTEGER,
      FOREIGN KEY (session_id) REFERENCES crawl_sessions(id)
    )`,
    `CREATE TABLE IF NOT EXISTS crawl_jobs (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      session_id TEXT NOT NULL,
      execution_mode TEXT NOT NULL,
      policy TEXT NOT NULL,
      retention_policy TEXT NOT NULL,
      entry_urls_json TEXT NOT NULL,
      limits_json TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES crawl_sessions(id)
    )`,
    `CREATE TABLE IF NOT EXISTS crawl_runs (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      session_id TEXT NOT NULL,
      job_id TEXT NOT NULL,
      status TEXT NOT NULL,
      crawl_mode TEXT NOT NULL,
      execution_mode TEXT NOT NULL,
      policy TEXT NOT NULL,
      retention_policy TEXT NOT NULL,
      url_crawled TEXT NOT NULL,
      summary_json TEXT NOT NULL,
      thematic_scores_json TEXT NOT NULL,
      evidence_sources_json TEXT NOT NULL,
      runtime_json TEXT NOT NULL,
      top_pages_json TEXT NOT NULL,
      issue_overview_json TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      FOREIGN KEY (job_id) REFERENCES crawl_jobs(id)
    )`,
    `CREATE TABLE IF NOT EXISTS crawl_issue_clusters (
      id TEXT PRIMARY KEY,
      run_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      priority TEXT NOT NULL,
      issue_type TEXT NOT NULL,
      affected_count INTEGER NOT NULL DEFAULT 0,
      affected_urls_json TEXT NOT NULL,
      effort TEXT NOT NULL,
      score_impact INTEGER NOT NULL DEFAULT 0,
      ai_fix TEXT NOT NULL,
      trend TEXT NOT NULL DEFAULT 'new',
      evidence_json TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (run_id) REFERENCES crawl_runs(id)
    )`,
    `CREATE TABLE IF NOT EXISTS crawl_page_insights (
      id TEXT PRIMARY KEY,
      run_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      session_id TEXT NOT NULL,
      url TEXT NOT NULL,
      is_changed INTEGER NOT NULL DEFAULT 0,
      is_top_page INTEGER NOT NULL DEFAULT 0,
      has_severe_issues INTEGER NOT NULL DEFAULT 0,
      severity_rank INTEGER NOT NULL DEFAULT 0,
      priority_score REAL NOT NULL DEFAULT 0,
      evidence_sources_json TEXT NOT NULL,
      summary_json TEXT NOT NULL,
      full_data_json TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (run_id) REFERENCES crawl_runs(id)
    )`,
    `CREATE TABLE IF NOT EXISTS crawl_status (
      project_id TEXT PRIMARY KEY,
      status TEXT NOT NULL,
      progress REAL NOT NULL DEFAULT 0,
      current_url TEXT,
      urls_crawled INTEGER NOT NULL DEFAULT 0,
      session_id TEXT,
      event_type TEXT,
      event_message TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
  ];

  for (const sql of statements) {
    await client.execute(sql);
  }
}

// ── Query Helpers: Crawl Sessions ────────────────────────────────────

/**
 * List all crawl sessions, optionally filtered by user.
 * Returns sessions ordered by created_at descending.
 */
export async function getCrawlSessions(userId?: string): Promise<CrawlSessionRow[]> {
  const result = await client.execute(
    'SELECT * FROM crawl_sessions ORDER BY created_at DESC',
  );
  return result.rows as unknown as CrawlSessionRow[];
}

/**
 * Get a single crawl session by ID.
 * Returns null if not found.
 */
export async function getCrawlSession(id: string): Promise<CrawlSessionRow | null> {
  const result = await client.execute({
    sql: 'SELECT * FROM crawl_sessions WHERE id = ?',
    args: [id],
  });
  return (result.rows[0] as unknown as CrawlSessionRow) ?? null;
}

/**
 * Insert a new crawl session.
 * Returns the generated session ID.
 */
export async function createCrawlSession(data: {
  id: string;
  url: string;
  status?: string;
  metadata?: Record<string, unknown>;
  auditModes?: string[];
  industryFilter?: string;
}): Promise<string> {
  await client.execute({
    sql: `INSERT INTO crawl_sessions (id, url, status, metadata, audit_modes, industry_filter)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [
      data.id,
      data.url,
      data.status || 'pending',
      data.metadata ? JSON.stringify(data.metadata) : null,
      data.auditModes ? JSON.stringify(data.auditModes) : null,
      data.industryFilter ?? null,
    ],
  });
  return data.id;
}

/**
 * Update an existing crawl session.
 * Only provided fields are updated (partial update).
 */
export async function updateCrawlSession(
  id: string,
  data: {
    status?: string;
    metadata?: Record<string, unknown>;
    auditModes?: string[];
    industryFilter?: string;
  },
): Promise<void> {
  const sets: string[] = [];
  const args: unknown[] = [];

  if (data.status !== undefined) {
    sets.push('status = ?');
    args.push(data.status);
  }
  if (data.metadata !== undefined) {
    sets.push('metadata = ?');
    args.push(JSON.stringify(data.metadata));
  }
  if (data.auditModes !== undefined) {
    sets.push('audit_modes = ?');
    args.push(JSON.stringify(data.auditModes));
  }
  if (data.industryFilter !== undefined) {
    sets.push('industry_filter = ?');
    args.push(data.industryFilter);
  }

  if (sets.length === 0) return;

  args.push(id);
  await client.execute({
    sql: `UPDATE crawl_sessions SET ${sets.join(', ')} WHERE id = ?`,
    args,
  });
}

/**
 * Delete a crawl session and cascade-delete related rows.
 * Deletes pages, jobs, runs, issue_clusters, page_insights for this session.
 */
export async function deleteCrawlSession(id: string): Promise<void> {
  const tx = await client.batch([]);
  try {
    // Delete in dependency order (children first)
    await client.execute({ sql: 'DELETE FROM crawl_page_insights WHERE session_id = ?', args: [id] });
    await client.execute({ sql: 'DELETE FROM crawl_issue_clusters WHERE run_id IN (SELECT id FROM crawl_runs WHERE session_id = ?)', args: [id] });
    await client.execute({ sql: 'DELETE FROM crawl_runs WHERE session_id = ?', args: [id] });
    await client.execute({ sql: 'DELETE FROM crawl_jobs WHERE session_id = ?', args: [id] });
    await client.execute({ sql: 'DELETE FROM crawl_pages WHERE session_id = ?', args: [id] });
    await client.execute({ sql: 'DELETE FROM crawl_status WHERE session_id = ?', args: [id] });
    await client.execute({ sql: 'DELETE FROM crawl_sessions WHERE id = ?', args: [id] });
  } catch (err) {
    throw new Error(`Failed to delete session ${id}: ${(err as Error).message}`);
  }
}

// ── Query Helpers: Crawl Pages ───────────────────────────────────────

/**
 * Get paginated crawl pages for a session.
 * @param sessionId  - The parent session ID
 * @param page       - 1-indexed page number
 * @param limit      - Number of results per page (default 50)
 * @param sort       - Column to sort by (default 'health_score')
 * @param order      - 'asc' or 'desc' (default 'desc')
 */
export async function getCrawlPages(
  sessionId: string,
  page: number = 1,
  limit: number = 50,
  sort: string = 'health_score',
  order: 'asc' | 'desc' = 'desc',
): Promise<{ rows: CrawlPageRow[]; total: number }> {
  // Validate sort column to prevent SQL injection
  const allowedSortColumns = new Set([
    'url', 'title', 'status_code', 'load_time', 'health_score',
    'gsc_clicks', 'gsc_impressions', 'internal_pagerank', 'last_modified',
  ]);
  const safeSort = allowedSortColumns.has(sort) ? sort : 'health_score';
  const safeOrder = order === 'asc' ? 'ASC' : 'DESC';

  const offset = (page - 1) * limit;

  const [countResult, dataResult] = await Promise.all([
    client.execute({
      sql: 'SELECT COUNT(*) as total FROM crawl_pages WHERE session_id = ?',
      args: [sessionId],
    }),
    client.execute({
      sql: `SELECT * FROM crawl_pages WHERE session_id = ?
            ORDER BY ${safeSort} ${safeOrder}
            LIMIT ? OFFSET ?`,
      args: [sessionId, limit, offset],
    }),
  ]);

  return {
    rows: dataResult.rows as unknown as CrawlPageRow[],
    total: Number(countResult.rows[0]?.['total'] ?? 0),
  };
}

/**
 * Insert a single crawled page record.
 * Uses idempotent insert (INSERT OR REPLACE) to handle retries.
 */
export async function insertCrawlPage(page: {
  id: string;
  sessionId: string;
  url: string;
  title?: string;
  statusCode?: number;
  loadTime?: number;
  gscClicks?: number;
  gscImpressions?: number;
  internalPagerank?: number;
  healthScore?: number;
  contentHash?: string;
  lastModified?: string;
  etag?: string;
  screenshotUrl?: string;
  metadata?: Record<string, unknown>;
  sslValid?: boolean;
  domNodeCount?: number;
  hasHsts?: boolean;
}): Promise<void> {
  await client.execute({
    sql: `INSERT OR REPLACE INTO crawl_pages
          (id, session_id, url, title, status_code, load_time,
           gsc_clicks, gsc_impressions, internal_pagerank, health_score,
           content_hash, last_modified, etag, screenshot_url, metadata,
           ssl_valid, dom_node_count, has_hsts)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      page.id,
      page.sessionId,
      page.url,
      page.title ?? null,
      page.statusCode ?? null,
      page.loadTime ?? null,
      page.gscClicks ?? 0,
      page.gscImpressions ?? 0,
      page.internalPagerank ?? 0,
      page.healthScore ?? 100,
      page.contentHash ?? null,
      page.lastModified ?? null,
      page.etag ?? null,
      page.screenshotUrl ?? null,
      page.metadata ? JSON.stringify(page.metadata) : null,
      page.sslValid !== undefined ? (page.sslValid ? 1 : 0) : null,
      page.domNodeCount ?? null,
      page.hasHsts !== undefined ? (page.hasHsts ? 1 : 0) : null,
    ],
  });
}

/**
 * Bulk insert pages in a batch for performance.
 */
export async function insertCrawlPagesBatch(
  pages: Array<{
    id: string;
    sessionId: string;
    url: string;
    title?: string;
    statusCode?: number;
    loadTime?: number;
    gscClicks?: number;
    gscImpressions?: number;
    internalPagerank?: number;
    healthScore?: number;
    contentHash?: string;
    lastModified?: string;
    etag?: string;
    screenshotUrl?: string;
    metadata?: Record<string, unknown>;
    sslValid?: boolean;
    domNodeCount?: number;
    hasHsts?: boolean;
  }>,
): Promise<void> {
  if (pages.length === 0) return;

  const stmts = pages.map((page) => ({
    sql: `INSERT OR REPLACE INTO crawl_pages
          (id, session_id, url, title, status_code, load_time,
           gsc_clicks, gsc_impressions, internal_pagerank, health_score,
           content_hash, last_modified, etag, screenshot_url, metadata,
           ssl_valid, dom_node_count, has_hsts)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      page.id,
      page.sessionId,
      page.url,
      page.title ?? null,
      page.statusCode ?? null,
      page.loadTime ?? null,
      page.gscClicks ?? 0,
      page.gscImpressions ?? 0,
      page.internalPagerank ?? 0,
      page.healthScore ?? 100,
      page.contentHash ?? null,
      page.lastModified ?? null,
      page.etag ?? null,
      page.screenshotUrl ?? null,
      page.metadata ? JSON.stringify(page.metadata) : null,
      page.sslValid !== undefined ? (page.sslValid ? 1 : 0) : null,
      page.domNodeCount ?? null,
      page.hasHsts !== undefined ? (page.hasHsts ? 1 : 0) : null,
    ],
  }));

  await client.batch(stmts);
}

// ── Query Helpers: Crawl Issues ──────────────────────────────────────

/**
 * Get all issue clusters for a crawl run.
 */
export async function getCrawlIssues(runId: string): Promise<CrawlIssueClusterRow[]> {
  const result = await client.execute({
    sql: 'SELECT * FROM crawl_issue_clusters WHERE run_id = ? ORDER BY score_impact ASC',
    args: [runId],
  });
  return result.rows as unknown as CrawlIssueClusterRow[];
}

/**
 * Insert a single issue cluster record.
 */
export async function insertCrawlIssue(issue: {
  id: string;
  runId: string;
  projectId: string;
  category: string;
  title: string;
  description: string;
  priority: string;
  issueType: string;
  affectedCount: number;
  affectedUrls: string[];
  effort: string;
  scoreImpact: number;
  aiFix: string;
  trend?: string;
  evidence: Record<string, unknown>;
}): Promise<void> {
  await client.execute({
    sql: `INSERT OR REPLACE INTO crawl_issue_clusters
          (id, run_id, project_id, category, title, description, priority,
           issue_type, affected_count, affected_urls_json, effort,
           score_impact, ai_fix, trend, evidence_json)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      issue.id,
      issue.runId,
      issue.projectId,
      issue.category,
      issue.title,
      issue.description,
      issue.priority,
      issue.issueType,
      issue.affectedCount,
      JSON.stringify(issue.affectedUrls),
      issue.effort,
      issue.scoreImpact,
      issue.aiFix,
      issue.trend ?? 'new',
      JSON.stringify(issue.evidence),
    ],
  });
}

// ── Query Helpers: Crawl Status ──────────────────────────────────────

/**
 * Get current crawl status for a project.
 */
export async function getCrawlStatus(projectId: string): Promise<CrawlStatusRow | null> {
  const result = await client.execute({
    sql: 'SELECT * FROM crawl_status WHERE project_id = ?',
    args: [projectId],
  });
  return (result.rows[0] as unknown as CrawlStatusRow) ?? null;
}

/**
 * Upsert crawl status (create or update).
 */
export async function upsertCrawlStatus(status: {
  projectId: string;
  status: string;
  progress?: number;
  currentUrl?: string;
  urlsCrawled?: number;
  sessionId?: string;
  eventType?: string;
  eventMessage?: string;
}): Promise<void> {
  await client.execute({
    sql: `INSERT INTO crawl_status
          (project_id, status, progress, current_url, urls_crawled, session_id, event_type, event_message, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(project_id) DO UPDATE SET
            status = excluded.status,
            progress = excluded.progress,
            current_url = excluded.current_url,
            urls_crawled = excluded.urls_crawled,
            session_id = excluded.session_id,
            event_type = excluded.event_type,
            event_message = excluded.event_message,
            updated_at = CURRENT_TIMESTAMP`,
    args: [
      status.projectId,
      status.status,
      status.progress ?? 0,
      status.currentUrl ?? null,
      status.urlsCrawled ?? 0,
      status.sessionId ?? null,
      status.eventType ?? null,
      status.eventMessage ?? null,
    ],
  });
}

// ── Query Helpers: Crawl Runs ────────────────────────────────────────

/**
 * Get all runs for a session.
 */
export async function getCrawlRuns(sessionId: string): Promise<CrawlRunRow[]> {
  const result = await client.execute({
    sql: 'SELECT * FROM crawl_runs WHERE session_id = ? ORDER BY created_at DESC',
    args: [sessionId],
  });
  return result.rows as unknown as CrawlRunRow[];
}

/**
 * Insert a crawl run record.
 */
export async function insertCrawlRun(run: {
  id: string;
  projectId: string;
  sessionId: string;
  jobId: string;
  status: string;
  crawlMode: string;
  executionMode: string;
  policy: string;
  retentionPolicy: string;
  urlCrawled: string;
  summary: Record<string, unknown>;
  thematicScores: Record<string, unknown>;
  evidenceSources: Record<string, unknown>;
  runtime: Record<string, unknown>;
  topPages: Record<string, unknown>;
  issueOverview: Record<string, unknown>;
  completedAt?: string;
}): Promise<void> {
  await client.execute({
    sql: `INSERT INTO crawl_runs
          (id, project_id, session_id, job_id, status, crawl_mode, execution_mode,
           policy, retention_policy, url_crawled, summary_json, thematic_scores_json,
           evidence_sources_json, runtime_json, top_pages_json, issue_overview_json, completed_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      run.id,
      run.projectId,
      run.sessionId,
      run.jobId,
      run.status,
      run.crawlMode,
      run.executionMode,
      run.policy,
      run.retentionPolicy,
      run.urlCrawled,
      JSON.stringify(run.summary),
      JSON.stringify(run.thematicScores),
      JSON.stringify(run.evidenceSources),
      JSON.stringify(run.runtime),
      JSON.stringify(run.topPages),
      JSON.stringify(run.issueOverview),
      run.completedAt ?? null,
    ],
  });
}

// ── Query Helpers: Page Insights ─────────────────────────────────────

/**
 * Get page insights for a session (paginated).
 */
export async function getPageInsights(
  sessionId: string,
  page: number = 1,
  limit: number = 50,
): Promise<{ rows: CrawlPageInsightRow[]; total: number }> {
  const offset = (page - 1) * limit;

  const [countResult, dataResult] = await Promise.all([
    client.execute({
      sql: 'SELECT COUNT(*) as total FROM crawl_page_insights WHERE session_id = ?',
      args: [sessionId],
    }),
    client.execute({
      sql: `SELECT * FROM crawl_page_insights WHERE session_id = ?
            ORDER BY priority_score DESC
            LIMIT ? OFFSET ?`,
      args: [sessionId, limit, offset],
    }),
  ]);

  return {
    rows: dataResult.rows as unknown as CrawlPageInsightRow[],
    total: Number(countResult.rows[0]?.['total'] ?? 0),
  };
}

/**
 * Insert a page insight record.
 */
export async function insertPageInsight(insight: {
  id: string;
  runId: string;
  projectId: string;
  sessionId: string;
  url: string;
  isChanged?: boolean;
  isTopPage?: boolean;
  hasSevereIssues?: boolean;
  severityRank?: number;
  priorityScore?: number;
  evidenceSources: Record<string, unknown>;
  summary: Record<string, unknown>;
  fullData?: Record<string, unknown>;
}): Promise<void> {
  await client.execute({
    sql: `INSERT OR REPLACE INTO crawl_page_insights
          (id, run_id, project_id, session_id, url, is_changed, is_top_page,
           has_severe_issues, severity_rank, priority_score, evidence_sources_json,
           summary_json, full_data_json)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      insight.id,
      insight.runId,
      insight.projectId,
      insight.sessionId,
      insight.url,
      insight.isChanged ? 1 : 0,
      insight.isTopPage ? 1 : 0,
      insight.hasSevereIssues ? 1 : 0,
      insight.severityRank ?? 0,
      insight.priorityScore ?? 0,
      JSON.stringify(insight.evidenceSources),
      JSON.stringify(insight.summary),
      insight.fullData ? JSON.stringify(insight.fullData) : null,
    ],
  });
}

// ── Query Helpers: Export ────────────────────────────────────────────

/**
 * Get all pages for a session (no pagination) for export.
 */
export async function getAllCrawlPages(sessionId: string): Promise<CrawlPageRow[]> {
  const result = await client.execute({
    sql: 'SELECT * FROM crawl_pages WHERE session_id = ? ORDER BY health_score DESC',
    args: [sessionId],
  });
  return result.rows as unknown as CrawlPageRow[];
}
