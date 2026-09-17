// =============================================================================
// flemela/server/api/admin/products/[productId]/formats/[formatId].patch.ts
// =============================================================================

import { defineEventHandler, readBody, getCookie, getHeader, createError } from 'h3';
import { ofetch } from 'ofetch';

function resolveApiBaseUrl(raw?: string): string {
  const base = (raw || process.env.SOKO_API_BASE_URL || 'http://localhost:3000/api/v1')
    .trim()
    .replace(/\/+$/, '');
  return base.endsWith('/api/v1') ? base : `${base}/api/v1`;
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const { productId, formatId } = event.context.params || {};

  if (!productId || !formatId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      data: { message: 'Missing productId or formatId parameter' },
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
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      data: { message: 'Admin session expired. Please log in again.' },
    });
  }

  const body = await readBody(event);
  const baseApiUrl = resolveApiBaseUrl(config.sokoApiBaseUrl);
  const targetUrl = `${baseApiUrl}/products/${productId}/formats/${formatId}`;

  try {
    return await ofetch(targetUrl, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body,
    });
  } catch (err: any) {
    const errorMsg =
      err.data?.error?.message ||
      err.data?.message ||
      err.response?._data?.error?.message ||
      err.message ||
      'Failed to update format';

    throw createError({
      statusCode: err.statusCode || err.response?.status || 500,
      statusMessage: errorMsg,
      data: { message: errorMsg },
    });
  }
});