// =============================================================================
// flemela/server/api/admin/orders/index.get.ts
// Proxies administrative order queries with multi-filter parameters.
// =============================================================================

import { sokoClient } from '../../../utils/sokoClient';

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'flemela_admin_session') || event.context.authToken;
  const query = getQuery(event);

  try {
    const result = await sokoClient<{ orders: any[]; total: number }>('/orders', {
      token,
      query: {
        page: query.page || 1,
        limit: query.limit || 30,
        q: query.q || undefined,
        status: query.status || undefined,
        payment_status: query.payment_status || undefined,
        payment_method: query.payment_method || undefined,
      },
    });

    return {
      data: result.orders || result || [],
      meta: {
        totalItems: result.total || 0,
        page: Number(query.page || 1),
        totalPages: Math.ceil((result.total || 0) / Number(query.limit || 30)),
      },
    };
  } catch (err: any) {
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.statusMessage || 'Failed to fetch administrative orders',
    });
  }
});