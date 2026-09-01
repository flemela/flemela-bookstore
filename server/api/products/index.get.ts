// =============================================================================
// server/api/products/index.get.ts
// =============================================================================

import { sokoClient } from '../../utils/sokoClient';
import type { Book } from '~/types';

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const storeSlug = config.public.storeSlug;
  const query = getQuery(event);

  try {
    const products = await sokoClient<Book[]>(`/public/stores/${storeSlug}/products`, {
      query: {
        category_id: (query.category_id as string) || undefined,
        q: (query.q as string) || undefined,
      },
    });

    return products || [];
  } catch {
    return [];
  }
});