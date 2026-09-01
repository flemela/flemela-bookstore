// =============================================================================
// server/api/admin/books/[id]/formats.post.ts
// Proxy endpoint adding a new format to an existing book.
// =============================================================================

import { sokoClient } from '../../../../utils/sokoClient';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const body = await readBody(event);

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Product ID is required',
    });
  }

  return sokoClient(`/products/${id}/formats`, {
    method: 'POST',
    body,
  });
});