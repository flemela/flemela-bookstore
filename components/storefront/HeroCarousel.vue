<!-- components/storefront/HeroCarousel.vue -->
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { ChevronLeft, ChevronRight } from 'lucide-vue-next';
import type { PublicBanner } from '~/server/api/banners/index.get';

export interface CarouselSlide {
  id: string;
  coverImage: string;
  mobileImage?: string | null;
  ctaLink?: string;
  title?: string;
  isRemote?: boolean;
}

const emit = defineEmits<{
  search: [query: string, category?: string];
  selectCategory: [category: string];
  navigateFlashSale: [];
}>();

const { data: remoteBanners, status: bannersStatus } = await useFetch<PublicBanner[]>('/api/banners');

// Clean visual fallback banners
const defaultSlides: CarouselSlide[] = [
  {
    id: 'default-slide-1',
    coverImage: '/images/hero-cover.jpg',
    ctaLink: '#catalog-results',
    title: 'The Sunrise Bookstore Collection',
    isRemote: false,
  },
  {
    id: 'default-slide-2',
    coverImage: 'https://images.unsplash.com/photo-1507842229451-9f01079ca4b5?w=1600&auto=format&fit=crop&q=80',
    ctaLink: '#catalog-results',
    title: 'Curated Literature & Bestsellers',
    isRemote: false,
  },
  {
    id: 'default-slide-3',
    coverImage: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1600&auto=format&fit=crop&q=80',
    ctaLink: '#catalog-results',
    title: 'Instant Cloudflare R2 Digital Editions',
    isRemote: false,
  },
];

const activeSlides = computed<CarouselSlide[]>(() => {
  if (remoteBanners.value && remoteBanners.value.length > 0) {
    return remoteBanners.value.map((b) => ({
      id: b.id,
      coverImage: b.image_url,
      mobileImage: b.mobile_image_url || null,
      ctaLink: b.cta_link || '#catalog-results',
      title: b.title || 'Store Banner',
      isRemote: true,
    }));
  }
  return defaultSlides;
});

const totalSlides = computed(() => activeSlides.value.length);

const activeIndex = ref(0);
const isPaused = ref(false);
let autoplayTimer: ReturnType<typeof setInterval> | undefined;

const touchStartX = ref(0);
const currentTouchX = ref(0);
const isSwiping = ref(false);
const dragOffset = ref(0);

function startAutoplay(): void {
  stopAutoplay();
  if (totalSlides.value > 1 && !isPaused.value) {
    autoplayTimer = setInterval(() => {
      nextSlide();
    }, 5000);
  }
}

function stopAutoplay(): void {
  if (autoplayTimer) {
    clearInterval(autoplayTimer);
    autoplayTimer = undefined;
  }
}

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
    transition: 'transform 650ms cubic-bezier(0.22, 1, 0.36, 1)',
  };
});

function isExternalLink(link?: string | null): boolean {
  if (!link) return false;
  return link.startsWith('http://') || link.startsWith('https://');
}

function handleSlideClick(slide: CarouselSlide): void {
  if (!slide.ctaLink) return;
  if (slide.isRemote && remoteBanners.value) {
    $fetch(`/api/banners/${slide.id}/click`, { method: 'POST' }).catch(() => {});
  }

  if (slide.ctaLink.startsWith('http')) {
    window.open(slide.ctaLink, '_blank', 'noopener,noreferrer');
  } else if (slide.ctaLink.startsWith('#')) {
    const el = document.querySelector(slide.ctaLink);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  } else {
    navigateTo(slide.ctaLink);
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
    class="relative select-none bg-theme-dark text-white overflow-hidden w-full"
    aria-roledescription="carousel"
    aria-label="Promotions and Announcements"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @focusin="handleMouseEnter"
    @focusout="handleMouseLeave"
  >
    <!-- Shimmer Skeleton: Pre-locks aspect ratio to eliminate layout shift -->
    <div
      v-if="bannersStatus === 'pending'"
      class="w-full aspect-[16/9] sm:aspect-[21/9] md:aspect-[24/9] min-h-[220px] sm:min-h-[300px] md:min-h-[360px] max-h-[460px] bg-gradient-to-r from-forest-950 via-forest-900 to-forest-950 animate-pulse flex items-center justify-center"
    >
      <div class="flex items-center gap-2 text-white/30 font-mono text-xs uppercase tracking-widest">
        <span class="w-2 h-2 rounded-full bg-gold-400/50 animate-ping" />
        <span>Loading Announcements...</span>
      </div>
    </div>

    <!-- Loaded Carousel Viewport -->
    <div
      v-else
      class="relative w-full overflow-hidden aspect-[16/9] sm:aspect-[21/9] md:aspect-[24/9] min-h-[220px] sm:min-h-[300px] md:min-h-[360px] max-h-[460px]"
      @touchstart.passive="handleTouchStart"
      @touchmove.passive="handleTouchMove"
      @touchend="handleTouchEnd"
    >
      <div
        class="flex w-full h-full will-change-transform"
        :style="trackTransformStyle"
      >
        <div
          v-for="(slide, index) in activeSlides"
          :key="slide.id"
          class="w-full flex-shrink-0 relative h-full flex items-center justify-center"
          role="group"
          aria-roledescription="slide"
          :aria-label="`${index + 1} of ${totalSlides}`"
        >
          <component
            :is="slide.ctaLink ? 'a' : 'div'"
            :href="slide.ctaLink || undefined"
            :target="isExternalLink(slide.ctaLink) ? '_blank' : undefined"
            :rel="isExternalLink(slide.ctaLink) ? 'noopener noreferrer' : undefined"
            class="relative block w-full h-full overflow-hidden group cursor-pointer"
            @click="handleSlideClick(slide)"
          >
            <picture class="w-full h-full block">
              <source
                v-if="slide.mobileImage"
                :srcset="slide.mobileImage"
                media="(max-width: 640px)"
              />
              <img
                :src="slide.coverImage"
                :alt="slide.title || 'Store Banner'"
                class="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-[1.01]"
                loading="eager"
              />
            </picture>
          </component>
        </div>
      </div>

      <!-- Navigation Arrows -->
      <div
        v-if="totalSlides > 1"
        class="absolute inset-y-0 inset-x-3 sm:inset-x-5 z-20 flex items-center justify-between pointer-events-none"
      >
        <button
          type="button"
          class="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center pointer-events-auto backdrop-blur-xs transition-all shadow-md active:scale-90 cursor-pointer border border-white/20"
          aria-label="Previous banner"
          @click.stop="prevSlide"
        >
          <ChevronLeft :size="20" />
        </button>

        <button
          type="button"
          class="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center pointer-events-auto backdrop-blur-xs transition-all shadow-md active:scale-90 cursor-pointer border border-white/20"
          aria-label="Next banner"
          @click.stop="nextSlide"
        >
          <ChevronRight :size="20" />
        </button>
      </div>

      <!-- Pagination Indicators -->
      <div
        v-if="totalSlides > 1"
        class="absolute bottom-3.5 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-black/35 backdrop-blur-xs px-3 py-1.5 rounded-full border border-white/10 pointer-events-auto"
      >
        <button
          v-for="(_, idx) in totalSlides"
          :key="idx"
          type="button"
          class="h-1.5 rounded-full cursor-pointer transition-all duration-300"
          :class="idx === activeIndex ? 'w-6 bg-[#E8750D]' : 'w-2 bg-white/50 hover:bg-white/80'"
          :aria-label="`Navigate to slide ${idx + 1}`"
          @click.stop="goToSlide(idx)"
        />
      </div>
    </div>
  </section>
</template>