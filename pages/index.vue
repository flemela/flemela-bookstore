<!-- pages/index.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue';
import TopUtilityBar from '~/components/storefront/TopUtilityBar.vue';
import BookstoreHeader from '~/components/storefront/BookstoreHeader.vue';
import HeroReference from '~/components/storefront/HeroReference.vue';
import BentoCategories from '~/components/storefront/BentoCategories.vue';
import DealsWeek from '~/components/storefront/DealsWeek.vue';
import BookCard from '~/components/storefront/BookCard.vue';
import CartDrawer from '~/components/storefront/CartDrawer.vue';
import ToastContainer from '~/components/ui/ToastContainer.vue';
import BookRequestModal from '~/components/storefront/BookRequestModal.vue';
import { MONTHLY_TOP_SEEDS, mergeWithSeeds } from '~/data/seeds';
import { BookOpen } from 'lucide-vue-next';
import type { Book } from '~/types';

const { data: realBooks } = await useFetch<Book[]>('/api/products');

const activeCategoryFilter = ref<string>('ALL');
const searchQuery = ref<string>('');

const showRequestModal = ref(false);
const modalInitialTitle = ref('');
const modalInitialAuthor = ref('');

// Section 1: #1 Books of the Month (Real DB books take lead, seeds fill remainder)
const monthlyTopBooks = computed(() => {
  return mergeWithSeeds(realBooks.value, MONTHLY_TOP_SEEDS, 4);
});

// Full Search & Filter Engine
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
    <TopUtilityBar />
    <BookstoreHeader @search="handleSearch" @select-category="handleCategorySelect" />
    
    <!-- Hero Banner with Floating Covers & Search -->
    <HeroReference @search="handleSearch" @select-category="handleCategorySelect" />

    <!-- Search / Filter Results Section (Scroll Target) -->
    <section id="catalog-results" v-if="hasActiveFilter" class="py-12 px-4 max-w-6xl mx-auto w-full space-y-6">
      <div class="flex items-center justify-between bg-theme-surface p-4 rounded-2xl border border-theme-border shadow-soft">
        <div class="space-y-0.5">
          <span class="text-[10px] font-mono font-bold uppercase tracking-widest text-theme-coral">Filtered Catalog</span>
          <p class="text-xs text-theme-ink font-medium">
            Category: <strong>{{ activeCategoryFilter }}</strong>
            <template v-if="searchQuery"> • Search: "{{ searchQuery }}"</template>
          </p>
        </div>
        <button
          type="button"
          class="text-xs font-bold text-theme-coral hover:underline px-3 py-1.5 bg-orange-50 rounded-xl"
          @click="activeCategoryFilter = 'ALL'; searchQuery = '';"
        >
          Reset Filter
        </button>
      </div>

      <div v-if="filteredBooks.length === 0" class="bg-theme-surface rounded-2xl border border-theme-border p-12 text-center space-y-3">
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

    <!-- 1. #1 Book of the Month Section -->
    <section class="py-14 px-4 max-w-6xl mx-auto w-full space-y-6">
      <div class="flex flex-wrap items-baseline justify-between gap-4 border-b border-theme-border pb-3">
        <div>
          <h2 class="font-display text-xl sm:text-2xl font-bold uppercase text-theme-ink tracking-tight">
            THE #1 BOOK OF THE MONTH YOU CAN'T MISS
          </h2>
          <p class="text-xs text-theme-muted">Dominating the reading lists and changing how we view mindset, power, and success.</p>
        </div>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <BookCard v-for="book in monthlyTopBooks" :key="book.id" :book="book" @request-seed="handleRequestSeed" />
      </div>
    </section>

    <!-- 2. Bento Category Grid -->
    <BentoCategories @select="handleCategorySelect" />

    <!-- 3. Deals of the Week (Warm Sand + Live Timer) -->
    <DealsWeek :books="realBooks || []" @request-seed="handleRequestSeed" />

    <!-- 4. Best Sellers of the Month + Promo Card -->
    <section class="py-14 px-4 max-w-6xl mx-auto w-full space-y-6">
      <div class="flex items-baseline justify-between border-b border-theme-border pb-3">
        <h2 class="font-display text-xl sm:text-2xl font-bold uppercase text-theme-ink tracking-tight">
          BEST SELLERS OF THE MONTH
        </h2>
      </div>

      <div class="grid lg:grid-cols-12 gap-6">
        <div class="lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-4">
          <BookCard
            v-for="book in ((realBooks && realBooks.length >= 6) ? realBooks.slice(0, 6) : monthlyTopBooks)"
            :key="book.id"
            :book="book"
            @request-seed="handleRequestSeed"
          />
        </div>

        <!-- Vertical Promo Card -->
        <div class="lg:col-span-4 bg-theme-dark text-white rounded-2xl p-8 flex flex-col justify-between items-center text-center shadow-card relative overflow-hidden">
          <div class="space-y-2 z-10">
            <span class="text-[10px] font-mono uppercase font-bold tracking-widest text-theme-turquoise block">Special Privilege</span>
            <h3 class="font-display text-2xl sm:text-3xl font-bold uppercase leading-tight">GET 20% OFF BESTSELLERS</h3>
            <p class="text-xs text-white/70">Pick the stories that readers across Nairobi are talking about.</p>
          </div>
          <button
            type="button"
            class="w-full bg-theme-coral hover:bg-theme-coral-hover text-white text-xs font-bold uppercase tracking-wider py-3 rounded-xl transition-all shadow-md cursor-pointer z-10"
            @click="handleCategorySelect('Fiction & Literature')"
          >
            Explore Bestsellers
          </button>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="bg-theme-dark text-white py-12 px-4 border-t border-white/10 mt-auto">
      <div class="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
        <div class="space-y-1 text-center sm:text-left">
          <span class="font-display font-bold text-base tracking-tight text-white block">FLEMELA BOOKSTORE</span>
          <p class="text-white/70 text-xs">Books that inspire. Knowledge that transforms.</p>
        </div>
        <p class="text-white/50 text-xs font-mono">&copy; 2026 Flemela Bookstore. All rights reserved.</p>
      </div>
    </footer>

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