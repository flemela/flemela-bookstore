// =============================================================================
// flemela/server/api/admin/orders/index.get.ts
// Proxies administrative order queries with multi-filter parameters & pagination.
// =============================================================================

import { sokoClient } from '../../../utils/sokoClient';

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'flemela_admin_session') || event.context.authToken;
  const query = getQuery(event);

  try {
    const res = await sokoClient<any>('/orders', {
      token,
      query: {
        page: query.page || 1,
        limit: query.limit || 20,
        q: query.q || undefined,
        status: query.status || undefined,
        payment_status: query.payment_status || undefined,
        payment_method: query.payment_method || undefined,
      },
    });

    const ordersList = Array.isArray(res) ? res : res?.orders || [];
    const totalCount = Array.isArray(res) ? res.length : Number(res?.total ?? 0);
    const limitNum = Number(query.limit || 20);

    return {
      data: ordersList,
      meta: {
        totalItems: totalCount,
        page: Number(query.page || 1),
        totalPages: Math.max(1, Math.ceil(totalCount / limitNum)),
      },
    };
  } catch (err: any) {
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.statusMessage || 'Failed to fetch administrative orders',
    });
  }
});