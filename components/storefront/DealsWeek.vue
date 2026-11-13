<!-- components/storefront/DealsWeek.vue -->
<template>
	<section id="bestsellers-week" class="relative py-4 sm:py-5 select-none overflow-hidden"
		:style="{ backgroundColor: bgColor || '#FBF9F6' }" aria-label="Deals of the Week">
		<!-- Solid brand accent bar -->
		<div class="absolute top-0 left-0 right-0 h-[3px] bg-[#E8750D]" aria-hidden="true" />

		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

			<!-- TOP HEADER: Strict Monochrome Contrast -->
			<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3.5 pb-2.5 border-b"
				:class="isDark ? 'border-white/15' : 'border-slate-100'">
				<div class="space-y-0.5">
					<div class="flex items-center gap-1.5">
						<span class="text-[9.5px] sm:text-[10px] font-mono font-bold uppercase tracking-widest block"
							:class="isDark ? 'text-white' : 'text-[#141E1A]'">
							{{ badgeLabel }}
						</span>
					</div>

					<h2 class="font-poster text-2xl sm:text-3xl lg:text-4xl font-extrabold uppercase tracking-wide leading-none"
						:class="isDark ? 'text-white' : 'text-[#141E1A]'">
						{{ title }}
					</h2>

					<p class="text-[11px] sm:text-xs line-clamp-1" :class="isDark ? 'text-white/80' : 'text-slate-600'">
						{{ subtitle }}
					</p>
				</div>

				<!-- Updated Weekly Pill -->
				<div class="flex items-center gap-2 rounded-full px-3 py-1.5 shadow-2xs shrink-0 self-start sm:self-auto"
					:class="isDark ? 'bg-white/15 text-white' : 'bg-[#141E1A] text-white'">
					<Sparkles :size="12" class="text-[#FFD29D]" />
					<span class="text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-wider">Updated weekly</span>
				</div>
			</div>

			<!-- CAROUSEL TRACK (Mobile: 2 in view + 1 overflowing on right edge; Desktop: 5 across) -->
			<div class="relative group">
				<button type="button"
					class="absolute -left-2.5 sm:-left-4 top-1/2 -translate-y-1/2 z-30 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white text-slate-800 hover:text-[#E8750D] hover:bg-[#FFF7ED] shadow-md flex items-center justify-center transition-all cursor-pointer active:scale-95 disabled:opacity-20 disabled:cursor-not-allowed"
					:disabled="!canScrollLeft" aria-label="Scroll left to previous books" @click="scrollLeft">
					<ChevronLeft :size="20" class="stroke-[2.5]" />
				</button>

				<button type="button"
					class="absolute -right-2.5 sm:-right-4 top-1/2 -translate-y-1/2 z-30 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white text-slate-800 hover:text-[#E8750D] hover:bg-[#FFF7ED] shadow-md flex items-center justify-center transition-all cursor-pointer active:scale-95 disabled:opacity-20 disabled:cursor-not-allowed"
					:disabled="!canScrollRight" aria-label="Scroll right to next books" @click="scrollRight">
					<ChevronRight :size="20" class="stroke-[2.5]" />
				</button>

				<div ref="scrollContainer"
					class="flex gap-2.5 sm:gap-3 lg:gap-3.5 overflow-x-auto scroll-smooth no-scrollbar py-1 snap-x snap-mandatory"
					style="touch-action: pan-y;" @scroll="checkScrollButtons">
					<div v-for="book in books" :key="book.id"
						class="w-[min(78vw,250px)] sm:w-[calc((100%-0.75rem)/2)] lg:w-[calc((100%-3.75rem)/5)] flex-shrink-0 snap-start flex">
						<ShelfBookCard :book="book" class="h-full"
							@request-seed="(t, a) => $emit('request-seed', t, a)" />
					</div>
				</div>
			</div>

		</div>
	</section>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick, watch } from 'vue';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-vue-next';
import ShelfBookCard from './ShelfBookCard.vue';

interface Props {
  books: any[];
  title?: string;
  subtitle?: string;
  badgeLabel?: string;
  bgColor?: string;
}

const props = withDefaults(defineProps<Props>(), {
  title: 'DEALS OF THE WEEK',
  subtitle: 'Handpicked titles at special discounts — instant digital download or physical delivery.',
  badgeLabel: 'FEATURED PROMOTIONS',
  bgColor: '',
});

defineEmits<{
  (e: 'add-to-cart', payload: any): void;
  (e: 'request-seed', title: string, author?: string): void;
}>();

const scrollContainer = ref<HTMLElement | null>(null);
const canScrollLeft = ref(false);
const canScrollRight = ref(true);

function isDarkBackground(hex?: string | null): boolean {
  if (!hex || !hex.startsWith('#')) return false;
  const clean = hex.replace('#', '');
  if (clean.length !== 6 && clean.length !== 3) return false;
  const fullHex = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const r = parseInt(fullHex.slice(0, 2), 16);
  const g = parseInt(fullHex.slice(2, 4), 16);
  const b = parseInt(fullHex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.55;
}

const isDark = computed(() => isDarkBackground(props.bgColor));

function checkScrollButtons(): void {
  if (!scrollContainer.value) return;
  const { scrollLeft, scrollWidth, clientWidth } = scrollContainer.value;
  canScrollLeft.value = scrollLeft > 8;
  canScrollRight.value = scrollLeft + clientWidth < scrollWidth - 8;
}

function scrollLeft(): void {
  if (!scrollContainer.value) return;
  const firstChild = scrollContainer.value.firstElementChild as HTMLElement | null;
  const cardWidth = firstChild ? firstChild.clientWidth : 150;
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;
  const count = isDesktop ? 4 : 2;
  const scrollDistance = (cardWidth + 12) * count;
  scrollContainer.value.scrollBy({ left: -scrollDistance, behavior: 'smooth' });
}

function scrollRight(): void {
  if (!scrollContainer.value) return;
  const firstChild = scrollContainer.value.firstElementChild as HTMLElement | null;
  const cardWidth = firstChild ? firstChild.clientWidth : 150;
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;
  const count = isDesktop ? 4 : 2;
  const scrollDistance = (cardWidth + 12) * count;
  scrollContainer.value.scrollBy({ left: scrollDistance, behavior: 'smooth' });
}

watch(
  () => props.books,
  async () => {
    await nextTick();
    checkScrollButtons();
  },
  { deep: true }
);

onMounted(() => {
  setTimeout(checkScrollButtons, 300);
  window.addEventListener('resize', checkScrollButtons);
});

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', checkScrollButtons);
  }
});

</script>

<style scoped>
	.no-scrollbar::-webkit-scrollbar {
		display: none;
	}

	.no-scrollbar {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
</style>