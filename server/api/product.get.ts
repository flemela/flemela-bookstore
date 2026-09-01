// =============================================================================
// server/api/product.get.ts
// Synchronized product endpoint proxying to configured store slug.
// =============================================================================

import { sokoClient } from '../utils/sokoClient';
import type { Book } from '~/types';

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const storeSlug = config.public.storeSlug;
  const query = getQuery(event);

  try {
    const products = await sokoClient<Book[]>(`/public/stores/${storeSlug}/products`, {
      query: {
        category_id: query.category_id as string,
        q: query.q as string,
      },
    });

    return products || [];
  } catch {
    return [];
  }
});