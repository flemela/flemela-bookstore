// =============================================================================
// server/api/admin/hero-left-banner.ts
// Nitro proxy for retrieving and updating store hero left flank promotional banner.
// =============================================================================

import { sokoClient } from '../../utils/sokoClient';

export interface StoreHeroLeftBannerDto {
  is_active: boolean;
  title: string;
  image_url: string;
  link: string | null;
}

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'flemela_admin_session') || event.context.authToken;

  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized admin session',
    });
  }

  const method = getMethod(event);

  // 1. GET: Fetch current left banner configuration
  if (method === 'GET') {
    try {
      const res = await sokoClient<StoreHeroLeftBannerDto>('/store/hero-left-banner', {
        method: 'GET',
        token,
      });
      return (
        res || {
          is_active: false,
          title: 'Special Promotion',
          image_url: '',
          link: '#catalog-results',
        }
      );
    } catch (err: any) {
      throw createError({
        statusCode: err.statusCode || 500,
        statusMessage: err.data?.message || err.statusMessage || 'Failed to load hero left banner',
      });
    }
  }

  // 2. PUT: Save updated left banner configuration
  if (method === 'PUT') {
    const body = await readBody(event);
    if (!body) {
      throw createError({ statusCode: 400, statusMessage: 'Payload is required' });
    }

    try {
      const updated = await sokoClient<StoreHeroLeftBannerDto>('/store/hero-left-banner', {
        method: 'PUT',
        body,
        token,
      });
      return updated;
    } catch (err: any) {
      throw createError({
        statusCode: err.statusCode || 500,
        statusMessage:
          err.data?.error?.message ||
          err.data?.message ||
          err.statusMessage ||
          'Failed to save hero left banner',
      });
    }
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' });
});