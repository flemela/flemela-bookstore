// =============================================================================
// flemela/server/api/books/download/[token].get.ts
// Proxies tokenized book downloads to Cloudflare R2 signed stream.
// =============================================================================

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token');
  const config = useRuntimeConfig();

  if (!token) {
    throw createError({ statusCode: 400, statusMessage: 'Download token is required' });
  }

  const backendBaseUrl = config.sokoApiBaseUrl.replace(/\/$/, '');
  const targetUrl = `${backendBaseUrl}/books/download/${token}?redirect=true`;

  // 302 redirect directly to the backend's presigned Cloudflare R2 stream
  return sendRedirect(event, targetUrl, 302);
});