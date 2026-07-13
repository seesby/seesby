// workers/ghost-bridge/storage-routes.ts
// ── Storage API Routes ───────────────────────────────────────────────
// Routes for R2 archive storage: archive and restore operations.

interface StorageEnv {
  TURSO_DATABASE_URL?: string;
  TURSO_AUTH_TOKEN?: string;
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
 * Route: /api/storage/archive
 * Archives crawl data to R2 for cold storage.
 */
export async function handleArchive(request: Request, env: StorageEnv): Promise<Response> {
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

/**
 * Route: /api/crawler/sync/batch
 * Accepts batched SQL statements from the crawl-sync Web Worker
 * and proxies them to Turso.
 * Auth: requires a shared secret header or same-origin request.
 */
export async function handleSyncBatch(request: Request, env: StorageEnv): Promise<Response> {
  const origin = request.headers.get('Origin') || '*';

  // Basic origin check: only allow same-origin or trusted origins
  const requestOrigin = request.headers.get('Origin') || '';
  const referer = request.headers.get('Referer') || '';
  const isSameOrigin = !requestOrigin ||
    requestOrigin === new URL(request.url).origin ||
    referer.startsWith(new URL(request.url).origin);

  // Also accept a shared sync-secret header for worker-to-worker calls
  // TODO: replace TURSO_AUTH_TOKEN comparison with a dedicated SYNC_SECRET env var
  // to avoid exposing the database credential as an auth token.
  const syncSecret = request.headers.get('X-Sync-Secret');
  const hasValidSecret = syncSecret === env.TURSO_AUTH_TOKEN;

  if (!isSameOrigin && !hasValidSecret) {
    return json({ error: 'Forbidden: invalid origin' }, 403, origin);
  }

  if (!env.TURSO_DATABASE_URL || !env.TURSO_AUTH_TOKEN) {
    return json({ error: 'Turso is not configured' }, 500, origin);
  }

  try {
    const body = await request.json() as { statements?: Array<{ sql: string; args: any[] }> };
    if (!body.statements || !Array.isArray(body.statements) || body.statements.length === 0) {
      return json({ error: 'Missing or empty statements array' }, 400, origin);
    }

    const statements = body.statements.map(stmt => ({
      sql: stmt.sql,
      args: (stmt.args || []).map((arg: any) => {
        if (typeof arg === 'string') return { type: 'text', value: arg };
        if (typeof arg === 'number') return { type: 'integer', value: String(arg) };
        if (arg === null) return { type: 'null' };
        return { type: 'text', value: String(arg) };
      }),
    }));

    const response = await fetch(`${env.TURSO_DATABASE_URL}/v2/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.TURSO_AUTH_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          ...statements.map((stmt: any) => ({ type: 'execute', stmt })),
          { type: 'close' },
        ],
      }),
    });

    if (!response.ok) {
      const err: any = await response.json().catch(() => ({}));
      return json({ error: err?.error || 'Turso batch failed' }, 500, origin);
    }

    return json({ ok: true, executed: statements.length });
  } catch (error: any) {
    return json({ error: error?.message || 'Sync batch failed' }, 500, origin);
  }
}

/**
 * Route: /api/storage/restore
 * Restores archived crawl data from R2.
 * Query param: key — the R2 object key to restore.
 */
export async function handleRestore(request: Request, env: StorageEnv): Promise<Response> {
  const origin = request.headers.get('Origin') || '*';

  if (!env.SEESBY_R2) {
    return json({ error: 'R2 bucket not configured' }, 500, origin);
  }

  try {
    const url = new URL(request.url);
    const key = url.searchParams.get('key');
    if (!key) {
      return json({ error: 'Missing key query parameter' }, 400, origin);
    }

    const object = await env.SEESBY_R2.get(key);
    if (!object) {
      return json({ error: 'Archive not found' }, 404, origin);
    }

    const rawText = await object.text();
    const metadata = object.customMetadata ?? {};
    const isCompressed = metadata.compressed === 'true';

    let parsedData: any;
    if (isCompressed) {
      // Data is gzip-compressed + base64-encoded — decompress
      try {
        const binary = atob(rawText);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const stream = new Blob([bytes])
          .stream()
          .pipeThrough(new DecompressionStream('gzip'));
        const decompressed = await new Response(stream).text();
        parsedData = JSON.parse(decompressed);
      } catch {
        // Fallback: try parsing as raw JSON
        parsedData = JSON.parse(rawText);
      }
    } else {
      parsedData = JSON.parse(rawText);
    }

    return json({
      ok: true,
      key,
      pages: parsedData,
      metadata: {
        pageCount: metadata.pageCount ?? '0',
        archivedAt: metadata.archivedAt ?? '',
        compressed: String(isCompressed),
      },
    });
  } catch (err: any) {
    return json({ error: err.message || 'Restore failed' }, 500, origin);
  }
}
