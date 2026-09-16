<!-- components/storefront/DealsWeek.vue -->
<template>
  <section id="bestsellers-week" class="py-10 sm:py-14 bg-transparent select-none">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      <!-- TOP HEADER: Title, Eyebrow & Countdown Timer -->
      <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <span class="text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-widest text-[#E8750D] block">
              FEATURED PROMOTIONS
            </span>
          </div>
          <h2 class="font-poster text-3xl sm:text-4xl lg:text-5xl font-extrabold uppercase text-[#141E1A] tracking-wide leading-none">
            DEALS OF THE WEEK
          </h2>
          <p class="text-xs sm:text-sm text-theme-muted mt-1">
            Handpicked titles at special discounts — instant digital download or physical delivery.
          </p>
        </div>

        <!-- Live Countdown Timer -->
        <div class="flex items-center gap-2.5 bg-theme-surface border border-slate-200 rounded-xl px-3.5 py-2 shadow-xs shrink-0 self-start sm:self-auto">
          <span class="text-xs font-mono font-bold text-[#E8750D] flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-[#E8750D] animate-pulse" />
            DEALS END IN:
          </span>
          <div class="flex items-center gap-1 font-mono text-xs font-black text-theme-ink">
            <span class="bg-slate-100 px-1.5 py-0.5 rounded">{{ formattedTime.hours }}h</span>
            <span class="text-theme-muted">:</span>
            <span class="bg-slate-100 px-1.5 py-0.5 rounded">{{ formattedTime.minutes }}m</span>
            <span class="text-theme-muted">:</span>
            <span class="bg-slate-100 px-1.5 py-0.5 rounded">{{ formattedTime.seconds }}s</span>
          </div>
        </div>
      </div>

      <!-- CAROUSEL ROW WITH LEFT & RIGHT FLANKING CHEVRONS -->
      <div class="relative group">
        <!-- Left Chevron (Positioned on the Left of Carousel) -->
        <button
          type="button"
          class="absolute -left-3 sm:-left-5 top-1/2 -translate-y-1/2 z-30 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white text-slate-800 hover:text-[#E8750D] hover:border-[#E8750D] hover:bg-[#FFF7ED] border border-slate-300 shadow-[0_4px_18px_rgba(0,0,0,0.15)] flex items-center justify-center transition-all cursor-pointer active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-slate-800 disabled:hover:border-slate-300 disabled:hover:bg-white"
          :disabled="!canScrollLeft"
          aria-label="Scroll left to previous books"
          @click="scrollLeft"
        >
          <ChevronLeft :size="24" class="stroke-[2.5]" />
        </button>

        <!-- Right Chevron (Positioned on the Right of Carousel) -->
        <button
          type="button"
          class="absolute -right-3 sm:-right-5 top-1/2 -translate-y-1/2 z-30 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white text-slate-800 hover:text-[#E8750D] hover:border-[#E8750D] hover:bg-[#FFF7ED] border border-slate-300 shadow-[0_4px_18px_rgba(0,0,0,0.15)] flex items-center justify-center transition-all cursor-pointer active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-slate-800 disabled:hover:border-slate-300 disabled:hover:bg-white"
          :disabled="!canScrollRight"
          aria-label="Scroll right to next books"
          @click="scrollRight"
        >
          <ChevronRight :size="24" class="stroke-[2.5]" />
        </button>

        <!-- 1-Row Track: Exactly 2 in view on mobile, 4 on desktop -->
        <div
          ref="scrollContainer"
          class="flex gap-3 sm:gap-4 lg:gap-6 overflow-x-auto scroll-smooth no-scrollbar py-2 snap-x snap-mandatory"
          style="touch-action: pan-y;"
          @scroll="checkScrollButtons"
        >
          <div
            v-for="book in books"
            :key="book.id"
            class="w-[calc((100%-0.75rem)/2)] sm:w-[calc((100%-1rem*2)/3)] lg:w-[calc((100%-1.5rem*3)/4)] flex-shrink-0 snap-start flex"
          >
            <BookCard 
              :book="book" 
              class="h-full"
              @request-seed="(t, a) => $emit('request-seed', t, a)" 
            />
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

const props = defineProps<{
  books: any[];
}>();

defineEmits<{
  (e: 'add-to-cart', payload: any): void;
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

// 48-Hour Live Countdown Loop
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