// =============================================================================
// server/api/admin/books/[id].get.ts
// Single Book Getter — Merges Base Product Data with Formats
// =============================================================================

import { defineEventHandler, getCookie, getHeader, createError } from 'h3';
import { ofetch } from 'ofetch';

function resolveApiBaseUrl(raw?: string): string {
  const base = (raw || process.env.SOKO_API_BASE_URL || 'http://localhost:3000/api/v1')
    .trim()
    .replace(/\/+$/, '');
  return base.endsWith('/api/v1') ? base : `${base}/api/v1`;
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const id = event.context.params?.id;

  // Crucial guard: If Nitro routed "upload-url" here, reject immediately
  if (!id || id === 'upload-url') {
    throw createError({
      statusCode: 404,
      statusMessage: 'Not Found',
      data: { message: 'Invalid book identifier.' },
    });
  }

  let token = getCookie(event, 'flemela_admin_session');
  if (!token) {
    const authHeader = getHeader(event, 'authorization');
    if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
      token = authHeader.slice(7).trim();
    }
  }

  if (!token) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }

  const baseApiUrl = resolveApiBaseUrl(config.sokoApiBaseUrl);

  try {
    // 1. Fetch base product record
    const res = await ofetch<{ success: boolean; data?: any }>(
      `${baseApiUrl}/products/${id}`,
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const book = res.data || res;

    // 2. Fetch formats in parallel/fallback so format IDs, files, and prices are available
    if (!book.formats || book.formats.length === 0) {
      try {
        const formatsRes = await ofetch<{ success: boolean; data?: any }>(
          `${baseApiUrl}/products/${id}/formats`,
          {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        book.formats = Array.isArray(formatsRes) ? formatsRes : formatsRes?.data || [];
      } catch {
        book.formats = [];
      }
    }

    return book;
  } catch (err: any) {
    throw createError({
      statusCode: err.statusCode || 404,
      statusMessage: 'Not Found',
      data: { message: 'Book not found in store catalog.' },
    });
  }
});