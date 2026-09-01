<!-- pages/checkout.vue -->
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
} from 'lucide-vue-next';
import TopUtilityBar from '~/components/storefront/TopUtilityBar.vue';
import BookstoreHeader from '~/components/storefront/BookstoreHeader.vue';
import DeliveryTypeStep, { type DeliveryType } from '~/components/storefront/DeliveryTypeStep.vue';
import LeafletPinPicker from '~/components/storefront/LeafletPinPicker.vue';
import ToastContainer from '~/components/ui/ToastContainer.vue';
import { useCart } from '~/composables/useCart';
import { useToast } from '~/composables/useToast';
import { normalizeKenyanPhone, isValidKenyanPhone, detectKenyanCarrier } from '~/utils/phone';

const router = useRouter();
const { items, totalItems, subtotal, hasPhysicalItems, hasDigitalItems, clearCart } = useCart();
const { push: pushToast } = useToast();

onMounted(() => {
  if (items.value.length === 0) {
    router.replace('/');
  }
});

// Form State
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

// Clipboard State for Till Number
const isTillCopied = ref(false);
const STORE_TILL_NUMBER = '174379'; // Buy Goods Till

function copyTillNumber(): void {
  if (!navigator.clipboard) return;
  navigator.clipboard.writeText(STORE_TILL_NUMBER);
  isTillCopied.value = true;
  pushToast({ message: `Till number ${STORE_TILL_NUMBER} copied!`, variant: 'success' });
  setTimeout(() => (isTillCopied.value = false), 2200);
}

// GPS Pin State
const customerLat = ref<number | null>(null);
const customerLng = ref<number | null>(null);

const HUB_COORDS = { lat: -1.2683, lng: 36.8111, baseKm: 2.0, baseFee: 100, feePerKm: 25, maxRadiusKm: 15 };
const deliveryFee = ref<number>(100);
const deliveryFeeStatus = ref<'known' | 'needs_merchant_confirmation'>('known');

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
  if (!hasPhysicalItems.value) return 'Digital Delivery (eBooks via Cloudflare R2)';
  if (deliveryType.value === 'pickup') return 'Store Pickup — Sarit Centre Hub, Westlands';

  const parts = [
    estate.value.trim(),
    landmark.value.trim() ? `Near ${landmark.value.trim()}` : '',
    houseNumber.value.trim() ? `House/Door: ${houseNumber.value.trim()}` : '',
  ].filter(Boolean);

  return parts.join(' • ') || 'Nairobi Delivery';
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

function handleMapPinUpdate(coords: { lat: number; lng: number }): void {
  customerLat.value = coords.lat;
  customerLng.value = coords.lng;
  if (!estate.value) estate.value = 'Pinned Map Location';

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

async function handlePlaceOrder(): Promise<void> {
  if (!isFormValid.value || isSubmitting.value) return;

  isSubmitting.value = true;
  formError.value = null;

  try {
    const cleanPhone = normalizeKenyanPhone(customerPhone.value);

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

    router.push({
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
  <div class="min-h-screen flex flex-col bg-paper-canvas text-ink antialiased">
    <TopUtilityBar />
    <BookstoreHeader />

    <main class="max-w-6xl mx-auto w-full py-8 px-4 sm:px-6 flex-1 space-y-6">
      
      <!-- Back Navigation Header -->
      <div class="flex items-center justify-between">
        <NuxtLink to="/" class="inline-flex items-center gap-1.5 text-xs font-semibold text-forest-900 hover:text-gold-600 transition-colors">
          <ArrowLeft :size="14" /> Return to Catalog
        </NuxtLink>
        <span class="text-[11px] font-mono uppercase tracking-widest text-ink-muted">Secure Checkout</span>
      </div>

      <div class="grid lg:grid-cols-12 gap-8 items-start">
        
        <!-- Left: Form Steps (7 Cols) -->
        <div class="lg:col-span-7 space-y-6">
          
          <!-- Pure Digital eBook Alert Banner -->
          <div
            v-if="hasDigitalItems && !hasPhysicalItems"
            class="bg-emerald-50/80 border border-emerald-300/80 rounded-2xl p-4 flex items-center gap-3.5 text-xs text-emerald-950 shadow-soft"
          >
            <div class="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0">
              <Download :size="18" />
            </div>
            <div>
              <strong class="font-semibold text-emerald-900 block">Pure Digital Order</strong>
              <span class="text-emerald-950/80">Your eBooks will be unlocked for instant download as soon as your payment reference is submitted.</span>
            </div>
          </div>

          <!-- Step 1: Contact Information Card -->
          <section aria-labelledby="step-contact-heading" class="bg-paper-surface rounded-2xl shadow-soft border border-paper-border p-6 sm:p-7 space-y-5">
            <div class="flex items-center gap-3 pb-3.5 border-b border-paper-border">
              <span class="w-6 h-6 rounded-full bg-forest-950 text-gold-300 text-xs font-mono font-bold flex items-center justify-center shadow-xs">1</span>
              <h2 id="step-contact-heading" class="font-display text-base sm:text-lg font-bold text-forest-950">Reader &amp; Contact Details</h2>
            </div>

            <div class="space-y-4">
              <!-- Customer Name -->
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-forest-950">Full Name *</label>
                <div class="relative flex items-center">
                  <User :size="15" class="absolute left-3.5 text-ink-subtle pointer-events-none" />
                  <input
                    v-model="customerName"
                    type="text"
                    placeholder="e.g. Amani Wanjiku"
                    class="w-full pl-10 pr-3.5 py-2.5 bg-paper-canvas/50 border border-paper-border rounded-xl text-xs sm:text-sm outline-none focus:bg-white focus:border-forest-900 focus:ring-2 focus:ring-forest-900/5 transition-all text-forest-950 placeholder:text-ink-subtle"
                    required
                  />
                </div>
              </div>

              <!-- Phone & Email Grid -->
              <div class="grid sm:grid-cols-2 gap-4">
                <!-- M-Pesa Phone -->
                <div class="space-y-1.5">
                  <label class="text-xs font-semibold text-forest-950">M-Pesa Phone Number *</label>
                  <div class="relative flex items-center">
                    <Phone :size="15" class="absolute left-3.5 text-ink-subtle pointer-events-none" />
                    <input
                      v-model="customerPhone"
                      type="tel"
                      placeholder="07XXXXXXXX"
                      class="w-full pl-10 pr-20 py-2.5 bg-paper-canvas/50 border border-paper-border rounded-xl text-xs sm:text-sm outline-none focus:bg-white focus:border-forest-900 focus:ring-2 focus:ring-forest-900/5 font-mono text-forest-950 transition-all placeholder:text-ink-subtle"
                      required
                    />
                    <span
                      v-if="detectedCarrier"
                      class="absolute right-2.5 text-[9px] font-mono font-extrabold uppercase px-1.5 py-0.5 rounded-md tracking-wider"
                      :class="{
                        'bg-emerald-100 text-emerald-950': detectedCarrier === 'safaricom',
                        'bg-red-100 text-red-950': detectedCarrier === 'airtel',
                        'bg-amber-100 text-amber-950': detectedCarrier === 'telkom',
                      }"
                    >
                      {{ detectedCarrier }}
                    </span>
                  </div>
                </div>

                <!-- Email -->
                <div class="space-y-1.5">
                  <label class="text-xs font-semibold text-forest-950">Email Address (Optional)</label>
                  <div class="relative flex items-center">
                    <Mail :size="15" class="absolute left-3.5 text-ink-subtle pointer-events-none" />
                    <input
                      v-model="customerEmail"
                      type="email"
                      placeholder="name@email.com"
                      class="w-full pl-10 pr-3.5 py-2.5 bg-paper-canvas/50 border border-paper-border rounded-xl text-xs sm:text-sm outline-none focus:bg-white focus:border-forest-900 focus:ring-2 focus:ring-forest-900/5 transition-all text-forest-950 placeholder:text-ink-subtle"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Step 2: Physical Delivery Card -->
          <section v-if="hasPhysicalItems" aria-labelledby="step-fulfillment-heading" class="bg-paper-surface rounded-2xl shadow-soft border border-paper-border p-6 sm:p-7 space-y-5">
            <div class="flex items-center gap-3 pb-3.5 border-b border-paper-border">
              <span class="w-6 h-6 rounded-full bg-forest-950 text-gold-300 text-xs font-mono font-bold flex items-center justify-center shadow-xs">2</span>
              <h2 id="step-fulfillment-heading" class="font-display text-base sm:text-lg font-bold text-forest-950">Fulfillment &amp; Delivery Option</h2>
            </div>

            <DeliveryTypeStep v-model="deliveryType" />

            <div v-if="deliveryType === 'delivery'" class="space-y-4 pt-2">
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-forest-950">Estate / Neighborhood *</label>
                <div class="relative flex items-center">
                  <MapPin :size="15" class="absolute left-3.5 text-ink-subtle pointer-events-none" />
                  <input
                    v-model="estate"
                    type="text"
                    placeholder="e.g. Kilimani, South C, Westlands, Kileleshwa"
                    class="w-full pl-10 pr-3.5 py-2.5 bg-paper-canvas/50 border border-paper-border rounded-xl text-xs sm:text-sm outline-none focus:bg-white focus:border-forest-900 focus:ring-2 focus:ring-forest-900/5 transition-all text-forest-950 placeholder:text-ink-subtle"
                    required
                  />
                </div>
              </div>

              <!-- Interactive Pin Drop -->
              <div class="space-y-1.5">
                <label class="text-[11px] font-semibold text-ink-muted flex items-center gap-1.5">
                  <MapPin :size="12" class="text-gold-600" />
                  <span>Set Drop-off Pin for Accurate Rider Navigation:</span>
                </label>
                <LeafletPinPicker
                  :lat="customerLat"
                  :lng="customerLng"
                  @update:location="handleMapPinUpdate"
                />
              </div>

              <!-- Building & Door Details -->
              <div class="grid sm:grid-cols-2 gap-4">
                <div class="space-y-1.5">
                  <label class="text-xs font-semibold text-forest-950">Building / Landmark</label>
                  <div class="relative flex items-center">
                    <Building :size="15" class="absolute left-3.5 text-ink-subtle pointer-events-none" />
                    <input
                      v-model="landmark"
                      type="text"
                      placeholder="e.g. Chaka Place, Near Yaya"
                      class="w-full pl-10 pr-3.5 py-2.5 bg-paper-canvas/50 border border-paper-border rounded-xl text-xs sm:text-sm outline-none focus:bg-white focus:border-forest-900 transition-all text-forest-950 placeholder:text-ink-subtle"
                    />
                  </div>
                </div>

                <div class="space-y-1.5">
                  <label class="text-xs font-semibold text-forest-950">House / Apartment #</label>
                  <div class="relative flex items-center">
                    <Home :size="15" class="absolute left-3.5 text-ink-subtle pointer-events-none" />
                    <input
                      v-model="houseNumber"
                      type="text"
                      placeholder="e.g. Apt 4B, 2nd Floor"
                      class="w-full pl-10 pr-3.5 py-2.5 bg-paper-canvas/50 border border-paper-border rounded-xl text-xs sm:text-sm outline-none focus:bg-white focus:border-forest-900 transition-all text-forest-950 placeholder:text-ink-subtle"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- Store Pickup Info -->
            <div v-else class="p-4 bg-paper-cream/70 rounded-xl border border-paper-border text-xs text-ink-muted space-y-1">
              <span class="font-bold text-forest-950 block font-sans">Pickup Location:</span>
              <p>Flemela Bookstore Main Counter, Sarit Centre Lower Level, Westlands, Nairobi.</p>
              <span class="text-[11px] text-emerald-800 font-semibold block pt-1">✓ Books ready for pickup within 2 hours of payment approval.</span>
            </div>
          </section>

          <!-- Step 3: Payment Method Card -->
          <section aria-labelledby="step-payment-heading" class="bg-paper-surface rounded-2xl shadow-soft border border-paper-border p-6 sm:p-7 space-y-5">
            <div class="flex items-center gap-3 pb-3.5 border-b border-paper-border">
              <span class="w-6 h-6 rounded-full bg-forest-950 text-gold-300 text-xs font-mono font-bold flex items-center justify-center shadow-xs">
                {{ hasPhysicalItems ? '3' : '2' }}
              </span>
              <h2 id="step-payment-heading" class="font-display text-base sm:text-lg font-bold text-forest-950">Payment Method</h2>
            </div>

            <div class="space-y-3.5">
              
              <!-- Direct Manual M-Pesa -->
              <label
                class="border-2 rounded-2xl p-4 sm:p-5 flex flex-col gap-3.5 cursor-pointer transition-all relative overflow-hidden"
                :class="paymentMethod === 'mpesa_manual' ? 'border-forest-900 bg-paper-cream/40 shadow-soft ring-1 ring-forest-900' : 'border-paper-border bg-white hover:border-forest-800/30'"
              >
                <div class="flex items-start gap-3.5">
                  <input type="radio" value="mpesa_manual" v-model="paymentMethod" class="sr-only" />
                  <div class="w-9 h-9 rounded-full bg-emerald-100 text-forest-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 :size="18" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <strong class="text-xs sm:text-sm font-bold text-forest-950 block">Pay Directly via M-Pesa</strong>
                      <span class="bg-forest-950 text-gold-300 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Recommended
                      </span>
                    </div>
                    <p class="text-xs text-ink-muted mt-0.5 leading-relaxed">
                      Pay directly to our store Till Number and paste your M-Pesa transaction reference code below.
                    </p>
                  </div>
                </div>

                <!-- Digital M-Pesa Pass -->
                <div v-if="paymentMethod === 'mpesa_manual'" class="pt-3 border-t border-paper-border/80 space-y-3 pl-0 sm:pl-12">
                  
                  <!-- Till Number Chip with 1-Click Copy -->
                  <div class="bg-white rounded-xl p-3.5 border border-paper-border flex flex-wrap items-center justify-between gap-3 shadow-xs">
                    <div class="space-y-0.5">
                      <span class="text-[10px] uppercase font-mono font-bold text-ink-subtle tracking-widest block">Lipa Na M-Pesa • Buy Goods Till</span>
                      <div class="flex items-baseline gap-2">
                        <span class="font-mono text-lg font-bold text-forest-950 tracking-wider">{{ STORE_TILL_NUMBER }}</span>
                        <span class="text-xs font-semibold text-ink-muted">(Flemela Bookstore)</span>
                      </div>
                    </div>
<div class="bg-white rounded-xl p-3.5 border border-paper-border flex flex-wrap items-center justify-between gap-3 shadow-xs">
                    <div class="space-y-0.5">
                      <span class="text-[10px] uppercase font-mono font-bold text-ink-subtle tracking-widest block">Lipa Na M-Pesa â€¢ Buy Goods Till</span>
                      <div class="flex items-baseline gap-2">
                        <span class="font-mono text-lg font-bold text-forest-950 tracking-wider">{{ STORE_TILL_NUMBER }}</span>
                        <span class="text-xs font-semibold text-ink-muted">(Flemela Bookstore)</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      class="px-3 py-1.5 bg-paper-cream hover:bg-forest-950 hover:text-white rounded-lg text-xs font-bold font-sans transition-colors flex items-center gap-1.5 border border-paper-border cursor-pointer shadow-2xs"
                      @click="copyTillNumber"
                    >
                      <component :is="isTillCopied ? Check : Copy" :size="13" :class="isTillCopied ? 'text-emerald-600' : 'text-forest-950'" />
                      <span>{{ isTillCopied ? 'Copied!' : 'Copy Till' }}</span>
                    </button>
                  </div>

                  <!-- Reference Code Input -->
                  <div class="space-y-1.5">
                    <label class="text-xs font-bold text-forest-950 flex items-center justify-between">
                      <span>M-Pesa Transaction Code *</span>
                      <span class="text-[10px] text-ink-muted font-normal">Found in your Safaricom SMS</span>
                    </label>
                    <input
                      v-model="mpesaCode"
                      type="text"
                      placeholder="e.g. SH12AB34CD"
                      class="w-full px-3.5 py-2.5 bg-white border border-paper-border rounded-xl text-sm font-mono font-bold uppercase tracking-widest outline-none focus:border-forest-900 focus:ring-2 focus:ring-forest-900/5 transition-all text-forest-950 placeholder:text-ink-subtle"
                      required
                    />
                  </div>
                </div>
              </label></div>

              <!-- Automated Daraja STK Push -->
              <label
                class="border rounded-2xl p-4 sm:p-4.5 flex items-start gap-3.5 cursor-pointer transition-all"
                :class="paymentMethod === 'mpesa' ? 'border-forest-900 bg-paper-cream/40 shadow-soft ring-1 ring-forest-900' : 'border-paper-border bg-white hover:border-forest-800/30'"
              >
                <input type="radio" value="mpesa" v-model="paymentMethod" class="sr-only" />
                <div class="w-9 h-9 rounded-full bg-emerald-100 text-forest-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Zap :size="18" />
                </div>
                <div>
                  <strong class="text-xs sm:text-sm font-bold text-forest-950 block">Automated M-Pesa STK Push</strong>
                  <p class="text-xs text-ink-muted mt-0.5 leading-relaxed">
                    Sends an automated PIN prompt to your phone screen.
                  </p>
                </div>
              </label>

              <!-- Pay on Delivery (Hardcopy only) -->
              <label
                v-if="hasPhysicalItems"
                class="border rounded-2xl p-4 sm:p-4.5 flex items-start gap-3.5 cursor-pointer transition-all"
                :class="paymentMethod === 'mpesa_cash' ? 'border-forest-900 bg-paper-cream/40 shadow-soft ring-1 ring-forest-900' : 'border-paper-border bg-white hover:border-forest-800/30'"
              >
                <input type="radio" value="mpesa_cash" v-model="paymentMethod" class="sr-only" />
                <div class="w-9 h-9 rounded-full bg-slate-100 text-ink-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CreditCard :size="18" />
                </div>
                <div>
                  <strong class="text-xs sm:text-sm font-bold text-forest-950 block">
                    {{ deliveryType === 'delivery' ? 'Pay on Delivery / Rider Handover' : 'Pay at Store Pickup' }}
                  </strong>
                  <p class="text-xs text-ink-muted mt-0.5 leading-relaxed">
                    Settle via M-Pesa or cash upon physical collection of your print copies.
                  </p>
                </div>
              </label>
            </div>

            <!-- Order Notes -->
            <div class="space-y-1.5 pt-2">
              <label class="text-xs font-semibold text-forest-950">Order Notes or Gate Instructions (Optional)</label>
              <div class="relative flex items-start">
                <FileText :size="15" class="absolute left-3.5 top-3 text-ink-subtle pointer-events-none" />
                <textarea
                  v-model="notes"
                  rows="2"
                  placeholder="e.g. Leave with building receptionist, call on arrival..."
                  class="w-full pl-10 pr-3.5 py-2.5 bg-paper-canvas/50 border border-paper-border rounded-xl text-xs sm:text-sm outline-none focus:bg-white focus:border-forest-900 transition-all text-forest-950 placeholder:text-ink-subtle resize-none"
                />
              </div>
            </div>
          </section>
        </div>

        <!-- Right: Order Summary Sidebar (5 Cols) -->
        <div class="lg:col-span-5 bg-paper-surface rounded-2xl shadow-soft border border-paper-border p-6 sm:p-7 space-y-6 sticky top-24">
          <div class="pb-3.5 border-b border-paper-border flex justify-between items-center">
            <h3 class="font-display font-bold text-base sm:text-lg text-forest-950">Order Summary</h3>
            <span class="text-xs font-semibold font-mono text-ink-muted">{{ totalItems }} edition(s)</span>
          </div>

          <!-- Items Breakdown List -->
          <div class="space-y-3.5 max-h-72 overflow-y-auto divide-y divide-paper-border/60 pr-1">
            <div
              v-for="item in items"
              :key="`${item.productId}-${item.formatId}`"
              class="pt-3 first:pt-0 flex gap-3.5 items-center"
            >
              <div class="w-12 h-16 bg-paper-cream rounded-book border border-paper-border overflow-hidden flex-shrink-0 flex items-center justify-center shadow-xs">
                <img v-if="item.coverUrl" :src="item.coverUrl" :alt="item.title" class="w-full h-full object-cover" />
                <ShoppingBag v-else :size="18" class="text-ink-muted opacity-40" />
              </div>
              <div class="flex-1 min-w-0 space-y-0.5">
                <h4 class="text-xs sm:text-sm font-bold text-forest-950 truncate">{{ item.title }}</h4>
                <div class="flex items-center gap-2 text-[10px] text-ink-muted">
                  <span class="font-mono font-bold uppercase text-forest-900 bg-paper-cream px-1.5 py-0.2 rounded">
                    {{ item.format }}
                  </span>
                  <span>â€¢ Qty: {{ item.quantity }}</span>
                </div>
              </div>
              <span class="text-xs sm:text-sm font-bold text-forest-950 font-mono tabular-figure">
                {{ formatCurrency(item.price * item.quantity) }}
              </span>
            </div>
          </div>

          <!-- Totals Breakdown -->
          <div class="space-y-2.5 border-t border-paper-border pt-4 text-xs">
            <div class="flex justify-between text-ink-muted font-medium">
              <span>Books Subtotal</span>
              <span class="font-semibold text-forest-950 font-mono tabular-figure">{{ formatCurrency(subtotal) }}</span>
            </div>

            <div class="flex justify-between text-ink-muted font-medium">
              <span>Delivery Fee</span>
              <span v-if="!hasPhysicalItems || deliveryType === 'pickup'" class="text-emerald-800 font-bold font-mono">
                FREE
              </span>
              <span v-else-if="deliveryFeeStatus === 'known'" class="font-semibold text-forest-950 font-mono tabular-figure">
                {{ formatCurrency(deliveryFee) }}
              </span>
              <span v-else class="text-ink-subtle italic">To be confirmed</span>
            </div>

            <div class="flex justify-between items-baseline pt-3 border-t border-paper-border text-base">
              <span class="font-bold text-forest-950 font-sans">Total Amount</span>
              <span class="font-display font-extrabold text-xl sm:text-2xl text-forest-950 font-mono tabular-figure">
                {{ formatCurrency(totalToPay) }}
              </span>
            </div>
          </div>

          <!-- Error Alert -->
          <div v-if="formError" class="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2.5">
            <AlertCircle :size="16" class="flex-shrink-0 mt-0.5" />
            <span>{{ formError }}</span>
          </div>

          <!-- Submit Order Button -->
          <button
            type="button"
            class="w-full bg-forest-950 hover:bg-forest-900 active:bg-forest-950 text-paper font-sans font-bold text-xs uppercase tracking-wider py-4 px-6 rounded-xl shadow-medium hover:shadow-high transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            :disabled="!isFormValid || isSubmitting"
            @click="handlePlaceOrder"
          >
            <span v-if="isSubmitting" class="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            <span v-else>
              {{ paymentMethod === 'mpesa_manual' ? `Complete Order â€¢ ${formatCurrency(totalToPay)}` : (paymentMethod === 'mpesa' ? `Pay ${formatCurrency(totalToPay)} via M-Pesa` : `Confirm Order â€¢ ${formatCurrency(totalToPay)}`) }}
            </span>
          </button>

          <div class="flex items-center justify-center gap-2 text-[11px] text-ink-muted pt-1">
            <ShieldCheck :size="14" class="text-forest-900 flex-shrink-0" />
            <span>Encrypted Token Delivery &amp; Verified Physical Handover</span>
          </div>
        </div>
      </div>
    </main>

    <ToastContainer />
              
  </div>
</template>