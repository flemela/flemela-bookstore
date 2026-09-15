// =============================================================================
// flemela/server/api/admin/books/upload-url.post.ts
// Canonical Upload URL Negotiation Endpoint
// =============================================================================

import { defineEventHandler, readBody, getCookie, getHeader, createError } from 'h3';
import { ofetch } from 'ofetch';

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();

  let token = getCookie(event, 'flemela_admin_session');
  if (!token) {
    const authHeader = getHeader(event, 'authorization');
    if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
      token = authHeader.slice(7).trim();
    }
  }

  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      data: { message: 'Admin session expired. Please log in again.' },
    });
  }

  const body = await readBody(event);
  if (!body?.filename) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      data: { message: 'Filename is required.' },
    });
  }

  const sokoApiUrl = config.sokoApiBaseUrl || process.env.SOKO_API_BASE_URL || 'http://localhost:3000';

  try {
    const res = await ofetch<{
      success: boolean;
      data?: {
        uploadUrl: string;
        key: string;
        fileUrl: string;
        expiresInSeconds: number;
      };
      error?: { message: string };
    }>(`${sokoApiUrl}/books/upload-url`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: {
        filename: body.filename,
        format: body.format || 'pdf',
        contentType: body.contentType || 'application/pdf',
      },
    });

    if (!res.success || !res.data) {
      throw createError({
        statusCode: 502,
        statusMessage: 'Storage Gateway Error',
        data: { message: res.error?.message || 'Failed to acquire upload slot from Soko.' },
      });
    }

    return res.data;
  } catch (err: any) {
    throw createError({
      statusCode: err.statusCode || err.response?.status || 500,
      statusMessage: 'Upload Error',
      data: { message: err.data?.message || err.message || 'Storage service unavailable.' },
    });
  }
});