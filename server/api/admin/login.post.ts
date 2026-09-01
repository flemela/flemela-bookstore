// =============================================================================
// server/api/admin/login.post.ts
// Authenticates store admin against Soko API and sets session cookie.
// =============================================================================

import { z } from 'zod';
import { sokoClient } from '../../utils/sokoClient';

const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const parsed = LoginSchema.safeParse(body);

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message || 'Invalid credentials payload',
    });
  }

  try {
    const res = await sokoClient<{
      tokens: { accessToken: string; refreshToken: string };
      user: { id: string; name: string; email: string };
      org: { id: string; name: string; slug: string };
    }>('/auth/login', {
      method: 'POST',
      body: {
        email: parsed.data.email.trim().toLowerCase(),
        password: parsed.data.password,
      },
    });

    setCookie(event, 'flemela_admin_session', res.tokens.accessToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return {
      success: true,
      token: res.tokens.accessToken,
      user: res.user,
      org: res.org,
    };
  } catch (err: any) {
    const status = err.statusCode || err.response?.status || 401;
    const message =
      err.data?.error?.message ||
      err.data?.message ||
      err.statusMessage ||
      err.message ||
      'Invalid email or password';

    throw createError({
      statusCode: status,
      statusMessage: message,
    });
  }
});