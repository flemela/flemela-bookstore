<!-- components/storefront/BookCard.vue -->
<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { ShoppingCart, Zap, Flame, Star, Tag, Clock } from 'lucide-vue-next';
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

// Deterministic rating between 4.0 and 5.0
const bookRating = computed(() => {
  const str = props.book.id || props.book.name || 'book';
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const absHash = Math.abs(hash);
  const score = 4.0 + (absHash % 11) * 0.1;
  const reviews = 35 + (absHash % 245);
  return {
    rating: Math.min(5.0, Math.max(4.0, Number(score.toFixed(1)))),
    reviewsCount: reviews,
  };
});

// 1. Available digital formats
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

// 2. Hardcopy format
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

// 3. Combined formats
const availableFormats = computed<ProductFormat[]>(() => {
  const list: ProductFormat[] = [];
  if (hardcopyFormat.value) {
    list.push(hardcopyFormat.value);
  }
  list.push(...availableDigitalFormats.value);
  return list;
});

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

function getFormatDisplayLabel(fmt: ProductFormat): string {
  if (fmt.format === 'hardcopy') return 'Hardcopy';
  if (fmt.format === 'pdf') return 'eBook (PDF)';
  if (fmt.format === 'epub') return 'eBook (EPUB)';
  return String(fmt.format || '').toUpperCase();
}

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

type BadgeInfo = { icon: typeof Zap; label: string } | null;

function getBadgeInfo(badgeStr?: string | null): BadgeInfo {
  if (!badgeStr) return null;
  switch (badgeStr) {
    case 'FLASH_SALE':
      return { icon: Zap, label: 'FLASH' };
    case 'BESTSELLER':
      return { icon: Flame, label: 'BESTSELLER' };
    case 'NO1_PICK':
      return { icon: Star, label: '#1 PICK' };
    case 'DEAL_OF_WEEK':
      return { icon: Tag, label: 'DEAL' };
    case 'LIMITED_TIME':
      return { icon: Clock, label: 'LIMITED' };
    default:
      return { icon: Tag, label: badgeStr.replace(/_/g, ' ') };
  }
}

const badgeInfo = computed(() => getBadgeInfo(props.book.badge));

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
  <!-- Unified Card: The entire card elevates and scales as a single solid unit -->
  <div class="w-full h-full bg-white text-theme-ink rounded-2xl p-3.5 sm:p-4 shadow-card hover:shadow-xl hover:-translate-y-1.5 hover:scale-[1.01] hover:border-[#E8750D]/60 transition-all duration-200 flex flex-col justify-between group select-none text-left border border-theme-border relative">
    <div class="flex flex-col flex-1">
      
      <!-- Stage Alcove (Exact bounding dimension preserved: aspect-[1/1.37], mb-3; NO overflow: hidden) -->
      <div class="sunrise-book-stage relative mb-3 w-full aspect-[1/1.37] rounded-xl flex items-center justify-center p-4 sm:p-5">
        
        <!-- Multi-Planar 3D Physical Book Assembly (Rotated -24° with true 14px thickness) -->
        <NuxtLink
          :to="book.isSeed ? '#' : `/book/${book.slug}`"
          class="sunrise-3d-book-assembly block cursor-pointer"
          :aria-label="`View details for ${book.name}`"
          @click="handleCardClick"
        >
          <!-- 1. Directional Perspective Ground Shadow -->
          <div class="sunrise-3d-cast-shadow" aria-hidden="true" />

          <!-- 2. Back Cover Board (translateZ(-7px)) -->
          <div class="sunrise-3d-back-board" aria-hidden="true" />

          <!-- 3. Fore-Edge Page Block (Natural compressed paper block, rotateY(90deg)) -->
          <div class="sunrise-3d-pages-side" aria-hidden="true" />

          <!-- 4. Front Cover Board (translateZ(7px) with board bevel & overhang shadow) -->
          <div class="sunrise-3d-front bg-stone-100">
            <!-- Missing Cover Fallback -->
            <div
              v-if="imageFailed || !coverImage"
              class="w-full h-full flex flex-col justify-between p-2.5 bg-gradient-to-br from-[#052219] to-[#0C3A2B] text-white text-left select-none"
            >
              <div class="space-y-0.5">
                <span class="text-[9.5px] font-mono uppercase tracking-widest text-theme-turquoise font-bold block truncate">
                  {{ book.category_name || 'Book' }}
                </span>
                <h4 class="font-display font-bold text-xs sm:text-sm leading-tight line-clamp-3 text-white">
                  {{ book.name }}
                </h4>
              </div>
              <span class="text-[9.5px] font-mono text-white/70 truncate block pt-1 border-t border-white/10">
                {{ book.author || 'Edition' }}
              </span>
            </div>

            <!-- Cover Jacket Image -->
            <img
              v-else
              :src="coverImage"
              :alt="`Cover for ${book.name}`"
              class="w-full h-full object-cover"
              loading="lazy"
              width="128"
              height="186"
              referrerpolicy="no-referrer"
              @error="handleImageError"
            />

            <!-- Spine Roll & Debossed Joint Hinge Crease -->
            <div class="sunrise-3d-spine-crease" aria-hidden="true" />

            <!-- Laminate Sheen Reflection -->
            <div class="sunrise-3d-sheen" aria-hidden="true" />
          </div>

          <!-- Identity Badge (Top Left of Front Cover) -->
          <span
            v-if="badgeInfo"
            class="absolute top-1.5 left-2 bg-[#052219]/95 text-theme-turquoise font-mono font-bold text-[9px] px-1.5 py-0.5 rounded uppercase z-20 flex items-center gap-1 shadow-xs border border-theme-turquoise/20 pointer-events-none"
          >
            <component :is="badgeInfo.icon" :size="9" />
            {{ badgeInfo.label }}
          </span>
        </NuxtLink>

        <!-- Discount Starburst Medallion (Anchored cleanly to Stage Top-Right) -->
        <div
          v-if="discountPercentage > 0"
          class="absolute top-2.5 right-2.5 z-20 w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center pointer-events-none drop-shadow-[0_3px_8px_rgba(232,117,13,0.45)]"
          aria-hidden="true"
        >
          <svg viewBox="0 0 100 100" class="w-full h-full text-[#E8750D] fill-current">
            <polygon points="98,50 89.2,57.8 94.3,68.4 83.3,72.2 83.9,83.9 72.2,83.3 68.4,94.3 57.8,89.2 50,98 42.2,89.2 31.6,94.3 27.8,83.3 16.1,83.9 16.7,72.2 5.7,68.4 10.8,57.8 2,50 10.8,42.2 5.7,31.6 16.7,27.8 16.1,16.1 27.8,16.7 31.6,5.7 42.2,10.8 50,2 57.8,10.8 68.4,5.7 72.2,16.7 83.9,16.1 83.3,27.8 94.3,31.6 89.2,42.2" />
          </svg>
          <span class="absolute inset-0 flex items-center justify-center font-black font-mono text-[12px] sm:text-[13px] text-white tracking-tighter drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
            -{{ discountPercentage }}%
          </span>
        </div>
      </div>

      <!-- Book Title -->
      <NuxtLink :to="book.isSeed ? '#' : `/book/${book.slug}`" class="block" @click="handleCardClick">
        <h3
          class="font-display text-sm sm:text-base font-bold text-theme-ink group-hover:text-[#E8750D] transition-colors line-clamp-1 leading-snug"
          :title="book.name"
        >
          {{ book.name }}
        </h3>
      </NuxtLink>

      <!-- Author -->
      <p class="text-xs text-theme-muted italic truncate mt-0.5">
        {{ displayAuthor }}
      </p>

      <!-- Star Rating Row -->
      <div class="flex items-center gap-1.5 mt-1.5 select-none" aria-label="Rating">
        <div class="flex items-center gap-0.5" aria-hidden="true">
          <Star
            v-for="s in 5"
            :key="s"
            :size="11"
            :class="s <= Math.round(bookRating.rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-300 fill-slate-100'"
          />
        </div>
        <span class="text-[11px] font-mono font-bold text-slate-700 leading-none">
          {{ bookRating.rating.toFixed(1) }}
        </span>
        <span class="text-[10px] font-mono text-slate-400 leading-none">
          ({{ bookRating.reviewsCount }})
        </span>
      </div>

      <!-- Format Selector Pills -->
      <div class="mt-3 space-y-1.5" role="radiogroup" aria-label="Reading format selection">
        <template v-if="availableFormats.length > 1">
          <button
            v-for="fmt in availableFormats"
            :key="fmt.id"
            type="button"
            role="radio"
            :aria-checked="activeFormat?.id === fmt.id"
            class="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs sm:text-[13px] font-sans transition-all cursor-pointer select-none leading-tight border"
            :class="
              activeFormat?.id === fmt.id
                ? 'border-[#E8750D] bg-[#FFF7ED] text-[#C25E00] font-extrabold shadow-xs ring-1 ring-[#E8750D]/30'
                : 'border-slate-200 bg-slate-50/90 text-slate-700 hover:border-orange-300 hover:bg-orange-50/40 font-bold'
            "
            @click="selectFormat(fmt.id, $event)"
          >
            <span class="truncate pr-1">{{ getFormatDisplayLabel(fmt) }}</span>
            <span
              class="font-mono font-black text-xs sm:text-[13px] flex-shrink-0"
              :class="activeFormat?.id === fmt.id ? 'text-[#B84A00]' : 'text-slate-700'"
            >
              {{ formatCurrency(fmt.price) }}
            </span>
          </button>
        </template>
        <div
          v-else-if="activeFormat"
          class="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border-2 border-[#E8750D] text-xs sm:text-[13px] font-sans font-extrabold bg-[#FFF7ED] text-[#C25E00] shadow-xs"
        >
          <span class="truncate pr-1">{{ getFormatDisplayLabel(activeFormat) }}</span>
          <span class="font-mono font-black text-xs sm:text-[13px] flex-shrink-0 text-[#B84A00]">
            {{ formatCurrency(activeFormat.price) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Bottom Bar: Price Row + Add to Cart Button -->
    <div class="pt-3 mt-3 border-t border-theme-border flex flex-col gap-2">
      <div class="flex items-baseline gap-1.5">
        <span
          v-if="originalPrice && originalPrice > currentPrice"
          class="text-xs sm:text-sm text-slate-400 line-through decoration-slate-400 decoration-1 font-mono font-bold leading-none"
        >
          {{ formatCurrency(originalPrice) }}
        </span>
        <span class="text-base sm:text-lg font-black font-mono leading-tight text-theme-ink tracking-tight">
          {{ formatCurrency(currentPrice) }}
        </span>
      </div>

      <button
        type="button"
        class="w-full flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-b from-[#F07514] via-[#E86C0E] to-[#D85F06] hover:from-[#E86C0E] hover:via-[#DE6007] hover:to-[#C85202] active:from-[#C85202] active:to-[#B24400] text-white font-bold text-xs sm:text-sm py-2.5 transition-all duration-200 cursor-pointer active:scale-95 shadow-xs hover:shadow border-t border-white/20 focus-visible:outline-2 focus-visible:outline-[#E8750D]"
        :title="book.isSeed ? 'Request Book' : (activeFormat?.format === 'hardcopy' ? 'Add Hardcopy to Cart' : 'Add eBook to Cart')"
        :aria-label="book.isSeed ? 'Request Book' : (activeFormat?.format === 'hardcopy' ? 'Add Hardcopy to Cart' : 'Add eBook to Cart')"
        @click="handleAddToCart"
      >
        <ShoppingCart :size="15" fill="currentColor" class="transition-transform group-hover:scale-105" />
        <span>{{ book.isSeed ? 'Request' : 'Add' }}</span>
      </button>
    </div>
  </div>
</template>