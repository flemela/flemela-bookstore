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

// Real Countdown Timer (Target: Next Sunday Midnight)
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
  carouselRef.value?.scrollBy({ left: -280, behavior: 'smooth' });
}

function scrollRight(): void {
  carouselRef.value?.scrollBy({ left: 280, behavior: 'smooth' });
}
</script>

<template>
  <section class="bg-theme-sand py-14 px-4">
    <div class="max-w-6xl mx-auto grid lg:grid-cols-12 gap-8 items-center">
      <!-- Left: Countdown Column -->
      <div class="lg:col-span-4 space-y-4">
        <span class="text-[10px] font-mono font-bold uppercase tracking-widest text-theme-coral block">BOOK OF THE WEEK</span>
        <h2 class="font-display text-3xl font-extrabold text-theme-ink uppercase tracking-tight">
          DEALS OF THE WEEK
        </h2>
        <p class="text-xs text-theme-muted leading-relaxed">
          Unforgettable reads that are dominating bestsellers and changing how we view wealth, power, and wisdom.
        </p>

        <!-- Dynamic Timer Boxes -->
        <ClientOnly>
          <div class="flex items-center gap-2 pt-2">
            <div class="bg-white rounded-xl px-3 py-2 border border-stone-200 text-center shadow-xs">
              <span class="font-mono text-sm font-bold text-theme-ink block">{{ days }}D</span>
            </div>
            <span class="font-bold text-theme-ink">:</span>
            <div class="bg-white rounded-xl px-3 py-2 border border-stone-200 text-center shadow-xs">
              <span class="font-mono text-sm font-bold text-theme-ink block">{{ hours }}H</span>
            </div>
            <span class="font-bold text-theme-ink">:</span>
            <div class="bg-white rounded-xl px-3 py-2 border border-stone-200 text-center shadow-xs">
              <span class="font-mono text-sm font-bold text-theme-ink block">{{ minutes }}M</span>
            </div>
            <span class="font-bold text-theme-ink">:</span>
            <div class="bg-white rounded-xl px-3 py-2 border border-stone-200 text-center shadow-xs">
              <span class="font-mono text-sm font-bold text-theme-coral block">{{ seconds }}S</span>
            </div>
          </div>
        </ClientOnly>

        <!-- Carousel Buttons -->
        <div class="flex items-center gap-2 pt-2">
          <button
            type="button"
            class="w-9 h-9 rounded-full bg-white border border-stone-200 flex items-center justify-center text-theme-ink hover:bg-stone-50 cursor-pointer shadow-xs active:scale-95 transition-all"
            aria-label="Previous deal"
            @click="scrollLeft"
          >
            <ChevronLeft :size="16" />
          </button>
          <button
            type="button"
            class="w-9 h-9 rounded-full bg-theme-coral text-white flex items-center justify-center hover:bg-theme-coral-hover cursor-pointer shadow-xs active:scale-95 transition-all"
            aria-label="Next deal"
            @click="scrollRight"
          >
            <ChevronRight :size="16" />
          </button>
        </div>
      </div>

      <!-- Right: Deals Cards -->
      <div ref="carouselRef" class="lg:col-span-8 flex gap-4 overflow-x-auto no-scrollbar py-2">
        <div v-for="book in dealBooks" :key="book.id" class="w-56 sm:w-60 flex-shrink-0">
          <BookCard :book="book" @request-seed="(t, a) => emit('requestSeed', t, a)" />
        </div>
      </div>
    </div>
  </section>
</template>