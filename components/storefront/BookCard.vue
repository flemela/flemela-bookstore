<!-- components/storefront/BookCard.vue -->
<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { ShoppingCart } from 'lucide-vue-next';
import { useCart } from '~/composables/useCart';
import { useToast } from '~/composables/useToast';
import type { Book, ProductFormat, BookFormatType } from '~/types';

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

// 1. Filter to available digital formats with valid files
const availableDigitalFormats = computed<ProductFormat[]>(() => {
  if (!props.book?.formats || props.book.formats.length === 0) return [];

  return props.book.formats.filter((f) => {
    const isDigital = f.format === 'pdf' || f.format === 'epub';
    if (!isDigital) return false;
    if (props.book.isSeed) return true;

    return Boolean(
      (f.file_url && f.file_url.trim().length > 0) ||
      (f.file_public_id && f.file_public_id.trim().length > 0)
    );
  });
});

const hasDigitalCopy = computed(() => availableDigitalFormats.value.length > 0);

// 2. Guaranteed Hardcopy Format
const hardcopyFormat = computed<ProductFormat | null>(() => {
  const existing = props.book?.formats?.find((f) => f.format === 'hardcopy');
  if (existing) return existing;

  if (hasDigitalCopy.value || props.book.price) {
    return {
      id: `synthetic-hardcopy-${props.book.id}`,
      product_id: props.book.id,
      format: 'hardcopy' as BookFormatType,
      price: props.book.price || 999,
      compare_at_price: props.book.compare_at_price || null,
      file_url: null,
      file_public_id: null,
      file_size_bytes: null,
      stock: props.book.stock ?? 10,
      created_at: props.book.created_at || '',
      updated_at: props.book.updated_at || '',
    };
  }

  return null;
});

// 3. Combined Formats (Ordered: Hardcopy first, then eBooks)
const availableFormats = computed<ProductFormat[]>(() => {
  const list: ProductFormat[] = [];
  if (hardcopyFormat.value) {
    list.push(hardcopyFormat.value);
  }
  list.push(...availableDigitalFormats.value);
  return list;
});

// Default selection: Hardcopy if available, else first digital format
watch(
  availableFormats,
  (fmts) => {
    imageFailed.value = false;
    if (fmts && fmts.length > 0) {
      if (!fmts.some((f) => f.id === selectedFormatId.value)) {
        selectedFormatId.value = fmts[0].id;
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

// Format-specific display label helper (type-safe exhaustive narrowing)
function getFormatDisplayLabel(fmt: ProductFormat): string {
  if (fmt.format === 'hardcopy') return 'Hardcopy';
  if (fmt.format === 'pdf') return 'eBook (PDF)';
  if (fmt.format === 'epub') return 'eBook (EPUB)';
  return String(fmt.format || '').toUpperCase();
}

// Pricing calculations
const pricing = computed(() => {
  const pBook = props.book.price ?? 0;
  const cpBook = props.book.compare_at_price ?? null;
  const hasParentSale = Boolean(cpBook && cpBook > pBook && pBook > 0);
  const parentDiscountRatio = hasParentSale && cpBook ? (cpBook - pBook) / cpBook : 0;

  const fmt = activeFormat.value;
  let p = fmt ? fmt.price : pBook;
  let cp: number | null = null;

  if (fmt) {
    if (fmt.compare_at_price && fmt.compare_at_price > fmt.price) {
      cp = fmt.compare_at_price;
    } else if (fmt.format === 'hardcopy') {
      cp = cpBook;
    } else if (hasParentSale && parentDiscountRatio > 0 && parentDiscountRatio < 1) {
      cp = Math.round(fmt.price / (1 - parentDiscountRatio));
    }
  } else {
    cp = cpBook;
  }

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
  const isPhysical = fmt?.format === 'hardcopy';
  const formatType: BookFormatType = fmt ? fmt.format : 'hardcopy';

  const isSynthetic = !fmt || fmt.id.startsWith('synthetic-');
  const validFormatId = isSynthetic ? '' : fmt.id;

  addItem({
    productId: props.book.id,
    formatId: validFormatId,
    title: props.book.name,
    format: formatType,
    price: currentPrice.value,
    compare_at_price: originalPrice.value,
    quantity: 1,
    deliveryMethod: isPhysical ? 'delivery' : 'digital',
    coverUrl: coverImage.value,
    author: props.book.author,
  });

  pushToast({
    message: `Added "${props.book.name}" (${formatType === 'hardcopy' ? 'Hardcopy' : formatType.toUpperCase()}) to cart!`,
    variant: 'success',
  });

  openDrawer();
}
</script>

<template>
  <div class="w-full max-w-none sm:max-w-[160px] bg-white text-[#141E1A] rounded-xl p-2.5 sm:p-3 shadow-card hover:shadow-high transition-all flex flex-col justify-between group select-none text-left border border-slate-100 hover:border-slate-200">
    <div>
      <!-- Book Cover -->
      <NuxtLink
        :to="book.isSeed ? '#' : `/book/${book.slug}`"
        class="block relative aspect-[1/1.37] rounded-book overflow-hidden bg-stone-100 book-cover-3d mb-2 sm:mb-2.5 cursor-pointer"
        @click="handleCardClick"
      >
        <div
          v-if="imageFailed || !coverImage"
          class="w-full h-full flex flex-col justify-between p-2 bg-gradient-to-br from-[#052219] to-[#0C3A2B] text-white text-left select-none"
        >
          <div class="space-y-0.5">
            <span class="text-[8px] font-mono uppercase tracking-widest text-[#2EE59D] font-bold block truncate">
              {{ book.category_name || 'Book' }}
            </span>
            <h4 class="font-display font-bold text-[11px] leading-tight line-clamp-3 text-white">
              {{ book.name }}
            </h4>
          </div>
          <span class="text-[8px] font-mono text-white/70 truncate block pt-0.5 border-t border-white/10">
            {{ book.author || 'Edition' }}
          </span>
        </div>

        <img
          v-else
          :src="coverImage"
          :alt="book.name"
          class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          width="132"
          height="170"
          referrerpolicy="no-referrer"
          @error="handleImageError"
        />

        <span
          v-if="discountPercentage > 0"
          class="absolute top-1.5 right-1.5 bg-red-600 text-white font-mono font-extrabold text-[9px] px-1.5 py-0.5 rounded shadow-xs z-10"
        >
          -{{ discountPercentage }}%
        </span>

        <span
          v-if="book.badge"
          class="absolute top-1.5 left-1.5 bg-[#052219] text-[#2EE59D] font-mono font-bold text-[8px] px-1.5 py-0.5 rounded uppercase z-10"
        >
          {{ formatBadge(book.badge) }}
        </span>
      </NuxtLink>

      <!-- Book Title -->
      <NuxtLink :to="book.isSeed ? '#' : `/book/${book.slug}`" class="block" @click="handleCardClick">
        <h3 class="font-display text-[11px] sm:text-xs font-bold text-slate-900 group-hover:text-[#E8750D] transition-colors line-clamp-1 leading-snug">
          {{ book.name }}
        </h3>
      </NuxtLink>

      <!-- Author -->
      <p class="text-[10px] text-slate-500 italic truncate mt-0.5">
        {{ displayAuthor }}
      </p>

      <!-- Stacked Format Selector with Brand Orange & Prices -->
      <div class="mt-2 space-y-1">
        <template v-if="availableFormats.length > 1">
          <button
            v-for="fmt in availableFormats"
            :key="fmt.id"
            type="button"
            class="w-full flex items-center justify-between px-2 py-1 rounded-lg text-[10px] sm:text-[10.5px] font-sans transition-all cursor-pointer select-none leading-none border"
            :class="
              activeFormat?.id === fmt.id
                ? 'bg-[#FFF7ED] border-[#E8750D] text-[#C25E00] font-extrabold shadow-2xs'
                : 'bg-slate-50/80 border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold'
            "
            @click="selectFormat(fmt.id, $event)"
          >
            <span class="truncate pr-1">{{ getFormatDisplayLabel(fmt) }}</span>
            <span class="font-mono font-bold tracking-tight text-[9.5px] flex-shrink-0" :class="activeFormat?.id === fmt.id ? 'text-[#C25E00]' : 'text-slate-600'">
              {{ formatCurrency(fmt.price) }}
            </span>
          </button>
        </template>
        <div
          v-else-if="activeFormat"
          class="w-full flex items-center justify-between px-2 py-1 rounded-lg text-[10px] font-sans font-bold bg-[#FFF7ED] border border-[#E8750D]/60 text-[#C25E00]"
        >
          <span class="truncate pr-1">{{ getFormatDisplayLabel(activeFormat) }}</span>
          <span class="font-mono font-bold text-[9.5px] flex-shrink-0">
            {{ formatCurrency(activeFormat.price) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Bottom Bar: Prices + Supermarket Shopping Cart Button -->
    <div class="pt-2 mt-2.5 border-t border-slate-100 flex items-end justify-between gap-1.5">
      <div class="min-w-0 flex flex-col justify-center">
        <!-- Red Strike-Through Price -->
        <span
          v-if="originalPrice && originalPrice > currentPrice"
          class="text-[10px] sm:text-[10.5px] text-red-600 line-through decoration-red-500 decoration-1 font-mono font-bold block leading-none mb-0.5"
        >
          {{ formatCurrency(originalPrice) }}
        </span>
        <!-- Bigger, Bolder, Solid Black Price -->
        <span class="text-xs sm:text-sm font-black font-mono leading-tight text-black tracking-tight">
          {{ formatCurrency(currentPrice) }}
        </span>
      </div>

      <!-- Supermarket Shopping Cart Action Button -->
      <button
        type="button"
        class="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#052219] hover:bg-[#E8750D] text-white flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-sm hover:shadow flex-shrink-0"
        :title="book.isSeed ? 'Request Book' : (activeFormat?.format === 'hardcopy' ? 'Add Hardcopy to Cart' : 'Add eBook to Cart')"
        :aria-label="book.isSeed ? 'Request Book' : (activeFormat?.format === 'hardcopy' ? 'Add Hardcopy to Cart' : 'Add eBook to Cart')"
        @click="handleAddToCart"
      >
        <ShoppingCart :size="14" class="transition-transform group-hover:scale-105" />
      </button>
    </div>
  </div>
</template>