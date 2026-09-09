<!-- components/storefront/DealsWeek.vue -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { ChevronLeft, ChevronRight } from 'lucide-vue-next';
import BookCard from '~/components/storefront/BookCard.vue';
import { DEALS_SEEDS, mergeWithSeeds } from '~/data/seeds';
import type { Book } from '~/types';

interface Props {
  books: Book[];
}

const props = defineProps<Props>();
const emit = defineEmits<{
  requestSeed: [title: string, author?: string];
}>();

const carouselRef = ref<HTMLElement | null>(null);

const dealBooks = computed(() => {
  return mergeWithSeeds(props.books, DEALS_SEEDS, 4);
});

// Live Countdown Timer
const days = ref('04');
const hours = ref('18');
const minutes = ref('40');
const seconds = ref('23');
let timerInterval: ReturnType<typeof setInterval> | undefined;

function updateCountdown(): void {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysUntilSunday = (7 - dayOfWeek) % 7 || 7;
  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntilSunday, 23, 59, 59);

  const diff = Math.max(0, target.getTime() - now.getTime());
  const d = Math.floor(diff / (1000 * 60 * 60 * 24));
  const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const m = Math.floor((diff / 1000 / 60) % 60);
  const s = Math.floor((diff / 1000) % 60);

  days.value = String(d).padStart(2, '0');
  hours.value = String(h).padStart(2, '0');
  minutes.value = String(m).padStart(2, '0');
  seconds.value = String(s).padStart(2, '0');
}

onMounted(() => {
  updateCountdown();
  timerInterval = setInterval(updateCountdown, 1000);
});

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval);
});

function scrollLeft(): void {
  carouselRef.value?.scrollBy({ left: -240, behavior: 'smooth' });
}

function scrollRight(): void {
  carouselRef.value?.scrollBy({ left: 240, behavior: 'smooth' });
}
</script>

<template>
  <section id="deals-week" class="bg-theme-sand py-14 px-4 relative overflow-hidden select-none">
    <!-- Subtle Concentric Ripple Texture in Background -->
    <svg class="absolute -left-20 -bottom-20 w-96 h-96 text-stone-300/40 pointer-events-none" viewBox="0 0 200 200" fill="none">
      <circle cx="100" cy="100" r="40" stroke="currentColor" stroke-width="0.75" />
      <circle cx="100" cy="100" r="70" stroke="currentColor" stroke-width="0.75" />
      <circle cx="100" cy="100" r="100" stroke="currentColor" stroke-width="0.75" />
    </svg>

    <!-- Binary Responsive Container: Mobile vs All Larger Screens (sm:) -->
    <div class="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-8 relative z-10">
      
      <!-- =============================================================== -->
      <!-- TIMER & DEAL INFO: LEFT SIDE ON SCREENS LARGER THAN MOBILE      -->
      <!-- =============================================================== -->
      <div
        class="w-full sm:w-80 sm:flex-shrink-0 space-y-4 text-left"
      >
        <div class="space-y-1">
          <span class="text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-widest text-[#F05A36] block">
            LIMITED OPPORTUNITY
          </span>
          <h2 class="font-poster text-3xl sm:text-4xl font-extrabold text-theme-ink uppercase tracking-wide leading-none">
            DEALS OF THE WEEK
          </h2>
        </div>

        <p class="text-xs text-theme-muted leading-relaxed">
          Unmissable discounts on timeless philosophy, business classics, and gripping fiction. Available until timer expires.
        </p>

        <!-- 4 Square Countdown Timer Boxes -->
        <ClientOnly>
          <div class="flex items-center gap-2 pt-1">
            <div class="bg-white rounded-lg px-2.5 py-1.5 border border-stone-300 text-center shadow-xs min-w-[42px]">
              <span class="font-mono text-sm font-bold text-theme-ink block">{{ days }}D</span>
            </div>
            <span class="font-bold text-theme-ink">:</span>
            <div class="bg-white rounded-lg px-2.5 py-1.5 border border-stone-300 text-center shadow-xs min-w-[42px]">
              <span class="font-mono text-sm font-bold text-theme-ink block">{{ hours }}H</span>
            </div>
            <span class="font-bold text-theme-ink">:</span>
            <div class="bg-white rounded-lg px-2.5 py-1.5 border border-stone-300 text-center shadow-xs min-w-[42px]">
              <span class="font-mono text-sm font-bold text-theme-ink block">{{ minutes }}M</span>
            </div>
            <span class="font-bold text-theme-ink">:</span>
            <div class="bg-white rounded-lg px-2.5 py-1.5 border border-stone-300 text-center shadow-xs min-w-[42px]">
              <span class="font-mono text-sm font-bold text-[#F05A36] block">{{ seconds }}S</span>
            </div>
          </div>
        </ClientOnly>

        <!-- Shelf Navigation Buttons (Visible on all screens larger than mobile) -->
        <div class="hidden sm:flex items-center gap-2.5 pt-2">
          <button
            type="button"
            class="w-9 h-9 rounded-full bg-white border border-stone-300 flex items-center justify-center text-theme-ink hover:bg-stone-50 cursor-pointer shadow-xs active:scale-95 transition-all"
            aria-label="Previous deal"
            @click="scrollLeft"
          >
            <ChevronLeft :size="16" />
          </button>
          <button
            type="button"
            class="w-9 h-9 rounded-full bg-[#F05A36] text-white flex items-center justify-center hover:bg-[#D94827] cursor-pointer shadow-xs active:scale-95 transition-all"
            aria-label="Next deal"
            @click="scrollRight"
          >
            <ChevronRight :size="16" />
          </button>
        </div>
      </div>

      <!-- =============================================================== -->
      <!-- BOOKS CONTAINER: RIGHT SIDE ON SCREENS LARGER THAN MOBILE       -->
      <!-- =============================================================== -->
      <div
        class="flex-1 min-w-0 w-full"
      >
        <!-- On Mobile: Clean 2-Column Grid (2x2) | On sm+: Horizontal Shelf -->
        <div
          ref="carouselRef"
          class="grid grid-cols-2 gap-3 sm:flex sm:flex-nowrap sm:gap-4 sm:overflow-x-auto sm:no-scrollbar sm:py-2 sm:px-1 justify-items-center"
        >
          <div
            v-for="book in dealBooks"
            :key="book.id"
            class="w-full sm:w-[148px] sm:flex-shrink-0"
          >
            <BookCard :book="book" @request-seed="(t, a) => emit('requestSeed', t, a)" />
          </div>
        </div>
      </div>

    </div>
  </section>
</template>