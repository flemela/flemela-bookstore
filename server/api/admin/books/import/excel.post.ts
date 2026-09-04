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

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };

  const incomingContentType = getHeader(event, 'content-type');
  if (incomingContentType) {
    headers['content-type'] = incomingContentType;
  }

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body: event.node.req as any,
      duplex: 'half',
    } as any);

    const data = await response.json();
    return data;
  } catch (err: any) {
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.message || 'Spreadsheet upload forwarding failed',
    });
  }
});