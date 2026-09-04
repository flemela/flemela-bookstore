// =============================================================================
// server/api/admin/banners/[id].ts
// Admin proxy for updating and deleting individual promotional banners.
// =============================================================================

import { sokoClient } from '../../../utils/sokoClient';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Banner ID is required' });
  }

  const token = getCookie(event, 'flemela_admin_session') || event.context.authToken;
  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized admin session',
    });
  }

  const method = getMethod(event);

  // 1. PATCH: Update Banner Properties
  if (method === 'PATCH') {
    const body = await readBody(event);
    try {
      return await sokoClient(`/banners/${id}`, {
        method: 'PATCH',
        body,
        token,
      });
    } catch (err: any) {
      throw createError({
        statusCode: err.statusCode || 500,
        statusMessage:
          err.data?.error?.message ||
          err.data?.message ||
          err.statusMessage ||
          'Failed to update banner',
      });
    }
  }

  // 2. DELETE: Remove Banner
  if (method === 'DELETE') {
    try {
      return await sokoClient(`/banners/${id}`, {
        method: 'DELETE',
        token,
      });
    } catch (err: any) {
      throw createError({
        statusCode: err.statusCode || 500,
        statusMessage: err.statusMessage || 'Failed to delete banner',
      });
    }
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' });
});