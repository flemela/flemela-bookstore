<!-- components/storefront/HeroReference.vue -->
<script setup lang="ts">
import { ref } from 'vue';
import { Search, ChevronDown } from 'lucide-vue-next';

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
  <section class="relative bg-theme-dark text-white pt-10 pb-20 px-4 overflow-hidden">
    
    <!-- 8-Book Floating Mosaic (4 on Left, 4 on Right in 2 Staggered Columns) -->
    <div class="absolute inset-0 pointer-events-none flex justify-between items-center px-4 sm:px-8 max-w-7xl mx-auto opacity-40 lg:opacity-85">
      
      <!-- Left 4-Book Stack (2 Columns) -->
      <div class="hidden md:flex items-center gap-4 -translate-x-6 lg:-translate-x-2">
        <div class="flex flex-col gap-6 -translate-y-4">
          <img
            src="https://covers.openlibrary.org/b/isbn/9780140283334-M.jpg"
            alt=""
            class="w-16 sm:w-20 h-24 sm:h-28 object-cover rounded-book shadow-2xl rotate-[-7deg] border border-white/10"
            referrerpolicy="no-referrer"
          />
          <img
            src="https://covers.openlibrary.org/b/isbn/9780062316097-M.jpg"
            alt=""
            class="w-16 sm:w-20 h-24 sm:h-28 object-cover rounded-book shadow-2xl rotate-[5deg] border border-white/10"
            referrerpolicy="no-referrer"
          />
        </div>
        <div class="flex flex-col gap-6 translate-y-6">
          <img
            src="https://covers.openlibrary.org/b/isbn/9780735211292-M.jpg"
            alt=""
            class="w-20 sm:w-24 h-28 sm:h-36 object-cover rounded-book shadow-2xl rotate-[-3deg] border border-white/10"
            referrerpolicy="no-referrer"
          />
          <img
            src="https://covers.openlibrary.org/b/isbn/9780857197689-M.jpg"
            alt=""
            class="w-16 sm:w-20 h-24 sm:h-28 object-cover rounded-book shadow-2xl rotate-[8deg] border border-white/10"
            referrerpolicy="no-referrer"
          />
        </div>
      </div>

      <!-- Right 4-Book Stack (2 Columns) -->
      <div class="hidden md:flex items-center gap-4 translate-x-6 lg:translate-x-2">
        <div class="flex flex-col gap-6 translate-y-6">
          <img
            src="https://covers.openlibrary.org/b/isbn/9781501110368-M.jpg"
            alt=""
            class="w-20 sm:w-24 h-28 sm:h-36 object-cover rounded-book shadow-2xl rotate-[6deg] border border-white/10"
            referrerpolicy="no-referrer"
          />
          <img
            src="https://covers.openlibrary.org/b/isbn/9780451524935-M.jpg"
            alt=""
            class="w-16 sm:w-20 h-24 sm:h-28 object-cover rounded-book shadow-2xl rotate-[-6deg] border border-white/10"
            referrerpolicy="no-referrer"
          />
        </div>
        <div class="flex flex-col gap-6 -translate-y-4">
          <img
            src="https://covers.openlibrary.org/b/isbn/9780062315007-M.jpg"
            alt=""
            class="w-16 sm:w-20 h-24 sm:h-28 object-cover rounded-book shadow-2xl rotate-[-4deg] border border-white/10"
            referrerpolicy="no-referrer"
          />
          <img
            src="https://covers.openlibrary.org/b/isbn/9780140280197-M.jpg"
            alt=""
            class="w-16 sm:w-20 h-24 sm:h-28 object-cover rounded-book shadow-2xl rotate-[7deg] border border-white/10"
            referrerpolicy="no-referrer"
          />
        </div>
      </div>

    </div>

    <!-- Center Hero Content -->
    <div class="relative z-10 max-w-3xl mx-auto text-center space-y-6 pt-2 sm:pt-4">
      
      <!-- Headline -->
      <h1 class="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold uppercase tracking-tight leading-[1.12] drop-shadow-md">
        THE NEXT <br />
        <span class="text-theme-turquoise">CHAPTER</span> IN <span class="text-theme-coral">YOUR</span> <br />
        READING JOURNEY
      </h1>

      <p class="text-xs sm:text-sm text-white/80 max-w-md mx-auto leading-relaxed">
        Browse curated collections of page-turners, timeless classics, and life-changing books crafted to enrich your reading list.
      </p>

      <!-- The Single Floating Search Pill -->
      <div class="pt-3 max-w-2xl mx-auto">
        <div class="bg-white rounded-full p-1.5 shadow-2xl flex items-center gap-2 border border-white/20">
          
          <!-- Category Dropdown Selector -->
          <div class="relative flex-shrink-0">
            <button
              type="button"
              class="px-4 py-2 text-xs font-semibold text-theme-ink flex items-center gap-1.5 border-r border-slate-200 cursor-pointer select-none"
              @click="isDropdownOpen = !isDropdownOpen"
            >
              <span class="max-w-[120px] truncate">{{ selectedCategory }}</span>
              <ChevronDown :size="13" class="text-slate-500" />
            </button>

            <!-- Dropdown Menu -->
            <div
              v-if="isDropdownOpen"
              class="absolute top-full left-0 mt-2 w-52 bg-white border border-slate-200 rounded-2xl shadow-2xl py-2 z-50 text-left text-xs font-medium text-theme-ink"
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
            placeholder="Search 2 million books by title, author, or ISBN..."
            class="flex-1 bg-transparent px-3 text-xs sm:text-sm text-theme-ink outline-none placeholder:text-slate-400"
            @keyup.enter="handleSearch"
          />

          <!-- Coral Action Button -->
          <button
            type="button"
            class="bg-theme-coral hover:bg-theme-coral-hover text-white text-xs font-bold uppercase tracking-wider px-6 py-2.5 rounded-full transition-all flex items-center gap-1.5 shadow-md cursor-pointer flex-shrink-0 active:scale-95"
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