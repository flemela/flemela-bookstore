<!-- pages/admin/mpesa.vue -->
<script setup lang="ts">
import {
  CreditCard,
  Key,
  Lock,
  Phone,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Zap,
  ExternalLink,
  ArrowLeft,
} from 'lucide-vue-next';
import AdminLayout from '~/components/admin/AdminLayout.vue';
import { useToast } from '~/composables/useToast';
import type { MpesaCredentialsStatus } from '~/server/api/admin/mpesa.get';

definePageMeta({
  middleware: 'admin-auth',
});

const { push: pushToast } = useToast();

const { data: credsData, refresh } = await useFetch<MpesaCredentialsStatus | null>('/api/admin/mpesa');

const form = reactive({
  tillType: 'till' as 'till' | 'paybill',
  shortcode: '',
  storeNumber: '',
  consumerKey: '',
  consumerSecret: '',
  passkey: '',
  environment: 'sandbox' as 'sandbox' | 'production',
});

const verifyPhone = ref('');
const isSaving = ref(false);
const isVerifying = ref(false);
const isPolling = ref(false);
let pollInterval: ReturnType<typeof setInterval> | undefined;

onMounted(() => {
  if (credsData.value) {
    form.tillType = credsData.value.till_type || 'till';
    form.shortcode = credsData.value.shortcode || '';
    form.storeNumber = credsData.value.store_number || '';
    form.environment = credsData.value.environment || 'sandbox';
  }
});

onUnmounted(() => {
  stopPolling();
});

const isVerified = computed(() => credsData.value?.status === 'verified');
const isFailed = computed(() => credsData.value?.status === 'failed');

async function handleSaveCredentials(): Promise<void> {
  if (!form.shortcode || !form.consumerKey || !form.consumerSecret || !form.passkey) {
    pushToast({ message: 'Please fill in all required credentials fields', variant: 'error' });
    return;
  }

  isSaving.value = true;
  try {
    await $fetch('/api/admin/mpesa', {
      method: 'POST',
      body: {
        tillType: form.tillType,
        shortcode: form.shortcode.trim(),
        storeNumber: form.tillType === 'till' && form.storeNumber.trim() ? form.storeNumber.trim() : null,
        consumerKey: form.consumerKey.trim(),
        consumerSecret: form.consumerSecret.trim(),
        passkey: form.passkey.trim(),
        environment: form.environment,
      },
    });

    await refresh();
    pushToast({
      message: 'Credentials saved! Now perform a KES 1 verification test below.',
      variant: 'success',
    });
  } catch (err: any) {
    pushToast({ message: err.data?.statusMessage || 'Failed to save credentials', variant: 'error' });
  } finally {
    isSaving.value = false;
  }
}

async function handleStartVerification(): Promise<void> {
  if (!verifyPhone.value.trim()) {
    pushToast({ message: 'Enter your phone number to receive the test push', variant: 'error' });
    return;
  }

  isVerifying.value = true;
  try {
    const res = await $fetch<{ checkoutRequestId: string; customerMessage: string }>('/api/admin/mpesa/verify', {
      method: 'POST',
      body: { phone: verifyPhone.value.trim() },
    });

    pushToast({
      message: res.customerMessage || 'Test STK Push (KES 1) sent! Enter your PIN on your phone.',
      variant: 'info',
    });

    startPollingVerification();
  } catch (err: any) {
    pushToast({ message: err.data?.statusMessage || 'Verification STK push failed', variant: 'error' });
  } finally {
    isVerifying.value = false;
  }
}

function startPollingVerification(): void {
  stopPolling();
  isPolling.value = true;
  let attempts = 0;

  pollInterval = setInterval(async () => {
    attempts++;
    await refresh();

    if (credsData.value?.status === 'verified') {
      stopPolling();
      pushToast({ message: 'M-Pesa integration verified and ready for live checkouts!', variant: 'success' });
    } else if (credsData.value?.status === 'failed') {
      stopPolling();
      pushToast({
        message: credsData.value.last_error || 'Verification payment was cancelled or failed',
        variant: 'error',
      });
    } else if (attempts >= 20) {
      stopPolling();
      pushToast({ message: 'Verification polling timed out. Click test again to retry.', variant: 'error' });
    }
  }, 3000);
}

function stopPolling(): void {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = undefined;
  }
  isPolling.value = false;
}
</script>

<template>
  <AdminLayout>
    <div class="max-w-5xl mx-auto space-y-6">
      <!-- Top Navigation -->
      <NuxtLink to="/admin" class="inline-flex items-center gap-1.5 text-xs font-bold text-brand-green hover:underline">
        <ArrowLeft :size="14" /> Back to Dashboard
      </NuxtLink>

      <!-- Header & Verification Badge -->
      <div class="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-ink-border">
        <div>
          <h1 class="font-display text-2xl font-bold text-brand-green">M-Pesa Daraja Self-Onboarding</h1>
          <p class="text-xs text-ink-muted">
            Connect your Buy Goods Till or Paybill so customer payments deposit directly into your business account.
          </p>
        </div>

        <div>
          <span v-if="isVerified" class="inline-flex items-center gap-1.5 bg-emerald-100 text-brand-green text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
            <CheckCircle2 :size="16" /> VERIFIED ({{ credsData?.environment?.toUpperCase() }})
          </span>
          <span v-else-if="isFailed" class="inline-flex items-center gap-1.5 bg-red-100 text-red-800 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
            <AlertTriangle :size="16" /> VERIFICATION FAILED
          </span>
          <span v-else class="inline-flex items-center gap-1.5 bg-amber-100 text-amber-900 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
            <RefreshCw :size="14" /> PENDING VERIFICATION
          </span>
        </div>
      </div>

      <div class="grid lg:grid-cols-12 gap-8 items-start">
        <!-- LEFT: Setup & Verification Form (7 cols) -->
        <div class="lg:col-span-7 space-y-5">
          <!-- STEP 1: Account Type -->
          <div class="bg-white rounded-xl shadow-card border border-ink-border p-6 space-y-4">
            <h2 class="font-display text-sm font-bold text-ink uppercase tracking-wider flex items-center gap-2">
              <span class="w-5 h-5 rounded-full bg-brand-green text-white text-[11px] flex items-center justify-center">1</span>
              Select Account Type
            </h2>

            <div class="grid sm:grid-cols-2 gap-3">
              <label
                class="border rounded-xl p-3.5 flex items-start gap-3 cursor-pointer transition-all"
                :class="form.tillType === 'till' ? 'border-brand-green bg-emerald-50/50 ring-1 ring-brand-green' : 'border-ink-border hover:border-slate-300'"
              >
                <input type="radio" value="till" v-model="form.tillType" class="sr-only" />
                <div class="p-2 rounded-lg bg-emerald-100 text-brand-green flex-shrink-0">
                  <CreditCard :size="18" />
                </div>
                <div>
                  <strong class="text-xs font-bold text-ink block">Buy Goods (Till Number)</strong>
                  <span class="text-[11px] text-ink-muted">Standard retail merchant till</span>
                </div>
              </label>

              <label
                class="border rounded-xl p-3.5 flex items-start gap-3 cursor-pointer transition-all"
                :class="form.tillType === 'paybill' ? 'border-brand-green bg-emerald-50/50 ring-1 ring-brand-green' : 'border-ink-border hover:border-slate-300'"
              >
                <input type="radio" value="paybill" v-model="form.tillType" class="sr-only" />
                <div class="p-2 rounded-lg bg-slate-100 text-ink-muted flex-shrink-0">
                  <Key :size="18" />
                </div>
                <div>
                  <strong class="text-xs font-bold text-ink block">Paybill Number</strong>
                  <span class="text-[11px] text-ink-muted">Business paybill with account references</span>
                </div>
              </label>
            </div>
          </div>

          <!-- STEP 2: Daraja Credentials -->
          <div class="bg-white rounded-xl shadow-card border border-ink-border p-6 space-y-4">
            <div class="flex justify-between items-center pb-2 border-b border-ink-border">
              <h2 class="font-display text-sm font-bold text-ink uppercase tracking-wider flex items-center gap-2">
                <span class="w-5 h-5 rounded-full bg-brand-green text-white text-[11px] flex items-center justify-center">2</span>
                Daraja App Credentials
              </h2>

              <div class="flex bg-slate-100 p-1 rounded-md text-[10px] font-bold">
                <button
                  type="button"
                  class="px-2.5 py-1 rounded transition-colors"
                  :class="form.environment === 'sandbox' ? 'bg-brand-green text-white' : 'text-ink-muted hover:text-ink'"
                  @click="form.environment = 'sandbox'"
                >
                  Sandbox
                </button>
                <button
                  type="button"
                  class="px-2.5 py-1 rounded transition-colors"
                  :class="form.environment === 'production' ? 'bg-brand-green text-white' : 'text-ink-muted hover:text-ink'"
                  @click="form.environment = 'production'"
                >
                  Production
                </button>
              </div>
            </div>

            <form class="space-y-3" @submit.prevent="handleSaveCredentials">
              <div class="space-y-1">
                <label class="text-xs font-semibold text-ink">
                  {{ form.tillType === 'till' ? 'Till Number (Shortcode) *' : 'Paybill Shortcode *' }}
                </label>
                <input
                  v-model="form.shortcode"
                  type="text"
                  placeholder="e.g. 174379 or your Till Number"
                  class="w-full px-3 py-2 border border-ink-border rounded text-xs font-mono outline-none focus:border-brand-green"
                  required
                />
              </div>

              <div v-if="form.tillType === 'till'" class="space-y-1">
                <label class="text-xs font-semibold text-ink">Store Number / Head Office (Optional)</label>
                <input
                  v-model="form.storeNumber"
                  type="text"
                  placeholder="Only if required by your Daraja app"
                  class="w-full px-3 py-2 border border-ink-border rounded text-xs font-mono outline-none focus:border-brand-green"
                />
              </div>

              <div class="space-y-1">
                <label class="text-xs font-semibold text-ink">Consumer Key *</label>
                <div class="relative flex items-center">
                  <Key :size="14" class="absolute left-3 text-ink-muted pointer-events-none" />
                  <input
                    v-model="form.consumerKey"
                    type="password"
                    placeholder="From Safaricom Developer Portal"
                    class="w-full pl-8 pr-3 py-2 border border-ink-border rounded text-xs font-mono outline-none focus:border-brand-green"
                    required
                  />
                </div>
              </div>

              <div class="space-y-1">
                <label class="text-xs font-semibold text-ink">Consumer Secret *</label>
                <div class="relative flex items-center">
                  <Lock :size="14" class="absolute left-3 text-ink-muted pointer-events-none" />
                  <input
                    v-model="form.consumerSecret"
                    type="password"
                    placeholder="From Safaricom Developer Portal"
                    class="w-full pl-8 pr-3 py-2 border border-ink-border rounded text-xs font-mono outline-none focus:border-brand-green"
                    required
                  />
                </div>
              </div>

              <div class="space-y-1">
                <label class="text-xs font-semibold text-ink">Lipa Na M-Pesa Online Passkey *</label>
                <textarea
                  v-model="form.passkey"
                  rows="2"
                  placeholder="Passkey issued by Safaricom for this shortcode"
                  class="w-full px-3 py-2 border border-ink-border rounded text-xs font-mono outline-none focus:border-brand-green resize-none"
                  required
                />
              </div>

              <div class="pt-2 flex justify-end">
                <button
                  type="submit"
                  class="bg-brand-green text-white text-xs font-bold uppercase px-5 py-2.5 rounded hover:bg-brand-green-hover transition-colors shadow cursor-pointer disabled:opacity-50"
                  :disabled="isSaving"
                >
                  {{ isSaving ? 'Saving Encrypted Keys...' : 'Save Credentials' }}
                </button>
              </div>
            </form>
          </div>

          <!-- STEP 3: KES 1 Verification STK Push -->
          <div class="bg-white rounded-xl shadow-card border border-ink-border p-6 space-y-4">
            <h2 class="font-display text-sm font-bold text-ink uppercase tracking-wider flex items-center gap-2">
              <span class="w-5 h-5 rounded-full bg-brand-green text-white text-[11px] flex items-center justify-center">3</span>
              Test &amp; Verify Payment Pipe (KES 1)
            </h2>

            <p class="text-xs text-ink-muted leading-relaxed">
              Flemela will fire an encrypted <strong>KES 1 test payment</strong> to your phone. Approving the prompt on your phone screen confirms your Daraja credentials and activates live storefront checkouts.
            </p>

            <div v-if="credsData?.last_error" class="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
              <AlertTriangle :size="15" class="flex-shrink-0 mt-0.5" />
              <span>{{ credsData.last_error }}</span>
            </div>

            <form class="flex flex-wrap gap-2 items-center pt-1" @submit.prevent="handleStartVerification">
              <div class="relative flex-1 min-w-[200px]">
                <Phone :size="15" class="absolute left-3 top-2.5 text-ink-muted pointer-events-none" />
                <input
                  v-model="verifyPhone"
                  type="tel"
                  placeholder="07XXXXXXXX (Admin Phone)"
                  class="w-full pl-9 pr-3 py-2 border border-ink-border rounded text-xs font-mono outline-none focus:border-brand-green"
                  :disabled="isPolling"
                  required
                />
              </div>

              <button
                type="submit"
                class="bg-brand-gold text-brand-green font-extrabold text-xs uppercase px-5 py-2.5 rounded hover:bg-brand-gold-hover transition-colors shadow flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                :disabled="isVerifying || isPolling"
              >
                <RefreshCw v-if="isPolling" :size="14" class="animate-spin" />
                <Zap v-else :size="14" />
                <span>{{ isPolling ? 'Awaiting PIN (Polling)...' : 'Send Test (KES 1)' }}</span>
              </button>
            </form>
          </div>
        </div>

        <!-- RIGHT: Step-by-Step Daraja Guide (5 cols) -->
        <div class="lg:col-span-5 bg-white rounded-xl shadow-card border border-ink-border p-6 space-y-4 sticky top-24">
          <div class="flex items-center gap-2 pb-3 border-b border-ink-border">
            <ShieldCheck :size="20" class="text-brand-green" />
            <h3 class="font-display font-bold text-sm text-ink uppercase">How to get credentials</h3>
          </div>

          <ol class="space-y-3.5 text-xs text-slate-700 list-decimal pl-4 leading-relaxed">
            <li>
              <strong>Log in to Daraja Developer Portal:</strong>
              <p class="text-[11px] text-ink-muted mt-0.5">
                Go to <a href="https://developer.safaricom.co.ke" target="_blank" class="text-brand-green font-bold underline inline-flex items-center gap-0.5">developer.safaricom.co.ke <ExternalLink :size="11" /></a> and sign in.
              </p>
            </li>
            <li>
              <strong>Create a new App:</strong>
              <p class="text-[11px] text-ink-muted mt-0.5">
                Under <em>My Apps</em>, click <strong>Add App</strong>. Check <strong>Lipa Na M-Pesa Online (STK Push)</strong>.
              </p>
            </li>
            <li>
              <strong>Copy Consumer Key &amp; Secret:</strong>
              <p class="text-[11px] text-ink-muted mt-0.5">
                Copy your app's Consumer Key and Consumer Secret and paste them into the form.
              </p>
            </li>
            <li>
              <strong>Obtain Passkey:</strong>
              <p class="text-[11px] text-ink-muted mt-0.5">
                For Sandbox, use the default test passkey. For Production, request it via Daraja portal for your Till/Paybill.
              </p>
            </li>
          </ol>

          <div class="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-[11px] text-brand-green space-y-1">
            <strong>Zero Custody Guarantee:</strong>
            <p class="text-slate-600">
              Customer payments land 100% in your own M-Pesa Till. Soko never holds or delays your revenue.
            </p>
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>