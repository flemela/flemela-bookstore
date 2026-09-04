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

// 1. Remote Promotional Banners
const { data: remoteBanners } = await useFetch<PublicBanner[]>('/api/banners');

const bannersList = computed(() => remoteBanners.value || []);
// Slide 0 is the permanent brand hero poster. Total = 1 + remote banners.
const totalSlides = computed(() => 1 + bannersList.value.length);

// 2. State Machine
const activeIndex = ref(0);
const isPaused = ref(false);
let autoplayTimer: ReturnType<typeof setInterval> | undefined;

// 3. Touch Gesture Physics
const touchStartX = ref(0);
const currentTouchX = ref(0);
const isSwiping = ref(false);
const dragOffset = ref(0);

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

// Navigation Actions
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
  if (index === activeIndex.value) return;
  activeIndex.value = index;
  resetAutoplay();
}

// 5. Autoplay Engine
function startAutoplay(): void {
  stopAutoplay();
  if (totalSlides.value > 1 && !isPaused.value) {
    autoplayTimer = setInterval(() => {
      nextSlide();
    }, 6000);
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

// Touch Event Handlers
function handleTouchStart(e: TouchEvent): void {
  if (totalSlides.value <= 1) return;
  touchStartX.value = e.touches[0].clientX;
  currentTouchX.value = e.touches[0].clientX;
  isSwiping.value = true;
  dragOffset.value = 0;
  stopAutoplay();
}

function handleTouchMove(e: TouchEvent): void {
  if (!isSwiping.value) return;
  currentTouchX.value = e.touches[0].clientX;
  const diff = currentTouchX.value - touchStartX.value;

  if ((activeIndex.value === 0 && diff > 0) || (activeIndex.value === totalSlides.value - 1 && diff < 0)) {
    dragOffset.value = diff * 0.35;
  } else {
    dragOffset.value = diff;
  }
}

function handleTouchEnd(): void {
  if (!isSwiping.value) return;
  isSwiping.value = false;

  const threshold = 55;
  if (dragOffset.value < -threshold) {
    nextSlide();
  } else if (dragOffset.value > threshold) {
    prevSlide();
  }

  dragOffset.value = 0;
  startAutoplay();
}

const trackTransformStyle = computed(() => {
  if (isSwiping.value) {
    return {
      transform: `translate3d(calc(-${activeIndex.value * 100}% + ${dragOffset.value}px), 0, 0)`,
      transition: 'none',
    };
  }
  return {
    transform: `translate3d(-${activeIndex.value * 100}%, 0, 0)`,
    transition: 'transform 750ms cubic-bezier(0.22, 1, 0.36, 1)',
  };
});

async function handleBannerClick(banner: PublicBanner): Promise<void> {
  if (!banner.cta_link) return;

  $fetch(`/api/banners/${banner.id}/click`, { method: 'POST' }).catch(() => {});

  if (banner.cta_link.startsWith('http')) {
    window.open(banner.cta_link, '_blank', 'noopener,noreferrer');
  } else if (banner.cta_link.startsWith('#')) {
    const el = document.querySelector(banner.cta_link);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  } else {
    navigateTo(banner.cta_link);
  }
}

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
    class="relative select-none bg-[#052219] text-white pb-20 sm:pb-24 overflow-visible"
    aria-roledescription="carousel"
    aria-label="Bookstore Highlights & Promotions"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <!-- Slide Viewport -->
    <div
      class="relative w-full overflow-hidden min-h-[480px] sm:min-h-[520px] lg:min-h-[560px]"
      @touchstart.passive="handleTouchStart"
      @touchmove.passive="handleTouchMove"
      @touchend="handleTouchEnd"
    >
      <!-- Continuous Horizontal Sliding Flex Track -->
      <div
        class="flex w-full h-full will-change-transform"
        :style="trackTransformStyle"
      >
        <!-- =============================================================== -->
        <!-- SLIDE 0: PERMANENT BRAND HERO POSTER                            -->
        <!-- =============================================================== -->
        <div
          class="w-full flex-shrink-0 relative min-h-[480px] sm:min-h-[520px] lg:min-h-[560px] flex items-center justify-center bg-[#052219]"
          role="group"
          aria-roledescription="slide"
          aria-label="1 of {{ totalSlides }}"
        >
          <!-- LEFT 4-BOOK STACK -->
          <div class="absolute left-2 sm:left-4 lg:left-8 top-0 bottom-0 hidden md:flex gap-2.5 lg:gap-3 pointer-events-none hero-faded-stack">
            <div class="flex flex-col gap-2.5 -translate-y-6">
              <img
                src="https://books.google.com/books/content?id=s_4dDAAAQBAJ&printsec=frontcover&img=1&zoom=1"
                alt=""
                class="w-14 sm:w-16 lg:w-18 h-20 sm:h-22 lg:h-26 object-cover rounded shadow-lg border border-white/10"
                referrerpolicy="no-referrer"
              />
              <img
                src="https://books.google.com/books/content?id=1myBAgAAQBAJ&printsec=frontcover&img=1&zoom=1"
                alt=""
                class="w-14 sm:w-16 lg:w-18 h-20 sm:h-22 lg:h-26 object-cover rounded shadow-lg border border-white/10"
                referrerpolicy="no-referrer"
              />
            </div>
            <div class="flex flex-col gap-2.5 translate-y-5">
              <img
                src="https://books.google.com/books/content?id=kotPYEqCoach&printsec=frontcover&img=1&zoom=1"
                alt=""
                class="w-14 sm:w-16 lg:w-18 h-20 sm:h-22 lg:h-26 object-cover rounded shadow-lg border border-white/10"
                referrerpolicy="no-referrer"
              />
              <img
                src="https://books.google.com/books/content?id=FzVjBgAAQBAJ&printsec=frontcover&img=1&zoom=1"
                alt=""
                class="w-14 sm:w-16 lg:w-18 h-20 sm:h-22 lg:h-26 object-cover rounded shadow-lg border border-white/10"
                referrerpolicy="no-referrer"
              />
            </div>
          </div>

          <!-- CENTER HERO POSTER TYPOGRAPHY & DOODLES -->
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

            <!-- Subtitle -->
            <p class="text-xs sm:text-sm text-[#8FA89B] max-w-lg mx-auto leading-relaxed font-sans pt-3">
              Browse a curated collection of page-turners, slow burns, and life-changing reads crafted to match your unique taste.
            </p>
          </div>

          <!-- RIGHT 4-BOOK STACK -->
          <div class="absolute right-2 sm:right-4 lg:right-8 top-0 bottom-0 hidden md:flex gap-2.5 lg:gap-3 pointer-events-none hero-faded-stack">
            <div class="flex flex-col gap-2.5 translate-y-5">
              <img
                src="https://books.google.com/books/content?id=fFCjDQAAQBAJ&printsec=frontcover&img=1&zoom=1"
                alt=""
                class="w-14 sm:w-16 lg:w-18 h-20 sm:h-22 lg:h-26 object-cover rounded shadow-lg border border-white/10"
                referrerpolicy="no-referrer"
              />
              <img
                src="https://books.google.com/books/content?id=Yw32DwAAQBAJ&printsec=frontcover&img=1&zoom=1"
                alt=""
                class="w-14 sm:w-16 lg:w-18 h-20 sm:h-22 lg:h-26 object-cover rounded shadow-lg border border-white/10"
                referrerpolicy="no-referrer"
              />
            </div>
            <div class="flex flex-col gap-2.5 -translate-y-6">
              <img
                src="https://books.google.com/books/content?id=Wp48CwAAQBAJ&printsec=frontcover&img=1&zoom=1"
                alt=""
                class="w-14 sm:w-16 lg:w-18 h-20 sm:h-22 lg:h-26 object-cover rounded shadow-lg border border-white/10"
                referrerpolicy="no-referrer"
              />
              <img
                src="https://books.google.com/books/content?id=P_zMW3EHnTEC&printsec=frontcover&img=1&zoom=1"
                alt=""
                class="w-14 sm:w-16 lg:w-18 h-20 sm:h-22 lg:h-26 object-cover rounded shadow-lg border border-white/10"
                referrerpolicy="no-referrer"
              />
            </div>
          </div>
        </div>

        <!-- =============================================================== -->
        <!-- SLIDES 1..N: FULL-QUALITY BANNERS (NO OVERLAY / NO DIMMING)     -->
        <!-- =============================================================== -->
        <div
          v-for="(banner, index) in bannersList"
          :key="banner.id"
          class="w-full flex-shrink-0 relative min-h-[480px] sm:min-h-[520px] lg:min-h-[560px] flex items-center overflow-hidden"
          :class="{ 'cursor-pointer': Boolean(banner.cta_link) }"
          :style="{ backgroundColor: banner.bg_color || '#052219' }"
          role="group"
          aria-roledescription="slide"
          :aria-label="`${index + 2} of ${totalSlides}`"
          @click="handleBannerClick(banner)"
        >
          <!-- 100% Full-Color Pure Photo (No brightness dimming) -->
          <picture class="absolute inset-0 w-full h-full">
            <source
              v-if="banner.mobile_image_url"
              :srcset="banner.mobile_image_url"
              media="(max-width: 640px)"
            />
            <img
              :src="banner.image_url"
              :alt="banner.title || 'Promotional Banner'"
              class="w-full h-full object-cover object-center scale-100"
              loading="lazy"
              referrerpolicy="no-referrer"
            />
          </picture>

          <!-- Optional Typography (Only rendered if admin provided text/button) -->
          <div
            v-if="banner.title || banner.subtitle || banner.badge || banner.cta_label"
            class="absolute inset-0 z-10 flex items-center pointer-events-none"
          >
            <div class="max-w-6xl mx-auto w-full px-6 sm:px-12 lg:px-20 space-y-4 text-left pointer-events-auto">
              
              <!-- Optional Badge -->
              <div
                v-if="banner.badge"
                class="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#052219]/90 border border-gold-400 text-xs font-mono font-bold text-gold-300 shadow-md backdrop-blur-xs"
              >
                <Sparkles :size="12" class="text-gold-400" />
                <span>{{ banner.badge }}</span>
              </div>

              <!-- Optional Title -->
              <h2
                v-if="banner.title"
                class="font-display text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight max-w-2xl drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]"
              >
                {{ banner.title }}
              </h2>

              <!-- Optional Subtitle -->
              <p
                v-if="banner.subtitle"
                class="text-xs sm:text-sm lg:text-base text-white font-medium max-w-lg leading-relaxed line-clamp-2 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
              >
                {{ banner.subtitle }}
              </p>

              <!-- Optional Button -->
              <div v-if="banner.cta_label" class="pt-2">
                <button
                  type="button"
                  class="bg-[#F05A36] hover:bg-[#D94827] text-white text-xs sm:text-sm font-bold uppercase tracking-wider px-7 py-3.5 rounded-full transition-all flex items-center gap-2 shadow-xl cursor-pointer active:scale-95"
                  @click.stop="handleBannerClick(banner)"
                >
                  <span>{{ banner.cta_label }}</span>
                  <ArrowRight :size="16" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Navigation Arrows (Only when > 1 slide) -->
      <div
        v-if="totalSlides > 1"
        class="absolute inset-y-0 inset-x-4 sm:inset-x-8 z-20 flex items-center justify-between pointer-events-none"
      >
        <button
          type="button"
          class="w-11 h-11 rounded-full bg-[#052219]/70 hover:bg-[#052219] text-white flex items-center justify-center pointer-events-auto backdrop-blur-md transition-all shadow-md active:scale-90 cursor-pointer border border-white/10"
          aria-label="Previous slide"
          @click="prevSlide"
        >
          <ChevronLeft :size="20" />
        </button>

        <button
          type="button"
          class="w-11 h-11 rounded-full bg-[#052219]/70 hover:bg-[#052219] text-white flex items-center justify-center pointer-events-auto backdrop-blur-md transition-all shadow-md active:scale-90 cursor-pointer border border-white/10"
          aria-label="Next slide"
          @click="nextSlide"
        >
          <ChevronRight :size="20" />
        </button>
      </div>

      <!-- Fluid Morphing Pagination Dots -->
      <div
        v-if="totalSlides > 1"
        class="absolute bottom-12 sm:bottom-14 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2"
      >
        <button
          v-for="(_, idx) in totalSlides"
          :key="idx"
          type="button"
          class="h-2 rounded-full cursor-pointer transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
          :class="idx === activeIndex ? 'w-8 bg-gold-400 shadow-sm' : 'w-2.5 bg-white/40 hover:bg-white/70 shadow-xs'"
          :aria-label="`Navigate to slide ${idx + 1}`"
          @click="goToSlide(idx)"
        />
      </div>
    </div>

    <!-- =============================================================== -->
    <!-- 50/50 OVERLAPPING FLOATING SEARCH PILL                          -->
    <!-- =============================================================== -->
    <div class="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-full max-w-2xl px-4 z-30">
      <div class="bg-white rounded-full p-2 shadow-search-pill border border-black/5 flex items-center gap-1 sm:gap-2">
        <!-- Category Dropdown -->
        <div ref="dropdownRef" class="relative flex-shrink-0">
          <button
            type="button"
            class="px-3.5 sm:px-4 py-2 text-xs font-semibold text-slate-800 flex items-center gap-1.5 border-r border-slate-200 cursor-pointer select-none"
            @click="isDropdownOpen = !isDropdownOpen"
          >
            <span class="max-w-[110px] sm:max-w-[130px] truncate">{{ selectedCategory }}</span>
            <ChevronDown
              :size="13"
              class="text-slate-500 transition-transform duration-300"
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

        <!-- Search Input -->
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search 1 million books by title, author or ISBN"
          class="flex-1 bg-transparent px-3 text-xs sm:text-sm text-slate-800 outline-none placeholder:text-slate-400 font-sans"
          @keyup.enter="handleSearch"
        />

        <!-- Coral Submit Button -->
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