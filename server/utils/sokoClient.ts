// =============================================================================
// server/utils/sokoClient.ts
// Server-only typed HTTP proxy client communicating with the Soko backend.
// =============================================================================

import type { ApiResponse } from '~/types';

export interface SokoClientOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: Record<string, any> | BodyInit | null;
  query?: Record<string, unknown>;
  headers?: Record<string, string>;
  token?: string;
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

  let authToken = options.token;

  if (!authToken && process.server) {
    try {
      const event = useRequestEvent();
      if (event) {
        authToken =
          event.context.authToken ||
          getCookie(event, 'flemela_admin_session') ||
          undefined;
      }
    } catch {
      // Fallback
    }
  }

  if (!authToken && config.sokoOrgApiKey) {
    authToken = config.sokoOrgApiKey;
  }

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
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