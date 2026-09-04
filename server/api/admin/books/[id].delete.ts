// =============================================================================
// server/api/admin/books/[id].delete.ts
// Secure proxy forwarding the admin bearer token to the deletion endpoint.
// =============================================================================

import { sokoClient } from '../../../utils/sokoClient';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const token = getCookie(event, 'flemela_admin_session') || event.context.authToken;

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Product ID is required' });
  }

  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized admin session' });
  }

  try {
    const result = await sokoClient<{
      deleted: boolean;
      action: 'hard_deleted' | 'soft_deleted';
    }>(`/products/${id}`, {
      method: 'DELETE',
      token,
    });
    return result;
  } catch (err: any) {
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.data?.message || err.statusMessage || 'Failed to delete book',
    });
  }
});