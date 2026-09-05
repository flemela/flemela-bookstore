// server/api/admin/books/import/excel.post.ts
// =============================================================================
// Robust multipart forwarder: extracts file buffer safely and posts to Soko API
// =============================================================================

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const token = getCookie(event, 'flemela_admin_session') || event.context.authToken;

  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized session' });
  }

  // 1. Read multipart data directly from the incoming event using H3 native parser
  const multiPartData = await readMultipartFormData(event);
  if (!multiPartData || multiPartData.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'No file uploaded' });
  }

  const fileItem = multiPartData.find((item) => item.name === 'file');
  if (!fileItem || !fileItem.data) {
    throw createError({ statusCode: 400, statusMessage: 'Spreadsheet file is required' });
  }

  // 2. Build a clean, standard Web FormData object with the raw file buffer
  const formData = new FormData();
  const blob = new Blob([new Uint8Array(fileItem.data) as any], {
    type: fileItem.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  formData.append('file', blob, fileItem.filename || 'import.xlsx');

  const backendBaseUrl = config.sokoApiBaseUrl.replace(/\/$/, '');
  const targetUrl = `${backendBaseUrl}/books/import/excel`;

  // 3. Post to Soko API with a dedicated 60-second timeout to prevent infinite hanging
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

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
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw createError({ statusCode: 504, statusMessage: 'Upload timed out after 60 seconds' });
    }
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.statusMessage || err.message || 'Failed to forward spreadsheet to backend',
    });
  }
});