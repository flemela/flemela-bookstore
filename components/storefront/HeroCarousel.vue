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

export interface CarouselSlide {
  id: string;
  badge?: string;
  headlinePrefix?: string;
  headlineAccent?: string;
  subheadline: string;
  ctaLabel?: string;
  ctaLink?: string;
  coverImage: string;
  priceTag?: string;
  originalPrice?: string;
  discountBadge?: string;
  isRemote?: boolean;
}

// -----------------------------------------------------------------------------
// 1. Remote Banners + Built-in Flagship Default Slides
// -----------------------------------------------------------------------------
const { data: remoteBanners } = await useFetch<PublicBanner[]>('/api/banners');

// Curated default slides matching the reference visual guide
const defaultSlides: CarouselSlide[] = [
  {
    id: 'default-slide-1',
    badge: 'READ ANYTIME, ANYWHERE',
    headlinePrefix: 'Discover Your Next ',
    headlineAccent: 'Great Book',
    subheadline: 'Thousands of ebooks. Endless possibilities. Read, learn, and grow — all in one place.',
    ctaLabel: 'Browse Ebooks',
    ctaLink: '#catalog-results',
    coverImage: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&auto=format&fit=crop&q=80',
    priceTag: 'KSh 499',
    originalPrice: 'KSh 999',
    discountBadge: '50% OFF',
    isRemote: false,
  },
  {
    id: 'default-slide-2',
    badge: 'WEEKEND BESTSELLER',
    headlinePrefix: 'Build Habits That ',
    headlineAccent: 'Actually Stick',
    subheadline: 'Master the tiny changes that yield remarkable results. Instant PDF download directly to your device.',
    ctaLabel: 'Get Atomic Habits',
    ctaLink: '#catalog-results',
    coverImage: 'https://covers.openlibrary.org/b/isbn/9780735211292-L.jpg',
    priceTag: 'KSh 699',
    originalPrice: 'KSh 1,250',
    discountBadge: '44% OFF',
    isRemote: false,
  },
  {
    id: 'default-slide-3',
    badge: 'INSTANT CLOUDFLARE R2 ACCESS',
    headlinePrefix: 'Timeless Wisdom on ',
    headlineAccent: 'Money & Wealth',
    subheadline: 'Doing well with money isn’t necessarily about what you know. It’s about how you behave.',
    ctaLabel: 'Explore Finance',
    ctaLink: '#catalog-results',
    coverImage: 'https://covers.openlibrary.org/b/isbn/9780857197689-L.jpg',
    priceTag: 'KSh 649',
    originalPrice: 'KSh 1,150',
    discountBadge: 'HOT DEAL',
    isRemote: false,
  },
];

// If tenant uploaded custom banners in admin, use them; otherwise rotate curated defaults
const activeSlides = computed<CarouselSlide[]>(() => {
  if (remoteBanners.value && remoteBanners.value.length > 0) {
    return remoteBanners.value.map((b) => ({
      id: b.id,
      badge: b.badge || undefined,
      headlinePrefix: b.title || 'Discover Your Next ',
      headlineAccent: '',
      subheadline: b.subtitle || 'Instant digital downloads via Cloudflare R2.',
      ctaLabel: b.cta_label || 'Shop Now',
      ctaLink: b.cta_link || '#catalog-results',
      coverImage: b.image_url,
      isRemote: true,
    }));
  }
  return defaultSlides;
});

const totalSlides = computed(() => activeSlides.value.length);

// -----------------------------------------------------------------------------
// 2. Carousel State Machine & Looping Engine (PRESERVED 100%)
// -----------------------------------------------------------------------------
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
    }, 3000);
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

function handleSlideCtaClick(slide: CarouselSlide): void {
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
    class="relative select-none bg-theme-dark text-white overflow-hidden"
    aria-roledescription="carousel"
    aria-label="Ebook Highlights & Promotions"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <!-- Viewport Container with Fixed Explicit Responsive Height to Prevent Layout Collapse -->
    <div
      class="relative w-full overflow-hidden h-[440px] sm:h-[480px] lg:h-[500px]"
      @touchstart.passive="handleTouchStart"
      @touchmove.passive="handleTouchMove"
      @touchend="handleTouchEnd"
    >
      <!-- Continuous Sliding Track (Guaranteed to have slides) -->
      <div
        class="flex w-full h-full will-change-transform"
        :style="trackTransformStyle"
      >
        <div
          v-for="(slide, index) in activeSlides"
          :key="slide.id"
          class="w-full flex-shrink-0 relative h-full flex items-center px-6 sm:px-12 lg:px-16"
          role="group"
          aria-roledescription="slide"
          :aria-label="`${index + 1} of ${totalSlides}`"
        >
          <!-- Remote Banner Background Image (if custom banner) -->
          <div v-if="slide.isRemote" class="absolute inset-0 z-0">
            <img
              :src="slide.coverImage"
              alt="Promotional Banner"
              class="w-full h-full object-cover object-center"
              loading="lazy"
            />
            <div class="absolute inset-0 bg-gradient-to-r from-theme-dark via-theme-dark/80 to-transparent" />
          </div>

          <!-- Slide Content Grid matching Visual Guide -->
          <div class="max-w-7xl mx-auto w-full grid md:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
            
            <!-- Left Typography Column (7 cols) -->
            <div class="md:col-span-7 space-y-4 sm:space-y-6 text-left">
              <span
                v-if="slide.badge"
                class="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold tracking-widest text-theme-accent uppercase"
              >
                <Sparkles :size="12" />
                <span>{{ slide.badge }}</span>
              </span>

              <h2 class="font-sans font-extrabold text-4xl sm:text-5xl lg:text-6xl text-white leading-[1.08] tracking-tight">
                {{ slide.headlinePrefix }}
                <span class="text-theme-accent">{{ slide.headlineAccent }}</span>
              </h2>

              <p class="text-sm sm:text-base text-theme-dark-muted font-normal max-w-lg leading-relaxed">
                {{ slide.subheadline }}
              </p>

              <div class="pt-2">
                <button
                  type="button"
                  class="inline-flex items-center gap-2 bg-theme-accent hover:bg-theme-accent-hover active:bg-theme-accent-active text-white text-xs sm:text-sm font-bold uppercase tracking-wider px-6 py-3.5 rounded-lg shadow-md transition-all active:scale-95 cursor-pointer"
                  @click="handleSlideCtaClick(slide)"
                >
                  <span>{{ slide.ctaLabel || 'Browse Ebooks' }}</span>
                  <ArrowRight :size="15" />
                </button>
              </div>
            </div>

            <!-- Right Visual Column (5 cols) -->
            <div class="md:col-span-5 flex justify-center items-center relative">
              <!-- 3D Book Jacket Display -->
              <div class="relative w-48 sm:w-56 aspect-[1/1.45] rounded-md overflow-hidden book-cover-3d shadow-2xl z-10 border border-white/10">
                <img
                  :src="slide.coverImage"
                  alt="Featured Ebook Cover"
                  class="w-full h-full object-cover"
                />
              </div>

              <!-- Red Circular Price Badge (Visual Reference) -->
              <div
                v-if="slide.priceTag"
                class="absolute -top-3 right-4 sm:right-8 z-20 w-20 h-20 sm:w-22 sm:h-22 rounded-full bg-theme-accent text-white flex flex-col items-center justify-center shadow-lg transform rotate-6 border-2 border-white select-none"
              >
                <span class="font-mono text-xs sm:text-sm font-black leading-tight">{{ slide.priceTag }}</span>
                <span v-if="slide.originalPrice" class="font-mono text-[9px] line-through text-white/75">{{ slide.originalPrice }}</span>
                <span v-if="slide.discountBadge" class="text-[8px] font-mono font-black uppercase bg-black/25 px-1 rounded mt-0.5">{{ slide.discountBadge }}</span>
              </div>
            </div>

          </div>
        </div>
      </div>

      <!-- Navigation Arrows (Active on all viewports) -->
      <div
        v-if="totalSlides > 1"
        class="absolute inset-y-0 inset-x-3 sm:inset-x-5 z-20 flex items-center justify-between pointer-events-none"
      >
        <button
          type="button"
          class="w-10 h-10 rounded-full bg-theme-dark/80 hover:bg-theme-dark text-white flex items-center justify-center pointer-events-auto backdrop-blur-xs transition-all shadow-xs active:scale-90 cursor-pointer border border-white/10"
          aria-label="Previous slide"
          @click="prevSlide"
        >
          <ChevronLeft :size="18" />
        </button>

        <button
          type="button"
          class="w-10 h-10 rounded-full bg-theme-dark/80 hover:bg-theme-dark text-white flex items-center justify-center pointer-events-auto backdrop-blur-xs transition-all shadow-xs active:scale-90 cursor-pointer border border-white/10"
          aria-label="Next slide"
          @click="nextSlide"
        >
          <ChevronRight :size="18" />
        </button>
      </div>

      <!-- Pagination Dots -->
      <div
        v-if="totalSlides > 1"
        class="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2"
      >
        <button
          v-for="(_, idx) in totalSlides"
          :key="idx"
          type="button"
          class="h-1.5 rounded-full cursor-pointer transition-all duration-300"
          :class="idx === activeIndex ? 'w-6 bg-theme-accent' : 'w-2 bg-white/40 hover:bg-white/70'"
          :aria-label="`Navigate to slide ${idx + 1}`"
          @click="goToSlide(idx)"
        />
      </div>
    </div>
  </section>
</template>