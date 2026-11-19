<!-- components/storefront/DealsWeek.vue -->
<template>
	<section id="bestsellers-week" class="relative py-2 sm:py-2.5 select-none overflow-hidden"
		:style="{ backgroundColor: bgColor || '#FBF9F6' }" aria-label="Deals of the Week">
		<!-- Solid brand accent bar -->
		<div class="absolute top-0 left-0 right-0 h-[3px] bg-[#E8750D]" aria-hidden="true" />

		<div class="container-page relative z-10">

			<!-- TOP HEADER: Strict Monochrome Contrast -->
			<div class="flex flex-row items-center justify-between gap-2 sm:gap-2.5 mb-2 sm:mb-2.5 pb-1.5 sm:pb-2 border-b"
				:class="isDark ? 'border-white/15' : 'border-slate-100'">
				<div class="space-y-0.5">
					<h2 class="font-poster heading-section font-extrabold uppercase tracking-wide"
						:class="isDark ? 'text-white' : 'text-[#141E1A]'">
						{{ title }}
					</h2>
				</div>

				<!-- Updated Weekly Pill -->
				<div class="flex items-center gap-1.5 sm:gap-2 rounded-full px-2 py-1 sm:px-3 sm:py-1.5 shadow-2xs shrink-0 self-center"
					:class="isDark ? 'bg-white/15 text-white' : 'bg-[#141E1A] text-white'">
					<Sparkles :size="12" class="text-[#FFD29D]" />
					<span class="text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-wider">Updated weekly</span>
				</div>
			</div>

			<!-- CAROUSEL TRACK (Mobile: 2 in view + 1 overflowing on right edge; Desktop: 5 across) -->
			<div class="relative group">
				<button type="button"
					class="absolute -left-2.5 sm:-left-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 sm:w-9 sm:h-9 rounded-full bg-white text-slate-800 hover:text-[#E8750D] hover:bg-[#FFF7ED] shadow-md flex items-center justify-center transition-all cursor-pointer active:scale-95 disabled:opacity-20 disabled:cursor-not-allowed"
					:disabled="!canScrollLeft" aria-label="Scroll left to previous books" @click="scrollLeft">
					<ChevronLeft :size="20" class="stroke-[2.5]" />
				</button>

				<button type="button"
					class="absolute -right-2.5 sm:-right-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 sm:w-9 sm:h-9 rounded-full bg-white text-slate-800 hover:text-[#E8750D] hover:bg-[#FFF7ED] shadow-md flex items-center justify-center transition-all cursor-pointer active:scale-95 disabled:opacity-20 disabled:cursor-not-allowed"
					:disabled="!canScrollRight" aria-label="Scroll right to next books" @click="scrollRight">
					<ChevronRight :size="20" class="stroke-[2.5]" />
				</button>

				<div ref="scrollContainer"
					class="flex gap-2.5 sm:gap-3 lg:gap-3.5 overflow-x-auto rail-scroll py-1.5 snap-x snap-proximity overscroll-x-contain [-webkit-overflow-scrolling:touch] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#E8750D]/60 rounded-lg"
					tabindex="0" role="region" aria-label="Scrollable book list — use arrow keys or mouse wheel" style="touch-action: pan-x pan-y;" @scroll="checkScrollButtons" @wheel="onRailWheel" @keydown="onRailKeydown">
					<div v-for="book in books" :key="book.id"
						class="w-[min(70vw,232px)] sm:w-[calc((100%-2.25rem)/4)] md:w-[calc((100%-3rem)/5)] flex-shrink-0 snap-start flex">
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
  bgColor?: string;
}

const props = withDefaults(defineProps<Props>(), {
  title: 'DEALS OF THE WEEK',
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
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;
  const count = isDesktop ? 5 : 2;
  const scrollDistance = (cardWidth + 12) * count;
  scrollContainer.value.scrollBy({ left: -scrollDistance, behavior: 'smooth' });
}

function scrollRight(): void {
  if (!scrollContainer.value) return;
  const firstChild = scrollContainer.value.firstElementChild as HTMLElement | null;
  const cardWidth = firstChild ? firstChild.clientWidth : 150;
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;
  const count = isDesktop ? 5 : 2;
  const scrollDistance = (cardWidth + 12) * count;
  scrollContainer.value.scrollBy({ left: scrollDistance, behavior: 'smooth' });
}


function onRailWheel(event: WheelEvent): void {
  const el = scrollContainer.value;
  if (!el) return;
  if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
  const maxScroll = el.scrollWidth - el.clientWidth;
  const next = el.scrollLeft + event.deltaY;
  const canConsume =
    (event.deltaY > 0 && el.scrollLeft < maxScroll - 1) ||
    (event.deltaY < 0 && el.scrollLeft > 1);
  if (!canConsume) return; // let the page scroll when the rail is at its edge
  event.preventDefault();
  el.scrollTo({ left: next, behavior: 'auto' });
  checkScrollButtons();
}

function onRailKeydown(event: KeyboardEvent): void {
  const el = scrollContainer.value;
  if (!el) return;
  const firstChild = el.firstElementChild as HTMLElement | null;
  const step = firstChild ? firstChild.clientWidth + 12 : 220;
  if (event.key === 'ArrowRight') {
    event.preventDefault();
    el.scrollBy({ left: step, behavior: 'smooth' });
  } else if (event.key === 'ArrowLeft') {
    event.preventDefault();
    el.scrollBy({ left: -step, behavior: 'smooth' });
  } else if (event.key === 'Home') {
    event.preventDefault();
    el.scrollTo({ left: 0, behavior: 'smooth' });
  } else if (event.key === 'End') {
    event.preventDefault();
    el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' });
  }
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