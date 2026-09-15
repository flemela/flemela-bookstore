// server/api/products/search.get.ts
// =============================================================================
// Global Catalog Search & Typo-Tolerant Matcher (Searches ALL Pages)
// =============================================================================

import { sokoClient } from '../../utils/sokoClient';
import { fuzzySearchBooks } from '../../../utils/fuzzy';
import type { Book } from '~/types';

export default defineEventHandler(async (event) => {
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
        limit: 250,
      },
    });

    const allBooks: Book[] = Array.isArray(res) ? res : res?.products || [];
    const matches = fuzzySearchBooks(allBooks, q, 0.35, 6);

    return matches.map((m) => m.book);
  } catch {
    return [];
  }
});