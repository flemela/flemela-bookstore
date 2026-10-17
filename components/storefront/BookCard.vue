<!-- components/storefront/BookCard.vue -->
<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { ShoppingCart, Plus, Check, Star, Zap, Flame, Tag, Clock } from 'lucide-vue-next';
import { useCart } from '~/composables/useCart';
import { useToast } from '~/composables/useToast';
import type { Book, ProductFormat, BookFormatType } from '~/types';

interface Props {
  book: Book;
  compact?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  compact: false,
});

const emit = defineEmits<{
  requestSeed: [title: string, author?: string];
}>();

const { addItem } = useCart();
const { push: pushToast } = useToast();

const imageFailed = ref(false);
const selectedFormatId = ref<string>('');
const isRecentlyAdded = ref(false);
let addedTimer: ReturnType<typeof setTimeout> | undefined;

// Rating between 4.0 and 5.0
const bookRating = computed(() => {
  const str = props.book.id || props.book.name || 'book';
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const absHash = Math.abs(hash);
  const score = 4.0 + (absHash % 11) * 0.1;
  const reviews = 35 + (absHash % 245);
  return {
    rating: Math.min(5.0, Math.max(4.0, Number(score.toFixed(1)))),
    reviewsCount: reviews,
  };
});

// 1. Available digital formats
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

// 2. Hardcopy format
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

// 3. Combined formats
const availableFormats = computed<ProductFormat[]>(() => {
  const list: ProductFormat[] = [];
  if (hardcopyFormat.value) {
    list.push(hardcopyFormat.value);
  }
  list.push(...availableDigitalFormats.value);
  return list;
});

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

function getFormatDisplayLabel(fmt: ProductFormat): string {
  if (fmt.format === 'hardcopy') return 'Hardcopy';
  if (fmt.format === 'pdf') return 'eBook (PDF)';
  if (fmt.format === 'epub') return 'eBook (EPUB)';
  return String(fmt.format || '').toUpperCase();
}

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

type BadgeInfo = { icon: typeof Zap; label: string } | null;

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

  // Tactile in-place feedback without opening the cart drawer
  isRecentlyAdded.value = true;
  if (addedTimer) clearTimeout(addedTimer);
  addedTimer = setTimeout(() => {
    isRecentlyAdded.value = false;
  }, 1400);

  pushToast({
    message: `Added "${props.book.name}" to cart`,
    variant: 'success',
  });
}
</script>

<template>
	<!-- COMPACT CARD WITH 3D COVER & RED DISCOUNT MEDALLION (Flash Sale & Deals Strips) -->
	<div v-if="compact"
		class="w-full h-full bg-white text-[#141E1A] rounded-xl p-2 sm:p-2.5 shadow-subtle hover:shadow-card hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between group select-none text-left border border-slate-200/80 relative">
		<div class="flex flex-col flex-1">
			<!-- 3D Book Stage (Scaled Down for Sleek Thin Strip) -->
			<div
				class="sunrise-book-stage relative mb-1.5 w-full aspect-[1/1.12] max-h-[142px] sm:max-h-[156px] rounded-lg flex items-center justify-center p-1.5 overflow-visible">
				<NuxtLink :to="book.isSeed ? '#' : `/book/${book.slug}`"
					class="sunrise-3d-book-assembly block cursor-pointer !w-[62%] sm:!w-[65%] !max-w-[94px]"
					:aria-label="`View details for ${book.name}`" @click="handleCardClick">
					<div class="sunrise-3d-cast-shadow" aria-hidden="true" />
					<div class="sunrise-3d-back-board" aria-hidden="true" />
					<div class="sunrise-3d-pages-side" aria-hidden="true" />

					<div class="sunrise-3d-front bg-stone-100">
						<div v-if="imageFailed || !coverImage"
							class="w-full h-full flex flex-col justify-between p-2 bg-gradient-to-br from-[#141E1A] to-[#242D28] text-white text-left select-none">
							<div class="space-y-0.5">
								<span
									class="text-[8px] font-mono uppercase tracking-wider text-[#FFD29D] font-bold block truncate">
									{{ book.category_name || 'Book' }}
								</span>
								<h4 class="font-display font-bold text-[10.5px] leading-tight line-clamp-2 text-white">
									{{ book.name }}
								</h4>
							</div>
							<span
								class="text-[8.5px] font-mono text-white/70 truncate block pt-1 border-t border-white/10">
								{{ book.author || 'Edition' }}
							</span>
						</div>

						<img v-else :src="coverImage" :alt="`Cover for ${book.name}`" class="w-full h-full object-cover"
							loading="lazy" width="94" height="136" referrerpolicy="no-referrer"
							@error="handleImageError" />

						<div class="sunrise-3d-spine-crease" aria-hidden="true" />
						<div class="sunrise-3d-sheen" aria-hidden="true" />
					</div>

					<span v-if="badgeInfo"
						class="absolute top-1 left-1.5 bg-[#141E1A]/95 text-[#FFD29D] font-mono font-bold text-[8px] px-1 py-0.2 rounded uppercase z-20 flex items-center gap-0.5 shadow-xs border border-white/10 pointer-events-none">
						<component :is="badgeInfo.icon" :size="7.5" />
						{{ badgeInfo.label }}
					</span>
				</NuxtLink>

				<!-- Red Discount Medallion -->
				<div v-if="discountPercentage > 0"
					class="absolute top-1 right-1 z-20 w-8 h-8 sm:w-8.5 sm:h-8.5 flex items-center justify-center pointer-events-none drop-shadow-[0_2px_5px_rgba(220,38,38,0.5)]"
					aria-hidden="true">
					<svg viewBox="0 0 100 100" class="w-full h-full text-red-600 fill-current">
						<polygon
							points="98,50 89.2,57.8 94.3,68.4 83.3,72.2 83.9,83.9 72.2,83.3 68.4,94.3 57.8,89.2 50,98 42.2,89.2 31.6,94.3 27.8,83.3 16.1,83.9 16.7,72.2 5.7,68.4 10.8,57.8 2,50 10.8,42.2 5.7,31.6 16.7,27.8 16.1,16.1 27.8,16.7 31.6,5.7 42.2,10.8 50,2 57.8,10.8 68.4,5.7 72.2,16.7 83.9,16.1 83.3,27.8 94.3,31.6 89.2,42.2" />
					</svg>
					<span
						class="absolute inset-0 flex items-center justify-center font-black font-mono text-[9px] sm:text-[9.5px] text-white tracking-tighter drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]">
						-{{ discountPercentage }}%
					</span>
				</div>
			</div>

			<!-- Title -->
			<NuxtLink :to="book.isSeed ? '#' : `/book/${book.slug}`" class="block mt-0.5" @click="handleCardClick">
				<h3 class="font-display text-[11px] sm:text-xs font-bold text-[#141E1A] group-hover:text-[#E8750D] transition-colors line-clamp-1 leading-snug"
					:title="book.name">
					{{ book.name }}
				</h3>
			</NuxtLink>

			<!-- Author -->
			<p class="text-[10px] sm:text-[10.5px] text-[#5F6964] italic truncate mt-0.5 leading-tight">
				{{ displayAuthor }}
			</p>
		</div>

		<!-- Bottom Row: Prices & Compact Cart Action with In-Place Feedback -->
		<div class="pt-1.5 mt-1.5 border-t border-slate-100 flex items-center justify-between gap-1.5">
			<div class="flex items-baseline gap-1 min-w-0">
				<span v-if="originalPrice && originalPrice > currentPrice"
					class="text-[9.5px] sm:text-[10.5px] text-slate-400 line-through font-mono font-medium leading-none truncate">
					{{ formatCurrency(originalPrice) }}
				</span>
				<span
					class="text-xs sm:text-[13px] font-black font-mono leading-tight text-[#141E1A] tracking-tight flex-shrink-0">
					{{ formatCurrency(currentPrice) }}
				</span>
			</div>

			<!-- Compact 32px Action Button with Instant Feedback -->
			<button type="button"
				class="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-2xs shrink-0 active:scale-95"
				:class="isRecentlyAdded
          ? 'bg-emerald-600 text-white'
          : 'bg-slate-100 hover:bg-[#E8750D] hover:text-white text-slate-800'"
				:title="isRecentlyAdded ? 'Added to cart' : 'Add to cart'"
				:aria-label="isRecentlyAdded ? 'Added to cart' : 'Add to cart'" @click="handleAddToCart">
				<Check v-if="isRecentlyAdded" :size="14" class="stroke-[3]" />
				<Plus v-else :size="15" class="stroke-[2.5]" />
			</button>
		</div>
	</div>

	<!-- FULL CARD (Main Catalog Archive) -->
	<div v-else
		class="w-full h-full bg-white text-[#141E1A] rounded-2xl p-2.5 sm:p-3 shadow-card hover:shadow-xl hover:-translate-y-1 hover:border-[#E8750D]/60 transition-all duration-200 flex flex-col justify-between group select-none text-left border border-slate-200/80 relative">
		<div class="flex flex-col flex-1">
			<div
				class="sunrise-book-stage relative mb-2 w-full aspect-[1/1.18] max-h-[210px] rounded-xl flex items-center justify-center p-2">
				<NuxtLink :to="book.isSeed ? '#' : `/book/${book.slug}`"
					class="sunrise-3d-book-assembly block cursor-pointer" :aria-label="`View details for ${book.name}`"
					@click="handleCardClick">
					<div class="sunrise-3d-cast-shadow" aria-hidden="true" />
					<div class="sunrise-3d-back-board" aria-hidden="true" />
					<div class="sunrise-3d-pages-side" aria-hidden="true" />

					<div class="sunrise-3d-front bg-stone-100">
						<div v-if="imageFailed || !coverImage"
							class="w-full h-full flex flex-col justify-between p-2.5 bg-gradient-to-br from-[#141E1A] to-[#242D28] text-white text-left select-none">
							<div class="space-y-0.5">
								<span
									class="text-[9.5px] font-mono uppercase tracking-widest text-[#FFD29D] font-bold block truncate">
									{{ book.category_name || 'Book' }}
								</span>
								<h4
									class="font-display font-bold text-xs sm:text-sm leading-tight line-clamp-3 text-white">
									{{ book.name }}
								</h4>
							</div>
							<span
								class="text-[9.5px] font-mono text-white/70 truncate block pt-1 border-t border-white/10">
								{{ book.author || 'Edition' }}
							</span>
						</div>

						<img v-else :src="coverImage" :alt="`Cover for ${book.name}`" class="w-full h-full object-cover"
							loading="lazy" width="128" height="186" referrerpolicy="no-referrer"
							@error="handleImageError" />

						<div class="sunrise-3d-spine-crease" aria-hidden="true" />
						<div class="sunrise-3d-sheen" aria-hidden="true" />
					</div>

					<span v-if="badgeInfo"
						class="absolute top-1.5 left-2 bg-[#141E1A]/95 text-[#FFD29D] font-mono font-bold text-[9px] px-1.5 py-0.5 rounded uppercase z-20 flex items-center gap-1 shadow-xs border border-white/10 pointer-events-none">
						<component :is="badgeInfo.icon" :size="9" />
						{{ badgeInfo.label }}
					</span>
				</NuxtLink>

				<!-- Red Discount Medallion -->
				<div v-if="discountPercentage > 0"
					class="absolute top-2 right-2 z-20 w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center pointer-events-none drop-shadow-[0_3px_8px_rgba(220,38,38,0.5)]"
					aria-hidden="true">
					<svg viewBox="0 0 100 100" class="w-full h-full text-red-600 fill-current">
						<polygon
							points="98,50 89.2,57.8 94.3,68.4 83.3,72.2 83.9,83.9 72.2,83.3 68.4,94.3 57.8,89.2 50,98 42.2,89.2 31.6,94.3 27.8,83.3 16.1,83.9 16.7,72.2 5.7,68.4 10.8,57.8 2,50 10.8,42.2 5.7,31.6 16.7,27.8 16.1,16.1 27.8,16.7 31.6,5.7 42.2,10.8 50,2 57.8,10.8 68.4,5.7 72.2,16.7 83.9,16.1 83.3,27.8 94.3,31.6 89.2,42.2" />
					</svg>
					<span
						class="absolute inset-0 flex items-center justify-center font-black font-mono text-[11px] sm:text-[12px] text-white tracking-tighter drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
						-{{ discountPercentage }}%
					</span>
				</div>
			</div>

			<NuxtLink :to="book.isSeed ? '#' : `/book/${book.slug}`" class="block" @click="handleCardClick">
				<h3 class="font-display text-sm sm:text-base font-bold text-[#141E1A] group-hover:text-[#E8750D] transition-colors line-clamp-1 leading-snug"
					:title="book.name">
					{{ book.name }}
				</h3>
			</NuxtLink>

			<p class="text-xs text-[#5F6964] italic truncate mt-0.5">
				{{ displayAuthor }}
			</p>

			<div class="flex items-center gap-1.5 mt-1 select-none" aria-label="Rating">
				<div class="flex items-center gap-0.5" aria-hidden="true">
					<Star v-for="s in 5" :key="s" :size="11"
						:class="s <= Math.round(bookRating.rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-300 fill-slate-100'" />
				</div>
				<span class="text-[11px] font-mono font-bold text-slate-700 leading-none">
					{{ bookRating.rating.toFixed(1) }}
				</span>
				<span class="text-[10px] font-mono text-slate-400 leading-none">
					({{ bookRating.reviewsCount }})
				</span>
			</div>

			<!-- Format Selection -->
			<div class="mt-2 space-y-1" role="radiogroup" aria-label="Reading format selection">
				<template v-if="availableFormats.length > 1">
					<button v-for="fmt in availableFormats" :key="fmt.id" type="button" role="radio"
						:aria-checked="activeFormat?.id === fmt.id"
						class="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs sm:text-[13px] font-sans transition-all cursor-pointer select-none leading-tight border"
						:class="
              activeFormat?.id === fmt.id
                ? 'border-[#E8750D] bg-[#FFF7ED] text-[#C25E00] font-extrabold shadow-xs ring-1 ring-[#E8750D]/30'
                : 'border-slate-200 bg-slate-50/90 text-slate-700 hover:border-orange-300 hover:bg-orange-50/40 font-bold'
            " @click="selectFormat(fmt.id, $event)">
						<span class="truncate pr-1">{{ getFormatDisplayLabel(fmt) }}</span>
						<span class="font-mono font-black text-xs sm:text-[13px] flex-shrink-0"
							:class="activeFormat?.id === fmt.id ? 'text-[#B84A00]' : 'text-slate-700'">
							{{ formatCurrency(fmt.price) }}
						</span>
					</button>
				</template>
				<div v-else-if="activeFormat"
					class="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border-2 border-[#E8750D] text-xs sm:text-[13px] font-sans font-extrabold bg-[#FFF7ED] text-[#C25E00] shadow-xs">
					<span class="truncate pr-1">{{ getFormatDisplayLabel(activeFormat) }}</span>
					<span class="font-mono font-black text-xs sm:text-[13px] flex-shrink-0 text-[#B84A00]">
						{{ formatCurrency(activeFormat.price) }}
					</span>
				</div>
			</div>
		</div>

		<!-- Bottom Action Row with In-Place Added Feedback -->
		<div class="pt-2 mt-2 border-t border-slate-200/80 flex flex-col gap-1.5">
			<div class="flex items-baseline gap-1.5">
				<span v-if="originalPrice && originalPrice > currentPrice"
					class="text-xs sm:text-sm text-slate-400 line-through decoration-slate-400 decoration-1 font-mono font-bold leading-none">
					{{ formatCurrency(originalPrice) }}
				</span>
				<span class="text-base sm:text-lg font-black font-mono leading-tight text-[#141E1A] tracking-tight">
					{{ formatCurrency(currentPrice) }}
				</span>
			</div>

			<button type="button"
				class="w-full flex items-center justify-center gap-1.5 rounded-xl font-bold text-xs sm:text-sm py-2 sm:py-2.5 transition-all duration-200 cursor-pointer active:scale-95 shadow-xs hover:shadow border-t border-white/20"
				:class="isRecentlyAdded
          ? 'bg-emerald-600 text-white'
          : 'bg-gradient-to-b from-[#F07514] via-[#E86C0E] to-[#D85F06] hover:from-[#E86C0E] hover:to-[#C85202] text-white'"
				@click="handleAddToCart">
				<Check v-if="isRecentlyAdded" :size="16" class="stroke-[3]" />
				<ShoppingCart v-else :size="15" fill="currentColor"
					class="transition-transform group-hover:scale-105" />
				<span>{{ isRecentlyAdded ? 'Added to Cart âœ“' : (book.isSeed ? 'Request Book' : 'Add to Cart')
					}}</span>
			</button>
		</div>
	</div>
</template>