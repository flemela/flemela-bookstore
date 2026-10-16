// =============================================================================
// server/api/admin/curated-sections/index.ts
// Proxy: List and create curated sections via Soko API
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

  if (method === 'GET') {
    try {
      const sections = await sokoClient('/store/curated-sections', {
        method: 'GET',
        token,
      });
      return sections || [];
    } catch (err: any) {
      throw createError({
        statusCode: err.statusCode || 500,
        statusMessage: err.data?.message || err.statusMessage || 'Failed to fetch curated sections',
      });
    }
  }

  if (method === 'POST') {
    const body = await readBody(event);
    if (!body || !body.title || !body.badge_trigger) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Title and badge trigger are required',
      });
    }

    try {
      const created = await sokoClient('/store/curated-sections', {
        method: 'POST',
        body,
        token,
      });
      return created;
    } catch (err: any) {
      throw createError({
        statusCode: err.statusCode || 500,
        statusMessage: err.data?.message || err.statusMessage || 'Failed to create curated section',
      });
    }
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' });
});