// =============================================================================
// server/api/banners/index.get.ts
// Public storefront proxy endpoint retrieving active hero banners for the store.
// =============================================================================

import { sokoClient } from '../../utils/sokoClient';

export interface PublicBanner {
  id: string;
  org_id: string;
  title: string;
  subtitle: string | null;
  badge: string | null;
  image_url: string;
  mobile_image_url: string | null;
  cta_label: string;
  cta_link: string;
  bg_color: string;
  sort_order: number;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  click_count: number;
  created_at: string;
  updated_at: string;
}

export default defineEventHandler(async () => {
  const config = useRuntimeConfig();
  const storeSlug = config.public.storeSlug;

  try {
    const banners = await sokoClient<PublicBanner[]>(`/banners/public/${storeSlug}`);
    return banners || [];
  } catch {
    // Graceful fallback to empty array so HeroCarousel cleanly falls back to default hero
    return [];
  }
});