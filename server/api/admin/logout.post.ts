// =============================================================================
// server/api/admin/logout.post.ts
// Clears the session and refresh cookies and revokes the session.
// =============================================================================

import { clearAdminSession } from '../../utils/adminSession';

export default defineEventHandler(async (event) => {
  clearAdminSession(event);

  return {
    success: true,
    loggedOut: true,
  };
});
