<!-- components/storefront/FlashSaleStrip.vue -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-vue-next';
import { useCart } from '~/composables/useCart';
import { useToast } from '~/composables/useToast';
import type { Book, ProductFormat, BookFormatType } from '~/types';

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

// Live Flash Sale Countdown Timer (Hours, Minutes, Seconds until midnight)
const hours = ref('08');
const minutes = ref('24');
const seconds = ref('36');
let timerInterval: ReturnType<typeof setInterval> | undefined;

function updateCountdown(): void {
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  const diff = Math.max(0, target.getTime() - now.getTime());

  const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const m = Math.floor((diff / 1000 / 60) % 60);
  const s = Math.floor((diff / 1000) % 60);

  hours.value = String(h).padStart(2, '0');
  minutes.value = String(m).padStart(2, '0');
  seconds.value = String(s).padStart(2, '0');
}

onMounted(() => {
  updateCountdown();
  timerInterval = setInterval(updateCountdown, 1000);
});

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval);
});

function scrollLeft(): void {
  scrollContainer.value?.scrollBy({ left: -240, behavior: 'smooth' });
}

function scrollRight(): void {
  scrollContainer.value?.scrollBy({ left: 240, behavior: 'smooth' });
}

function formatCurrency(val: number): string {
  return `KSh ${val.toLocaleString('en-KE')}`;
}

// Filter to ONLY available digital formats with real files
function getAvailableDigitalFormats(book: Book): ProductFormat[] {
  if (!book.formats || book.formats.length === 0) return [];
  return book.formats.filter((f) => {
    const isDigital = f.format === 'pdf' || f.format === 'epub';
    if (!isDigital) return false;
    if (book.isSeed) return true;
    return Boolean(
      (f.file_url && f.file_url.trim().length > 0) ||
      (f.file_public_id && f.file_public_id.trim().length > 0)
    );
  });
}

// Guaranteed Hardcopy Format
function getHardcopyFormat(book: Book): ProductFormat {
  const existing = book.formats?.find((f) => f.format === 'hardcopy');
  if (existing) return existing;
  return {
    id: `synthetic-hardcopy-${book.id}`,
    product_id: book.id,
    format: 'hardcopy' as BookFormatType,
    price: book.price || 999,
    compare_at_price: book.compare_at_price || null,
    file_url: null,
    file_public_id: null,
    file_size_bytes: null,
    stock: book.stock ?? 10,
    created_at: book.created_at || '',
    updated_at: book.updated_at || '',
  };
}

// Available Formats: Valid Digitals + Guaranteed Hardcopy
function getBookDisplayFormats(book: Book): ProductFormat[] {
  const digitals = getAvailableDigitalFormats(book);
  const hardcopy = getHardcopyFormat(book);
  return [...digitals, hardcopy];
}

function getSelectedFormat(book: Book): ProductFormat {
  const fmts = getBookDisplayFormats(book);
  const selectedId = selectedFormats.value[book.id];
  if (selectedId) {
    const found = fmts.find((f) => f.id === selectedId);
    if (found) return found;
  }
  const digital = fmts.find((f) => f.format === 'pdf' || f.format === 'epub');
  return digital || fmts[0];
}

function getBookPricing(book: Book) {
  const pBook = book.price ?? 0;
  const cpBook = book.compare_at_price ?? null;
  const hasParentSale = Boolean(cpBook && cpBook > pBook && pBook > 0);
  const parentDiscountRatio = hasParentSale && cpBook ? (cpBook - pBook) / cpBook : 0;

  const fmt = getSelectedFormat(book);
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
  const pricing = getBookPricing(book);
  const isPhysical = fmt?.format === 'hardcopy';
  const formatType = fmt ? fmt.format : 'hardcopy';

  const isSynthetic = !fmt || fmt.id.startsWith('synthetic-');
  const validFormatId = isSynthetic ? '' : fmt.id;

  addItem({
    productId: book.id,
    formatId: validFormatId,
    title: book.name,
    format: formatType,
    price: pricing.currentPrice,
    compare_at_price: pricing.originalPrice,
    quantity: 1,
    deliveryMethod: isPhysical ? 'delivery' : 'digital',
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
    class="bg-[#FF8A00] text-white py-2 px-4 sm:px-6 relative overflow-hidden select-none rounded-2xl max-w-6xl mx-auto shadow-md"
  >
    <!-- Background Texture -->
    <svg class="absolute -left-16 -bottom-16 w-80 h-80 text-white/10 pointer-events-none" viewBox="0 0 200 200" fill="none">
      <circle cx="100" cy="100" r="40" stroke="currentColor" stroke-width="1.5" />
      <circle cx="100" cy="100" r="75" stroke="currentColor" stroke-width="1.5" />
      <circle cx="100" cy="100" r="110" stroke="currentColor" stroke-width="1.5" />
    </svg>

    <!-- Binary Responsive Container: Controls on the Left, Books Shelf on the Right -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 sm:gap-8 relative z-10">
      
      <!-- =============================================================== -->
      <!-- CONTROLS CONTAINER: LEFT SIDE ON SCREENS LARGER THAN MOBILE     -->
      <!-- =============================================================== -->
      <div class="w-full sm:w-80 sm:flex-shrink-0 space-y-2.5 text-left py-1">
        <!-- Eyebrow Badge -->
        <div class="space-y-1">
          <span class="inline-block text-[9px] sm:text-[10px] font-mono font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-[#052219] text-[#2EE59D] shadow-2xs">
            {{ badgeLabel }}
          </span>
          <h2 class="font-poster text-3xl sm:text-4xl font-extrabold uppercase tracking-wide leading-none text-white drop-shadow-xs">
            {{ title }}
          </h2>
        </div>

        <!-- Description -->
        <p class="text-xs text-white/90 leading-relaxed font-sans line-clamp-2">
          Limited-quantity price cuts on reader favorites. Grab them before the daily countdown expires!
        </p>

        <!-- Live Countdown Timer (Hours, Minutes, Seconds) -->
        <ClientOnly>
          <div class="flex items-center gap-2 pt-0.5">
            <div class="bg-white text-[#141E1A] rounded-lg px-2.5 py-1 border border-white/20 text-center shadow-xs min-w-[42px]">
              <span class="font-mono text-sm font-bold block">{{ hours }}H</span>
            </div>
            <span class="font-bold text-white">:</span>
            <div class="bg-white text-[#141E1A] rounded-lg px-2.5 py-1 border border-white/20 text-center shadow-xs min-w-[42px]">
              <span class="font-mono text-sm font-bold block">{{ minutes }}M</span>
            </div>
            <span class="font-bold text-white">:</span>
            <div class="bg-white text-[#141E1A] rounded-lg px-2.5 py-1 border border-white/20 text-center shadow-xs min-w-[42px]">
              <span class="font-mono text-sm font-bold text-[#F05A36] block">{{ seconds }}S</span>
            </div>
          </div>
        </ClientOnly>

        <!-- Scroll Buttons on the Left (Hidden on Mobile) -->
        <div class="hidden sm:flex items-center gap-2.5 pt-1">
          <button
            type="button"
            class="w-8 h-8 rounded-full bg-[#052219]/30 hover:bg-[#052219] text-white flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95 border border-white/20"
            aria-label="Previous deal"
            @click="scrollLeft"
          >
            <ChevronLeft :size="15" />
          </button>
          <button
            type="button"
            class="w-8 h-8 rounded-full bg-[#052219] text-[#2EE59D] hover:bg-[#073023] flex items-center justify-center cursor-pointer shadow-xs active:scale-95 transition-all border border-[#2EE59D]/30"
            aria-label="Next deal"
            @click="scrollRight"
          >
            <ChevronRight :size="15" />
          </button>
        </div>
      </div>

      <!-- =============================================================== -->
      <!-- BOOKS CONTAINER: RIGHT SIDE (SCROLLABLE BY HAND & BUTTONS)      -->
      <!-- =============================================================== -->
      <div class="flex-1 min-w-0 w-full">
        <div
          ref="scrollContainer"
          class="flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar py-1 px-1 snap-x snap-mandatory touch-pan-x"
        >
          <div
            v-for="book in books"
            :key="book.id"
            class="w-[140px] sm:w-[148px] flex-shrink-0 bg-white text-[#141E1A] rounded-xl p-2.5 sm:p-3 shadow-card hover:shadow-high transition-all snap-start flex flex-col justify-between group select-none text-left"
          >
            <div>
              <!-- Book Cover -->
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
                  v-if="getBookPricing(book).discountPercentage > 0"
                  class="absolute top-1.5 right-1.5 bg-red-600 text-white font-mono font-extrabold text-[8px] px-1.5 py-0.5 rounded shadow-xs z-10"
                >
                  -{{ getBookPricing(book).discountPercentage }}%
                </span>

                <!-- Badge Tag -->
                <span
                  class="absolute top-1.5 left-1.5 bg-[#052219] text-[#2EE59D] font-mono font-bold text-[7.5px] px-1.5 py-0.5 rounded uppercase z-10"
                >
                  {{ formatBadge(book.badge) }}
                </span>
              </NuxtLink>

              <!-- Book Title -->
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
                <template v-if="getBookDisplayFormats(book).length > 1">
                  <button
                    v-for="fmt in getBookDisplayFormats(book)"
                    :key="fmt.id"
                    type="button"
                    class="text-[7px] sm:text-[7.5px] font-mono font-bold uppercase px-1.5 py-0.5 rounded-full transition-all cursor-pointer select-none leading-none"
                    :class="getSelectedFormat(book)?.id === fmt.id ? 'bg-[#052219] text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
                    @click="selectBookFormat(book.id, fmt.id, $event)"
                  >
                    {{ fmt.format === 'hardcopy' ? 'Hardcopy' : fmt.format.toUpperCase() }}
                  </button>
                </template>
                <span
                  v-else
                  class="text-[7px] sm:text-[7.5px] font-mono font-medium uppercase tracking-wider text-[#6B7280] bg-slate-100 px-1.5 py-0.5 rounded-full leading-none"
                >
                  {{ getSelectedFormat(book)?.format === 'hardcopy' ? 'Hardcopy' : (getSelectedFormat(book) ? getSelectedFormat(book)!.format.toUpperCase() : 'Hardcopy') }}
                </span>
              </div>
            </div>

            <!-- Price Box & Add Button -->
            <div class="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
              <div class="min-w-0 flex flex-col justify-center min-h-[22px]">
                <span
                  v-if="getBookPricing(book).originalPrice && getBookPricing(book).originalPrice! > getBookPricing(book).currentPrice"
                  class="text-[8px] sm:text-[8.5px] text-slate-400 line-through font-mono block leading-none"
                >
                  {{ formatCurrency(getBookPricing(book).originalPrice!) }}
                </span>
                <span
                  class="text-[10px] sm:text-[11px] font-extrabold font-mono leading-tight"
                  :class="getBookPricing(book).originalPrice && getBookPricing(book).originalPrice! > getBookPricing(book).currentPrice ? 'text-red-600' : 'text-[#141E1A]'"
                >
                  {{ formatCurrency(getBookPricing(book).currentPrice) }}
                </span>
              </div>

              <button
                type="button"
                class="w-6 h-6 sm:w-6.5 sm:h-6.5 rounded-lg bg-[#052219] hover:bg-[#F05A36] text-white flex items-center justify-center transition-colors cursor-pointer active:scale-95 shadow-xs flex-shrink-0"
                :title="getSelectedFormat(book)?.format === 'hardcopy' ? 'Add Hardcopy to Cart' : 'Add eBook to Cart'"
                @click="handleQuickAdd(book, $event)"
              >
                <ShoppingBag :size="12" />
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  </section>
</template>