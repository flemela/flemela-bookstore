<!-- components/storefront/BentoCategories.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  BookOpen,
  GraduationCap,
  Heart,
  Briefcase,
  Laptop,
  Star,
  ArrowRight,
} from 'lucide-vue-next';
import type { Book } from '~/types';

const emit = defineEmits<{
  select: [category: string];
}>();

// Fetch live catalog books to dynamically calculate inventory counts
const { data: catalogResponse } = await useFetch<any>('/api/products');

const CATEGORIES = [
  {
    name: 'Fiction',
    icon: BookOpen,
    fallbackCount: '2,450+',
    query: 'Fiction',
  },
  {
    name: 'Non-Fiction',
    icon: GraduationCap,
    fallbackCount: '1,630+',
    query: 'Non-Fiction',
  },
  {
    name: 'Self Help',
    icon: Heart,
    fallbackCount: '980+',
    query: 'Self-Help',
  },
  {
    name: 'Business',
    icon: Briefcase,
    fallbackCount: '760+',
    query: 'Business',
  },
  {
    name: 'Technology',
    icon: Laptop,
    fallbackCount: '540+',
    query: 'Technology',
  },
  {
    name: 'Classic',
    icon: Star,
    fallbackCount: '320+',
    query: 'Classic',
  },
];

// Resolves category images from public/images using categoryName.png convention
function getCategoryImageUrl(name: string): string {
  const clean = name.trim().toLowerCase();
  if (clean === 'classic' || clean === 'classics') return '/images/classics.png';
  if (clean === 'self help' || clean === 'self-help') return '/images/self help.png';
  if (clean === 'non-fiction' || clean === 'nonfiction') return '/images/non-fiction.png';
  if (clean === 'fiction') return '/images/fiction.png';
  if (clean === 'technology' || clean === 'tech') return '/images/technology.png';
  return `/images/${clean}.png`;
}

// Track image failures to gracefully apply fallback gradients without broken image icons
const failedImages = ref<Set<string>>(new Set());

function onImageError(catName: string): void {
  failedImages.value.add(catName);
}

const countMap = computed(() => {
  const map = new Map<string, number>();
  const list: Book[] = Array.isArray(catalogResponse.value)
    ? catalogResponse.value
    : catalogResponse.value?.products || [];

  for (const b of list) {
    const cat = (b?.category_name || 'General').toLowerCase();
    map.set(cat, (map.get(cat) || 0) + 1);
  }
  return map;
});

function getDisplayCount(query: string, fallback: string): string {
  const q = query.toLowerCase();
  let total = 0;
  for (const [cat, count] of countMap.value.entries()) {
    if (cat.includes(q) || q.includes(cat)) {
      total += count;
    }
  }
  return total > 0 ? `${total} titles` : `${fallback} titles`;
}

function handleCategoryClick(catQuery: string): void {
  emit('select', catQuery);
  if (process.client) {
    const el = document.getElementById('catalog-results');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
</script>

<template>
	<section id="categories-grid"
		class="py-10 sm:py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-5 select-none">
		<!-- Section Heading -->
		<div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-200">
			<div class="space-y-1">
				<span
					class="text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-widest text-[#E8750D] block">
					CURATED GENRES
				</span>
				<h2
					class="font-poster text-3xl sm:text-4xl lg:text-5xl font-extrabold uppercase text-[#141E1A] tracking-wide leading-none">
					SHOP BY CATEGORY
				</h2>
			</div>

			<button type="button"
				class="text-xs sm:text-sm font-bold text-[#E8750D] hover:underline flex items-center gap-1 transition-colors cursor-pointer self-start sm:self-auto"
				@click="handleCategoryClick('General')">
				<span>View all books</span>
				<ArrowRight :size="14" />
			</button>
		</div>

		<!-- Category Grid: 3 on Mobile, 6 on Desktop with Visible Photographic Backgrounds -->
		<div class="grid grid-cols-3 md:grid-cols-6 gap-2.5 sm:gap-3.5 md:gap-4">
			<button v-for="cat in CATEGORIES" :key="cat.name" type="button"
				class="relative overflow-hidden rounded-xl p-3.5 sm:p-4 md:p-5 flex flex-col items-center justify-center text-center transition-all duration-300 group cursor-pointer shadow-md hover:shadow-xl hover:-translate-y-1 min-h-[110px] sm:min-h-[135px] md:min-h-[155px] border border-black/10 hover:border-[#E8750D]/80"
				@click="handleCategoryClick(cat.query)">
				<!-- Background Image with smooth zoom on hover -->
				<img v-if="!failedImages.has(cat.name)" :src="getCategoryImageUrl(cat.name)" :alt="`${cat.name} Books`"
					class="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-110 pointer-events-none"
					loading="lazy" @error="onImageError(cat.name)" />

				<!-- Fallback Atmospheric Gradient if Image is missing -->
				<div v-else
					class="absolute inset-0 w-full h-full bg-gradient-to-br from-[#052219] via-[#0C3A2B] to-[#145240] pointer-events-none" />

				<!-- Balanced Scrim: Allows Artwork to Pop while Preserving Pure White Text Legibility -->
				<div
					class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/10 group-hover:from-black/65 group-hover:via-black/20 group-hover:to-transparent transition-colors duration-300 pointer-events-none" />

				<!-- Tile Foreground Content -->
				<div
					class="relative z-10 flex flex-col items-center justify-center text-center gap-2 sm:gap-2.5 w-full min-w-0">
					<!-- Filled Icon with Translucent Dark Glass Badge -->
					<div
						class="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/35 backdrop-blur-xs border border-white/20 flex items-center justify-center shadow-sm flex-shrink-0 group-hover:bg-black/45 group-hover:scale-110 transition-all duration-300">
						<component :is="cat.icon" :size="18" class="sm:w-5 sm:h-5 fill-white text-white stroke-[1.5]" />
					</div>

					<!-- Large Bold White Typography with Protective Drop Shadow -->
					<div class="space-y-0.5 w-full min-w-0 px-1">
						<h3
							class="font-sans font-extrabold text-xs sm:text-sm md:text-base text-white leading-tight truncate drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]">
							{{ cat.name }}
						</h3>
						<p
							class="text-[9px] sm:text-[10px] md:text-[11px] text-white/90 font-semibold font-mono truncate drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
							{{ getDisplayCount(cat.query, cat.fallbackCount) }}
						</p>
					</div>
				</div>
			</button>
		</div>
	</section>
</template>