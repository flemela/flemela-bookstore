<!-- pages/book/[slug].vue -->
<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import {
  ArrowLeft,
  ShoppingBag,
  Truck,
  Download,
  BookOpen,
  CheckCircle2,
} from 'lucide-vue-next';
import BookstoreHeader from '~/components/storefront/BookstoreHeader.vue';
import CartDrawer from '~/components/storefront/CartDrawer.vue';
import QuantityStepper from '~/components/storefront/QuantityStepper.vue';
import ToastContainer from '~/components/ui/ToastContainer.vue';
import { useCart } from '~/composables/useCart';
import { useToast } from '~/composables/useToast';
import type { Book, ProductFormat } from '~/types';

const route = useRoute();
const slug = computed(() => route.params.slug as string);

const { data: book, error } = await useFetch<Book>(`/api/products/${slug.value}`);
const { addItem } = useCart();
const { push: pushToast } = useToast();

const selectedFormatId = ref<string>('');
const quantity = ref<number>(1);

// Synchronize PDF and EPUB formats so both digital editions share identical pricing and proportional strikethrough
const availableFormats = computed<ProductFormat[]>(() => {
  if (!book.value?.formats || book.value.formats.length === 0) return [];

  const pBook = book.value.price ?? 0;
  const cpBook = book.value.compare_at_price ?? null;
  const hasParentSale = Boolean(cpBook && cpBook > pBook && pBook > 0);
  const parentDiscountRatio = hasParentSale && cpBook ? (cpBook - pBook) / cpBook : 0;

  const pdf = book.value.formats.find((f) => f.format === 'pdf');
  const epub = book.value.formats.find((f) => f.format === 'epub');
  const digitalPrice = pdf?.price ?? epub?.price ?? 149;

  let digitalCompareAt: number | null = null;
  if (pdf?.compare_at_price && pdf.compare_at_price > digitalPrice) {
    digitalCompareAt = pdf.compare_at_price;
  } else if (epub?.compare_at_price && epub.compare_at_price > digitalPrice) {
    digitalCompareAt = epub.compare_at_price;
  } else if (hasParentSale && parentDiscountRatio > 0 && parentDiscountRatio < 1) {
    digitalCompareAt = Math.round(digitalPrice / (1 - parentDiscountRatio));
  }

  return book.value.formats.map((f) => {
    if (f.format === 'pdf' || f.format === 'epub') {
      return {
        ...f,
        price: digitalPrice,
        compare_at_price: digitalCompareAt,
      };
    }
    if (f.format === 'hardcopy') {
      return {
        ...f,
        compare_at_price: f.compare_at_price || cpBook,
      };
    }
    return f;
  });
});

// Default to Hardcopy (Print) if available, or first format
watch(
  availableFormats,
  (fmts) => {
    if (fmts && fmts.length > 0) {
      if (!fmts.some((f) => f.id === selectedFormatId.value)) {
        const hardcopy = fmts.find((f) => f.format === 'hardcopy');
        selectedFormatId.value = (hardcopy || fmts[0]).id;
      }
    }
  },
  { immediate: true }
);

const activeFormat = computed<ProductFormat | undefined>(() => {
  return availableFormats.value.find((f) => f.id === selectedFormatId.value) || availableFormats.value[0];
});

// Resilient Non-Inverted Pricing & % Down Engine
const activePricing = computed(() => {
  if (!activeFormat.value) {
    return {
      currentPrice: book.value?.price ?? 0,
      originalPrice: null,
      discountPercentage: 0,
    };
  }

  const p = activeFormat.value.price;
  const cp = activeFormat.value.compare_at_price ?? null;

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

// Safe cover resolution supporting string, object, or fallback SVG
const primaryImage = computed(() => {
  if (!book.value) return '/images/book-placeholder.svg';
  const rawImg = book.value.images?.[0];
  if (!rawImg) return (book.value as any).cover_image_url || '/images/book-placeholder.svg';
  if (typeof rawImg === 'string') return rawImg;
  return rawImg.image_url || (book.value as any).cover_image_url || '/images/book-placeholder.svg';
});

function formatCurrency(val: number): string {
  return `KSh ${val.toLocaleString('en-KE')}`;
}

function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return 'Cloudflare R2 Asset';
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

useSeoMeta({
  title: () => `${book.value?.name || 'Book'} — Flemela Bookstore`,
  description: () => book.value?.description || 'Authentic literature and instant digital editions.',
  ogImage: () => primaryImage.value,
});

function handleAddToCart(): void {
  if (!book.value || !activeFormat.value) return;
  const qty = activeFormat.value.format === 'hardcopy' ? quantity.value : 1;

  addItem({
    productId: book.value.id,
    formatId: activeFormat.value.id,
    title: book.value.name,
    format: activeFormat.value.format,
    price: activePricing.value.currentPrice,
    compare_at_price: activePricing.value.originalPrice,
    quantity: qty,
    coverUrl: primaryImage.value,
    author: book.value.author,
  });

  pushToast({
    message: `Added "${book.value.name}" (${activeFormat.value.format.toUpperCase()}) to cart!`,
    variant: 'success',
  });
}
</script>

<template>
  <div class="min-h-screen flex flex-col bg-paper text-ink antialiased">
    <BookstoreHeader />

    <main class="max-w-5xl mx-auto w-full py-6 sm:py-10 px-4 sm:px-6 space-y-6 flex-1">
      <NuxtLink to="/" class="inline-flex items-center gap-1.5 text-xs font-semibold text-forest-900 hover:text-forest-700">
        <ArrowLeft :size="13" /> Back to Catalog
      </NuxtLink>

      <div v-if="error || !book" class="bg-paper-surface rounded-lg border border-ink-border p-12 text-center space-y-3 shadow-subtle">
        <BookOpen :size="36" class="mx-auto text-ink-subtle opacity-40" />
        <h2 class="font-display font-bold text-lg text-forest-950">Book Not Found</h2>
        <p class="text-xs text-ink-muted">The requested title may have been unlisted or moved.</p>
        <NuxtLink to="/" class="inline-block text-xs font-bold text-forest-900 underline pt-2">Return to homepage</NuxtLink>
      </div>

      <!-- Main Editorial Book Card -->
      <div v-else class="bg-paper-surface rounded-lg border border-ink-border p-6 sm:p-10 grid md:grid-cols-12 gap-8 lg:gap-12 shadow-subtle">
        <!-- Cover Art Frame (5 cols) -->
        <div class="md:col-span-5 flex justify-center items-start">
          <div class="w-full max-w-[280px] sm:max-w-[320px] aspect-[3/4] bg-paper-cream rounded overflow-hidden shadow-medium border border-ink-border relative">
            <img
              :src="primaryImage"
              :alt="`Cover for ${book.name}`"
              class="w-full h-full object-cover"
              width="320"
              height="426"
              @error="($event.target as HTMLImageElement).src = '/images/book-placeholder.svg'"
            />
            <div v-if="activePricing.discountPercentage > 0 || book.badge" class="absolute top-3 left-3 z-10 flex flex-col gap-1">
              <span v-if="activePricing.discountPercentage > 0" class="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-600 text-white shadow-sm">
                -{{ activePricing.discountPercentage }}% OFF
              </span>
              <span v-if="book.badge" class="text-[9px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-forest-950 text-white shadow-sm">
                ★ {{ book.badge }}
              </span>
            </div>
          </div>
        </div>

        <!-- Details & Selector (7 cols) -->
        <div class="md:col-span-7 space-y-5 text-left">
          <div class="space-y-1">
            <span class="text-[10px] uppercase font-mono font-bold tracking-widest text-gold-600 block">
              {{ book.category_name || 'General' }}
            </span>
            <h1 class="font-display text-2xl sm:text-3xl font-bold text-forest-950 leading-tight">
              {{ book.name }}
            </h1>
            <p class="text-xs text-ink-muted">
              By <strong class="text-forest-950 font-semibold">{{ book.author || 'Original Edition' }}</strong>
            </p>
          </div>

          <!-- Format Choice (PDF & EPUB strictly identical price) -->
          <div class="space-y-2.5 pt-3 border-t border-ink-border">
            <label class="text-xs font-bold uppercase text-forest-950 tracking-wider block font-sans">
              Choose Reading Format:
            </label>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <label
                v-for="fmt in availableFormats"
                :key="fmt.id"
                class="border rounded p-3 flex flex-col justify-between cursor-pointer transition-all text-left"
                :class="selectedFormatId === fmt.id ? 'border-forest-900 bg-paper-cream ring-1 ring-forest-900' : 'border-ink-border hover:border-forest-800/40 bg-paper-surface'"
              >
                <input type="radio" :value="fmt.id" v-model="selectedFormatId" class="sr-only" />

                <div class="space-y-1">
                  <div class="flex justify-between items-center text-xs font-bold text-forest-950 uppercase">
                    <span>{{ fmt.format === 'hardcopy' ? 'Print' : fmt.format.toUpperCase() }}</span>
                    <component :is="fmt.format === 'hardcopy' ? Truck : Download" :size="12" class="text-forest-800" />
                  </div>
                  <span class="text-[9px] text-ink-muted block leading-tight font-mono">
                    {{ fmt.format === 'hardcopy' ? `${fmt.stock || 0} in stock` : formatFileSize(fmt.file_size_bytes) }}
                  </span>
                </div>

                <div class="pt-2 mt-2 border-t border-ink-border/50 flex items-center justify-between gap-1 font-mono text-xs">
                  <span class="font-extrabold text-forest-950">
                    {{ formatCurrency(fmt.price) }}
                  </span>
                  <span
                    v-if="fmt.compare_at_price && fmt.compare_at_price > fmt.price"
                    class="text-[10px] text-ink-muted line-through opacity-70"
                  >
                    {{ formatCurrency(fmt.compare_at_price) }}
                  </span>
                </div>
              </label>
            </div>
          </div>

          <!-- Quantity & Purchase Action -->
          <div class="pt-3 flex items-center gap-3">
            <div v-if="activeFormat?.format === 'hardcopy'" class="space-y-1">
              <span class="text-[9px] font-bold text-ink-subtle uppercase block font-mono">Qty</span>
              <QuantityStepper v-model="quantity" />
            </div>

            <button
              type="button"
              class="flex-1 bg-forest-950 text-white hover:bg-forest-900 font-sans font-bold text-xs uppercase py-3.5 px-5 rounded shadow-subtle transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98]"
              @click="handleAddToCart"
            >
              <ShoppingBag :size="15" />
              <span>Add to Cart • {{ activeFormat ? formatCurrency(activePricing.currentPrice * (activeFormat.format === 'hardcopy' ? quantity : 1)) : '' }}</span>
            </button>
          </div>

          <div class="flex items-center gap-2 text-xs text-forest-900 pt-1">
            <CheckCircle2 :size="14" class="text-emerald-700 flex-shrink-0" />
            <span>Instant Cloudflare R2 tokens issued for eBooks upon M-Pesa confirmation.</span>
          </div>

          <!-- Description -->
          <div v-if="book.description" class="pt-4 border-t border-ink-border space-y-1.5 text-xs text-ink-muted leading-relaxed" v-html="book.description" />
        </div>
      </div>
    </main>

    <CartDrawer />
    <ToastContainer />
  </div>
</template>