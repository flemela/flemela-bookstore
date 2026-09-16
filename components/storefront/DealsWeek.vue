<template>
  <section class="py-8 bg-transparent">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      <!-- TOP HEADER: Title, Badge & Synchronized Live Timer on TOP -->
      <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-3.5 mb-6">
        <div>
          <div class="flex items-center gap-2">
            <span class="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-red-50 text-theme-accent text-sm font-black shadow-2xs">
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
          <span class="text-xs font-mono font-bold text-theme-accent flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-theme-accent animate-pulse" />
            DEALS END IN:
          </span>
          <div class="flex items-center gap-1 font-mono text-xs font-black text-theme-ink">
            <span class="bg-theme-bg px-1.5 py-0.5 rounded">{{ formattedTime.hours }}h</span>
            <span class="text-theme-muted">:</span>
            <span class="bg-theme-bg px-1.5 py-0.5 rounded">{{ formattedTime.minutes }}m</span>
            <span class="text-theme-muted">:</span>
            <span class="bg-theme-bg px-1.5 py-0.5 rounded">{{ formattedTime.seconds }}s</span>
          </div>
        </div>
      </div>

      <!-- CAROUSEL ROW: Single-Row Horizontal Scroll with Touch-Pan-X Safety -->
      <div
        class="flex gap-4 overflow-x-auto scrollbar-none snap-x snap-mandatory touch-pan-x py-2 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
        style="scroll-behavior: smooth;"
      >
        <div
          v-for="book in books"
          :key="book.id"
          class="w-[185px] sm:w-[210px] md:w-[235px] shrink-0 snap-start"
        >
          <BookCard 
            :book="book" 
            @add-to-cart="$emit('add-to-cart', $event)" 
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
}>();

// Dynamic 48-Hour Live Countdown Loop
const timeLeftSeconds = ref(47 * 3600 + 38 * 60 + 15);
let timerInterval: any = null;

onMounted(() => {
  timerInterval = setInterval(() => {
    if (timeLeftSeconds.value > 0) {
      timeLeftSeconds.value--;
    } else {
      timeLeftSeconds.value = 48 * 3600; // Reset loop on expiration
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
/* Clean horizontal swipe without displaying default browser scrollbars */
.scrollbar-none {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-none::-webkit-scrollbar {
  display: none;
}
</style>