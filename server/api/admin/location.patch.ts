// =============================================================================
// server/api/admin/location.patch.ts
// Proxy endpoint saving bookstore hub location and tiered delivery fee rules.
// =============================================================================

import { z } from 'zod';
import { sokoClient } from '../../utils/sokoClient';

const LocationSchema = z.object({
  name: z.string().min(1, 'Hub name is required').max(200),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  address_text: z.string().max(500).nullable().optional(),
  base_distance_km: z.number().nonnegative().default(2),
  base_delivery_fee: z.number().nonnegative().default(100),
  fee_per_km: z.number().nonnegative().default(25),
  max_delivery_radius_km: z.number().positive().max(100).default(15),
});

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const parsed = LocationSchema.safeParse(body);

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message || 'Invalid location payload',
    });
  }

  try {
    return await sokoClient('/store/location', {
      method: 'PATCH',
      body: parsed.data,
    });
  } catch (err: any) {
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.statusMessage || 'Failed to update store location',
    });
  }
});