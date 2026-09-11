// =============================================================================
// server/api/admin/books/upload-url.post.ts
// Proxies presigned R2 upload URL generation with authenticated admin bearer token
// =============================================================================

import { z } from 'zod';
import { sokoClient } from '../../../utils/sokoClient';

const Schema = z.object({
  filename: z.string().min(1),
  format: z.enum(['pdf', 'epub']).default('pdf'),
  contentType: z.string().optional(),
});

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'flemela_admin_session') || event.context.authToken;

  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized admin session' });
  }

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
        token,
        event,
      }
    );
  } catch (err: any) {
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.statusMessage || 'Failed to generate R2 upload URL',
    });
  }
});