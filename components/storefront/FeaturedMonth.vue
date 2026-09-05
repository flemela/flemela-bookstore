<!-- components/storefront/FeaturedMonth.vue -->
<script setup lang="ts">
import { computed } from 'vue';
import BookCard from '~/components/storefront/BookCard.vue';
import { MONTHLY_TOP_SEEDS, mergeWithSeeds } from '~/data/seeds';
import type { Book } from '~/types';

interface Props {
  books: Book[];
}

const props = defineProps<Props>();
const emit = defineEmits<{
  requestSeed: [title: string, author?: string];
}>();

const featuredBooks = computed(() => mergeWithSeeds(props.books, MONTHLY_TOP_SEEDS, 4));
</script>

<template>
  <section class="py-14 px-4 max-w-6xl mx-auto w-full space-y-6">
    <!-- Split Header: Title on Left, Description on Right -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-3 border-b border-stone-200 pb-4">
      <div>
        <h2 class="font-display text-xl sm:text-2xl font-extrabold uppercase text-[#141E1A] tracking-tight">
          THE #1 BOOK OF THE MONTH YOU CAN'T MISS
        </h2>
      </div>
      <p class="text-xs text-[#5F6964] max-w-sm md:text-right leading-relaxed">
        An unforgettable read that is dominating bestsellers and changing how we view mindset, power, and success.
      </p>
    </div>

    <!-- 4 Cards Row in exact alignment -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-5 lg:gap-6 w-full max-w-[720px] mx-auto px-2 sm:px-4 justify-items-center">
      <BookCard
        v-for="book in featuredBooks"
        :key="book.id"
        :book="book"
        @request-seed="(t, a) => emit('requestSeed', t, a)"
      />
    </div>
  </section>
</template>