// =============================================================================
// server/api/products/index.get.ts
// Nuxt Nitro Storefront Products Endpoint: First-Added-First Default Sorting
// =============================================================================

import { sokoClient } from '../../utils/sokoClient';
import type { Book } from '~/types';

export interface PaginatedProductsResponse {
  products: Book[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const storeSlug = config.public.storeSlug;
  const query = getQuery(event);

  try {
    const res = await sokoClient<any>(`/public/stores/${storeSlug}/products`, {
      query: {
        page: query.page || 1,
        limit: query.limit || 50,
        category: (query.category as string) || undefined,
        category_id: (query.category_id as string) || undefined,
        q: (query.q as string) || undefined,
        sort: (query.sort as string) || 'first_added', // Default strictly to FIFO (first-added books lead)
      },
    });

    if (Array.isArray(res)) {
      return {
        products: res,
        total: res.length,
        page: 1,
        limit: res.length,
        totalPages: 1,
      };
    }

    return {
      products: res?.products || [],
      total: Number(res?.total ?? 0),
      page: Number(res?.page || query.page || 1),
      limit: Number(res?.limit || query.limit || 50),
      totalPages: Number(res?.totalPages || 1),
    };
  } catch {
    return {
      products: [],
      total: 0,
      page: 1,
      limit: 50,
      totalPages: 1,
    };
  }
});