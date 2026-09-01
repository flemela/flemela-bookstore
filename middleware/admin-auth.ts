// =============================================================================
// middleware/admin-auth.ts
// Nuxt route middleware guarding single-tenant /admin views.
// =============================================================================

export default defineNuxtRouteMiddleware((to) => {
  const sessionCookie = useCookie<string | null>('flemela_admin_session');

  // If visiting login while already authenticated, redirect directly to admin workspace
  if (to.path === '/admin/login' || to.path === '/admin/register') {
    if (sessionCookie.value) {
      return navigateTo('/admin', { replace: true });
    }
    // Block /admin/register completely
    if (to.path === '/admin/register') {
      return navigateTo('/admin/login', { replace: true });
    }
    return;
  }

  // Guard all /admin/* routes
  if (!sessionCookie.value) {
    return navigateTo({
      path: '/admin/login',
      query: { redirect: to.fullPath },
    }, { replace: true });
  }
});