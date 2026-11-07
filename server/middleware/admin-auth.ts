// =============================================================================
// server/middleware/admin-auth.ts
// Nitro server middleware gating all /api/admin/* endpoints.
// Rejects unauthenticated direct API requests before route handlers execute,
// and renews the Soko access token when it is about to expire.
// =============================================================================

import { SESSION_COOKIE, needsRenewal, renewAdminSession } from '../utils/adminSession';

export default defineEventHandler(async (event) => {
  const path = getRequestPath(event);

  // Only protect /api/admin/* routes, exempting login and register
  if (!path.startsWith('/api/admin/')) {
    return;
  }

  const isPublicAuthRoute =
    path === '/api/admin/login' ||
    path === '/api/admin/register' ||
    path === '/api/admin/logout';

  if (isPublicAuthRoute) {
    return;
  }

  const bearer = getHeader(event, 'authorization')?.replace(/^Bearer\s+/i, '');
  let sessionToken = getCookie(event, SESSION_COOKIE) || bearer;

  if (!bearer && needsRenewal(sessionToken)) {
    const renewed = await renewAdminSession(event);
    if (renewed) {
      sessionToken = renewed;
      // Route handlers read the session cookie straight off the request, so point it at the new token.
      const others = (getHeader(event, 'cookie') || '')
        .split(/;\s*/)
        .filter((c) => c && !c.startsWith(`${SESSION_COOKIE}=`));
      event.node.req.headers.cookie = [...others, `${SESSION_COOKIE}=${renewed}`].join('; ');
    }
  }

  if (!sessionToken || sessionToken.trim().length === 0) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized: Admin authentication session is missing or expired.',
    });
  }

  // Attach token to request context for downstream sokoClient forwarding
  event.context.authToken = sessionToken.trim();
});
