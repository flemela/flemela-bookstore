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
		class="w-full h-full rounded-2xl md:rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.14)] overflow-hidden relative group cursor-pointer select-none bg-forest-950 flex flex-col justify-end transition-all duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.22)]"
		aria-label="Featured Promotion Spotlight" @click="handleBannerClick">
		<!-- Poster Background Image with Apple subtle hover scale -->
		<img :src="banner.image_url" :alt="banner.title || 'Featured Promotion'"
			class="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.02]"
			loading="eager" />

		<!-- Cloudy vignette: soft radial fog hugging only the text block; image stays clean elsewhere -->
		<div class="absolute inset-x-0 bottom-0 h-[46%] pointer-events-none"
			style="background:
				radial-gradient(130% 95% at 50% 108%, rgba(5,12,9,0.82) 0%, rgba(5,12,9,0.55) 34%, rgba(5,12,9,0.18) 62%, rgba(5,12,9,0) 82%),
				radial-gradient(72% 62% at 24% 112%, rgba(10,20,15,0.5) 0%, rgba(10,20,15,0) 70%),
				radial-gradient(72% 62% at 76% 112%, rgba(10,20,15,0.5) 0%, rgba(10,20,15,0) 70%);" />

		<!-- Bottom Campaign Title & Action -->
		<div class="relative z-10 p-4 sm:p-5 text-white space-y-1.5">
			<h3
				class="font-display font-bold text-xs sm:text-sm md:text-base text-white leading-tight line-clamp-2 drop-shadow-sm">
				{{ banner.title || 'Special Collection' }}
			</h3>
			<div
				class="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold text-gold-300 group-hover:text-gold-200 transition-colors">
				<span>Explore Collection</span>
				<span class="transition-transform duration-300 group-hover:translate-x-1">→</span>
			</div>
		</div>
	</aside>
</template>