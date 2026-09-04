// =============================================================================
// server/api/admin/banners/index.ts
// Admin proxy handling banner listing, creation, and batch reordering.
// =============================================================================

import { sokoClient } from '../../../utils/sokoClient';

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'flemela_admin_session') || event.context.authToken;

  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized admin session',
    });
  }

  const method = getMethod(event);

  // 1. GET: List all tenant banners (including inactive and scheduled ones)
  if (method === 'GET') {
    try {
      return await sokoClient('/banners', {
        method: 'GET',
        token,
      });
    } catch (err: any) {
      throw createError({
        statusCode: err.statusCode || 500,
        statusMessage: err.statusMessage || 'Failed to fetch banner roster',
      });
    }
  }

  // 2. POST: Create Banner OR Reorder Banners
  if (method === 'POST') {
    const body = await readBody(event);
    if (!body) {
      throw createError({ statusCode: 400, statusMessage: 'Payload is required' });
    }

    try {
      // Reordering branch
      if (Array.isArray(body.bannerIds)) {
        return await sokoClient('/banners/reorder', {
          method: 'POST',
          body: { bannerIds: body.bannerIds },
          token,
        });
      }

      // Creation branch
      return await sokoClient('/banners', {
        method: 'POST',
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
          'Failed to process banner request',
      });
    }
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' });
});