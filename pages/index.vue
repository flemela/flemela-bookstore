<!-- pages/index.vue -->
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
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
import Pagination from '~/components/ui/Pagination.vue';
import { BookOpen, ChevronDown, Check, Sparkles, Filter, X, Zap } from 'lucide-vue-next';
import { MONTHLY_TOP_SEEDS, DEALS_SEEDS, mergeWithSeeds } from '~/data/seeds';
import { fuzzySearchBooks } from '~/utils/fuzzy';
import type { Book } from '~/types';

// Pagination & Search Reactive State
const currentPage = ref(1);
const itemsPerPage = ref(50);
const activeCategoryFilter = ref<string>('General');
const searchQuery = ref<string>('');
const debouncedSearch = ref<string>('');
let searchTimer: ReturnType<typeof setTimeout> | undefined;

// Reactive Catalogue Query with clean computed query unwrapping for SSR
const { data: catalogData, status: booksStatus } = await useFetch<{
  products: Book[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}>('/api/products', {
  query: computed(() => ({
    page: currentPage.value,
    limit: itemsPerPage.value,
    category: activeCategoryFilter.value === 'General' ? undefined : activeCategoryFilter.value,
    q: debouncedSearch.value.trim() ? debouncedSearch.value.trim() : undefined,
  })),
  watch: [currentPage, activeCategoryFilter, debouncedSearch],
});

// Dedicated Showcase fetch for Flash Sale & Bestseller shelves
const { data: showcaseBooks } = await useFetch<any>('/api/products?limit=50');
const { data: storeMetadata } = await useFetch<any>('/api/stores/current');

useHead({
  title: 'The Sunrise Bookstore — Online Bookstore & eBooks in Nairobi, Kenya',
  link: [{ rel: 'canonical', href: 'https://www.thesunrisebookstore.com' }],
  meta: [
    {
      name: 'description',
      content: 'Shop bestsellers, finance, business, psychology, and African literature at The Sunrise Bookstore, Diamond Mall, Parklands, Nairobi. Fast delivery across Kenya and instant eBook downloads.',
    },
    { property: 'og:title', content: 'The Sunrise Bookstore — Online Bookstore & eBooks in Nairobi, Kenya' },
    { property: 'og:description', content: 'Shop bestsellers, finance, business, psychology, and African literature at The Sunrise Bookstore, Diamond Mall, Parklands, Nairobi.' },
    { property: 'og:url', content: 'https://www.thesunrisebookstore.com' },
    { property: 'og:image', content: 'https://www.thesunrisebookstore.com/images/hero-cover.jpg' },
  ],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'BookStore',
            '@id': 'https://www.thesunrisebookstore.com/#bookstore',
            name: 'The Sunrise Bookstore',
            url: 'https://www.thesunrisebookstore.com',
            logo: 'https://www.thesunrisebookstore.com/images/logo.png',
            image: 'https://www.thesunrisebookstore.com/images/hero-cover.jpg',
            email: 'admin@thesunrisebookstore.com',
            telephone: '+254143304460',
            priceRange: 'KSh 149 - KSh 4500',
            currenciesAccepted: 'KES',
            address: {
              '@type': 'PostalAddress',
              streetAddress: 'Diamond Mall / Diamond Plaza, 4th Parklands Ave',
              addressLocality: 'Nairobi',
              addressCountry: 'KE',
            },
          },
        ],
      }),
    },
  ],
});

const tickerItems = computed(() => storeMetadata.value?.promo_ticker || []);

// Full known catalog pool (used for fuzzy fallback when exact backend search has typos)
const fullCatalogPool = computed<Book[]>(() => {
  const remoteList: Book[] = Array.isArray(showcaseBooks.value)
    ? showcaseBooks.value
    : showcaseBooks.value?.products || [];
  return mergeWithSeeds(remoteList, [...MONTHLY_TOP_SEEDS, ...DEALS_SEEDS], 20);
});

// Final display books: uses backend query if found; otherwise runs fuzzy ranking on typos
const isFuzzyFallbackActive = ref(false);

const displayBooks = computed<Book[]>(() => {
  const rawQuery = debouncedSearch.value.trim();
  const backendResults = catalogData.value?.products || [];

  if (!rawQuery) {
    isFuzzyFallbackActive.value = false;
    return backendResults;
  }

  // If backend found exact/partial matches, use them
  if (backendResults.length > 0) {
    isFuzzyFallbackActive.value = false;
    return backendResults;
  }

  // If backend returned 0 matches (e.g. "atmoic habts"), run fuzzy matching
  const fuzzyResults = fuzzySearchBooks(fullCatalogPool.value, rawQuery, 0.35, itemsPerPage.value);
  if (fuzzyResults.length > 0) {
    isFuzzyFallbackActive.value = true;
    return fuzzyResults.map((r) => r.book);
  }

  isFuzzyFallbackActive.value = false;
  return [];
});

const totalBooksCount = computed(() => {
  if (isFuzzyFallbackActive.value) return displayBooks.value.length;
  return catalogData.value?.total ?? displayBooks.value.length;
});

const totalPages = computed(() => {
  if (isFuzzyFallbackActive.value) return Math.max(1, Math.ceil(displayBooks.value.length / itemsPerPage.value));
  return catalogData.value?.totalPages ?? 1;
});

// Range status text
const paginationRangeText = computed(() => {
  const total = totalBooksCount.value;
  if (total === 0) return '0 titles';
  const start = (currentPage.value - 1) * itemsPerPage.value + 1;
  const end = Math.min(currentPage.value * itemsPerPage.value, total);
  return `Showing ${start}–${end} of ${total.toLocaleString('en-KE')} titles`;
});

const isFilterActive = computed(() => {
  const cat = activeCategoryFilter.value.trim().toLowerCase();
  return (cat !== 'general' && cat !== 'all') || debouncedSearch.value.trim().length > 0;
});

// Flash Sale & Bestsellers Shelves
const flashSaleBooks = computed<Book[]>(() => {
  const list: Book[] = Array.isArray(showcaseBooks.value)
    ? showcaseBooks.value
    : showcaseBooks.value?.products || [];
  return list.filter((b) => {
    if (b.badge === 'FLASH_SALE' || b.badge === 'LIMITED_TIME') return true;
    if (!b.badge && b.compare_at_price && b.compare_at_price > b.price) return true;
    return false;
  });
});

const bestsellersOfWeek = computed<Book[]>(() => {
  const list: Book[] = Array.isArray(showcaseBooks.value)
    ? showcaseBooks.value
    : showcaseBooks.value?.products || [];
  const tagged = list.filter((b) => b.badge === 'BESTSELLER');
  const combinedSeeds = [...MONTHLY_TOP_SEEDS, ...DEALS_SEEDS];
  return mergeWithSeeds(tagged, combinedSeeds, 4);
});

// Dynamic Categories Dropdown list
const catalogueCategories = computed<string[]>(() => {
  const set = new Set<string>();
  const allList: Book[] = Array.isArray(showcaseBooks.value)
    ? showcaseBooks.value
    : showcaseBooks.value?.products || [];
  for (const b of allList) {
    if (b?.category_name && b.category_name.trim() && b.category_name.toLowerCase() !== 'general') {
      set.add(b.category_name.trim());
    }
  }
  if (set.size > 0) {
    return ['General', ...Array.from(set).sort()];
  }
  return [
    'General',
    'Business & Finance',
    'Psychology & Self-Help',
    'Self-Help',
    'Fiction & Literature',
    'Christian Books',
    'Education & Textbooks',
    'Biographies & Memoir',
  ];
});

const isCatalogueDropdownOpen = ref(false);
const showRequestModal = ref(false);
const modalInitialTitle = ref('');
const modalInitialAuthor = ref('');

function handleSearch(queryText: string, category?: string): void {
  searchQuery.value = queryText;
  if (searchTimer) clearTimeout(searchTimer);
  debouncedSearch.value = queryText.trim();
  currentPage.value = 1;

  if (category && category !== 'All Categories') {
    activeCategoryFilter.value = category;
  }
  scrollToSection('catalog-results');
}

function handleCategorySelect(category: string): void {
  activeCategoryFilter.value = category;
  currentPage.value = 1;
  scrollToSection('catalog-results');
}

function selectCatalogueCategory(cat: string): void {
  activeCategoryFilter.value = cat;
  currentPage.value = 1;
  isCatalogueDropdownOpen.value = false;
  scrollToSection('catalog-results');
}

function handlePageChange(newPage: number): void {
  currentPage.value = newPage;
  scrollToSection('catalog-results');
}

function clearAllFilters(): void {
  activeCategoryFilter.value = 'General';
  searchQuery.value = '';
  debouncedSearch.value = '';
  currentPage.value = 1;
}

function scrollToSection(sectionId: string): void {
  if (process.client) {
    const el = document.getElementById(sectionId);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }
}

function handleRequestSeed(title?: string, author?: string): void {
  modalInitialTitle.value = title || '';
  modalInitialAuthor.value = author || '';
  showRequestModal.value = true;
}

function handleOutsideClickCatalogue(event: MouseEvent): void {
  const target = event.target as HTMLElement | null;
  if (target && !target.closest('#catalogue-category-dropdown') && !target.closest('#catalogue-category-trigger')) {
    isCatalogueDropdownOpen.value = false;
  }
}

onMounted(() => {
  if (process.client) {
    window.addEventListener('click', handleOutsideClickCatalogue);
  }
});

onUnmounted(() => {
  if (process.client) {
    window.removeEventListener('click', handleOutsideClickCatalogue);
  }
  if (searchTimer) clearTimeout(searchTimer);
});
</script>

<template>
  <div class="min-h-screen flex flex-col bg-white text-[#141E1A] antialiased">
    <!-- Top Announcement Ribbon -->
    <PromoTickerStrip :messages="tickerItems" />

    <!-- Sticky Navbar -->
    <StoreNavbar
      @search="handleSearch"
      @select-category="handleCategorySelect"
      @request-book="() => handleRequestSeed()"
    />

    <!-- Hero Carousel -->
    <HeroCarousel
      @search="handleSearch"
      @select-category="handleCategorySelect"
      @navigate-flash-sale="scrollToSection('flash-sale')"
    />

    <!-- Flash Sale Shelf -->
    <div id="flash-sale" class="mt-0">
      <FlashSaleStrip
        v-if="flashSaleBooks.length > 0"
        :books="flashSaleBooks"
        title="FLASH SALE DEALS"
        badge-label="LIMITED TIME"
      />
    </div>

    <!-- Categories Bento Grid -->
    <BentoCategories @select="handleCategorySelect" />

    <!-- Visual Bridge Banner -->
    <div class="max-w-6xl mx-auto px-4 w-full">
      <div class="rounded-2xl bg-gradient-to-r from-[#052219] via-[#0C3A2B] to-[#124E38] p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 text-white shadow-md border border-[#2EE59D]/30 relative overflow-hidden">
        <div class="flex items-center gap-3 relative z-10">
          <div class="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-[#2EE59D] flex-shrink-0">
            <Sparkles :size="20" class="animate-pulse" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="text-[9.5px] font-mono font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#2EE59D] text-[#052219]">
                Live Storefront Shelf
              </span>
              <span class="text-xs text-white/80 font-mono hidden sm:inline">• Free Nairobi Delivery above KSh 2,500</span>
            </div>
            <h3 class="font-display font-bold text-sm sm:text-base text-white mt-0.5">
              Original Print Editions &amp; Instant Cloudflare R2 eBooks
            </h3>
          </div>
        </div>

        <button
          type="button"
          class="bg-[#E8750D] hover:bg-[#D45B05] text-white text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer flex-shrink-0 active:scale-95"
          @click="scrollToSection('catalog-results')"
        >
          <span>Explore All Books</span>
          <span>↓</span>
        </button>
      </div>
    </div>

    <!-- Bestsellers of the Week -->
    <DealsWeek :books="bestsellersOfWeek" @request-seed="handleRequestSeed" />

    <!-- Complete Bookstore Catalogue Archive -->
    <section
      id="catalog-results"
      class="pt-12 sm:pt-16 pb-14 px-4 max-w-6xl mx-auto w-full space-y-6"
    >
      <!-- Section Title & Dynamic Filter Row -->
      <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-200">
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <span class="text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-widest text-[#E8750D] block">
              CATALOGUE ARCHIVE
            </span>
            <span class="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-3 py-0.5 rounded-full border border-slate-200">
              {{ paginationRangeText }}
            </span>
          </div>
          <h2 class="font-poster text-3xl sm:text-4xl lg:text-5xl font-extrabold uppercase text-[#141E1A] tracking-wide leading-none">
            {{ activeCategoryFilter.toLowerCase() === 'general' ? 'BROWSE ALL BOOKS' : activeCategoryFilter }}
          </h2>
        </div>

        <!-- Filter Dropdown & Search Status Indicator -->
        <div class="flex items-center gap-2.5 flex-wrap">
          <div class="relative">
            <button
              id="catalogue-category-trigger"
              type="button"
              class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-[#FFF7ED] border border-slate-300 hover:border-[#E8750D] text-xs font-bold text-slate-800 transition-all cursor-pointer shadow-2xs"
              :class="{ 'border-[#E8750D] text-[#E8750D] bg-[#FFF7ED]': isCatalogueDropdownOpen }"
              @click="isCatalogueDropdownOpen = !isCatalogueDropdownOpen"
            >
              <Filter :size="14" class="text-[#E8750D]" />
              <span>Category: <strong>{{ activeCategoryFilter.toLowerCase() === 'general' ? 'General (All Books)' : activeCategoryFilter }}</strong></span>
              <ChevronDown :size="14" class="transition-transform duration-200 text-slate-500" :class="{ 'rotate-180 text-[#E8750D]': isCatalogueDropdownOpen }" />
            </button>

            <!-- Dropdown Menu -->
            <Transition name="dropdown-fade">
              <div
                v-if="isCatalogueDropdownOpen"
                id="catalogue-category-dropdown"
                class="absolute right-0 sm:left-0 sm:right-auto mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-2xl py-2 z-50 text-left"
              >
                <div class="px-4 py-1.5 border-b border-slate-100 flex items-center justify-between">
                  <span class="text-[10px] font-mono uppercase font-bold text-slate-400 tracking-wider">
                    Select Category
                  </span>
                  <span class="text-[10px] font-mono text-[#E8750D] font-bold">
                    {{ catalogueCategories.length }} Categories
                  </span>
                </div>

                <div class="max-h-64 overflow-y-auto py-1">
                  <button
                    v-for="cat in catalogueCategories"
                    :key="cat"
                    type="button"
                    class="w-full text-left px-4 py-2 hover:bg-[#FFF7ED] hover:text-[#C25E00] text-xs transition-colors cursor-pointer flex items-center justify-between"
                    :class="activeCategoryFilter === cat ? 'bg-[#FFF7ED] text-[#E8750D] font-extrabold' : 'text-slate-700 font-semibold'"
                    @click="selectCatalogueCategory(cat)"
                  >
                    <span>{{ cat === 'General' ? 'General (All Books)' : cat }}</span>
                    <Check v-if="activeCategoryFilter === cat" :size="14" class="text-[#E8750D]" />
                  </button>
                </div>
              </div>
            </Transition>
          </div>

          <!-- Reset Filter Button -->
          <button
            v-if="isFilterActive"
            type="button"
            class="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
            title="Reset Search and Category Filters"
            @click="clearAllFilters"
          >
            <X :size="13" />
            <span>Clear Filters</span>
          </button>
        </div>
      </div>

      <!-- FUZZY TYPO MATCH NOTICE BANNER -->
      <div
        v-if="isFuzzyFallbackActive"
        class="p-3.5 bg-[#FFF7ED] border border-orange-200 rounded-2xl flex items-center justify-between gap-3 text-xs text-[#C25E00]"
      >
        <div class="flex items-center gap-2">
          <Zap :size="16" class="text-[#E8750D] flex-shrink-0" />
          <span>No exact title found for "<strong>{{ debouncedSearch }}</strong>". Displaying closest matching books below:</span>
        </div>
        <button
          type="button"
          class="text-xs font-bold underline hover:text-[#E8750D] cursor-pointer flex-shrink-0"
          @click="clearAllFilters"
        >
          View All Books
        </button>
      </div>

      <!-- SKELETON LOADING GRID -->
      <div
        v-if="booksStatus === 'pending'"
        class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-5 lg:gap-6 w-full max-w-[720px] mx-auto px-2 sm:px-4 justify-items-center"
      >
        <div
          v-for="n in 8"
          :key="`skel-catalog-${n}`"
          class="w-full max-w-[176px] bg-white rounded-xl p-2.5 sm:p-3 border border-slate-200 shadow-card flex flex-col justify-between space-y-3"
        >
          <div class="aspect-[1/1.37] rounded-lg bg-slate-200 animate-pulse" />
          <div class="space-y-1.5 pt-1">
            <div class="h-3.5 bg-slate-200 rounded w-5/6 animate-pulse" />
            <div class="h-2.5 bg-slate-100 rounded w-1/2 animate-pulse" />
          </div>
          <div class="space-y-1 pt-1">
            <div class="h-4 bg-slate-100 rounded-md w-full animate-pulse" />
          </div>
          <div class="pt-2 border-t border-slate-100 flex items-center justify-between">
            <div class="h-4 bg-slate-200 rounded w-16 animate-pulse" />
            <div class="w-8 h-8 bg-slate-200 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>

      <!-- REAL BOOKS 50-PER-PAGE / FUZZY FILTERED GRID -->
      <div
        v-else-if="displayBooks.length > 0"
        class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-5 lg:gap-6 w-full max-w-[720px] mx-auto px-2 sm:px-4 justify-items-center animate-in fade-in duration-300"
      >
        <BookCard
          v-for="book in displayBooks"
          :key="book.id"
          :book="book"
          @request-seed="handleRequestSeed"
        />
      </div>

      <!-- TRUE EMPTY STATE -->
      <div
        v-else
        class="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3 shadow-sm animate-in fade-in duration-200"
      >
        <BookOpen :size="36" class="mx-auto text-slate-400 opacity-60" />
        <h3 class="font-display font-bold text-base text-slate-800">
          No books found matching "{{ debouncedSearch }}"
        </h3>
        <p class="text-xs text-slate-500 max-w-xs mx-auto">
          We can source any title in Kenya directly for you upon request via WhatsApp.
        </p>
        <button
          type="button"
          class="bg-[#F05A36] hover:bg-[#D94827] text-white text-xs font-bold uppercase px-5 py-2.5 rounded-xl shadow-md cursor-pointer transition-all active:scale-95"
          @click="handleRequestSeed(debouncedSearch)"
        >
          Request This Book on WhatsApp
        </button>
      </div>

      <!-- NUMBERED PAGINATION CONTROLS -->
      <Pagination
        :page="currentPage"
        :total-pages="totalPages"
        :disabled="booksStatus === 'pending'"
        @change="handlePageChange"
      />
    </section>

    <!-- Trust & Delivery Benefits -->
    <TrustStrip />

    <!-- Footer -->
    <StoreFooter />

    <!-- Book Request Modal & Cart Drawer -->
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

<style scoped>
.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
	</style>