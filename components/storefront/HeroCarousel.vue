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
import HeroReference from '~/components/storefront/HeroReference.vue';
import type { PublicBanner } from '~/server/api/banners/index.get';

const emit = defineEmits<{
  search: [query: string, category: string];
  selectCategory: [category: string];
}>();

// 1. Fetch Active Promotional Banners via the Public Proxy
const { data: banners } = await useFetch<PublicBanner[]>('/api/banners');

const hasBanners = computed(() => Boolean(banners.value && banners.value.length > 0));
const slideCount = computed(() => (banners.value ? banners.value.length : 0));

// 2. Carousel Sliding & Autoplay State
const activeIndex = ref(0);
const isPaused = ref(false);
let autoplayTimer: ReturnType<typeof setInterval> | undefined;

// 3. Touch Gesture Swiping State
const touchStartX = ref(0);
const touchEndX = ref(0);

// 4. Search & Category Filter State
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
  if (slideCount.value <= 1) return;
  activeIndex.value = (activeIndex.value + 1) % slideCount.value;
  resetAutoplay();
}

function prevSlide(): void {
  if (slideCount.value <= 1) return;
  activeIndex.value = (activeIndex.value - 1 + slideCount.value) % slideCount.value;
  resetAutoplay();
}

function goToSlide(index: number): void {
  activeIndex.value = index;
  resetAutoplay();
}

function startAutoplay(): void {
  stopAutoplay();
  // Never run autoplay if only 1 slide exists or if user paused
  if (slideCount.value > 1 && !isPaused.value) {
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
  stopAutoplay();
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

// Touch Gestures (Mobile Swiping)
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
  // Fire-and-forget click analytics ping through the dedicated Nuxt proxy
  $fetch(`/api/banners/${banner.id}/click`, { method: 'POST' }).catch(() => {});

  if (!banner.cta_link) return;

  if (banner.cta_link.startsWith('http')) {
    window.open(banner.cta_link, '_blank', 'noopener,noreferrer');
  } else if (banner.cta_link.startsWith('#')) {
    const el = document.querySelector(banner.cta_link);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  } else {
    navigateTo(banner.cta_link);
  }
}

// Search Pill Actions
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
  <!-- Fallback: When zero banners are published or available, render default reference poster hero -->
  <HeroReference
    v-if="!hasBanners"
    @search="(q, cat) => emit('search', q, cat)"
    @select-category="(cat) => emit('selectCategory', cat)"
  />

  <!-- Active Carousel Hero Section -->
  <section
    v-else
    class="relative select-none bg-[#052219] text-white pb-14 sm:pb-16"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @touchstart="handleTouchStart"
    @touchend="handleTouchEnd"
  >
    <!-- Inner Container with Hidden Overflow for Slide Transitions -->
    <div class="relative w-full overflow-hidden aspect-[21/9] sm:aspect-[24/9] min-h-[420px] sm:min-h-[480px] lg:min-h-[520px]">
      <div
        v-for="(banner, index) in banners"
        :key="banner.id"
        class="absolute inset-0 transition-opacity duration-700 ease-in-out"
        :class="index === activeIndex ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'"
        :style="{ backgroundColor: banner.bg_color || '#052219' }"
      >
        <!-- Responsive Background Banner Image with CLS & LCP Optimizations -->
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
            :class="{ 'scale-105': index === activeIndex }"
            :loading="index === 0 ? 'eager' : 'lazy'"
            referrerpolicy="no-referrer"
          />
        </picture>

        <!-- Slide Overlay Content -->
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

            <!-- Supporting Subheadline -->
            <p
              v-if="banner.subtitle"
              class="text-xs sm:text-sm lg:text-base text-white/80 max-w-lg leading-relaxed line-clamp-2"
            >
              {{ banner.subtitle }}
            </p>

            <!-- CTA Button -->
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
        v-if="slideCount > 1"
        class="absolute inset-y-0 inset-x-4 z-20 flex items-center justify-between pointer-events-none"
      >
        <button
          type="button"
          class="w-10 h-10 rounded-full bg-forest-950/70 hover:bg-forest-950 text-white flex items-center justify-center pointer-events-auto backdrop-blur-xs transition-all shadow-md active:scale-95 cursor-pointer"
          aria-label="Previous promotional slide"
          @click="prevSlide"
        >
          <ChevronLeft :size="18" />
        </button>

        <button
          type="button"
          class="w-10 h-10 rounded-full bg-forest-950/70 hover:bg-forest-950 text-white flex items-center justify-center pointer-events-auto backdrop-blur-xs transition-all shadow-md active:scale-95 cursor-pointer"
          aria-label="Next promotional slide"
          @click="nextSlide"
        >
          <ChevronRight :size="18" />
        </button>
      </div>

      <!-- Pagination Indicators (Only rendered if > 1 slide) -->
      <div
        v-if="slideCount > 1"
        class="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2"
      >
        <button
          v-for="(_, idx) in banners"
          :key="idx"
          type="button"
          class="h-2 rounded-full transition-all duration-300 cursor-pointer"
          :class="idx === activeIndex ? 'w-6 bg-gold-500' : 'w-2 bg-white/40 hover:bg-white/70'"
          :aria-label="`Navigate to slide ${idx + 1}`"
          @click="goToSlide(idx)"
        />
      </div>
    </div>

    <!-- 50/50 OVERLAPPING FLOATING SEARCH PILL (Preserves Search on Carousel View) -->
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

        <!-- Coral Search Button -->
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