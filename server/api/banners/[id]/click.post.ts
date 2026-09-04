// =============================================================================
// server/api/banners/[id]/click.post.ts
// Public storefront proxy recording click telemetry for promotional hero banners.
// =============================================================================

import { sokoClient } from '../../../utils/sokoClient';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Banner ID is required' });
  }

  try {
    return await sokoClient<{ tracked: boolean }>(`/banners/${id}/click`, {
      method: 'POST',
    });
  } catch {
    // Non-blocking telemetry failure: respond gracefully so customer navigation isn't interrupted
    return { tracked: false };
  }
});