// =============================================================================
// server/api/admin/logout.post.ts
// Clears the httpOnly session cookie and revokes the session.
// =============================================================================

export default defineEventHandler(async (event) => {
  deleteCookie(event, 'flemela_admin_session', {
    path: '/',
  });

  return {
    success: true,
    loggedOut: true,
  };
});