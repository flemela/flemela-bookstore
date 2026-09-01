<!-- pages/admin/index.vue -->
<script setup lang="ts">
import { ref } from 'vue';
import {
  BookOpen,
  Database,
  Inbox,
  TrendingUp,
  PlusCircle,
  FileSpreadsheet,
  ExternalLink,
  RefreshCw,
  CheckCircle,
} from 'lucide-vue-next';
import AdminLayout from '~/components/admin/AdminLayout.vue';
import { useToast } from '~/composables/useToast';
import type { AdminDashboardData } from '~/server/api/admin/dashboard.get';

definePageMeta({
  middleware: 'admin-auth',
});

const { push: pushToast } = useToast();
const { data: stats, refresh, status } = await useFetch<AdminDashboardData>('/api/admin/dashboard');

const confirmingOrderId = ref<string | null>(null);

function formatCurrency(val: number): string {
  return `KSh ${val.toLocaleString('en-KE')}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' });
}

async function handleConfirmPayment(orderId: string): Promise<void> {
  confirmingOrderId.value = orderId;
  try {
    await $fetch(`/api/admin/orders/${orderId}/payment-status`, {
      method: 'PATCH',
      body: { payment_status: 'paid' },
    });

    pushToast({ message: 'Payment confirmed! eBook downloads released.', variant: 'success' });
    await refresh();
  } catch (err: any) {
    pushToast({ message: err.data?.message || 'Failed to approve payment', variant: 'error' });
  } finally {
    confirmingOrderId.value = null;
  }
}
</script>

<template>
  <AdminLayout>
    <div class="space-y-7 max-w-6xl mx-auto">
      
      <!-- Top Title Bar -->
      <div class="flex flex-wrap items-baseline justify-between gap-4 pb-4 border-b border-paper-border">
        <div>
          <span class="text-[9px] sm:text-[10px] font-mono uppercase tracking-widest text-gold-600 font-bold block">
            Operations &amp; Control
          </span>
          <h1 class="font-display text-2xl sm:text-3xl font-bold text-forest-950">
            Bookstore Overview
          </h1>
        </div>

        <div class="flex items-center gap-2.5">
          <button
            type="button"
            class="px-3 py-1.5 bg-paper-surface border border-paper-border hover:border-forest-800/40 rounded-xl text-forest-950 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-soft active:scale-[0.98]"
            @click="() => refresh()"
          >
            <RefreshCw :size="12" :class="{ 'animate-spin': status === 'pending' }" />
            <span>Refresh</span>
          </button>

          <NuxtLink
            to="/admin/books/new"
            class="bg-forest-950 text-paper hover:bg-forest-900 text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-medium active:scale-[0.98]"
          >
            <PlusCircle :size="14" class="text-gold-300" />
            <span>Add Book</span>
          </NuxtLink>
        </div>
      </div>

      <!-- KPI Metrics Grid (4 Elevated Cards) -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <!-- Metric 1: Total Titles in Catalog -->
        <div class="bg-paper-surface p-5 sm:p-6 rounded-2xl border border-paper-border shadow-soft space-y-2 hover:shadow-card transition-shadow">
          <div class="flex justify-between items-center text-ink-subtle">
            <span class="text-[10px] font-mono uppercase font-bold tracking-wider">Total Catalog</span>
            <div class="w-8 h-8 rounded-xl bg-forest-950/5 text-forest-900 flex items-center justify-center">
              <BookOpen :size="16" />
            </div>
          </div>
          <p class="text-2xl sm:text-3xl font-mono font-extrabold text-forest-950 tabular-figure">
            {{ stats?.totalBooks ?? 0 }}
          </p>
          <span class="text-[11px] text-ink-muted block">Active catalog editions</span>
        </div>

        <!-- Metric 2: eBook Cloudflare R2 Storage (MB) -->
        <div class="bg-paper-surface p-5 sm:p-6 rounded-2xl border border-paper-border shadow-soft space-y-2 hover:shadow-card transition-shadow">
          <div class="flex justify-between items-center text-ink-subtle">
            <span class="text-[10px] font-mono uppercase font-bold tracking-wider">eBook Storage</span>
            <div class="w-8 h-8 rounded-xl bg-gold-500/10 text-gold-600 flex items-center justify-center">
              <Database :size="16" />
            </div>
          </div>
          <p class="text-2xl sm:text-3xl font-mono font-extrabold text-gold-600 tabular-figure">
            {{ stats?.storageUsedMb ? `${stats.storageUsedMb} MB` : '0 MB' }}
          </p>
          <span class="text-[11px] text-ink-muted block">Cloudflare R2 assets</span>
        </div>

        <!-- Metric 3: Pending Order Verification Queue -->
        <div class="bg-paper-surface p-5 sm:p-6 rounded-2xl border border-paper-border shadow-soft space-y-2 hover:shadow-card transition-shadow">
          <div class="flex justify-between items-center text-ink-subtle">
            <span class="text-[10px] font-mono uppercase font-bold tracking-wider">Pending Orders</span>
            <div class="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-800 flex items-center justify-center">
              <Inbox :size="16" />
            </div>
          </div>
          <p class="text-2xl sm:text-3xl font-mono font-extrabold text-forest-950 tabular-figure">
            {{ stats?.pendingOrders ?? 0 }}
          </p>
          <span class="text-[11px] text-ink-muted block">Awaiting approval</span>
        </div>

        <!-- Metric 4: Settled Revenue Today -->
        <div class="bg-paper-surface p-5 sm:p-6 rounded-2xl border border-paper-border shadow-soft space-y-2 hover:shadow-card transition-shadow">
          <div class="flex justify-between items-center text-ink-subtle">
            <span class="text-[10px] font-mono uppercase font-bold tracking-wider">Today's Sales</span>
            <div class="w-8 h-8 rounded-xl bg-forest-950/5 text-forest-900 flex items-center justify-center">
              <TrendingUp :size="16" />
            </div>
          </div>
          <p class="text-xl sm:text-2xl lg:text-3xl font-mono font-extrabold text-forest-950 tabular-figure truncate">
            {{ stats ? formatCurrency(stats.todayRevenue) : 'KSh 0' }}
          </p>
          <span class="text-[11px] text-ink-muted block">Settled M-Pesa total</span>
        </div>
      </div>

      <!-- Quick Action Navigation Tiles -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <!-- Tile A: Bulk Excel / CSV Ingestion -->
        <NuxtLink
          to="/admin/books/import"
          class="bg-forest-950 text-paper p-5 sm:p-6 rounded-2xl shadow-soft hover:shadow-medium hover:-translate-y-0.5 transition-all flex items-center justify-between group"
        >
          <div class="space-y-1 text-left">
            <span class="text-[9px] font-mono uppercase font-bold tracking-wider text-gold-300">Catalog Pipeline</span>
            <h3 class="font-display font-bold text-sm sm:text-base text-paper">Bulk Excel Importer</h3>
            <p class="text-[11px] text-paper/70 leading-normal">Ingest titles, covers, and R2 eBooks</p>
          </div>
          <div class="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center text-gold-300 flex-shrink-0 ml-3 group-hover:scale-105 transition-transform">
            <FileSpreadsheet :size="20" />
          </div>
        </NuxtLink>

        <!-- Tile B: Manage Books Catalog -->
        <NuxtLink
          to="/admin/books"
          class="bg-paper-surface p-5 sm:p-6 rounded-2xl border border-paper-border hover:border-forest-800/30 shadow-soft hover:shadow-medium hover:-translate-y-0.5 transition-all flex items-center justify-between group"
        >
          <div class="space-y-1 text-left">
            <span class="text-[9px] font-mono uppercase font-bold tracking-wider text-ink-subtle">Inventory</span>
            <h3 class="font-display font-bold text-sm sm:text-base text-forest-950">Manage Catalog</h3>
            <p class="text-[11px] text-ink-muted leading-normal">Set formats, prices, and physical stock</p>
          </div>
          <div class="w-11 h-11 rounded-xl bg-paper-cream flex items-center justify-center text-forest-900 flex-shrink-0 ml-3 group-hover:scale-105 transition-transform">
            <BookOpen :size="20" />
          </div>
        </NuxtLink>

        <!-- Tile C: Live Storefront Preview -->
        <NuxtLink
          to="/"
          target="_blank"
          class="bg-paper-surface p-5 sm:p-6 rounded-2xl border border-paper-border hover:border-forest-800/30 shadow-soft hover:shadow-medium hover:-translate-y-0.5 transition-all flex items-center justify-between group"
        >
          <div class="space-y-1 text-left">
            <span class="text-[9px] font-mono uppercase font-bold tracking-wider text-gold-600">Reader Experience</span>
            <h3 class="font-display font-bold text-sm sm:text-base text-forest-950">Live Bookstore</h3>
            <p class="text-[11px] text-ink-muted leading-normal">Preview public catalog and checkout</p>
          </div>
          <div class="w-11 h-11 rounded-xl bg-paper-cream flex items-center justify-center text-gold-600 flex-shrink-0 ml-3 group-hover:scale-105 transition-transform">
            <ExternalLink :size="18" />
          </div>
        </NuxtLink>
      </div>

      <!-- Recent Orders Table & 1-Click Approval Action -->
      <div class="bg-paper-surface rounded-2xl border border-paper-border shadow-soft overflow-hidden">
        <div class="px-5 py-4 border-b border-paper-border flex justify-between items-center bg-paper-cream/30">
          <h3 class="font-display font-bold text-sm sm:text-base text-forest-950">Recent Orders</h3>
          <span class="text-[10px] font-mono uppercase tracking-wider text-ink-muted">Live Orders Stream</span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="border-b border-paper-border text-ink-subtle uppercase tracking-wider font-mono text-[9px]">
                <th class="py-3 px-5 font-semibold">Customer</th>
                <th class="py-3 px-5 font-semibold">Phone</th>
                <th class="py-3 px-5 font-semibold text-right">Total</th>
                <th class="py-3 px-5 font-semibold">Status</th>
                <th class="py-3 px-5 font-semibold">Date</th>
                <th class="py-3 px-5 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-paper-border/60">
              <tr v-if="!stats?.recentOrders?.length">
                <td colspan="6" class="py-10 text-center text-ink-muted text-xs">
                  No orders recorded yet. Incoming storefront orders will display here automatically.
                </td>
              </tr>

              <tr
                v-for="order in stats?.recentOrders"
                :key="order.id"
                class="hover:bg-paper-cream/30 transition-colors"
              >
                <td class="py-3.5 px-5 font-semibold text-forest-950 text-xs truncate max-w-[150px]">
                  {{ order.customerName }}
                </td>
                <td class="py-3.5 px-5 font-mono text-[11px] text-ink-muted">
                  {{ order.customerPhone }}
                </td>
                <td class="py-3.5 px-5 text-right font-mono font-bold text-forest-950 text-xs tabular-figure">
                  {{ formatCurrency(order.total) }}
                </td>
                <td class="py-3.5 px-5">
                  <span
                    class="inline-flex items-center gap-1.5 text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border"
                    :class="{
                      'bg-amber-50 text-amber-900 border-amber-200': order.status === 'pending',
                      'bg-emerald-50 text-emerald-900 border-emerald-200': order.status === 'confirmed' || order.status === 'delivered',
                      'bg-red-50 text-red-900 border-red-200': order.status === 'cancelled',
                    }"
                  >
                    <span
                      class="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      :class="{
                        'bg-amber-600': order.status === 'pending',
                        'bg-emerald-600': order.status === 'confirmed' || order.status === 'delivered',
                        'bg-red-600': order.status === 'cancelled',
                      }"
                    />
                    {{ order.status }}
                  </span>
                </td>
                <td class="py-3.5 px-5 text-ink-subtle text-[11px] font-mono">
                  {{ formatDate(order.createdAt) }}
                </td>
                <td class="py-3.5 px-5 text-right">
                  <button
                    v-if="order.status === 'pending'"
                    type="button"
                    class="bg-forest-950 hover:bg-forest-900 text-paper text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all inline-flex items-center gap-1.5 shadow-subtle cursor-pointer disabled:opacity-50 active:scale-[0.98]"
                    :disabled="confirmingOrderId === order.id"
                    @click="handleConfirmPayment(order.id)"
                  >
                    <CheckCircle :size="12" class="text-gold-300" />
                    <span>{{ confirmingOrderId === order.id ? 'Releasing...' : 'Approve & Release' }}</span>
                  </button>
                  <span v-else class="text-[11px] font-medium text-emerald-800">Fulfilled ✓</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>