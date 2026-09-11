// =============================================================================
// server/api/admin/books/[id]/formats/[formatId].patch.ts
// Proxy endpoint updating a specific format row.
// =============================================================================

import { sokoClient } from '../../../../../utils/sokoClient';

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'flemela_admin_session') || event.context.authToken;

  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized admin session' });
  }

  const id = getRouterParam(event, 'id');
  const formatId = getRouterParam(event, 'formatId');
  const body = await readBody(event);

  if (!id || !formatId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Product ID and Format ID are required',
    });
  }

  return sokoClient(`/products/${id}/formats/${formatId}`, {
    method: 'PATCH',
    body,
    token,
    event,
  });
});