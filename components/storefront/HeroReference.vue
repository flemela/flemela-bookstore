<!-- components/storefront/HeroReference.vue -->
<script setup lang="ts">
import { ref } from 'vue';
import { Search, ChevronDown } from 'lucide-vue-next';
import ReaderHeroIllustration from '~/components/illustrations/ReaderHeroIllustration.vue';

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
  'Biographies & Memoir',
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
  <section class="relative bg-[#04261B] text-white pt-6 pb-24 sm:pb-32 px-4 overflow-visible">
    
    <!-- Left 4-Book Column Mosaic (Straight, Staggered, Faded at Top with Gradient Mask) -->
    <div class="absolute left-2 lg:left-8 top-0 bottom-10 hidden md:flex gap-3 lg:gap-4.5 pointer-events-none [mask-image:linear-gradient(to_bottom,transparent_0%,black_35%,black_100%)]">
      
      <!-- Column 1 (Starts Higher) -->
      <div class="flex flex-col gap-3.5 -translate-y-6">
        <img
          src="https://covers.openlibrary.org/b/isbn/9780140283334-M.jpg"
          alt=""
          class="w-18 lg:w-22 h-26 lg:h-32 object-cover rounded shadow-2xl border border-white/10"
          referrerpolicy="no-referrer"
        />
        <img
          src="https://covers.openlibrary.org/b/isbn/9780062316097-M.jpg"
          alt=""
          class="w-18 lg:w-22 h-26 lg:h-32 object-cover rounded shadow-2xl border border-white/10"
          referrerpolicy="no-referrer"
        />
      </div>

      <!-- Column 2 (Starts Lower) -->
      <div class="flex flex-col gap-3.5 translate-y-6">
        <img
          src="https://covers.openlibrary.org/b/isbn/9780735211292-M.jpg"
          alt=""
          class="w-18 lg:w-22 h-26 lg:h-32 object-cover rounded shadow-2xl border border-white/10"
          referrerpolicy="no-referrer"
        />
        <img
          src="https://covers.openlibrary.org/b/isbn/9780857197689-M.jpg"
          alt=""
          class="w-18 lg:w-22 h-26 lg:h-32 object-cover rounded shadow-2xl border border-white/10"
          referrerpolicy="no-referrer"
        />
      </div>

    </div>

    <!-- Center Headline & Content -->
    <div class="relative z-10 max-w-3xl mx-auto text-center space-y-4 pt-4 sm:pt-6">
      
      <!-- Headline with Vector Doodles -->
      <div class="relative inline-block select-none">
        
        <!-- Top Flame SVG on 'C' -->
        <svg
          class="absolute -top-6 sm:-top-8 left-8 sm:left-14 w-6 h-8 text-[#F05A36] pointer-events-none"
          viewBox="0 0 24 32"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M12 0C12 0 16 6 16 11C16 13.5 14.5 15.5 12 16C9.5 15.5 8 13.5 8 11C8 6 12 0 12 0ZM12 18C16.5 18 20 21.5 20 26C20 29.5 16.5 32 12 32C7.5 32 4 29.5 4 26C4 21.5 7.5 18 12 18Z" />
        </svg>

        <!-- Top Asterisk SVG over 'NEXT' -->
        <svg
          class="absolute -top-2 right-12 sm:right-20 w-5 h-5 text-[#FFB800] pointer-events-none"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M12 0L14 8L22 6L16 12L22 18L14 16L12 24L10 16L2 18L8 12L2 6L10 8L12 0Z" />
        </svg>

        <!-- Main Condensed Headline Text -->
        <h1 class="font-sans font-black text-4xl sm:text-6xl lg:text-7xl tracking-tight leading-[1.04] uppercase text-white drop-shadow-md">
          THE NEXT <br />
          <span class="text-[#26D48C]">CHAPTER</span> IN <span class="text-[#F05A36]">YOUR</span> <br />
          READING <ReaderHeroIllustration /> JOURNEY
        </h1>

        <!-- Bottom Sparkle Star SVG under 'R' -->
        <svg
          class="absolute -bottom-3 left-16 sm:left-24 w-5 h-5 text-[#FFB800] pointer-events-none"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
        </svg>

        <!-- Turquoise Sparkle on 'JOURNEY' -->
        <svg
          class="absolute top-1/2 -right-4 sm:-right-6 w-5 h-5 text-[#26D48C] pointer-events-none"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
        </svg>
      </div>

      <!-- Muted Sage Subtitle -->
      <p class="text-xs sm:text-sm text-[#8EA499] max-w-md sm:max-w-lg mx-auto leading-relaxed font-sans pt-1">
        Browse a curated collection of page-turners, slow burns, and life-changing reads crafted to match your unique taste.
      </p>
    </div>

    <!-- Right 4-Book Column Mosaic (Straight, Staggered, Faded at Top with Gradient Mask) -->
    <div class="absolute right-2 lg:right-8 top-0 bottom-10 hidden md:flex gap-3 lg:gap-4.5 pointer-events-none [mask-image:linear-gradient(to_bottom,transparent_0%,black_35%,black_100%)]">
      
      <!-- Column 3 (Starts Lower) -->
      <div class="flex flex-col gap-3.5 translate-y-6">
        <img
          src="https://covers.openlibrary.org/b/isbn/9781501110368-M.jpg"
          alt=""
          class="w-18 lg:w-22 h-26 lg:h-32 object-cover rounded shadow-2xl border border-white/10"
          referrerpolicy="no-referrer"
        />
        <img
          src="https://covers.openlibrary.org/b/isbn/9780451524935-M.jpg"
          alt=""
          class="w-18 lg:w-22 h-26 lg:h-32 object-cover rounded shadow-2xl border border-white/10"
          referrerpolicy="no-referrer"
        />
      </div>

      <!-- Column 4 (Starts Higher) -->
      <div class="flex flex-col gap-3.5 -translate-y-6">
        <img
          src="https://covers.openlibrary.org/b/isbn/9780062315007-M.jpg"
          alt=""
          class="w-18 lg:w-22 h-26 lg:h-32 object-cover rounded shadow-2xl border border-white/10"
          referrerpolicy="no-referrer"
        />
        <img
          src="https://covers.openlibrary.org/b/isbn/9780140280197-M.jpg"
          alt=""
          class="w-18 lg:w-22 h-26 lg:h-32 object-cover rounded shadow-2xl border border-white/10"
          referrerpolicy="no-referrer"
        />
      </div>

    </div>

    <!-- THE 50/50 OVERLAPPING FLOATING SEARCH PILL -->
    <div class="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-full max-w-2xl px-4 z-30">
      <div class="bg-white rounded-full p-2 shadow-2xl border border-black/5 flex items-center gap-1 sm:gap-2">
        
        <!-- Category Dropdown -->
        <div class="relative flex-shrink-0">
          <button
            type="button"
            class="px-3.5 sm:px-4 py-2 text-xs font-semibold text-slate-800 flex items-center gap-1.5 border-r border-slate-200 cursor-pointer select-none"
            @click="isDropdownOpen = !isDropdownOpen"
          >
            <span class="max-w-[110px] sm:max-w-[130px] truncate">{{ selectedCategory }}</span>
            <ChevronDown :size="13" class="text-slate-500" />
          </button>

          <!-- Dropdown List -->
          <div
            v-if="isDropdownOpen"
            class="absolute top-full left-0 mt-2 w-52 bg-white border border-slate-200 rounded-2xl shadow-2xl py-2 z-50 text-left text-xs font-medium text-slate-800"
          >
            <button
              v-for="cat in categories"
              :key="cat"
              type="button"
              class="w-full text-left px-4 py-2 hover:bg-slate-50 transition-colors"
              :class="{ 'font-bold text-[#F05A36] bg-orange-50/50': selectedCategory === cat }"
              @click="handleSelectCat(cat)"
            >
              {{ cat }}
            </button>
          </div>
        </div>

        <!-- Input Text -->
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search 1 million books by title, author or ISBN"
          class="flex-1 bg-transparent px-3 text-xs sm:text-sm text-slate-800 outline-none placeholder:text-slate-400"
          @keyup.enter="handleSearch"
        />

        <!-- Coral Action Button with Search SVG -->
        <button
          type="button"
          class="bg-[#F05A36] hover:bg-[#D94827] text-white text-xs font-bold uppercase tracking-wider px-5 sm:px-7 py-2.5 sm:py-3 rounded-full transition-all flex items-center gap-1.5 shadow-md cursor-pointer flex-shrink-0 active:scale-95"
          @click="handleSearch"
        >
          <Search :size="14" />
          <span class="hidden sm:inline">Search</span>
        </button>
      </div>
    </div>

  </section>
</template>