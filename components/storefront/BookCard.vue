<!-- components/storefront/BookCard.vue -->
<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { ShoppingBag, Truck, Download, MessageSquare, BookOpen, Star } from 'lucide-vue-next';
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

watch(
  () => props.book,
  () => {
    imageFailed.value = false;
  }
);

const coverImage = computed(() => {
  if (!props.book) return null;
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

// 1. Format Selection
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

// 2. Pricing & Discounts
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
      return { class: 'bg-[#F05A36] text-white', label: activeBadge.value || '' };
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
  <div class="bg-white rounded-2xl border border-stone-200/80 p-3 sm:p-4 flex flex-col justify-between group shadow-sm hover:shadow-md transition-all duration-300 select-none">
    <div class="space-y-2.5">
      <!-- 1. Book Cover Frame with Ambient Shadow and Circular Red Discount Badge -->
      <NuxtLink
        :to="book.isSeed ? '#' : `/book/${book.slug}`"
        class="block relative aspect-[3/4.2] rounded-xl overflow-visible mb-1 transition-transform duration-300 group-hover:-translate-y-1"
        @click="book.isSeed ? handleAction($event) : null"
      >
        <!-- Floating Red Circular Discount Badge (Top-Left, matching reference design) -->
        <div
          v-if="discountPercentage > 0"
          class="absolute -top-2.5 -left-2.5 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#E53935] text-white flex items-center justify-center font-bold text-[10px] sm:text-[11px] font-sans shadow-md border-2 border-white tracking-tight"
        >
          -{{ discountPercentage }}%
        </div>

        <!-- Floating Promotional Tag (Top-Right) -->
        <div v-if="activeBadge" class="absolute top-2 right-2 z-10">
          <span
            class="text-[8px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm"
            :class="badgeStyle.class"
          >
            {{ badgeStyle.label }}
          </span>
        </div>

        <!-- Book Cover Image with Soft Ambient Shadow -->
        <div class="w-full h-full rounded-lg overflow-hidden bg-stone-100 shadow-[0_10px_24px_-4px_rgba(0,0,0,0.14)] border border-stone-200/60 relative">
          <!-- Text Jacket Fallback (Prevents broken image icons) -->
          <div
            v-if="imageFailed || !coverImage"
            class="w-full h-full flex flex-col justify-between p-3.5 bg-gradient-to-br from-[#052219] via-[#0C3A2B] to-[#041d15] text-white text-left select-none border-l-4 border-l-white/20"
          >
            <div class="space-y-1">
              <span class="text-[8px] font-mono uppercase tracking-widest text-[#2EE59D] font-bold block truncate">
                {{ book.category_name || 'Flemela Edition' }}
              </span>
              <h4 class="font-display font-bold text-xs leading-snug text-white line-clamp-3">
                {{ book.name }}
              </h4>
              <p class="text-[10px] text-white/70 italic line-clamp-1">
                {{ book.author ? `By ${book.author}` : '' }}
              </p>
            </div>
            <div class="pt-2 border-t border-white/10 flex items-center justify-between">
              <span class="text-[8px] font-mono tracking-wider uppercase text-gold-400 font-bold">Flemela</span>
              <BookOpen :size="12" class="text-[#2EE59D]" />
            </div>
          </div>

          <!-- Crisp Book Cover Image -->
          <img
            v-else
            :src="coverImage"
            :alt="book.name"
            class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            width="260"
            height="364"
            @error="handleImageError"
          />
        </div>
      </NuxtLink>

      <!-- 2. Centered Metadata Section -->
      <div class="space-y-1 text-center">
        <!-- 5-Star Rating (Centered, matching reference) -->
        <div class="flex items-center justify-center gap-0.5 text-[#FFB300] pt-0.5">
          <Star v-for="i in 5" :key="i" :size="11" class="fill-current" />
        </div>

        <!-- Book Title -->
        <NuxtLink
          :to="book.isSeed ? '#' : `/book/${book.slug}`"
          class="block"
          @click="book.isSeed ? handleAction($event) : null"
        >
          <h3 class="font-display text-xs sm:text-sm font-bold text-[#141E1A] group-hover:text-[#F05A36] transition-colors line-clamp-1 leading-snug">
            {{ book.name }}
          </h3>
        </NuxtLink>

        <!-- Author Byline (Kept Intact) -->
        <p class="text-[11px] text-stone-500 italic truncate">
          {{ book.author ? `By ${book.author}` : 'Original Edition' }}
        </p>

        <!-- 3. Interactive Format Switcher (Kept Intact for choosing Print vs eBook) -->
        <div v-if="book.formats && book.formats.length > 1" class="pt-1">
          <div class="inline-flex bg-stone-100 p-0.5 rounded-lg border border-stone-200 w-full justify-between gap-1">
            <button
              v-for="fmt in book.formats"
              :key="fmt.id"
              type="button"
              class="flex-1 py-1 px-1 text-[9px] font-mono font-bold rounded-md transition-all flex items-center justify-center gap-1 cursor-pointer select-none truncate"
              :class="[
                selectedFormatId === fmt.id
                  ? 'bg-[#052219] text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
              ]"
              @click="(e) => handleSelectFormat(fmt.id, e)"
            >
              <component :is="fmt.format === 'hardcopy' ? Truck : Download" :size="10" />
              <span>{{ fmt.format === 'hardcopy' ? 'Print' : fmt.format.toUpperCase() }}</span>
            </button>
          </div>
        </div>

        <!-- Current Format Label (When only 1 format exists) -->
        <div v-else class="flex items-center justify-center pt-0.5">
          <span class="text-[9px] font-mono font-bold uppercase tracking-wider text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
            {{ activeFormat?.format === 'hardcopy' ? 'Hardcover' : 'E-Book' }}
          </span>
        </div>
      </div>
    </div>

    <!-- 4. Pricing & Action Area -->
    <div class="pt-2.5 mt-2.5 border-t border-stone-100 space-y-2">
      <!-- Centered Price & Compare-At Display -->
      <div class="flex items-baseline justify-center gap-1.5 font-mono">
        <span
          class="text-xs sm:text-sm font-bold text-[#141E1A] tabular-figure"
          :class="{ 'text-red-700 font-extrabold': discountPercentage > 0 }"
        >
          {{ formatCurrency(currentPrice) }}
        </span>
        <span
          v-if="originalPrice && originalPrice > currentPrice"
          class="text-[10px] sm:text-xs text-stone-400 line-through tabular-figure"
        >
          {{ formatCurrency(originalPrice) }}
        </span>
      </div>

      <!-- Action Button (Add to Cart / Special Order) (Kept 100% Intact) -->
      <button
        type="button"
        class="w-full text-white font-sans font-bold text-[11px] uppercase tracking-wider py-2 px-3 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98]"
        :class="book.isSeed ? 'bg-[#0C3A2B] hover:bg-[#052219]' : 'bg-[#F05A36] hover:bg-[#D94827]'"
        @click="handleAction"
      >
        <component :is="book.isSeed ? MessageSquare : ShoppingBag" :size="13" />
        <span>{{ book.isSeed ? 'Special Order' : 'Add to Cart' }}</span>
      </button>
    </div>
  </div>
</template>