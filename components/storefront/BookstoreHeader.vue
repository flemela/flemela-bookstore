<!-- components/storefront/BookstoreHeader.vue -->
<script setup lang="ts">
import { ref } from 'vue';
import { Search, ShoppingBag, Menu, X, ChevronDown } from 'lucide-vue-next';
import { useCart } from '~/composables/useCart';

const emit = defineEmits<{
  search: [query: string, category: string];
  selectCategory: [category: string];
}>();

const { totalItems, openDrawer } = useCart();
const searchInput = ref('');
const selectedCategory = ref('All Categories');
const isCategoryDropdownOpen = ref(false);
const isMobileMenuOpen = ref(false);

const categories = [
  'All Categories',
  'Fiction & Literature',
  'Psychology & Self-Help',
  'Business & Finance',
  'Christian Books',
  'Education & Textbooks',
  'Biographies & Memoir',
];

function handleSearch(): void {
  emit('search', searchInput.value.trim(), selectedCategory.value);
  isMobileMenuOpen.value = false;
}

function handleCategoryClick(cat: string): void {
  selectedCategory.value = cat;
  isCategoryDropdownOpen.value = false;
  emit('selectCategory', cat === 'All Categories' ? 'ALL' : cat);
}

function clearSearch(): void {
  searchInput.value = '';
  emit('search', '', selectedCategory.value);
}
</script>

<template>
  <header class="bg-paper-surface/95 backdrop-blur-md border-b border-paper-border sticky top-0 z-40 transition-all">
    <!-- Main Navigation Bar -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3 sm:gap-6">
      
      <!-- Left: Mobile Menu Trigger & Brand Logo -->
      <div class="flex items-center gap-3 flex-shrink-0">
        <button
          type="button"
          class="md:hidden p-1.5 text-forest-950 hover:bg-paper-cream rounded-lg transition-colors cursor-pointer"
          aria-label="Toggle navigation menu"
          @click="isMobileMenuOpen = !isMobileMenuOpen"
        >
          <component :is="isMobileMenuOpen ? X : Menu" :size="20" />
        </button>

        <NuxtLink to="/" class="flex items-center gap-2 group">
          <img
            src="/images/logo.png"
            alt="Flemela Bookstore Logo"
            class="h-9 sm:h-11 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
            width="120"
            height="44"
          />
        </NuxtLink>
      </div>

      <!-- Center: Floating Search Pill (Desktop) -->
      <div class="hidden md:flex items-center flex-1 max-w-xl mx-2 bg-paper-canvas rounded-full border border-paper-border focus-within:border-forest-800/40 focus-within:bg-white focus-within:ring-2 focus-within:ring-forest-900/5 transition-all shadow-subtle">
        
        <!-- Category Dropdown Trigger -->
        <div class="relative flex-shrink-0">
          <button
            type="button"
            class="px-3.5 py-2 text-[11px] font-sans font-semibold text-forest-950 hover:text-gold-600 flex items-center gap-1 border-r border-paper-border cursor-pointer select-none"
            @click="isCategoryDropdownOpen = !isCategoryDropdownOpen"
          >
            <span class="max-w-[110px] truncate">{{ selectedCategory }}</span>
            <ChevronDown :size="12" class="text-ink-muted transition-transform" :class="{ 'rotate-180': isCategoryDropdownOpen }" />
          </button>

          <!-- Dropdown Menu -->
          <div
            v-if="isCategoryDropdownOpen"
            class="absolute top-full left-0 mt-1.5 w-52 bg-white border border-paper-border rounded-xl shadow-medium py-1.5 z-50 text-xs font-medium text-forest-950"
          >
            <button
              v-for="cat in categories"
              :key="cat"
              type="button"
              class="w-full text-left px-3.5 py-2 hover:bg-paper-cream transition-colors text-xs font-semibold cursor-pointer"
              :class="{ 'text-forest-950 font-bold bg-paper-cream/80': selectedCategory === cat }"
              @click="handleCategoryClick(cat)"
            >
              {{ cat }}
            </button>
          </div>
        </div>

        <!-- Text Input -->
        <input
          v-model="searchInput"
          type="text"
          placeholder="Search by title, author, or keyword..."
          class="flex-1 bg-transparent px-3.5 py-2 text-xs text-forest-950 font-medium outline-none placeholder:text-ink-subtle"
          @keyup.enter="handleSearch"
        />

        <!-- Clear Button -->
        <button
          v-if="searchInput"
          type="button"
          class="p-1 text-ink-subtle hover:text-forest-950 mr-1 cursor-pointer"
          aria-label="Clear search query"
          @click="clearSearch"
        >
          <X :size="13" />
        </button>

        <!-- Search Action Button -->
        <button
          type="button"
          class="px-3.5 py-2 text-forest-950 hover:text-gold-600 transition-colors cursor-pointer"
          aria-label="Search"
          @click="handleSearch"
        >
          <Search :size="14" />
        </button>
      </div>

      <!-- Right: Portal & Cart Actions -->
      <div class="flex items-center gap-2.5 sm:gap-3 flex-shrink-0">
        <NuxtLink
          to="/admin/login"
          class="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-ink-muted hover:text-forest-950 transition-colors px-2.5 py-1.5 rounded-md hover:bg-paper-cream"
        >
          <span>Portal</span>
        </NuxtLink>

        <!-- Cart Bag Button -->
        <button
          type="button"
          class="relative flex items-center gap-2 bg-forest-950 text-paper hover:bg-forest-900 active:bg-forest-950 px-3.5 py-2 rounded-lg transition-all text-xs font-bold cursor-pointer shadow-subtle active:scale-[0.98]"
          @click="openDrawer"
        >
          <div class="relative flex items-center justify-center">
            <ShoppingBag :size="15" class="text-gold-300" />
            <span
              v-if="totalItems > 0"
              class="absolute -top-2 -right-2.5 bg-gold-500 text-forest-950 font-extrabold text-[9px] px-1.5 py-0.2 rounded-full font-mono shadow-xs"
            >
              {{ totalItems }}
            </span>
          </div>
          <span class="font-sans text-xs font-bold hidden sm:inline">Cart</span>
        </button>
      </div>
    </div>

    <!-- Mobile Search Bar (Sticky Sub-Bar) -->
    <div class="md:hidden px-4 pb-2.5">
      <div class="flex items-center bg-paper-canvas rounded-full border border-paper-border px-3 py-1.5 shadow-subtle">
        <Search :size="13" class="text-ink-muted mr-2 flex-shrink-0" />
        <input
          v-model="searchInput"
          type="text"
          placeholder="Search books, authors..."
          class="w-full bg-transparent text-xs text-forest-950 font-medium outline-none placeholder:text-ink-subtle"
          @keyup.enter="handleSearch"
        />
        <button
          v-if="searchInput"
          type="button"
          class="p-0.5 text-ink-subtle hover:text-forest-950"
          @click="clearSearch"
        >
          <X :size="12" />
        </button>
      </div>
    </div>

    <!-- Mobile Navigation Drawer -->
    <div v-if="isMobileMenuOpen" class="md:hidden bg-paper-surface border-t border-paper-border px-4 py-4 space-y-3.5 shadow-medium">
      <div class="flex items-center justify-between">
        <p class="text-[10px] uppercase font-mono font-bold tracking-widest text-gold-600">Browse Catalog</p>
        <button type="button" class="text-xs text-ink-muted" @click="isMobileMenuOpen = false">Close</button>
      </div>

      <div class="grid grid-cols-2 gap-2 text-xs">
        <button
          v-for="cat in categories"
          :key="cat"
          type="button"
          class="text-left py-2 px-2.5 rounded-lg bg-paper-canvas border border-paper-border hover:bg-paper-cream font-medium text-forest-950 truncate cursor-pointer text-[11px]"
          @click="handleCategoryClick(cat); isMobileMenuOpen = false;"
        >
          {{ cat }}
        </button>
      </div>

      <div class="pt-3 border-t border-paper-border flex justify-between items-center text-xs">
        <NuxtLink to="/admin/login" class="text-forest-950 font-bold hover:underline">Merchant Portal</NuxtLink>
        <span class="text-[10px] text-ink-muted font-mono">Flemela Books</span>
      </div>
    </div>
  </header>
</template>