// =============================================================================
// server/utils/adminSession.ts
// Admin session cookies. Soko access tokens last an hour; the refresh token lets
// the server swap in a new one quietly, so an admin stays signed in for the week
// the session cookie lives instead of being thrown out mid-task.
// =============================================================================

import type { H3Event } from 'h3';
import { sokoClient } from './sokoClient';

export const SESSION_COOKIE = 'flemela_admin_session';
export const REFRESH_COOKIE = 'flemela_admin_refresh';

const WEEK = 60 * 60 * 24 * 7;
// Renew a little before expiry so a request never goes out with a token that dies in flight.
const RENEW_WITHIN_MS = 5 * 60 * 1000;

interface SokoTokens {
  accessToken: string;
  refreshToken?: string;
}

export function setAdminSession(event: H3Event, tokens: SokoTokens): void {
  setCookie(event, SESSION_COOKIE, tokens.accessToken, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: WEEK,
    path: '/',
  });
  if (tokens.refreshToken) {
    setCookie(event, REFRESH_COOKIE, tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: WEEK,
      path: '/',
    });
  }
}

export function clearAdminSession(event: H3Event): void {
  deleteCookie(event, SESSION_COOKIE, { path: '/' });
  deleteCookie(event, REFRESH_COOKIE, { path: '/' });
}

function expiresAt(token: string): number | null {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function needsRenewal(token: string | undefined): boolean {
  if (!token) return true;
  const exp = expiresAt(token);
  return exp !== null && exp - Date.now() < RENEW_WITHIN_MS;
}

// Returns the new access token, or null if Soko would not renew (the admin then logs in as before).
export async function renewAdminSession(event: H3Event): Promise<string | null> {
  const refreshToken = getCookie(event, REFRESH_COOKIE);
  if (!refreshToken) return null;
  try {
    const res = await sokoClient<{ tokens?: SokoTokens } & Partial<SokoTokens>>('/auth/refresh', {
      method: 'POST',
      body: { refreshToken },
    });
    const tokens = res.tokens || (res.accessToken ? (res as SokoTokens) : null);
    if (!tokens?.accessToken) return null;
    setAdminSession(event, { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken || refreshToken });
    return tokens.accessToken;
  } catch {
    return null;
  }
}
