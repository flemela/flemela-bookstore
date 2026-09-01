// =============================================================================
// server/api/admin/location.get.ts
// Proxy endpoint retrieving bookstore hub location & delivery fee configuration.
// =============================================================================

import { sokoClient } from '../../utils/sokoClient';

export default defineEventHandler(async () => {
  try {
    return await sokoClient('/store/location');
  } catch (err: any) {
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.statusMessage || 'Failed to fetch hub location details',
    });
  }
});