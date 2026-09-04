// =============================================================================
// server/api/admin/books/index.post.ts
// Creates a new book product and attaches its multi-format offerings in sequence.
// =============================================================================

import { z } from 'zod';
import { sokoClient } from '../../../utils/sokoClient';
import type { Book } from '~/types';

const CreateBookSchema = z.object({
  name: z.string().min(1, 'Title is required').max(200),
  author: z.string().max(200).optional(),
  category_id: z
    .string()
    .uuid('Invalid category ID')
    .nullable()
    .optional()
    .or(z.literal(''))
    .transform((v) => (v === '' ? null : v)),
  description: z.string().max(3000).nullable().optional(),
  price: z.number().nonnegative(),
  compare_at_price: z.number().nonnegative().nullable().optional(),
  badge: z.enum(['BESTSELLER', 'FLASH_SALE', 'NO1_PICK', 'DEAL_OF_WEEK', 'LIMITED_TIME']).nullable().optional(),
  sale_ends_at: z.string().datetime().nullable().optional(),
  cover_image_url: z
    .string()
    .url()
    .nullable()
    .optional()
    .or(z.literal(''))
    .transform((v) => (v === '' ? null : v)),
  cover_image_public_id: z
    .string()
    .nullable()
    .optional()
    .or(z.literal(''))
    .transform((v) => (v === '' ? null : v)),
  status: z.enum(['draft', 'published', 'archived']).default('published'),
  formats: z
    .array(
      z.object({
        format: z.enum(['pdf', 'epub', 'hardcopy']),
        price: z.number().nonnegative(),
        compare_at_price: z.number().nonnegative().nullable().optional(),
        file_url: z.string().nullable().optional(),
        file_public_id: z.string().nullable().optional(),
        file_size_bytes: z.number().int().nonnegative().nullable().optional(),
        stock: z.number().int().nonnegative().nullable().optional(),
      })
    )
    .min(1, 'At least one format is required'),
});

export default defineEventHandler(async (event) => {
  const rawBody = await readBody(event);
  const parsed = CreateBookSchema.safeParse(rawBody);

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message || 'Invalid book payload',
    });
  }

  const { formats, cover_image_url, cover_image_public_id, ...bookData } = parsed.data;

  // 1. Create canonical product
  const createdProducts = await sokoClient<Book[]>('/products/bulk', {
    method: 'POST',
    body: {
      products: [
        {
          name: bookData.name,
          category_id: bookData.category_id || null,
          price: bookData.price,
          compare_at_price: bookData.compare_at_price || null,
          badge: bookData.badge || null,
          sale_ends_at: bookData.sale_ends_at || null,
          stock: formats.find((f) => f.format === 'hardcopy')?.stock || 0,
          description: bookData.description,
          publish: bookData.status === 'published',
          images: cover_image_url
            ? [{ image_url: cover_image_url, image_public_id: cover_image_public_id || 'cover_img' }]
            : [],
        },
      ],
    },
  });

  const product = createdProducts[0];
  if (!product) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to create book product' });
  }

  // 2. Attach formats with format-specific compare-at prices
  for (const fmt of formats) {
    await sokoClient(`/products/${product.id}/formats`, {
      method: 'POST',
      body: fmt,
    });
  }

  return { success: true, productId: product.id };
});