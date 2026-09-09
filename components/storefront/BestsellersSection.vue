<!-- components/storefront/BestsellersSection.vue -->
<script setup lang="ts">
import { computed } from 'vue';
import BookCard from '~/components/storefront/BookCard.vue';
import { MONTHLY_TOP_SEEDS, DEALS_SEEDS, mergeWithSeeds } from '~/data/seeds';
import type { Book } from '~/types';

interface Props {
  books: Book[];
}

const props = defineProps<Props>();
const emit = defineEmits<{
  requestSeed: [title: string, author?: string];
  seeMore: [];
}>();

// Ensure count aligns to 4 items (1 row of 4 on desktop, 2 rows of 2 on mobile)
const bestsellerBooks = computed(() => {
  const combined = [...MONTHLY_TOP_SEEDS, ...DEALS_SEEDS];
  const list = mergeWithSeeds(props.books, combined, 4);
  return list.slice(0, 4);
});
</script>

<template>
  <section class="py-14 px-4 max-w-6xl mx-auto w-full space-y-6">
    <!-- Header: Binary Responsive (Mobile vs All Larger Screens) -->
    <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-theme-border pb-3.5">
      <div class="space-y-1">
        <span class="text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-widest text-[#F05A36] block">
          READER FAVORITES
        </span>
        <h2 class="font-poster text-3xl sm:text-4xl font-extrabold uppercase text-[#141E1A] tracking-wide leading-none">
          BEST SELLERS OF THE MONTH
        </h2>
      </div>

      <div class="flex items-center gap-3">
        <!-- Subtitle only hidden on mobile; identical on all screens >= 640px -->
        <p class="text-xs text-theme-muted hidden sm:inline">
          Explore the titles dominating bookshelves and changing perspectives right now.
        </p>
        <button
          type="button"
          class="bg-[#F05A36] hover:bg-[#D94827] text-white text-[11px] font-bold uppercase tracking-wider px-4 py-1.5 rounded-full transition-all shadow-xs cursor-pointer flex-shrink-0 active:scale-95"
          @click="emit('seeMore')"
        >
          See More
        </button>
      </div>
    </div>

    <!-- Strictly Binary Grid: 2 on mobile, 4 on all larger screens -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-5 lg:gap-6 w-full max-w-[720px] mx-auto px-2 sm:px-4 justify-items-center">
      <BookCard
        v-for="book in bestsellerBooks"
        :key="book.id"
        :book="book"
        @request-seed="(t, a) => emit('requestSeed', t, a)"
      />
    </div>
  </section>
</template>