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

const bestsellerBooks = computed(() => {
  const combined = [...MONTHLY_TOP_SEEDS, ...DEALS_SEEDS];
  return mergeWithSeeds(props.books, combined, 6);
});
</script>

<template>
  <section class="py-14 px-4 max-w-6xl mx-auto w-full space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-stone-200 pb-3">
      <div>
        <h2 class="font-poster text-2xl sm:text-3xl font-extrabold uppercase text-[#141E1A] tracking-wide">
          BEST SELLERS OF THE MONTH
        </h2>
      </div>

      <div class="flex items-center gap-3">
        <p class="text-xs text-[#5F6964] hidden md:inline">
          Explore the best books our readers are loving and reading right now.
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

    <!-- Full-Width Responsive Bestsellers Shelf -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-5 justify-items-center w-full mx-auto px-1 sm:px-2">
      <BookCard
        v-for="book in bestsellerBooks"
        :key="book.id"
        :book="book"
        @request-seed="(t, a) => emit('requestSeed', t, a)"
      />
    </div>
  </section>
</template>