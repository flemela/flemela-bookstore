// =============================================================================
// server/api/admin/upload-signature.post.ts
// Generates authenticated Cloudinary upload signatures for direct browser uploads.
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

  try {
    const signature = await sokoClient<SignatureResponse>(
      '/products/upload-signature?target=products',
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