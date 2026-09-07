// =============================================================================
// flemela/server/api/admin/orders/[id]/payment-status.patch.ts
// Proxy endpoint allowing store admin to approve payment and release downloads.
// =============================================================================

import { sokoClient } from '../../../../utils/sokoClient';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const body = await readBody(event);
  const token = getCookie(event, 'flemela_admin_session') || event.context.authToken;

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Order ID is required' });
  }

  try {
    return await sokoClient(`/orders/${id}/payment-status`, {
      method: 'PATCH',
      body,
      token,
    });
  } catch (err: any) {
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.statusMessage || 'Failed to update order payment status',
    });
  }
});