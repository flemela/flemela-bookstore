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
  Check,
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
const isRecentlyAdded = ref(false);
let addedTimer: ReturnType<typeof setTimeout> | undefined;

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
  if (!bytes) return 'Digital Edition';
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

const formatNoticeText = computed(() => {
  return isPhysicalHardcopy.value
    ? 'Physical copies dispatched for Doorstep Delivery or Free Store Pickup at Diamond Mall.'
    : 'Instant download links issued for eBooks immediately upon payment.';
});

const addToCartButtonLabel = computed(() => {
  if (isRecentlyAdded.value) return 'Added to Cart ✓';
  const actionText = isPhysicalHardcopy.value ? 'Add Hardcopy to Cart' : 'Add eBook to Cart';
  const priceMultiplier = isPhysicalHardcopy.value ? quantity.value : 1;
  const priceText = activeFormat.value ? ` • ${formatCurrency(activePricing.value.currentPrice * priceMultiplier)}` : '';
  return `${actionText}${priceText}`;
});

// Book Detail SEO
const pageTitle = computed(() => `${book.value?.name || 'Book'} — The Sunrise Bookstore`);
const pageDescription = computed(() => {
  const authorText = book.value?.author ? `by ${book.value.author}. ` : '';
  const priceText = activePricing.value.currentPrice ? `Only KSh ${activePricing.value.currentPrice.toLocaleString('en-KE')} in Kenya. ` : '';
  return `${book.value?.name || 'Book'} ${authorText}${priceText}Order physical copies delivered to your door or get instant eBook downloads at The Sunrise Bookstore.`;
});

const canonicalUrl = computed(() => `https://www.thesunrisebookstore.com/book/${slug.value}`);

useHead(() => ({
  title: pageTitle.value,
  link: [{ rel: 'canonical', href: canonicalUrl.value }],
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

  // Tactile feedback on button
  isRecentlyAdded.value = true;
  if (addedTimer) clearTimeout(addedTimer);
  addedTimer = setTimeout(() => {
    isRecentlyAdded.value = false;
  }, 1400);

  pushToast({
    message: `Added "${book.value.name}" (${activeFormat.value.format.toUpperCase()}) to cart!`,
    variant: 'success',
  });
}
</script>

<template>
	<div class="min-h-screen flex flex-col bg-paper-canvas text-[#141E1A] antialiased">
		<BookstoreHeader />

		<main class="max-w-5xl mx-auto w-full py-6 sm:py-10 px-4 sm:px-6 space-y-6 flex-1">
			<NuxtLink to="/"
				class="inline-flex items-center gap-1.5 text-xs font-semibold text-[#141E1A] hover:text-[#E8750D] transition-colors">
				<ArrowLeft :size="13" /> Back to Catalog
			</NuxtLink>

			<div v-if="error || !book"
				class="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3 shadow-subtle">
				<BookOpen :size="36" class="mx-auto text-slate-400 opacity-40" />
				<h2 class="font-display font-bold text-lg text-[#141E1A]">Book Not Found</h2>
				<p class="text-xs text-[#5F6964]">The requested title may have been unlisted or moved.</p>
				<NuxtLink to="/" class="inline-block text-xs font-bold text-[#E8750D] underline pt-2">
					Return to homepage
				</NuxtLink>
			</div>

			<!-- Main Editorial Book Card -->
			<div v-else
				class="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-10 grid md:grid-cols-12 gap-8 lg:gap-12 shadow-card">
				<!-- Cover Art Frame (5 cols) -->
				<div class="md:col-span-5 flex justify-center items-start">
					<div
						class="w-full max-w-[280px] sm:max-w-[320px] aspect-[3/4] bg-slate-50 rounded-xl overflow-hidden shadow-medium border border-slate-200 relative">
						<img :src="primaryImage" :alt="`Cover for ${book.name}`" class="w-full h-full object-cover"
							width="320" height="426"
							@error="($event.target as HTMLImageElement).src = '/images/book-placeholder.svg'" />
						<div v-if="activePricing.discountPercentage > 0 || book.badge"
							class="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
							<span v-if="activePricing.discountPercentage > 0"
								class="text-[9.5px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-600 text-white shadow-xs">
								-{{ activePricing.discountPercentage }}% OFF
							</span>
							<span v-if="book.badge"
								class="text-[9.5px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-[#141E1A] text-white shadow-xs">
								★ {{ book.badge }}
							</span>
						</div>
					</div>
				</div>

				<!-- Details & Selector (7 cols) -->
				<div class="md:col-span-7 space-y-5 text-left">
					<div class="space-y-1">
						<span class="text-[10px] uppercase font-mono font-bold tracking-widest text-[#E8750D] block">
							{{ book.category_name || 'General' }}
						</span>
						<h1 class="font-display text-2xl sm:text-3xl font-bold text-[#141E1A] leading-tight">
							{{ book.name }}
						</h1>
						<p class="text-xs text-[#5F6964]">
							By <strong class="text-[#141E1A] font-semibold">{{ book.author || 'Original Edition'
								}}</strong>
						</p>
					</div>

					<!-- Format Choice (Apple Grouped Style with Brand Orange Highlights) -->
					<div class="space-y-2.5 pt-3 border-t border-slate-200/80">
						<label class="text-xs font-bold uppercase text-[#141E1A] tracking-wider block font-sans">
							Choose Reading Format:
						</label>

						<div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
							<label v-for="fmt in displayFormats" :key="fmt.id"
								class="border rounded-xl p-3 flex flex-col justify-between cursor-pointer transition-all text-left select-none"
								:class="selectedFormatId === fmt.id
                  ? 'border-[#E8750D] bg-[#FFF7ED] ring-1 ring-[#E8750D]/30 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'">
								<input type="radio" :value="fmt.id" v-model="selectedFormatId" class="sr-only" />

								<div class="space-y-1">
									<div
										class="flex justify-between items-center text-xs font-bold text-[#141E1A] uppercase">
										<span>{{ fmt.format === 'hardcopy' ? 'Hardcopy' : fmt.format.toUpperCase()
											}}</span>
										<component :is="fmt.format === 'hardcopy' ? Truck : Download" :size="13"
											:class="selectedFormatId === fmt.id ? 'text-[#C25E00]' : 'text-slate-400'" />
									</div>
									<span class="text-[9.5px] text-[#5F6964] block leading-tight font-mono">
										<template v-if="fmt.format === 'hardcopy'">
											{{ `${fmt.stock || 0} in stock` }}
										</template>
										<template v-else>
											{{ formatFileSize(fmt.file_size_bytes) }}
										</template>
									</span>
								</div>

								<div
									class="pt-2 mt-2 border-t border-slate-200/60 flex items-center justify-between gap-1 font-mono text-xs">
									<span class="font-extrabold"
										:class="selectedFormatId === fmt.id ? 'text-[#B84A00]' : 'text-[#141E1A]'">
										{{ formatCurrency(fmt.price) }}
									</span>
									<span v-if="fmt.compare_at_price && fmt.compare_at_price > fmt.price"
										class="text-[10px] text-slate-400 line-through opacity-70">
										{{ formatCurrency(fmt.compare_at_price) }}
									</span>
								</div>
							</label>
						</div>
					</div>

					<!-- Quantity & Purchase Action with Instant In-Place Feedback -->
					<div class="pt-3 flex items-center gap-3">
						<div v-if="isPhysicalHardcopy" class="space-y-1">
							<span class="text-[9px] font-bold text-[#5F6964] uppercase block font-mono">Qty</span>
							<QuantityStepper v-model="quantity" />
						</div>

						<button type="button"
							class="flex-1 font-sans font-bold text-xs uppercase py-3.5 px-6 rounded-xl shadow-medium hover:shadow-high transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98]"
							:class="isRecentlyAdded
                ? 'bg-emerald-600 text-white'
                : 'bg-gradient-to-b from-[#F07514] via-[#E86C0E] to-[#D85F06] hover:from-[#E86C0E] hover:to-[#C85202] text-white'"
							@click="handleAddToCart">
							<Check v-if="isRecentlyAdded" :size="16" class="stroke-[3]" />
							<ShoppingBag v-else :size="15" />
							<span>{{ addToCartButtonLabel }}</span>
						</button>
					</div>

					<!-- Dynamic Reassurance Notice -->
					<div class="flex items-center gap-2 text-xs text-[#5F6964] pt-1">
						<CheckCircle2 :size="14" class="text-emerald-700 flex-shrink-0" />
						<span>{{ formatNoticeText }}</span>
					</div>

					<!-- Description -->
					<div v-if="book.description"
						class="pt-4 border-t border-slate-200/80 space-y-1.5 text-xs text-[#5F6964] leading-relaxed"
						v-html="book.description" />
				</div>
			</div>
		</main>

		<CartDrawer />
		<ToastContainer />
	</div>
</template>