// =============================================================================
// server/middleware/admin-auth.ts
// Nitro server middleware gating all /api/admin/* endpoints.
// Rejects unauthenticated direct API requests before route handlers execute.
// =============================================================================

export default defineEventHandler((event) => {
  const path = getRequestPath(event);

  // Only protect /api/admin/* routes, exempting login and register
  if (!path.startsWith('/api/admin/')) {
    return;
  }

  const isPublicAuthRoute =
    path === '/api/admin/login' ||
    path === '/api/admin/register';

  if (isPublicAuthRoute) {
    return;
  }

  // Extract session token from httpOnly cookie or Authorization Bearer header
  const sessionToken =
    getCookie(event, 'flemela_admin_session') ||
    getHeader(event, 'authorization')?.replace(/^Bearer\s+/i, '');

  if (!sessionToken || sessionToken.trim().length === 0) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized: Admin authentication session is missing or expired.',
    });
  }

  // Attach token to request context for downstream sokoClient forwarding
  event.context.authToken = sessionToken.trim();
});