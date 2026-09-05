<!-- components/storefront/FlashSaleStrip.vue -->
<script setup lang="ts">
import { ref } from 'vue';
import { Zap, ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-vue-next';
import { useCart } from '~/composables/useCart';
import { useToast } from '~/composables/useToast';
import type { Book, ProductFormat } from '~/types';

interface Props {
  books: Book[];
  title?: string;
  badgeLabel?: string;
}

const props = withDefaults(defineProps<Props>(), {
  title: 'FLASH SALE DEALS',
  badgeLabel: 'LIMITED TIME',
});

const { addItem, openDrawer } = useCart();
const { push: pushToast } = useToast();

const scrollContainer = ref<HTMLElement | null>(null);
const selectedFormats = ref<Record<string, string>>({});

function scrollLeft(): void {
  scrollContainer.value?.scrollBy({ left: -240, behavior: 'smooth' });
}

function scrollRight(): void {
  scrollContainer.value?.scrollBy({ left: 240, behavior: 'smooth' });
}

function formatCurrency(val: number): string {
  return `KSh ${val.toLocaleString('en-KE')}`;
}

function getSelectedFormat(book: Book): ProductFormat | undefined {
  if (!book.formats || book.formats.length === 0) return undefined;
  const selectedId = selectedFormats.value[book.id];
  if (selectedId) {
    const found = book.formats.find((f) => f.id === selectedId);
    if (found) return found;
  }
  const sorted = [...book.formats].sort((a, b) => a.price - b.price);
  return sorted[0];
}

function getBookCurrentPrice(book: Book): number {
  const fmt = getSelectedFormat(book);
  return fmt ? fmt.price : book.price;
}

function getBookOriginalPrice(book: Book): number | null {
  const fmt = getSelectedFormat(book);
  if (fmt?.compare_at_price) return fmt.compare_at_price;
  return book.compare_at_price || null;
}

function getBookDiscount(book: Book): number {
  const orig = getBookOriginalPrice(book);
  const curr = getBookCurrentPrice(book);
  if (!orig || orig <= curr || curr <= 0) return 0;
  return Math.round(((orig - curr) / orig) * 100);
}

function formatBadge(badgeStr?: string | null): string {
  if (!badgeStr) return '⚡ FLASH';
  switch (badgeStr) {
    case 'LIMITED_TIME':
      return '⏳ LIMITED';
    case 'FLASH_SALE':
      return '⚡ FLASH';
    default:
      return badgeStr.replace(/_/g, ' ');
  }
}

function selectBookFormat(bookId: string, formatId: string, event: Event): void {
  event.preventDefault();
  event.stopPropagation();
  selectedFormats.value[bookId] = formatId;
}

function handleQuickAdd(book: Book, event: Event): void {
  event.preventDefault();
  event.stopPropagation();

  const fmt = getSelectedFormat(book);
  const priceToUse = getBookCurrentPrice(book);
  const formatType = fmt ? fmt.format : 'hardcopy';
  const formatId = fmt ? fmt.id : 'default';

  addItem({
    productId: book.id,
    formatId,
    title: book.name,
    format: formatType,
    price: priceToUse,
    compare_at_price: getBookOriginalPrice(book),
    quantity: 1,
    coverUrl: book.images?.[0]?.image_url || (book as any).cover_image_url || null,
    author: book.author,
  });

  pushToast({
    message: `Added "${book.name}" (${formatType.toUpperCase()}) to cart!`,
    variant: 'success',
  });

  openDrawer();
}
</script>

<template>
  <section
    v-if="books.length > 0"
    class="bg-[#FF8A00] text-white pt-4 sm:pt-6 pb-6 sm:pb-8 px-4 relative overflow-hidden select-none rounded-xl mx-2 sm:mx-4"
  >
    <div class="max-w-6xl mx-auto space-y-3">
      <!-- Section Header -->
      <div class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-2.5">
          <div class="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#052219] text-[#2EE59D] flex items-center justify-center shadow-xs">
            <Zap :size="15" class="fill-[#2EE59D]" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h2 class="font-poster text-xl sm:text-2xl tracking-wide uppercase leading-none drop-shadow-xs">
                {{ title }}
              </h2>
              <span class="bg-[#052219] text-[#2EE59D] font-mono text-[8px] sm:text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full">
                {{ badgeLabel }}
              </span>
            </div>
            <p class="text-[11px] text-white/90 font-medium mt-0.5">
              Limited-quantity price cuts on reader favorites. Grab them while stocks last!
            </p>
          </div>
        </div>

        <!-- Desktop Navigation Arrow Buttons -->
        <div class="hidden sm:flex items-center gap-1.5">
          <button
            type="button"
            class="w-7 h-7 rounded-full bg-[#052219]/30 hover:bg-[#052219] text-white flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
            aria-label="Scroll left"
            @click="scrollLeft"
          >
            <ChevronLeft :size="15" />
          </button>
          <button
            type="button"
            class="w-7 h-7 rounded-full bg-[#052219]/30 hover:bg-[#052219] text-white flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
            aria-label="Scroll right"
            @click="scrollRight"
          >
            <ChevronRight :size="15" />
          </button>
        </div>
      </div>

      <!-- Single-Row Horizontal Scrollable Shelf -->
      <div
        ref="scrollContainer"
        class="flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar py-1.5 px-0.5 snap-x snap-mandatory"
      >
        <div
          v-for="book in books"
          :key="book.id"
          class="w-[140px] sm:w-[148px] flex-shrink-0 bg-white text-[#141E1A] rounded-xl p-2.5 sm:p-3 shadow-card hover:shadow-high transition-all snap-start flex flex-col justify-between group select-none text-left"
        >
          <div>
            <!-- Book Cover: 124px wide x ~170px height -->
            <NuxtLink
              :to="`/book/${book.slug}`"
              class="block relative aspect-[1/1.37] rounded-book overflow-hidden bg-stone-100 book-cover-3d mb-2 sm:mb-2.5"
            >
              <img
                :src="book.images?.[0]?.image_url || (book as any).cover_image_url || '/images/book-placeholder.svg'"
                :alt="book.name"
                class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
                referrerpolicy="no-referrer"
              />

              <!-- Percentage Off Badge -->
              <span
                v-if="getBookDiscount(book) > 0"
                class="absolute top-1.5 right-1.5 bg-red-600 text-white font-mono font-extrabold text-[8px] px-1.5 py-0.5 rounded shadow-xs z-10"
              >
                -{{ getBookDiscount(book) }}%
              </span>

              <!-- Badge Tag on Top Left -->
              <span
                class="absolute top-1.5 left-1.5 bg-[#052219] text-[#2EE59D] font-mono font-bold text-[7.5px] px-1.5 py-0.5 rounded uppercase z-10"
              >
                {{ formatBadge(book.badge) }}
              </span>
            </NuxtLink>

            <!-- Book Title & Author -->
            <NuxtLink :to="`/book/${book.slug}`" class="block">
              <h3 class="font-display text-[10px] sm:text-[11px] font-bold text-slate-900 group-hover:text-[#F05A36] transition-colors line-clamp-1 leading-snug">
                {{ book.name }}
              </h3>
            </NuxtLink>
            <p class="text-[9.5px] text-slate-500 italic truncate mt-0.5">
              {{ book.author ? (book.author.startsWith('By ') ? book.author : `By ${book.author}`) : 'Original Edition' }}
            </p>

            <!-- Format Toggle Pills -->
            <div class="flex items-center justify-start gap-1 pt-1.5 flex-wrap">
              <template v-if="book.formats && book.formats.length > 1">
                <button
                  v-for="fmt in book.formats"
                  :key="fmt.id"
                  type="button"
                  class="text-[7px] sm:text-[7.5px] font-mono font-bold uppercase px-1.5 py-0.5 rounded-full transition-all cursor-pointer select-none leading-none"
                  :class="getSelectedFormat(book)?.id === fmt.id ? 'bg-[#052219] text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
                  @click="selectBookFormat(book.id, fmt.id, $event)"
                >
                  {{ fmt.format === 'hardcopy' ? 'Print' : fmt.format.toUpperCase() }}
                </button>
              </template>
              <span
                v-else
                class="text-[7px] sm:text-[7.5px] font-mono font-medium uppercase tracking-wider text-[#6B7280] bg-slate-100 px-1.5 py-0.5 rounded-full leading-none"
              >
                {{ getSelectedFormat(book)?.format === 'hardcopy' ? 'Print' : (getSelectedFormat(book) ? getSelectedFormat(book)!.format.toUpperCase() : 'Print') }}
              </span>
            </div>
          </div>

          <!-- Bottom Bar: Price + Add Button -->
          <div class="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
            <div class="min-w-0">
              <span
                v-if="getBookOriginalPrice(book) && getBookOriginalPrice(book)! > getBookCurrentPrice(book)"
                class="text-[8px] sm:text-[8.5px] text-slate-400 line-through font-mono block leading-none"
              >
                {{ formatCurrency(getBookOriginalPrice(book)!) }}
              </span>
              <span
                class="text-[10px] sm:text-[11px] font-extrabold font-mono leading-none"
                :class="getBookOriginalPrice(book) && getBookOriginalPrice(book)! > getBookCurrentPrice(book) ? 'text-red-600' : 'text-[#141E1A]'"
              >
                {{ formatCurrency(getBookCurrentPrice(book)) }}
              </span>
            </div>

            <button
              type="button"
              class="w-6 h-6 sm:w-6.5 sm:h-6.5 rounded-lg bg-[#052219] hover:bg-[#F05A36] text-white flex items-center justify-center transition-colors cursor-pointer active:scale-95 shadow-xs flex-shrink-0"
              title="Add to Cart"
              @click="handleQuickAdd(book, $event)"
            >
              <ShoppingBag :size="12" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>