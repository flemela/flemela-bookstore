// =============================================================================
// server/api/admin/books/bulk-delete.post.ts
// Proxy endpoint for smart bulk deletion.
// =============================================================================

import { sokoClient } from '../../../utils/sokoClient';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  try {
    return await sokoClient<{
      deleted: boolean;
      count: number;
      softDeleted: number;
      hardDeleted: number;
    }>('/products/bulk-delete', {
      method: 'POST',
      body,
    });
  } catch (err: any) {
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.statusMessage || 'Failed to execute bulk deletion',
    });
  }
});