<!-- components/storefront/HeroReference.vue -->
<script setup lang="ts">
import { ref } from 'vue';
import { Search, ChevronDown, Sparkles } from 'lucide-vue-next';

const emit = defineEmits<{
  search: [query: string, category: string];
  selectCategory: [category: string];
}>();

const searchQuery = ref('');
const selectedCategory = ref('All Categories');
const isDropdownOpen = ref(false);

const categories = [
  'All Categories',
  'Fiction & Literature',
  'Psychology & Self-Help',
  'Business & Finance',
  'Christian Books',
  'Education & Textbooks',
  'Biographies & Memoir'
];

function handleSearch(): void {
  emit('search', searchQuery.value.trim(), selectedCategory.value);
}

function handleSelectCat(cat: string): void {
  selectedCategory.value = cat;
  isDropdownOpen.value = false;
  emit('selectCategory', cat === 'All Categories' ? 'ALL' : cat);
}
</script>

<template>
  <section class="relative bg-theme-dark text-white pt-12 pb-20 px-4 overflow-hidden">
    <!-- Floating Cover Stacks (Left and Right) -->
    <div class="absolute inset-0 pointer-events-none opacity-30 flex justify-between items-center px-4 sm:px-12">
      <!-- Left Stack -->
      <div class="hidden lg:flex flex-col gap-6 -translate-x-6">
        <img src="https://covers.openlibrary.org/b/isbn/9780140283334-M.jpg" alt="" class="w-16 h-24 object-cover rounded shadow-lg rotate-[-6deg]" referrerpolicy="no-referrer" />
        <img src="https://covers.openlibrary.org/b/isbn/9780735211292-M.jpg" alt="" class="w-20 h-28 object-cover rounded shadow-lg rotate-[4deg] translate-x-4" referrerpolicy="no-referrer" />
        <img src="https://covers.openlibrary.org/b/isbn/9780062316097-M.jpg" alt="" class="w-16 h-24 object-cover rounded shadow-lg rotate-[-3deg]" referrerpolicy="no-referrer" />
      </div>

      <!-- Right Stack -->
      <div class="hidden lg:flex flex-col gap-6 translate-x-6">
        <img src="https://covers.openlibrary.org/b/isbn/9781501110368-M.jpg" alt="" class="w-16 h-24 object-cover rounded shadow-lg rotate-[8deg]" referrerpolicy="no-referrer" />
        <img src="https://covers.openlibrary.org/b/isbn/9780857197689-M.jpg" alt="" class="w-20 h-28 object-cover rounded shadow-lg rotate-[-5deg] -translate-x-4" referrerpolicy="no-referrer" />
        <img src="https://covers.openlibrary.org/b/isbn/9780451524935-M.jpg" alt="" class="w-16 h-24 object-cover rounded shadow-lg rotate-[3deg]" referrerpolicy="no-referrer" />
      </div>
    </div>

    <!-- Hero Content -->
    <div class="relative z-10 max-w-3xl mx-auto text-center space-y-6">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-theme-turquoise shadow-xs">
        <Sparkles :size="13" />
        <span>Curated for Curious Minds</span>
      </div>

      <h1 class="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold uppercase tracking-tight leading-[1.1]">
        THE NEXT <br />
        <span class="text-theme-turquoise">CHAPTER</span> IN <span class="text-theme-coral">YOUR</span> <br />
        READING JOURNEY
      </h1>

      <p class="text-xs sm:text-sm text-white/75 max-w-lg mx-auto leading-relaxed">
        Browse curated collections of page-turners, timeless classics, and life-changing books crafted to enrich your reading list.
      </p>

      <!-- Search Bar -->
      <div class="pt-2 max-w-2xl mx-auto">
        <div class="bg-white rounded-full p-1.5 shadow-2xl flex items-center gap-2 border border-white/20">
          
          <!-- Category Dropdown -->
          <div class="relative flex-shrink-0">
            <button
              type="button"
              class="px-4 py-2 text-xs font-semibold text-theme-ink flex items-center gap-1.5 border-r border-slate-200 cursor-pointer select-none"
              @click="isDropdownOpen = !isDropdownOpen"
            >
              <span class="max-w-[120px] truncate">{{ selectedCategory }}</span>
              <ChevronDown :size="13" class="text-slate-500" />
            </button>

            <div
              v-if="isDropdownOpen"
              class="absolute top-full left-0 mt-2 w-52 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 text-left text-xs font-medium text-theme-ink"
            >
              <button
                v-for="cat in categories"
                :key="cat"
                type="button"
                class="w-full text-left px-4 py-2 hover:bg-slate-50 transition-colors"
                :class="{ 'font-bold text-theme-coral bg-orange-50/50': selectedCategory === cat }"
                @click="handleSelectCat(cat)"
              >
                {{ cat }}
              </button>
            </div>
          </div>

          <!-- Input -->
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search by title, author, or ISBN..."
            class="flex-1 bg-transparent px-3 text-xs sm:text-sm text-theme-ink outline-none placeholder:text-slate-400"
            @keyup.enter="handleSearch"
          />

          <!-- Button -->
          <button
            type="button"
            class="bg-theme-coral hover:bg-theme-coral-hover text-white text-xs font-bold uppercase tracking-wider px-6 py-2.5 rounded-full transition-all flex items-center gap-1.5 shadow-md cursor-pointer flex-shrink-0"
            @click="handleSearch"
          >
            <Search :size="14" />
            <span class="hidden sm:inline">Search</span>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>