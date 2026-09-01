// =============================================================================
// server/api/admin/dashboard.get.ts
// Aggregates real telemetry: total books, Cloudflare R2 storage (MB), orders, and revenue.
// =============================================================================

import { sokoClient } from '../../utils/sokoClient';

export interface AdminDashboardData {
  totalBooks: number;
  storageUsedMb: number;
  pendingOrders: number;
  todayRevenue: number;
  monthRevenue: number;
  recentOrders: Array<{
    id: string;
    customerName: string;
    customerPhone: string;
    total: number;
    status: string;
    createdAt: string;
  }>;
}

export default defineEventHandler(async (event) => {
  const token =
    event.context.authToken ||
    getCookie(event, 'flemela_admin_session') ||
    undefined;

  try {
    const [productsRes, storageRes, summaryRes, ordersRes] = await Promise.all([
      sokoClient<any[]>('/products?limit=100', { token }).catch(() => []),
      sokoClient<{ totalMb: number }>('/books/storage-stats', { token }).catch(() => ({ totalMb: 0 })),
      sokoClient<{ today_revenue: string; month_revenue: string; pending_count: number }>('/orders/summary', { token }).catch(() => ({
        today_revenue: '0',
        month_revenue: '0',
        pending_count: 0,
      })),
      sokoClient<any[]>('/orders?limit=6', { token }).catch(() => []),
    ]);

    const totalBooksCount = Array.isArray(productsRes) ? productsRes.length : 0;

    const recentOrders = (ordersRes || []).map((o: any) => ({
      id: o.id,
      customerName: o.customer_name || 'Customer',
      customerPhone: o.customer_phone || '—',
      total: parseFloat(o.total || '0'),
      status: o.status || 'pending',
      createdAt: o.created_at || new Date().toISOString(),
    }));

    return {
      totalBooks: totalBooksCount,
      storageUsedMb: storageRes.totalMb || 0,
      pendingOrders: summaryRes.pending_count || 0,
      todayRevenue: parseFloat(summaryRes.today_revenue || '0'),
      monthRevenue: parseFloat(summaryRes.month_revenue || '0'),
      recentOrders,
    };
  } catch (err: any) {
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: 'Failed to load dashboard telemetry',
    });
  }
});