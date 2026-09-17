// =============================================================================
// server/api/products/search.get.ts
// Full-Catalog Typo-Tolerant Search Proxy (Direct Database-Backed Relevance)
// =============================================================================

import { sokoClient } from '../../utils/sokoClient';
import type { Book } from '~/types';

export default defineEventHandler(async (event): Promise<Book[]> => {
  const config = useRuntimeConfig();
  const storeSlug = config.public.storeSlug;
  const query = getQuery(event);
  const q = typeof query.q === 'string' ? query.q.trim() : '';

  if (!q) {
    return [];
  }

  try {
    const res = await sokoClient<any>(`/public/stores/${storeSlug}/products`, {
      query: {
        q,
        limit: 8,
      },
    });

    const books: Book[] = Array.isArray(res) ? res : res?.products || [];
    return books;
  } catch {
    return [];
  }
});