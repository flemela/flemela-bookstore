<!-- components/storefront/HeroCarousel.vue -->
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Search,
  ChevronDown,
} from 'lucide-vue-next';
import ReaderHeroIllustration from '~/components/illustrations/ReaderHeroIllustration.vue';
import type { PublicBanner } from '~/server/api/banners/index.get';

const emit = defineEmits<{
  search: [query: string, category: string];
  selectCategory: [category: string];
}>();

// 1. Fetch Dynamic Admin Banners from Public Proxy
const { data: remoteBanners } = await useFetch<PublicBanner[]>('/api/banners');

// Slide 0 is the permanent coded brand hero. Total slides = 1 + remote banners.
const bannersList = computed(() => remoteBanners.value || []);
const totalSlides = computed(() => 1 + bannersList.value.length);

// 2. Carousel Sliding & Timer State
const activeIndex = ref(0);
const isPaused = ref(false);
let autoplayTimer: ReturnType<typeof setInterval> | undefined;

// 3. Touch Gesture Swiping State
const touchStartX = ref(0);
const touchEndX = ref(0);

// 4. Search & Category Dropdown State
const searchQuery = ref('');
const selectedCategory = ref('All Categories');
const isDropdownOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);

const categories = [
  'All Categories',
  'Fiction & Literature',
  'Psychology & Self-Help',
  'Business & Finance',
  'Christian Books',
  'Education & Textbooks',
  'Biographies & Memoir',
];

function nextSlide(): void {
  if (totalSlides.value <= 1) return;
  activeIndex.value = (activeIndex.value + 1) % totalSlides.value;
  resetAutoplay();
}

function prevSlide(): void {
  if (totalSlides.value <= 1) return;
  activeIndex.value = (activeIndex.value - 1 + totalSlides.value) % totalSlides.value;
  resetAutoplay();
}

function goToSlide(index: number): void {
  activeIndex.value = index;
  resetAutoplay();
}

function startAutoplay(): void {
  stopAutoplay();
  // Only rotate if there is at least one promotional banner alongside the brand slide
  if (totalSlides.value > 1 && !isPaused.value) {
    autoplayTimer = setInterval(() => {
      nextSlide();
    }, 5500);
  }
}

function stopAutoplay(): void {
  if (autoplayTimer) {
    clearInterval(autoplayTimer);
    autoplayTimer = undefined;
  }
}

function resetAutoplay(): void {
  startAutoplay();
}

function handleMouseEnter(): void {
  isPaused.value = true;
  stopAutoplay();
}

function handleMouseLeave(): void {
  isPaused.value = false;
  startAutoplay();
}

// Touch Swiping Handlers
function handleTouchStart(e: TouchEvent): void {
  touchStartX.value = e.touches[0].clientX;
  isPaused.value = true;
  stopAutoplay();
}

function handleTouchEnd(e: TouchEvent): void {
  touchEndX.value = e.changedTouches[0].clientX;
  const deltaX = touchStartX.value - touchEndX.value;

  if (Math.abs(deltaX) > 40) {
    if (deltaX > 0) {
      nextSlide();
    } else {
      prevSlide();
    }
  }

  isPaused.value = false;
  startAutoplay();
}

// Non-blocking Banner Click Telemetry & Navigation
async function handleBannerClick(banner: PublicBanner): Promise<void> {
  $fetch(`/api/banners/${banner.id}/click`, { method: 'POST' }).catch(() => {});

  if (!banner.cta_link) return;

  if (banner.cta_link.startsWith('http')) {
    window.open(banner.cta_link, '_blank', 'noopener,noreferrer');
  } else if (banner.cta_link.startsWith('#')) {
    const el = document.querySelector(banner.cta_link);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  } else {
    navigateTo(banner.cta_link);
  }
}

// Search Actions
function handleSearch(): void {
  emit('search', searchQuery.value.trim(), selectedCategory.value);
}

function handleSelectCat(cat: string): void {
  selectedCategory.value = cat;
  isDropdownOpen.value = false;
  emit('selectCategory', cat === 'All Categories' ? 'ALL' : cat);
}

function handleOutsideClick(e: MouseEvent): void {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
    isDropdownOpen.value = false;
  }
}

onMounted(() => {
  if (process.client) {
    document.addEventListener('click', handleOutsideClick);

    // WCAG 2.2.2: Disable autoplay if user prefers reduced motion
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      startAutoplay();
    }
  }
});

onUnmounted(() => {
  stopAutoplay();
  if (process.client) {
    document.removeEventListener('click', handleOutsideClick);
  }
});
</script>

<template>
  <section
    class="relative select-none bg-[#052219] text-white pb-20 sm:pb-24"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @touchstart="handleTouchStart"
    @touchend="handleTouchEnd"
  >
    <!-- Slide Deck Container -->
    <div class="relative w-full overflow-hidden min-h-[460px] sm:min-h-[500px] lg:min-h-[540px]">
      
      <!-- ================================================================= -->
      <!-- SLIDE 0: PERMANENT BRAND HERO POSTER (Always Present, Never Lost) -->
      <!-- ================================================================= -->
      <div
        class="absolute inset-0 transition-opacity duration-700 ease-in-out bg-[#052219] flex items-center justify-center"
        :class="activeIndex === 0 ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'"
      >
        <!-- LEFT 4-BOOK STACK (Faded Top Gradient Mask) -->
        <div class="absolute left-2 sm:left-4 lg:left-8 top-0 bottom-0 hidden md:flex gap-2.5 lg:gap-3 pointer-events-none hero-faded-stack">
          <div class="flex flex-col gap-2.5 -translate-y-6">
            <img
              src="https://covers.openlibrary.org/b/isbn/9781538724736-M.jpg"
              alt=""
              class="w-14 sm:w-16 lg:w-18 h-20 sm:h-22 lg:h-26 object-cover rounded shadow-lg border border-white/10"
              referrerpolicy="no-referrer"
            />
            <img
              src="https://covers.openlibrary.org/b/isbn/9780062316097-M.jpg"
              alt=""
              class="w-14 sm:w-16 lg:w-18 h-20 sm:h-22 lg:h-26 object-cover rounded shadow-lg border border-white/10"
              referrerpolicy="no-referrer"
            />
          </div>
          <div class="flex flex-col gap-2.5 translate-y-5">
            <img
              src="https://covers.openlibrary.org/b/isbn/9781250268822-M.jpg"
              alt=""
              class="w-14 sm:w-16 lg:w-18 h-20 sm:h-22 lg:h-26 object-cover rounded shadow-lg border border-white/10"
              referrerpolicy="no-referrer"
            />
            <img
              src="https://covers.openlibrary.org/b/isbn/9781501171345-M.jpg"
              alt=""
              class="w-14 sm:w-16 lg:w-18 h-20 sm:h-22 lg:h-26 object-cover rounded shadow-lg border border-white/10"
              referrerpolicy="no-referrer"
            />
          </div>
        </div>

        <!-- CENTER TYPOGRAPHY & DOODLES -->
        <div class="relative z-10 max-w-4xl mx-auto text-center px-4 py-8">
          <div class="relative inline-block">
            <!-- Flame Doodle on "C" -->
            <svg
              class="absolute -top-7 sm:-top-9 left-12 sm:left-18 w-6 sm:w-7 h-8 text-[#FF5722] pointer-events-none"
              viewBox="0 0 24 32"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 0C12 0 16 6 16 11C16 13.5 14.5 15.5 12 16C9.5 15.5 8 13.5 8 11C8 6 12 0 12 0ZM12 18C16.5 18 20 21.5 20 26C20 29.5 16.5 32 12 32C7.5 32 4 29.5 4 26C4 21.5 7.5 18 12 18Z" />
            </svg>

            <!-- Asterisk Doodle on "NEXT" -->
            <svg
              class="absolute -top-3 right-10 sm:right-16 w-5 sm:w-6 h-5 sm:h-6 text-[#FFB300] pointer-events-none"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 0L14 8L22 6L16 12L22 18L14 16L12 24L10 16L2 18L8 12L2 6L10 8L12 0Z" />
            </svg>

            <!-- Main Bebas Poster Headline -->
            <h1 class="font-poster text-5xl sm:text-7xl lg:text-[88px] leading-[0.93] tracking-wide uppercase text-white drop-shadow-sm">
              THE NEXT <br />
              <span class="text-[#2EE59D]">CHAPTER</span> IN <span class="text-[#FF8A00]">YOUR</span> <br />
              READING 
              <ReaderHeroIllustration />
              JOURNEY
            </h1>

            <!-- Bottom Left Star Doodle -->
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

        <!-- RIGHT 4-BOOK STACK (Faded Top Gradient Mask) -->
        <div class="absolute right-2 sm:right-4 lg:right-8 top-0 bottom-0 hidden md:flex gap-2.5 lg:gap-3 pointer-events-none hero-faded-stack">
          <div class="flex flex-col gap-2.5 translate-y-5">
            <img
              src="https://covers.openlibrary.org/b/isbn/9780525536963-M.jpg"
              alt=""
              class="w-14 sm:w-16 lg:w-18 h-20 sm:h-22 lg:h-26 object-cover rounded shadow-lg border border-white/10"
              referrerpolicy="no-referrer"
            />
            <img
              src="https://covers.openlibrary.org/b/isbn/9780593300237-M.jpg"
              alt=""
              class="w-14 sm:w-16 lg:w-18 h-20 sm:h-22 lg:h-26 object-cover rounded shadow-lg border border-white/10"
              referrerpolicy="no-referrer"
            />
          </div>
          <div class="flex flex-col gap-2.5 -translate-y-6">
            <img
              src="https://covers.openlibrary.org/b/isbn/9781646220601-M.jpg"
              alt=""
              class="w-14 sm:w-16 lg:w-18 h-20 sm:h-22 lg:h-26 object-cover rounded shadow-lg border border-white/10"
              referrerpolicy="no-referrer"
            />
            <img
              src="https://covers.openlibrary.org/b/isbn/9780593135204-M.jpg"
              alt=""
              class="w-14 sm:w-16 lg:w-18 h-20 sm:h-22 lg:h-26 object-cover rounded shadow-lg border border-white/10"
              referrerpolicy="no-referrer"
            />
          </div>
        </div>
      </div>

      <!-- ================================================================= -->
      <!-- SLIDES 1..N: DYNAMIC PROMOTIONAL BANNERS FROM DATABASE            -->
      <!-- ================================================================= -->
      <div
        v-for="(banner, index) in bannersList"
        :key="banner.id"
        class="absolute inset-0 transition-opacity duration-700 ease-in-out"
        :class="activeIndex === index + 1 ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'"
        :style="{ backgroundColor: banner.bg_color || '#052219' }"
      >
        <!-- Background Banner Image with Responsive Source -->
        <picture>
          <source
            v-if="banner.mobile_image_url"
            :srcset="banner.mobile_image_url"
            media="(max-width: 640px)"
          />
          <img
            :src="banner.image_url"
            :alt="banner.title"
            class="w-full h-full object-cover object-center brightness-75 scale-100 transition-transform duration-1000 ease-out"
            :class="{ 'scale-105': activeIndex === index + 1 }"
            loading="lazy"
            referrerpolicy="no-referrer"
          />
        </picture>

        <!-- Dark Contrast Overlay & Content -->
        <div class="absolute inset-0 z-10 flex items-center bg-gradient-to-r from-forest-950/95 via-forest-950/60 to-transparent">
          <div class="max-w-6xl mx-auto w-full px-6 sm:px-12 lg:px-16 space-y-4 text-left">
            <!-- Badge -->
            <div
              v-if="banner.badge"
              class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest-950/80 border border-gold-500/60 text-xs font-mono font-bold text-gold-300 shadow-sm"
            >
              <Sparkles :size="12" class="text-gold-400" />
              <span>{{ banner.badge }}</span>
            </div>

            <!-- Headline -->
            <h2 class="font-display text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight max-w-2xl drop-shadow-md">
              {{ banner.title }}
            </h2>

            <!-- Subtitle -->
            <p
              v-if="banner.subtitle"
              class="text-xs sm:text-sm lg:text-base text-white/80 max-w-lg leading-relaxed line-clamp-2"
            >
              {{ banner.subtitle }}
            </p>

            <!-- Action Button -->
            <div class="pt-2">
              <button
                type="button"
                class="bg-[#F05A36] hover:bg-[#D94827] text-white text-xs sm:text-sm font-bold uppercase tracking-wider px-6 py-3 rounded-full transition-all flex items-center gap-2 shadow-lg cursor-pointer active:scale-95"
                @click="handleBannerClick(banner)"
              >
                <span>{{ banner.cta_label || 'Explore' }}</span>
                <ArrowRight :size="15" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Navigation Arrows (Only rendered if > 1 slide) -->
      <div
        v-if="totalSlides > 1"
        class="absolute inset-y-0 inset-x-4 z-20 flex items-center justify-between pointer-events-none"
      >
        <button
          type="button"
          class="w-10 h-10 rounded-full bg-forest-950/70 hover:bg-forest-950 text-white flex items-center justify-center pointer-events-auto backdrop-blur-xs transition-all shadow-md active:scale-95 cursor-pointer"
          aria-label="Previous slide"
          @click="prevSlide"
        >
          <ChevronLeft :size="18" />
        </button>

        <button
          type="button"
          class="w-10 h-10 rounded-full bg-forest-950/70 hover:bg-forest-950 text-white flex items-center justify-center pointer-events-auto backdrop-blur-xs transition-all shadow-md active:scale-95 cursor-pointer"
          aria-label="Next slide"
          @click="nextSlide"
        >
          <ChevronRight :size="18" />
        </button>
      </div>

      <!-- Pagination Indicator Dots (Only rendered if > 1 slide) -->
      <div
        v-if="totalSlides > 1"
        class="absolute bottom-12 sm:bottom-14 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2"
      >
        <button
          v-for="(_, idx) in totalSlides"
          :key="idx"
          type="button"
          class="h-2 rounded-full transition-all duration-300 cursor-pointer"
          :class="idx === activeIndex ? 'w-6 bg-gold-500' : 'w-2 bg-white/40 hover:bg-white/70'"
          :aria-label="`Navigate to slide ${idx + 1}`"
          @click="goToSlide(idx)"
        />
      </div>
    </div>

    <!-- ================================================================= -->
    <!-- 50/50 OVERLAPPING FLOATING SEARCH PILL (Anchored on Every Slide)  -->
    <!-- ================================================================= -->
    <div class="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-full max-w-2xl px-4 z-30">
      <div class="bg-white rounded-full p-2 shadow-search-pill border border-black/5 flex items-center gap-1 sm:gap-2">
        <!-- Category Dropdown Selector -->
        <div ref="dropdownRef" class="relative flex-shrink-0">
          <button
            type="button"
            class="px-3.5 sm:px-4 py-2 text-xs font-semibold text-slate-800 flex items-center gap-1.5 border-r border-slate-200 cursor-pointer select-none"
            @click="isDropdownOpen = !isDropdownOpen"
          >
            <span class="max-w-[110px] sm:max-w-[130px] truncate">{{ selectedCategory }}</span>
            <ChevronDown
              :size="13"
              class="text-slate-500 transition-transform"
              :class="{ 'rotate-180': isDropdownOpen }"
            />
          </button>

          <!-- Dropdown List Menu -->
          <div
            v-if="isDropdownOpen"
            class="absolute top-full left-0 mt-2 w-52 max-h-64 overflow-y-auto bg-white border border-slate-200 rounded-2xl shadow-2xl py-2 z-50 text-left text-xs font-medium text-slate-800"
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

        <!-- Coral Pill Search Button -->
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