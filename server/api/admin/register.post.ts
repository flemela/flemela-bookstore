// =============================================================================
// server/api/admin/register.post.ts
// Handles bookstore merchant registration and sets session cookie.
// =============================================================================

import { z } from 'zod';
import { sokoClient } from '../../utils/sokoClient';

const RegisterSchema = z.object({
  name: z.string().min(1, 'Full name is required').max(200),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  orgName: z.string().min(1, 'Bookstore name is required').max(200),
  businessType: z.string().default('books'),
});

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const parsed = RegisterSchema.safeParse(body);

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message || 'Invalid registration payload',
    });
  }

  try {
    const res = await sokoClient<{
      tokens: { accessToken: string; refreshToken: string };
      user: { id: string; name: string; email: string };
      org: { id: string; name: string; slug: string };
    }>('/auth/register', {
      method: 'POST',
      body: {
        name: parsed.data.name,
        email: parsed.data.email,
        password: parsed.data.password,
        orgName: parsed.data.orgName,
        businessType: 'books',
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
    throw createError({
      statusCode: err.statusCode || 400,
      statusMessage: err.data?.error?.message || err.statusMessage || 'Registration failed',
    });
  }
});