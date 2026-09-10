<!-- pages/index.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue';
import PromoTickerStrip from '~/components/storefront/PromoTickerStrip.vue';
import StoreNavbar from '~/components/storefront/StoreNavbar.vue';
import HeroCarousel from '~/components/storefront/HeroCarousel.vue';
import FlashSaleStrip from '~/components/storefront/FlashSaleStrip.vue';
import BentoCategories from '~/components/storefront/BentoCategories.vue';
import DealsWeek from '~/components/storefront/DealsWeek.vue';
import TrustStrip from '~/components/storefront/TrustStrip.vue';
import StoreFooter from '~/components/storefront/StoreFooter.vue';
import BookCard from '~/components/storefront/BookCard.vue';
import CartDrawer from '~/components/storefront/CartDrawer.vue';
import ToastContainer from '~/components/ui/ToastContainer.vue';
import BookRequestModal from '~/components/storefront/BookRequestModal.vue';
import { BookOpen } from 'lucide-vue-next';
import { MONTHLY_TOP_SEEDS, DEALS_SEEDS, mergeWithSeeds } from '~/data/seeds';
import type { Book } from '~/types';

const { data: realBooks } = await useFetch<Book[]>('/api/products');
const { data: storeMetadata } = await useFetch<any>('/api/stores/current');

const tickerItems = computed(() => {
  return storeMetadata.value?.promo_ticker || [];
});

const activeCategoryFilter = ref<string>('ALL');
const searchQuery = ref<string>('');

const showRequestModal = ref(false);
const modalInitialTitle = ref('');
const modalInitialAuthor = ref('');

// Dynamic Filter Engine for Main Catalog Grid
const filteredBooks = computed(() => {
  const books = realBooks.value || [];
  let result = [...books];

  if (activeCategoryFilter.value !== 'ALL') {
    const filterKey = activeCategoryFilter.value.toLowerCase().trim();
    result = result.filter((b) => {
      const cat = (b.category_name || '').toLowerCase().trim();
      return cat === filterKey || cat.includes(filterKey) || filterKey.includes(cat);
    });
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim();
    result = result.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        (b.author && b.author.toLowerCase().includes(q)) ||
        (b.description && b.description.toLowerCase().includes(q))
    );
  }

  return result;
});

const hasActiveFilter = computed(() => {
  return activeCategoryFilter.value !== 'ALL' || searchQuery.value.trim().length > 0;
});

// 1. FLASH SALE DEALS (Specifically FLASH_SALE & LIMITED_TIME or discounted unbadged items)
const flashSaleBooks = computed<Book[]>(() => {
  const books = realBooks.value || [];
  return books.filter((b) => {
    if (b.badge === 'FLASH_SALE' || b.badge === 'LIMITED_TIME') return true;
    if (!b.badge && b.compare_at_price && b.compare_at_price > b.price) return true;
    return false;
  });
});

// 2. BESTSELLERS OF THE WEEK (All books with the BESTSELLER badge)
const bestsellersOfWeek = computed<Book[]>(() => {
  const books = realBooks.value || [];
  const tagged = books.filter((b) => b.badge === 'BESTSELLER');
  const combinedSeeds = [...MONTHLY_TOP_SEEDS, ...DEALS_SEEDS];
  return mergeWithSeeds(tagged, combinedSeeds, 4);
});

function handleSearch(query: string, category?: string): void {
  searchQuery.value = query;
  if (category && category !== 'All Categories') {
    activeCategoryFilter.value = category;
  }
  scrollToSection('catalog-results');
}

function handleCategorySelect(category: string): void {
  activeCategoryFilter.value = category;
  scrollToSection('catalog-results');
}

function scrollToSection(sectionId: string): void {
  if (process.client) {
    const el = document.getElementById(sectionId);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }
}

function handleRequestSeed(title: string, author?: string): void {
  modalInitialTitle.value = title;
  modalInitialAuthor.value = author || '';
  showRequestModal.value = true;
}
</script>

<template>
  <div class="min-h-screen flex flex-col bg-white text-[#141E1A] antialiased">
    <!-- 1. Topmost Rotating Announcement Ribbon -->
    <PromoTickerStrip :messages="tickerItems" />

    <!-- 2. Sticky White Navbar with Glassmorphic Search Bar -->
    <StoreNavbar @search="handleSearch" />

    <!-- 3. Hero Carousel (Custom banners only) -->
    <HeroCarousel
      @search="handleSearch"
      @select-category="handleCategorySelect"
      @navigate-flash-sale="scrollToSection('flash-sale')"
    />

    <!-- 4. Flash Sale Shelf (Zero margin from hero, 8px padding) -->
    <div id="flash-sale" class="mt-0">
      <FlashSaleStrip
        :books="flashSaleBooks"
        title="FLASH SALE DEALS"
        badge-label="LIMITED TIME"
      />
    </div>

    <!-- 5. Genre Grid (Bento Categories) -->
    <BentoCategories @select="handleCategorySelect" />

    <!-- 6. Bestsellers of the Week (All BESTSELLER-badged books, Timer on left, Books on right) -->
    <DealsWeek :books="bestsellersOfWeek" @request-seed="handleRequestSeed" />

    <!-- 7. Complete Bookstore Catalogue (Filtered results & all titles) -->
    <section
      id="catalog-results"
      class="pt-12 sm:pt-16 pb-10 px-4 max-w-6xl mx-auto w-full space-y-6"
    >
      <div class="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-theme-border">
        <div class="space-y-1">
          <span class="text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-widest text-[#F05A36] block">
            {{ hasActiveFilter ? 'FILTERED SEARCH RESULTS' : 'COMPLETE CATALOGUE' }}
          </span>
          <h2 class="font-poster text-3xl sm:text-4xl lg:text-5xl font-extrabold uppercase text-theme-ink tracking-wide leading-none">
            {{ hasActiveFilter ? `SHOWING: ${activeCategoryFilter}` : 'BROWSE ALL BOOKS' }}
          </h2>
        </div>

        <button
          v-if="hasActiveFilter"
          type="button"
          class="text-xs font-bold text-[#F05A36] hover:underline px-3.5 py-1.5 bg-theme-sand rounded-xl cursor-pointer transition-colors"
          @click="
            activeCategoryFilter = 'ALL';
            searchQuery = '';
          "
        >
          Reset Filters
        </button>
      </div>

      <!-- Catalogue Books Grid -->
      <div
        v-if="filteredBooks.length > 0"
        class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-5 lg:gap-6 w-full max-w-[720px] mx-auto px-2 sm:px-4 justify-items-center"
      >
        <BookCard
          v-for="book in filteredBooks"
          :key="book.id"
          :book="book"
          @request-seed="handleRequestSeed"
        />
      </div>

      <!-- Empty State -->
      <div v-else class="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3 shadow-sm">
        <BookOpen :size="36" class="mx-auto text-slate-400 opacity-60" />
        <h3 class="font-display font-bold text-base text-slate-800">
          No books found matching this filter
        </h3>
        <p class="text-xs text-slate-500 max-w-xs mx-auto">
          We can source this title for you directly via WhatsApp concierge.
        </p>
        <button
          type="button"
          class="bg-[#F05A36] hover:bg-[#D94827] text-white text-xs font-bold uppercase px-5 py-2.5 rounded-xl shadow-md cursor-pointer transition-all active:scale-95"
          @click="handleRequestSeed(searchQuery)"
        >
          Submit Book Request
        </button>
      </div>
    </section>

    <!-- 8. Trust & Delivery Benefits -->
    <TrustStrip />

    <!-- 9. Footer -->
    <StoreFooter />

    <!-- Overlays -->
    <BookRequestModal
      :open="showRequestModal"
      :initial-title="modalInitialTitle"
      :initial-author="modalInitialAuthor"
      @close="showRequestModal = false"
    />

    <CartDrawer />
    <ToastContainer />
  </div>
</template>