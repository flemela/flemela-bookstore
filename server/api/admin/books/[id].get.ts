// =============================================================================
// flemela/server/api/admin/books/[id].get.ts
// Single Book Getter (Explicitly rejects 'upload-url' to prevent router collision)
// =============================================================================

import { defineEventHandler, getCookie, getHeader, createError } from 'h3';
import { ofetch } from 'ofetch';

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const id = event.context.params?.id;

  // Crucial guard: If Nitro routed "upload-url" here, reject immediately
  if (!id || id === 'upload-url') {
    throw createError({
      statusCode: 404,
      statusMessage: 'Not Found',
      data: { message: 'Invalid book identifier.' },
    });
  }

  let token = getCookie(event, 'flemela_admin_session');
  if (!token) {
    const authHeader = getHeader(event, 'authorization');
    if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
      token = authHeader.slice(7).trim();
    }
  }

  if (!token) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }

  const sokoApiUrl = config.sokoApiBaseUrl || process.env.SOKO_API_BASE_URL || 'http://localhost:3000';

  try {
    const res = await ofetch<{ success: boolean; data?: any }>(
      `${sokoApiUrl}/api/v1/products/${id}`,
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    return res.data || res;
  } catch (err: any) {
    throw createError({
      statusCode: err.statusCode || 404,
      statusMessage: 'Not Found',
      data: { message: 'Book not found in store catalog.' },
    });
  }
});