<template>
  <div
    class="group relative flex flex-col justify-between bg-theme-surface rounded-2xl p-3.5 sm:p-4 border border-theme-border shadow-card hover:border-theme-border-strong hover:shadow-medium transition-all duration-300"
  >
    <!-- TOP SECTION: Cover Jacket & Badges -->
    <div class="relative w-full">
      <!-- Cover Container with 1/1.37 Publishing Aspect Ratio -->
      <div
        class="relative w-full aspect-[1/1.37] rounded-xl overflow-hidden bg-theme-bg shadow-sm"
      >
        <!-- 3D Book Spine Left-Edge Gradient -->
        <div
          class="absolute inset-y-0 left-0 w-3.5 bg-gradient-to-r from-black/25 via-black/10 to-transparent z-10 pointer-events-none"
        />

        <!-- Cover Image with Smooth Hover Zoom -->
        <NuxtLink :to="`/books/${book.slug}`" class="block w-full h-full">
          <img
            :src="coverImageUrl"
            :alt="book.name"
            loading="lazy"
            class="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        </NuxtLink>

        <!-- Top-Left Editorial Pill Badge -->
        <div
          v-if="editorialBadge"
          class="absolute top-2 left-2 z-20 flex items-center gap-1 px-2 py-0.5 rounded-full bg-theme-dark/90 backdrop-blur-xs text-white text-[10px] font-mono font-bold uppercase tracking-wider shadow-sm"
        >
          <span v-if="editorialBadge.icon" class="text-xs">{{ editorialBadge.icon }}</span>
          <span>{{ editorialBadge.text }}</span>
        </div>
      </div>

      <!-- Top-Right 16-Point Starburst Medallion (Anchored over corner) -->
      <div
        v-if="discountPercentage > 0"
        class="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 z-30 pointer-events-none w-16 h-16 sm:w-[70px] sm:h-[70px] flex items-center justify-center filter drop-shadow-md"
      >
        <!-- 16-Point Circular Zigzag Starburst SVG -->
        <svg
          viewBox="0 0 100 100"
          class="w-full h-full fill-theme-accent text-theme-accent"
        >
          <polygon
            points="50,0 58.4,7.8 69.1,3.8 73.9,14.3 85.4,14.6 86.4,26.4 96.2,30.9 93.3,42.4 100,50 93.3,57.6 96.2,69.1 86.4,73.6 85.4,85.4 73.9,85.7 69.1,96.2 58.4,92.2 50,100 41.6,92.2 30.9,96.2 26.1,85.7 14.6,85.4 13.6,73.6 3.8,69.1 6.7,57.6 0,50 6.7,42.4 3.8,30.9 13.6,26.4 14.6,14.6 26.1,14.3 30.9,3.8 41.6,7.8"
          />
        </svg>

        <!-- Upright Monospace Discount Text (Strictly no 'OFF') -->
        <span
          class="absolute font-mono font-black text-white text-[15px] sm:text-[17px] tracking-tighter"
        >
          -{{ discountPercentage }}%
        </span>
      </div>
    </div>

    <!-- MIDDLE SECTION: Formats, Metadata, Title, Rating, Price -->
    <div class="mt-3.5 flex flex-col flex-grow justify-between">
      <div>
        <!-- Format Selector (Enlarged, Border-Bottom-Only Tab Style) & Category -->
        <div
          class="flex items-center justify-between border-b border-theme-border/60 pb-1.5 mb-2"
        >
          <!-- Multiple Formats Available -->
          <div v-if="formatsList.length > 1" class="flex items-center gap-2">
            <button
              v-for="fmt in formatsList"
              :key="fmt.id"
              type="button"
              @click.stop="selectedFormatId = fmt.id"
              :class="[
                'text-xs sm:text-[13px] pb-0.5 transition-colors cursor-pointer',
                selectedFormatId === fmt.id
                  ? 'border-b-2 border-theme-accent text-theme-ink font-bold'
                  : 'border-b-2 border-transparent text-theme-muted hover:text-theme-ink font-medium'
              ]"
            >
              {{ fmt.label }}
            </button>
          </div>

          <!-- Single / Default Format Display -->
          <div v-else class="flex items-center gap-1.5 text-theme-accent">
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
            <span class="text-xs sm:text-[13px] font-bold border-b-2 border-theme-accent pb-0.5">
              {{ activeFormatLabel }}
            </span>
          </div>

          <!-- Category Name -->
          <span class="text-[11px] sm:text-xs text-theme-muted truncate max-w-[90px] sm:max-w-[110px]">
            {{ book.category_name || 'General' }}
          </span>
        </div>

        <!-- Book Title (Fraunces Display, Strict Single-Line Guard) -->
        <NuxtLink :to="`/books/${book.slug}`" class="block">
          <h3
            class="font-display font-extrabold text-base sm:text-lg lg:text-xl text-theme-ink leading-tight truncate hover:text-theme-accent transition-colors"
            :title="book.name"
          >
            {{ book.name }}
          </h3>
        </NuxtLink>

        <!-- Author Line -->
        <p class="text-xs sm:text-[13px] text-theme-muted italic truncate mt-0.5">
          {{ displayAuthor }}
        </p>

        <!-- Social Proof Trust Stars (Randomized / Deterministic 4.6–5.0) -->
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

      <!-- Pricing Architecture (Strikethrough Left, Selling Price Right) -->
      <div class="mt-3.5 pt-2 border-t border-theme-border/40 flex items-baseline justify-between">
        <div class="flex items-baseline gap-2">
          <!-- Slashed Anchor Price (Left) in Crimson Red -->
          <span
            v-if="effectiveCompareAtPrice && effectiveCompareAtPrice > effectivePrice"
            class="text-xs sm:text-sm font-semibold font-mono text-theme-accent line-through decoration-theme-accent"
          >
            KSh {{ effectiveCompareAtPrice.toLocaleString('en-KE') }}
          </span>

          <!-- Current Selling Price (Right) in Bold Tabular Ink -->
          <span class="font-mono font-extrabold text-lg sm:text-xl text-theme-ink tracking-tight">
            KSh {{ effectivePrice.toLocaleString('en-KE') }}
          </span>
        </div>

        <span
          v-if="isHardcopy && stockCount > 0 && stockCount <= 5"
          class="text-[10px] font-mono font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded"
        >
          {{ stockCount }} left
        </span>
      </div>

      <!-- BOTTOM SECTION: Primary CTA (Add Button with Solid Cart Icon) -->
      <button
        type="button"
        @click="handleAddToCart"
        class="mt-3 w-full py-3.5 px-4 rounded-xl bg-theme-accent hover:bg-theme-accent-hover active:bg-theme-accent-active active:scale-[0.98] text-white font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
      >
        <!-- Solid / Filled Shopping Cart Icon -->
        <svg
          class="w-4 h-4 shrink-0 fill-current"
          viewBox="0 0 24 24"
        >
          <path
            d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1.003 1.003 0 0 0 20 4H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"
          />
        </svg>
        <span>{{ buttonLabel }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

export interface ProductFormat {
  id: string;
  product_id?: string;
  format: 'pdf' | 'epub' | 'hardcopy' | string;
  price: number;
  compare_at_price?: number | null;
  file_url?: string | null;
  stock?: number | null;
  [key: string]: any;
}

export interface ProductImage {
  image_url: string;
  image_public_id?: string;
  sort_order?: number;
  [key: string]: any;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku?: string | null;
  author?: string | null;
  description?: string | null;
  category_name?: string | null;
  category_id?: string | null;
  price: number;
  compare_at_price?: number | null;
  badge?: string | null;
  stock?: number | null;
  images?: (ProductImage | string)[] | null;
  formats?: ProductFormat[] | null;
  [key: string]: any;
}

const props = defineProps<{
  book: Product;
  customRating?: number;
}>();

const emit = defineEmits<{
  (e: 'add-to-cart', payload: { book: Product; formatId?: string; price: number; format: string }): void;
  (e: 'request-seed', title?: string, author?: string): void;
}>();

// Formats resolution
const formatsList = computed(() => {
  if (!props.book.formats || props.book.formats.length === 0) return [];
  return props.book.formats.map((f) => ({
    id: f.id,
    rawFormat: f.format,
    label: f.format === 'pdf' ? 'PDF' : f.format === 'epub' ? 'EPUB' : 'Hardcopy',
    price: f.price,
    compare_at_price: f.compare_at_price ?? null,
    stock: f.stock ?? null,
  }));
});

const selectedFormatId = ref<string>(
  formatsList.value.length > 0 ? formatsList.value[0].id : ''
);

const activeFormat = computed(() => {
  if (formatsList.value.length === 0) return null;
  return formatsList.value.find((f) => f.id === selectedFormatId.value) || formatsList.value[0];
});

const activeFormatLabel = computed(() => {
  if (activeFormat.value) {
    return activeFormat.value.rawFormat === 'pdf'
      ? 'eBook (PDF)'
      : activeFormat.value.rawFormat === 'epub'
      ? 'eBook (EPUB)'
      : 'Hardcopy';
  }
  return 'eBook (PDF)';
});

const isHardcopy = computed(() => activeFormat.value?.rawFormat === 'hardcopy');

const stockCount = computed(() => {
  if (isHardcopy.value && activeFormat.value?.stock !== undefined && activeFormat.value?.stock !== null) {
    return activeFormat.value.stock;
  }
  return props.book.stock ?? 10;
});

// Price resolution
const effectivePrice = computed(() => {
  return activeFormat.value ? activeFormat.value.price : props.book.price;
});

const effectiveCompareAtPrice = computed(() => {
  if (activeFormat.value?.compare_at_price) {
    return activeFormat.value.compare_at_price;
  }
  return props.book.compare_at_price ?? null;
});

// Discount Percentage
const discountPercentage = computed(() => {
  const current = effectivePrice.value;
  const original = effectiveCompareAtPrice.value;
  if (!original || original <= current) return 0;
  return Math.round(((original - current) / original) * 100);
});

// Cover Image URL (supports string[] or ProductImage[])
const coverImageUrl = computed(() => {
  if (props.book.images && props.book.images.length > 0) {
    const first = props.book.images[0];
    if (typeof first === 'string') return first;
    if (first && typeof first === 'object' && first.image_url) return first.image_url;
  }
  return 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800';
});

// Author String
const displayAuthor = computed(() => {
  if (props.book.author) return props.book.author;
  if (props.book.description && props.book.description.startsWith('By ')) {
    const match = props.book.description.match(/^By\s+([^<\n]+)/);
    if (match) return match[1].trim();
  }
  return 'Bestselling Author';
});

// Deterministic rating between 4.6 and 5.0
const displayRating = computed(() => {
  if (props.customRating) return props.customRating.toFixed(1);
  const hash = (props.book.id || props.book.name)
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const rating = 4.6 + (hash % 5) * 0.1;
  return rating.toFixed(1);
});

const reviewCount = computed(() => {
  const hash = (props.book.name || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return 40 + (hash % 180);
});

// Editorial Badges
const editorialBadge = computed(() => {
  const badge = props.book.badge;
  if (badge === 'NO1_PICK') return { text: '#1 PICK', icon: '★' };
  if (badge === 'FLASH_SALE') return { text: 'FLASH', icon: '⚡' };
  if (badge === 'BESTSELLER') return { text: 'BESTSELLER', icon: '🔥' };
  if (discountPercentage.value >= 30) return { text: 'DEAL', icon: '⚡' };
  return null;
});

const buttonLabel = computed(() => {
  if (isHardcopy.value) return 'Order Copy';
  return 'Download';
});

function handleAddToCart() {
  emit('add-to-cart', {
    book: props.book,
    formatId: activeFormat.value?.id,
    price: effectivePrice.value,
    format: activeFormat.value?.rawFormat || 'pdf',
  });
}
</script>