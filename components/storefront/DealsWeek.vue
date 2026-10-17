<!-- components/storefront/DealsWeek.vue -->
<template>
	<section id="bestsellers-week" class="relative py-4 sm:py-5 select-none transition-colors border-y overflow-hidden"
		:style="bgColor ? { backgroundColor: bgColor } : {}" :class="[
      isDark ? 'border-white/10' : 'border-slate-200',
      !bgColor ? 'bg-transparent' : ''
    ]" aria-label="Deals of the Week">
		<!-- Subtle 30% - 15% - 0% Ambient Backdrop Scrim -->
		<div class="absolute inset-0 pointer-events-none" :style="{
        background: isDark
          ? 'linear-gradient(to bottom, rgba(0, 0, 0, 0.30) 0%, rgba(0, 0, 0, 0.15) 50%, rgba(0, 0, 0, 0) 100%)'
          : 'linear-gradient(to bottom, rgba(0, 0, 0, 0.05) 0%, rgba(0, 0, 0, 0.02) 50%, rgba(0, 0, 0, 0) 100%)'
      }" aria-hidden="true" />

		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

			<!-- TOP HEADER: Strict Monochrome Contrast -->
			<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3.5 pb-2.5 border-b"
				:class="isDark ? 'border-white/15' : 'border-slate-200'">
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

				<!-- Live Countdown Timer: Strict Monochrome -->
				<div class="flex items-center gap-2 rounded-lg px-3 py-1.5 shadow-2xs shrink-0 self-start sm:self-auto border"
					:class="isDark ? 'bg-white/15 border-white/25 text-white' : 'bg-black/5 border-black/10 text-[#141E1A]'">
					<span class="text-[11px] font-mono font-bold flex items-center gap-1"
						:class="isDark ? 'text-white' : 'text-[#141E1A]'">
						<Clock :size="12" />
						DEALS END IN:
					</span>
					<div class="flex items-center gap-0.5 font-mono text-[11px] font-black">
						<span class="px-1.5 py-0.2 rounded"
							:class="isDark ? 'bg-black/50 text-white' : 'bg-white text-[#141E1A] border border-slate-200'">
							{{ formattedTime.hours }}h
						</span>
						<span :class="isDark ? 'text-white/70' : 'text-black/60'">:</span>
						<span class="px-1.5 py-0.2 rounded"
							:class="isDark ? 'bg-black/50 text-white' : 'bg-white text-[#141E1A] border border-slate-200'">
							{{ formattedTime.minutes }}m
						</span>
						<span :class="isDark ? 'text-white/70' : 'text-black/60'">:</span>
						<span class="px-1.5 py-0.2 rounded"
							:class="isDark ? 'bg-black/50 text-white' : 'bg-white text-[#141E1A] border border-slate-200'">
							{{ formattedTime.seconds }}s
						</span>
					</div>
				</div>
			</div>

			<!-- CAROUSEL TRACK (Mobile: 2 in view + 1 overflowing on right edge; Desktop: 5 across) -->
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
						class="w-[calc((100%-1rem)/2.35)] sm:w-[calc((100%-1.25rem)/3.25)] lg:w-[calc((100%-0.875rem*4)/5)] flex-shrink-0 snap-start flex">
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
import { ChevronLeft, ChevronRight, Clock } from 'lucide-vue-next';
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