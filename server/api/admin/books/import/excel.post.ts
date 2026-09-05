// server/api/admin/books/import/excel.post.ts
// =============================================================================
// Direct Buffer Forwarder — TypeScript DOM / Node Buffer Type Mismatch Resolved
// =============================================================================

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const token = getCookie(event, 'flemela_admin_session') || event.context.authToken;

  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized session' });
  }

  // 1. Read the raw incoming multipart body into a memory buffer
  const rawBody = await readRawBody(event, false);
  if (!rawBody || rawBody.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'No file received' });
  }

  const backendBaseUrl = config.sokoApiBaseUrl.replace(/\/$/, '');
  const targetUrl = `${backendBaseUrl}/books/import/excel`;

  const contentType = getHeader(event, 'content-type') || 'multipart/form-data';

  try {
    // 2. Cast rawBody as any to satisfy TypeScript's DOM BodyInit definition
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': contentType,
        'Content-Length': String(rawBody.length),
      },
      body: rawBody as any,
    });

    if (!response.ok) {
      let errorMsg = `Upload failed with HTTP ${response.status}`;
      try {
        const errJson: any = await response.json();
        errorMsg = errJson.message || errJson.error?.message || errorMsg;
      } catch {
        // Fall back to status string
      }
      throw createError({ statusCode: response.status, statusMessage: errorMsg });
    }

    return await response.json();
  } catch (err: any) {
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.statusMessage || err.message || 'Spreadsheet upload forwarding failed',
    });
  }
});