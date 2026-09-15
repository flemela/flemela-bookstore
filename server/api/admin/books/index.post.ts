// =============================================================================
// flemela/server/api/admin/books/index.post.ts
// Creates product using Soko's POST /api/v1/products/bulk endpoint
// =============================================================================

import { defineEventHandler, readBody, getCookie, getHeader, createError } from 'h3';
import { ofetch } from 'ofetch';

function resolveApiBaseUrl(raw?: string): string {
  const base = (raw || process.env.SOKO_API_BASE_URL || 'http://localhost:3000/api/v1')
    .trim()
    .replace(/\/+$/, '')
    .replace(/\/api\/v1$/, '');
  return `${base}/api/v1`;
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();

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
    // Soko uses /products/bulk for creation (takes an array of 1 to 10 products)
    const res = await ofetch<{ success: boolean; data: any[] }>(`${baseApiUrl}/products/bulk`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: {
        products: [body],
      },
    });

    const created = res.data?.[0];
    if (!created) {
      throw new Error('Soko failed to create product record.');
    }

    return created;
  } catch (err: any) {
    throw createError({
      statusCode: err.statusCode || err.response?.status || 500,
      statusMessage: 'Creation Error',
      data: { message: err.data?.message || err.message || 'Failed to create book in catalog.' },
    });
  }
});