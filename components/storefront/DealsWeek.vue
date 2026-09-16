<!-- components/storefront/DealsWeek.vue -->
<template>
  <section id="bestsellers-week" class="py-10 sm:py-14 bg-transparent select-none">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      <!-- TOP HEADER: Title, Badge & Live Countdown Timer -->
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

        <!-- Right: Timer & Slider Navigation Controls -->
        <div class="flex items-center gap-3 self-start sm:self-auto flex-wrap">
          <!-- Countdown Timer Module -->
          <div class="flex items-center gap-2.5 bg-theme-surface border border-slate-200 rounded-xl px-3.5 py-2 shadow-xs shrink-0">
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

          <!-- Carousel Controls -->
          <div class="flex items-center gap-1.5">
            <button
              type="button"
              class="w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center justify-center transition-colors cursor-pointer active:scale-95 shadow-2xs"
              aria-label="Previous Deals"
              @click="scrollLeft"
            >
              <ChevronLeft :size="16" />
            </button>
            <button
              type="button"
              class="w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center justify-center transition-colors cursor-pointer active:scale-95 shadow-2xs"
              aria-label="Next Deals"
              @click="scrollRight"
            >
              <ChevronRight :size="16" />
            </button>
          </div>
        </div>
      </div>

      <!-- ONE ROW GRID: Exactly 2 in place on mobile, 4 in place on desktop, with non-blocking vertical scroll -->
      <div
        ref="scrollContainer"
        class="flex gap-3 sm:gap-4 lg:gap-5 overflow-x-auto scroll-smooth no-scrollbar py-2"
        style="touch-action: pan-y;"
      >
        <div
          v-for="book in books"
          :key="book.id"
          class="w-[calc((100%-0.75rem)/2)] sm:w-[calc((100%-2*1rem)/3)] lg:w-[calc((100%-3*1.25rem)/4)] flex-shrink-0 snap-start flex"
        >
          <BookCard 
            :book="book" 
            @request-seed="(t, a) => $emit('request-seed', t, a)" 
          />
        </div>
      </div>

    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { ChevronLeft, ChevronRight } from 'lucide-vue-next';
import BookCard from './BookCard.vue';

defineProps<{
  books: any[];
}>();

defineEmits<{
  (e: 'add-to-cart', payload: any): void;
  (e: 'request-seed', title: string, author?: string): void;
}>();

const scrollContainer = ref<HTMLElement | null>(null);

function scrollLeft(): void {
  if (!scrollContainer.value) return;
  const firstChild = scrollContainer.value.firstElementChild as HTMLElement | null;
  const scrollAmount = firstChild ? firstChild.clientWidth + 16 : 280;
  scrollContainer.value.scrollBy({ left: -scrollAmount * 2, behavior: 'smooth' });
}

function scrollRight(): void {
  if (!scrollContainer.value) return;
  const firstChild = scrollContainer.value.firstElementChild as HTMLElement | null;
  const scrollAmount = firstChild ? firstChild.clientWidth + 16 : 280;
  scrollContainer.value.scrollBy({ left: scrollAmount * 2, behavior: 'smooth' });
}

// Dynamic 48-Hour Live Countdown Loop
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
});

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval);
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