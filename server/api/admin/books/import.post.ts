// =============================================================================
// server/api/admin/books/import.post.ts
// Proxies Google Sheet import jobs to Soko BullMQ queue.
// =============================================================================

import { sokoClient } from '../../../utils/sokoClient';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  if (!body || !body.sheetUrl) {
    throw createError({ statusCode: 400, statusMessage: 'Google Sheet URL is required' });
  }

  return sokoClient<{ jobId: string; status: string }>('/books/import/google-sheet', {
    method: 'POST',
    body: { sheetUrl: body.sheetUrl.trim() },
  });
});