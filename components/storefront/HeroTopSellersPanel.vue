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

// Guaranteed 4 items fit cleanly into the 20% reduced height
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
		class="w-full h-full rounded-2xl md:rounded-3xl border border-black/[0.06] shadow-[0_4px_24px_rgba(0,0,0,0.06)] p-3 sm:p-3.5 bg-white text-theme-ink flex flex-col justify-between overflow-hidden select-none"
		aria-label="Top Selling Books Spotlight">
		<!-- Panel Header: Inset Hairline -->
		<div class="flex items-center justify-between pb-2 border-b border-black/[0.05] flex-shrink-0">
			<div class="flex items-center gap-1.5 min-w-0">
				<div
					class="w-5.5 h-5.5 rounded-md bg-orange-100 text-[#E8750D] flex items-center justify-center flex-shrink-0">
					<Flame :size="13" class="fill-current text-[#E8750D]" />
				</div>
				<h3
					class="font-display font-bold text-xs sm:text-[12.5px] text-forest-950 uppercase tracking-wider truncate">
					{{ title }}
				</h3>
			</div>
			<NuxtLink to="/#catalog-results"
				class="text-[9.5px] font-mono font-bold uppercase tracking-widest text-[#E8750D] hover:underline flex items-center gap-0.5 flex-shrink-0">
				<span>All</span>
				<ChevronRight :size="10" />
			</NuxtLink>
		</div>

		<!-- 4 Rows Proportionally Scaled to Fit Container -->
		<div class="flex-1 flex flex-col justify-between py-1 space-y-1 min-h-0">
			<NuxtLink v-for="book in displayBooks" :key="book.id" :to="`/book/${book.slug}`"
				class="flex items-center gap-2 p-1 rounded-lg hover:bg-black/[0.025] transition-colors group cursor-pointer flex-1 min-h-0">
				<!-- Book Cover Art (Left) -->
				<div
					class="w-9 sm:w-10 h-full max-h-[62px] aspect-[3/4] rounded-md bg-paper-cream border border-black/[0.08] overflow-hidden flex-shrink-0 flex items-center justify-center shadow-2xs">
					<img :src="resolveCoverUrl(book)" :alt="book.name"
						class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
						loading="lazy"
						@error="($event.target as HTMLImageElement).src = '/images/book-placeholder.svg'" />
				</div>

				<!-- Book Title, Author & Price (Right) -->
				<div class="flex-1 min-w-0 flex flex-col justify-center space-y-0.2">
					<h4
						class="font-display font-bold text-[10.5px] sm:text-[11.5px] text-forest-950 group-hover:text-[#E8750D] transition-colors line-clamp-1 leading-tight">
						{{ book.name }}
					</h4>
					<p class="text-[9.5px] text-ink-muted truncate italic leading-none">
						{{ book.author || 'Original Edition' }}
					</p>

					<div class="flex items-center justify-between pt-0.5">
						<span
							class="font-mono font-extrabold text-[10.5px] sm:text-[11.5px] text-forest-950 tabular-figure">
							{{ formatPrice(resolveSellingPrice(book)) }}
						</span>
						<span
							class="text-[8px] font-mono font-bold uppercase text-[#E8750D] bg-orange-50 px-1 py-0.2 rounded border border-orange-200">
							Hot
						</span>
					</div>
				</div>
			</NuxtLink>
		</div>

		<!-- Panel Footer: Inset Hairline -->
		<div
			class="pt-1.5 border-t border-black/[0.05] flex items-center justify-between text-[9.5px] font-mono text-ink-muted flex-shrink-0">
			<span class="flex items-center gap-1">
				<Star :size="9" class="fill-amber-400 text-amber-400" />
				<span class="font-bold">Verified Bestsellers</span>
			</span>
			<span>Nairobi Hub</span>
		</div>
	</aside>
</template>