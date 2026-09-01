// =============================================================================
// server/api/stores/current.get.ts
// Proxy endpoint retrieving public metadata for the active bookstore storefront.
// =============================================================================

import { sokoClient } from '../../utils/sokoClient';

export interface PublicStoreMetadata {
  name: string;
  description: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  location: string | null;
  delivery_info: string | null;
  hero_layout: string;
  hero_headline: string | null;
  hero_subheadline: string | null;
  hero_cta_label: string | null;
  mpesa_verified: boolean;
}

export default defineEventHandler(async () => {
  const config = useRuntimeConfig();
  const storeSlug = config.public.storeSlug;

  try {
    return await sokoClient<PublicStoreMetadata>(`/public/stores/${storeSlug}`);
  } catch (err: any) {
    return {
      name: 'Flemela Bookstore',
      description: 'Books that inspire. Knowledge that transforms.',
      logo_url: '/images/logo.png',
      cover_image_url: '/images/hero-cover.jpg',
      contact_phone: '0700000000',
      contact_email: 'support@flemela.co.ke',
      location: 'Sarit Centre, Westlands, Nairobi',
      delivery_info: 'Free delivery across Nairobi on orders above KSh 2,500',
      hero_layout: 'editorial',
      hero_headline: 'Books that change the way you think.',
      hero_subheadline: 'Discover handpicked literature, timeless philosophy, and rigorous business knowledge.',
      hero_cta_label: 'Explore Catalog',
      mpesa_verified: true,
    };
  }
});