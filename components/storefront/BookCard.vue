<!-- components/storefront/BookCard.vue -->
<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { ShoppingBag } from 'lucide-vue-next';
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
const selectedFormatId = ref<string>('');

// Synchronize PDF and EPUB so both digital editions share identical pricing & comparison
const availableFormats = computed<ProductFormat[]>(() => {
  if (!props.book?.formats || props.book.formats.length === 0) return [];

  const pdf = props.book.formats.find((f) => f.format === 'pdf');
  const epub = props.book.formats.find((f) => f.format === 'epub');
  const digitalPrice = pdf?.price ?? epub?.price ?? 149;
  const digitalCompareAt = pdf?.compare_at_price ?? epub?.compare_at_price ?? null;

  return props.book.formats.map((f) => {
    if (f.format === 'pdf' || f.format === 'epub') {
      return {
        ...f,
        price: digitalPrice,
        compare_at_price: digitalCompareAt,
      };
    }
    return f;
  });
});

// Default to Hardcopy (Print) if available, or first format
watch(
  availableFormats,
  (fmts) => {
    imageFailed.value = false;
    if (fmts && fmts.length > 0) {
      if (!fmts.some((f) => f.id === selectedFormatId.value)) {
        const hardcopy = fmts.find((f) => f.format === 'hardcopy');
        selectedFormatId.value = (hardcopy || fmts[0]).id;
      }
    } else {
      selectedFormatId.value = '';
    }
  },
  { immediate: true }
);

const activeFormat = computed<ProductFormat | undefined>(() => {
  if (!availableFormats.value.length) return undefined;
  return availableFormats.value.find((f) => f.id === selectedFormatId.value) || availableFormats.value[0];
});

// Proportional & Non-Inverted Pricing Engine for All Formats
const pricing = computed(() => {
  const pBook = props.book.price ?? 0;
  const cpBook = props.book.compare_at_price ?? null;

  // Check if parent book has an active sale discount
  const hasParentSale = Boolean(cpBook && cpBook > pBook && pBook > 0);
  const parentDiscountRatio = hasParentSale && cpBook ? (cpBook - pBook) / cpBook : 0;

  const fmt = activeFormat.value;
  let p = fmt ? fmt.price : pBook;
  let cp: number | null = null;

  if (fmt) {
    if (fmt.compare_at_price && fmt.compare_at_price > fmt.price) {
      // 1. Explicit format-level compare-at price
      cp = fmt.compare_at_price;
    } else if (fmt.format === 'hardcopy') {
      // 2. Hardcopy inherits book compare_at_price
      cp = cpBook;
    } else if (hasParentSale && parentDiscountRatio > 0 && parentDiscountRatio < 1) {
      // 3. Digital format (PDF/EPUB): compute proportional digital original price
      // so strikethrough is neither missing nor comparing against 1,800 KSh hardcover
      cp = Math.round(fmt.price / (1 - parentDiscountRatio));
    }
  } else {
    cp = cpBook;
  }

  // Calculate true % price is down by
  if (cp !== null && cp !== undefined && cp > 0 && p > 0 && cp !== p) {
    const minP = Math.min(p, cp);
    const maxP = Math.max(p, cp);
    const diff = maxP - minP;
    const percentDown = Math.round((diff / maxP) * 100);

    return {
      currentPrice: minP,
      originalPrice: maxP,
      discountPercentage: percentDown > 0 ? percentDown : 0,
    };
  }

  return {
    currentPrice: p,
    originalPrice: null,
    discountPercentage: 0,
  };
});

const currentPrice = computed<number>(() => pricing.value.currentPrice);
const originalPrice = computed<number | null>(() => pricing.value.originalPrice);
const discountPercentage = computed<number>(() => pricing.value.discountPercentage);

const coverImage = computed(() => {
  if (!props.book) return null;
  const rawImg: unknown = props.book.images?.[0];
  if (typeof rawImg === 'string' && rawImg.trim().length > 5) return rawImg.trim();
  if (rawImg && typeof rawImg === 'object' && 'image_url' in rawImg) {
    const url = (rawImg as { image_url?: string }).image_url;
    if (typeof url === 'string' && url.trim().length > 5) return url.trim();
  }
  const fallback = (props.book as any).cover_image_url;
  if (typeof fallback === 'string' && fallback.trim().length > 5) return fallback.trim();
  return null;
});

const displayAuthor = computed(() => {
  if (!props.book.author) return 'Original Edition';
  return props.book.author.startsWith('By ') ? props.book.author : `By ${props.book.author}`;
});

function formatBadge(badgeStr?: string | null): string {
  if (!badgeStr) return '';
  switch (badgeStr) {
    case 'FLASH_SALE':
      return '⚡ FLASH';
    case 'BESTSELLER':
      return '🔥 BESTSELLER';
    case 'NO1_PICK':
      return '⭐ #1 PICK';
    case 'DEAL_OF_WEEK':
      return '🏷️ DEAL';
    case 'LIMITED_TIME':
      return '⏳ LIMITED';
    default:
      return badgeStr.replace(/_/g, ' ');
  }
}

function handleImageError(): void {
  imageFailed.value = true;
}

function formatCurrency(val: number): string {
  return `KSh ${val.toLocaleString('en-KE')}`;
}

function selectFormat(fmtId: string, event: Event): void {
  event.preventDefault();
  event.stopPropagation();
  selectedFormatId.value = fmtId;
}

function handleCardClick(event: Event): void {
  if (props.book.isSeed) {
    event.preventDefault();
    emit('requestSeed', props.book.name, props.book.author || undefined);
  }
}

function handleAddToCart(event: Event): void {
  event.preventDefault();
  event.stopPropagation();

  if (props.book.isSeed) {
    emit('requestSeed', props.book.name, props.book.author || undefined);
    return;
  }

  const fmt = activeFormat.value;
  const formatType = fmt ? fmt.format : 'hardcopy';
  const formatId = fmt ? fmt.id : 'default';

  addItem({
    productId: props.book.id,
    formatId,
    title: props.book.name,
    format: formatType,
    price: currentPrice.value,
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
  <div class="w-full max-w-none sm:max-w-[148px] bg-white text-[#141E1A] rounded-xl p-2.5 sm:p-3 shadow-card hover:shadow-high transition-all flex flex-col justify-between group select-none text-left">
    <div>
      <!-- Book Cover: 124px wide x ~170px height -->
      <NuxtLink
        :to="book.isSeed ? '#' : `/book/${book.slug}`"
        class="block relative aspect-[1/1.37] rounded-book overflow-hidden bg-stone-100 book-cover-3d mb-2 sm:mb-2.5 cursor-pointer"
        @click="handleCardClick"
      >
        <!-- Fallback Jacket -->
        <div
          v-if="imageFailed || !coverImage"
          class="w-full h-full flex flex-col justify-between p-2 bg-gradient-to-br from-[#052219] to-[#0C3A2B] text-white text-left select-none"
        >
          <div class="space-y-0.5">
            <span class="text-[7px] font-mono uppercase tracking-widest text-[#2EE59D] font-bold block truncate">
              {{ book.category_name || 'Book' }}
            </span>
            <h4 class="font-display font-bold text-[10px] leading-tight line-clamp-3 text-white">
              {{ book.name }}
            </h4>
          </div>
          <span class="text-[7px] font-mono text-white/70 truncate block pt-0.5 border-t border-white/10">
            {{ book.author || 'Edition' }}
          </span>
        </div>

        <img
          v-else
          :src="coverImage"
          :alt="book.name"
          class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          width="124"
          height="170"
          referrerpolicy="no-referrer"
          @error="handleImageError"
        />

        <!-- Top-Right Percentage Discount Badge -->
        <span
          v-if="discountPercentage > 0"
          class="absolute top-1.5 right-1.5 bg-red-600 text-white font-mono font-extrabold text-[8px] px-1.5 py-0.5 rounded shadow-xs z-10"
        >
          -{{ discountPercentage }}%
        </span>

        <!-- Top-Left Promotional Badge Tag -->
        <span
          v-if="book.badge"
          class="absolute top-1.5 left-1.5 bg-[#052219] text-[#2EE59D] font-mono font-bold text-[7.5px] px-1.5 py-0.5 rounded uppercase z-10"
        >
          {{ formatBadge(book.badge) }}
        </span>
      </NuxtLink>

      <!-- Book Title -->
      <NuxtLink :to="book.isSeed ? '#' : `/book/${book.slug}`" class="block" @click="handleCardClick">
        <h3 class="font-display text-[10px] sm:text-[11px] font-bold text-slate-900 group-hover:text-[#F05A36] transition-colors line-clamp-1 leading-snug">
          {{ book.name }}
        </h3>
      </NuxtLink>

      <!-- Author -->
      <p class="text-[9.5px] text-slate-500 italic truncate mt-0.5">
        {{ displayAuthor }}
      </p>

      <!-- Format Toggle Pills (PDF and EPUB always identical price) -->
      <div class="flex items-center justify-start gap-1 pt-1.5 flex-wrap">
        <template v-if="availableFormats.length > 1">
          <button
            v-for="fmt in availableFormats"
            :key="fmt.id"
            type="button"
            class="text-[7px] sm:text-[7.5px] font-mono font-bold uppercase px-1.5 py-0.5 rounded-full transition-all cursor-pointer select-none leading-none"
            :class="activeFormat?.id === fmt.id ? 'bg-[#052219] text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
            @click="selectFormat(fmt.id, $event)"
          >
            {{ fmt.format === 'hardcopy' ? 'Print' : fmt.format.toUpperCase() }}
          </button>
        </template>
        <span
          v-else
          class="text-[7px] sm:text-[7.5px] font-mono font-medium uppercase tracking-wider text-[#6B7280] bg-slate-100 px-1.5 py-0.5 rounded-full leading-none"
        >
          {{ activeFormat?.format === 'hardcopy' ? 'Print' : (activeFormat ? activeFormat.format.toUpperCase() : 'Print') }}
        </span>
      </div>
    </div>

    <!-- Bottom Bar: Stable Price Box (Zero Layout Shift) + Add Button -->
    <div class="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
      <div class="min-w-0 flex flex-col justify-center min-h-[22px]">
        <!-- Strikethrough Original Price: Active for both physical and digital sales -->
        <span
          v-if="originalPrice && originalPrice > currentPrice"
          class="text-[8px] sm:text-[8.5px] text-slate-400 line-through font-mono block leading-none"
        >
          {{ formatCurrency(originalPrice) }}
        </span>
        <!-- Current Selling Price -->
        <span
          class="text-[10px] sm:text-[11px] font-extrabold font-mono leading-tight"
          :class="originalPrice && originalPrice > currentPrice ? 'text-red-600' : 'text-[#141E1A]'"
        >
          {{ formatCurrency(currentPrice) }}
        </span>
      </div>

      <button
        type="button"
        class="w-6 h-6 sm:w-6.5 sm:h-6.5 rounded-lg bg-[#052219] hover:bg-[#F05A36] text-white flex items-center justify-center transition-colors cursor-pointer active:scale-95 shadow-xs flex-shrink-0"
        :title="book.isSeed ? 'Request Book' : 'Add to Cart'"
        @click="handleAddToCart"
      >
        <ShoppingBag :size="12" />
      </button>
    </div>
  </div>
</template>