<!-- flemela/components/storefront/HeroReference.vue -->
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
  <section class="relative bg-[#052219] text-white pt-6 pb-28 sm:pb-36 overflow-visible select-none">
    
    <!-- LEFT 4-BOOK STACK (2 Staggered Straight Columns, Faded at Top with Gradient Mask) -->
    <div class="absolute left-2 sm:left-4 lg:left-8 top-0 bottom-0 hidden md:flex gap-2.5 lg:gap-3 pointer-events-none hero-faded-stack">
      
      <!-- Column 1 (Starts Higher) -->
      <div class="flex flex-col gap-2.5 -translate-y-6">
        <img
          src="https://covers.openlibrary.org/b/isbn/9781538724736-M.jpg"
          alt="Lost and Lassoed"
          class="w-14 sm:w-16 lg:w-18 h-20 sm:h-22 lg:h-26 object-cover rounded shadow-lg border border-white/10"
          referrerpolicy="no-referrer"
        />
        <img
          src="https://covers.openlibrary.org/b/isbn/9780062316097-M.jpg"
          alt="Path of Progress"
          class="w-14 sm:w-16 lg:w-18 h-20 sm:h-22 lg:h-26 object-cover rounded shadow-lg border border-white/10"
          referrerpolicy="no-referrer"
        />
      </div>

      <!-- Column 2 (Starts Lower) -->
      <div class="flex flex-col gap-2.5 translate-y-5">
        <img
          src="https://covers.openlibrary.org/b/isbn/9781250268822-M.jpg"
          alt="Each of Us a Desert"
          class="w-14 sm:w-16 lg:w-18 h-20 sm:h-22 lg:h-26 object-cover rounded shadow-lg border border-white/10"
          referrerpolicy="no-referrer"
        />
        <img
          src="https://covers.openlibrary.org/b/isbn/9781501171345-M.jpg"
          alt="The Last Thing He Told Me"
          class="w-14 sm:w-16 lg:w-18 h-20 sm:h-22 lg:h-26 object-cover rounded shadow-lg border border-white/10"
          referrerpolicy="no-referrer"
        />
      </div>

    </div>

    <!-- CENTER HERO POSTER TYPOGRAPHY & DOODLES -->
    <div class="relative z-10 max-w-4xl mx-auto text-center px-4 pt-2">
      
      <div class="relative inline-block">
        
        <!-- Top Left Flame Doodle on "C" -->
        <svg
          class="absolute -top-7 sm:-top-9 left-12 sm:left-18 w-6 sm:w-7 h-8 text-[#FF5722] pointer-events-none"
          viewBox="0 0 24 32"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M12 0C12 0 16 6 16 11C16 13.5 14.5 15.5 12 16C9.5 15.5 8 13.5 8 11C8 6 12 0 12 0ZM12 18C16.5 18 20 21.5 20 26C20 29.5 16.5 32 12 32C7.5 32 4 29.5 4 26C4 21.5 7.5 18 12 18Z" />
        </svg>

        <!-- Top Right Asterisk Doodle on "NEXT" -->
        <svg
          class="absolute -top-3 right-10 sm:right-16 w-5 sm:w-6 h-5 sm:h-6 text-[#FFB300] pointer-events-none"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M12 0L14 8L22 6L16 12L22 18L14 16L12 24L10 16L2 18L8 12L2 6L10 8L12 0Z" />
        </svg>

        <!-- Main Poster Headline (Bebas Neue) -->
        <h1 class="font-poster text-5xl sm:text-7xl lg:text-[88px] leading-[0.93] tracking-wide uppercase text-white drop-shadow-sm">
          THE NEXT <br />
          <span class="text-[#2EE59D]">CHAPTER</span> IN <span class="text-[#FF8A00]">YOUR</span> <br />
          READING 
          <ReaderHeroIllustration />
          JOURNEY
        </h1>

        <!-- Bottom Left Star Doodle under "R" -->
        <svg
          class="absolute -bottom-2 left-6 sm:left-12 w-5 sm:w-6 h-5 sm:h-6 text-[#FFB300] pointer-events-none"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
        </svg>

        <!-- Turquoise Sparkle on "JOURNEY" -->
        <svg
          class="absolute top-1/2 -right-4 sm:-right-8 w-5 sm:w-6 h-5 sm:h-6 text-[#2EE59D] pointer-events-none"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
        </svg>
      </div>

      <!-- Muted Sage Subtitle -->
      <p class="text-xs sm:text-sm text-[#8FA89B] max-w-lg mx-auto leading-relaxed font-sans pt-3">
        Browse a curated collection of page-turners, slow burns, and life-changing reads crafted to match your unique taste.
      </p>
    </div>

    <!-- RIGHT 4-BOOK STACK (2 Staggered Straight Columns, Faded at Top with Gradient Mask) -->
    <div class="absolute right-2 sm:right-4 lg:right-8 top-0 bottom-0 hidden md:flex gap-2.5 lg:gap-3 pointer-events-none hero-faded-stack">
      
      <!-- Column 3 (Starts Lower) -->
      <div class="flex flex-col gap-2.5 translate-y-5">
        <img
          src="https://covers.openlibrary.org/b/isbn/9780525536963-M.jpg"
          alt="A Burning"
          class="w-14 sm:w-16 lg:w-18 h-20 sm:h-22 lg:h-26 object-cover rounded shadow-lg border border-white/10"
          referrerpolicy="no-referrer"
        />
        <img
          src="https://covers.openlibrary.org/b/isbn/9780593300237-M.jpg"
          alt="Unicorn Irma"
          class="w-14 sm:w-16 lg:w-18 h-20 sm:h-22 lg:h-26 object-cover rounded shadow-lg border border-white/10"
          referrerpolicy="no-referrer"
        />
      </div>

      <!-- Column 4 (Starts Higher) -->
      <div class="flex flex-col gap-2.5 -translate-y-6">
        <img
          src="https://covers.openlibrary.org/b/isbn/9781646220601-M.jpg"
          alt="The Disaster Tourist"
          class="w-14 sm:w-16 lg:w-18 h-20 sm:h-22 lg:h-26 object-cover rounded shadow-lg border border-white/10"
          referrerpolicy="no-referrer"
        />
        <img
          src="https://covers.openlibrary.org/b/isbn/9780593135204-M.jpg"
          alt="Kanslo Smart"
          class="w-14 sm:w-16 lg:w-18 h-20 sm:h-22 lg:h-26 object-cover rounded shadow-lg border border-white/10"
          referrerpolicy="no-referrer"
        />
      </div>

    </div>

    <!-- 50/50 OVERLAPPING FLOATING SEARCH PILL -->
    <div class="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-full max-w-2xl px-4 z-30">
      <div class="bg-white rounded-full p-2 shadow-search-pill border border-black/5 flex items-center gap-1 sm:gap-2">
        
        <!-- Category Dropdown Selector -->
        <div class="relative flex-shrink-0">
          <button
            type="button"
            class="px-3.5 sm:px-4 py-2 text-xs font-semibold text-slate-800 flex items-center gap-1.5 border-r border-slate-200 cursor-pointer select-none"
            @click="isDropdownOpen = !isDropdownOpen"
          >
            <span class="max-w-[110px] sm:max-w-[130px] truncate">{{ selectedCategory }}</span>
            <ChevronDown :size="13" class="text-slate-500 transition-transform" :class="{ 'rotate-180': isDropdownOpen }" />
          </button>

          <!-- Dropdown List Menu -->
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
          class="flex-1 bg-transparent px-3 text-xs sm:text-sm text-slate-800 outline-none placeholder:text-slate-400 font-sans"
          @keyup.enter="handleSearch"
        />

        <!-- Coral Pill Button with Search SVG -->
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