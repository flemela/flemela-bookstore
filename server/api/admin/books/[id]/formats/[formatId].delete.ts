// =============================================================================
// server/api/admin/books/[id]/formats/[formatId].delete.ts
// Proxy endpoint removing a format row from a book.
// =============================================================================

import { sokoClient } from '../../../../../utils/sokoClient';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const formatId = getRouterParam(event, 'formatId');

  if (!id || !formatId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Product ID and Format ID are required',
    });
  }

  return sokoClient(`/products/${id}/formats/${formatId}`, {
    method: 'DELETE',
  });
});