// server/api/admin/ticker.get.ts
import { sokoClient } from '../../utils/sokoClient';

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'flemela_admin_session') || event.context.authToken;
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized admin session' });
  }

  try {
    const ticker = await sokoClient<any[]>('/store/ticker', { token });
    return ticker || [];
  } catch (err: any) {
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.statusMessage || 'Failed to load promotional ticker',
    });
  }
});