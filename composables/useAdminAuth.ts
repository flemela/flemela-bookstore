// =============================================================================
// composables/useAdminAuth.ts
// Client-side authentication state and session management for Nuxt 3.
// =============================================================================

export function useAdminAuth() {
  const sessionCookie = useCookie<string | null>('flemela_admin_session', {
    maxAge: 60 * 60 * 24 * 7,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    httpOnly: false,
  });

  const isAuthenticated = computed(() => !!sessionCookie.value);

  async function login(email: string, password: string): Promise<void> {
    const response = await $fetch<{ success: boolean; token: string }>('/api/admin/login', {
      method: 'POST',
      body: { email, password },
    });

    if (response.success && response.token) {
      sessionCookie.value = response.token;
    }
  }

  async function register(payload: {
    name: string;
    email: string;
    password: string;
    orgName: string;
  }): Promise<void> {
    const response = await $fetch<{ success: boolean; token: string }>('/api/admin/register', {
      method: 'POST',
      body: payload,
    });

    if (response.success && response.token) {
      sessionCookie.value = response.token;
    }
  }

  async function logout(): Promise<void> {
    try {
      await $fetch('/api/admin/logout', { method: 'POST' });
    } catch {
      // Best effort cleanup
    } finally {
      sessionCookie.value = null;
      await navigateTo('/admin/login', { replace: true });
    }
  }

  return {
    sessionCookie,
    isAuthenticated,
    login,
    register,
    logout,
  };
}