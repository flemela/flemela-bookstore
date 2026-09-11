// =============================================================================
// server/api/admin/books/[id].get.ts
// Proxy endpoint fetching single book details and all attached formats.
// =============================================================================

import { sokoClient } from '../../../utils/sokoClient';
import type { Book, ProductFormat } from '~/types';

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'flemela_admin_session') || event.context.authToken;

  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized admin session' });
  }

  const id = getRouterParam(event, 'id');

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Product ID is required' });
  }

  try {
    const product = await sokoClient<Book>(`/products/${id}`, { token, event });
    const formats = await sokoClient<ProductFormat[]>(`/products/${id}/formats`, { token, event });

    return {
      ...product,
      formats: formats || [],
    };
  } catch (err: any) {
    throw createError({
      statusCode: err.statusCode || 404,
      statusMessage: err.statusMessage || 'Book not found',
    });
  }
});