// server/api/admin/ticker.put.ts
import { sokoClient } from '../../utils/sokoClient';

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'flemela_admin_session') || event.context.authToken;
  const body = await readBody(event);

  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized admin session' });
  }

  try {
    const updated = await sokoClient<any[]>('/store/ticker', {
      method: 'PUT',
      body,
      token,
    });
    return updated;
  } catch (err: any) {
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.data?.message || err.statusMessage || 'Failed to save ticker announcements',
    });
  }
});