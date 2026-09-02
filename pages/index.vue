<!-- pages/index.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue';
import StoreNavbar from '~/components/storefront/StoreNavbar.vue';
import HeroReference from '~/components/storefront/HeroReference.vue';
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
import type { Book } from '~/types';

const { data: realBooks } = await useFetch<Book[]>('/api/products');

const activeCategoryFilter = ref<string>('ALL');
const searchQuery = ref<string>('');

const showRequestModal = ref(false);
const modalInitialTitle = ref('');
const modalInitialAuthor = ref('');

// Dynamic search & category filter engine
const filteredBooks = computed(() => {
  const books = realBooks.value || [];
  let result = [...books];

  if (activeCategoryFilter.value !== 'ALL') {
    const filterKey = activeCategoryFilter.value.toLowerCase().trim();
    result = result.filter((b) => {
      const cat = (b.category_name || '').toLowerCase().trim();
      if (cat === filterKey) return true;
      if (cat.includes(filterKey) || filterKey.includes(cat)) return true;
      if (filterKey.includes('fiction') && cat.includes('fiction')) return true;
      if ((filterKey.includes('finance') || filterKey.includes('business')) && (cat.includes('finance') || cat.includes('business'))) return true;
      if ((filterKey.includes('religious') || filterKey.includes('christian')) && (cat.includes('religious') || cat.includes('christian'))) return true;
      if (filterKey.includes('self-help') && (cat.includes('self') || cat.includes('psychology'))) return true;
      return false;
    });
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim();
    result = result.filter(
      (b) => b.name.toLowerCase().includes(q) || (b.author && b.author.toLowerCase().includes(q)) || (b.description && b.description.toLowerCase().includes(q))
    );
  }

  return result;
});

const hasActiveFilter = computed(() => {
  return activeCategoryFilter.value !== 'ALL' || searchQuery.value.trim().length > 0;
});

function handleSearch(query: string, category: string): void {
  searchQuery.value = query;
  activeCategoryFilter.value = (category && category !== 'All Categories') ? category : 'ALL';
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
  <div class="min-h-screen flex flex-col bg-theme-canvas text-theme-ink antialiased font-sans">
    
    <!-- 1. Dark Pine Navbar (No Search Bar) -->
    <StoreNavbar />

    <!-- 2. Pine Hero with Floating 8-Book Collage & The Single Search Pill -->
    <HeroReference @search="handleSearch" @select-category="handleCategorySelect" />

    <!-- Active Search / Filter Catalog Results (Smooth Scroll Target) -->
    <section id="catalog-results" v-if="hasActiveFilter" class="py-12 px-4 max-w-6xl mx-auto w-full space-y-6">
      <div class="flex items-center justify-between bg-theme-surface p-4 rounded-2xl border border-theme-border shadow-card">
        <div class="space-y-0.5">
          <span class="text-[10px] font-mono font-bold uppercase tracking-widest text-theme-coral">Filtered Catalog</span>
          <p class="text-xs text-theme-ink font-medium">
            Category: <strong>{{ activeCategoryFilter }}</strong>
            <template v-if="searchQuery"> • Search: "{{ searchQuery }}"</template>
          </p>
        </div>
        <button
          type="button"
          class="text-xs font-bold text-theme-coral hover:underline px-3 py-1.5 bg-orange-50 rounded-xl cursor-pointer"
          @click="activeCategoryFilter = 'ALL'; searchQuery = '';"
        >
          Reset Filter
        </button>
      </div>

      <div v-if="filteredBooks.length === 0" class="bg-theme-surface rounded-2xl border border-theme-border p-12 text-center space-y-3 shadow-card">
        <BookOpen :size="36" class="mx-auto text-theme-forest opacity-40" />
        <h3 class="font-display font-bold text-base text-theme-ink">No exact matches in live inventory</h3>
        <p class="text-xs text-theme-muted max-w-xs mx-auto">
          We can source this publication for you on request.
        </p>
        <button
          type="button"
          class="bg-theme-coral text-white text-xs font-bold uppercase px-5 py-2.5 rounded-xl shadow-md cursor-pointer"
          @click="handleRequestSeed(searchQuery)"
        >
          Submit Special Request
        </button>
      </div>

      <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <BookCard v-for="book in filteredBooks" :key="book.id" :book="book" @request-seed="handleRequestSeed" />
      </div>
    </section>

    <!-- 3. Section: #1 Book of the Month You Can't Miss (4 Cards) -->
    <FeaturedMonth :books="realBooks || []" @request-seed="handleRequestSeed" />

    <!-- 4. Section: Bento Category Grid (Exact 3-Col Layout) -->
    <BentoCategories @select="handleCategorySelect" />

    <!-- 5. Section: Deals of the Week (Warm Sand + Ripple BG + Live Countdown) -->
    <DealsWeek :books="realBooks || []" @request-seed="handleRequestSeed" />

    <!-- 6. Section: Best Sellers of the Month (3x2 Grid + Vertical Promo Card) -->
    <BestsellersSection :books="realBooks || []" @request-seed="handleRequestSeed" @see-more="scrollToResults" />

    <!-- 7. Section: Trust & Delivery Strip (3 Mint Circle Badges) -->
    <TrustStrip />

    <!-- 8. Section: Newsletter Coupon Banner (Illustrated Hands Holding Books) -->
    <NewsletterBanner />

    <!-- 9. Section: Dark Pine Footer (4 Columns + Payments) -->
    <StoreFooter />

    <!-- Modals & Drawers -->
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