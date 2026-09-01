// =============================================================================
// server/api/checkout.post.ts
// Proxies order placement with centralized phone validation & dynamic store slug.
// =============================================================================

import { z } from 'zod';
import { sokoClient } from '../utils/sokoClient';
import { normalizeKenyanPhone, isValidKenyanPhone } from '../../utils/phone';

const CheckoutBodySchema = z.object({
  customerName: z.string().min(1, 'Full name is required').max(200),
  customerPhone: z
    .string()
    .min(9, 'Phone number is required')
    .refine((val) => isValidKenyanPhone(val), {
      message: 'Enter a valid Kenyan mobile number (e.g. 07XXXXXXXX or 01XXXXXXXX)',
    }),
  customerEmail: z
    .string()
    .email('Invalid email address')
    .nullable()
    .optional()
    .or(z.literal(''))
    .transform((v) => (v === '' ? null : v)),
  deliveryType: z.enum(['delivery', 'pickup']).default('delivery'),
  deliveryLocation: z.string().min(1, 'Delivery location or address is required'),
  paymentMethod: z.enum(['mpesa', 'mpesa_cash']).default('mpesa'),
  notes: z.string().max(1000).nullable().optional(),
  customerLat: z.number().nullable().optional(),
  customerLng: z.number().nullable().optional(),
  items: z
    .array(
      z.object({
        product_id: z.string().uuid('Invalid product ID'),
        format_id: z.string().uuid('Invalid format ID').nullable().optional(),
        quantity: z.number().int().positive('Quantity must be greater than zero'),
        delivery_method: z.enum(['digital', 'pickup', 'delivery']).default('digital'),
      })
    )
    .min(1, 'Cannot checkout with an empty cart'),
});

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const storeSlug = config.public.storeSlug;

  const rawBody = await readBody(event);
  const parsed = CheckoutBodySchema.safeParse(rawBody);

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message || 'Invalid checkout payload',
    });
  }

  const cleanPhone = normalizeKenyanPhone(parsed.data.customerPhone);

  const payload = {
    customerName: parsed.data.customerName.trim(),
    customerPhone: cleanPhone,
    customerEmail: parsed.data.customerEmail,
    deliveryLocation: parsed.data.deliveryLocation.trim(),
    deliveryType: parsed.data.deliveryType,
    paymentMethod: parsed.data.paymentMethod,
    notes: parsed.data.notes?.trim() || null,
    customerLat: parsed.data.customerLat ?? null,
    customerLng: parsed.data.customerLng ?? null,
    items: parsed.data.items.map((item) => ({
      product_id: item.product_id,
      format_id: item.format_id || null,
      quantity: item.quantity,
      delivery_method: item.delivery_method,
    })),
  };

  try {
    const response = await sokoClient<{ orderId: string; checkoutRequestId?: string }>(
      `/public/stores/${storeSlug}/orders`,
      {
        method: 'POST',
        body: payload,
      }
    );

    return {
      success: true,
      orderId: response.orderId,
      checkoutRequestId: response.checkoutRequestId || null,
      phone: cleanPhone,
    };
  } catch (err: any) {
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.statusMessage || 'Failed to place order',
      data: err.data,
    });
  }
});