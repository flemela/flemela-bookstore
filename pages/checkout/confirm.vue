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
  ShoppingBag,
  ArrowRight,
  KeyRound,
  RefreshCw,
  Clock,
  Truck,
  Store,
  MessageCircle,
} from 'lucide-vue-next';
import TopUtilityBar from '~/components/storefront/TopUtilityBar.vue';
import BookstoreHeader from '~/components/storefront/BookstoreHeader.vue';
import ToastContainer from '~/components/ui/ToastContainer.vue';
import { useToast } from '~/composables/useToast';

const route = useRoute();
const router = useRouter();
const { push: pushToast } = useToast();

const orderId = computed(() => (route.query.orderId as string) || '');
const phoneParam = computed(() => (route.query.phone as string) || '');

// Hydrate phone from URL or checkout session storage to prevent the double-form re-entry barrier
const savedPhone = process.client ? sessionStorage.getItem('flemela_last_checkout_phone') || '' : '';
const activePhone = ref(phoneParam.value || savedPhone);

interface OrderStatusPayload {
  orderId: string;
  customerName: string;
  total: number;
  status: 'pending' | 'confirmed' | 'assigned' | 'out_for_delivery' | 'delivered' | 'cancelled';
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'failed';
  paymentReference: string | null;
  mpesaReceiptNumber: string | null;
  checkoutRequestId?: string | null;
  deliveryType: 'delivery' | 'pickup';
  deliveryFee: number;
  deliveryFeeStatus: 'known' | 'needs_merchant_confirmation';
  deliveryConfirmationCode: string | null;
  deliveryLocation: string;
  items: Array<{
    productName: string;
    variantTitle?: string | null;
    unitPrice: number;
    quantity: number;
    subtotal: number;
  }>;
  downloads: Array<{
    bookTitle: string;
    format: string;
    token: string;
    downloadUrl: string;
    expiresAt: string;
    maxDownloads: number;
    downloadCount: number;
  }>;
  isVerifiedCustomer: boolean;
}

const orderData = ref<OrderStatusPayload | null>(null);
const isManualChecking = ref(false);
let pollInterval: ReturnType<typeof setInterval> | undefined;

const pollAttempts = ref(0);
const MAX_POLL_ATTEMPTS = 30;
const isCodeCopied = ref(false);

function formatCurrency(val: number): string {
  return `KSh ${val.toLocaleString('en-KE')}`;
}

const isCashOrder = computed(() => orderData.value?.paymentMethod === 'mpesa_cash');
const isDirectMpesa = computed(() => orderData.value?.paymentMethod === 'mpesa_manual');
const isAutomatedSTK = computed(() => orderData.value?.paymentMethod === 'mpesa' || orderData.value?.paymentMethod === 'mpesa_direct');

const isPaymentPaid = computed(() => orderData.value?.paymentStatus === 'paid');
const isPaymentFailed = computed(() => orderData.value?.paymentStatus === 'failed');

const hasDigitalDownloads = computed(() => {
  return orderData.value && orderData.value.downloads && orderData.value.downloads.length > 0;
});

async function fetchStatus(phoneToUse = activePhone.value): Promise<void> {
  if (!orderId.value) return;

  pollAttempts.value++;

  try {
    const data = await $fetch<OrderStatusPayload>(`/api/orders/${orderId.value}/status`, {
      query: { phone: phoneToUse || undefined },
    });
    orderData.value = data;

    // For cash orders or settled payments, stop polling immediately
    if (data.paymentStatus === 'paid' || data.paymentStatus === 'failed' || isCashOrder.value) {
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

async function handleManualCheckStatus(): Promise<void> {
  isManualChecking.value = true;
  try {
    await fetchStatus();
    if (orderData.value?.paymentStatus === 'paid') {
      pushToast({ message: 'Payment approved by administrator!', variant: 'success' });
      stopTimers();
    } else {
      pushToast({ message: 'Payment status is currently under review.', variant: 'info' });
    }
  } finally {
    isManualChecking.value = false;
  }
}

function startTimers(): void {
  stopTimers();
  // Only poll if automated STK or awaiting manual admin flip
  if (!isCashOrder.value) {
    pollAttempts.value = 0;
    pollInterval = setInterval(() => fetchStatus(), 3500);
  }
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
  fetchStatus().then(() => {
    startTimers();
  });
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

const whatsappHelpUrl = computed(() => {
  if (!orderData.value) return 'https://wa.me/254700000000';
  const orderRef = orderData.value.orderId.slice(0, 8).toUpperCase();
  const paymentRef = orderData.value.paymentReference ? ` (M-Pesa Ref: ${orderData.value.paymentReference})` : '';
  const text = `Hello Flemela Bookstore Concierge, I am following up on my Order #${orderRef}${paymentRef}. Customer: ${orderData.value.customerName}.`;
  return `https://wa.me/254700000000?text=${encodeURIComponent(text)}`;
});
</script>

<template>
  <div class="min-h-screen flex flex-col bg-paper-canvas text-ink antialiased">
    <TopUtilityBar />
    <BookstoreHeader />

    <main class="max-w-3xl mx-auto w-full py-8 sm:py-12 px-4 sm:px-6 flex-1">
      <div class="bg-paper-surface rounded-2xl shadow-card border border-paper-border p-6 sm:p-9 space-y-7">
        
        <!-- =================================================================== -->
        <!-- STATE 1: CASH ON DELIVERY / STORE PICKUP (INSTANT ACKNOWLEDGMENT)    -->
        <!-- =================================================================== -->
        <div v-if="isCashOrder" class="space-y-6">
          <div class="text-center space-y-2 pb-5 border-b border-paper-border">
            <div class="w-13 h-13 bg-emerald-100 text-forest-950 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 :size="28" class="text-emerald-800" />
            </div>
            <span class="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Order Confirmed &amp; Queued
            </span>
            <h1 class="font-display text-2xl sm:text-3xl font-extrabold text-forest-950">
              We've Received Your Order!
            </h1>
            <p class="text-xs sm:text-sm text-ink-muted max-w-md mx-auto">
              Thank you, <strong>{{ orderData?.customerName }}</strong>. Your reading items are being prepped at our Sarit Centre hub.
            </p>
          </div>

          <!-- Cash Payment Notice Banner -->
          <div class="p-4 bg-paper-cream/60 border border-gold-300 rounded-2xl flex items-start gap-3.5 shadow-2xs">
            <div class="w-9 h-9 rounded-xl bg-forest-950 text-gold-300 flex items-center justify-center flex-shrink-0 mt-0.5">
              <component :is="orderData?.deliveryType === 'pickup' ? Store : Truck" :size="18" />
            </div>
            <div class="space-y-1 text-xs">
              <strong class="text-forest-950 font-bold block">
                {{ orderData?.deliveryType === 'pickup' ? 'Payment Due Upon Store Pickup' : 'Payment Due Upon Handover' }}
              </strong>
              <p class="text-ink-muted leading-relaxed">
                You will settle <strong>{{ orderData ? formatCurrency(orderData.total) : '' }}</strong> via M-Pesa or Cash 
                {{ orderData?.deliveryType === 'pickup' ? 'at our bookstore counter' : 'to your dispatch courier upon arrival' }}.
              </p>
            </div>
          </div>
        </div>

        <!-- =================================================================== -->
        <!-- STATE 2: DIRECT TILL TRANSFER (MANUAL REFERENCE SUBMITTED)          -->
        <!-- =================================================================== -->
        <div v-else-if="isDirectMpesa && !isPaymentPaid" class="space-y-6">
          <div class="bg-paper-cream/70 border border-gold-400/60 rounded-2xl p-6 sm:p-7 space-y-4 shadow-soft">
            <div class="flex items-start gap-4">
              <div class="w-10 h-10 rounded-full bg-gold-500 text-forest-950 flex items-center justify-center shadow-xs flex-shrink-0">
                <Clock :size="20" />
              </div>
              <div class="space-y-1 flex-1">
                <span class="text-[10px] font-mono uppercase font-bold tracking-wider text-gold-600 block">
                  Reference Received • Pending Verification
                </span>
                <h2 class="font-display font-bold text-base sm:text-lg text-forest-950">
                  Payment Verification Underway
                </h2>
                <p class="text-xs sm:text-sm text-ink-muted leading-relaxed">
                  Thank you, <strong>{{ orderData?.customerName }}</strong>! We have received your M-Pesa reference and our concierge team is verifying the deposit.
                </p>
              </div>
            </div>

            <!-- Reference Card -->
            <div class="bg-white rounded-xl p-4 border border-paper-border text-xs text-forest-950 space-y-2 shadow-2xs">
              <div class="flex justify-between items-center text-ink-muted">
                <span>Submitted M-Pesa Code:</span>
                <span class="font-mono font-bold text-forest-950 text-sm tracking-wider uppercase bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                  {{ orderData?.paymentReference || 'RECORDED' }}
                </span>
              </div>
              <div class="flex justify-between items-center text-ink-muted">
                <span>Total Amount:</span>
                <span class="font-mono font-bold text-forest-950 tabular-figure">
                  {{ orderData ? formatCurrency(orderData.total) : '' }}
                </span>
              </div>
            </div>

            <!-- Concierge Fast-Track Action -->
            <div class="flex flex-wrap items-center justify-between gap-3 pt-1">
              <span class="text-[11px] text-ink-muted flex items-center gap-1.5 font-medium">
                <span class="w-2 h-2 rounded-full bg-gold-500 animate-pulse" />
                <span>eBook download links unlock automatically upon approval.</span>
              </span>

              <div class="flex items-center gap-2">
                <a
                  :href="whatsappHelpUrl"
                  target="_blank"
                  class="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                >
                  <MessageCircle :size="13" class="text-emerald-700" />
                  <span>Fast-Track on WhatsApp</span>
                </a>

                <button
                  type="button"
                  class="px-3 py-1.5 bg-forest-950 hover:bg-forest-900 text-paper text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-subtle cursor-pointer transition-all disabled:opacity-50"
                  :disabled="isManualChecking"
                  @click="handleManualCheckStatus"
                >
                  <RefreshCw :size="12" :class="{ 'animate-spin': isManualChecking }" />
                  <span>Check Status</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- =================================================================== -->
        <!-- STATE 3: AUTOMATED STK PUSH PENDING                                 -->
        <!-- =================================================================== -->
        <div v-else-if="isAutomatedSTK && !isPaymentPaid && !isPaymentFailed" class="space-y-6">
          <div class="bg-paper-cream/60 border border-gold-400/40 rounded-2xl p-6 sm:p-7 flex items-start gap-4 shadow-soft">
            <div class="space-y-1.5 flex-1">
              <span class="text-[10px] font-mono uppercase font-bold tracking-wider text-gold-600 block">
                Safaricom STK Prompt Sent
              </span>
              <h2 class="font-display font-bold text-base sm:text-lg text-forest-950">
                Check your mobile screen
              </h2>
              <p class="text-xs sm:text-sm text-ink-muted leading-relaxed">
                Enter your <strong>M-Pesa PIN</strong> to approve payment of
                <strong class="text-forest-900 font-mono">{{ orderData ? formatCurrency(orderData.total) : 'your order' }}</strong>.
              </p>
              <div class="flex items-center gap-2 text-[11px] font-bold text-gold-600 pt-2">
                <span class="w-2 h-2 rounded-full bg-gold-500 animate-pulse" />
                <span>Awaiting Safaricom confirmation...</span>
              </div>
            </div>
          </div>
        </div>

        <!-- =================================================================== -->
        <!-- STATE 4: PAYMENT FAILED                                             -->
        <!-- =================================================================== -->
        <div v-else-if="isPaymentFailed" class="bg-red-50 border border-red-200 rounded-2xl p-6 sm:p-7 flex items-start gap-4 shadow-soft">
          <AlertTriangle :size="24" class="text-red-600 flex-shrink-0 mt-0.5" />
          <div class="space-y-2 flex-1">
            <h2 class="font-display font-bold text-base sm:text-lg text-red-900">Payment Incomplete</h2>
            <p class="text-xs sm:text-sm text-red-800">
              The payment prompt was cancelled or expired. You can return to checkout to retry or use another payment method.
            </p>
            <NuxtLink to="/checkout" class="inline-flex items-center gap-1.5 text-xs font-bold text-forest-900 hover:underline pt-1">
              <RotateCcw :size="13" /> Return to Checkout
            </NuxtLink>
          </div>
        </div>

        <!-- =================================================================== -->
        <!-- FULFILLMENT & SUMMARY (Active for Cash, Approved M-Pesa, or Delivered) -->
        <!-- =================================================================== -->
        <div v-if="isPaymentPaid || isCashOrder || orderData?.status === 'confirmed' || orderData?.status === 'delivered'" class="space-y-6">
          
          <!-- Payment Approved Banner -->
          <div v-if="isPaymentPaid && !isCashOrder" class="text-center space-y-2 pb-5 border-b border-paper-border">
            <div class="w-13 h-13 bg-emerald-100 text-forest-950 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 :size="28" class="text-emerald-800" />
            </div>
            <span class="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Payment Verified
            </span>
            <h1 class="font-display text-2xl sm:text-3xl font-extrabold text-forest-950">
              Order Verified &amp; Ready!
            </h1>
            <p class="text-xs sm:text-sm text-ink-muted">
              Thank you, {{ orderData?.customerName }}. Your order is confirmed.
            </p>
          </div>

          <!-- Digital eBook Download Cards -->
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

          <!-- Physical Delivery Handover Code (Only for Physical Deliveries) -->
          <div
            v-if="orderData?.deliveryConfirmationCode && orderData?.deliveryType === 'delivery'"
            class="p-5 sm:p-6 bg-paper-cream/50 border-2 border-dashed border-gold-500/60 rounded-2xl text-center space-y-2 shadow-soft"
          >
            <span class="text-xs font-bold uppercase text-forest-950 flex items-center justify-center gap-1.5 tracking-wider font-mono">
              <KeyRound :size="15" class="text-gold-600" /> Courier Delivery Handover Code
            </span>
            <div class="flex items-center justify-center gap-3">
              <span class="font-mono text-2xl sm:text-3xl font-extrabold text-forest-950 tracking-widest bg-white px-6 py-1.5 rounded-xl border border-paper-border shadow-xs">
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
              Read this 4-digit code to your dispatch rider upon delivery to confirm safe handover.
            </p>
          </div>

          <!-- Order Summary Details -->
          <div class="border-t border-paper-border pt-4 space-y-2.5 text-xs">
            <div class="flex justify-between items-center text-ink-muted">
              <span>Order Reference</span>
              <span class="font-mono font-bold text-forest-950">#{{ orderData?.orderId.slice(0, 8).toUpperCase() }}</span>
            </div>
            <div class="flex justify-between items-center text-ink-muted">
              <span>Payment Mode</span>
              <span class="font-mono font-bold text-forest-950 uppercase">
                {{ orderData?.paymentMethod === 'mpesa_cash' ? 'Cash on Delivery' : (orderData?.paymentMethod === 'mpesa_manual' ? 'Direct M-Pesa Till' : 'Automated M-Pesa') }}
              </span>
            </div>
            <div v-if="orderData?.paymentReference" class="flex justify-between items-center text-ink-muted">
              <span>M-Pesa Reference</span>
              <span class="font-mono font-bold text-forest-950 uppercase bg-slate-100 px-2 py-0.5 rounded border">
                {{ orderData.paymentReference }}
              </span>
            </div>
            <div class="flex justify-between items-center text-ink-muted">
              <span>Fulfillment Location</span>
              <span class="font-medium text-forest-950 truncate max-w-xs">{{ orderData?.deliveryLocation }}</span>
            </div>
            <div class="flex justify-between items-baseline pt-2.5 border-t border-paper-border text-sm font-bold text-forest-950">
              <span>Total Bill</span>
              <span class="font-display font-extrabold text-forest-900 font-mono tabular-figure text-base sm:text-lg">
                {{ orderData ? formatCurrency(orderData.total) : '' }}
              </span>
            </div>
          </div>

          <!-- WhatsApp & Return CTA -->
          <div class="pt-2 flex flex-wrap gap-3.5">
            <a
              :href="whatsappHelpUrl"
              target="_blank"
              class="flex-1 min-w-[200px] border border-emerald-600/40 bg-emerald-50 hover:bg-emerald-100 text-forest-950 text-xs font-bold uppercase py-3.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-2xs"
            >
              <MessageCircle :size="15" class="text-emerald-800" /> WhatsApp Concierge Desk
            </a>

            <NuxtLink
              to="/"
              class="flex-1 min-w-[200px] bg-forest-950 hover:bg-forest-900 text-paper text-xs font-bold uppercase py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-medium cursor-pointer"
            >
              <ShoppingBag :size="15" class="text-gold-300" /> Return to Bookstore <ArrowRight :size="14" />
            </NuxtLink>
          </div>
        </div>

      </div>
    </main>

    <ToastContainer />
  </div>
</template>