<!-- components/storefront/DealsWeek.vue -->
<template>
  <section id="bestsellers-week" class="py-10 sm:py-14 bg-transparent select-none">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      <!-- TOP HEADER: Title, Badge & Live Countdown Timer -->
      <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-3.5 mb-6 pb-3 border-b border-theme-border">
        <div>
          <div class="flex items-center gap-2">
            <span class="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-orange-50 text-[#E8750D] text-sm font-black shadow-2xs">
              ⚡
            </span>
            <h2 class="font-display font-extrabold text-2xl sm:text-3xl text-theme-ink tracking-tight">
              Deals of the Week
            </h2>
          </div>
          <p class="text-xs sm:text-sm text-theme-muted mt-1">
            Handpicked titles at special discounts — instant digital download or physical delivery.
          </p>
        </div>

        <!-- Live Countdown Timer Header Module -->
        <div class="flex items-center gap-2.5 bg-theme-surface border border-theme-border rounded-xl px-3.5 py-2 shadow-xs shrink-0 self-start sm:self-auto">
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

      <!-- RESPONSIVE GRID: Full-width responsive layout with natural vertical scroll -->
      <div class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 w-full">
        <div
          v-for="book in books"
          :key="book.id"
          class="w-full flex"
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
import BookCard from './BookCard.vue';

defineProps<{
  books: any[];
}>();

defineEmits<{
  (e: 'add-to-cart', payload: any): void;
  (e: 'request-seed', title: string, author?: string): void;
}>();

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