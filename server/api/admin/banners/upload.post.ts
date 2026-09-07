// =============================================================================
// flemela/server/api/admin/banners/upload.post.ts
// Server-side forwarder for admin banner image uploads to backend
// =============================================================================

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const token = getCookie(event, 'flemela_admin_session') || event.context.authToken;

  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized session' });
  }

  const rawBody = await readRawBody(event, false);
  if (!rawBody || rawBody.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'No file received' });
  }

  const backendBaseUrl = config.sokoApiBaseUrl.replace(/\/$/, '');
  const targetUrl = `${backendBaseUrl}/banners/upload`;
  const contentType = getHeader(event, 'content-type') || 'multipart/form-data';

  try {
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
      } catch {}
      throw createError({ statusCode: response.status, statusMessage: errorMsg });
    }

    const data: any = await response.json();
    return data.data || data;
  } catch (err: any) {
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.statusMessage || err.message || 'Image upload forwarding failed',
    });
  }
});