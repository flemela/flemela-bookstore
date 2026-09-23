<!-- components/storefront/FlashSaleStrip.vue (The Sunrise Bookstore) -->
<template>
	<section v-if="books && books.length > 0" id="flash-sale" class="py-10 sm:py-14 bg-transparent select-none"
		aria-label="Flash Sale Deals">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

			<!-- TOP HEADER: Red Eyebrow, Red Headline & Red Live Countdown Timer -->
			<div
				class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
				<div class="space-y-1">
					<div class="flex items-center gap-2">
						<span
							class="text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-widest text-red-600 flex items-center gap-1">
							<Zap :size="12" class="fill-current text-red-600" />
							{{ badgeLabel }}
						</span>
					</div>
					<!-- Red Heading -->
					<h2
						class="font-poster text-3xl sm:text-4xl lg:text-5xl font-extrabold uppercase text-red-600 tracking-wide leading-none drop-shadow-xs">
						{{ title }}
					</h2>
					<p class="text-xs sm:text-sm text-slate-600 mt-1">
						Limited-time price cuts on bestselling literature and digital editions. Order before the timer
						runs out!
					</p>
				</div>

				<!-- Live Red Countdown Clock -->
				<div
					class="flex items-center gap-2.5 bg-red-50/80 border border-red-200 rounded-xl px-4 py-2 shadow-xs shrink-0 self-start sm:self-auto">
					<span class="text-xs font-mono font-bold text-red-600 flex items-center gap-1.5">
						<span class="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
						<Clock :size="13" class="text-red-600" />
						ENDS IN:
					</span>
					<div class="flex items-center gap-1 font-mono text-xs font-black text-red-700">
						<span class="bg-white px-2 py-0.5 rounded border border-red-200 shadow-2xs">{{
							formattedTime.hours }}h</span>
						<span class="text-red-400">:</span>
						<span class="bg-white px-2 py-0.5 rounded border border-red-200 shadow-2xs">{{
							formattedTime.minutes }}m</span>
						<span class="text-red-400">:</span>
						<span class="bg-white px-2 py-0.5 rounded border border-red-200 shadow-2xs">{{
							formattedTime.seconds }}s</span>
					</div>
				</div>
			</div>

			<!-- CAROUSEL TRACK WITH LEFT & RIGHT NAVIGATION BUTTONS -->
			<div class="relative group">
				<!-- Left Chevron -->
				<button type="button"
					class="absolute -left-3 sm:-left-5 top-1/2 -translate-y-1/2 z-30 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white text-slate-800 hover:text-red-600 hover:border-red-500 hover:bg-red-50 border border-slate-300 shadow-[0_4px_18px_rgba(0,0,0,0.15)] flex items-center justify-center transition-all cursor-pointer active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
					:disabled="!canScrollLeft" aria-label="Scroll left to previous books" @click="scrollLeft">
					<ChevronLeft :size="24" class="stroke-[2.5]" />
				</button>

				<!-- Right Chevron -->
				<button type="button"
					class="absolute -right-3 sm:-right-5 top-1/2 -translate-y-1/2 z-30 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white text-slate-800 hover:text-red-600 hover:border-red-500 hover:bg-red-50 border border-slate-300 shadow-[0_4px_18px_rgba(0,0,0,0.15)] flex items-center justify-center transition-all cursor-pointer active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
					:disabled="!canScrollRight" aria-label="Scroll right to next books" @click="scrollRight">
					<ChevronRight :size="24" class="stroke-[2.5]" />
				</button>

				<!-- Normalized Track: Reuses Canonical BookCard -->
				<div ref="scrollContainer"
					class="flex gap-3 sm:gap-4 lg:gap-6 overflow-x-auto scroll-smooth no-scrollbar py-2 snap-x snap-mandatory"
					style="touch-action: pan-y;" @scroll="checkScrollButtons">
					<div v-for="book in books" :key="book.id"
						class="w-[calc((100%-0.75rem)/2)] sm:w-[calc((100%-1rem*2)/3)] lg:w-[calc((100%-1.5rem*3)/4)] flex-shrink-0 snap-start flex">
						<BookCard :book="book" class="h-full" @request-seed="(t, a) => $emit('request-seed', t, a)" />
					</div>
				</div>
			</div>

		</div>
	</section>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick, watch } from 'vue';
import { ChevronLeft, ChevronRight, Zap, Clock } from 'lucide-vue-next';
import BookCard from '~/components/storefront/BookCard.vue';
import type { Book } from '~/types';

interface Props {
  books: Book[];
  title?: string;
  badgeLabel?: string;
}

const props = withDefaults(defineProps<Props>(), {
  title: 'FLASH SALE DEALS',
  badgeLabel: 'LIMITED TIME OFFERS',
});

defineEmits<{
  (e: 'request-seed', title: string, author?: string): void;
}>();

const scrollContainer = ref<HTMLElement | null>(null);
const canScrollLeft = ref(false);
const canScrollRight = ref(true);

function checkScrollButtons(): void {
  if (!scrollContainer.value) return;
  const { scrollLeft, scrollWidth, clientWidth } = scrollContainer.value;
  canScrollLeft.value = scrollLeft > 8;
  canScrollRight.value = scrollLeft + clientWidth < scrollWidth - 8;
}

function scrollLeft(): void {
  if (!scrollContainer.value) return;
  const firstChild = scrollContainer.value.firstElementChild as HTMLElement | null;
  const cardWidth = firstChild ? firstChild.clientWidth : 280;
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;
  const count = isDesktop ? 4 : 2;
  const scrollDistance = (cardWidth + 24) * count;
  scrollContainer.value.scrollBy({ left: -scrollDistance, behavior: 'smooth' });
}

function scrollRight(): void {
  if (!scrollContainer.value) return;
  const firstChild = scrollContainer.value.firstElementChild as HTMLElement | null;
  const cardWidth = firstChild ? firstChild.clientWidth : 280;
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;
  const count = isDesktop ? 4 : 2;
  const scrollDistance = (cardWidth + 24) * count;
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

// Countdown calculation
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