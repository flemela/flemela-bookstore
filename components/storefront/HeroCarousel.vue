<!-- components/storefront/HeroCarousel.vue -->
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Sparkles,
} from 'lucide-vue-next';
import ReaderHeroIllustration from '~/components/illustrations/ReaderHeroIllustration.vue';
import type { PublicBanner } from '~/server/api/banners/index.get';

const emit = defineEmits<{
  search: [query: string, category?: string];
  selectCategory: [category: string];
  navigateFlashSale: [];
}>();

// 1. Remote Promotional Banners
const { data: remoteBanners } = await useFetch<PublicBanner[]>('/api/banners');
const bannersList = computed(() => remoteBanners.value || []);
const totalSlides = computed(() => 1 + bannersList.value.length);

// 2. Carousel State Machine
const activeIndex = ref(0);
const isPaused = ref(false);
let autoplayTimer: ReturnType<typeof setInterval> | undefined;

// 3. Touch Gesture Support
const touchStartX = ref(0);
const currentTouchX = ref(0);
const isSwiping = ref(false);
const dragOffset = ref(0);

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
  const threshold = 50;
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
    transition: 'transform 600ms cubic-bezier(0.22, 1, 0.36, 1)',
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

onMounted(() => {
  if (process.client && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    startAutoplay();
  }
});

onUnmounted(() => {
  stopAutoplay();
});
</script>

<template>
  <section
    class="relative select-none bg-[#052219] text-white overflow-hidden"
    aria-roledescription="carousel"
    aria-label="Bookstore Highlights & Promotions"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <!-- Viewport with Responsive Aspect Ratios: ~1.65:1 on Mobile, ~4:1 on Desktop -->
    <div
      class="relative w-full overflow-hidden h-[225px] sm:h-[270px] lg:h-[315px]"
      @touchstart.passive="handleTouchStart"
      @touchmove.passive="handleTouchMove"
      @touchend="handleTouchEnd"
    >
      <!-- Continuous Sliding Track -->
      <div
        class="flex w-full h-full will-change-transform"
        :style="trackTransformStyle"
      >
        <!-- =============================================================== -->
        <!-- SLIDE 0: COMPACT PROPORTIONAL BRAND HERO BANNER                 -->
        <!-- =============================================================== -->
        <div
          class="w-full flex-shrink-0 relative h-full flex items-center justify-center bg-[#052219] px-4"
          role="group"
          aria-roledescription="slide"
          aria-label="1 of {{ totalSlides }}"
        >
          <!-- Left Subtle Book Accents (Scaled down so they do not clip) -->
          <div class="absolute left-3 sm:left-6 lg:left-12 top-0 bottom-0 hidden md:flex items-center gap-2 pointer-events-none opacity-40">
            <div class="flex flex-col gap-2 -translate-y-3">
              <img
                src="https://books.google.com/books/content?id=s_4dDAAAQBAJ&printsec=frontcover&img=1&zoom=1"
                alt=""
                class="w-10 sm:w-12 lg:w-13 h-14 sm:h-17 lg:h-19 object-cover rounded shadow-md border border-white/10"
                referrerpolicy="no-referrer"
              />
              <img
                src="https://books.google.com/books/content?id=1myBAgAAQBAJ&printsec=frontcover&img=1&zoom=1"
                alt=""
                class="w-10 sm:w-12 lg:w-13 h-14 sm:h-17 lg:h-19 object-cover rounded shadow-md border border-white/10"
                referrerpolicy="no-referrer"
              />
            </div>
          </div>

          <!-- Center Content: Scaled Proportional Composition -->
          <div class="relative z-10 max-w-2xl mx-auto text-center space-y-1 sm:space-y-1.5 py-2">
            <div class="relative inline-block">
              <!-- Flame Doodle -->
              <svg
                class="absolute -top-5 sm:-top-6 left-8 sm:left-12 w-4 sm:w-5 h-6 text-[#FF5722] pointer-events-none"
                viewBox="0 0 24 32"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 0C12 0 16 6 16 11C16 13.5 14.5 15.5 12 16C9.5 15.5 8 13.5 8 11C8 6 12 0 12 0ZM12 18C16.5 18 20 21.5 20 26C20 29.5 16.5 32 12 32C7.5 32 4 29.5 4 26C4 21.5 7.5 18 12 18Z" />
              </svg>

              <!-- Asterisk Doodle -->
              <svg
                class="absolute -top-2 right-6 sm:right-10 w-4 sm:w-5 h-4 sm:h-5 text-[#FFB300] pointer-events-none"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 0L14 8L22 6L16 12L22 18L14 16L12 24L10 16L2 18L8 12L2 6L10 8L12 0Z" />
              </svg>

              <!-- Scaled Headline (~45px Desktop, ~26px Mobile) -->
              <h1 class="font-poster text-2xl sm:text-4xl lg:text-[44px] leading-[0.96] tracking-wide uppercase text-white drop-shadow-xs">
                THE NEXT <br />
                <span class="text-[#2EE59D]">CHAPTER</span> IN <span class="text-[#FF8A00]">YOUR</span> <br />
                READING 
                <ReaderHeroIllustration class="inline-block w-6 h-6 sm:w-8 sm:h-8 align-middle -translate-y-0.5" />
                JOURNEY
              </h1>

              <!-- Star Doodle -->
              <svg
                class="absolute -bottom-1 left-4 sm:left-8 w-3.5 sm:w-4.5 h-3.5 sm:h-4.5 text-[#FFB300] pointer-events-none"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
              </svg>

              <!-- Sparkle Doodle -->
              <svg
                class="absolute top-1/2 -right-3 sm:-right-6 w-3.5 sm:w-4.5 h-3.5 sm:h-4.5 text-[#2EE59D] pointer-events-none"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
              </svg>
            </div>

            <!-- Concise Subtitle -->
            <p class="text-[11px] sm:text-xs text-[#8FA89B] max-w-sm sm:max-w-md mx-auto leading-normal font-sans line-clamp-1 sm:line-clamp-2">
              Browse handpicked literature, mind-shifting philosophy, and business bestsellers.
            </p>

            <!-- Compact Direct CTA -->
            <div class="pt-1 sm:pt-1.5">
              <button
                type="button"
                class="inline-flex items-center gap-1.5 bg-[#F05A36] hover:bg-[#D94827] text-white font-sans font-bold text-[10px] sm:text-[11px] uppercase tracking-wider px-4 sm:px-5 py-1.5 sm:py-2 rounded-full transition-all shadow-md active:scale-95 cursor-pointer"
                @click="emit('navigateFlashSale')"
              >
                <span>Shop Flash Sale</span>
                <ArrowRight :size="12" />
              </button>
            </div>
          </div>

          <!-- Right Subtle Book Accents -->
          <div class="absolute right-3 sm:right-6 lg:right-12 top-0 bottom-0 hidden md:flex items-center gap-2 pointer-events-none opacity-40">
            <div class="flex flex-col gap-2 translate-y-3">
              <img
                src="https://books.google.com/books/content?id=fFCjDQAAQBAJ&printsec=frontcover&img=1&zoom=1"
                alt=""
                class="w-10 sm:w-12 lg:w-13 h-14 sm:h-17 lg:h-19 object-cover rounded shadow-md border border-white/10"
                referrerpolicy="no-referrer"
              />
              <img
                src="https://books.google.com/books/content?id=Yw32DwAAQBAJ&printsec=frontcover&img=1&zoom=1"
                alt=""
                class="w-10 sm:w-12 lg:w-13 h-14 sm:h-17 lg:h-19 object-cover rounded shadow-md border border-white/10"
                referrerpolicy="no-referrer"
              />
            </div>
          </div>
        </div>

        <!-- =============================================================== -->
        <!-- SLIDES 1..N: PROMOTIONAL SLIDES (WIDE COMMERCE BANNERS)          -->
        <!-- =============================================================== -->
        <div
          v-for="(banner, index) in bannersList"
          :key="banner.id"
          class="w-full flex-shrink-0 relative h-full flex items-center overflow-hidden"
          :class="{ 'cursor-pointer': Boolean(banner.cta_link) }"
          :style="{ backgroundColor: banner.bg_color || '#052219' }"
          role="group"
          aria-roledescription="slide"
          :aria-label="`${index + 2} of ${totalSlides}`"
          @click="handleBannerClick(banner)"
        >
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

          <!-- Optional Typography Overlay -->
          <div
            v-if="banner.title || banner.subtitle || banner.badge || banner.cta_label"
            class="absolute inset-0 z-10 flex items-center pointer-events-none px-6 sm:px-12"
          >
            <div class="max-w-xl space-y-2 pointer-events-auto">
              <div
                v-if="banner.badge"
                class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#052219]/90 border border-gold-400 text-[10px] font-mono font-bold text-gold-300 shadow-xs"
              >
                <Sparkles :size="10" class="text-gold-400" />
                <span>{{ banner.badge }}</span>
              </div>

              <h2
                v-if="banner.title"
                class="font-display text-xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
              >
                {{ banner.title }}
              </h2>

              <p
                v-if="banner.subtitle"
                class="text-[11px] sm:text-xs text-white/90 font-medium line-clamp-2 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]"
              >
                {{ banner.subtitle }}
              </p>

              <div v-if="banner.cta_label" class="pt-1">
                <button
                  type="button"
                  class="bg-[#F05A36] hover:bg-[#D94827] text-white text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-4 py-1.5 rounded-full transition-all flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
                  @click.stop="handleBannerClick(banner)"
                >
                  <span>{{ banner.cta_label }}</span>
                  <ArrowRight :size="12" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Navigation Arrows -->
      <div
        v-if="totalSlides > 1"
        class="absolute inset-y-0 inset-x-2 sm:inset-x-4 z-20 flex items-center justify-between pointer-events-none"
      >
        <button
          type="button"
          class="w-8 h-8 rounded-full bg-[#052219]/70 hover:bg-[#052219] text-white flex items-center justify-center pointer-events-auto backdrop-blur-xs transition-all shadow-xs active:scale-90 cursor-pointer border border-white/10"
          aria-label="Previous slide"
          @click="prevSlide"
        >
          <ChevronLeft :size="16" />
        </button>

        <button
          type="button"
          class="w-8 h-8 rounded-full bg-[#052219]/70 hover:bg-[#052219] text-white flex items-center justify-center pointer-events-auto backdrop-blur-xs transition-all shadow-xs active:scale-90 cursor-pointer border border-white/10"
          aria-label="Next slide"
          @click="nextSlide"
        >
          <ChevronRight :size="16" />
        </button>
      </div>

      <!-- Pagination Dots -->
      <div
        v-if="totalSlides > 1"
        class="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5"
      >
        <button
          v-for="(_, idx) in totalSlides"
          :key="idx"
          type="button"
          class="h-1.5 rounded-full cursor-pointer transition-all duration-300"
          :class="idx === activeIndex ? 'w-6 bg-gold-400' : 'w-2 bg-white/40 hover:bg-white/70'"
          :aria-label="`Navigate to slide ${idx + 1}`"
          @click="goToSlide(idx)"
        />
      </div>
    </div>
  </section>
</template>