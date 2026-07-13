/**
 * Seesby MCP Server
 * Exposes Seesby crawl data as tools for AI agents.
 */
import { createClient } from '@libsql/client/web';

interface Env {
  TURSO_DATABASE_URL: string;
  TURSO_AUTH_TOKEN: string;
}

const TOOLS = [
  {
    name: 'get_crawl_summary',
    description: 'Get the latest crawl summary for a project',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string' }
      },
      required: ['projectId']
    }
  },
  {
    name: 'get_top_issues',
    description: 'Get highest priority issues for a project',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string' },
        limit: { type: 'number', default: 10 }
      },
      required: ['projectId']
    }
  },
  {
    name: 'get_page_details',
    description: 'Get details for a page in the latest crawl run',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string' },
        url: { type: 'string' }
      },
      required: ['projectId', 'url']
    }
  },
  {
    name: 'get_issues_list',
    description: 'Get issue clusters for the latest crawl run',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string' },
        limit: { type: 'number', default: 25 }
      },
      required: ['projectId']
    }
  },
  {
    name: 'search_pages',
    description: 'Search pages in the latest crawl run by URL/title keyword',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string' },
        query: { type: 'string' },
        limit: { type: 'number', default: 25 }
      },
      required: ['projectId', 'query']
    }
  },
  {
    name: 'get_comparison',
    description: 'Compare the latest two crawl runs for a project',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string' }
      },
      required: ['projectId']
    }
  }
];

function clientFromEnv(env: Env) {
  return createClient({
    url: env.TURSO_DATABASE_URL,
    authToken: env.TURSO_AUTH_TOKEN
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);

    if (pathname === '/mcp/tools' && request.method === 'GET') {
      return new Response(JSON.stringify({ tools: TOOLS }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (pathname === '/mcp/call' && request.method === 'POST') {
      const { name, arguments: args } = await request.json() as any;
      const client = clientFromEnv(env);
      
      if (name === 'get_crawl_summary') {
        const result = await client.execute({
          sql: 'SELECT summary_json FROM crawl_runs WHERE project_id = ? ORDER BY created_at DESC LIMIT 1',
          args: [args.projectId]
        });
        return new Response(JSON.stringify({
          result: result.rows[0] ? JSON.parse(String(result.rows[0].summary_json || '{}')) : { error: 'No crawl data' }
        }), { headers: { 'Content-Type': 'application/json' } });
      }

      if (name === 'get_top_issues') {
        const run = await client.execute({
          sql: 'SELECT id FROM crawl_runs WHERE project_id = ? ORDER BY created_at DESC LIMIT 1',
          args: [args.projectId]
        });
        if (!run.rows[0]) {
          return new Response(JSON.stringify({ result: [] }), { headers: { 'Content-Type': 'application/json' } });
        }
        const runId = String(run.rows[0].id);
        const issues = await client.execute({
          sql: 'SELECT category, title, description, priority, affected_count FROM crawl_issue_clusters WHERE run_id = ? ORDER BY affected_count DESC LIMIT ?',
          args: [runId, Number(args.limit || 10)]
        });
        return new Response(JSON.stringify({ result: issues.rows }), { headers: { 'Content-Type': 'application/json' } });
      }

      if (name === 'get_page_details') {
        const run = await client.execute({
          sql: 'SELECT session_id FROM crawl_runs WHERE project_id = ? ORDER BY created_at DESC LIMIT 1',
          args: [args.projectId]
        });
        const sessionId = run.rows[0] ? String(run.rows[0].session_id) : null;
        if (!sessionId) {
          return new Response(JSON.stringify({ result: { error: 'No crawl data' } }), { headers: { 'Content-Type': 'application/json' } });
        }
        const page = await client.execute({
          sql: 'SELECT * FROM crawl_pages WHERE session_id = ? AND url = ? LIMIT 1',
          args: [sessionId, args.url]
        });
        const row = page.rows[0];
        const metadata = row?.metadata ? JSON.parse(String(row.metadata)) : {};
        return new Response(JSON.stringify({ result: row ? { ...row, metadata } : null }), { headers: { 'Content-Type': 'application/json' } });
      }

      if (name === 'get_issues_list') {
        const run = await client.execute({
          sql: 'SELECT id FROM crawl_runs WHERE project_id = ? ORDER BY created_at DESC LIMIT 1',
          args: [args.projectId]
        });
        if (!run.rows[0]) {
          return new Response(JSON.stringify({ result: [] }), { headers: { 'Content-Type': 'application/json' } });
        }
        const runId = String(run.rows[0].id);
        const issues = await client.execute({
          sql: 'SELECT * FROM crawl_issue_clusters WHERE run_id = ? ORDER BY affected_count DESC LIMIT ?',
          args: [runId, Number(args.limit || 25)]
        });
        return new Response(JSON.stringify({ result: issues.rows }), { headers: { 'Content-Type': 'application/json' } });
      }

      if (name === 'search_pages') {
        const run = await client.execute({
          sql: 'SELECT session_id FROM crawl_runs WHERE project_id = ? ORDER BY created_at DESC LIMIT 1',
          args: [args.projectId]
        });
        const sessionId = run.rows[0] ? String(run.rows[0].session_id) : null;
        if (!sessionId) {
          return new Response(JSON.stringify({ result: [] }), { headers: { 'Content-Type': 'application/json' } });
        }
        const q = `%${String(args.query || '').toLowerCase()}%`;
        const pages = await client.execute({
          sql: 'SELECT url, title, status_code, health_score FROM crawl_pages WHERE session_id = ? AND (lower(url) LIKE ? OR lower(title) LIKE ?) ORDER BY health_score ASC LIMIT ?',
          args: [sessionId, q, q, Number(args.limit || 25)]
        });
        return new Response(JSON.stringify({ result: pages.rows }), { headers: { 'Content-Type': 'application/json' } });
      }

      if (name === 'get_comparison') {
        const runs = await client.execute({
          sql: 'SELECT id, summary_json, created_at FROM crawl_runs WHERE project_id = ? ORDER BY created_at DESC LIMIT 2',
          args: [args.projectId]
        });
        if (runs.rows.length < 2) {
          return new Response(JSON.stringify({ result: { error: 'Need at least 2 runs' } }), { headers: { 'Content-Type': 'application/json' } });
        }
        const current = runs.rows[0];
        const previous = runs.rows[1];
        const currentSummary = JSON.parse(String(current.summary_json || '{}'));
        const previousSummary = JSON.parse(String(previous.summary_json || '{}'));
        return new Response(JSON.stringify({
          result: {
            currentRunId: current.id,
            previousRunId: previous.id,
            currentCreatedAt: current.created_at,
            previousCreatedAt: previous.created_at,
            currentSummary,
            previousSummary,
            deltas: {
              score: Number(currentSummary.score || currentSummary.healthScore || 0) - Number(previousSummary.score || previousSummary.healthScore || 0),
              totalPages: Number(currentSummary.total_pages || currentSummary.totalPages || 0) - Number(previousSummary.total_pages || previousSummary.totalPages || 0),
              totalIssues: Number(currentSummary.total_issues || currentSummary.totalIssues || 0) - Number(previousSummary.total_issues || previousSummary.totalIssues || 0)
            }
          }
        }), { headers: { 'Content-Type': 'application/json' } });
      }

      return new Response(JSON.stringify({ error: 'Tool not found' }), { status: 404 });
    }

    return new Response('Seesby MCP Server', { status: 200 });
  }
};
