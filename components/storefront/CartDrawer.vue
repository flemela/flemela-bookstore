<!-- components/storefront/CartDrawer.vue -->
<script setup lang="ts">
import { X, Trash2, ShoppingBag, ArrowRight, ShieldCheck, Download, Truck } from 'lucide-vue-next';
import { useCart } from '~/composables/useCart';
import QuantityStepper from './QuantityStepper.vue';

const { items, isDrawerOpen, totalItems, subtotal, updateQuantity, removeItem, closeDrawer } = useCart();

function formatCurrency(val: number): string {
  return `KSh ${val.toLocaleString('en-KE')}`;
}
</script>

<template>
	<Teleport to="body">
		<Transition name="drawer">
			<div v-if="isDrawerOpen" class="fixed inset-0 z-50 flex justify-end font-sans">
				<!-- Backdrop -->
				<div class="fixed inset-0 bg-black/60 backdrop-blur-xs" @click="closeDrawer" />

				<!-- Drawer Panel -->
				<div class="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 text-[#141E1A]">
					<!-- Header -->
					<div class="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
						<div class="flex items-center gap-2.5">
							<ShoppingBag :size="18" class="text-[#E8750D]" />
							<h3 class="font-display font-bold text-base text-[#141E1A]">Your Reading Cart</h3>
							<span class="bg-[#E8750D] text-white text-xs font-bold px-2 py-0.5 rounded-full font-mono">
								{{ totalItems }}
							</span>
						</div>
						<button type="button"
							class="text-slate-500 hover:text-[#141E1A] hover:bg-slate-200/60 p-1.5 rounded-lg transition-colors cursor-pointer"
							aria-label="Close cart drawer" @click="closeDrawer">
							<X :size="18" />
						</button>
					</div>

					<!-- Empty State -->
					<div v-if="items.length === 0"
						class="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
						<div
							class="w-16 h-16 rounded-full bg-[#FFF7ED] flex items-center justify-center text-[#E8750D]">
							<ShoppingBag :size="32" class="opacity-80" />
						</div>
						<h4 class="font-display font-bold text-base text-[#141E1A]">Your cart is empty</h4>
						<p class="text-xs text-[#5F6964] max-w-xs leading-relaxed">
							Explore our catalog and add eBooks or physical print copies to your reading list.
						</p>
						<button type="button"
							class="bg-[#141E1A] hover:bg-black text-white text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-xl transition-colors shadow-subtle cursor-pointer"
							@click="closeDrawer">
							Start Browsing
						</button>
					</div>

					<!-- Items List -->
					<div v-else class="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-slate-100">
						<div v-for="item in items" :key="`${item.productId}-${item.formatId}`"
							class="pt-3 first:pt-0 flex gap-3.5 items-start">
							<!-- Cover Thumbnail -->
							<div
								class="w-14 h-18 bg-slate-50 rounded-lg border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center shadow-2xs">
								<img v-if="item.coverUrl" :src="item.coverUrl" :alt="item.title"
									class="w-full h-full object-cover" />
								<ShoppingBag v-else :size="18" class="text-slate-400 opacity-40" />
							</div>

							<!-- Item Info -->
							<div class="flex-1 min-w-0 space-y-1">
								<div class="flex justify-between items-start gap-2">
									<h5 class="text-xs font-bold text-[#141E1A] truncate leading-tight">{{ item.title }}
									</h5>
									<button type="button"
										class="text-slate-400 hover:text-red-700 p-0.5 cursor-pointer transition-colors"
										title="Remove item" @click="removeItem(item.productId, item.formatId)">
										<Trash2 :size="14" />
									</button>
								</div>

								<div class="flex items-center gap-2">
									<span
										class="text-[9px] font-mono font-extrabold uppercase px-2 py-0.5 rounded border"
										:class="item.format === 'hardcopy'
                      ? 'bg-amber-50 text-amber-950 border-amber-200'
                      : 'bg-orange-50 text-orange-950 border-orange-200'">
										<component :is="item.format === 'hardcopy' ? Truck : Download" :size="9" />
										{{ item.format === 'hardcopy' ? 'Hardcopy' : `eBook
										(${item.format.toUpperCase()})` }}
									</span>
									<span v-if="item.author" class="text-[11px] text-[#5F6964] truncate">{{ item.author
										}}</span>
								</div>

								<div class="flex justify-between items-center pt-2">
									<QuantityStepper :model-value="item.quantity" :disabled="item.format !== 'hardcopy'"
										size="sm"
										@update:model-value="(qty) => updateQuantity(item.productId, item.formatId, qty)" />
									<span class="text-xs font-bold text-[#141E1A] font-mono tabular-figure">
										{{ formatCurrency(item.price * item.quantity) }}
									</span>
								</div>
							</div>
						</div>
					</div>

					<!-- Footer & Checkout CTA -->
					<div v-if="items.length > 0" class="p-4 border-t border-slate-100 bg-slate-50 space-y-3">
						<div class="flex justify-between items-center text-xs">
							<span class="text-[#5F6964] font-bold">Subtotal</span>
							<span class="text-base font-extrabold text-[#141E1A] font-mono tabular-figure">
								{{ formatCurrency(subtotal) }}
							</span>
						</div>

						<div class="flex items-center gap-2 text-xs text-[#5F6964]">
							<ShieldCheck :size="16" class="text-emerald-700 flex-shrink-0" />
							<span>Instant eBook downloads &amp; original print copies.</span>
						</div>

						<NuxtLink to="/checkout"
							class="w-full bg-gradient-to-b from-[#F07514] via-[#E86C0E] to-[#D85F06] hover:from-[#E86C0E] hover:to-[#C85202] text-white text-xs font-bold uppercase tracking-wider py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-medium cursor-pointer active:scale-[0.98]"
							@click="closeDrawer">
							<span>Proceed to Checkout</span>
							<ArrowRight :size="15" />
						</NuxtLink>
					</div>
				</div>
			</div>
		</Transition>
	</Teleport>
</template>