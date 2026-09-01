// =============================================================================
// server/api/admin/books/[id].get.ts
// Proxy endpoint fetching single book details and all attached formats.
// =============================================================================

import { sokoClient } from '../../../utils/sokoClient';
import type { Book, ProductFormat } from '~/types';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Product ID is required' });
  }

  try {
    const product = await sokoClient<Book>(`/products/${id}`);
    const formats = await sokoClient<ProductFormat[]>(`/products/${id}/formats`);

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