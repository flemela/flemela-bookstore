// =============================================================================
// server/api/admin/books/find-cover.get.ts
// Proxy endpoint to auto-discover high-res book covers with typo tolerance.
// =============================================================================

import { sokoClient } from '../../../utils/sokoClient';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const token = getCookie(event, 'flemela_admin_session') || event.context.authToken;

  if (!query.title) {
    throw createError({ statusCode: 400, statusMessage: 'Book title is required' });
  }

  try {
    return await sokoClient<{ coverUrl: string | null; title: string; source: string | null }>(
      '/products/find-cover',
      {
        token,
        query: {
          title: String(query.title).trim(),
          author: query.author ? String(query.author).trim() : undefined,
        },
      }
    );
  } catch (err: any) {
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.statusMessage || 'Failed to auto-discover book cover',
    });
  }
});