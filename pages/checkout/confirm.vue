<!-- pages/checkout/confirm.vue -->
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import {
  CheckCircle2,
  AlertTriangle,
  Download,
  Copy,
  Check,
  ShoppingBag,
  ArrowRight,
  KeyRound,
  RefreshCw,
  Clock,
  MessageCircle,
  Zap,
  MailCheck,
} from 'lucide-vue-next';
import PromoTickerStrip from '~/components/storefront/PromoTickerStrip.vue';
import StoreNavbar from '~/components/storefront/StoreNavbar.vue';
import Breadcrumbs from '~/components/storefront/Breadcrumbs.vue';
import ToastContainer from '~/components/ui/ToastContainer.vue';
import { useToast } from '~/composables/useToast';
import { normalizeKenyanPhone, isValidKenyanPhone, buildWhatsAppLink } from '~/utils/phone';

const route = useRoute();
const router = useRouter();
const { push: pushToast } = useToast();

const orderId = computed(() => (route.query.orderId as string) || '');
const phoneParam = computed(() => (route.query.phone as string) || '');

const { data: storeMetadata } = await useFetch<any>('/api/stores/current');
const tickerItems = computed(() => storeMetadata.value?.promo_ticker || []);

// Hydrate phone from URL or checkout session storage
const savedPhone = process.client ? sessionStorage.getItem('flemela_last_checkout_phone') || '' : '';
const savedEmail = process.client ? sessionStorage.getItem('flemela_last_checkout_email') || '' : '';
const activePhone = ref(phoneParam.value || savedPhone);

interface DownloadItem {
  bookTitle: string;
  format: string;
  token: string;
  downloadUrl: string;
  expiresAt: string;
  maxDownloads: number;
  downloadCount: number;
}

interface OrderStatusPayload {
  orderId: string;
  customerName: string;
  customerEmail: string | null;
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
  notes: string | null;
  items: Array<{
    productName: string;
    variantTitle?: string | null;
    unitPrice: number;
    quantity: number;
    subtotal: number;
  }>;
  downloads: DownloadItem[];
  isVerifiedCustomer: boolean;
}

const orderData = ref<OrderStatusPayload | null>(null);
const isCheckingStatus = ref(false);
let pollInterval: ReturnType<typeof setInterval> | undefined;

const pollAttempts = ref(0);
const MAX_POLL_ATTEMPTS = 30;
const isCodeCopied = ref(false);

const stkCountdown = ref(60);
let countdownTimer: ReturnType<typeof setInterval> | undefined;

const showPaymentRecovery = ref(false);
const recoveryMethod = ref<'mpesa' | 'mpesa_manual' | 'mpesa_cash'>('mpesa');
const recoveryPhone = ref(activePhone.value);
const recoveryMpesaCode = ref('');
const isSubmittingRecovery = ref(false);

const hasTriggeredAutoDownload = ref(false);

function formatCurrency(val: number): string {
  return `KSh ${val.toLocaleString('en-KE')}`;
}

const isCashOrder = computed(() => orderData.value?.paymentMethod === 'mpesa_cash');
const isDirectMpesa = computed(() => orderData.value?.paymentMethod === 'mpesa_manual');
const isAutomatedSTK = computed(() => orderData.value?.paymentMethod === 'mpesa' || orderData.value?.paymentMethod === 'mpesa_direct');

const isPaymentPaid = computed(() => orderData.value?.paymentStatus === 'paid');
const isPaymentFailed = computed(() => orderData.value?.paymentStatus === 'failed');
const isPaymentPending = computed(() => orderData.value?.paymentStatus === 'pending');

const hasDigitalDownloads = computed(() => {
  return Boolean(orderData.value && orderData.value.downloads && orderData.value.downloads.length > 0);
});

const customerEmailDisplay = computed(() => {
  return orderData.value?.customerEmail || savedEmail || 'your email';
});

const paymentMethodLabel = computed(() => {
  if (orderData.value?.paymentMethod === 'mpesa_cash') return 'Cash on Delivery';
  if (orderData.value?.paymentMethod === 'mpesa_manual') return 'Direct M-Pesa Till';
  return 'Automated M-Pesa';
});

const formattedConfirmationCode = computed(() => {
  return orderData.value?.deliveryConfirmationCode
    ? orderData.value.deliveryConfirmationCode.split('').join(' • ')
    : '';
});

const orderReferenceDisplay = computed(() => {
  return orderData.value?.orderId ? `#${orderData.value.orderId.slice(0, 8).toUpperCase()}` : '';
});

const breadcrumbItems = computed(() => [
  { label: 'Home', to: '/' },
  { label: 'Orders', to: '/#catalog-results' },
  { label: orderReferenceDisplay.value || 'Confirmation' },
]);

async function fetchStatus(phoneToUse = activePhone.value): Promise<void> {
  if (!orderId.value) return;

  pollAttempts.value++;

  try {
    const data = await $fetch<OrderStatusPayload>(`/api/orders/${orderId.value}/status`, {
      query: { phone: phoneToUse || undefined },
    });
    orderData.value = data;

    if (data.paymentStatus === 'paid' && data.downloads && data.downloads.length > 0 && !hasTriggeredAutoDownload.value) {
      triggerAutomaticDownload(data.downloads[0]);
    }

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

function triggerAutomaticDownload(item: DownloadItem): void {
  if (typeof window === 'undefined') return;
  hasTriggeredAutoDownload.value = true;

  const downloadUrl = `/api/books/download/${item.token}?redirect=true`;
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.setAttribute('download', `${item.bookTitle}.${item.format}`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  pushToast({
    message: `Your eBook download (${item.format.toUpperCase()}) has started automatically!`,
    variant: 'success',
  });
}

function startCountdown(): void {
  stkCountdown.value = 60;
  if (countdownTimer) clearInterval(countdownTimer);
  countdownTimer = setInterval(() => {
    if (stkCountdown.value > 0) {
      stkCountdown.value--;
    } else {
      if (countdownTimer) clearInterval(countdownTimer);
    }
  }, 1000);
}

function startTimers(): void {
  stopTimers();
  if (isAutomatedSTK.value && !isPaymentPaid.value) {
    startCountdown();
  }
  if (!isCashOrder.value && !isPaymentPaid.value && !isPaymentFailed.value) {
    pollAttempts.value = 0;
    pollInterval = setInterval(() => fetchStatus(), 3500);
  }
}

function stopTimers(): void {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = undefined;
  }
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = undefined;
  }
}

async function handleManualCheckStatus(): Promise<void> {
  isCheckingStatus.value = true;
  try {
    await fetchStatus();
    if (orderData.value?.paymentStatus === 'paid') {
      pushToast({ message: 'Payment confirmed! Digital items unlocked.', variant: 'success' });
    } else if (orderData.value?.paymentStatus === 'failed') {
      pushToast({ message: 'Payment was not received or failed.', variant: 'error' });
    } else {
      pushToast({ message: 'Status is currently being verified. Please wait a moment.', variant: 'info' });
    }
  } finally {
    isCheckingStatus.value = false;
  }
}

async function handleRetryOrSwitchPayment(): Promise<void> {
  if (recoveryMethod.value === 'mpesa' && !isValidKenyanPhone(recoveryPhone.value)) {
    pushToast({ message: 'Enter a valid Kenyan phone number (e.g. 07XXXXXXXX)', variant: 'error' });
    return;
  }

  if (recoveryMethod.value === 'mpesa_manual' && !recoveryMpesaCode.value.trim()) {
    pushToast({ message: 'Enter your M-Pesa transaction reference code', variant: 'error' });
    return;
  }

  isSubmittingRecovery.value = true;
  try {
    const cleanPhone = normalizeKenyanPhone(recoveryPhone.value);
    await $fetch(`/api/orders/${orderId.value}/retry-payment`, {
      method: 'POST',
      body: {
        paymentMethod: recoveryMethod.value,
        phone: cleanPhone,
        mpesaCode: recoveryMethod.value === 'mpesa_manual' ? recoveryMpesaCode.value.trim().toUpperCase() : null,
      },
    });

    pushToast({ message: 'Payment method updated! Initiating verification...', variant: 'success' });
    showPaymentRecovery.value = false;
    activePhone.value = cleanPhone;

    await fetchStatus(cleanPhone);
    startTimers();
  } catch (err: any) {
    pushToast({ message: err.data?.message || err.statusMessage || 'Failed to update payment method', variant: 'error' });
  } finally {
    isSubmittingRecovery.value = false;
  }
}

function handleSearch(queryText: string): void {
  router.push({ path: '/', query: { q: queryText } });
}

function handleCategorySelect(category: string): void {
  router.push({ path: '/', query: { category } });
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
  if (!orderData.value) {
    return buildWhatsAppLink('Hello The Sunrise Bookstore Concierge, I need assistance with my book order.');
  }
  const orderRef = orderData.value.orderId.slice(0, 8).toUpperCase();
  const paymentRef = orderData.value.paymentReference ? ` (M-Pesa Ref: ${orderData.value.paymentReference})` : '';
  const text = `Hello The Sunrise Bookstore Concierge, I need assistance with Order #${orderRef}${paymentRef}. Customer: ${orderData.value.customerName}.`;
  return buildWhatsAppLink(text);
});
</script>

<template>
	<div class="min-h-screen flex flex-col bg-paper-canvas text-[#141E1A] antialiased font-sans">
		<PromoTickerStrip :messages="tickerItems" />
		<StoreNavbar @search="handleSearch" @select-category="handleCategorySelect" />

		<main class="max-w-3xl mx-auto w-full py-4 sm:py-6 px-4 sm:px-6 flex-1 space-y-4">
			<Breadcrumbs :items="breadcrumbItems" />

			<div class="bg-white rounded-2xl shadow-card border border-slate-200/80 p-6 sm:p-9 space-y-7">

				<!-- STATE A: PAYMENT PENDING (STK / DIRECT TILL) -->
				<div v-if="isPaymentPending && !isCashOrder" class="space-y-6">
					<!-- 1. Automated STK Push Pending Radar -->
					<div v-if="isAutomatedSTK"
						class="bg-[#FFF7ED] border border-[#FFEDD5] rounded-2xl p-6 sm:p-7 space-y-4 shadow-soft">
						<div class="flex items-start gap-4">
							<div class="relative w-11 h-11 flex items-center justify-center flex-shrink-0 mt-0.5">
								<span class="absolute w-full h-full rounded-full bg-[#E8750D]/20 animate-ping" />
								<div
									class="w-10 h-10 rounded-full bg-[#E8750D] text-white flex items-center justify-center shadow-xs">
									<Zap :size="20" />
								</div>
							</div>

							<div class="space-y-1.5 flex-1">
								<div class="flex items-center justify-between">
									<span
										class="text-[10px] font-mono uppercase font-bold tracking-wider text-[#C25E00]">
										Safaricom STK Prompt Sent
									</span>
									<span
										class="text-xs font-mono font-bold text-[#141E1A] bg-white px-2 py-0.5 rounded border border-slate-200">
										{{ stkCountdown }}s
									</span>
								</div>
								<h2 class="font-display font-bold text-base sm:text-lg text-[#141E1A]">
									Please Check Your Mobile Screen
								</h2>
								<p class="text-xs sm:text-sm text-[#5F6964] leading-relaxed">
									Enter your <strong>M-Pesa PIN</strong> to authorize payment of
									<strong class="text-[#141E1A] font-mono">{{ orderData ?
										formatCurrency(orderData.total) : 'your order' }}</strong>.
								</p>
							</div>
						</div>

						<!-- Recovery & Status Bar -->
						<div
							class="pt-3 border-t border-orange-200/60 flex flex-wrap items-center justify-between gap-3 text-xs">
							<div class="flex items-center gap-2 font-medium text-[#5F6964]">
								<span class="w-2 h-2 rounded-full bg-[#E8750D] animate-pulse" />
								<span>Listening for Safaricom confirmation...</span>
							</div>

							<div class="flex items-center gap-2">
								<button type="button"
									class="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg font-semibold text-[#141E1A] transition-colors cursor-pointer text-xs"
									@click="showPaymentRecovery = !showPaymentRecovery">
									Change Payment Method
								</button>

								<button type="button"
									class="px-3.5 py-1.5 bg-[#141E1A] hover:bg-black text-white rounded-lg font-bold flex items-center gap-1.5 shadow-subtle cursor-pointer transition-all disabled:opacity-50 text-xs"
									:disabled="isCheckingStatus" @click="handleManualCheckStatus">
									<RefreshCw :size="12" :class="{ 'animate-spin': isCheckingStatus }" />
									<span>Check Status</span>
								</button>
							</div>
						</div>
					</div>

					<!-- 2. Direct Till Transfer (Manual Reference Submitted) -->
					<div v-else-if="isDirectMpesa"
						class="bg-[#FFF7ED] border border-[#FFEDD5] rounded-2xl p-6 sm:p-7 space-y-4 shadow-soft">
						<div class="flex items-start gap-4">
							<div
								class="w-10 h-10 rounded-full bg-[#E8750D] text-white flex items-center justify-center shadow-xs flex-shrink-0">
								<Clock :size="20" />
							</div>
							<div class="space-y-1 flex-1">
								<span
									class="text-[10px] font-mono uppercase font-bold tracking-wider text-[#C25E00] block">
									Reference Received • Under Verification
								</span>
								<h2 class="font-display font-bold text-base sm:text-lg text-[#141E1A]">
									Verifying Your M-Pesa Deposit
								</h2>
								<p class="text-xs sm:text-sm text-[#5F6964] leading-relaxed">
									Thank you, <strong>{{ orderData?.customerName }}</strong>. Our team is validating
									your reference code against our till records.
								</p>
							</div>
						</div>

						<div
							class="bg-white rounded-xl p-4 border border-slate-200 text-xs text-[#141E1A] space-y-2 shadow-2xs">
							<div class="flex justify-between items-center text-[#5F6964]">
								<span>Submitted Code:</span>
								<span
									class="font-mono font-bold text-[#141E1A] text-sm tracking-wider uppercase bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
									{{ orderData?.paymentReference || 'SUBMITTED' }}
								</span>
							</div>
							<div class="flex justify-between items-center text-[#5F6964]">
								<span>Total Amount:</span>
								<span class="font-mono font-bold text-[#141E1A] tabular-figure">
									{{ orderData ? formatCurrency(orderData.total) : '' }}
								</span>
							</div>
						</div>

						<div class="flex flex-wrap items-center justify-between gap-3 pt-1">
							<span class="text-[11px] text-[#5F6964] flex items-center gap-1.5 font-medium">
								<span class="w-2 h-2 rounded-full bg-[#E8750D] animate-pulse" />
								<span>eBook downloads unlock automatically upon verification.</span>
							</span>

							<div class="flex items-center gap-2">
								<a :href="whatsappHelpUrl" target="_blank" rel="noopener noreferrer"
									class="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs">
									<MessageCircle :size="13" class="text-emerald-700" />
									<span>Verify on WhatsApp</span>
								</a>

								<button type="button"
									class="px-3.5 py-1.5 bg-[#141E1A] hover:bg-black text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-subtle cursor-pointer transition-all disabled:opacity-50"
									:disabled="isCheckingStatus" @click="handleManualCheckStatus">
									<RefreshCw :size="12" :class="{ 'animate-spin': isCheckingStatus }" />
									<span>Check Status</span>
								</button>
							</div>
						</div>
					</div>
				</div>

				<!-- STATE B: PAYMENT REJECTED / FAILED -->
				<div v-else-if="isPaymentFailed"
					class="bg-red-50 border border-red-200 rounded-2xl p-6 sm:p-7 space-y-4 shadow-soft">
					<div class="flex items-start gap-4">
						<AlertTriangle :size="26" class="text-red-600 flex-shrink-0 mt-0.5" />
						<div class="space-y-1 flex-1">
							<span class="text-[10px] font-mono uppercase font-bold tracking-wider text-red-700 block">
								Payment Not Completed
							</span>
							<h2 class="font-display font-bold text-base sm:text-lg text-red-950">
								Payment Request Was Cancelled or Timed Out
							</h2>
							<p class="text-xs sm:text-sm text-red-800 leading-relaxed">
								The prompt was not approved. You can switch to another payment method or re-attempt
								below without re-entering your order.
							</p>
						</div>
					</div>

					<div class="pt-2">
						<button type="button"
							class="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-xs"
							@click="showPaymentRecovery = true">
							Retry / Select Payment Method
						</button>
					</div>
				</div>

				<!-- RECOVERY DRAWER: In-Place Payment Switcher -->
				<div v-if="showPaymentRecovery"
					class="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 shadow-soft animate-in fade-in">
					<div class="flex items-center justify-between border-b border-slate-200 pb-2">
						<h3 class="font-display font-bold text-xs sm:text-sm text-[#141E1A]">
							Select Alternate Payment Method
						</h3>
						<button type="button" class="text-xs text-[#5F6964] underline cursor-pointer"
							@click="showPaymentRecovery = false">
							Close
						</button>
					</div>

					<div class="space-y-2.5 text-xs">
						<label class="flex items-center gap-2 cursor-pointer font-semibold">
							<input type="radio" value="mpesa" v-model="recoveryMethod" />
							<span>Retry Automated M-Pesa STK Push</span>
						</label>

						<div v-if="recoveryMethod === 'mpesa'" class="pl-6 space-y-1">
							<input v-model="recoveryPhone" type="tel" placeholder="07XXXXXXXX or 01XXXXXXXX"
								class="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono w-full max-w-xs outline-none" />
						</div>

						<label class="flex items-center gap-2 cursor-pointer font-semibold">
							<input type="radio" value="mpesa_manual" v-model="recoveryMethod" />
							<span>Pay Directly to Buy Goods Till (174379)</span>
						</label>

						<div v-if="recoveryMethod === 'mpesa_manual'" class="pl-6 space-y-1">
							<input v-model="recoveryMpesaCode" type="text"
								placeholder="Paste new M-Pesa reference (e.g. SH12AB34CD)"
								class="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono uppercase tracking-wider w-full max-w-xs outline-none" />
						</div>
					</div>

					<div class="pt-2 flex justify-end gap-2">
						<button type="button"
							class="px-4 py-2 bg-[#141E1A] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors cursor-pointer disabled:opacity-50"
							:disabled="isSubmittingRecovery" @click="handleRetryOrSwitchPayment">
							{{ isSubmittingRecovery ? 'Submitting...' : 'Submit & Proceed' }}
						</button>
					</div>
				</div>

				<!-- STATE C: PAYMENT ACCEPTED (CONFIRMATION) -->
				<div v-if="isPaymentPaid || isCashOrder || orderData?.status === 'confirmed' || orderData?.status === 'delivered'"
					class="space-y-6">
					<!-- 1. Verified Payment Badge -->
					<div v-if="isPaymentPaid && !isCashOrder"
						class="text-center space-y-2 pb-5 border-b border-slate-100">
						<div
							class="w-13 h-13 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-sm">
							<CheckCircle2 :size="28" class="text-emerald-700" />
						</div>
						<span
							class="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
							Payment Verified &amp; Approved
						</span>
						<h1 class="font-display text-2xl sm:text-3xl font-extrabold text-[#141E1A]">
							Your Books Are Ready!
						</h1>
						<p class="text-xs sm:text-sm text-[#5F6964] max-w-md mx-auto">
							Thank you, <strong>{{ orderData?.customerName }}</strong>. Your reading purchase has been
							approved.
						</p>
					</div>

					<!-- 2. Automatic Email Confirmation Dispatch Notice -->
					<div v-if="hasDigitalDownloads && isPaymentPaid"
						class="p-4 bg-emerald-50/80 border border-emerald-300 rounded-2xl flex items-center gap-3.5 text-xs text-emerald-950 shadow-2xs">
						<div
							class="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
							<MailCheck :size="18" />
						</div>
						<div>
							<strong class="font-semibold text-emerald-900 block">Permanent Backup Dispatched via
								Email</strong>
							<span class="text-emerald-950/80">
								A permanent receipt with direct eBook recovery links has been sent to <strong>{{
									customerEmailDisplay }}</strong>.
							</span>
						</div>
					</div>
					<!-- 3. Digital Downloads Vault -->
					<div v-if="hasDigitalDownloads" class="space-y-3.5">
						<div class="flex items-center justify-between">
							<h3
								class="font-display font-bold text-sm text-[#141E1A] uppercase tracking-wider flex items-center gap-2">
								<Download :size="16" class="text-emerald-700" /> Your Digital Editions (Direct Download)
							</h3>
							<span
								class="text-[10px] text-emerald-800 font-mono font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
								Access Valid: 90 Days
							</span>
						</div>

						<div class="grid sm:grid-cols-2 gap-3.5">
							<div v-for="dl in orderData!.downloads" :key="dl.token"
								class="p-4 sm:p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3.5 flex flex-col justify-between shadow-soft hover:shadow-card transition-shadow">
								<div class="space-y-1">
									<span
										class="text-[9px] font-mono font-extrabold uppercase px-2 py-0.5 rounded-md bg-[#141E1A] text-white">
										{{ dl.format.toUpperCase() }} EBOOK
									</span>
									<h4 class="text-xs sm:text-sm font-bold text-[#141E1A] mt-1 line-clamp-1">{{
										dl.bookTitle }}</h4>
									<p class="text-[11px] text-[#5F6964]">Downloads remaining: {{ dl.maxDownloads -
										dl.downloadCount }}</p>
								</div>

								<a :href="`/api/books/download/${dl.token}?redirect=true`" target="_blank"
									class="bg-[#141E1A] hover:bg-black text-white text-xs font-bold uppercase tracking-wider py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-subtle cursor-pointer active:scale-[0.98]">
									<Download :size="14" class="text-gold-300" />
									<span>Download {{ dl.format.toUpperCase() }}</span>
								</a>
							</div>
						</div>
					</div>

					<!-- 4. Physical Delivery Handover Code -->
					<div v-if="orderData?.deliveryConfirmationCode && orderData?.deliveryType === 'delivery'"
						class="p-5 sm:p-6 bg-slate-50 border-2 border-dashed border-[#E8750D]/40 rounded-2xl text-center space-y-2 shadow-soft">
						<span
							class="text-xs font-bold uppercase text-[#141E1A] flex items-center justify-center gap-1.5 tracking-wider font-mono">
							<KeyRound :size="15" class="text-[#E8750D]" /> Courier Delivery Handover Code
						</span>
						<div class="flex items-center justify-center gap-3">
							<span
								class="font-mono text-2xl sm:text-3xl font-extrabold text-[#141E1A] tracking-widest bg-white px-6 py-1.5 rounded-xl border border-slate-200 shadow-xs">
								{{ formattedConfirmationCode }}
							</span>
							<button type="button"
								class="p-2.5 bg-white rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer shadow-xs"
								title="Copy verification code" @click="copyConfirmationCode">
								<component :is="isCodeCopied ? Check : Copy" :size="16"
									:class="isCodeCopied ? 'text-emerald-700' : 'text-[#141E1A]'" />
							</button>
						</div>
						<p class="text-[11px] text-[#5F6964] max-w-sm mx-auto">
							Read this 4-digit code to your dispatch rider upon delivery to confirm safe handover.
						</p>
					</div>

					<!-- 5. Order Summary -->
					<div class="border-t border-slate-100 pt-4 space-y-2.5 text-xs">
						<div class="flex justify-between items-center text-[#5F6964]">
							<span>Order Reference</span>
							<span class="font-mono font-bold text-[#141E1A]">{{ orderReferenceDisplay }}</span>
						</div>
						<div class="flex justify-between items-center text-[#5F6964]">
							<span>Payment Mode</span>
							<span class="font-mono font-bold text-[#141E1A] uppercase">
								{{ paymentMethodLabel }}
							</span>
						</div>
						<div v-if="orderData?.paymentReference"
							class="flex justify-between items-center text-[#5F6964]">
							<span>M-Pesa Reference</span>
							<span
								class="font-mono font-bold text-[#141E1A] uppercase bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
								{{ orderData.paymentReference }}
							</span>
						</div>
						<div class="flex justify-between items-center text-[#5F6964]">
							<span>Fulfillment Location</span>
							<span class="font-medium text-[#141E1A] truncate max-w-xs">{{ orderData?.deliveryLocation
								}}</span>
						</div>
						<div
							class="flex justify-between items-baseline pt-2.5 border-t border-slate-100 text-sm font-bold text-[#141E1A]">
							<span>Total Amount</span>
							<span
								class="font-display font-extrabold text-[#141E1A] font-mono tabular-figure text-base sm:text-lg">
								{{ orderData ? formatCurrency(orderData.total) : '' }}
							</span>
						</div>
					</div>

					<!-- Actions -->
					<div class="pt-2 flex flex-wrap gap-3.5">
						<a :href="whatsappHelpUrl" target="_blank" rel="noopener noreferrer"
							class="flex-1 min-w-[200px] border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 text-xs font-bold uppercase py-3.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-2xs cursor-pointer">
							<MessageCircle :size="15" class="text-emerald-700" /> WhatsApp Concierge Desk
						</a>

						<NuxtLink to="/"
							class="flex-1 min-w-[200px] bg-[#141E1A] hover:bg-black text-white text-xs font-bold uppercase py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-medium cursor-pointer">
							<ShoppingBag :size="15" class="text-gold-300" /> Return to Bookstore
							<ArrowRight :size="14" />
						</NuxtLink>
					</div>
				</div>

			</div>
		</main>

		<ToastContainer />
	</div>
</template>