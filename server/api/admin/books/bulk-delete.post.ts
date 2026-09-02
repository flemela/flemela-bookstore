// =============================================================================
// flemela/server/api/admin/books/bulk-delete.post.ts
// Proxy endpoint allowing bulk deletion of selected books.
// =============================================================================

import { sokoClient } from '../../../utils/sokoClient';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  return sokoClient('/products/bulk-delete', {
    method: 'POST',
    body,
  });
});