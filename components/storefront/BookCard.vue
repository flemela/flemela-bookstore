<!-- components/storefront/BookCard.vue -->
<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Star } from 'lucide-vue-next';
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

watch(
  () => props.book,
  (newBook) => {
    imageFailed.value = false;
    if (newBook?.formats && newBook.formats.length > 0) {
      if (!newBook.formats.some((f) => f.id === selectedFormatId.value)) {
        const sorted = [...newBook.formats].sort((a, b) => a.price - b.price);
        selectedFormatId.value = sorted[0].id;
      }
    } else {
      selectedFormatId.value = '';
    }
  },
  { immediate: true }
);

const availableFormats = computed<ProductFormat[]>(() => {
  return props.book?.formats || [];
});

const activeFormat = computed<ProductFormat | undefined>(() => {
  if (!props.book?.formats || props.book.formats.length === 0) return undefined;
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
  return props.book.compare_at_price || null;
});

const discountPercentage = computed<number>(() => {
  const orig = originalPrice.value;
  const curr = currentPrice.value;
  if (!orig || orig <= curr || curr <= 0) return 0;
  return Math.round(((orig - curr) / orig) * 100);
});

const coverImage = computed(() => {
  if (!props.book) return null;
  const rawImg: unknown = props.book.images?.[0];

  if (typeof rawImg === 'string' && rawImg.trim().length > 5) {
    return rawImg.trim();
  }
  if (rawImg && typeof rawImg === 'object' && 'image_url' in rawImg) {
    const url = (rawImg as { image_url?: string }).image_url;
    if (typeof url === 'string' && url.trim().length > 5) return url.trim();
  }
  const fallback = (props.book as any).cover_image_url;
  if (typeof fallback === 'string' && fallback.trim().length > 5) return fallback.trim();
  return null;
});

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
  <div class="flex flex-col items-center text-center group select-none max-w-[165px] sm:max-w-[180px] mx-auto w-full transition-all duration-300">
    <!-- Book Cover Frame -->
    <NuxtLink
      :to="book.isSeed ? '#' : `/book/${book.slug}`"
      class="block relative w-full aspect-[1/1.45] rounded-lg overflow-visible mb-2.5 transition-transform duration-300 group-hover:-translate-y-1.5 cursor-pointer"
      @click="handleCardClick"
    >
      <!-- Circular Red -XX% Badge -->
      <div
        v-if="discountPercentage > 0"
        class="absolute -top-2 -left-2 z-20 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#E53935] text-white flex items-center justify-center font-bold text-[9px] sm:text-[10px] font-sans shadow-md border-[1.5px] border-white tracking-tight"
      >
        -{{ discountPercentage }}%
      </div>

      <!-- Book Frame with Soft Ambient Shadow -->
      <div class="w-full h-full rounded-md overflow-hidden bg-stone-100 shadow-[0_8px_20px_-4px_rgba(0,0,0,0.16)] border border-stone-200/70 relative">
        <!-- Elegant Jacket Fallback -->
        <div
          v-if="imageFailed || !coverImage"
          class="w-full h-full flex flex-col justify-between p-3 bg-gradient-to-br from-[#052219] to-[#0C3A2B] text-white text-left select-none"
        >
          <div class="space-y-1">
            <span class="text-[7px] font-mono uppercase tracking-widest text-[#2EE59D] font-bold block truncate">
              {{ book.category_name || 'Book' }}
            </span>
            <h4 class="font-display font-bold text-[11px] leading-tight line-clamp-3 text-white">
              {{ book.name }}
            </h4>
          </div>
          <span class="text-[8px] font-mono text-white/70 truncate block pt-1 border-t border-white/10">
            {{ book.author || 'Edition' }}
          </span>
        </div>

        <!-- Cover Image -->
        <img
          v-else
          :src="coverImage"
          :alt="book.name"
          class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          width="180"
          height="260"
          referrerpolicy="no-referrer"
          @error="handleImageError"
        />
      </div>
    </NuxtLink>

    <!-- Meta Details & Actions -->
    <div class="w-full space-y-1 px-0.5 flex flex-col flex-1 justify-between">
      <div>
        <!-- 5 Small Golden Stars -->
        <div class="flex items-center justify-center gap-0.5 text-[#FFB300] mb-0.5">
          <Star v-for="i in 5" :key="i" :size="9" class="fill-current" />
        </div>

        <!-- Book Title -->
        <NuxtLink
          :to="book.isSeed ? '#' : `/book/${book.slug}`"
          class="block"
          @click="handleCardClick"
        >
          <h3 class="font-display text-xs font-bold text-[#141E1A] group-hover:text-[#F05A36] transition-colors line-clamp-1 leading-snug">
            {{ book.name }}
          </h3>
        </NuxtLink>

        <!-- Format Toggle Pills -->
        <div class="flex items-center justify-center gap-1 pt-1">
          <template v-if="availableFormats.length > 1">
            <button
              v-for="fmt in availableFormats"
              :key="fmt.id"
              type="button"
              class="text-[8px] sm:text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full transition-all cursor-pointer select-none"
              :class="
                activeFormat?.id === fmt.id
                  ? 'bg-forest-950 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              "
              @click="selectFormat(fmt.id, $event)"
            >
              {{ fmt.format === 'hardcopy' ? 'Print' : fmt.format.toUpperCase() }}
            </button>
          </template>
          <span
            v-else
            class="text-[8px] font-mono font-medium uppercase tracking-wider text-[#6B7280] bg-stone-100 px-2 py-0.5 rounded-full"
          >
            {{ activeFormat?.format === 'hardcopy' ? 'Print' : (activeFormat ? activeFormat.format.toUpperCase() : 'Print') }}
          </span>
        </div>

        <!-- Price Row -->
        <div class="flex items-center justify-center gap-1.5 pt-1 font-mono leading-none">
          <span class="text-xs font-bold text-[#141E1A]">
            {{ formatCurrency(currentPrice) }}
          </span>
          <span
            v-if="originalPrice && originalPrice > currentPrice"
            class="text-[10px] text-[#9CA3AF] line-through font-normal"
          >
            {{ formatCurrency(originalPrice) }}
          </span>
        </div>
      </div>

      <!-- Minimalistic Brand Green "Add" Button -->
      <div class="w-full pt-1.5">
        <button
          type="button"
          class="w-full bg-forest-950 hover:bg-forest-900 active:bg-forest-800 text-white text-xs font-bold uppercase tracking-wider py-1.5 px-3 rounded-lg shadow-subtle hover:shadow-md transition-all cursor-pointer select-none active:scale-[0.98]"
          @click="handleAddToCart"
        >
          Add
        </button>
      </div>
    </div>
  </div>
</template>