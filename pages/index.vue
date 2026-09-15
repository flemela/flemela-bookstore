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
import { BookOpen, ChevronDown, Check, Sparkles, Filter, X } from 'lucide-vue-next';
import { MONTHLY_TOP_SEEDS, DEALS_SEEDS, mergeWithSeeds } from '~/data/seeds';
import type { Book } from '~/types';

// Fetch products and store metadata with reactive status
const { data: realBooks, status: booksStatus } = await useFetch<Book[]>('/api/products');
const { data: storeMetadata } = await useFetch<any>('/api/stores/current');

useHead({
  title: 'The Sunrise Bookstore — Online Bookstore & eBooks in Nairobi, Kenya',
  link: [
    { rel: 'canonical', href: 'https://www.thesunrisebookstore.com' },
  ],
  meta: [
    {
      name: 'description',
      content: 'Shop bestsellers, finance, business, psychology, and African literature at The Sunrise Bookstore, Diamond Mall, Parklands, Nairobi. Fast delivery across Kenya and instant eBook downloads.',
    },
    { property: 'og:title', content: 'The Sunrise Bookstore — Online Bookstore & eBooks in Nairobi, Kenya' },
    { property: 'og:description', content: 'Shop bestsellers, finance, business, psychology, and African literature at The Sunrise Bookstore, Diamond Mall, Parklands, Nairobi. Order online today.' },
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
            legalName: 'The Sunrise Bookstore',
            url: 'https://www.thesunrisebookstore.com',
            logo: 'https://www.thesunrisebookstore.com/images/logo.png',
            image: 'https://www.thesunrisebookstore.com/images/hero-cover.jpg',
            email: 'admin@thesunrisebookstore.com',
            telephone: '+254143304460',
            priceRange: 'KSh 149 - KSh 4500',
            currenciesAccepted: 'KES',
            paymentAccepted: 'Cash, M-Pesa',
            address: {
              '@type': 'PostalAddress',
              streetAddress: 'Diamond Mall / Diamond Plaza, 4th Parklands Ave',
              addressLocality: 'Nairobi',
              addressRegion: 'Nairobi County',
              postalCode: '00100',
              addressCountry: 'KE',
            },
            geo: {
              '@type': 'GeoCoordinates',
              latitude: -1.2612,
              longitude: 36.8167,
            },
            openingHoursSpecification: [
              {
                '@type': 'OpeningHoursSpecification',
                dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
                opens: '08:30',
                closes: '19:30',
              },
            ],
          },
          {
            '@type': 'WebSite',
            '@id': 'https://www.thesunrisebookstore.com/#website',
            url: 'https://www.thesunrisebookstore.com',
            name: 'The Sunrise Bookstore',
            description: 'Online bookstore offering original paperbacks and instant eBooks across Kenya.',
            publisher: {
              '@id': 'https://www.thesunrisebookstore.com/#bookstore',
            },
            potentialAction: {
              '@type': 'SearchAction',
              target: 'https://www.thesunrisebookstore.com/?q={search_term_string}#catalog-results',
              'query-input': 'required name=search_term_string',
            },
          },
        ],
      }),
    },
  ],
});

const tickerItems = computed(() => {
  return storeMetadata.value?.promo_ticker || [];
});

const activeCategoryFilter = ref<string>('General');
const searchQuery = ref<string>('');

const showRequestModal = ref(false);
const modalInitialTitle = ref('');
const modalInitialAuthor = ref('');

const isCatalogueDropdownOpen = ref(false);

const catalogueCategories = computed<string[]>(() => {
  const set = new Set<string>();
  if (realBooks.value) {
    for (const book of realBooks.value) {
      if (book.category_name && book.category_name.trim()) {
        const name = book.category_name.trim();
        if (name.toLowerCase() !== 'general') {
          set.add(name);
        }
      }
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

const filteredBooks = computed(() => {
  const books = realBooks.value || [];
  let result = [...books];

  const currentCat = activeCategoryFilter.value.trim().toLowerCase();

  if (currentCat !== 'general' && currentCat !== 'all' && currentCat !== 'all books') {
    result = result.filter((b) => {
      const bCat = (b.category_name || '').toLowerCase().trim();
      return bCat === currentCat || bCat.includes(currentCat) || currentCat.includes(bCat);
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

const isFilterActive = computed(() => {
  const cat = activeCategoryFilter.value.trim().toLowerCase();
  const isNotGeneral = cat !== 'general' && cat !== 'all' && cat !== 'all books';
  return isNotGeneral || searchQuery.value.trim().length > 0;
});

const flashSaleBooks = computed<Book[]>(() => {
  const books = realBooks.value || [];
  return books.filter((b) => {
    if (b.badge === 'FLASH_SALE' || b.badge === 'LIMITED_TIME') return true;
    if (!b.badge && b.compare_at_price && b.compare_at_price > b.price) return true;
    return false;
  });
});

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

function selectCatalogueCategory(cat: string): void {
  activeCategoryFilter.value = cat;
  isCatalogueDropdownOpen.value = false;
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
});
</script>

<template>
  <div class="min-h-screen flex flex-col bg-white text-[#141E1A] antialiased">
    <!-- 1. Topmost Rotating Announcement Ribbon -->
    <PromoTickerStrip :messages="tickerItems" />

    <!-- 2. Sticky Navbar -->
    <StoreNavbar
      @search="handleSearch"
      @select-category="handleCategorySelect"
      @request-book="() => handleRequestSeed()"
    />

    <!-- 3. Hero Carousel with CSS Shimmer Placeholder -->
    <HeroCarousel
      @search="handleSearch"
      @select-category="handleCategorySelect"
      @navigate-flash-sale="scrollToSection('flash-sale')"
    />

    <!-- 4. Flash Sale Shelf (Pre-allocated skeleton prevents layout shift) -->
    <div id="flash-sale" class="mt-0">
      <div
        v-if="booksStatus === 'pending'"
        class="bg-slate-50 rounded-2xl max-w-6xl mx-auto p-4 sm:p-6 border border-slate-200/80 animate-pulse flex items-center justify-between gap-6 min-h-[170px]"
      >
        <div class="space-y-2.5 w-60 flex-shrink-0">
          <div class="h-3 bg-slate-200 rounded w-24" />
          <div class="h-7 bg-slate-200 rounded w-44" />
          <div class="h-3 bg-slate-100 rounded w-52" />
        </div>
        <div class="hidden sm:flex gap-3 overflow-hidden flex-1">
          <div v-for="n in 3" :key="`flash-skel-${n}`" class="w-36 h-44 bg-slate-200 rounded-xl flex-shrink-0" />
        </div>
      </div>

      <FlashSaleStrip
        v-else-if="flashSaleBooks.length > 0"
        :books="flashSaleBooks"
        title="FLASH SALE DEALS"
        badge-label="LIMITED TIME"
      />
    </div>

    <!-- 5. Categories Bento Grid (Pure CSS render, zero JS scroll calculation) -->
    <BentoCategories @select="handleCategorySelect" />

    <!-- 6. Visual Bridge Banner -->
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

    <!-- 7. Bestsellers of the Week -->
    <DealsWeek :books="bestsellersOfWeek" @request-seed="handleRequestSeed" />

    <!-- 8. Complete Bookstore Catalogue Archive -->
    <section
      id="catalog-results"
      class="pt-12 sm:pt-16 pb-12 px-4 max-w-6xl mx-auto w-full space-y-6"
    >
      <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-200">
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <span class="text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-widest text-[#E8750D] block">
              CATALOGUE ARCHIVE
            </span>
            <span class="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {{ booksStatus === 'pending' ? '...' : `${filteredBooks.length} Titles` }}
            </span>
          </div>
          <h2 class="font-poster text-3xl sm:text-4xl lg:text-5xl font-extrabold uppercase text-[#141E1A] tracking-wide leading-none">
            {{ activeCategoryFilter.toLowerCase() === 'general' ? 'BROWSE ALL BOOKS' : activeCategoryFilter }}
          </h2>
        </div>

        <!-- Dropdown Category Filter -->
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

            <Transition name="dropdown-fade">
              <div
                v-if="isCatalogueDropdownOpen"
                id="catalogue-category-dropdown"
                class="absolute right-0 sm:left-0 sm:right-auto mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-2xl py-2 z-50 text-left"
              >
                <div class="px-4 py-1.5 border-b border-slate-100 flex items-center justify-between">
                  <span class="text-[10px] font-mono uppercase font-bold text-slate-400 tracking-wider">
                    Select Filter
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

          <button
            v-if="isFilterActive"
            type="button"
            class="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1"
            title="Show All Books"
            @click="activeCategoryFilter = 'General'; searchQuery = '';"
          >
            <X :size="13" />
            <span>Clear Filter</span>
          </button>
        </div>
      </div>

      <!-- 1. SKELETON LOADING GRID: Active while booksStatus === 'pending' -->
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

      <!-- 2. REAL BOOKS GRID: Rendered once API resolves -->
      <div
        v-else-if="filteredBooks.length > 0"
        class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-5 lg:gap-6 w-full max-w-[720px] mx-auto px-2 sm:px-4 justify-items-center"
      >
        <BookCard
          v-for="book in filteredBooks"
          :key="book.id"
          :book="book"
          @request-seed="handleRequestSeed"
        />
      </div>

      <!-- 3. TRUE EMPTY STATE: Rendered only when real search/filter yields zero items -->
      <div
        v-else
        class="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3 shadow-sm"
      >
        <BookOpen :size="36" class="mx-auto text-slate-400 opacity-60" />
        <h3 class="font-display font-bold text-base text-slate-800">
          No books found in this category
        </h3>
        <p class="text-xs text-slate-500 max-w-xs mx-auto">
          We can source this title for you directly via our WhatsApp team.
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

    <!-- 9. Trust & Delivery Benefits -->
    <TrustStrip />

    <!-- 10. Footer -->
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