// =============================================================================
// server/api/admin/books/import/[id].get.ts
// Polls progress and row error telemetry for active import jobs.
// =============================================================================

import { sokoClient } from '../../../../utils/sokoClient';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Job ID is required' });
  }

  try {
    return await sokoClient<any>(`/books/import/${id}`);
  } catch (err: any) {
    throw createError({
      statusCode: err.statusCode || 404,
      statusMessage: err.statusMessage || 'Import job not found',
    });
  }
});