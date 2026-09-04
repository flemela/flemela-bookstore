<!-- pages/checkout/confirm.vue -->
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import {
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Download,
  Copy,
  Check,
  Share2,
  ShoppingBag,
  ArrowRight,
  KeyRound,
  RefreshCw,
  Clock,
  Lock,
} from 'lucide-vue-next';
import TopUtilityBar from '~/components/storefront/TopUtilityBar.vue';
import BookstoreHeader from '~/components/storefront/BookstoreHeader.vue';
import ToastContainer from '~/components/ui/ToastContainer.vue';
import { useToast } from '~/composables/useToast';
import type { OrderStatusResponse } from '~/server/api/orders/[id]/status.get';

const route = useRoute();
const router = useRouter();
const { push: pushToast } = useToast();

const orderId = computed(() => (route.query.orderId as string) || '');
const phoneParam = computed(() => (route.query.phone as string) || '');

const verifyPhoneInput = ref(phoneParam.value);
const orderData = ref<OrderStatusResponse | null>(null);

const isManualChecking = ref(false);
const isVerifyingPhone = ref(false);
let pollInterval: ReturnType<typeof setInterval> | undefined;

const pollAttempts = ref(0);
const MAX_POLL_ATTEMPTS = 40;
const isCodeCopied = ref(false);

function formatCurrency(val: number): string {
  return `KSh ${val.toLocaleString('en-KE')}`;
}

const isPaymentPaid = computed(() => orderData.value?.paymentStatus === 'paid');
const isPaymentFailed = computed(() => orderData.value?.paymentStatus === 'failed');
const isManualPending = computed(() => orderData.value?.paymentMethod === 'mpesa_manual' && orderData.value?.paymentStatus === 'pending');

const hasDigitalDownloads = computed(() => {
  return orderData.value && orderData.value.downloads && orderData.value.downloads.length > 0;
});

async function fetchStatus(phoneToUse = verifyPhoneInput.value): Promise<void> {
  if (!orderId.value) return;

  pollAttempts.value++;

  try {
    const data = await $fetch<OrderStatusResponse>(`/api/orders/${orderId.value}/status`, {
      query: { phone: phoneToUse || undefined },
    });
    orderData.value = data;

    if (data.paymentStatus === 'paid' || data.paymentStatus === 'failed') {
      stopTimers();
    } else if (pollAttempts.value >= MAX_POLL_ATTEMPTS) {
      stopTimers();
    }
  } catch {
    if (pollAttempts.value >= MAX_POLL_ATTEMPTS) {
      stopTimers();
    }
  }
}

async function handleUnlockDownloads(): Promise<void> {
  if (!verifyPhoneInput.value.trim()) {
    pushToast({ message: 'Please enter your mobile phone number', variant: 'error' });
    return;
  }

  isVerifyingPhone.value = true;
  try {
    await fetchStatus(verifyPhoneInput.value.trim());
    if (orderData.value?.isVerifiedCustomer) {
      pushToast({ message: 'Identity verified! Downloads unlocked.', variant: 'success' });
    } else {
      pushToast({ message: 'Phone number did not match order details.', variant: 'error' });
    }
  } finally {
    isVerifyingPhone.value = false;
  }
}

async function handleManualCheckStatus(): Promise<void> {
  isManualChecking.value = true;
  try {
    await fetchStatus();
    if (orderData.value?.paymentStatus === 'paid') {
      pushToast({ message: 'Payment confirmed! Downloads released.', variant: 'success' });
      stopTimers();
    } else {
      pushToast({ message: 'Payment verification in progress. Please wait a moment.', variant: 'info' });
    }
  } finally {
    isManualChecking.value = false;
  }
}

function startTimers(): void {
  stopTimers();
  pollAttempts.value = 0;
  pollInterval = setInterval(() => fetchStatus(), 3000);
}

function stopTimers(): void {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = undefined;
  }
}

onMounted(() => {
  if (!orderId.value) {
    router.replace('/');
    return;
  }
  fetchStatus();
  startTimers();
});

onUnmounted(() => {
  stopTimers();
});

function copyConfirmationCode(): void {
  const code = orderData.value?.deliveryConfirmationCode;
  if (!code || !navigator.clipboard) return;

  navigator.clipboard.writeText(code);
  isCodeCopied.value = true;
  pushToast({ message: 'Delivery code copied to clipboard!', variant: 'success' });
  setTimeout(() => (isCodeCopied.value = false), 2200);
}

const whatsappShareUrl = computed(() => {
  if (!orderData.value) return '#';
  const url = typeof window !== 'undefined' ? window.location.href : '';
  const text = [
    `*📚 Flemela Bookstore — Order #${orderData.value.orderId.slice(0, 8).toUpperCase()}*`,
    `Customer: ${orderData.value.customerName}`,
    `Total: KSh ${orderData.value.total.toLocaleString('en-KE')}`,
    `Status: ${orderData.value.status.toUpperCase()}`,
    `Track your order live: ${url}`,
  ].join('\n');

  return `https://wa.me/?text=${encodeURIComponent(text)}`;
});
</script>

<template>
  <div class="min-h-screen flex flex-col bg-paper-canvas text-ink antialiased">
    <TopUtilityBar />
    <BookstoreHeader />

    <main class="max-w-3xl mx-auto w-full py-10 sm:py-14 px-4 sm:px-6 flex-1">
      <div class="bg-paper-surface rounded-2xl shadow-card border border-paper-border p-6 sm:p-10 space-y-7">
        
        <!-- 1. Manual M-Pesa Pending State -->
        <div v-if="isManualPending" class="space-y-5">
          <div class="bg-paper-cream/70 border border-gold-400/50 rounded-2xl p-6 sm:p-7 space-y-4 shadow-soft">
            <div class="flex items-start gap-4">
              <div class="relative w-10 h-10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span class="absolute w-full h-full rounded-full bg-gold-400/30 animate-ping" />
                <div class="w-9 h-9 rounded-full bg-gold-500 text-forest-950 flex items-center justify-center shadow-xs">
                  <Clock :size="18" />
                </div>
              </div>

              <div class="space-y-1.5 flex-1">
                <h2 class="font-display font-bold text-base sm:text-lg text-forest-950">
                  Payment Reference Received &amp; Verifying
                </h2>
                <p class="text-xs sm:text-sm text-ink-muted leading-relaxed">
                  Thank you, <strong>{{ orderData?.customerName }}</strong>! Your payment reference has been recorded. Our administrator is verifying receipt.
                </p>
              </div>
            </div>

            <div class="bg-white rounded-xl p-4 border border-paper-border text-xs text-forest-950 space-y-1.5 shadow-2xs">
              <div class="flex justify-between items-center text-ink-muted">
                <span>Order Reference:</span>
                <span class="font-mono font-bold text-forest-950">#{{ orderData?.orderId.slice(0, 8).toUpperCase() }}</span>
              </div>
              <div class="flex justify-between items-center text-ink-muted">
                <span>Amount to Settle:</span>
                <span class="font-mono font-bold text-forest-950 tabular-figure">{{ orderData ? formatCurrency(orderData.total) : '' }}</span>
              </div>
            </div>

            <div class="flex items-center justify-between pt-1">
              <div class="flex items-center gap-2 text-[11px] font-semibold text-gold-600">
                <span class="w-2 h-2 rounded-full bg-gold-500 animate-pulse" />
                <span>Live status connected — downloads unlock automatically...</span>
              </div>

              <button
                type="button"
                class="px-3.5 py-1.5 bg-forest-950 hover:bg-forest-900 text-paper text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-subtle cursor-pointer transition-all disabled:opacity-50 active:scale-[0.98]"
                :disabled="isManualChecking"
                @click="handleManualCheckStatus"
              >
                <RefreshCw :size="12" :class="{ 'animate-spin': isManualChecking }" />
                <span>Check Status</span>
              </button>
            </div>
          </div>
        </div>

        <!-- 2. Automated STK Pending Prompt -->
        <div v-else-if="!isPaymentPaid && !isPaymentFailed" class="space-y-6">
          <div class="bg-paper-cream/60 border border-gold-400/40 rounded-2xl p-6 sm:p-7 flex items-start gap-4 shadow-soft">
            <div class="space-y-1.5 flex-1">
              <h2 class="font-display font-bold text-base sm:text-lg text-forest-950">
                M-Pesa Prompt Sent to {{ phoneParam || 'your phone' }}
              </h2>
              <p class="text-xs sm:text-sm text-ink-muted leading-relaxed">
                Please enter your <strong>M-Pesa PIN</strong> on your mobile screen to approve payment of
                <strong class="text-forest-900 font-mono">{{ orderData ? formatCurrency(orderData.total) : 'your order' }}</strong>.
              </p>
              <div class="flex items-center gap-2 text-[11px] font-bold text-gold-600 pt-2">
                <span class="w-2 h-2 rounded-full bg-gold-500 animate-pulse" />
                <span>Awaiting Safaricom confirmation...</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. Payment Failed -->
        <div v-else-if="isPaymentFailed" class="bg-red-50 border border-red-200 rounded-2xl p-6 sm:p-7 flex items-start gap-4 shadow-soft">
          <AlertTriangle :size="24" class="text-red-600 flex-shrink-0 mt-0.5" />
          <div class="space-y-2 flex-1">
            <h2 class="font-display font-bold text-base sm:text-lg text-red-900">Payment Incomplete</h2>
            <p class="text-xs sm:text-sm text-red-800">
              The payment prompt was cancelled or timed out. You can return to checkout to retry.
            </p>
            <NuxtLink to="/checkout" class="inline-flex items-center gap-1.5 text-xs font-bold text-forest-900 hover:underline pt-1">
              <RotateCcw :size="13" /> Return to Checkout
            </NuxtLink>
          </div>
        </div>

        <!-- 4. Payment Confirmed / Fulfillment -->
        <div v-if="isPaymentPaid || orderData?.status === 'confirmed' || orderData?.status === 'delivered'" class="space-y-7">
          
          <!-- Celebration Header -->
          <div class="text-center space-y-2 pb-6 border-b border-paper-border">
            <div class="w-14 h-14 bg-emerald-100 text-forest-950 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 :size="32" class="text-emerald-800" />
            </div>
            <h1 class="font-display text-2xl sm:text-3xl font-extrabold text-forest-950">
              Order Confirmed &amp; Fulfilled!
            </h1>
            <p class="text-xs sm:text-sm text-ink-muted">
              Thank you, {{ orderData?.customerName }}. Your order has been approved.
            </p>
          </div>

          <!-- SECURITY SHIELD GATE: Prompt Phone Verification if User Arrived Unauthenticated -->
          <div
            v-if="isPaymentPaid && !orderData?.isVerifiedCustomer"
            class="p-6 bg-paper-cream/60 border border-gold-400 rounded-2xl space-y-4 shadow-soft"
          >
            <div class="flex items-start gap-3.5">
              <div class="w-9 h-9 rounded-full bg-forest-950 text-gold-300 flex items-center justify-center flex-shrink-0">
                <Lock :size="18" />
              </div>
              <div class="space-y-1">
                <h3 class="font-display font-bold text-sm text-forest-950">Unlock Digital Downloads</h3>
                <p class="text-xs text-ink-muted leading-relaxed">
                  For your privacy, enter the mobile phone number used during checkout to reveal your download links.
                </p>
              </div>
            </div>

            <form class="flex gap-2.5 pt-1" @submit.prevent="handleUnlockDownloads">
              <input
                v-model="verifyPhoneInput"
                type="tel"
                placeholder="e.g. 07XXXXXXXX"
                class="flex-1 px-3.5 py-2 bg-white border border-paper-border rounded-xl text-xs font-mono outline-none focus:border-forest-900"
                required
              />
              <button
                type="submit"
                class="bg-forest-950 text-paper hover:bg-forest-900 text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-subtle cursor-pointer disabled:opacity-50"
                :disabled="isVerifyingPhone"
              >
                {{ isVerifyingPhone ? 'Verifying...' : 'Unlock Downloads' }}
              </button>
            </form>
          </div>

          <!-- Digital eBook Download Cards (Revealed once verified) -->
          <div v-if="hasDigitalDownloads" class="space-y-3.5">
            <div class="flex items-center justify-between">
              <h3 class="font-display font-bold text-sm text-forest-950 uppercase tracking-wider flex items-center gap-2">
                <Download :size="16" class="text-gold-600" /> Your Digital Editions (Cloudflare R2)
              </h3>
              <span class="text-[10px] text-emerald-800 font-mono font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Access Valid: 90 Days
              </span>
            </div>

            <div class="grid sm:grid-cols-2 gap-3.5">
              <div
                v-for="dl in orderData!.downloads"
                :key="dl.token"
                class="p-4 sm:p-5 bg-paper-cream/60 border border-emerald-300/80 rounded-2xl space-y-3.5 flex flex-col justify-between shadow-soft hover:shadow-medium transition-shadow"
              >
                <div class="space-y-1">
                  <span class="text-[9px] font-mono font-extrabold uppercase px-2 py-0.5 rounded-md bg-forest-950 text-gold-300">
                    {{ dl.format.toUpperCase() }} EBOOK
                  </span>
                  <h4 class="text-xs sm:text-sm font-bold text-forest-950 mt-1 line-clamp-1">{{ dl.bookTitle }}</h4>
                  <p class="text-[11px] text-ink-muted">Downloads remaining: {{ dl.maxDownloads - dl.downloadCount }}</p>
                </div>

                <a
                  :href="`/api/books/download/${dl.token}?redirect=true`"
                  target="_blank"
                  class="bg-forest-950 hover:bg-forest-900 text-paper text-xs font-bold uppercase tracking-wider py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-subtle cursor-pointer active:scale-[0.98]"
                >
                  <Download :size="14" class="text-gold-300" />
                  <span>Download {{ dl.format.toUpperCase() }}</span>
                </a>
              </div>
            </div>
          </div>

          <!-- Physical Delivery Handover Code -->
          <div
            v-if="orderData?.deliveryConfirmationCode"
            class="p-6 bg-paper-cream/50 border-2 border-dashed border-gold-500/60 rounded-2xl text-center space-y-2.5 shadow-soft"
          >
            <span class="text-xs font-bold uppercase text-forest-950 flex items-center justify-center gap-1.5 tracking-wider font-mono">
              <KeyRound :size="15" class="text-gold-600" /> Delivery Handover Code
            </span>
            <div class="flex items-center justify-center gap-3">
              <span class="font-mono text-2xl sm:text-3xl font-extrabold text-forest-950 tracking-widest bg-white px-6 py-2 rounded-xl border border-paper-border shadow-xs">
                {{ orderData.deliveryConfirmationCode.split('').join('  •  ') }}
              </span>
              <button
                type="button"
                class="p-2.5 bg-white rounded-xl border border-paper-border hover:bg-paper-cream transition-colors cursor-pointer shadow-xs"
                title="Copy verification code"
                @click="copyConfirmationCode"
              >
                <component :is="isCodeCopied ? Check : Copy" :size="16" :class="isCodeCopied ? 'text-emerald-700' : 'text-forest-950'" />
              </button>
            </div>
            <p class="text-[11px] text-ink-muted max-w-sm mx-auto">
              Please share this 4-digit code with your courier upon arrival to confirm safe delivery handover.
            </p>
          </div>

          <!-- Order Summary Details -->
          <div class="border-t border-paper-border pt-4 space-y-2.5 text-xs">
            <div class="flex justify-between items-center text-ink-muted">
              <span>Order Reference</span>
              <span class="font-mono font-bold text-forest-950">#{{ orderData?.orderId.slice(0, 8).toUpperCase() }}</span>
            </div>
            <div class="flex justify-between items-center text-ink-muted">
              <span>Destination</span>
              <span class="font-medium text-forest-950 truncate max-w-xs">{{ orderData?.deliveryLocation }}</span>
            </div>
            <div class="flex justify-between items-center pt-2.5 border-t border-paper-border text-sm font-bold text-forest-950">
              <span>Total Paid</span>
              <span class="font-display font-extrabold text-forest-900 font-mono tabular-figure text-base sm:text-lg">
                {{ orderData ? formatCurrency(orderData.total) : '' }}
              </span>
            </div>
          </div>

          <!-- Navigation & WhatsApp Sharing -->
          <div class="pt-2 flex flex-wrap gap-3.5">
            <a
              :href="whatsappShareUrl"
              target="_blank"
              class="flex-1 min-w-[200px] border border-emerald-600/40 bg-emerald-50 hover:bg-emerald-100 text-forest-950 text-xs font-bold uppercase py-3.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-2xs"
            >
              <Share2 :size="15" class="text-emerald-800" /> Share Order on WhatsApp
            </a>

            <NuxtLink
              to="/"
              class="flex-1 min-w-[200px] bg-forest-950 hover:bg-forest-900 text-paper text-xs font-bold uppercase py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-medium cursor-pointer"
            >
              <ShoppingBag :size="15" class="text-gold-300" /> Return to Catalog <ArrowRight :size="14" />
            </NuxtLink>
          </div>
        </div>
      </div>
    </main>

    <ToastContainer />
  </div>
</template>