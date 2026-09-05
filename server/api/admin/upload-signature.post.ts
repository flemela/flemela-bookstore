// =============================================================================
// server/api/admin/upload-signature.post.ts
// Generates authenticated Cloudinary upload signatures forwarding target folder.
// =============================================================================

import { sokoClient } from '../../utils/sokoClient';

export interface SignatureResponse {
  signature: string;
  timestamp: number;
  folder: string;
  apiKey: string;
  cloudName: string;
}

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'flemela_admin_session') || event.context.authToken;
  const query = getQuery(event);
  const target = (query.target as string) || 'store';

  try {
    const signature = await sokoClient<SignatureResponse>(
      `/products/upload-signature?target=${encodeURIComponent(target)}`,
      { 
        method: 'POST',
        token,
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