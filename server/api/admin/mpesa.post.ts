// =============================================================================
// server/api/admin/mpesa.post.ts
// Proxies saving/updating encrypted M-Pesa Daraja credentials to backend.
// =============================================================================

import { z } from 'zod';
import { sokoClient } from '../../utils/sokoClient';

const SaveMpesaSchema = z.object({
  tillType: z.enum(['till', 'paybill']),
  shortcode: z.string().min(3).max(15),
  storeNumber: z.string().nullable().optional(),
  consumerKey: z.string().min(8),
  consumerSecret: z.string().min(8),
  passkey: z.string().min(10),
  environment: z.enum(['sandbox', 'production']).default('sandbox'),
});

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const parsed = SaveMpesaSchema.safeParse(body);

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message || 'Invalid credentials input',
    });
  }

  try {
    return await sokoClient('/mpesa-credentials', {
      method: 'POST',
      body: parsed.data,
    });
  } catch (err: any) {
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.statusMessage || 'Failed to save M-Pesa credentials',
    });
  }
});