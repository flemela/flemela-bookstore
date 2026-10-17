<!-- pages/checkout/index.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  ArrowLeft,
  ShoppingBag,
  Download,
  User,
  Phone,
  Mail,
  FileText,
  Zap,
  CreditCard,
  ShieldCheck,
  AlertCircle,
  MapPin,
  Building,
  Home,
  CheckCircle2,
  Copy,
  Check,
  Navigation,
  RefreshCw,
} from 'lucide-vue-next';
import PromoTickerStrip from '~/components/storefront/PromoTickerStrip.vue';
import StoreNavbar from '~/components/storefront/StoreNavbar.vue';
import Breadcrumbs from '~/components/storefront/Breadcrumbs.vue';
import DeliveryTypeStep, { type DeliveryType } from '~/components/storefront/DeliveryTypeStep.vue';
import LeafletPinPicker from '~/components/storefront/LeafletPinPicker.vue';
import ToastContainer from '~/components/ui/ToastContainer.vue';
import { useCart } from '~/composables/useCart';
import { useToast } from '~/composables/useToast';
import { normalizeKenyanPhone, isValidKenyanPhone, detectKenyanCarrier } from '~/utils/phone';

const router = useRouter();
const { items, totalItems, subtotal, hasPhysicalItems, hasDigitalItems, clearCart } = useCart();
const { push: pushToast } = useToast();

const { data: storeMetadata } = await useFetch<any>('/api/stores/current');
const tickerItems = computed(() => storeMetadata.value?.promo_ticker || []);

const breadcrumbItems = [
  { label: 'Home', to: '/' },
  { label: 'Reading Cart', to: '/#catalog-results' },
  { label: 'Secure Checkout' },
];

onMounted(() => {
  if (items.value.length === 0) {
    router.replace('/');
  }
});

// Customer & Order Form State
const customerName = ref('');
const customerPhone = ref('');
const customerEmail = ref('');
const deliveryType = ref<DeliveryType>('delivery');
const estate = ref('');
const landmark = ref('');
const houseNumber = ref('');
const notes = ref('');
const mpesaCode = ref('');
const paymentMethod = ref<'mpesa_manual' | 'mpesa' | 'mpesa_cash'>('mpesa_manual');

// Store Till Number
const STORE_TILL_NUMBER = '174379';
const isTillCopied = ref(false);

function copyTillNumber(): void {
  if (!navigator.clipboard) return;
  navigator.clipboard.writeText(STORE_TILL_NUMBER);
  isTillCopied.value = true;
  pushToast({ message: `Till number ${STORE_TILL_NUMBER} copied!`, variant: 'success' });
  setTimeout(() => (isTillCopied.value = false), 2200);
}

// Canonical Hub: Diamond Mall, Parklands, Nairobi
const HUB_COORDS = {
  lat: -1.2612,
  lng: 36.8167,
  baseKm: 2.0,
  baseFee: 100,
  feePerKm: 25,
  maxRadiusKm: 15,
};

// Customer GPS Pin State
const customerLat = ref<number | null>(null);
const customerLng = ref<number | null>(null);
const deliveryFee = ref<number>(100);
const deliveryFeeStatus = ref<'known' | 'needs_merchant_confirmation'>('known');
const isLocatingCustomer = ref(false);

const isSubmitting = ref(false);
const formError = ref<string | null>(null);

const detectedCarrier = computed(() => detectKenyanCarrier(customerPhone.value));

function formatCurrency(val: number): string {
  return `KSh ${val.toLocaleString('en-KE')}`;
}

function computeHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

const fullDeliveryAddress = computed(() => {
  if (!hasPhysicalItems.value) return 'Instant digital delivery (eBook)';
  if (deliveryType.value === 'pickup') return 'Store pickup — Diamond Mall Hub, Parklands, Nairobi';

  const parts = [
    estate.value.trim(),
    landmark.value.trim() ? `Near ${landmark.value.trim()}` : '',
    houseNumber.value.trim() ? `House/Door: ${houseNumber.value.trim()}` : '',
  ].filter(Boolean);

  return parts.join(' • ') || 'Nairobi delivery';
});

const isFormValid = computed(() => {
  const hasName = customerName.value.trim().length > 0;
  const hasValidPhone = isValidKenyanPhone(customerPhone.value);

  if (!hasName || !hasValidPhone) return false;

  if (paymentMethod.value === 'mpesa_manual' && !mpesaCode.value.trim()) {
    return false;
  }

  if (hasPhysicalItems.value && deliveryType.value === 'delivery') {
    return estate.value.trim().length > 0;
  }

  return true;
});

const totalToPay = computed(() => {
  if (!hasPhysicalItems.value || deliveryType.value === 'pickup') {
    return subtotal.value;
  }
  const feeToAdd = deliveryFeeStatus.value === 'known' ? deliveryFee.value : 0;
  return Math.round((subtotal.value + feeToAdd) * 100) / 100;
});

const payOnDeliveryLabel = computed(() => {
  return deliveryType.value === 'delivery'
    ? 'Pay on delivery / courier handover'
    : 'Pay at store pickup';
});

const submitButtonLabel = computed(() => {
  if (paymentMethod.value === 'mpesa_manual') {
    return `Complete order • ${formatCurrency(totalToPay.value)}`;
  }
  if (paymentMethod.value === 'mpesa') {
    return `Pay ${formatCurrency(totalToPay.value)} via M-Pesa`;
  }
  return `Confirm order • ${formatCurrency(totalToPay.value)}`;
});

function handleMapPinUpdate(coords: { lat: number; lng: number }): void {
  customerLat.value = coords.lat;
  customerLng.value = coords.lng;
  if (!estate.value) estate.value = 'Pinned map location';

  const distance = computeHaversineDistanceKm(HUB_COORDS.lat, HUB_COORDS.lng, coords.lat, coords.lng);
  if (distance > HUB_COORDS.maxRadiusKm) {
    deliveryFeeStatus.value = 'needs_merchant_confirmation';
    deliveryFee.value = 0;
  } else {
    deliveryFeeStatus.value = 'known';
    const billableKm = Math.max(0, distance - HUB_COORDS.baseKm);
    deliveryFee.value = Math.round(HUB_COORDS.baseFee + billableKm * HUB_COORDS.feePerKm);
  }
}

function handleUseCustomerLocation(): void {
  if (!process.client || !navigator.geolocation) {
    pushToast({ message: 'Geolocation is not supported by your browser.', variant: 'error' });
    return;
  }

  isLocatingCustomer.value = true;
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      isLocatingCustomer.value = false;
      const { latitude, longitude, accuracy } = pos.coords;
      customerLat.value = latitude;
      customerLng.value = longitude;
      if (!estate.value.trim()) {
        estate.value = `Current location (±${Math.round(accuracy)}m GPS)`;
      }
      handleMapPinUpdate({ lat: latitude, lng: longitude });
      pushToast({ message: 'Pin set to your device location!', variant: 'success' });
    },
    (err) => {
      isLocatingCustomer.value = false;
      let msg = 'Could not acquire GPS position. Please tap the map directly.';
      if (err.code === err.PERMISSION_DENIED) {
        msg = 'Location permission denied. Please allow location access in your browser.';
      } else if (err.code === err.TIMEOUT) {
        msg = 'GPS request timed out. Please tap the map to place your delivery pin.';
      }
      pushToast({ message: msg, variant: 'error' });
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
  );
}

function handleSearch(queryText: string): void {
  router.push({ path: '/', query: { q: queryText } });
}

function handleCategorySelect(category: string): void {
  router.push({ path: '/', query: { category } });
}

async function handlePlaceOrder(): Promise<void> {
  if (!isFormValid.value || isSubmitting.value) return;

  isSubmitting.value = true;
  formError.value = null;

  try {
    const cleanPhone = normalizeKenyanPhone(customerPhone.value);

    if (process.client) {
      sessionStorage.setItem('flemela_last_checkout_phone', cleanPhone);
      if (customerEmail.value.trim()) {
        sessionStorage.setItem('flemela_last_checkout_email', customerEmail.value.trim());
      }
    }

    const payload = {
      customerName: customerName.value.trim(),
      customerPhone: cleanPhone,
      customerEmail: customerEmail.value.trim() || null,
      deliveryType: hasPhysicalItems.value ? deliveryType.value : 'delivery',
      deliveryLocation: fullDeliveryAddress.value,
      paymentMethod: paymentMethod.value,
      mpesaCode: paymentMethod.value === 'mpesa_manual' ? mpesaCode.value.trim().toUpperCase() : null,
      notes: notes.value.trim() || null,
      customerLat: hasPhysicalItems.value && deliveryType.value === 'delivery' ? customerLat.value : null,
      customerLng: hasPhysicalItems.value && deliveryType.value === 'delivery' ? customerLng.value : null,
      locationSource: customerLat.value ? 'gps' : 'manual_text',
      items: items.value.map((i) => ({
        product_id: i.productId,
        format_id: i.formatId,
        quantity: i.quantity,
        delivery_method: i.deliveryMethod,
      })),
    };

    const response = await $fetch<{
      success: boolean;
      orderId: string;
      checkoutRequestId?: string;
      phone: string;
    }>('/api/checkout', {
      method: 'POST',
      body: payload,
    });

    clearCart();

    await router.push({
      path: '/checkout/confirm',
      query: {
        orderId: response.orderId,
        checkoutRequestId: response.checkoutRequestId || undefined,
        phone: response.phone,
      },
    });
  } catch (err: any) {
    formError.value = err.data?.message || err.statusMessage || 'Checkout failed. Please try again.';
    pushToast({ message: formError.value || 'Checkout failed', variant: 'error' });
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
	<div class="min-h-screen flex flex-col bg-paper-canvas text-[#141E1A] antialiased font-sans">
		<PromoTickerStrip :messages="tickerItems" />
		<StoreNavbar @search="handleSearch" @select-category="handleCategorySelect" />

		<main class="max-w-6xl mx-auto w-full py-4 sm:py-6 px-4 sm:px-6 flex-1 space-y-4">
			<div class="flex items-center justify-between">
				<Breadcrumbs :items="breadcrumbItems" />
				<NuxtLink to="/"
					class="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-[#141E1A] hover:text-[#E8750D] transition-colors">
					<ArrowLeft :size="13" /> Back to Catalog
				</NuxtLink>
			</div>

			<div class="grid lg:grid-cols-12 gap-8 items-start">
				<!-- Left: Form Steps (7 Cols) -->
				<div class="lg:col-span-7 space-y-6">

					<!-- Pure Digital eBook Notice -->
					<div v-if="hasDigitalItems && !hasPhysicalItems"
						class="bg-[#FFF7ED] border border-[#FFEDD5] rounded-2xl p-4 flex items-center gap-3.5 text-xs text-[#C25E00] shadow-soft">
						<div
							class="w-9 h-9 rounded-full bg-[#FFEDD5] text-[#C25E00] flex items-center justify-center flex-shrink-0">
							<Download :size="18" />
						</div>
						<div>
							<strong class="font-bold text-[#141E1A] block">Instant Digital Delivery</strong>
							<span class="text-[#5F6964]">
								Your eBook download links are unlocked immediately upon payment confirmation.
							</span>
						</div>
					</div>

					<!-- Step 1: Customer Details -->
					<section aria-labelledby="step-contact-heading"
						class="bg-white rounded-2xl shadow-card border border-slate-200/80 p-6 sm:p-7 space-y-5">
						<div class="flex items-center gap-3 pb-3.5 border-b border-slate-100">
							<span
								class="w-6 h-6 rounded-full bg-[#141E1A] text-white text-xs font-mono font-bold flex items-center justify-center shadow-xs">
								1
							</span>
							<h2 id="step-contact-heading"
								class="font-display text-base sm:text-lg font-bold text-[#141E1A]">
								Reader &amp; Contact Details
							</h2>
						</div>

						<div class="space-y-4">
							<!-- Full Name -->
							<div class="space-y-1.5">
								<label class="text-xs font-semibold text-[#141E1A]">Full Name *</label>
								<div class="relative flex items-center">
									<User :size="15" class="absolute left-3.5 text-slate-400 pointer-events-none" />
									<input v-model="customerName" type="text" placeholder="e.g. Amani Wanjiku"
										class="w-full pl-10 pr-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:bg-white focus:border-[#E8750D] focus:ring-2 focus:ring-[#E8750D]/10 transition-all text-[#141E1A] placeholder:text-slate-400"
										required />
								</div>
							</div>

							<!-- Phone & Email -->
							<div class="grid sm:grid-cols-2 gap-4">
								<div class="space-y-1.5">
									<label class="text-xs font-semibold text-[#141E1A]">M-Pesa Phone Number *</label>
									<div class="relative flex items-center">
										<Phone :size="15"
											class="absolute left-3.5 text-slate-400 pointer-events-none" />
										<input v-model="customerPhone" type="tel" placeholder="07XXXXXXXX"
											class="w-full pl-10 pr-20 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:bg-white focus:border-[#E8750D] focus:ring-2 focus:ring-[#E8750D]/10 font-mono text-[#141E1A] transition-all placeholder:text-slate-400"
											required />
										<span v-if="detectedCarrier"
											class="absolute right-2.5 text-[9px] font-mono font-extrabold uppercase px-1.5 py-0.5 rounded-md tracking-wider"
											:class="{
                        'bg-emerald-100 text-emerald-950': detectedCarrier === 'safaricom',
                        'bg-red-100 text-red-950': detectedCarrier === 'airtel',
                        'bg-amber-100 text-amber-950': detectedCarrier === 'telkom',
                      }">
											{{ detectedCarrier }}
										</span>
									</div>
								</div>

								<div class="space-y-1.5">
									<label class="text-xs font-semibold text-[#141E1A]">Email Address (For eBook
										Delivery)</label>
									<div class="relative flex items-center">
										<Mail :size="15" class="absolute left-3.5 text-slate-400 pointer-events-none" />
										<input v-model="customerEmail" type="email" placeholder="name@email.com"
											class="w-full pl-10 pr-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:bg-white focus:border-[#E8750D] focus:ring-2 focus:ring-[#E8750D]/10 transition-all text-[#141E1A] placeholder:text-slate-400" />
									</div>
								</div>
							</div>
						</div>
					</section>

					<!-- Step 2: Physical Delivery with GPS Pin -->
					<section v-if="hasPhysicalItems" aria-labelledby="step-fulfillment-heading"
						class="bg-white rounded-2xl shadow-card border border-slate-200/80 p-6 sm:p-7 space-y-5">
						<div class="flex items-center gap-3 pb-3.5 border-b border-slate-100">
							<span
								class="w-6 h-6 rounded-full bg-[#141E1A] text-white text-xs font-mono font-bold flex items-center justify-center shadow-xs">
								2
							</span>
							<h2 id="step-fulfillment-heading"
								class="font-display text-base sm:text-lg font-bold text-[#141E1A]">
								Fulfillment &amp; Delivery Destination
							</h2>
						</div>

						<DeliveryTypeStep v-model="deliveryType" />

						<div v-if="deliveryType === 'delivery'" class="space-y-4 pt-2">
							<div class="space-y-1.5">
								<label class="text-xs font-semibold text-[#141E1A]">Estate / Neighborhood *</label>
								<div class="relative flex items-center">
									<MapPin :size="15" class="absolute left-3.5 text-slate-400 pointer-events-none" />
									<input v-model="estate" type="text"
										placeholder="e.g. Parklands, Kilimani, Westlands, South C, Roysambu"
										class="w-full pl-10 pr-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:bg-white focus:border-[#E8750D] focus:ring-2 focus:ring-[#E8750D]/10 transition-all text-[#141E1A] placeholder:text-slate-400"
										required />
								</div>
							</div>

							<!-- Map Pin + Geolocation Button -->
							<div class="space-y-2">
								<div class="flex items-center justify-between gap-2 pb-1">
									<label class="text-[11px] font-semibold text-[#5F6964] flex items-center gap-1.5">
										<MapPin :size="12" class="text-[#E8750D]" />
										<span>Drop-off Pin (Calculated from Diamond Mall Hub):</span>
									</label>

									<button type="button"
										class="px-3 py-1.5 rounded-xl bg-[#FFF7ED] hover:bg-[#FFEDD5] border border-[#FFEDD5] text-[#C25E00] text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95 flex-shrink-0"
										:disabled="isLocatingCustomer" @click="handleUseCustomerLocation">
										<RefreshCw v-if="isLocatingCustomer" :size="12" class="animate-spin" />
										<Navigation v-else :size="12" class="text-[#E8750D]" />
										<span>{{ isLocatingCustomer ? 'Locating...' : 'Use My Current Location'
											}}</span>
									</button>
								</div>

								<LeafletPinPicker :lat="customerLat" :lng="customerLng"
									@update:location="handleMapPinUpdate" />
							</div>

							<!-- Building & Door Details -->
							<div class="grid sm:grid-cols-2 gap-4">
								<div class="space-y-1.5">
									<label class="text-xs font-semibold text-[#141E1A]">Building / Landmark</label>
									<div class="relative flex items-center">
										<Building :size="15"
											class="absolute left-3.5 text-slate-400 pointer-events-none" />
										<input v-model="landmark" type="text"
											placeholder="e.g. Near Aga Khan, Chaka Place"
											class="w-full pl-10 pr-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:bg-white focus:border-[#E8750D] transition-all text-[#141E1A] placeholder:text-slate-400" />
									</div>
								</div>

								<div class="space-y-1.5">
									<label class="text-xs font-semibold text-[#141E1A]">House / Apartment #</label>
									<div class="relative flex items-center">
										<Home :size="15" class="absolute left-3.5 text-slate-400 pointer-events-none" />
										<input v-model="houseNumber" type="text" placeholder="e.g. Flat 3B, 2nd Floor"
											class="w-full pl-10 pr-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:bg-white focus:border-[#E8750D] transition-all text-[#141E1A] placeholder:text-slate-400" />
									</div>
								</div>
							</div>
						</div>

						<!-- Store Pickup Info -->
						<div v-else
							class="p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-[#5F6964] space-y-1">
							<span class="font-bold text-[#141E1A] block">Pickup Hub:</span>
							<p>The Sunrise Bookstore Main Counter, Diamond Mall / Diamond Plaza, 4th Parklands Ave,
								Nairobi.</p>
							<span class="text-[11px] text-emerald-800 font-semibold block pt-1">
								âœ“ Ready for collection within 2 hours of payment confirmation.
							</span>
						</div>
					</section>

					<!-- Step 3: Payment Channel Selection -->
					<section aria-labelledby="step-payment-heading"
						class="bg-white rounded-2xl shadow-card border border-slate-200/80 p-6 sm:p-7 space-y-5">
						<div class="flex items-center gap-3 pb-3.5 border-b border-slate-100">
							<span
								class="w-6 h-6 rounded-full bg-[#141E1A] text-white text-xs font-mono font-bold flex items-center justify-center shadow-xs">
								{{ hasPhysicalItems ? '3' : '2' }}
							</span>
							<h2 id="step-payment-heading"
								class="font-display text-base sm:text-lg font-bold text-[#141E1A]">
								Payment Method
							</h2>
						</div>

						<div class="space-y-3.5">
							<!-- OPTION A: DIRECT MANUAL M-PESA TILL -->
							<label
								class="border rounded-2xl p-4 sm:p-5 flex flex-col gap-3.5 cursor-pointer transition-all relative overflow-hidden"
								:class="paymentMethod === 'mpesa_manual'
                  ? 'border-[#E8750D] bg-[#FFF7ED] shadow-xs ring-1 ring-[#E8750D]/30'
                  : 'border-slate-200 bg-white hover:border-slate-300'">
								<div class="flex items-start gap-3.5">
									<input type="radio" value="mpesa_manual" v-model="paymentMethod" class="sr-only" />
									<div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors"
										:class="paymentMethod === 'mpesa_manual' ? 'bg-[#FFEDD5] text-[#C25E00]' : 'bg-slate-100 text-slate-500'">
										<CheckCircle2 :size="19" />
									</div>
									<div class="flex-1 min-w-0">
										<div class="flex items-center gap-2">
											<strong class="text-xs sm:text-sm font-bold text-[#141E1A] block">
												Pay Directly to Buy Goods Till
											</strong>
											<span
												class="bg-[#E8750D] text-white text-[9.5px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
												Instant
											</span>
										</div>
										<p class="text-xs text-[#5F6964] mt-0.5 leading-relaxed">
											Deposit to our store till number and paste your Safaricom transaction
											confirmation code below.
										</p>
									</div>
								</div>

								<div v-if="paymentMethod === 'mpesa_manual'"
									class="pt-3 border-t border-orange-200/60 space-y-3 pl-0 sm:pl-13">
									<!-- Till Number Copy Box -->
									<div
										class="bg-white rounded-xl p-3.5 border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
										<div class="space-y-0.5">
											<span
												class="text-[10px] uppercase font-mono font-bold text-[#5F6964] tracking-widest block">
												Lipa Na M-Pesa â€¢ Buy Goods Till
											</span>
											<div class="flex items-baseline gap-2">
												<span class="font-mono text-xl font-bold text-[#141E1A] tracking-wider">
													{{ STORE_TILL_NUMBER }}
												</span>
												<span class="text-xs font-semibold text-[#5F6964]">(The Sunrise
													Bookstore)</span>
											</div>
										</div>

										<button type="button"
											class="px-3.5 py-2 bg-slate-100 hover:bg-[#E8750D] hover:text-white rounded-xl text-xs font-bold font-sans transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
											@click="copyTillNumber">
											<component :is="isTillCopied ? Check : Copy" :size="13"
												:class="isTillCopied ? 'text-emerald-700' : 'text-[#141E1A]'" />
											<span>{{ isTillCopied ? 'Copied!' : 'Copy Till' }}</span>
										</button>
									</div>

									<!-- Reference Code Input -->
									<div class="space-y-1.5">
										<label
											class="text-xs font-bold text-[#141E1A] flex items-center justify-between">
											<span>Safaricom Confirmation Code *</span>
											<span class="text-[10px] text-[#5F6964] font-normal">Found in your M-Pesa
												SMS</span>
										</label>
										<input v-model="mpesaCode" type="text" placeholder="e.g. SH12AB34CD"
											class="w-full px-3.5 py-3 bg-white border border-slate-200 rounded-xl text-sm font-mono font-bold uppercase tracking-widest outline-none focus:border-[#E8750D] focus:ring-2 focus:ring-[#E8750D]/10 transition-all text-[#141E1A] placeholder:text-slate-400"
											required />
									</div>
								</div>
							</label>
							<!-- OPTION B: AUTOMATED DARAJA STK PUSH -->
							<label
								class="border rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 cursor-pointer transition-all"
								:class="paymentMethod === 'mpesa'
                  ? 'border-[#E8750D] bg-[#FFF7ED] shadow-xs ring-1 ring-[#E8750D]/30'
                  : 'border-slate-200 bg-white hover:border-slate-300'">
								<input type="radio" value="mpesa" v-model="paymentMethod" class="sr-only" />
								<div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors"
									:class="paymentMethod === 'mpesa' ? 'bg-[#FFEDD5] text-[#C25E00]' : 'bg-slate-100 text-slate-500'">
									<Zap :size="19" />
								</div>
								<div>
									<strong class="text-xs sm:text-sm font-bold text-[#141E1A] block">
										Automated M-Pesa STK Push
									</strong>
									<p class="text-xs text-[#5F6964] mt-0.5 leading-relaxed">
										Dispatches an automated PIN prompt to your Safaricom mobile handset.
									</p>
								</div>
							</label>

							<!-- OPTION C: PAY ON DELIVERY (HARDCOPY ONLY) -->
							<label v-if="hasPhysicalItems"
								class="border rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 cursor-pointer transition-all"
								:class="paymentMethod === 'mpesa_cash'
                  ? 'border-[#E8750D] bg-[#FFF7ED] shadow-xs ring-1 ring-[#E8750D]/30'
                  : 'border-slate-200 bg-white hover:border-slate-300'">
								<input type="radio" value="mpesa_cash" v-model="paymentMethod" class="sr-only" />
								<div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors"
									:class="paymentMethod === 'mpesa_cash' ? 'bg-[#FFEDD5] text-[#C25E00]' : 'bg-slate-100 text-slate-500'">
									<CreditCard :size="19" />
								</div>
								<div>
									<strong class="text-xs sm:text-sm font-bold text-[#141E1A] block">
										{{ payOnDeliveryLabel }}
									</strong>
									<p class="text-xs text-[#5F6964] mt-0.5 leading-relaxed">
										Settle via M-Pesa or cash upon physical collection of your print copies.
									</p>
								</div>
							</label>
						</div>

						<!-- Notes -->
						<div class="space-y-1.5 pt-2">
							<label class="text-xs font-semibold text-[#141E1A]">Delivery Instructions (Optional)</label>
							<div class="relative flex items-start">
								<FileText :size="15"
									class="absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
								<textarea v-model="notes" rows="2"
									placeholder="e.g. Leave with building security, call upon gate arrival..."
									class="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:bg-white focus:border-[#E8750D] transition-all text-[#141E1A] placeholder:text-slate-400 resize-none" />
							</div>
						</div>
					</section>
				</div>

				<!-- Right: Order Summary Sidebar (5 Cols) -->
				<div
					class="lg:col-span-5 bg-white rounded-2xl shadow-card border border-slate-200/80 p-6 sm:p-7 space-y-6 sticky top-24">
					<div class="pb-3.5 border-b border-slate-100 flex justify-between items-center">
						<h3 class="font-display font-bold text-base sm:text-lg text-[#141E1A]">Order Summary</h3>
						<span class="text-xs font-semibold font-mono text-[#5F6964]">{{ totalItems }} edition(s)</span>
					</div>

					<!-- Items Breakdown -->
					<div class="space-y-3.5 max-h-72 overflow-y-auto divide-y divide-slate-100 pr-1">
						<div v-for="item in items" :key="`${item.productId}-${item.formatId}`"
							class="pt-3 first:pt-0 flex gap-3.5 items-center">
							<div
								class="w-12 h-16 bg-slate-50 rounded-lg border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center shadow-2xs">
								<img v-if="item.coverUrl" :src="item.coverUrl" :alt="item.title"
									class="w-full h-full object-cover" />
								<ShoppingBag v-else :size="18" class="text-slate-400 opacity-40" />
							</div>
							<div class="flex-1 min-w-0 space-y-0.5">
								<h4 class="text-xs sm:text-sm font-bold text-[#141E1A] truncate">{{ item.title }}</h4>
								<div class="flex items-center gap-2 text-[10px] text-[#5F6964]">
									<span
										class="font-mono font-bold uppercase text-[#C25E00] bg-[#FFF7ED] px-1.5 py-0.2 rounded">
										{{ item.format === 'hardcopy' ? 'Hardcopy' : `eBook
										(${item.format.toUpperCase()})` }}
									</span>
									<span>â€¢ Qty: {{ item.quantity }}</span>
								</div>
							</div>
							<span class="text-xs sm:text-sm font-bold text-[#141E1A] font-mono tabular-figure">
								{{ formatCurrency(item.price * item.quantity) }}
							</span>
						</div>
					</div>

					<!-- Totals -->
					<div class="space-y-2.5 border-t border-slate-100 pt-4 text-xs">
						<div class="flex justify-between text-[#5F6964] font-medium">
							<span>Books Subtotal</span>
							<span class="font-semibold text-[#141E1A] font-mono tabular-figure">{{
								formatCurrency(subtotal) }}</span>
						</div>

						<div class="flex justify-between text-[#5F6964] font-medium">
							<span>Delivery Fee (from Diamond Mall)</span>
							<span v-if="!hasPhysicalItems || deliveryType === 'pickup'"
								class="text-emerald-800 font-bold font-mono">
								FREE
							</span>
							<span v-else-if="deliveryFeeStatus === 'known'"
								class="font-semibold text-[#141E1A] font-mono tabular-figure">
								{{ formatCurrency(deliveryFee) }}
							</span>
							<span v-else class="text-[#5F6964] italic">To be confirmed</span>
						</div>

						<div class="flex justify-between items-baseline pt-3 border-t border-slate-100 text-base">
							<span class="font-bold text-[#141E1A]">Total Bill</span>
							<span
								class="font-display font-extrabold text-xl sm:text-2xl text-[#141E1A] font-mono tabular-figure">
								{{ formatCurrency(totalToPay) }}
							</span>
						</div>
					</div>

					<!-- Error Alert -->
					<div v-if="formError"
						class="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2.5">
						<AlertCircle :size="16" class="flex-shrink-0 mt-0.5" />
						<span>{{ formError }}</span>
					</div>

					<!-- Checkout Action -->
					<button type="button"
						class="w-full bg-gradient-to-b from-[#F07514] via-[#E86C0E] to-[#D85F06] hover:from-[#E86C0E] hover:to-[#C85202] text-white font-sans font-bold text-xs uppercase tracking-wider py-4 px-6 rounded-xl shadow-medium hover:shadow-high transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
						:disabled="!isFormValid || isSubmitting" @click="handlePlaceOrder">
						<span v-if="isSubmitting"
							class="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
						<span v-else>{{ submitButtonLabel }}</span>
					</button>

					<div class="flex items-center justify-center gap-2 text-[11px] text-[#5F6964] pt-1">
						<ShieldCheck :size="14" class="text-emerald-700 flex-shrink-0" />
						<span>Instant Digital Fulfillment &amp; Verified Delivery</span>
					</div>
				</div>
			</div>
		</main>

		<ToastContainer />
	</div>
</template>