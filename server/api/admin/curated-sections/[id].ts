// =============================================================================
// server/api/admin/curated-sections/[id].ts
// Proxy endpoint: Update and delete individual curated sections
// =============================================================================

import { sokoClient } from '../../../utils/sokoClient';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Section ID is required' });
  }

  const token = getCookie(event, 'flemela_admin_session') || event.context.authToken;
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized admin session' });
  }

  const method = getMethod(event);

  if (method === 'PATCH') {
    const body = await readBody(event);
    try {
      return await sokoClient(`/store/curated-sections/${id}`, {
        method: 'PATCH',
        body,
        token,
      });
    } catch (err: any) {
      throw createError({
        statusCode: err.statusCode || 500,
        statusMessage: err.data?.message || err.statusMessage || 'Failed to update section',
      });
    }
  }

  if (method === 'DELETE') {
    try {
      return await sokoClient(`/store/curated-sections/${id}`, {
        method: 'DELETE',
        token,
      });
    } catch (err: any) {
      throw createError({
        statusCode: err.statusCode || 500,
        statusMessage: err.statusMessage || 'Failed to delete section',
      });
    }
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' });
});