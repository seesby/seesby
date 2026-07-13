// workers/ghost-bridge/crawl-queue-routes.ts
// ── Crawl Queue API Routes ────────────────────────────────────────────
// Proxies /api/crawl-queue/:sessionId/* requests to the CrawlSessionDO.

// Env type is imported from the main worker's Env interface.
// We use a structural match here to avoid circular imports.
interface QueueEnv {
  CRAWL_SESSION: DurableObjectNamespace;
  SEESBY_R2?: R2Bucket;
}

const corsHeaders = (origin: string) => ({
  'Access-Control-Allow-Origin': origin,
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
  'Vary': 'Origin',
});

const json = (body: unknown, status = 200, origin = '*') =>
  new Response(JSON.stringify(body), { status, headers: corsHeaders(origin) });

/**
 * Route: /api/crawl-queue/:sessionId/:action
 * Proxies to the CrawlSessionDO for the given session.
 */
export async function handleCrawlQueue(request: Request, env: QueueEnv): Promise<Response> {
  const url = new URL(request.url);
  const origin = request.headers.get('Origin') || '*';

  // Parse: /api/crawl-queue/:sessionId/:action
  const parts = url.pathname.replace('/api/crawl-queue/', '').split('/');
  const sessionId = parts[0];
  const action = parts[1] || 'status';

  if (!sessionId) {
    return json({ error: 'Missing sessionId' }, 400, origin);
  }

  if (!env.CRAWL_SESSION) {
    return json({ error: 'Durable Object binding not configured' }, 500, origin);
  }

  try {
    // Get the DO instance for this session
    const doId = env.CRAWL_SESSION.idFromName(sessionId);
    const stub = env.CRAWL_SESSION.get(doId);

    // Map action to DO path
    const doPath = `/${action}`;
    const doUrl = new URL(doPath, url.origin);

    // Forward the request to the DO
    const doRequest = new Request(doUrl.toString(), {
      method: request.method,
      headers: { 'Content-Type': 'application/json' },
      body: request.method === 'POST' ? await request.text() : undefined,
    });

    const doResponse = await stub.fetch(doRequest);
    const responseBody = await doResponse.text();

    return new Response(responseBody, {
      status: doResponse.status,
      headers: corsHeaders(origin),
    });
  } catch (err: any) {
    return json({ error: err.message || 'Queue request failed' }, 500, origin);
  }
}

/**
 * Route: /api/storage/archive
 * Archives crawl data to R2 for cold storage.
 */
export async function handleArchive(request: Request, env: QueueEnv): Promise<Response> {
  const origin = request.headers.get('Origin') || '*';

  if (!env.SEESBY_R2) {
    return json({ error: 'R2 bucket not configured' }, 500, origin);
  }

  try {
    const body = await request.json() as any;
    if (!body.key || !body.data) {
      return json({ error: 'Missing key or data' }, 400, origin);
    }

    await env.SEESBY_R2.put(body.key, body.data, {
      httpMetadata: {
        contentType: body.compressed ? 'application/gzip' : 'application/json',
      },
      customMetadata: {
        pageCount: String(body.pageCount ?? 0),
        archivedAt: new Date().toISOString(),
        compressed: String(body.compressed ?? false),
      },
    });

    return json({ ok: true, key: body.key });
  } catch (err: any) {
    return json({ error: err.message || 'Archive failed' }, 500, origin);
  }
}
