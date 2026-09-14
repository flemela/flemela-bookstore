// =============================================================================
// flemela/server/api/admin/products/[productId]/formats/index.post.ts
// =============================================================================

import { defineEventHandler, readBody, getCookie, getHeader, createError } from 'h3';
import { ofetch } from 'ofetch';

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const productId = event.context.params?.productId;

  if (!productId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      data: { message: 'Missing productId parameter' },
    });
  }

  // Extract session token
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
  const sokoApiUrl = config.sokoApiBaseUrl || process.env.SOKO_API_BASE_URL || 'http://localhost:3000';
  const targetUrl = `${sokoApiUrl}/api/v1/products/${productId}/formats`;

  try {
    // ofetch bypasses Nitro's internal route scoring union, eliminating TS2321
    return await ofetch(targetUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body,
    });
  } catch (err: any) {
    throw createError({
      statusCode: err.statusCode || err.response?.status || 500,
      statusMessage: 'API Gateway Error',
      data: { message: err.data?.message || err.message || 'Failed to create format' },
    });
  }
});