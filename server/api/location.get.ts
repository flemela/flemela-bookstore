// =============================================================================
// server/api/location.get.ts
// Public proxy: storefront checkout reads the live hub + delivery fee config.
// Exposes ONLY non-sensitive operational fields.
// =============================================================================

import { sokoClient } from '../../server/utils/sokoClient';

export interface PublicHubLocation {
  name: string;
  lat: number;
  lng: number;
  address_text: string | null;
  base_distance_km: number;
  base_delivery_fee: number;
  fee_per_km: number;
  max_delivery_radius_km: number;
}

const FALLBACK: PublicHubLocation = {
  name: 'The Sunrise Bookstore Main Hub (Diamond Mall)',
  lat: -1.2612,
  lng: 36.8167,
  address_text: 'Diamond Mall / Diamond Plaza, 4th Parklands Ave, Nairobi',
  base_distance_km: 2,
  base_delivery_fee: 100,
  fee_per_km: 25,
  max_delivery_radius_km: 15,
};

export default defineEventHandler(async (event) => {
  const storeSlug = useRuntimeConfig(event).public.storeSlug;

  try {
    const location = await sokoClient<PublicHubLocation | null>(`/public/stores/${storeSlug}/location`);
    if (location && typeof location.lat === 'number' && typeof location.lng === 'number') {
      return location;
    }
    return FALLBACK;
  } catch {
    return FALLBACK;
  }
});
