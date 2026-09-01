<!-- components/storefront/HeroBanner.vue -->
<script setup lang="ts">
import { ArrowRight, Sparkles } from 'lucide-vue-next';

interface StoreData {
  name?: string;
  cover_image_url?: string | null;
  hero_headline?: string | null;
  hero_subheadline?: string | null;
}

const { data: store } = await useFetch<StoreData>('/api/stores/current').catch(() => ({ data: ref(null) }));

const heroCover = computed(() => {
  return store?.value?.cover_image_url || '/images/hero-cover.jpg';
});

function scrollToSection(id: string): void {
  if (process.client) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
</script>

<template>
  <section class="relative min-h-[460px] sm:min-h-[520px] lg:min-h-[560px] flex items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden bg-forest-950">
    <!-- Dynamic Store Cover Banner -->
    <div class="absolute inset-0 z-0">
      <img
        :src="heroCover"
        alt="Flemela Bookstore Ambient Library"
        class="w-full h-full object-cover object-center brightness-75 scale-100 transition-all duration-700"
        loading="eager"
        width="1920"
        height="1080"
        @error="($event.target as HTMLImageElement).src = '/images/hero-cover.jpg'"
      />
    </div>

    <!-- Hero Content Container -->
    <div class="relative z-10 max-w-6xl mx-auto w-full py-12 sm:py-16 grid md:grid-cols-12 gap-8 items-center text-left">
      <div class="md:col-span-8 lg:col-span-7 space-y-4 sm:space-y-6 text-white">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-950/90 border border-gold-500 text-xs font-semibold text-gold-300 shadow-sm">
          <Sparkles :size="13" class="text-gold-500" />
          <span>Curated for Curious Minds</span>
        </div>

        <h1 class="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-[1.15] drop-shadow-md">
          {{ store?.hero_headline || 'Books that change' }} <br class="hidden sm:inline" />
          <span class="italic font-normal text-gold-300">the way you think.</span>
        </h1>

        <p class="text-sm sm:text-base text-slate-100 font-sans leading-relaxed max-w-lg drop-shadow">
          {{ store?.hero_subheadline || 'Discover handpicked literature, timeless philosophy, and rigorous business knowledge. Instant digital downloads via Cloudflare R2 or authentic physical copies delivered to your doorstep.' }}
        </p>

        <div class="flex flex-wrap gap-3.5 pt-2 sm:pt-4">
          <button
            type="button"
            class="bg-gold-500 hover:bg-gold-600 text-forest-950 font-sans font-bold text-xs uppercase px-6 py-3.5 rounded shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
            @click="scrollToSection('bestsellers')"
          >
            <span>Explore Catalog</span>
            <ArrowRight :size="14" />
          </button>

          <button
            type="button"
            class="border-2 border-white text-white hover:bg-white hover:text-forest-950 font-sans font-bold text-xs uppercase px-6 py-3.5 rounded transition-all cursor-pointer"
            @click="scrollToSection('categories')"
          >
            Browse Categories
          </button>
        </div>
      </div>
    </div>
  </section>
</template>