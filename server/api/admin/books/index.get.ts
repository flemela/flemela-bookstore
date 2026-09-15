// =============================================================================
// server/api/admin/books/index.get.ts
// Proxies books catalog query with search, category filtering & pagination.
// =============================================================================

import { sokoClient } from '../../../utils/sokoClient';
import type { Book } from '~/types';

export interface PaginatedAdminBooks {
  products: Book[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default defineEventHandler(async (event) => {
  const token =
    event.context.authToken ||
    getCookie(event, 'flemela_admin_session') ||
    undefined;

  const query = getQuery(event);

  try {
    const res = await sokoClient<any>('/products', {
      token,
      query: {
        page: query.page || 1,
        limit: query.limit || 50,
        q: query.q || undefined,
        category_id: query.category_id || undefined,
      },
    });

    if (Array.isArray(res)) {
      return {
        products: res,
        total: res.length,
        page: Number(query.page || 1),
        limit: Number(query.limit || 50),
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
  } catch (err: any) {
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.statusMessage || 'Failed to load bookstore inventory',
    });
  }
});