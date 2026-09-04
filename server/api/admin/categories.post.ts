// =============================================================================
// server/api/admin/categories.post.ts
// Proxy endpoint allowing store admins to dynamically add new book categories.
// =============================================================================

import { z } from 'zod';
import { sokoClient } from '../../utils/sokoClient';

const CreateCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100).trim(),
  description: z
    .string()
    .max(1000)
    .nullable()
    .optional()
    .or(z.literal(''))
    .transform((v) => (v === '' ? null : v)),
  is_featured: z.boolean().optional().default(false),
  sort_order: z.number().int().optional().default(0),
});

export interface CategoryResult {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_featured: boolean;
  sort_order: number;
  created_at: string;
}

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'flemela_admin_session') || event.context.authToken;

  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized admin session',
    });
  }

  const rawBody = await readBody(event);
  const parsed = CreateCategorySchema.safeParse(rawBody);

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message || 'Invalid category payload',
    });
  }

  try {
    const createdCategory = await sokoClient<CategoryResult>('/products/categories', {
      method: 'POST',
      body: parsed.data,
      token,
    });

    return createdCategory;
  } catch (err: any) {
    throw createError({
      statusCode: err.statusCode || err.response?.status || 500,
      statusMessage:
        err.data?.error?.message ||
        err.data?.message ||
        err.statusMessage ||
        'Failed to create category',
    });
  }
});