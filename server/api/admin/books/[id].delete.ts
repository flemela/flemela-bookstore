// =============================================================================
// server/api/admin/books/[id].delete.ts
// Proxy endpoint deleting a book product and cascading its child records.
// =============================================================================

import { sokoClient } from '../../../utils/sokoClient';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Product ID is required' });
  }

  try {
    const result = await sokoClient<{ success: boolean; deleted: boolean }>(`/products/${id}`, {
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