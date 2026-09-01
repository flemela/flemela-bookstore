<!-- components/storefront/BookCard.vue -->
<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { ShoppingBag, Truck, Download } from 'lucide-vue-next';
import { useCart } from '~/composables/useCart';
import { useToast } from '~/composables/useToast';
import type { Book, ProductFormat } from '~/types';

interface Props {
  book: Book;
}

const props = defineProps<Props>();
const { addItem, openDrawer } = useCart();
const { push: pushToast } = useToast();

// Cover image resolver supporting string array, object array, and fallbacks
const coverImage = computed(() => {
  if (!props.book) return '/images/book-placeholder.svg';
  const rawImg = props.book.images?.[0];
  if (!rawImg) return (props.book as any).cover_image_url || '/images/book-placeholder.svg';
  if (typeof rawImg === 'string') return rawImg;
  return rawImg.image_url || (props.book as any).cover_image_url || '/images/book-placeholder.svg';
});

// Selected format state (defaults to lowest-price format)
const selectedFormatId = ref<string>('');

watch(
  () => props.book.formats,
  (fmts: ProductFormat[] | undefined) => {
    if (fmts && fmts.length > 0) {
      const sorted = [...fmts].sort((a, b) => a.price - b.price);
      selectedFormatId.value = sorted[0].id;
    }
  },
  { immediate: true }
);

const activeFormat = computed<ProductFormat | undefined>(() => {
  if (!props.book.formats || props.book.formats.length === 0) return undefined;
  return (
    props.book.formats.find((f) => f.id === selectedFormatId.value) ||
    props.book.formats[0]
  );
});

const currentPrice = computed(() => {
  if (activeFormat.value) return activeFormat.value.price;
  return props.book.price ?? 0;
});

function formatCurrency(val: number): string {
  return `KSh ${val.toLocaleString('en-KE')}`;
}

function handleSelectFormat(formatId: string, event: Event): void {
  event.preventDefault();
  event.stopPropagation();
  selectedFormatId.value = formatId;
}

function handleAddToCart(event: Event): void {
  event.preventDefault();
  event.stopPropagation();

  const fmt = activeFormat.value;
  const priceToUse = fmt ? fmt.price : props.book.price;
  const formatType = fmt ? fmt.format : 'hardcopy';
  const formatId = fmt ? fmt.id : 'default';

  addItem({
    productId: props.book.id,
    formatId,
    title: props.book.name,
    format: formatType,
    price: priceToUse,
    quantity: 1,
    coverUrl: coverImage.value,
    author: props.book.author,
  });

  pushToast({
    message: `Added "${props.book.name}" (${formatType.toUpperCase()}) to cart!`,
    variant: 'success',
  });

  openDrawer();
}
</script>

<template>
  <div class="bg-paper-surface rounded-xl border border-paper-border hover:border-forest-800/30 p-3 sm:p-4 flex flex-col justify-between book-hover-lift group shadow-soft hover:shadow-card transition-all duration-300">
    <div class="space-y-3">
      <!-- 3D Book Cover Frame -->
      <NuxtLink :to="`/book/${book.slug}`" class="block relative aspect-[3/4] bg-paper-cream rounded-book overflow-hidden book-cover-3d">
        <img
          :src="coverImage"
          :alt="`Cover for ${book.name}`"
          class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          loading="lazy"
          referrerpolicy="no-referrer"
          width="260"
          height="346"
          @error="($event.target as HTMLImageElement).src = '/images/book-placeholder.svg'"
        />

        <!-- Optional Curated Badge -->
        <div v-if="book.badge" class="absolute top-2.5 left-2.5 z-10">
          <span class="text-[8px] sm:text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-forest-950/90 backdrop-blur-xs text-gold-300 shadow-sm border border-gold-500/30">
            ★ {{ book.badge }}
          </span>
        </div>
      </NuxtLink>

      <!-- Book Typography Details -->
      <div class="space-y-1 text-left pt-0.5">
        <span class="text-[9px] sm:text-[10px] uppercase font-mono font-bold tracking-widest text-gold-600 block truncate">
          {{ book.category_name || 'General' }}
        </span>

        <NuxtLink :to="`/book/${book.slug}`" class="block">
          <h3 class="font-display text-sm sm:text-base font-bold text-forest-950 group-hover:text-forest-800 transition-colors line-clamp-2 leading-snug">
            {{ book.name }}
          </h3>
        </NuxtLink>

        <p class="text-xs italic text-ink-muted leading-tight truncate">
          {{ book.author ? `By ${book.author}` : 'Original Edition' }}
        </p>

        <!-- Segmented Mini-Pill Format Switcher -->
        <div v-if="book.formats && book.formats.length > 1" class="pt-2">
          <div class="inline-flex bg-paper-cream/80 p-0.5 rounded-lg border border-paper-border w-full justify-between gap-1">
            <button
              v-for="fmt in book.formats"
              :key="fmt.id"
              type="button"
              class="flex-1 py-1 px-1.5 text-[9px] font-mono font-bold rounded-md transition-all flex items-center justify-center gap-1 cursor-pointer select-none truncate"
              :class="[
                selectedFormatId === fmt.id
                  ? 'bg-forest-950 text-white shadow-xs'
                  : 'text-ink-muted hover:text-forest-950 hover:bg-white/60'
              ]"
              @click="(e) => handleSelectFormat(fmt.id, e)"
            >
              <component :is="fmt.format === 'hardcopy' ? Truck : Download" :size="10" />
              <span>{{ fmt.format === 'hardcopy' ? 'Print' : fmt.format.toUpperCase() }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Pricing & Tactile Action Button -->
    <div class="pt-3 mt-3 border-t border-paper-border/80 space-y-2">
      <div class="flex items-baseline justify-between">
        <span class="text-[11px] text-ink-muted font-medium font-sans">
          {{ activeFormat?.format === 'hardcopy' ? 'Physical Copy' : 'Instant eBook' }}
        </span>
        <span class="text-sm sm:text-base font-bold font-mono text-forest-950 tabular-figure">
          {{ formatCurrency(currentPrice) }}
        </span>
      </div>

      <button
        type="button"
        class="w-full bg-forest-950 hover:bg-forest-900 active:bg-forest-950 text-paper font-sans font-bold text-[11px] uppercase tracking-wider py-2.5 px-3 rounded-lg shadow-subtle transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
        @click="handleAddToCart"
      >
        <ShoppingBag :size="13" class="text-gold-300" />
        <span>Add to Cart</span>
      </button>
    </div>
  </div>
</template>