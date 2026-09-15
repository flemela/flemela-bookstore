// =============================================================================
// flemela/server/api/admin/books/[id].patch.ts
// Updates product details via Soko PATCH /api/v1/products/:id
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
  const id = event.context.params?.id;

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      data: { message: 'Missing product ID parameter.' },
    });
  }

  let token = getCookie(event, 'flemela_admin_session');
  if (!token) {
    const authHeader = getHeader(event, 'authorization');
    if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
      token = authHeader.slice(7).trim();
    }
  }

  if (!token) throw createError({ statusCode: 401, message: 'Unauthorized' });

  const body = await readBody(event);
  const baseApiUrl = resolveApiBaseUrl(config.sokoApiBaseUrl);

  try {
    const res = await ofetch<{ success: boolean; data: any }>(
      `${baseApiUrl}/products/${id}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body,
      }
    );

    return res.data || res;
  } catch (err: any) {
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: 'Update Error',
      data: { message: err.data?.message || err.message || 'Failed to update book.' },
    });
  }
});