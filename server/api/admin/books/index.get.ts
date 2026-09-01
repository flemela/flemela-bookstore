// =============================================================================
// server/api/admin/books/index.get.ts
// Proxies books catalog query with authenticated session token.
// =============================================================================

import { sokoClient } from '../../../utils/sokoClient';
import type { Book } from '~/types';

export default defineEventHandler(async (event) => {
  const token =
    event.context.authToken ||
    getCookie(event, 'flemela_admin_session') ||
    undefined;

  const query = getQuery(event);

  try {
    const response = await sokoClient<Book[]>('/products', {
      token,
      query: {
        page: query.page || 1,
        limit: query.limit || 50,
        q: query.q || undefined,
        category_id: query.category_id || undefined,
      },
    });

    return response || [];
  } catch (err: any) {
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.statusMessage || 'Failed to load bookstore inventory',
    });
  }
});