// =============================================================================
// server/api/curated-sections/index.get.ts
// Public storefront proxy fetching active curated sections
// =============================================================================

import { sokoClient } from '../../utils/sokoClient';

export default defineEventHandler(async () => {
  const config = useRuntimeConfig();
  const storeSlug = config.public.storeSlug;

  try {
    const res = await sokoClient<any[]>(`/public/stores/${storeSlug}/curated-sections`);
    return res || [];
  } catch {
    return [];
  }
});