// server/api/admin/books/import/excel.post.ts
// =============================================================================
// Direct raw stream forwarder (Restores the 5-second upload response)
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

  const incomingContentLength = getHeader(event, 'content-length');
  if (incomingContentLength) {
    headers['content-length'] = incomingContentLength;
  }

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body: event.node.req as any,
      duplex: 'half',
    } as any);

    if (!response.ok) {
      let errorMsg = `Upload failed with HTTP ${response.status}`;
      try {
        const errorJson: any = await response.json();
        errorMsg = errorJson.message || errorJson.error?.message || errorMsg;
      } catch {
        // Fall back to HTTP status
      }
      throw createError({ statusCode: response.status, statusMessage: errorMsg });
    }

    const data = await response.json();
    return data;
  } catch (err: any) {
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.statusMessage || err.message || 'Spreadsheet upload forwarding failed',
    });
  }
});