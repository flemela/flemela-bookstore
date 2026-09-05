// server/api/admin/books/import/excel.post.ts
// =============================================================================
// Proxies multipart spreadsheet uploads securely to Soko backend using H3 stream proxy.
// =============================================================================

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const token = getCookie(event, 'flemela_admin_session') || event.context.authToken;

  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized session' });
  }

  const backendBaseUrl = config.sokoApiBaseUrl.replace(/\/$/, '');
  const targetUrl = `${backendBaseUrl}/books/import/excel`;

  return proxyRequest(event, targetUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
});