<!-- components/storefront/BookCard.vue -->
<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { ShoppingBag, Truck, Download, MessageSquare, BookOpen } from 'lucide-vue-next';
import { useCart } from '~/composables/useCart';
import { useToast } from '~/composables/useToast';
import type { Book, ProductFormat } from '~/types';

interface Props {
  book: Book;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  requestSeed: [title: string, author?: string];
}>();

const { addItem, openDrawer } = useCart();
const { push: pushToast } = useToast();

const imageFailed = ref(false);

// Reset image error state if book changes
watch(
  () => props.book,
  () => {
    imageFailed.value = false;
  }
);


const coverImage = computed(() => {
  if (!props.book) return null;
  
  // Cast to unknown so TS safely permits runtime string / object inspection
  const rawImg: unknown = props.book.images?.[0];
  
  if (typeof rawImg === 'string' && rawImg.trim().length > 5) {
    return rawImg.trim();
  }
  
  if (rawImg && typeof rawImg === 'object' && 'image_url' in rawImg) {
    const url = (rawImg as { image_url?: string }).image_url;
    if (typeof url === 'string' && url.trim().length > 5) {
      return url.trim();
    }
  }
  
  const fallback = (props.book as any).cover_image_url;
  if (typeof fallback === 'string' && fallback.trim().length > 5) {
    return fallback.trim();
  }
  
  return null;
});
function handleImageError() {
  imageFailed.value = true;
}

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

const currentPrice = computed<number>(() => {
  if (activeFormat.value) return activeFormat.value.price;
  return props.book.price ?? 0;
});

const originalPrice = computed<number | null>(() => {
  if (activeFormat.value?.compare_at_price) {
    return activeFormat.value.compare_at_price;
  }
  if (!props.book.formats || props.book.formats.length <= 1) {
    return props.book.compare_at_price || null;
  }
  return null;
});

const discountPercentage = computed<number>(() => {
  const orig = originalPrice.value;
  const curr = currentPrice.value;
  if (!orig || orig <= 0 || curr <= 0) return 0;
  if (orig <= curr) return 0;
  const percent = Math.round(((orig - curr) / orig) * 100);
  return percent >= 5 ? percent : 0;
});

const isPromoExpired = computed<boolean>(() => {
  if (!props.book.sale_ends_at) return false;
  return new Date(props.book.sale_ends_at).getTime() < Date.now();
});

const activeBadge = computed<string | null>(() => {
  if (isPromoExpired.value) return null;
  return props.book.badge || null;
});

const badgeStyle = computed(() => {
  switch (activeBadge.value) {
    case 'FLASH_SALE':
      return { class: 'bg-red-600 text-white animate-pulse', label: '⚡ Flash Sale' };
    case 'NO1_PICK':
      return { class: 'bg-[#2EE59D] text-[#052219] font-extrabold', label: '⭐ #1 Pick' };
    case 'BESTSELLER':
      return { class: 'bg-[#FF8A00] text-white font-bold', label: '🔥 Bestseller' };
    case 'DEAL_OF_WEEK':
      return { class: 'bg-purple-700 text-white font-bold', label: '🏷️ Deal of Week' };
    case 'LIMITED_TIME':
      return { class: 'bg-rose-600 text-white font-bold', label: '⏳ Limited Time' };
    default:
      return { class: 'bg-theme-coral text-white', label: activeBadge.value || '' };
  }
});

function formatCurrency(val: number): string {
  return `KSh ${val.toLocaleString('en-KE')}`;
}

function handleSelectFormat(formatId: string, event: Event): void {
  event.preventDefault();
  event.stopPropagation();
  selectedFormatId.value = formatId;
}

function handleAction(event: Event): void {
  event.preventDefault();
  event.stopPropagation();

  if (props.book.isSeed) {
    emit('requestSeed', props.book.name, props.book.author || undefined);
    return;
  }

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
    compare_at_price: originalPrice.value,
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
  <div class="bg-theme-surface rounded-2xl border border-theme-border hover:border-theme-forest/30 p-3.5 sm:p-4 flex flex-col justify-between book-hover-lift group shadow-soft transition-all duration-300">
    <div class="space-y-3">
      <!-- 3D Book Cover Frame -->
      <NuxtLink
        :to="book.isSeed ? '#' : `/book/${book.slug}`"
        class="block relative aspect-[3/4] rounded-book overflow-hidden book-cover-3d shadow-sm"
        @click="book.isSeed ? handleAction($event) : null"
      >
        <!-- 1. BULLETPROOF INLINE FALLBACK (Renders if image is missing or failed to load) -->
        <div
          v-if="imageFailed || !coverImage"
          class="w-full h-full flex flex-col justify-between p-4 bg-gradient-to-br from-[#052219] via-[#0C3A2B] to-[#041d15] text-white text-left select-none border-l-4 border-l-white/20"
        >
          <div class="space-y-1.5">
            <span class="text-[9px] font-mono uppercase tracking-widest text-[#2EE59D] font-bold block truncate">
              {{ book.category_name || 'Flemela Edition' }}
            </span>
            <h4 class="font-display font-bold text-xs sm:text-sm leading-snug text-white line-clamp-3">
              {{ book.name }}
            </h4>
            <p class="text-[10px] text-white/70 italic line-clamp-1">
              {{ book.author ? `By ${book.author}` : '' }}
            </p>
          </div>

          <div class="pt-2 border-t border-white/10 flex items-center justify-between">
            <span class="text-[8px] font-mono tracking-wider uppercase text-gold-400 font-bold">Flemela Bookstore</span>
            <BookOpen :size="12" class="text-[#2EE59D] opacity-70" />
          </div>
        </div>

        <!-- 2. ACTUAL IMAGE ELEMENT -->
        <img
          v-else
          :src="coverImage"
          :alt="`Cover for ${book.name}`"
          class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          loading="lazy"
          width="260"
          height="346"
          @error="handleImageError"
        />

        <!-- Badges -->
        <div v-if="activeBadge" class="absolute top-2.5 left-2.5 z-10">
          <span
            class="text-[8px] sm:text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm"
            :class="badgeStyle.class"
          >
            {{ badgeStyle.label }}
          </span>
        </div>

        <div v-if="discountPercentage > 0" class="absolute top-2.5 right-2.5 z-10">
          <span class="text-[9px] font-mono font-extrabold bg-red-600 text-white px-1.5 py-0.5 rounded shadow-sm">
            -{{ discountPercentage }}%
          </span>
        </div>
      </NuxtLink>

      <!-- Book Details -->
      <div class="space-y-1 text-left pt-0.5">
        <span class="text-[9px] sm:text-[10px] uppercase font-mono font-bold tracking-widest text-theme-coral block truncate">
          {{ book.category_name || 'General' }}
        </span>

        <NuxtLink :to="book.isSeed ? '#' : `/book/${book.slug}`" class="block" @click="book.isSeed ? handleAction($event) : null">
          <h3 class="font-display text-sm sm:text-base font-bold text-theme-ink group-hover:text-theme-coral transition-colors line-clamp-2 leading-snug">
            {{ book.name }}
          </h3>
        </NuxtLink>

        <p class="text-xs italic text-theme-muted leading-tight truncate">
          {{ book.author ? `By ${book.author}` : 'Original Edition' }}
        </p>

        <!-- Segmented Format Switcher -->
        <div v-if="book.formats && book.formats.length > 1" class="pt-2">
          <div class="inline-flex bg-theme-canvas p-0.5 rounded-lg border border-theme-border w-full justify-between gap-1">
            <button
              v-for="fmt in book.formats"
              :key="fmt.id"
              type="button"
              class="flex-1 py-1 px-1 text-[9px] font-mono font-bold rounded-md transition-all flex items-center justify-center gap-1 cursor-pointer select-none truncate"
              :class="[
                selectedFormatId === fmt.id
                  ? 'bg-theme-dark text-white shadow-xs'
                  : 'text-theme-muted hover:text-theme-ink hover:bg-white/60'
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

    <!-- Pricing Area -->
    <div class="pt-3 mt-3 border-t border-theme-border/80 space-y-2">
      <div class="flex items-baseline justify-between">
        <span class="text-[11px] text-theme-muted font-medium">
          {{ book.isSeed ? 'Available to Order' : (activeFormat?.format === 'hardcopy' ? 'Physical Copy' : 'Instant eBook') }}
        </span>

        <div class="flex items-baseline gap-1.5">
          <span
            v-if="originalPrice && originalPrice > currentPrice"
            class="text-xs text-theme-muted line-through font-mono tabular-figure opacity-70"
          >
            {{ formatCurrency(originalPrice) }}
          </span>

          <span
            class="text-sm sm:text-base font-bold font-mono text-theme-ink tabular-figure"
            :class="{ 'text-red-700 font-extrabold': discountPercentage > 0 }"
          >
            {{ formatCurrency(currentPrice) }}
          </span>
        </div>
      </div>

      <button
        type="button"
        class="w-full text-white font-sans font-bold text-[11px] uppercase tracking-wider py-2.5 px-3 rounded-xl shadow-soft transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98]"
        :class="book.isSeed ? 'bg-theme-forest hover:bg-theme-dark' : 'bg-theme-coral hover:bg-theme-coral-hover'"
        @click="handleAction"
      >
        <component :is="book.isSeed ? MessageSquare : ShoppingBag" :size="13" />
        <span>{{ book.isSeed ? 'Special Order' : 'Add to Cart' }}</span>
      </button>
    </div>
  </div>
</template>