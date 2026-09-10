<!-- components/storefront/HeroCarousel.vue -->
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Sparkles,
} from 'lucide-vue-next';
import type { PublicBanner } from '~/server/api/banners/index.get';

// 1. Remote Promotional Banners
const { data: remoteBanners } = await useFetch<PublicBanner[]>('/api/banners');
const bannersList = computed(() => remoteBanners.value || []);
const totalSlides = computed(() => bannersList.value.length);

// 2. Carousel State Machine
const activeIndex = ref(0);
const isPaused = ref(false);
let autoplayTimer: ReturnType<typeof setInterval> | undefined;

// 3. Touch Gesture Support
const touchStartX = ref(0);
const currentTouchX = ref(0);
const isSwiping = ref(false);
const dragOffset = ref(0);

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

// Resets and resumes rotation after manual interaction
function resumeAutoplay(): void {
  stopAutoplay();
  if (totalSlides.value > 1 && !isPaused.value) {
    startAutoplay();
  }
}

function nextSlide(): void {
  if (totalSlides.value <= 1) return;
  activeIndex.value = (activeIndex.value + 1) % totalSlides.value;
  resumeAutoplay();
}

function prevSlide(): void {
  if (totalSlides.value <= 1) return;
  activeIndex.value = (activeIndex.value - 1 + totalSlides.value) % totalSlides.value;
  resumeAutoplay();
}

function goToSlide(index: number): void {
  if (index === activeIndex.value || totalSlides.value <= 1) return;
  activeIndex.value = index;
  resumeAutoplay();
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
  // Always safely resume autoplay after touch interaction completes
  resumeAutoplay();
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
      <!-- Fallback when no custom banners are configured yet -->
      <div
        v-if="totalSlides === 0"
        class="w-full h-full relative flex items-center justify-center bg-[#052219]"
      >
        <img
          src="/images/hero-cover.jpg"
          alt="The Sunrise Bookstore"
          class="w-full h-full object-cover brightness-75"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-6 sm:p-10">
          <div class="space-y-1">
            <span class="text-[10px] font-mono font-bold uppercase tracking-widest text-[#2EE59D]">
              Welcome to The Sunrise Bookstore
            </span>
            <h2 class="font-display text-xl sm:text-2xl font-bold text-white">
              Books that change the way you think.
            </h2>
          </div>
        </div>
      </div>

      <!-- Continuous Sliding Track (ONLY set banners rotate) -->
      <div
        v-else
        class="flex w-full h-full will-change-transform"
        :style="trackTransformStyle"
      >
        <div
          v-for="(banner, index) in bannersList"
          :key="banner.id"
          class="w-full flex-shrink-0 relative h-full flex items-center overflow-hidden"
          :class="{ 'cursor-pointer': Boolean(banner.cta_link) }"
          :style="{ backgroundColor: banner.bg_color || '#052219' }"
          role="group"
          aria-roledescription="slide"
          :aria-label="`${index + 1} of ${totalSlides}`"
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

      <!-- Navigation Arrows (Only shown when multiple custom banners exist) -->
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

      <!-- Pagination Dots (Only shown when multiple custom banners exist) -->
      <div
        v-if="totalSlides > 1"
        class="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5"
      >
        <button
          v-for="(_, idx) in totalSlides"
          :key="idx"
          type="button"
          class="h-1.5 rounded-full cursor-pointer transition-all duration-300"
          :class="idx === activeIndex ? 'w-6 bg-[#2EE59D]' : 'w-2 bg-white/40 hover:bg-white/70'"
          :aria-label="`Navigate to slide ${idx + 1}`"
          @click="goToSlide(idx)"
        />
      </div>
    </div>
  </section>
</template>