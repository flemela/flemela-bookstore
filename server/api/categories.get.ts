// =============================================================================
// server/api/categories.get.ts
// Public proxy for the storefront "Shop by Category" rail (categories include image_url).
// =============================================================================

import { sokoClient } from '../utils/sokoClient';

export interface PublicCategoryTile {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  is_featured: boolean;
  sort_order: number;
}

export default defineEventHandler(async (event) => {
  const storeSlug = useRuntimeConfig(event).public.storeSlug;

  try {
    const res = await sokoClient<{ categories?: PublicCategoryTile[] } | PublicCategoryTile[]>(
      `/public/stores/${storeSlug}/categories`
    );
    if (Array.isArray(res)) return res;
    return Array.isArray(res?.categories) ? res.categories : [];
  } catch {
    return [];
  }
});
