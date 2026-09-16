<template>
  <div
    class="group relative flex flex-col justify-between bg-theme-surface rounded-2xl p-4 border border-theme-border shadow-card hover:border-theme-border-strong hover:shadow-medium transition-all duration-300"
  >
    <!-- Cover Jacket Area -->
    <div class="relative w-full">
      <div
        class="relative w-full aspect-[1/1.37] rounded-xl overflow-hidden bg-theme-bg shadow-sm"
      >
        <!-- 3D Spine Gradient -->
        <div
          class="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/20 via-black/5 to-transparent z-10 pointer-events-none"
        />

        <NuxtLink :to="`/books/${book.slug}`" class="block w-full h-full">
          <img
            :src="coverImageUrl"
            :alt="book.name"
            loading="lazy"
            class="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
          />
        </NuxtLink>

        <!-- Top-Left Editorial Badge -->
        <div
          v-if="editorialBadge"
          class="absolute top-2 left-2 z-20 flex items-center gap-1 px-2 py-0.5 rounded-full bg-theme-dark/90 backdrop-blur-xs text-white text-[10px] font-mono font-bold uppercase tracking-wider"
        >
          <span>{{ editorialBadge }}</span>
        </div>

        <!-- Top-Right Discount Badge -->
        <div
          v-if="discountPercentage > 0"
          class="absolute top-2 right-2 z-20 px-2 py-0.5 rounded-full bg-theme-accent text-white text-[11px] font-mono font-black"
        >
          -{{ discountPercentage }}%
        </div>
      </div>
    </div>

    <!-- Book Information & Details -->
    <div class="mt-3.5 flex flex-col flex-grow justify-between">
      <div>
        <!-- Format Pills & Category -->
        <div class="flex items-center justify-between gap-1 mb-2">
          <!-- Format Pills -->
          <div v-if="formatsList.length > 1" class="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            <button
              v-for="fmt in formatsList"
              :key="fmt.id"
              type="button"
              @click.stop="selectedFormatId = fmt.id"
              :class="[
                'text-[11px] font-semibold px-2 py-0.5 rounded-md border transition-all cursor-pointer',
                selectedFormatId === fmt.id
                  ? 'bg-theme-ink text-white border-theme-ink'
                  : 'bg-theme-bg text-theme-muted border-theme-border hover:border-theme-border-strong'
              ]"
            >
              {{ fmt.label }}
            </button>
          </div>
          <div v-else class="text-xs font-bold text-theme-accent">
            {{ activeFormatLabel }}
          </div>

          <!-- Category -->
          <span class="text-[11px] text-theme-muted truncate max-w-[100px]">
            {{ book.category_name || 'General' }}
          </span>
        </div>

        <!-- Book Title -->
        <NuxtLink :to="`/books/${book.slug}`" class="block">
          <h3
            class="font-display font-bold text-base text-theme-ink leading-snug line-clamp-2 hover:text-theme-accent transition-colors"
            :title="book.name"
          >
            {{ book.name }}
          </h3>
        </NuxtLink>

        <!-- Author Line -->
        <p class="text-xs text-theme-muted italic truncate mt-1">
          {{ displayAuthor }}
        </p>

        <!-- Rating Stars -->
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

      <!-- Price & Value Anchoring -->
      <div class="mt-3 pt-2 border-t border-theme-border/60 flex items-baseline justify-between">
        <div class="flex items-baseline gap-2">
          <span class="font-mono font-extrabold text-lg text-theme-ink">
            KSh {{ effectivePrice.toLocaleString('en-KE') }}
          </span>
          <span
            v-if="effectiveCompareAtPrice && effectiveCompareAtPrice > effectivePrice"
            class="text-xs font-mono text-theme-muted line-through"
          >
            KSh {{ effectiveCompareAtPrice.toLocaleString('en-KE') }}
          </span>
        </div>

        <span
          v-if="isHardcopy && stockCount > 0 && stockCount <= 5"
          class="text-[10px] font-mono font-bold text-amber-600"
        >
          {{ stockCount }} left
        </span>
      </div>

      <!-- Primary Action CTA -->
      <button
        type="button"
        @click="handleAddToCart"
        class="mt-3 w-full py-2.5 px-4 rounded-xl bg-theme-accent hover:bg-theme-accent-hover active:scale-[0.99] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
      >
        <svg
          class="w-4 h-4 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
        <span>{{ isHardcopy ? 'Order Copy' : 'Download' }}</span>
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

export interface Book {
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
  book: Book;
  customRating?: number;
}>();

const emit = defineEmits<{
  (e: 'add-to-cart', payload: { book: Book; formatId?: string; price: number; format: string }): void;
  (e: 'request-seed', title?: string, author?: string): void;
}>();

// Formats List
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

// Prices
const effectivePrice = computed(() => {
  return activeFormat.value ? activeFormat.value.price : props.book.price;
});

const effectiveCompareAtPrice = computed(() => {
  if (activeFormat.value?.compare_at_price) {
    return activeFormat.value.compare_at_price;
  }
  return props.book.compare_at_price ?? null;
});

const discountPercentage = computed(() => {
  const current = effectivePrice.value;
  const original = effectiveCompareAtPrice.value;
  if (!original || original <= current) return 0;
  return Math.round(((original - current) / original) * 100);
});

// Image URL
const coverImageUrl = computed(() => {
  if (props.book.images && props.book.images.length > 0) {
    const first = props.book.images[0];
    if (typeof first === 'string') return first;
    if (first && typeof first === 'object' && first.image_url) return first.image_url;
  }
  return 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800';
});

// Author
const displayAuthor = computed(() => {
  if (props.book.author) return props.book.author;
  if (props.book.description && props.book.description.startsWith('By ')) {
    const match = props.book.description.match(/^By\s+([^<\n]+)/);
    if (match) return match[1].trim();
  }
  return 'Bestselling Author';
});

// Rating & Reviews
const displayRating = computed(() => {
  if (props.customRating) return props.customRating.toFixed(1);
  const hash = (props.book.id || props.book.name)
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return (4.6 + (hash % 5) * 0.1).toFixed(1);
});

const reviewCount = computed(() => {
  const hash = (props.book.name || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return 40 + (hash % 180);
});

// Badge
const editorialBadge = computed(() => {
  const badge = props.book.badge;
  if (badge === 'NO1_PICK') return '#1 PICK';
  if (badge === 'FLASH_SALE') return 'FLASH';
  if (badge === 'BESTSELLER') return 'BESTSELLER';
  return null;
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