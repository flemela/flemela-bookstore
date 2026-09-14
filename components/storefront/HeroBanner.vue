<!-- =============================================================================
     flemela/components/storefront/HeroBanner.vue
     Hero Carousel: 6000ms Autoplay, Clean Banner Artwork (No Forced Overlays)
     ============================================================================= -->

<template>
  <section
    v-if="banners && banners.length > 0"
    class="relative w-full overflow-hidden bg-forest-950 font-sans select-none"
    aria-label="Promotional Carousel"
    @mouseenter="pauseAutoplay"
    @mouseleave="resumeAutoplay"
    @focusin="pauseAutoplay"
    @focusout="resumeAutoplay"
  >
    <!-- Slides Container -->
    <div class="relative w-full aspect-[16/9] sm:aspect-[21/9] md:aspect-[24/9] min-h-[260px] sm:min-h-[340px] md:min-h-[420px]">
      <div
        v-for="(banner, index) in banners"
        :key="banner.id || index"
        :class="[
          'absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out',
          currentIndex === index
            ? 'opacity-100 z-10 pointer-events-auto'
            : 'opacity-0 z-0 pointer-events-none'
        ]"
      >
        <!-- Clickable Link Wrapper (if cta_link exists) -->
        <component
          :is="banner.cta_link ? 'a' : 'div'"
          :href="banner.cta_link || undefined"
          :target="isExternalLink(banner.cta_link) ? '_blank' : undefined"
          :rel="isExternalLink(banner.cta_link) ? 'noopener noreferrer' : undefined"
          class="relative block w-full h-full overflow-hidden group"
          @click="trackClick(banner.id)"
        >
          <!-- 1. Pure Visual Banner Artwork (Responsive Desktop & Mobile) -->
          <picture class="w-full h-full block">
            <source
              v-if="banner.mobile_image_url"
              :srcset="banner.mobile_image_url"
              media="(max-width: 640px)"
            />
            <img
              :src="banner.image_url"
              :alt="banner.title || 'Store promotion banner'"
              class="w-full h-full object-cover object-center transform transition-transform duration-1000 group-hover:scale-[1.01]"
              loading="eager"
            />
          </picture>

          <!-- 2. Conditional Text Overlay ONLY if Title/Subtitle Explicitly Exists -->
          <!-- NO DEFAULT FALLBACK TEXT — Clean artwork is preserved by default -->
          <div
            v-if="hasAuthoredText(banner)"
            class="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-black/80 via-black/40 to-transparent flex items-end sm:items-center p-6 sm:p-12 md:p-16"
          >
            <div class="max-w-xl text-white space-y-3 sm:space-y-4">
              <!-- Optional Authored Badge -->
              <span
                v-if="banner.badge && banner.badge.trim()"
                class="inline-block px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider bg-gold-500 text-forest-950 rounded shadow-sm"
              >
                {{ banner.badge.trim() }}
              </span>

              <!-- Optional Authored Title -->
              <h2
                v-if="banner.title && banner.title.trim()"
                class="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight drop-shadow-sm"
              >
                {{ banner.title.trim() }}
              </h2>

              <!-- Optional Authored Subtitle -->
              <p
                v-if="banner.subtitle && banner.subtitle.trim()"
                class="text-xs sm:text-base text-gray-200 line-clamp-2 sm:line-clamp-3 leading-relaxed drop-shadow-sm"
              >
                {{ banner.subtitle.trim() }}
              </p>

              <!-- Optional Authored CTA Button -->
              <div v-if="banner.cta_label && banner.cta_label.trim()" class="pt-1">
                <span
                  class="inline-flex items-center space-x-2 px-5 py-2.5 rounded-lg text-xs sm:text-sm font-bold bg-white text-forest-950 group-hover:bg-gold-500 transition-colors shadow-md"
                >
                  <span>{{ banner.cta_label.trim() }}</span>
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </span>
              </div>
            </div>
          </div>
        </component>
      </div>
    </div>

    <!-- Navigation Controls (Only show if multiple slides exist) -->
    <template v-if="banners.length > 1">
      <!-- Previous Arrow -->
      <button
        type="button"
        aria-label="Previous Slide"
        class="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/30 hover:bg-black/60 text-white backdrop-blur-sm border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 sm:opacity-80 hover:opacity-100 transition-all focus:opacity-100"
        @click.stop="prevSlide"
      >
        <svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <!-- Next Arrow -->
      <button
        type="button"
        aria-label="Next Slide"
        class="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/30 hover:bg-black/60 text-white backdrop-blur-sm border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 sm:opacity-80 hover:opacity-100 transition-all focus:opacity-100"
        @click.stop="nextSlide"
      >
        <svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <!-- Bottom Pagination Indicators -->
      <div class="absolute bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center space-x-2 bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
        <button
          v-for="(_, dotIdx) in banners"
          :key="dotIdx"
          type="button"
          :aria-label="`Go to slide ${dotIdx + 1}`"
          :class="[
            'h-2 rounded-full transition-all duration-300',
            currentIndex === dotIdx
              ? 'w-6 bg-gold-500'
              : 'w-2 bg-white/50 hover:bg-white/80'
          ]"
          @click.stop="goToSlide(dotIdx)"
        ></button>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { ofetch } from 'ofetch';

export interface BannerItem {
  id?: string;
  title?: string | null;
  subtitle?: string | null;
  badge?: string | null;
  image_url: string;
  mobile_image_url?: string | null;
  cta_label?: string | null;
  cta_link?: string | null;
  bg_color?: string;
  is_active?: boolean;
}

const props = withDefaults(
  defineProps<{
    storeSlug?: string;
    initialBanners?: BannerItem[];
  }>(),
  {
    storeSlug: 'flemela',
    initialBanners: () => [],
  }
);

const banners = ref<BannerItem[]>(props.initialBanners || []);
const currentIndex = ref(0);

// AUTOPLAY PACING: Set strictly to 6000ms
const AUTOPLAY_INTERVAL_MS = 6000;
let autoplayTimer: ReturnType<typeof setInterval> | null = null;
const isPaused = ref(false);

onMounted(async () => {
  // If banners were not provided by parent, fetch from Soko public endpoint
  if (banners.value.length === 0) {
    try {
      const res = await ofetch<any>(`/api/banners/public/${props.storeSlug}`);
      const list = res?.data || res;
      if (Array.isArray(list)) {
        banners.value = list;
      }
    } catch {
      // Graceful empty state without breaking layout
    }
  }

  startAutoplay();
});

function startAutoplay() {
  stopAutoplay();
  if (banners.value.length > 1) {
    autoplayTimer = setInterval(() => {
      if (!isPaused.value) {
        nextSlide();
      }
    }, AUTOPLAY_INTERVAL_MS);
  }
}

function stopAutoplay() {
  if (autoplayTimer) {
    clearInterval(autoplayTimer);
    autoplayTimer = null;
  }
}

function pauseAutoplay() {
  isPaused.value = true;
}

function resumeAutoplay() {
  isPaused.value = false;
}

function nextSlide() {
  if (banners.value.length <= 1) return;
  currentIndex.value = (currentIndex.value + 1) % banners.value.length;
}

function prevSlide() {
  if (banners.value.length <= 1) return;
  currentIndex.value = (currentIndex.value - 1 + banners.value.length) % banners.value.length;
}

function goToSlide(index: number) {
  currentIndex.value = index;
  // Reset interval cycle when manually navigated
  startAutoplay();
}

/**
 * Checks whether the administrator explicitly authored text content.
 * Returns FALSE for visual banner artwork so NO forced text or gradient overlay renders.
 */
function hasAuthoredText(banner: BannerItem): boolean {
  const hasTitle = Boolean(banner.title && banner.title.trim().length > 0);
  const hasSubtitle = Boolean(banner.subtitle && banner.subtitle.trim().length > 0);
  const hasBadge = Boolean(banner.badge && banner.badge.trim().length > 0);
  return hasTitle || hasSubtitle || hasBadge;
}

function isExternalLink(link?: string | null): boolean {
  if (!link) return false;
  return link.startsWith('http://') || link.startsWith('https://');
}

function trackClick(bannerId?: string) {
  if (!bannerId) return;
  // Non-blocking fire-and-forget click telemetry
  ofetch(`/api/banners/${bannerId}/click`, { method: 'POST' }).catch(() => {});
}

onBeforeUnmount(() => {
  stopAutoplay();
});
</script>