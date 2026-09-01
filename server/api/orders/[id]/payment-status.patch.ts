// =============================================================================
// flemela/server/api/admin/orders/[id]/payment-status.patch.ts
// Proxy endpoint allowing store admin to approve payment and release downloads.
// =============================================================================

import { sokoClient } from '../../../utils/sokoClient';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const body = await readBody(event);

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Order ID is required' });
  }

  try {
    return await sokoClient(`/orders/${id}/payment-status`, {
      method: 'PATCH',
      body,
    });
  } catch (err: any) {
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.statusMessage || 'Failed to update order payment status',
    });
  }
});