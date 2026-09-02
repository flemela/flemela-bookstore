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
  const combinedSeeds = [...MONTHLY_TOP_SEEDS, ...DEALS_SEEDS];
  return mergeWithSeeds(props.books, combinedSeeds, 6);
});
</script>

<template>
  <section class="py-14 px-4 max-w-6xl mx-auto w-full space-y-6">
    <!-- Header with Subtitle and "See More" Button on Right -->
    <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-theme-border pb-4">
      <div>
        <h2 class="font-display text-xl sm:text-2xl font-extrabold uppercase text-theme-ink tracking-tight">
          BEST SELLERS OF THE MONTH
        </h2>
      </div>
      
      <div class="flex items-center gap-4">
        <p class="text-xs text-theme-muted hidden md:inline">
          Explore the best books our readers are loving and reading right now.
        </p>
        <button
          type="button"
          class="bg-theme-coral hover:bg-theme-coral-hover text-white text-[11px] font-bold uppercase tracking-wider px-4 py-1.5 rounded-full transition-all shadow-xs cursor-pointer flex-shrink-0"
          @click="emit('seeMore')"
        >
          See More
        </button>
      </div>
    </div>

    <!-- Layout: 3x2 Grid (8 Cols) + Vertical Dark Pine Promo Card (4 Cols) -->
    <div class="grid lg:grid-cols-12 gap-6 items-stretch">
      
      <!-- 6 Books (3 Columns x 2 Rows) -->
      <div class="lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-4">
        <BookCard
          v-for="book in bestsellerBooks"
          :key="book.id"
          :book="book"
          @request-seed="(t, a) => emit('requestSeed', t, a)"
        />
      </div>

      <!-- Tall Vertical Dark Pine Promo Card with Arched Illustration -->
      <div class="lg:col-span-4 bg-theme-dark text-white rounded-2xl p-7 flex flex-col justify-between items-center text-center shadow-card relative overflow-hidden">
        
        <!-- Top Arched Window Illustration Motif -->
        <div class="w-24 h-32 rounded-t-full bg-theme-turquoise/20 border-2 border-theme-turquoise/40 flex items-center justify-center p-3 shadow-inner my-2">
          <div class="w-16 h-22 bg-white/10 rounded-t-full flex items-center justify-center">
            <span class="text-2xl">📚</span>
          </div>
        </div>

        <div class="space-y-2 py-4">
          <h3 class="font-display text-2xl sm:text-3xl font-extrabold uppercase leading-tight tracking-tight">
            GET <span class="text-theme-coral">20% OFF</span> BESTSELLERS
          </h3>
          <p class="text-xs text-white/70 leading-relaxed max-w-xs mx-auto">
            This week only — pick the stories everyone is talking about at a lower price.
          </p>
        </div>

        <!-- Full-Width Coral CTA Button -->
        <button
          type="button"
          class="w-full bg-theme-coral hover:bg-theme-coral-hover text-white text-xs font-bold uppercase tracking-wider py-3.5 rounded-xl transition-all shadow-md cursor-pointer active:scale-95"
          @click="emit('seeMore')"
        >
          Get This Offer
        </button>
      </div>

    </div>
  </section>
</template>