// =============================================================================
// server/api/admin/categories/[id].patch.ts
// Proxy endpoint: Toggles category showcase shelves and sorts on Soko API
// =============================================================================

import { sokoClient } from '../../../utils/sokoClient';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Category ID is required' });
  }

  const token = getCookie(event, 'flemela_admin_session') || event.context.authToken;
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized admin session' });
  }

  const body = await readBody(event);

  try {
    return await sokoClient(`/products/categories/${id}`, {
      method: 'PATCH',
      body,
      token,
    });
  } catch (err: any) {
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.data?.message || err.statusMessage || 'Failed to update category shelf setting',
    });
  }
});