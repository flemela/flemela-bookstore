// =============================================================================
// server/api/admin/hero-notes.ts
// Nitro proxy for retrieving and updating store hero rich-text editorial notes.
// =============================================================================

import { sokoClient } from '../../utils/sokoClient';

export interface StoreHeroNotesDto {
  is_active: boolean;
  title: string;
  content_html: string;
  bg_color?: string;
  text_color?: string;
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

  // 1. GET: Fetch current hero notes configuration
  if (method === 'GET') {
    try {
      const res = await sokoClient<StoreHeroNotesDto>('/store/hero-notes', {
        method: 'GET',
        token,
      });
      return res || {
        is_active: false,
        title: 'Reader Announcements',
        content_html: '',
        bg_color: '#FAF7F0',
        text_color: '#141E1A',
      };
    } catch (err: any) {
      throw createError({
        statusCode: err.statusCode || 500,
        statusMessage: err.data?.message || err.statusMessage || 'Failed to load hero notes',
      });
    }
  }

  // 2. PUT: Save updated hero notes configuration
  if (method === 'PUT') {
    const body = await readBody(event);
    if (!body) {
      throw createError({ statusCode: 400, statusMessage: 'Payload is required' });
    }

    try {
      const updated = await sokoClient<StoreHeroNotesDto>('/store/hero-notes', {
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
          'Failed to save hero notes',
      });
    }
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' });
});