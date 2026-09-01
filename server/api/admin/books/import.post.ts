// =============================================================================
// server/api/admin/books/import.post.ts
// Proxies bulk spreadsheet ingestion jobs to Soko BullMQ queue.
// =============================================================================

import { sokoClient } from '../../../utils/sokoClient';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  if (!body) {
    throw createError({ statusCode: 400, statusMessage: 'Import payload is required' });
  }

  // If Google Sheet URL JSON payload
  if (body.sheetUrl) {
    return sokoClient<{ jobId: string; status: string }>('/books/import/google-sheet', {
      method: 'POST',
      body: { sheetUrl: body.sheetUrl },
    });
  }

  throw createError({ statusCode: 400, statusMessage: 'Unsupported import format' });
});