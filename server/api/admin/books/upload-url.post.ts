// =============================================================================
// flemela/server/api/admin/books/upload-url.post.ts
// Nuxt 3 BFF: Securely unpacks session cookie and negotiates Soko Presigned URL
// =============================================================================

import { defineEventHandler, readBody, getCookie, getHeader, createError } from 'h3';

interface SokoUploadUrlResponse {
  success: boolean;
  data?: {
    uploadUrl: string;
    key: string;
    fileUrl: string;
    expiresInSeconds: number;
  };
  error?: {
    message: string;
    code?: string;
  };
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();

  // 1. Extract session token from HTTP-only cookie or incoming Authorization header
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

  // 2. Validate request payload
  const body = await readBody(event);
  if (!body || !body.filename) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      data: { message: 'Filename is required to generate an upload slot.' },
    });
  }

  const sokoApiUrl = config.sokoApiBaseUrl || process.env.SOKO_API_BASE_URL || 'http://localhost:3000';

  // 3. Dispatch authenticated negotiation call to Soko backend
  try {
    const response = await $fetch<SokoUploadUrlResponse>(`${sokoApiUrl}/api/v1/books/upload-url`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token.trim()}`,
        'Content-Type': 'application/json',
      },
      body: {
        filename: body.filename,
        format: body.format || 'pdf',
        contentType: body.contentType || 'application/pdf',
      },
    });

    if (!response.success || !response.data) {
      throw createError({
        statusCode: 502,
        statusMessage: 'Storage Gateway Error',
        data: { message: response.error?.message || 'Failed to acquire upload authorization.' },
      });
    }

    return response.data;
  } catch (err: any) {
    const status = err.statusCode || err.response?.status || 500;
    const errorDetails = err.data?.error?.message || err.message || 'Failed to communicate with API server.';

    throw createError({
      statusCode: status,
      statusMessage: 'API Gateway Error',
      data: { message: errorDetails },
    });
  }
});