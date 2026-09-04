// =============================================================================
// server/api/admin/books/[id].delete.ts
// Proxy endpoint executing smart deletion with customer preservation.
// =============================================================================

import { sokoClient } from '../../../utils/sokoClient';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Product ID is required' });
  }

  try {
    const result = await sokoClient<{
      deleted: boolean;
      action: 'hard_deleted' | 'soft_deleted';
    }>(`/products/${id}`, {
      method: 'DELETE',
    });
    return result;
  } catch (err: any) {
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.statusMessage || 'Failed to delete book from catalog',
    });
  }
});