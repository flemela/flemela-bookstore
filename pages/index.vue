<!-- pages/index.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue';
import StoreNavbar from '~/components/storefront/StoreNavbar.vue';
import HeroCarousel from '~/components/storefront/HeroCarousel.vue';
import FeaturedMonth from '~/components/storefront/FeaturedMonth.vue';
import BentoCategories from '~/components/storefront/BentoCategories.vue';
import DealsWeek from '~/components/storefront/DealsWeek.vue';
import BestsellersSection from '~/components/storefront/BestsellersSection.vue';
import TrustStrip from '~/components/storefront/TrustStrip.vue';
import NewsletterBanner from '~/components/storefront/NewsletterBanner.vue';
import StoreFooter from '~/components/storefront/StoreFooter.vue';
import BookCard from '~/components/storefront/BookCard.vue';
import CartDrawer from '~/components/storefront/CartDrawer.vue';
import ToastContainer from '~/components/ui/ToastContainer.vue';
import BookRequestModal from '~/components/storefront/BookRequestModal.vue';
import { BookOpen } from 'lucide-vue-next';
import { MONTHLY_TOP_SEEDS, DEALS_SEEDS, mergeWithSeeds } from '~/data/seeds';
import type { Book } from '~/types';

const { data: realBooks } = await useFetch<Book[]>('/api/products');

const activeCategoryFilter = ref<string>('ALL');
const searchQuery = ref<string>('');

const showRequestModal = ref(false);
const modalInitialTitle = ref('');
const modalInitialAuthor = ref('');

// Dynamic filter engine
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

// Real Merchant Books Take Priority Over Seeds in All Sections
const no1Picks = computed<Book[]>(() => {
  const books = realBooks.value || [];
  const tagged = books.filter((b) => b.badge === 'NO1_PICK');
  const source = tagged.length > 0 ? tagged : books;
  return mergeWithSeeds(source, MONTHLY_TOP_SEEDS, 4);
});

const dealBooks = computed<Book[]>(() => {
  const books = realBooks.value || [];
  const deals = books.filter(
    (b) =>
      b.badge === 'DEAL_OF_WEEK' ||
      b.badge === 'FLASH_SALE' ||
      (b.compare_at_price && b.compare_at_price > b.price)
  );
  const source = deals.length > 0 ? deals : books;
  return mergeWithSeeds(source, DEALS_SEEDS, 4);
});

const bestsellers = computed<Book[]>(() => {
  const books = realBooks.value || [];
  const tagged = books.filter((b) => b.badge === 'BESTSELLER');
  const source = tagged.length > 0 ? tagged : books;
  const combinedSeeds = [...MONTHLY_TOP_SEEDS, ...DEALS_SEEDS];
  return mergeWithSeeds(source, combinedSeeds, 6);
});

function handleSearch(query: string, category: string): void {
  searchQuery.value = query;
  activeCategoryFilter.value = category && category !== 'All Categories' ? category : 'ALL';
  scrollToResults();
}

function handleCategorySelect(category: string): void {
  activeCategoryFilter.value = category;
  scrollToResults();
}

function scrollToResults(): void {
  if (process.client) {
    const el = document.getElementById('catalog-results');
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
    <StoreNavbar />

    <!-- Hero Section: Dynamic Carousel with Automatic Poster Fallback -->
    <HeroCarousel
      @search="handleSearch"
      @select-category="handleCategorySelect"
    />

    <!-- Main Catalog Section -->
    <section
      id="catalog-results"
      class="pt-14 sm:pt-16 pb-10 px-4 max-w-6xl mx-auto w-full space-y-6"
    >
      <div class="flex items-center justify-between pb-3 border-b border-theme-border">
        <div>
          <span class="text-[10px] font-mono font-bold uppercase tracking-widest text-[#F05A36] block">
            {{ hasActiveFilter ? 'Filtered Search Results' : 'Bookstore Inventory' }}
          </span>
          <h2 class="font-display text-xl sm:text-2xl font-extrabold uppercase text-theme-ink tracking-tight">
            {{ hasActiveFilter ? `Showing: ${activeCategoryFilter}` : 'Browse All Books' }}
          </h2>
        </div>

        <button
          v-if="hasActiveFilter"
          type="button"
          class="text-xs font-bold text-[#F05A36] hover:underline px-3 py-1.5 bg-theme-sand rounded-xl cursor-pointer"
          @click="
            activeCategoryFilter = 'ALL';
            searchQuery = '';
          "
        >
          Reset Filters
        </button>
      </div>

      <!-- Real books grid -->
      <div v-if="filteredBooks.length > 0" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <BookCard
          v-for="book in filteredBooks"
          :key="book.id"
          :book="book"
          @request-seed="handleRequestSeed"
        />
      </div>

      <!-- Fallback empty state -->
      <div v-else class="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3 shadow-sm">
        <BookOpen :size="36" class="mx-auto text-slate-400 opacity-60" />
        <h3 class="font-display font-bold text-base text-slate-800">
          No books found matching this filter
        </h3>
        <p class="text-xs text-slate-500 max-w-xs mx-auto">
          We can source this title for you directly via WhatsApp.
        </p>
        <button
          type="button"
          class="bg-[#F05A36] text-white text-xs font-bold uppercase px-5 py-2.5 rounded-xl shadow-md cursor-pointer"
          @click="handleRequestSeed(searchQuery)"
        >
          Submit Book Request
        </button>
      </div>
    </section>

    <!-- Curated Sections -->
    <FeaturedMonth :books="no1Picks" @request-seed="handleRequestSeed" />

    <BentoCategories @select="handleCategorySelect" />

    <DealsWeek :books="dealBooks" @request-seed="handleRequestSeed" />

    <BestsellersSection
      :books="bestsellers"
      @request-seed="handleRequestSeed"
      @see-more="scrollToResults"
    />

    <TrustStrip />

    <NewsletterBanner />

    <StoreFooter />

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