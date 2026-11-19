<!-- components/storefront/FlashSaleStrip.vue (The Sunrise Bookstore) -->
<template>
	<section v-if="books && books.length > 0" id="flash-sale"
		class="relative py-2 sm:py-2.5 select-none overflow-hidden"
		:style="{ backgroundColor: bgColor || '#FBF9F6' }" aria-label="Flash Sale Deals">
		<!-- Solid brand accent bar -->
		<div class="absolute top-0 left-0 right-0 h-[3px] bg-[#E8750D]" aria-hidden="true" />

		<div class="container-page relative z-10">

			<!-- TOP HEADER: Strict Monochrome Contrast (Pure White on Dark, Deep Ink on Light) -->
			<div class="flex flex-row items-center justify-between gap-2 sm:gap-2.5 mb-2 sm:mb-2.5 pb-1.5 sm:pb-2 border-b"
				:class="isDark ? 'border-white/15' : 'border-slate-100'">
				<div class="space-y-0.5">
					<h2 class="font-poster heading-section font-extrabold uppercase tracking-wide"
						:class="isDark ? 'text-white' : 'text-[#141E1A]'">
						{{ title }}
					</h2>
				</div>

				<!-- Live Countdown Clock: High Contrast Monochrome -->
				<div class="flex items-center gap-1.5 sm:gap-2 rounded-lg px-2 py-1 sm:px-3 sm:py-1.5 shadow-2xs shrink-0 self-center border"
					:class="isDark ? 'bg-white/15 border-white/25 text-white' : 'bg-black/5 border-black/10 text-[#141E1A]'">
					<span class="text-[10px] sm:text-[11px] font-mono font-bold hidden min-[420px]:inline-flex sm:inline-flex items-center gap-1"
						:class="isDark ? 'text-white' : 'text-[#141E1A]'">
						<Clock :size="12" />
						ENDS IN:
					</span>
					<div class="flex items-center gap-0.5 font-mono text-[11px] font-black">
						<span class="px-1.5 py-0.2 rounded shadow-2xs"
							:class="isDark ? 'bg-black/50 text-white' : 'bg-white text-[#141E1A] border border-slate-200'">
							{{ formattedTime.hours }}h
						</span>
						<span :class="isDark ? 'text-white/70' : 'text-black/60'">:</span>
						<span class="px-1.5 py-0.2 rounded shadow-2xs"
							:class="isDark ? 'bg-black/50 text-white' : 'bg-white text-[#141E1A] border border-slate-200'">
							{{ formattedTime.minutes }}m
						</span>
						<span :class="isDark ? 'text-white/70' : 'text-black/60'">:</span>
						<span class="px-1.5 py-0.2 rounded shadow-2xs"
							:class="isDark ? 'bg-black/50 text-white' : 'bg-white text-[#141E1A] border border-slate-200'">
							{{ formattedTime.seconds }}s
						</span>
					</div>
				</div>
			</div>

			<!-- CAROUSEL TRACK (Mobile: 2 fully in view + 1 overflowing on right edge; Desktop: 5 across) -->
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
					class="flex gap-2.5 sm:gap-3 lg:gap-3.5 overflow-x-auto scroll-smooth no-scrollbar py-1 snap-x snap-proximity overscroll-x-contain [-webkit-overflow-scrolling:touch] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E8750D]/60 rounded-lg"
					tabindex="0" role="region" aria-label="Scrollable book list" style="touch-action: pan-y;" @scroll="checkScrollButtons">
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
import { ChevronLeft, ChevronRight, Clock } from 'lucide-vue-next';
import ShelfBookCard from '~/components/storefront/ShelfBookCard.vue';
import type { Book } from '~/types';

interface Props {
  books: Book[];
  title?: string;
  bgColor?: string;
}

const props = withDefaults(defineProps<Props>(), {
  title: 'FLASH SALE DEALS',
  bgColor: '',
});

defineEmits<{
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

watch(
  () => props.books,
  async () => {
    await nextTick();
    checkScrollButtons();
  },
  { deep: true }
);

const hours = ref('08');
const minutes = ref('24');
const seconds = ref('36');
let timerInterval: ReturnType<typeof setInterval> | undefined;

function updateCountdown(): void {
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  const diff = Math.max(0, target.getTime() - now.getTime());

  const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const m = Math.floor((diff / 1000 / 60) % 60);
  const s = Math.floor((diff / 1000) % 60);

  hours.value = String(h).padStart(2, '0');
  minutes.value = String(m).padStart(2, '0');
  seconds.value = String(s).padStart(2, '0');
}

const formattedTime = computed(() => ({
  hours: hours.value,
  minutes: minutes.value,
  seconds: seconds.value,
}));

onMounted(() => {
  updateCountdown();
  timerInterval = setInterval(updateCountdown, 1000);
  setTimeout(checkScrollButtons, 300);
  window.addEventListener('resize', checkScrollButtons);
});

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval);
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