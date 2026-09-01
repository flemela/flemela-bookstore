// =============================================================================
// flemela/server/api/admin/books/upload-url.post.ts
// =============================================================================

import { z } from 'zod';
import { sokoClient } from '../../../utils/sokoClient';

const Schema = z.object({
  filename: z.string().min(1),
  format: z.enum(['pdf', 'epub']).default('pdf'),
  contentType: z.string().optional(),
});

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const parsed = Schema.safeParse(body);

  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid upload request payload' });
  }

  try {
    return await sokoClient<{ uploadUrl: string; key: string }>(
      '/books/upload-url',
      {
        method: 'POST',
        body: parsed.data,
      }
    );
  } catch (err: any) {
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.statusMessage || 'Failed to generate R2 upload URL',
    });
  }
});