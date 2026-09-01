// =============================================================================
// server/api/orders/[id]/status.get.ts
// Proxies order status query with customer phone verification factor.
// =============================================================================

import { sokoClient } from '../../../utils/sokoClient';

export interface OrderStatusResponse {
  orderId: string;
  customerName: string;
  total: number;
  status: 'pending' | 'confirmed' | 'assigned' | 'out_for_delivery' | 'delivered' | 'cancelled';
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'failed';
  mpesaReceiptNumber: string | null;
  deliveryType: 'delivery' | 'pickup';
  deliveryFee: number;
  deliveryConfirmationCode: string | null;
  deliveryLocation: string;
  items: Array<{
    productName: string;
    unitPrice: number;
    quantity: number;
    subtotal: number;
  }>;
  downloads: Array<{
    bookTitle: string;
    format: string;
    token: string;
    downloadUrl: string;
    expiresAt: string;
    maxDownloads: number;
    downloadCount: number;
  }>;
  isVerifiedCustomer: boolean;
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const storeSlug = config.public.storeSlug;

  const orderId = getRouterParam(event, 'id');
  const query = getQuery(event);
  const phone = typeof query.phone === 'string' ? query.phone : undefined;

  if (!orderId) {
    throw createError({ statusCode: 400, statusMessage: 'Order ID is required' });
  }

  try {
    const order = await sokoClient<any>(`/public/stores/${storeSlug}/orders/${orderId}`, {
      query: { phone },
    });

    return {
      orderId: order.orderId,
      customerName: order.customerName,
      total: order.total,
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      mpesaReceiptNumber: order.mpesaReceiptNumber || null,
      deliveryType: order.deliveryType,
      deliveryFee: order.deliveryFee || 0,
      deliveryConfirmationCode: order.deliveryConfirmationCode || null,
      deliveryLocation: order.deliveryLocation,
      items: order.items || [],
      downloads: order.downloads || [],
      isVerifiedCustomer: order.isVerifiedCustomer ?? false,
    };
  } catch (err: any) {
    throw createError({
      statusCode: err.statusCode || 404,
      statusMessage: err.statusMessage || 'Order not found',
    });
  }
});