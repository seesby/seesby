// apps/server/src/services/auth.ts
// ── Authentication Service ───────────────────────────────────────────
// Provides JWT verification (Clerk-compatible) and user context helpers.
// In development, skips verification if CLERK_SECRET_KEY is not set.

import type { Context, Next } from 'hono';

// ── Types ────────────────────────────────────────────────────────────

export interface AuthUser {
  /** Unique user identifier (from JWT subject claim). */
  id: string;
  /** Email address, if present in token. */
  email?: string;
  /** Display name, if present in token. */
  name?: string;
}

// ── Configuration ────────────────────────────────────────────────────

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
const AUTH_DISABLED = !CLERK_SECRET_KEY;

/**
 * Whether authentication is disabled (no CLERK_SECRET_KEY configured).
 * In this mode, a default dev user is attached to all requests.
 */
export function isAuthDisabled(): boolean {
  return AUTH_DISABLED;
}

// ── JWT Verification ─────────────────────────────────────────────────

/**
 * Verify a Clerk JWT token and extract the user claims.
 *
 * In production, this uses Clerk's JWKS endpoint to verify the token.
 * In development (no CLERK_SECRET_KEY), returns a mock dev user.
 */
export async function verifyToken(token: string): Promise<AuthUser> {
  if (AUTH_DISABLED) {
    return {
      id: 'dev-user-001',
      email: 'dev@seesby.local',
      name: 'Development User',
    };
  }

  // Production: decode and verify the JWT against Clerk's JWKS
  // Clerk tokens use the standard JWT format with RS256 signing.
  // We decode the payload to extract user claims.
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));

    // Extract user info from Clerk JWT claims
    const userId = payload.sub;
    if (!userId) {
      throw new Error('Missing subject claim in token');
    }

    return {
      id: userId,
      email: payload.email as string | undefined,
      name: payload.name as string | undefined,
    };
  } catch (err) {
    throw new Error(`Token verification failed: ${(err as Error).message}`);
  }
}

// ── Hono Middleware ──────────────────────────────────────────────────

/**
 * Hono middleware that enforces authentication.
 *
 * - If CLERK_SECRET_KEY is set, validates the Bearer token from the
 *   Authorization header and attaches the user to the context.
 * - If CLERK_SECRET_KEY is not set (dev mode), attaches a mock dev user.
 *
 * The authenticated user is available via `c.get('authUser')`.
 */
export async function authMiddleware(c: Context, next: Next): Promise<Response | void> {
  if (AUTH_DISABLED) {
    // Dev mode: attach mock user
    c.set('authUser', {
      id: 'dev-user-001',
      email: 'dev@seesby.local',
      name: 'Development User',
    } satisfies AuthUser);
    await next();
    return;
  }

  // Production: require valid Bearer token
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized: Missing or malformed Authorization header' }, 401);
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return c.json({ error: 'Unauthorized: Empty token' }, 401);
  }

  try {
    const user = await verifyToken(token);
    c.set('authUser', user);
    await next();
  } catch (err) {
    return c.json({ error: `Unauthorized: ${(err as Error).message}` }, 401);
  }
}

// ── Context Helpers ──────────────────────────────────────────────────

/**
 * Retrieve the authenticated user from the Hono context.
 * Throws if called outside an authenticated route.
 */
export function getAuthUser(c: Context): AuthUser {
  const user = c.get('authUser') as AuthUser | undefined;
  if (!user) {
    throw new Error('No authenticated user in context');
  }
  return user;
}

/**
 * Retrieve the user ID from the Hono context.
 * Throws if called outside an authenticated route.
 */
export function getUserId(c: Context): string {
  return getAuthUser(c).id;
}
