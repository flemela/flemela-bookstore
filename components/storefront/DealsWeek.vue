<!-- components/storefront/DealsWeek.vue -->
<template>
	<section id="bestsellers-week" class="py-4 sm:py-5 select-none transition-colors border-y"
		:style="bgColor ? { backgroundColor: bgColor } : {}" :class="[
      isDark ? 'border-white/10' : 'border-slate-200',
      !bgColor ? 'bg-transparent' : ''
    ]">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

			<!-- TOP HEADER: Compact Thin Strip Header -->
			<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3.5 pb-2.5 border-b"
				:class="isDark ? 'border-white/15' : 'border-slate-200'">
				<div class="space-y-0.5">
					<div class="flex items-center gap-1.5">
						<span
							class="text-[9.5px] sm:text-[10px] font-mono font-bold uppercase tracking-widest text-[#E8750D] block">
							{{ badgeLabel }}
						</span>
					</div>
					<h2 class="font-poster text-2xl sm:text-3xl lg:text-4xl font-extrabold uppercase tracking-wide leading-none"
						:class="isDark ? 'text-white' : 'text-[#141E1A]'">
						{{ title }}
					</h2>
					<p class="text-[11px] sm:text-xs text-slate-500 line-clamp-1"
						:class="isDark ? '!text-white/70' : ''">
						{{ subtitle }}
					</p>
				</div>

				<!-- Live Countdown Timer -->
				<div class="flex items-center gap-2 rounded-lg px-3 py-1.5 shadow-2xs shrink-0 self-start sm:self-auto border"
					:class="isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-theme-surface border-slate-200 text-theme-ink'">
					<span class="text-[11px] font-mono font-bold text-[#E8750D] flex items-center gap-1.5">
						<span class="w-1.5 h-1.5 rounded-full bg-[#E8750D] animate-pulse" />
						DEALS END IN:
					</span>
					<div class="flex items-center gap-0.5 font-mono text-[11px] font-black">
						<span class="px-1.5 py-0.2 rounded"
							:class="isDark ? 'bg-black/40 text-white' : 'bg-slate-100 text-theme-ink'">{{
							formattedTime.hours }}h</span>
						<span class="opacity-60">:</span>
						<span class="px-1.5 py-0.2 rounded"
							:class="isDark ? 'bg-black/40 text-white' : 'bg-slate-100 text-theme-ink'">{{
							formattedTime.minutes }}m</span>
						<span class="opacity-60">:</span>
						<span class="px-1.5 py-0.2 rounded"
							:class="isDark ? 'bg-black/40 text-white' : 'bg-slate-100 text-theme-ink'">{{
							formattedTime.seconds }}s</span>
					</div>
				</div>
			</div>

			<!-- CAROUSEL TRACK (Thin strip layout) -->
			<div class="relative group">
				<button type="button"
					class="absolute -left-2.5 sm:-left-4 top-1/2 -translate-y-1/2 z-30 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white text-slate-800 hover:text-[#E8750D] hover:border-[#E8750D] hover:bg-[#FFF7ED] border border-slate-300 shadow-md flex items-center justify-center transition-all cursor-pointer active:scale-95 disabled:opacity-20 disabled:cursor-not-allowed"
					:disabled="!canScrollLeft" aria-label="Scroll left to previous books" @click="scrollLeft">
					<ChevronLeft :size="20" class="stroke-[2.5]" />
				</button>

				<button type="button"
					class="absolute -right-2.5 sm:-right-4 top-1/2 -translate-y-1/2 z-30 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white text-slate-800 hover:text-[#E8750D] hover:border-[#E8750D] hover:bg-[#FFF7ED] border border-slate-300 shadow-md flex items-center justify-center transition-all cursor-pointer active:scale-95 disabled:opacity-20 disabled:cursor-not-allowed"
					:disabled="!canScrollRight" aria-label="Scroll right to next books" @click="scrollRight">
					<ChevronRight :size="20" class="stroke-[2.5]" />
				</button>

				<div ref="scrollContainer"
					class="flex gap-2.5 sm:gap-3 lg:gap-3.5 overflow-x-auto scroll-smooth no-scrollbar py-1 snap-x snap-mandatory"
					style="touch-action: pan-y;" @scroll="checkScrollButtons">
					<div v-for="book in books" :key="book.id"
						class="w-[calc((100%-0.625rem)/2)] sm:w-[calc((100%-0.75rem*2)/3)] lg:w-[calc((100%-0.875rem*4)/5)] flex-shrink-0 snap-start flex">
						<BookCard :book="book" :compact="true" class="h-full"
							@request-seed="(t, a) => $emit('request-seed', t, a)" />
					</div>
				</div>
			</div>

		</div>
	</section>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick, watch } from 'vue';
import { ChevronLeft, ChevronRight } from 'lucide-vue-next';
import BookCard from './BookCard.vue';

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
  const cardWidth = firstChild ? firstChild.clientWidth : 180;
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;
  const count = isDesktop ? 4 : 2;
  const scrollDistance = (cardWidth + 14) * count;
  scrollContainer.value.scrollBy({ left: -scrollDistance, behavior: 'smooth' });
}

function scrollRight(): void {
  if (!scrollContainer.value) return;
  const firstChild = scrollContainer.value.firstElementChild as HTMLElement | null;
  const cardWidth = firstChild ? firstChild.clientWidth : 180;
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;
  const count = isDesktop ? 4 : 2;
  const scrollDistance = (cardWidth + 14) * count;
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

const timeLeftSeconds = ref(47 * 3600 + 38 * 60 + 15);
let timerInterval: any = null;

onMounted(() => {
  timerInterval = setInterval(() => {
    if (timeLeftSeconds.value > 0) {
      timeLeftSeconds.value--;
    } else {
      timeLeftSeconds.value = 48 * 3600;
    }
  }, 1000);

  setTimeout(checkScrollButtons, 300);
  window.addEventListener('resize', checkScrollButtons);
});

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval);
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', checkScrollButtons);
  }
});

const formattedTime = computed(() => {
  const total = timeLeftSeconds.value;
  const hours = String(Math.floor(total / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
  const seconds = String(total % 60).padStart(2, '0');
  return { hours, minutes, seconds };
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