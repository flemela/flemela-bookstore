// =============================================================================
// server/api/category-shelves/index.get.ts
// Public storefront proxy fetching active category showcase shelves with items
// =============================================================================

import { sokoClient } from '../../utils/sokoClient';

export default defineEventHandler(async () => {
  const config = useRuntimeConfig();
  const storeSlug = config.public.storeSlug;

  try {
    const res = await sokoClient<any[]>(`/public/stores/${storeSlug}/category-shelves`);
    return res || [];
  } catch {
    return [];
  }
});