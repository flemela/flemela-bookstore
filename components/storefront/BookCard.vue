<!-- components/storefront/BookCard.vue -->
<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Zap, Flame, Star, Tag, Clock } from 'lucide-vue-next';
import { useCart } from '~/composables/useCart';
import { useToast } from '~/composables/useToast';
import type { Book, ProductFormat, BookFormatType } from '~/types';

interface Props {
  book: Book;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'requestSeed', title: string, author?: string): void;
  (e: 'request-seed', title: string, author?: string): void;
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

// Format-specific display label helper
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

// Social proof rating
const displayRating = computed(() => {
  if (props.book.rating) return Number(props.book.rating).toFixed(1);
  const hash = (props.book.id || props.book.name)
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return (4.6 + (hash % 5) * 0.1).toFixed(1);
});

const reviewCount = computed(() => {
  if (props.book.reviews_count) return props.book.reviews_count;
  const hash = (props.book.name || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return 40 + (hash % 180);
});

// Editorial badges
type BadgeInfo = { icon: any; label: string } | null;

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
  emit('requestSeed', props.book.name, props.book.author || undefined);
  emit('request-seed', props.book.name, props.book.author || undefined);
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
    emit('request-seed', props.book.name, props.book.author || undefined);
  }
}

function handleAddToCart(event: Event): void {
  event.preventDefault();
  event.stopPropagation();

  if (props.book.isSeed) {
    emit('requestSeed', props.book.name, props.book.author || undefined);
    emit('request-seed', props.book.name, props.book.author || undefined);
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
  <div
    class="w-full bg-theme-surface text-theme-ink rounded-2xl p-3.5 sm:p-4 border border-theme-border hover:border-theme-border-strong shadow-card hover:shadow-medium transition-all duration-300 flex flex-col justify-between group select-none text-left"
  >
    <!-- TOP SECTION: Cover Jacket & Badges -->
    <div class="relative w-full">
      <!-- Cover Container with 1/1.37 Publishing Aspect Ratio -->
      <NuxtLink
        :to="book.isSeed ? '#' : `/book/${book.slug}`"
        class="block relative w-full aspect-[1/1.37] rounded-xl overflow-hidden bg-theme-bg shadow-sm cursor-pointer"
        @click="handleCardClick"
      >
        <!-- 3D Book Spine Left-Edge Gradient -->
        <div
          class="absolute inset-y-0 left-0 w-3.5 bg-gradient-to-r from-black/25 via-black/10 to-transparent z-10 pointer-events-none"
        />

        <div
          v-if="imageFailed || !coverImage"
          class="w-full h-full flex flex-col justify-between p-2.5 bg-gradient-to-br from-theme-dark to-theme-forest text-white text-left select-none"
        >
          <div class="space-y-0.5">
            <span class="text-[10px] font-mono uppercase tracking-widest text-theme-turquoise font-bold block truncate">
              {{ book.category_name || 'Book' }}
            </span>
            <h4 class="font-display font-bold text-xs leading-tight line-clamp-3 text-white">
              {{ book.name }}
            </h4>
          </div>
          <span class="text-[10px] font-mono text-white/70 truncate block pt-0.5 border-t border-white/10">
            {{ book.author || 'Edition' }}
          </span>
        </div>

        <img
          v-else
          :src="coverImage"
          :alt="book.name"
          class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ease-out"
          loading="lazy"
          referrerpolicy="no-referrer"
          @error="handleImageError"
        />

        <!-- Top-Left Editorial Pill Badge -->
        <div
          v-if="badgeInfo"
          class="absolute top-2 left-2 bg-theme-dark/90 backdrop-blur-xs text-white text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm z-20 flex items-center gap-1"
        >
          <component :is="badgeInfo.icon" :size="10" />
          <span>{{ badgeInfo.label }}</span>
        </div>
      </NuxtLink>

      <!-- Top-Right 16-Point Starburst Medallion (Upright Monospace Discount, No 'OFF') -->
      <div
        v-if="discountPercentage > 0"
        class="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 z-30 pointer-events-none w-16 h-16 sm:w-[70px] sm:h-[70px] flex items-center justify-center filter drop-shadow-md"
      >
        <svg
          viewBox="0 0 100 100"
          class="w-full h-full fill-theme-coral text-theme-coral"
        >
          <polygon
            points="50,0 58.4,7.8 69.1,3.8 73.9,14.3 85.4,14.6 86.4,26.4 96.2,30.9 93.3,42.4 100,50 93.3,57.6 96.2,69.1 86.4,73.6 85.4,85.4 73.9,85.7 69.1,96.2 58.4,92.2 50,100 41.6,92.2 30.9,96.2 26.1,85.7 14.6,85.4 13.6,73.6 3.8,69.1 6.7,57.6 0,50 6.7,42.4 3.8,30.9 13.6,26.4 14.6,14.6 26.1,14.3 30.9,3.8 41.6,7.8"
          />
        </svg>
        <span
          class="absolute font-mono font-black text-white text-[15px] sm:text-[17px] tracking-tighter"
        >
          -{{ discountPercentage }}%
        </span>
      </div>
    </div>

    <!-- MIDDLE SECTION: Format Tabs, Title, Author & Price -->
    <div class="mt-3.5 flex flex-col flex-grow justify-between">
      <div>
        <!-- Format Selector (Enlarged, Bottom-Border Only) & Category -->
        <div class="flex items-center justify-between border-b border-theme-border/60 pb-1.5 mb-2">
          <!-- Format Tabs (No outer pill borders, bottom border only) -->
          <div v-if="availableFormats.length > 1" class="flex items-center gap-2">
            <button
              v-for="fmt in availableFormats"
              :key="fmt.id"
              type="button"
              class="text-xs sm:text-[13px] pb-0.5 transition-colors cursor-pointer"
              :class="
                activeFormat?.id === fmt.id
                  ? 'border-b-2 border-theme-coral text-theme-ink font-bold'
                  : 'border-b-2 border-transparent text-theme-muted hover:text-theme-ink font-medium'
              "
              @click="selectFormat(fmt.id, $event)"
            >
              {{ getFormatDisplayLabel(fmt) }}
            </button>
          </div>

          <!-- Single Format Display -->
          <div v-else-if="activeFormat" class="flex items-center gap-1.5 text-theme-coral">
            <svg
              class="w-3.5 h-3.5 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <span class="text-xs sm:text-[13px] font-bold border-b-2 border-theme-coral pb-0.5">
              {{ getFormatDisplayLabel(activeFormat) }}
            </span>
          </div>

          <!-- Category Name -->
          <span class="text-[11px] sm:text-xs text-theme-muted truncate max-w-[90px] sm:max-w-[110px]">
            {{ book.category_name || 'General' }}
          </span>
        </div>

        <!-- Book Title (Fraunces Display font, strictly single-line truncated) -->
        <NuxtLink
          :to="book.isSeed ? '#' : `/book/${book.slug}`"
          class="block"
          @click="handleCardClick"
        >
          <h3
            class="font-display font-extrabold text-base sm:text-lg lg:text-xl text-theme-ink group-hover:text-theme-coral transition-colors truncate block leading-tight"
            :title="book.name"
          >
            {{ book.name }}
          </h3>
        </NuxtLink>

        <!-- Author Line -->
        <p class="text-xs sm:text-[13px] text-theme-muted italic truncate mt-0.5">
          {{ displayAuthor }}
        </p>

        <!-- Social Proof: 5 Amber Trust Stars -->
        <div class="flex items-center gap-1.5 mt-1.5">
          <div class="flex items-center text-amber-400 text-xs">
            <span v-for="i in 5" :key="i">★</span>
          </div>
          <span class="font-mono text-xs font-bold text-theme-ink">
            {{ displayRating }}
          </span>
          <span class="text-[11px] text-theme-muted">
            ({{ reviewCount }})
          </span>
        </div>
      </div>

      <!-- Pricing Architecture: Strikethrough Anchor (Left), Selling Price (Right) -->
      <div class="mt-3.5 pt-2 border-t border-theme-border/40 flex items-baseline justify-between">
        <div class="flex items-baseline gap-2">
          <!-- Slashed Anchor Price (Left) in Red -->
          <span
            v-if="originalPrice && originalPrice > currentPrice"
            class="text-xs sm:text-sm font-semibold font-mono text-theme-coral line-through decoration-theme-coral"
          >
            KSh {{ originalPrice.toLocaleString('en-KE') }}
          </span>

          <!-- Current Selling Price (Right) in Bold Tabular Ink -->
          <span class="font-mono font-extrabold text-lg sm:text-xl text-theme-ink tracking-tight">
            KSh {{ currentPrice.toLocaleString('en-KE') }}
          </span>
        </div>

        <span
          v-if="activeFormat?.format === 'hardcopy' && (activeFormat?.stock ?? book.stock ?? 10) <= 5"
          class="text-[10px] font-mono font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded"
        >
          {{ activeFormat?.stock ?? book.stock }} left
        </span>
      </div>

      <!-- BOTTOM SECTION: Primary Action Button with Solid/Filled Cart Icon -->
      <button
        type="button"
        class="mt-3 w-full py-3.5 px-4 rounded-xl bg-theme-coral hover:bg-theme-coral-hover active:bg-theme-coral text-white font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-[0.98]"
        :title="book.isSeed ? 'Request Book' : (activeFormat?.format === 'hardcopy' ? 'Order Copy' : 'Download')"
        :aria-label="book.isSeed ? 'Request Book' : (activeFormat?.format === 'hardcopy' ? 'Order Copy' : 'Download')"
        @click="handleAddToCart"
      >
        <!-- Solid Filled Cart Icon -->
        <svg
          class="w-4 h-4 shrink-0 fill-current"
          viewBox="0 0 24 24"
        >
          <path
            d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1.003 1.003 0 0 0 20 4H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"
          />
        </svg>
        <span>{{ book.isSeed ? 'Request Book' : (activeFormat?.format === 'hardcopy' ? 'Order Copy' : 'Download') }}</span>
      </button>
    </div>
  </div>
</template>