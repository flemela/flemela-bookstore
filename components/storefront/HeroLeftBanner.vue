<!-- components/storefront/HeroLeftBanner.vue -->
<script setup lang="ts">
export interface StoreHeroLeftBanner {
  is_active: boolean;
  title: string;
  image_url: string;
  link: string | null;
}

interface Props {
  banner?: StoreHeroLeftBanner | null;
}

const props = withDefaults(defineProps<Props>(), {
  banner: null,
});

function handleBannerClick(): void {
  if (!props.banner?.link) return;
  const target = props.banner.link.trim();
  if (target.startsWith('http')) {
    window.open(target, '_blank', 'noopener,noreferrer');
  } else if (target.startsWith('#')) {
    const el = document.querySelector(target);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  } else {
    navigateTo(target);
  }
}
</script>

<template>
	<aside v-if="banner && banner.is_active && banner.image_url"
		class="w-full h-full rounded-2xl md:rounded-3xl border border-slate-200/60 shadow-md overflow-hidden relative group cursor-pointer select-none bg-forest-950 flex flex-col justify-end"
		aria-label="Featured Promotion Spotlight" @click="handleBannerClick">
		<!-- Poster Background Image -->
		<img :src="banner.image_url" :alt="banner.title || 'Featured Promotion'"
			class="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
			loading="eager" />

		<!-- Ambient Gradient Overlay -->
		<div
			class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none transition-opacity duration-300 group-hover:from-black/90" />

		<!-- Top Spotlight Tag -->
		<div class="absolute top-3.5 left-3.5 z-10">
			<span
				class="bg-[#052219]/90 text-gold-300 border border-gold-400/30 text-[9px] font-mono font-extrabold uppercase px-2.5 py-0.5 rounded-full shadow-xs tracking-wider backdrop-blur-xs">
				Featured Spotlight
			</span>
		</div>

		<!-- Bottom Campaign Title & Action -->
		<div class="relative z-10 p-4 sm:p-5 text-white space-y-1">
			<h3
				class="font-display font-bold text-xs sm:text-sm md:text-base text-white leading-tight line-clamp-2 drop-shadow-sm">
				{{ banner.title || 'Special Collection' }}
			</h3>
			<div
				class="flex items-center gap-1 text-[11px] font-mono font-bold text-gold-300 group-hover:text-gold-200 transition-colors">
				<span>Explore Collection</span>
				<span class="transition-transform group-hover:translate-x-1">→</span>
			</div>
		</div>
	</aside>
</template>