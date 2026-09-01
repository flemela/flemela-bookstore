<!-- pages/admin/location.vue -->
<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import {
  MapPin,
  Navigation,
  Bike,
  ShieldCheck,
  Calculator,
  ArrowLeft,
} from 'lucide-vue-next';
import AdminLayout from '~/components/admin/AdminLayout.vue';
import LeafletPinPicker from '~/components/storefront/LeafletPinPicker.vue';
import { useToast } from '~/composables/useToast';

definePageMeta({
  middleware: 'admin-auth',
});

const { push: pushToast } = useToast();
const mapRef = ref<InstanceType<typeof LeafletPinPicker> | null>(null);

interface LocationConfig {
  name: string;
  lat: number;
  lng: number;
  address_text: string | null;
  base_distance_km: number;
  base_delivery_fee: number;
  fee_per_km: number;
  max_delivery_radius_km: number;
}

const form = reactive<LocationConfig>({
  name: 'Flemela Bookstore Main Hub',
  lat: -1.2683,
  lng: 36.8111,
  address_text: 'Sarit Centre Lower Level, Westlands, Nairobi',
  base_distance_km: 2,
  base_delivery_fee: 100,
  fee_per_km: 25,
  max_delivery_radius_km: 15,
});

const isLocating = ref(false);
const isSaving = ref(false);

// Test Sandbox Calculator State
const testDistance = ref<number>(5.0);

const simulatedFee = computed(() => {
  const dist = Number(testDistance.value) || 0;
  if (dist <= 0) return { fee: 0, status: 'Invalid distance' };
  if (dist > form.max_delivery_radius_km) {
    return { fee: 0, status: 'Needs Merchant Confirmation (Out of Radius)' };
  }
  const billableKm = Math.max(0, dist - form.base_distance_km);
  const total = Math.round(form.base_delivery_fee + billableKm * form.fee_per_km);
  return { fee: total, status: 'Automated Rate' };
});

onMounted(async () => {
  try {
    const data = await $fetch<LocationConfig>('/api/admin/location');
    if (data) {
      form.name = data.name || form.name;
      form.lat = Number(data.lat) || form.lat;
      form.lng = Number(data.lng) || form.lng;
      form.address_text = data.address_text || form.address_text;
      form.base_distance_km = Number(data.base_distance_km) || 2;
      form.base_delivery_fee = Number(data.base_delivery_fee) || 100;
      form.fee_per_km = Number(data.fee_per_km) || 25;
      form.max_delivery_radius_km = Number(data.max_delivery_radius_km) || 15;
      mapRef.value?.setCenter(form.lat, form.lng, 15);
    }
  } catch {
    // Non-blocking fallback to defaults
  }
});

function handleMapPinUpdate(coords: { lat: number; lng: number }): void {
  form.lat = coords.lat;
  form.lng = coords.lng;
}

function handleGetDeviceGps(): void {
  if (!process.client || !navigator.geolocation) {
    pushToast({ message: 'Geolocation is not supported by your browser', variant: 'error' });
    return;
  }

  isLocating.value = true;
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      isLocating.value = false;
      form.lat = pos.coords.latitude;
      form.lng = pos.coords.longitude;
      mapRef.value?.setCenter(pos.coords.latitude, pos.coords.longitude, 16);
      pushToast({ message: 'Map pin centered to current device GPS', variant: 'success' });
    },
    () => {
      isLocating.value = false;
      pushToast({ message: 'Could not obtain device GPS. You can tap the map directly.', variant: 'error' });
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

async function handleSave(): Promise<void> {
  if (!form.name.trim() || !form.lat || !form.lng) {
    pushToast({ message: 'Hub name and GPS coordinates are required', variant: 'error' });
    return;
  }

  isSaving.value = true;
  try {
    await $fetch('/api/admin/location', {
      method: 'PATCH',
      body: {
        name: form.name.trim(),
        lat: Number(form.lat),
        lng: Number(form.lng),
        address_text: form.address_text?.trim() || null,
        base_distance_km: Number(form.base_distance_km),
        base_delivery_fee: Number(form.base_delivery_fee),
        fee_per_km: Number(form.fee_per_km),
        max_delivery_radius_km: Number(form.max_delivery_radius_km),
      },
    });

    pushToast({ message: 'Store Hub location & delivery rules updated!', variant: 'success' });
  } catch (err: any) {
    pushToast({ message: err.data?.statusMessage || err.statusMessage || 'Failed to save location', variant: 'error' });
  } finally {
    isSaving.value = false;
  }
}
</script>

<template>
  <AdminLayout>
    <div class="max-w-5xl mx-auto space-y-6">
      <NuxtLink to="/admin" class="inline-flex items-center gap-1.5 text-xs font-bold text-forest-900 hover:underline">
        <ArrowLeft :size="14" /> Back to Dashboard
      </NuxtLink>

      <div class="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-ink-border">
        <div>
          <h1 class="font-display text-2xl font-bold text-forest-950">Store Hub &amp; Delivery Fee Setup</h1>
          <p class="text-xs text-ink-muted">
            Configure your physical hub GPS pin and automated distance fee calculation rules.
          </p>
        </div>

        <button
          type="button"
          class="bg-forest-900 text-white text-xs font-bold uppercase px-5 py-2.5 rounded shadow-subtle hover:bg-forest-800 transition-all cursor-pointer disabled:opacity-50"
          :disabled="isSaving"
          @click="handleSave"
        >
          {{ isSaving ? 'Saving...' : 'Save Configuration' }}
        </button>
      </div>

      <div class="grid lg:grid-cols-12 gap-8 items-start">
        <!-- Left: Map & Form (7 Cols) -->
        <div class="lg:col-span-7 space-y-5">
          <!-- Step 1: Physical Hub GPS Pin -->
          <div class="bg-white rounded-xl shadow-subtle border border-ink-border p-6 space-y-4">
            <div class="flex items-center justify-between pb-2 border-b border-ink-border">
              <h2 class="font-display text-sm font-bold text-forest-950 uppercase tracking-wider flex items-center gap-2">
                <MapPin :size="16" class="text-gold-600" />
                1. Set Bookstore Hub GPS Pin
              </h2>

              <button
                type="button"
                class="px-3 py-1.5 rounded bg-paper-cream hover:bg-slate-200 text-xs font-bold text-forest-950 flex items-center gap-1.5 transition-colors cursor-pointer border border-ink-border"
                :disabled="isLocating"
                @click="handleGetDeviceGps"
              >
                <Navigation :size="13" class="text-forest-900" />
                <span>{{ isLocating ? 'Locating...' : 'Use Device GPS' }}</span>
              </button>
            </div>

            <p class="text-xs text-ink-muted leading-relaxed">
              Drop the pin on your store, warehouse, or Sarit Centre counter. Customer delivery distances are calculated from this pin.
            </p>

            <LeafletPinPicker
              ref="mapRef"
              :lat="form.lat"
              :lng="form.lng"
              @update:location="handleMapPinUpdate"
            />

            <div class="grid sm:grid-cols-2 gap-3 pt-2">
              <div class="space-y-1">
                <label class="text-xs font-semibold text-forest-950">Hub / Branch Name *</label>
                <input
                  v-model="form.name"
                  type="text"
                  placeholder="e.g. Sarit Centre Hub"
                  class="w-full px-3 py-2 border border-ink-border rounded text-xs outline-none focus:border-forest-900"
                />
              </div>

              <div class="space-y-1">
                <label class="text-xs font-semibold text-forest-950">Physical Address / Floor</label>
                <input
                  v-model="form.address_text"
                  type="text"
                  placeholder="e.g. Ground Floor, Sarit Centre"
                  class="w-full px-3 py-2 border border-ink-border rounded text-xs outline-none focus:border-forest-900"
                />
              </div>
            </div>
          </div>

          <!-- Step 2: Distance & Tiered Pricing Rules -->
          <div class="bg-white rounded-xl shadow-subtle border border-ink-border p-6 space-y-4">
            <h2 class="font-display text-sm font-bold text-forest-950 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-ink-border">
              <Bike :size="16" class="text-forest-900" />
              2. Tiered Distance Pricing Rules
            </h2>

            <div class="grid sm:grid-cols-2 gap-4">
              <div class="space-y-1">
                <label class="text-xs font-semibold text-forest-950">Base Threshold Distance (km) *</label>
                <input
                  v-model.number="form.base_distance_km"
                  type="number"
                  min="0.5"
                  step="0.5"
                  class="w-full px-3 py-2 border border-ink-border rounded text-xs font-mono font-bold outline-none focus:border-forest-900"
                />
                <span class="text-[10px] text-ink-muted block">Deliveries within this distance pay flat base fee.</span>
              </div>

              <div class="space-y-1">
                <label class="text-xs font-semibold text-forest-950">Base Flat Rate (KSh) *</label>
                <input
                  v-model.number="form.base_delivery_fee"
                  type="number"
                  min="0"
                  class="w-full px-3 py-2 border border-ink-border rounded text-xs font-mono font-bold outline-none focus:border-forest-900"
                />
                <span class="text-[10px] text-ink-muted block">Flat fee charged for the first {{ form.base_distance_km }} km.</span>
              </div>
            </div>

            <div class="grid sm:grid-cols-2 gap-4 pt-2">
              <div class="space-y-1">
                <label class="text-xs font-semibold text-forest-950">Fee per Extra km beyond {{ form.base_distance_km }} km (KSh) *</label>
                <input
                  v-model.number="form.fee_per_km"
                  type="number"
                  min="0"
                  class="w-full px-3 py-2 border border-ink-border rounded text-xs font-mono font-bold outline-none focus:border-forest-900"
                />
                <span class="text-[10px] text-ink-muted block">Added for every km beyond {{ form.base_distance_km }} km.</span>
              </div>

              <div class="space-y-1">
                <label class="text-xs font-semibold text-forest-950">Maximum Delivery Limit (km) *</label>
                <input
                  v-model.number="form.max_delivery_radius_km"
                  type="number"
                  min="1"
                  max="100"
                  class="w-full px-3 py-2 border border-ink-border rounded text-xs font-mono font-bold outline-none focus:border-forest-900"
                />
                <span class="text-[10px] text-ink-muted block">Beyond this, checkout prompts customer to contact store.</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Real-Time Test Calculator (5 Cols) -->
        <div class="lg:col-span-5 space-y-5 sticky top-24">
          <div class="bg-white rounded-xl shadow-subtle border border-ink-border p-6 space-y-4">
            <div class="flex items-center gap-2 pb-2 border-b border-ink-border">
              <Calculator :size="18" class="text-gold-600" />
              <h3 class="font-display font-bold text-sm text-forest-950 uppercase">Live Delivery Rate Preview</h3>
            </div>

            <p class="text-xs text-ink-muted leading-relaxed">
              Test how customer delivery fees will be computed based on the rules configured on the left:
            </p>

            <div class="p-4 bg-paper-cream border border-ink-border rounded-lg space-y-3">
              <div class="space-y-1">
                <div class="flex justify-between items-center text-xs">
                  <span class="font-semibold text-forest-950">Simulated Distance:</span>
                  <span class="font-mono font-bold text-forest-950">{{ testDistance }} km</span>
                </div>
                <input
                  v-model.number="testDistance"
                  type="range"
                  min="0.5"
                  max="25"
                  step="0.5"
                  class="w-full accent-forest-900 cursor-pointer"
                />
              </div>

              <div class="pt-2 border-t border-ink-border/60 space-y-1.5 text-xs">
                <div class="flex justify-between">
                  <span class="text-ink-muted">Calculation Status:</span>
                  <span class="font-bold text-forest-950">{{ simulatedFee.status }}</span>
                </div>
                <div class="flex justify-between items-baseline pt-1">
                  <span class="font-semibold text-forest-950">Customer Delivery Fee:</span>
                  <span class="font-mono text-lg font-extrabold text-forest-950">
                    {{ simulatedFee.fee > 0 ? `KSh ${simulatedFee.fee.toLocaleString('en-KE')}` : 'Requires Confirmation' }}
                  </span>
                </div>
              </div>
            </div>

            <div class="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-[11px] text-emerald-950 space-y-1">
              <div class="flex items-center gap-1.5 font-bold">
                <ShieldCheck :size="14" class="text-emerald-700" />
                <span>Zero Custody Delivery Integration</span>
              </div>
              <p class="text-slate-700 leading-normal">
                Deliveries are tracked using our 4-digit verification code upon rider arrival.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>