<!-- components/storefront/FlashSaleStrip.vue -->
<script setup lang="ts">
import { ref } from 'vue';
import { Zap, ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-vue-next';
import { useCart } from '~/composables/useCart';
import { useToast } from '~/composables/useToast';
import type { Book } from '~/types';

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

function scrollLeft(): void {
  scrollContainer.value?.scrollBy({ left: -280, behavior: 'smooth' });
}

function scrollRight(): void {
  scrollContainer.value?.scrollBy({ left: 280, behavior: 'smooth' });
}

function formatCurrency(val: number): string {
  return `KSh ${val.toLocaleString('en-KE')}`;
}

function calculateDiscount(price: number, compareAt?: number | null): number {
  if (!compareAt || compareAt <= price) return 0;
  return Math.round(((compareAt - price) / compareAt) * 100);
}

function handleQuickAdd(book: Book, event: Event): void {
  event.preventDefault();
  event.stopPropagation();

  const fmt = book.formats?.[0];
  const priceToUse = fmt ? fmt.price : book.price;
  const formatType = fmt ? fmt.format : 'hardcopy';
  const formatId = fmt ? fmt.id : 'default';

  addItem({
    productId: book.id,
    formatId,
    title: book.name,
    format: formatType,
    price: priceToUse,
    compare_at_price: book.compare_at_price,
    quantity: 1,
    coverUrl: book.images?.[0]?.image_url || (book as any).cover_image_url || null,
    author: book.author,
  });

  pushToast({
    message: `Added "${book.name}" to cart!`,
    variant: 'success',
  });

  openDrawer();
}
</script>

<template>
  <section
    v-if="books.length > 0"
    class="bg-[#FF8A00] text-white pt-16 sm:pt-20 pb-8 px-4 relative overflow-hidden select-none"
  >
    <div class="max-w-7xl mx-auto space-y-4">
      <!-- Section Header -->
      <div class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-full bg-[#052219] text-[#2EE59D] flex items-center justify-center shadow-xs">
            <Zap :size="18" class="fill-[#2EE59D]" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h2 class="font-poster text-2xl sm:text-3xl tracking-wide uppercase leading-none drop-shadow-xs">
                {{ title }}
              </h2>
              <span class="bg-[#052219] text-[#2EE59D] font-mono text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full">
                {{ badgeLabel }}
              </span>
            </div>
            <p class="text-xs text-white/90 font-medium mt-0.5">
              Limited-quantity price cuts on reader favorites. Grab them while stocks last!
            </p>
          </div>
        </div>

        <!-- Desktop Navigation Arrow Buttons -->
        <div class="hidden sm:flex items-center gap-2">
          <button
            type="button"
            class="w-8 h-8 rounded-full bg-[#052219]/30 hover:bg-[#052219] text-white flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
            aria-label="Scroll left"
            @click="scrollLeft"
          >
            <ChevronLeft :size="16" />
          </button>
          <button
            type="button"
            class="w-8 h-8 rounded-full bg-[#052219]/30 hover:bg-[#052219] text-white flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
            aria-label="Scroll right"
            @click="scrollRight"
          >
            <ChevronRight :size="16" />
          </button>
        </div>
      </div>

      <!-- Single-Row Horizontal Scrollable Shelf -->
      <div
        ref="scrollContainer"
        class="flex gap-4 overflow-x-auto no-scrollbar py-2 snap-x snap-mandatory"
      >
        <div
          v-for="book in books"
          :key="book.id"
          class="w-44 sm:w-52 flex-shrink-0 bg-white text-[#141E1A] rounded-2xl p-3 shadow-card hover:shadow-high transition-all snap-start flex flex-col justify-between group"
        >
          <div>
            <!-- Book Cover -->
            <NuxtLink
              :to="`/book/${book.slug}`"
              class="block relative aspect-[3/4] rounded-book overflow-hidden bg-stone-100 book-cover-3d mb-2.5"
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
                v-if="calculateDiscount(book.price, book.compare_at_price) > 0"
                class="absolute top-2 right-2 bg-red-600 text-white font-mono font-extrabold text-[9px] px-1.5 py-0.5 rounded shadow-sm"
              >
                -{{ calculateDiscount(book.price, book.compare_at_price) }}%
              </span>

              <!-- Flash Tag -->
              <span class="absolute top-2 left-2 bg-[#052219] text-[#2EE59D] font-mono font-bold text-[8px] px-1.5 py-0.5 rounded uppercase">
                ⚡ FLASH
              </span>
            </NuxtLink>

            <!-- Book Title & Author -->
            <NuxtLink :to="`/book/${book.slug}`">
              <h3 class="font-display text-xs sm:text-sm font-bold text-slate-900 group-hover:text-[#F05A36] transition-colors line-clamp-1 leading-snug">
                {{ book.name }}
              </h3>
            </NuxtLink>
            <p class="text-[11px] text-slate-500 italic truncate mt-0.5">
              {{ book.author ? `By ${book.author}` : 'Original Edition' }}
            </p>
          </div>

          <!-- Price & Quick Add Button -->
          <div class="pt-2.5 mt-2 border-t border-slate-100 flex items-center justify-between gap-2">
            <div>
              <span
                v-if="book.compare_at_price && book.compare_at_price > book.price"
                class="text-[10px] text-slate-400 line-through font-mono block leading-none"
              >
                {{ formatCurrency(book.compare_at_price) }}
              </span>
              <span class="text-xs sm:text-sm font-extrabold font-mono text-red-600">
                {{ formatCurrency(book.price) }}
              </span>
            </div>

            <button
              type="button"
              class="w-7 h-7 rounded-xl bg-[#052219] hover:bg-[#F05A36] text-white flex items-center justify-center transition-colors cursor-pointer active:scale-95 shadow-xs"
              title="Add to Cart"
              @click="handleQuickAdd(book, $event)"
            >
              <ShoppingBag :size="13" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>