// =============================================================================
// flemela/server/api/admin/upload-signature.post.ts
// Generates authenticated Cloudflare R2 upload URLs forwarding target folder.
// =============================================================================

import { sokoClient } from '../../utils/sokoClient';

export interface SignatureResponse {
  uploadUrl: string;
  publicUrl: string;
  key: string;
  timestamp: number;
  folder: string;
  cloudName: string;
  apiKey: string;
  signature: string;
}

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'flemela_admin_session') || event.context.authToken;
  const query = getQuery(event);
  const body = (await readBody(event).catch(() => ({}))) || {};

  const target = (body.target as string) || (query.target as string) || 'products';
  const filename = (body.filename as string) || (query.filename as string) || 'image.jpg';
  const contentType = (body.contentType as string) || (query.contentType as string) || 'image/jpeg';

  try {
    const signature = await sokoClient<SignatureResponse>(
      `/products/upload-signature`,
      {
        method: 'POST',
        token,
        body: {
          target,
          filename,
          contentType,
        },
      }
    );
    return signature;
  } catch (err: any) {
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.data?.error?.message || err.message || 'Failed to generate cloud upload signature',
    });
  }
});