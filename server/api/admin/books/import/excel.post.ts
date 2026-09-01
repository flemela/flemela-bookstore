// =============================================================================
// server/api/admin/books/import/excel.post.ts
// Proxies multipart spreadsheet uploads securely to Soko background BullMQ queue.
// =============================================================================

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const token = getCookie(event, 'flemela_admin_session') || event.context.authToken;

  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized session' });
  }

  const backendBaseUrl = config.sokoApiBaseUrl.replace(/\/$/, '');
  const targetUrl = `${backendBaseUrl}/books/import/excel`;

  // Forward incoming multipart stream with authentication
  const response = await fetch(targetUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      ...(event.node.req.headers['content-type'] ? { 'Content-Type': event.node.req.headers['content-type'] } : {}),
    },
    body: event.node.req as any,
    duplex: 'half',
  } as any);

  const data = await response.json();
  return data;
});