// =============================================================================
// server/api/admin/mpesa/verify.post.ts
// Proxies initiation of KES 1 verification STK push to backend.
// =============================================================================

import { z } from 'zod';
import { sokoClient } from '../../../utils/sokoClient';

const VerifySchema = z.object({
  phone: z.string().min(9, 'Phone number is required'),
});

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const parsed = VerifySchema.safeParse(body);

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message || 'Valid phone number is required',
    });
  }

  try {
    return await sokoClient<{ checkoutRequestId: string; customerMessage: string }>(
      '/mpesa-credentials/verify',
      {
        method: 'POST',
        body: parsed.data,
      }
    );
  } catch (err: any) {
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.statusMessage || 'Failed to initiate M-Pesa verification test',
    });
  }
});