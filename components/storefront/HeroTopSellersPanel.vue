<!-- components/storefront/HeroTopSellersPanel.vue -->
<script setup lang="ts">
import { computed } from 'vue';
import { Flame, Star, ChevronRight } from 'lucide-vue-next';
import type { Book } from '~/types';

interface Props {
  books?: Book[];
  title?: string;
}

const props = withDefaults(defineProps<Props>(), {
  books: () => [],
  title: 'Top Selling Books',
});

// Guaranteed 4 items fit cleanly into the fixed height
const displayBooks = computed(() => {
  return props.books.slice(0, 4);
});

function formatPrice(val: number): string {
  return `KSh ${val.toLocaleString('en-KE')}`;
}

function resolveCoverUrl(book: Book): string {
  const first: unknown = book.images?.[0];
  if (typeof first === 'string' && first.trim().length > 5) return first.trim();
  if (first && typeof first === 'object' && 'image_url' in first) {
    const url = (first as { image_url?: string }).image_url;
    if (typeof url === 'string' && url.trim().length > 5) return url.trim();
  }
  return (book as any).cover_image_url || '/images/book-placeholder.svg';
}

function resolveSellingPrice(book: Book): number {
  if (book.formats && book.formats.length > 0) {
    const prices = book.formats.map((f) => f.price).filter((p) => p > 0);
    if (prices.length > 0) return Math.min(...prices);
  }
  return book.price || 999;
}
</script>

<template>
	<aside
		class="w-full h-full rounded-2xl md:rounded-3xl border border-slate-200/60 shadow-md p-3.5 sm:p-4 bg-white text-theme-ink flex flex-col justify-between overflow-hidden select-none"
		aria-label="Top Selling Books Spotlight">
		<!-- Panel Header -->
		<div class="flex items-center justify-between pb-2.5 border-b border-slate-100 flex-shrink-0">
			<div class="flex items-center gap-1.5 min-w-0">
				<div
					class="w-6 h-6 rounded-lg bg-orange-100 text-[#E8750D] flex items-center justify-center flex-shrink-0">
					<Flame :size="14" class="fill-current text-[#E8750D]" />
				</div>
				<h3
					class="font-display font-bold text-xs sm:text-[13px] text-forest-950 uppercase tracking-wider truncate">
					{{ title }}
				</h3>
			</div>
			<NuxtLink to="/#catalog-results"
				class="text-[10px] font-mono font-bold uppercase tracking-widest text-[#E8750D] hover:underline flex items-center gap-0.5 flex-shrink-0">
				<span>All</span>
				<ChevronRight :size="11" />
			</NuxtLink>
		</div>

		<!-- 4 Rows Fitting Evenly Inside Fixed Height (Cover and Title Side by Side) -->
		<div class="flex-1 flex flex-col justify-between py-1.5 space-y-1.5 min-h-0">
			<NuxtLink v-for="book in displayBooks" :key="book.id" :to="`/book/${book.slug}`"
				class="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-paper-cream/60 transition-colors group cursor-pointer flex-1 min-h-0">
				<!-- Book Cover Art (Left) -->
				<div
					class="w-11 sm:w-12 h-full max-h-[78px] aspect-[3/4] rounded-lg bg-paper-cream border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center shadow-2xs">
					<img :src="resolveCoverUrl(book)" :alt="book.name"
						class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
						loading="lazy"
						@error="($event.target as HTMLImageElement).src = '/images/book-placeholder.svg'" />
				</div>

				<!-- Book Title, Author & Price (Right) -->
				<div class="flex-1 min-w-0 flex flex-col justify-center space-y-0.5">
					<h4
						class="font-display font-bold text-[11px] sm:text-xs text-forest-950 group-hover:text-[#E8750D] transition-colors line-clamp-1 leading-tight">
						{{ book.name }}
					</h4>
					<p class="text-[10px] text-ink-muted truncate italic">
						{{ book.author || 'Original Edition' }}
					</p>

					<div class="flex items-center justify-between pt-0.5">
						<span class="font-mono font-extrabold text-[11px] sm:text-xs text-forest-950 tabular-figure">
							{{ formatPrice(resolveSellingPrice(book)) }}
						</span>
						<span
							class="text-[9px] font-mono font-bold uppercase text-[#E8750D] bg-orange-50 px-1.5 py-0.2 rounded border border-orange-200">
							Hot
						</span>
					</div>
				</div>
			</NuxtLink>
		</div>

		<!-- Panel Footer -->
		<div
			class="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-ink-muted flex-shrink-0">
			<span class="flex items-center gap-1">
				<Star :size="10" class="fill-amber-400 text-amber-400" />
				<span class="font-bold">Verified Bestsellers</span>
			</span>
			<span>Nairobi Hub</span>
		</div>
	</aside>
</template>