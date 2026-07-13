// apps/server/src/routes/metrics.ts
// ── Metric Registry Read API ─────────────────────────────────────────
// Serves metric definitions to the UI. Read-only endpoints for
// querying the metric registry by namespace, key, or role.

import { Hono } from 'hono';
import { ALL_METRICS, METRIC_MAP } from '@seesby/metrics';
import type { MetricDef, MetricRole } from '@seesby/types';
import { METRIC_ROLES } from '@seesby/types';

export const metricsRoutes = new Hono();

// ── GET /api/metrics ────────────────────────────────────────────────
// Returns all metric definitions.
metricsRoutes.get('/', async (c) => {
  const metrics = ALL_METRICS;
  return c.json({
    total: metrics.length,
    metrics,
  });
});

// ── GET /api/metrics/namespace/:namespace ────────────────────────────
// Returns all metrics belonging to a specific namespace (e.g., 'p.tech',
// 'p.content', 'p.links').
metricsRoutes.get('/namespace/:namespace', async (c) => {
  const namespace = c.req.param('namespace');

  // Filter by exact namespace match or prefix match on key
  const filtered = ALL_METRICS.filter(
    (m) => m.namespace === namespace || m.key.startsWith(namespace + '.'),
  );

  return c.json({
    namespace,
    total: filtered.length,
    metrics: filtered,
  });
});

// ── GET /api/metrics/key/:key ───────────────────────────────────────
// Returns a single metric definition by its unique key.
metricsRoutes.get('/key/:key', async (c) => {
  const key = c.req.param('key');
  const metric = ALL_METRICS.find((m) => m.key === key);

  if (!metric) {
    return c.json({ error: `Metric not found: ${key}` }, 404);
  }

  return c.json(metric);
});

// ── GET /api/metrics/role/:role ─────────────────────────────────────
// Returns all metrics that have a specific role (e.g., 'G' for grid
// columns, 'H' for header KPIs, 'X' for export columns).
metricsRoutes.get('/role/:role', async (c) => {
  const role = c.req.param('role') as MetricRole;

  if (!METRIC_ROLES.includes(role)) {
    return c.json(
      {
        error: `Invalid role: ${role}`,
        validRoles: METRIC_ROLES,
      },
      400,
    );
  }

  const filtered = ALL_METRICS.filter((m) => m.roles.includes(role));

  return c.json({
    role,
    roleLabel: {
      G: 'Grid column', I: 'Inspector', R: 'Right sidebar',
      L: 'Left sidebar', H: 'Header KPI', B: 'Bottom bar',
      V: 'View canvas', X: 'Export', K: 'Identifier',
      A: 'Action driver', S: 'Score input', T: 'Compare', E: 'Event',
    }[role],
    total: filtered.length,
    metrics: filtered,
  });
});

// ── GET /api/metrics/level/:level ───────────────────────────────────
// Returns all metrics at a specific level (e.g., 'P' for page, 'S' for
// site, 'F' for fingerprint).
metricsRoutes.get('/level/:level', async (c) => {
  const level = c.req.param('level');

  const filtered = ALL_METRICS.filter((m) => m.level === level);

  return c.json({
    level,
    total: filtered.length,
    metrics: filtered,
  });
});

// ── GET /api/metrics/namespaces ─────────────────────────────────────
// Returns all unique namespaces in the registry (useful for building
// navigation menus or filter lists).
metricsRoutes.get('/namespaces', async (c) => {
  const namespaces = [...new Set(ALL_METRICS.map((m) => m.namespace))].sort();

  return c.json({
    total: namespaces.length,
    namespaces,
  });
});

// ── GET /api/metrics/search ─────────────────────────────────────────
// Search metrics by label or key (case-insensitive substring match).
metricsRoutes.get('/search', async (c) => {
  const query = c.req.query('q')?.toLowerCase();

  if (!query || query.length < 2) {
    return c.json({ error: 'Query parameter "q" is required (min 2 characters)' }, 400);
  }

  const results = ALL_METRICS.filter(
    (m) =>
      m.key.toLowerCase().includes(query) ||
      m.label.toLowerCase().includes(query) ||
      m.namespace.toLowerCase().includes(query),
  );

  return c.json({
    query,
    total: results.length,
    metrics: results,
  });
});
