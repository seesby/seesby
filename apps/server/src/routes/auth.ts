// apps/server/src/routes/auth.ts
// ── Authentication Routes ────────────────────────────────────────────
// Provides endpoints for verifying authentication status and
// retrieving the current user profile.

import { Hono } from 'hono';
import { authMiddleware, getAuthUser, isAuthDisabled } from '../services/auth';

export const authRoutes = new Hono();

// ── GET /api/auth/me ────────────────────────────────────────────────
// Returns the currently authenticated user's profile.
authRoutes.get('/me', authMiddleware, async (c) => {
  try {
    const user = getAuthUser(c);
    return c.json({
      userId: user.id,
      email: user.email,
      name: user.name,
      authDisabled: isAuthDisabled(),
    });
  } catch (err) {
    return c.json({ error: (err as Error).message }, 401);
  }
});

// ── GET /api/auth/status ────────────────────────────────────────────
// Returns authentication system status (no auth required).
authRoutes.get('/status', async (c) => {
  return c.json({
    configured: !isAuthDisabled(),
    provider: isAuthDisabled() ? 'none (dev mode)' : 'clerk',
  });
});
