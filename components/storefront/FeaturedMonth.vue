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
    <!-- Header with font-poster design foundation -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-3 border-b border-theme-border pb-3.5">
      <div class="space-y-1">
        <span class="text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-widest text-[#F05A36] block">
          EDITORIAL SELECTION
        </span>
        <h2 class="font-poster text-3xl sm:text-4xl lg:text-5xl font-extrabold uppercase text-[#141E1A] tracking-wide leading-none">
          THE #1 BOOK YOU CAN'T MISS
        </h2>
      </div>
      <p class="text-xs text-theme-muted max-w-sm md:text-right leading-relaxed">
        An essential read that is dominating shelves and changing how we view mindset, power, and mastery.
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