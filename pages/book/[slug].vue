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
import type { Book, ProductFormat, BookFormatType } from '~/types';

const route = useRoute();
const slug = computed(() => route.params.slug as string);

const { data: book, error } = await useFetch<Book>(`/api/products/${slug.value}`);
const { addItem } = useCart();
const { push: pushToast } = useToast();

const selectedFormatId = ref<string>('');
const quantity = ref<number>(1);

// Filter available digital formats
const availableDigitalFormats = computed<ProductFormat[]>(() => {
  if (!book.value?.formats || book.value.formats.length === 0) return [];

  const rawDigitals = book.value.formats.filter((f) => {
    const isDigital = f.format === 'pdf' || f.format === 'epub';
    if (!isDigital) return false;
    if (book.value?.isSeed) return true;
    return Boolean(
      (f.file_url && f.file_url.trim().length > 0) ||
      (f.file_public_id && f.file_public_id.trim().length > 0)
    );
  });

  if (rawDigitals.length === 0) return [];

  const pBook = book.value.price ?? 0;
  const cpBook = book.value.compare_at_price ?? null;
  const hasParentSale = Boolean(cpBook && cpBook > pBook && pBook > 0);
  const parentDiscountRatio = hasParentSale && cpBook ? (cpBook - pBook) / cpBook : 0;

  const pdf = rawDigitals.find((f) => f.format === 'pdf');
  const epub = rawDigitals.find((f) => f.format === 'epub');
  const digitalPrice = pdf?.price ?? epub?.price ?? 149;

  let digitalCompareAt: number | null = null;
  if (pdf?.compare_at_price && pdf.compare_at_price > digitalPrice) {
    digitalCompareAt = pdf.compare_at_price;
  } else if (epub?.compare_at_price && epub.compare_at_price > digitalPrice) {
    digitalCompareAt = epub.compare_at_price;
  } else if (hasParentSale && parentDiscountRatio > 0 && parentDiscountRatio < 1) {
    digitalCompareAt = Math.round(digitalPrice / (1 - parentDiscountRatio));
  }

  return rawDigitals.map((f) => ({
    ...f,
    price: digitalPrice,
    compare_at_price: digitalCompareAt,
  }));
});

const hasDigitalCopy = computed(() => availableDigitalFormats.value.length > 0);

// Guaranteed Hardcopy Format
const hardcopyFormat = computed<ProductFormat | null>(() => {
  const existing = book.value?.formats?.find((f) => f.format === 'hardcopy');
  if (existing) {
    return {
      ...existing,
      compare_at_price: existing.compare_at_price || book.value?.compare_at_price || null,
    };
  }

  if (hasDigitalCopy.value || book.value?.price) {
    return {
      id: `synthetic-hardcopy-${book.value?.id || 'book'}`,
      product_id: book.value?.id || 'book',
      format: 'hardcopy' as BookFormatType,
      price: book.value?.price || 999,
      compare_at_price: book.value?.compare_at_price || null,
      file_url: null,
      file_public_id: null,
      file_size_bytes: null,
      stock: book.value?.stock ?? 10,
      created_at: book.value?.created_at || '',
      updated_at: book.value?.updated_at || '',
    };
  }

  return null;
});

// Combined Available Formats
const displayFormats = computed<ProductFormat[]>(() => {
  const list: ProductFormat[] = [...availableDigitalFormats.value];
  if (hardcopyFormat.value) {
    list.push(hardcopyFormat.value);
  }
  return list;
});

// Default to available digital format first; fallback to hardcopy
watch(
  displayFormats,
  (fmts) => {
    if (fmts && fmts.length > 0) {
      if (!fmts.some((f) => f.id === selectedFormatId.value)) {
        const digital = fmts.find((f) => f.format === 'pdf' || f.format === 'epub');
        selectedFormatId.value = (digital || fmts[0]).id;
      }
    }
  },
  { immediate: true }
);

const activeFormat = computed<ProductFormat | undefined>(() => {
  return displayFormats.value.find((f) => f.id === selectedFormatId.value) || displayFormats.value[0];
});

const isPhysicalHardcopy = computed(() => activeFormat.value?.format === 'hardcopy');

// Pricing Calculations
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

const primaryImage = computed(() => {
  if (!book.value) return 'https://www.thesunrisebookstore.com/images/book-placeholder.svg';
  const rawImg = book.value.images?.[0];
  if (!rawImg) return (book.value as any).cover_image_url || 'https://www.thesunrisebookstore.com/images/book-placeholder.svg';
  if (typeof rawImg === 'string') return rawImg;
  return rawImg.image_url || (book.value as any).cover_image_url || 'https://www.thesunrisebookstore.com/images/book-placeholder.svg';
});

function formatCurrency(val: number): string {
  return `KSh ${val.toLocaleString('en-KE')}`;
}

function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return 'Cloudflare R2 Asset';
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

// ---------------------------------------------------------------------------
// Book Detail SEO & Product Rich Snippets (Schema.org JSON-LD via Unhead innerHTML)
// ---------------------------------------------------------------------------
const pageTitle = computed(() => `${book.value?.name || 'Book'} — The Sunrise Bookstore`);
const pageDescription = computed(() => {
  const authorText = book.value?.author ? `by ${book.value.author}. ` : '';
  const priceText = activePricing.value.currentPrice ? `Only KSh ${activePricing.value.currentPrice.toLocaleString('en-KE')} in Kenya. ` : '';
  return `${book.value?.name || 'Book'} ${authorText}${priceText}Order physical copies delivered to your door or get instant eBook downloads at The Sunrise Bookstore.`;
});

const canonicalUrl = computed(() => `https://www.thesunrisebookstore.com/book/${slug.value}`);

useHead(() => ({
  title: pageTitle.value,
  link: [
    { rel: 'canonical', href: canonicalUrl.value },
  ],
  meta: [
    { name: 'description', content: pageDescription.value },
    { property: 'og:title', content: pageTitle.value },
    { property: 'og:description', content: pageDescription.value },
    { property: 'og:url', content: canonicalUrl.value },
    { property: 'og:type', content: 'book' },
    { property: 'og:image', content: primaryImage.value },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: pageTitle.value },
    { name: 'twitter:description', content: pageDescription.value },
    { name: 'twitter:image', content: primaryImage.value },
  ],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': ['Book', 'Product'],
        name: book.value?.name,
        image: primaryImage.value,
        description: pageDescription.value,
        sku: book.value?.sku || slug.value,
        author: book.value?.author
          ? {
              '@type': 'Person',
              name: book.value.author,
            }
          : undefined,
        offers: {
          '@type': 'Offer',
          url: canonicalUrl.value,
          priceCurrency: 'KES',
          price: activePricing.value.currentPrice || 999,
          priceValidUntil: '2027-12-31',
          itemCondition: 'https://schema.org/NewCondition',
          availability: 'https://schema.org/InStock',
          seller: {
            '@type': 'BookStore',
            name: 'The Sunrise Bookstore',
            url: 'https://www.thesunrisebookstore.com',
          },
        },
      }),
    },
  ],
}));

function handleAddToCart(): void {
  if (!book.value || !activeFormat.value) return;
  const isPhysical = activeFormat.value.format === 'hardcopy';
  const qty = isPhysical ? quantity.value : 1;

  const isSynthetic = !activeFormat.value.id || activeFormat.value.id.startsWith('synthetic-');
  const validFormatId = isSynthetic ? '' : activeFormat.value.id;

  addItem({
    productId: book.value.id,
    formatId: validFormatId,
    title: book.value.name,
    format: activeFormat.value.format,
    price: activePricing.value.currentPrice,
    compare_at_price: activePricing.value.originalPrice,
    quantity: qty,
    deliveryMethod: isPhysical ? 'delivery' : 'digital',
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

          <!-- Format Choice -->
          <div class="space-y-2.5 pt-3 border-t border-ink-border">
            <label class="text-xs font-bold uppercase text-forest-950 tracking-wider block font-sans">
              Choose Reading Format:
            </label>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <label
                v-for="fmt in displayFormats"
                :key="fmt.id"
                class="border rounded p-3 flex flex-col justify-between cursor-pointer transition-all text-left"
                :class="selectedFormatId === fmt.id ? 'border-forest-900 bg-paper-cream ring-1 ring-forest-900' : 'border-ink-border hover:border-forest-800/40 bg-paper-surface'"
              >
                <input type="radio" :value="fmt.id" v-model="selectedFormatId" class="sr-only" />

                <div class="space-y-1">
                  <div class="flex justify-between items-center text-xs font-bold text-forest-950 uppercase">
                    <span>{{ fmt.format === 'hardcopy' ? 'Hardcopy' : fmt.format.toUpperCase() }}</span>
                    <component :is="fmt.format === 'hardcopy' ? Truck : Download" :size="12" class="text-forest-800" />
                  </div>
                  <span class="text-[9px] text-ink-muted block leading-tight font-mono">
                    <template v-if="fmt.format === 'hardcopy'">
                      {{ `${fmt.stock || 0} in stock` }}
                    </template>
                    <template v-else>
                      {{ formatFileSize(fmt.file_size_bytes) }}
                    </template>
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
            <div v-if="isPhysicalHardcopy" class="space-y-1">
              <span class="text-[9px] font-bold text-ink-subtle uppercase block font-mono">Qty</span>
              <QuantityStepper v-model="quantity" />
            </div>

            <button
              type="button"
              class="flex-1 bg-forest-950 hover:bg-forest-900 text-white font-sans font-bold text-xs uppercase py-3.5 px-5 rounded shadow-subtle transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98]"
              @click="handleAddToCart"
            >
              <ShoppingBag :size="15" />
              <span>
                {{ isPhysicalHardcopy ? 'Add Hardcopy to Cart' : 'Add eBook to Cart' }} • {{ activeFormat ? formatCurrency(activePricing.currentPrice * (isPhysicalHardcopy ? quantity : 1)) : '' }}
              </span>
            </button>
          </div>

          <!-- Dynamic Notice -->
          <div class="flex items-center gap-2 text-xs text-forest-900 pt-1">
            <CheckCircle2 :size="14" class="text-emerald-700 flex-shrink-0" />
            <span>
              {{ isPhysicalHardcopy ? 'Physical Hardcopy eligible for Doorstep Delivery or Free Diamond Mall Store Pickup.' : 'Instant Cloudflare R2 tokens issued for eBooks upon M-Pesa confirmation.' }}
            </span>
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