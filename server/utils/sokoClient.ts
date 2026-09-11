// =============================================================================
// server/utils/sokoClient.ts
// Server-only typed HTTP proxy client communicating with the Soko backend.
// =============================================================================

import type { H3Event } from 'h3';
import type { ApiResponse } from '~/types';

export interface SokoClientOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: Record<string, any> | BodyInit | null;
  query?: Record<string, unknown>;
  headers?: Record<string, string>;
  token?: string;
  event?: H3Event;
}

export async function sokoClient<T>(path: string, options: SokoClientOptions = {}): Promise<T> {
  const config = useRuntimeConfig();

  const baseUrl = config.sokoApiBaseUrl.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const targetUrl = `${baseUrl}${cleanPath}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // 1. Resolve auth token: explicit option > event context > event cookie > master API key
  let authToken = options.token;

  if (!authToken && options.event) {
    authToken =
      options.event.context?.authToken ||
      getCookie(options.event, 'flemela_admin_session') ||
      undefined;
  }

  if (!authToken && config.sokoOrgApiKey) {
    authToken = config.sokoOrgApiKey;
  }

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken.trim()}`;
  }

  try {
    const response = await $fetch<ApiResponse<T>>(targetUrl, {
      method: options.method || 'GET',
      body: options.body,
      query: options.query,
      headers,
    });

    if (!response || !response.success || response.data === undefined) {
      throw createError({
        statusCode: 500,
        statusMessage: response?.error?.message || 'Backend request failed',
        data: response?.error?.details,
      });
    }

    return response.data;
  } catch (err: any) {
    const status = err.response?.status || err.statusCode || 500;
    const message =
      err.response?._data?.error?.message ||
      err.response?._data?.message ||
      err.message ||
      'Error communicating with commerce API';

    throw createError({
      statusCode: status,
      statusMessage: message,
      data: err.response?._data?.error?.details,
    });
  }
}