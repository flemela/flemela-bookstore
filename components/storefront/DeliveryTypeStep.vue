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
	<div class="grid sm:grid-cols-2 gap-3.5 select-none font-sans">
		<!-- Option 1: Doorstep Delivery -->
		<label class="border rounded-2xl p-4 flex items-start gap-3.5 cursor-pointer transition-all relative" :class="modelValue === 'delivery'
        ? 'border-[#E8750D] bg-[#FFF7ED] shadow-xs ring-1 ring-[#E8750D]/30'
        : 'border-slate-200 bg-white hover:border-slate-300'">
			<input type="radio" value="delivery" :checked="modelValue === 'delivery'" class="sr-only"
				@change="emit('update:modelValue', 'delivery')" />
			<div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors"
				:class="modelValue === 'delivery' ? 'bg-[#FFEDD5] text-[#C25E00]' : 'bg-slate-100 text-slate-500'">
				<Truck :size="19" />
			</div>
			<div class="space-y-1">
				<div class="flex items-center gap-2">
					<span class="text-xs font-bold text-[#141E1A]">Doorstep Delivery</span>
					<span
						class="bg-[#E8750D] text-white text-[9.5px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
						Boda / Courier
					</span>
				</div>
				<p class="text-[11.5px] text-[#5F6964] leading-relaxed">
					Dispatched directly to your estate, home, or office GPS pin across Nairobi.
				</p>
			</div>
		</label>

		<!-- Option 2: Store Pickup -->
		<label class="border rounded-2xl p-4 flex items-start gap-3.5 cursor-pointer transition-all relative" :class="modelValue === 'pickup'
        ? 'border-[#E8750D] bg-[#FFF7ED] shadow-xs ring-1 ring-[#E8750D]/30'
        : 'border-slate-200 bg-white hover:border-slate-300'">
			<input type="radio" value="pickup" :checked="modelValue === 'pickup'" class="sr-only"
				@change="emit('update:modelValue', 'pickup')" />
			<div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors"
				:class="modelValue === 'pickup' ? 'bg-[#FFEDD5] text-[#C25E00]' : 'bg-slate-100 text-slate-500'">
				<Store :size="19" />
			</div>
			<div class="space-y-1">
				<div class="flex items-center gap-2">
					<span class="text-xs font-bold text-[#141E1A]">Store Pickup</span>
					<span
						class="bg-emerald-100 text-emerald-800 text-[9.5px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
						FREE
					</span>
				</div>
				<p class="text-[11.5px] text-[#5F6964] leading-relaxed">
					Collect your books in person at our Diamond Mall Hub, Parklands.
				</p>
			</div>
		</label>
	</div>
</template>