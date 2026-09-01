// =============================================================================
// server/api/products/[slug].get.ts
// Single product endpoint proxying canonical product data + formats array.
// =============================================================================

import { sokoClient } from '../../utils/sokoClient';
import type { Book, ProductFormat } from '~/types';

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const storeSlug = config.public.storeSlug;
  const slug = getRouterParam(event, 'slug');

  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'Product slug is required' });
  }

  try {
    const book = await sokoClient<Book>(`/public/stores/${storeSlug}/products/${slug}`);

    if (!book.formats || book.formats.length === 0) {
      try {
        const formats = await sokoClient<ProductFormat[]>(`/products/${book.id}/formats`);
        book.formats = formats || [];
      } catch {
        book.formats = [];
      }
    }

    return book;
  } catch (err: any) {
    throw createError({
      statusCode: err.statusCode || 404,
      statusMessage: err.statusMessage || 'Book not found',
    });
  }
});