// =============================================================================
// server/api/admin/books/bulk-badge.post.ts
// Proxy endpoint: Bulk assigns or clears product badges and sale schedules
// =============================================================================

import { sokoClient } from '../../../utils/sokoClient';

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'flemela_admin_session') || event.context.authToken;

  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized admin session' });
  }

  const body = await readBody(event);
  if (!body || !Array.isArray(body.productIds) || body.productIds.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'At least one product ID is required' });
  }

  try {
    return await sokoClient('/products/bulk-badge', {
      method: 'POST',
      body,
      token,
    });
  } catch (err: any) {
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.data?.message || err.statusMessage || 'Failed to update product badge',
    });
  }
});