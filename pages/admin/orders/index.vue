<!-- pages/admin/orders/index.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  Inbox,
  Search,
  CheckCircle2,
  Truck,
  Store,
  RefreshCw,
  MapPin,
  CreditCard,
  Zap,
  Phone,
  User,
  ChevronDown,
  ChevronUp,
  KeyRound,
} from 'lucide-vue-next';
import AdminLayout from '~/components/admin/AdminLayout.vue';
import { useToast } from '~/composables/useToast';

definePageMeta({
  middleware: 'admin-auth',
});

interface OrderItem {
  id: string;
  product_name: string;
  variant_title: string | null;
  unit_price: string;
  quantity: number;
  subtotal: string;
}

interface AdminOrder {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  delivery_location: string;
  notes: string | null;
  status: 'pending' | 'confirmed' | 'assigned' | 'out_for_delivery' | 'delivered' | 'cancelled';
  payment_method: string;
  payment_status: 'pending' | 'paid' | 'failed';
  payment_reference: string | null;
  total: string;
  delivery_type: 'delivery' | 'pickup';
  delivery_fee: string;
  delivery_confirmation_code: string | null;
  created_at: string;
  items: OrderItem[];
}

const { push: pushToast } = useToast();

const searchQuery = ref('');
const statusFilter = ref('all');
const paymentMethodFilter = ref('all');
const paymentStatusFilter = ref('all');
const page = ref(1);

const { data: ordersData, refresh, status: fetchStatus } = await useFetch<{
  data: AdminOrder[];
  meta: { totalItems: number; page: number; totalPages: number };
}>('/api/admin/orders', {
  query: {
    q: searchQuery,
    status: statusFilter,
    payment_method: paymentMethodFilter,
    payment_status: paymentStatusFilter,
    page,
  },
});

const orders = computed(() => ordersData.value?.data || []);
const updatingOrderId = ref<string | null>(null);
const expandedOrderIds = ref<Set<string>>(new Set());

function toggleExpand(orderId: string): void {
  if (expandedOrderIds.value.has(orderId)) {
    expandedOrderIds.value.delete(orderId);
  } else {
    expandedOrderIds.value.add(orderId);
  }
}

function formatCurrency(val: string | number): string {
  const num = typeof val === 'string' ? parseFloat(val) : val;
  return `KSh ${num.toLocaleString('en-KE')}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-KE', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// 1-Click Approve Manual M-Pesa Deposit
async function handleApprovePayment(orderId: string): Promise<void> {
  updatingOrderId.value = orderId;
  try {
    await $fetch(`/api/admin/orders/${orderId}/payment-status`, {
      method: 'PATCH' as any,
      body: { payment_status: 'paid' },
    });
    pushToast({ message: 'Payment verified! Downloads unlocked and ledger entry created.', variant: 'success' });
    await refresh();
  } catch (err: any) {
    pushToast({ message: err.data?.message || 'Failed to approve payment', variant: 'error' });
  } finally {
    updatingOrderId.value = null;
  }
}

// Update Order Fulfillment Lifecycle (Confirmed -> Out for Delivery -> Delivered)
async function handleUpdateStatus(orderId: string, newStatus: string): Promise<void> {
  updatingOrderId.value = orderId;
  try {
    await $fetch(`/api/admin/orders/${orderId}/status`, {
      method: 'PATCH' as any,
      body: { status: newStatus },
    });
    pushToast({ message: `Order status updated to ${newStatus}!`, variant: 'success' });
    await refresh();
  } catch (err: any) {
    pushToast({ message: err.data?.message || 'Failed to update order status', variant: 'error' });
  } finally {
    updatingOrderId.value = null;
  }
}

function handleResetFilters(): void {
  searchQuery.value = '';
  statusFilter.value = 'all';
  paymentMethodFilter.value = 'all';
  paymentStatusFilter.value = 'all';
  page.value = 1;
}
</script>

<template>
  <AdminLayout>
    <div class="space-y-6 max-w-7xl mx-auto">
      
      <!-- Top Title Bar -->
      <div class="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-paper-border">
        <div>
          <span class="text-[9px] sm:text-[10px] font-mono uppercase tracking-widest text-gold-600 font-bold block">
            Fulfillment &amp; Verification
          </span>
          <h1 class="font-display text-2xl sm:text-3xl font-bold text-forest-950">
            Order Management Desk
          </h1>
          <p class="text-xs text-ink-muted mt-0.5">
            Verify manual M-Pesa deposits, monitor Cash on Delivery orders, and track fulfillment dispatch.
          </p>
        </div>

        <button
          type="button"
          class="px-3.5 py-2 bg-paper-surface border border-paper-border rounded-xl text-forest-950 text-xs font-semibold flex items-center gap-1.5 hover:bg-paper-cream transition-colors cursor-pointer shadow-2xs"
          @click="() => refresh()"
        >
          <RefreshCw :size="13" :class="{ 'animate-spin': fetchStatus === 'pending' }" />
          <span>Refresh Orders</span>
        </button>
      </div>

      <!-- Filters & Search Toolbar -->
      <div class="bg-paper-surface p-4 rounded-2xl border border-paper-border shadow-soft flex flex-wrap gap-3 items-center justify-between">
        
        <!-- Search Input -->
        <div class="relative flex-1 min-w-[240px]">
          <Search :size="14" class="absolute left-3.5 top-3 text-ink-subtle pointer-events-none" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search by customer, phone, M-Pesa ref, or order ID..."
            class="w-full pl-9 pr-3 py-2 bg-paper-canvas/50 border border-paper-border rounded-xl text-xs outline-none focus:bg-white focus:border-forest-900 transition-all text-forest-950 placeholder:text-ink-subtle"
            @keyup.enter="() => refresh()"
          />
        </div>

        <!-- Payment Method Filter -->
        <select
          v-model="paymentMethodFilter"
          class="px-3 py-2 bg-paper-canvas/50 border border-paper-border rounded-xl text-xs font-semibold text-forest-950 outline-none"
          @change="() => { page = 1; refresh(); }"
        >
          <option value="all">All Payment Channels</option>
          <option value="mpesa_manual">Direct M-Pesa Till (Manual)</option>
          <option value="mpesa_cash">Cash on Delivery / Pickup</option>
          <option value="mpesa">Automated STK Push</option>
        </select>

        <!-- Fulfillment Status Filter -->
        <select
          v-model="statusFilter"
          class="px-3 py-2 bg-paper-canvas/50 border border-paper-border rounded-xl text-xs font-semibold text-forest-950 outline-none"
          @change="() => { page = 1; refresh(); }"
        >
          <option value="all">All Fulfillment Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="assigned">Rider Assigned</option>
          <option value="out_for_delivery">Out for Delivery</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <!-- Payment Status Filter -->
        <select
          v-model="paymentStatusFilter"
          class="px-3 py-2 bg-paper-canvas/50 border border-paper-border rounded-xl text-xs font-semibold text-forest-950 outline-none"
          @change="() => { page = 1; refresh(); }"
        >
          <option value="all">All Payment Statuses</option>
          <option value="pending">Payment Pending</option>
          <option value="paid">Payment Verified</option>
          <option value="failed">Payment Failed</option>
        </select>
      </div>

      <!-- Orders Feed Table -->
      <div class="bg-paper-surface rounded-2xl border border-paper-border shadow-soft overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="bg-paper-cream/40 border-b border-paper-border text-ink-subtle uppercase tracking-wider font-mono text-[9px]">
                <th class="py-3 px-4">Order ID &amp; Time</th>
                <th class="py-3 px-4">Customer &amp; Destination</th>
                <th class="py-3 px-4">Channel &amp; M-Pesa Ref</th>
                <th class="py-3 px-4 text-right">Total Bill</th>
                <th class="py-3 px-4">Status &amp; Verification</th>
                <th class="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-paper-border/60">
              <tr v-if="fetchStatus === 'pending'">
                <td colspan="6" class="py-12 text-center text-ink-muted text-xs">
                  Loading order desk...
                </td>
              </tr>

              <tr v-else-if="!orders.length">
                <td colspan="6" class="py-12 text-center text-ink-muted text-xs space-y-2">
                  <Inbox :size="24" class="mx-auto text-ink-subtle opacity-50" />
                  <p>No orders match the selected filters.</p>
                  <button
                    type="button"
                    class="text-forest-900 font-bold underline cursor-pointer text-xs"
                    @click="handleResetFilters"
                  >
                    Reset all filters
                  </button>
                </td>
              </tr>

              <template v-for="order in orders" :key="order.id">
                <tr class="hover:bg-paper-cream/30 transition-colors">
                  <!-- Order ID & Time -->
                  <td class="py-3.5 px-4 align-top">
                    <span class="font-mono font-bold text-forest-950 block">
                      #{{ order.id.slice(0, 8).toUpperCase() }}
                    </span>
                    <span class="text-[10px] text-ink-muted font-mono block mt-0.5">
                      {{ formatDate(order.created_at) }}
                    </span>
                    <div class="mt-1 flex items-center gap-1.5">
                      <span
                        v-if="order.delivery_type === 'pickup'"
                        class="inline-flex items-center gap-1 text-[9px] font-mono font-bold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200"
                      >
                        <Store :size="10" /> Store Pickup
                      </span>
                      <span
                        v-else
                        class="inline-flex items-center gap-1 text-[9px] font-mono font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200"
                      >
                        <Truck :size="10" /> Delivery
                      </span>

                      <!-- Expand Line Items Toggle -->
                      <button
                        type="button"
                        class="text-[10px] font-mono text-ink-muted hover:text-forest-950 flex items-center gap-0.5 cursor-pointer"
                        @click="toggleExpand(order.id)"
                      >
                        <span>{{ order.items?.length || 0 }} item(s)</span>
                        <component :is="expandedOrderIds.has(order.id) ? ChevronUp : ChevronDown" :size="11" />
                      </button>
                    </div>
                  </td>

                  <!-- Customer Details -->
                  <td class="py-3.5 px-4 align-top max-w-xs">
                    <div class="font-bold text-forest-950 flex items-center gap-1">
                      <User :size="12" class="text-ink-subtle" />
                      <span>{{ order.customer_name }}</span>
                    </div>
                    <div class="font-mono text-[11px] text-ink-muted flex items-center gap-1 mt-0.5">
                      <Phone :size="11" class="text-ink-subtle" />
                      <span>{{ order.customer_phone }}</span>
                    </div>
                    <div class="text-[11px] text-ink-subtle truncate mt-1 flex items-center gap-1" :title="order.delivery_location">
                      <MapPin :size="11" class="flex-shrink-0 text-gold-600" />
                      <span>{{ order.delivery_location }}</span>
                    </div>
                  </td>

                  <!-- Payment Channel & Reference Code -->
                  <td class="py-3.5 px-4 align-top">
                    <div class="space-y-1">
                      <!-- Payment Mode Tag -->
                      <span
                        class="inline-flex items-center gap-1 text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded"
                        :class="{
                          'bg-amber-100 text-amber-950': order.payment_method === 'mpesa_manual',
                          'bg-slate-100 text-slate-800': order.payment_method === 'mpesa_cash',
                          'bg-emerald-100 text-emerald-950': order.payment_method === 'mpesa' || order.payment_method === 'mpesa_direct',
                        }"
                      >
                        <component :is="order.payment_method === 'mpesa_cash' ? CreditCard : Zap" :size="10" />
                        {{ order.payment_method === 'mpesa_manual' ? 'Direct Till' : (order.payment_method === 'mpesa_cash' ? 'Cash on Delivery' : 'STK Push') }}
                      </span>

                      <!-- Customer-Submitted M-Pesa Code Badge -->
                      <div v-if="order.payment_reference" class="pt-0.5">
                        <span class="font-mono text-xs font-bold text-forest-950 bg-white px-2 py-0.5 rounded border border-paper-border inline-block shadow-2xs">
                          {{ order.payment_reference }}
                        </span>
                      </div>
                    </div>
                  </td>

                  <!-- Total Amount -->
                  <td class="py-3.5 px-4 align-top text-right font-mono font-bold text-forest-950 text-xs tabular-figure">
                    {{ formatCurrency(order.total) }}
                    <span v-if="order.delivery_fee && parseFloat(order.delivery_fee) > 0" class="text-[10px] text-ink-subtle block font-normal">
                      Incl. {{ formatCurrency(order.delivery_fee) }} delivery
                    </span>
                  </td>

                  <!-- Status Tags -->
                  <td class="py-3.5 px-4 align-top space-y-1">
                    <!-- Payment Status -->
                    <span
                      class="inline-flex items-center gap-1 text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border block max-w-fit"
                      :class="{
                        'bg-emerald-50 text-emerald-900 border-emerald-200': order.payment_status === 'paid',
                        'bg-amber-50 text-amber-900 border-amber-200': order.payment_status === 'pending',
                        'bg-red-50 text-red-900 border-red-200': order.payment_status === 'failed',
                      }"
                    >
                      <span class="w-1.5 h-1.5 rounded-full" :class="order.payment_status === 'paid' ? 'bg-emerald-600' : 'bg-amber-600'" />
                      {{ order.payment_status === 'paid' ? 'Payment Verified' : 'Payment Pending' }}
                    </span>

                    <!-- Fulfillment Status -->
                    <span
                      class="inline-flex items-center gap-1 text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border block max-w-fit"
                      :class="{
                        'bg-blue-50 text-blue-900 border-blue-200': order.status === 'out_for_delivery',
                        'bg-emerald-50 text-emerald-900 border-emerald-200': order.status === 'confirmed' || order.status === 'delivered',
                        'bg-slate-100 text-slate-800 border-slate-200': order.status === 'pending',
                        'bg-red-50 text-red-900 border-red-200': order.status === 'cancelled',
                      }"
                    >
                      {{ order.status }}
                    </span>

                    <!-- Courier Handover Code Badge -->
                    <div v-if="order.delivery_confirmation_code" class="pt-0.5">
                      <span class="inline-flex items-center gap-1 text-[9px] font-mono font-bold text-ink-muted">
                        <KeyRound :size="10" class="text-gold-600" />
                        <span>Code: {{ order.delivery_confirmation_code }}</span>
                      </span>
                    </div>
                  </td>

                  <!-- Admin Action Desk -->
                  <td class="py-3.5 px-4 align-top text-right space-y-1.5">
                    <!-- Approve Manual M-Pesa Deposit -->
                    <button
                      v-if="order.payment_status === 'pending' && order.payment_method === 'mpesa_manual'"
                      type="button"
                      class="bg-forest-950 hover:bg-forest-900 text-paper text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all inline-flex items-center gap-1.5 shadow-subtle cursor-pointer disabled:opacity-50"
                      :disabled="updatingOrderId === order.id"
                      @click="handleApprovePayment(order.id)"
                    >
                      <CheckCircle2 :size="12" class="text-gold-300" />
                      <span>{{ updatingOrderId === order.id ? 'Approving...' : 'Verify Deposit' }}</span>
                    </button>

                    <!-- Dispatch Delivery -->
                    <button
                      v-if="order.status === 'confirmed' && order.delivery_type === 'delivery'"
                      type="button"
                      class="bg-blue-700 hover:bg-blue-800 text-white text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                      :disabled="updatingOrderId === order.id"
                      @click="handleUpdateStatus(order.id, 'out_for_delivery')"
                    >
                      <Truck :size="11" />
                      <span>Dispatch</span>
                    </button>

                    <!-- Complete Delivery / Pickup -->
                    <button
                      v-if="order.status === 'out_for_delivery' || (order.status === 'confirmed' && order.delivery_type === 'pickup')"
                      type="button"
                      class="bg-emerald-700 hover:bg-emerald-800 text-white text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                      :disabled="updatingOrderId === order.id"
                      @click="handleUpdateStatus(order.id, 'delivered')"
                    >
                      <CheckCircle2 :size="11" />
                      <span>Complete</span>
                    </button>
                  </td>
                </tr>

                <!-- Expandable Line Items Drawer -->
                <tr v-if="expandedOrderIds.has(order.id)" class="bg-paper-cream/50">
                  <td colspan="6" class="px-6 py-3 border-b border-paper-border">
                    <div class="space-y-1.5">
                      <span class="text-[10px] font-mono uppercase font-bold text-ink-muted block tracking-wider">
                        Order Line Items:
                      </span>
                      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        <div
                          v-for="item in order.items"
                          :key="item.id"
                          class="bg-white p-2.5 rounded-lg border border-paper-border text-xs flex justify-between items-center shadow-2xs"
                        >
                          <div>
                            <strong class="text-forest-950 font-bold block truncate max-w-[180px]">{{ item.product_name }}</strong>
                            <span class="text-[10px] text-ink-muted font-mono">
                              {{ item.variant_title || 'Hardcopy' }} â€¢ Qty: {{ item.quantity }}
                            </span>
                          </div>
                          <span class="font-mono font-bold text-forest-950 text-xs">
                            {{ formatCurrency(item.subtotal) }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  </AdminLayout>
</template>