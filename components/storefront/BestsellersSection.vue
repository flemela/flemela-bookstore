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
          class="bg-[#F05A36] hover:bg-[#D94827] text-white text-[11px] font-bold uppercase tracking-wider px-4 py-1.5 rounded-full transition-all shadow-xs cursor-pointer flex-shrink-0"
          @click="emit('seeMore')"
        >
          See More
        </button>
      </div>
    </div>

    <!-- 12-Column Split: 8 Cols for 6 Books (3x2) + 4 Cols for Dark Promo Card -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      <!-- 6 Books: 3 Columns x 2 Rows -->
      <div class="lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-5 lg:gap-6 justify-items-center max-w-[540px] mx-auto lg:max-w-none px-2 sm:px-4">
        <BookCard
          v-for="book in bestsellerBooks"
          :key="book.id"
          :book="book"
          @request-seed="(t, a) => emit('requestSeed', t, a)"
        />
      </div>

      <!-- Right Pine Promo Card -->
      <div class="lg:col-span-4 bg-[#052219] text-white rounded-2xl p-6 sm:p-8 flex flex-col justify-between items-center text-center shadow-md relative overflow-hidden">
        <div class="w-28 h-36 rounded-t-full bg-[#2CD4BF]/20 border-2 border-[#2CD4BF]/40 flex items-center justify-center p-3 shadow-inner my-2">
          <div class="w-20 h-28 bg-white/10 rounded-t-full flex items-center justify-center text-3xl">
            📚
          </div>
        </div>

        <div class="space-y-2 py-4">
          <h3 class="font-poster text-3xl sm:text-4xl font-extrabold uppercase leading-tight tracking-wide text-white">
            GET <span class="text-[#F05A36]">20% OFF</span> BESTSELLERS
          </h3>
          <p class="text-xs text-white/70 leading-relaxed max-w-xs mx-auto">
            This week only — pick the stories everyone is talking about at a lower price.
          </p>
        </div>

        <button
          type="button"
          class="w-full bg-[#F05A36] hover:bg-[#D94827] text-white text-xs font-bold uppercase tracking-wider py-3.5 rounded-xl transition-all shadow-md cursor-pointer active:scale-95"
          @click="emit('seeMore')"
        >
          Get This Offer
        </button>
      </div>
    </div>
  </section>
</template>