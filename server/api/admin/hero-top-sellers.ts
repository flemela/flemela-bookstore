// =============================================================================
// server/api/admin/hero-top-sellers.ts
// Nitro proxy for retrieving and updating Hero Top Sellers flank visibility.
// =============================================================================

import { sokoClient } from '../../utils/sokoClient';

export interface StoreHeroTopSellersDto {
  is_active: boolean;
  title?: string;
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

  // 1. GET: Fetch current Hero Top Sellers configuration
  if (method === 'GET') {
    try {
      const res = await sokoClient<StoreHeroTopSellersDto>('/store/hero-top-sellers', {
        method: 'GET',
        token,
      });
      return (
        res || {
          is_active: true,
          title: 'Top Selling Books',
        }
      );
    } catch {
      return {
        is_active: true,
        title: 'Top Selling Books',
      };
    }
  }

  // 2. PUT: Save updated Hero Top Sellers configuration
  if (method === 'PUT') {
    const body = await readBody(event);
    if (!body || typeof body.is_active !== 'boolean') {
      throw createError({ statusCode: 400, statusMessage: 'Payload requires is_active boolean' });
    }

    try {
      const updated = await sokoClient<StoreHeroTopSellersDto>('/store/hero-top-sellers', {
        method: 'PUT',
        body: {
          is_active: body.is_active,
          title: body.title?.trim() || 'Top Selling Books',
        },
        token,
      });
      return updated;
    } catch (err: any) {
      throw createError({
        statusCode: err.statusCode || 500,
        statusMessage: err.data?.message || err.statusMessage || 'Failed to save hero top sellers configuration',
      });
    }
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' });
});