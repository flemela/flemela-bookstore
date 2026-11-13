// =============================================================================
// server/api/admin/dashboard.get.ts
// Aggregates real telemetry: total books, Cloudflare R2 storage (MB), orders, and revenue.
// Soko API envelope shapes:
//   GET /products       -> { products: [...], total, page, limit, totalPages }
//   GET /orders         -> { orders: [...], total, page, limit, totalPages }
//   GET /orders/summary -> { today_revenue, month_revenue, pending_count, ... }
//   GET /books/storage-stats -> { totalBytes, totalMb, digitalBooksCount }
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
    let backendFailures = 0;
    const track = <T,>(p: Promise<T>, fallback: T): Promise<T> =>
      p.catch(() => {
        backendFailures += 1;
        return fallback;
      });

    const [productsRes, storageRes, summaryRes, ordersRes] = await Promise.all([
      track(sokoClient<{ products?: any[]; total?: number } | any[]>('/products?limit=1&page=1', { token }), null),
      track(sokoClient<{ totalMb: number }>('/books/storage-stats', { token }), null as unknown as { totalMb: number }),
      track(sokoClient<{ today_revenue: string; month_revenue: string; pending_count: number }>('/orders/summary', { token }), null as unknown as {
        today_revenue: string; month_revenue: string; pending_count: number;
      }),
      track(sokoClient<{ orders?: any[]; total?: number } | any[]>('/orders?limit=6', { token }), null),
    ]);

    // Every upstream call failed — the Soko API is down or the session token was rejected.
    // Surface a real error instead of rendering fake zeros.
    if (backendFailures === 4) {
      throw createError({
        statusCode: 502,
        statusMessage: 'Soko API unreachable or admin session rejected. Check the backend and sign in again.',
      });
    }

    // Products envelope: { products, total } — prefer the exact server-side total
    const totalBooksCount = Array.isArray(productsRes)
      ? productsRes.length
      : Number((productsRes as any)?.total ?? (productsRes as any)?.products?.length ?? 0);

    // Orders envelope: { orders, total } — tolerate both raw arrays and envelopes
    const ordersList: any[] = Array.isArray(ordersRes)
      ? ordersRes
      : Array.isArray((ordersRes as any)?.orders)
        ? (ordersRes as any).orders
        : [];

    const recentOrders = ordersList.map((o: any) => ({
      id: o.id,
      customerName: o.customer_name || 'Customer',
      customerPhone: o.customer_phone || '—',
      total: parseFloat(o.total || '0'),
      status: o.status || 'pending',
      createdAt: o.created_at || new Date().toISOString(),
    }));

    return {
      totalBooks: totalBooksCount,
      storageUsedMb: Number(storageRes?.totalMb ?? 0) || 0,
      pendingOrders: Number(summaryRes?.pending_count ?? 0) || 0,
      todayRevenue: parseFloat((summaryRes as any)?.today_revenue || '0'),
      monthRevenue: parseFloat((summaryRes as any)?.month_revenue || '0'),
      recentOrders,
    } satisfies AdminDashboardData;
  } catch (err: any) {
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: 'Failed to load dashboard telemetry',
    });
  }
});
