<!-- components/storefront/DeliveryTypeStep.vue -->
<script setup lang="ts">
import { Truck, Store } from 'lucide-vue-next';

export type DeliveryType = 'delivery' | 'pickup';

interface Props {
  modelValue: DeliveryType;
}

defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [val: DeliveryType];
}>();
</script>

<template>
  <div class="grid sm:grid-cols-2 gap-3">
    <!-- Option 1: Doorstep Delivery -->
    <label
      class="border rounded-xl p-4 flex items-start gap-3.5 cursor-pointer transition-all relative"
      :class="modelValue === 'delivery' ? 'border-brand-green bg-emerald-50/50 shadow-sm ring-1 ring-brand-green' : 'border-ink-border bg-white hover:border-slate-300'"
    >
      <input
        type="radio"
        value="delivery"
        :checked="modelValue === 'delivery'"
        class="sr-only"
        @change="emit('update:modelValue', 'delivery')"
      />
      <div class="w-9 h-9 rounded-full bg-emerald-100 text-brand-green flex items-center justify-center flex-shrink-0 mt-0.5">
        <Truck :size="18" />
      </div>
      <div class="space-y-0.5">
        <div class="flex items-center gap-2">
          <span class="text-xs font-extrabold uppercase text-ink">Doorstep Delivery</span>
          <span class="bg-brand-green text-white text-[9px] font-bold px-1.5 py-0.5 rounded">Boda / Courier</span>
        </div>
        <p class="text-[11px] text-ink-muted leading-relaxed">
          Dispatched directly to your estate, home, or office GPS pin.
        </p>
      </div>
    </label>

    <!-- Option 2: Store Pickup -->
    <label
      class="border rounded-xl p-4 flex items-start gap-3.5 cursor-pointer transition-all relative"
      :class="modelValue === 'pickup' ? 'border-brand-green bg-emerald-50/50 shadow-sm ring-1 ring-brand-green' : 'border-ink-border bg-white hover:border-slate-300'"
    >
      <input
        type="radio"
        value="pickup"
        :checked="modelValue === 'pickup'"
        class="sr-only"
        @change="emit('update:modelValue', 'pickup')"
      />
      <div class="w-9 h-9 rounded-full bg-slate-100 text-ink-muted flex items-center justify-center flex-shrink-0 mt-0.5">
        <Store :size="18" />
      </div>
      <div class="space-y-0.5">
        <div class="flex items-center gap-2">
          <span class="text-xs font-extrabold uppercase text-ink">Store Pickup</span>
          <span class="bg-emerald-100 text-brand-green text-[9px] font-bold px-1.5 py-0.5 rounded">FREE</span>
        </div>
        <p class="text-[11px] text-ink-muted leading-relaxed">
          Collect your book in person at Flemela Bookstore Hub (Sarit Centre).
        </p>
      </div>
    </label>
  </div>
</template>