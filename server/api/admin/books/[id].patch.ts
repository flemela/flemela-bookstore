// =============================================================================
// server/api/admin/books/[id].patch.ts
// Proxy endpoint updating base book metadata and publishing status.
// =============================================================================

import { sokoClient } from '../../../utils/sokoClient';

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'flemela_admin_session') || event.context.authToken;

  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized admin session' });
  }

  const id = getRouterParam(event, 'id');
  const body = await readBody(event);

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Product ID is required',
    });
  }

  try {
    const updated = await sokoClient(`/products/${id}`, {
      method: 'PATCH',
      body,
      token,
      event,
    });
    return updated;
  } catch (err: any) {
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.statusMessage || 'Failed to update book',
    });
  }
});