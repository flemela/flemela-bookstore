// flemela/server/api/orders/[id]/retry-payment.post.ts
import { sokoClient } from '../../../utils/sokoClient';

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const storeSlug = config.public.storeSlug;
  const orderId = getRouterParam(event, 'id');
  const body = await readBody(event);

  if (!orderId) {
    throw createError({ statusCode: 400, statusMessage: 'Order ID is required' });
  }

  try {
    return await sokoClient(`/public/stores/${storeSlug}/orders/${orderId}/retry-payment`, {
      method: 'POST',
      body,
    });
  } catch (err: any) {
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.statusMessage || 'Failed to update payment method',
    });
  }
});