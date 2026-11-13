// =============================================================================
// server/api/admin/location.get.ts
// Proxy endpoint retrieving bookstore hub location & delivery fee configuration.
// =============================================================================

import { sokoClient } from '../../utils/sokoClient';

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'flemela_admin_session') || event.context.authToken;

  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized admin session',
    });
  }

  try {
    return await sokoClient('/store/location', { token });
  } catch (err: any) {
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.data?.message || err.statusMessage || 'Failed to fetch hub location details',
    });
  }
});
