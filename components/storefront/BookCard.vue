<!-- components/storefront/BookCard.vue -->
<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { ShoppingCart, Plus, Check, Zap, Flame, Tag, Clock, Star } from 'lucide-vue-next';
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

const formatCaption = computed<string>(() => {
  const captions: string[] = [];
  for (const fmt of availableFormats.value) {
    const label = fmt.format === 'hardcopy' ? 'Hardcopy' : 'eBook';
    if (!captions.includes(label)) captions.push(label);
  }
  return captions.join(' + ');
});

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
	<!-- COMPACT CARD (Flash Sale & Deals Strips): flat cover, one badge, price row -->
	<div v-if="compact"
		class="w-full h-full bg-white text-[#141E1A] rounded-2xl border border-slate-100 p-2.5 flex flex-col justify-between group select-none text-left transition-all duration-200 hover:shadow-card hover:-translate-y-0.5">
		<div class="flex flex-col flex-1 min-h-0">
			<!-- Flat cover -->
			<NuxtLink :to="book.isSeed ? '#' : `/book/${book.slug}`"
				class="block relative w-full aspect-[2/3] rounded-xl overflow-hidden bg-[#141E1A] shadow-[0_2px_10px_rgba(0,0,0,0.12)]"
				:aria-label="`View details for ${book.name}`" @click="handleCardClick">
				<div v-if="imageFailed || !coverImage"
					class="absolute inset-0 flex flex-col justify-between p-2.5 bg-gradient-to-br from-[#141E1A] to-[#242D28] text-white text-left select-none">
					<div class="space-y-0.5">
						<span class="text-[8px] font-mono uppercase tracking-wider text-[#FFD29D] font-bold block truncate">
							{{ book.category_name || 'Book' }}
						</span>
						<h4 class="font-display font-bold text-[11px] leading-tight line-clamp-3 text-white">
							{{ book.name }}
						</h4>
					</div>
					<span class="text-[9px] font-mono text-white/70 truncate block pt-1 border-t border-white/10">
						{{ book.author || 'Edition' }}
					</span>
				</div>
				<img v-else :src="coverImage" :alt="`Cover for ${book.name}`"
					class="absolute inset-0 w-full h-full object-cover" loading="lazy" width="160" height="240"
					referrerpolicy="no-referrer" @error="handleImageError" />
			</NuxtLink>

			<!-- Badge + title + author -->
			<div class="pt-2 flex flex-col gap-0.5 min-w-0">
				<span v-if="badgeInfo"
					class="self-start inline-flex items-center gap-1 text-[8px] font-mono font-bold uppercase tracking-wider text-[#FFD29D] bg-[#141E1A] px-1.5 py-0.5 rounded">
					<component :is="badgeInfo.icon" :size="8" />
					{{ badgeInfo.label }}
				</span>

				<NuxtLink :to="book.isSeed ? '#' : `/book/${book.slug}`" class="block" @click="handleCardClick">
					<h3 class="font-display text-[12px] sm:text-[13px] font-bold text-[#141E1A] group-hover:text-[#E8750D] transition-colors line-clamp-1 leading-snug"
						:title="book.name">
						{{ book.name }}
					</h3>
				</NuxtLink>

				<p class="text-[10px] sm:text-[10.5px] text-slate-500 truncate leading-tight">
					{{ displayAuthor }}
				</p>
				<p v-if="formatCaption" class="text-[8.5px] font-mono uppercase tracking-wider text-slate-400 leading-tight">
					{{ formatCaption }}
				</p>
			</div>
		</div>

		<!-- Price row: strikethrough + current + discount chip + add button -->
		<div class="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
			<div class="flex items-baseline gap-1.5 min-w-0 flex-wrap">
				<span v-if="originalPrice && originalPrice > currentPrice"
					class="text-[10px] sm:text-[10.5px] text-slate-400 line-through font-mono leading-none">
					{{ formatCurrency(originalPrice) }}
				</span>
				<span class="text-[13px] sm:text-[14px] font-black font-mono leading-tight text-[#141E1A] tracking-tight">
					{{ formatCurrency(currentPrice) }}
				</span>
				<span v-if="discountPercentage > 0"
					class="text-[8.5px] sm:text-[9px] font-mono font-bold text-white bg-red-600 px-1 py-0.5 rounded">
					−{{ discountPercentage }}%
				</span>
			</div>

			<button type="button"
				class="w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0 active:scale-95"
				:class="isRecentlyAdded
          ? 'bg-emerald-600 text-white'
          : 'bg-[#141E1A] hover:bg-[#E8750D] text-white'"
				:title="isRecentlyAdded ? 'Added to cart' : (book.isSeed ? 'Request book' : 'Add to cart')"
				:aria-label="isRecentlyAdded ? 'Added to cart' : (book.isSeed ? 'Request book' : 'Add to cart')"
				@click="handleAddToCart">
				<Check v-if="isRecentlyAdded" :size="16" class="stroke-[3]" />
				<Plus v-else :size="17" class="stroke-[2.5]" />
			</button>
		</div>
	</div>

	<!-- FULL CARD (Main Catalog Archive) -->
	<div v-else
		class="w-full h-full bg-white text-[#141E1A] rounded-2xl p-3 shadow-card hover:shadow-xl hover:-translate-y-0.5 hover:border-[#E8750D]/50 transition-all duration-200 flex flex-col justify-between group select-none text-left border border-slate-100">
		<div class="flex flex-col flex-1">
			<div class="relative mb-2.5 w-full aspect-[2/3] max-h-[225px] rounded-xl overflow-hidden bg-[#141E1A] shadow-[0_2px_12px_rgba(0,0,0,0.12)]">
				<NuxtLink :to="book.isSeed ? '#' : `/book/${book.slug}`"
					class="block w-full h-full cursor-pointer" :aria-label="`View details for ${book.name}`"
					@click="handleCardClick">
					<div v-if="imageFailed || !coverImage"
						class="absolute inset-0 flex flex-col justify-between p-3 bg-gradient-to-br from-[#141E1A] to-[#242D28] text-white text-left select-none">
						<div class="space-y-1">
							<span class="text-[9px] font-mono uppercase tracking-widest text-[#FFD29D] font-bold block truncate">
								{{ book.category_name || 'Book' }}
							</span>
							<h4 class="font-display font-bold text-sm leading-tight line-clamp-3 text-white">
								{{ book.name }}
							</h4>
						</div>
						<span class="text-[9px] font-mono text-white/70 truncate block pt-1 border-t border-white/10">
							{{ book.author || 'Edition' }}
						</span>
					</div>
					<img v-else :src="coverImage" :alt="`Cover for ${book.name}`" class="absolute inset-0 w-full h-full object-cover"
						loading="lazy" width="160" height="240" referrerpolicy="no-referrer"
						@error="handleImageError" />
				</NuxtLink>
			</div>

			<span v-if="badgeInfo"
				class="self-start inline-flex items-center gap-1 text-[9px] font-mono font-bold uppercase tracking-wider text-[#FFD29D] bg-[#141E1A] px-2 py-0.5 rounded">
				<component :is="badgeInfo.icon" :size="9" />
				{{ badgeInfo.label }}
			</span>

			<NuxtLink :to="book.isSeed ? '#' : `/book/${book.slug}`" class="block mt-1" @click="handleCardClick">
				<h3 class="font-display text-sm sm:text-[15px] font-bold text-[#141E1A] group-hover:text-[#E8750D] transition-colors line-clamp-1 leading-snug"
					:title="book.name">
					{{ book.name }}
				</h3>
			</NuxtLink>

			<p class="text-[11px] sm:text-xs text-slate-500 truncate mt-0.5">
				{{ displayAuthor }}
			</p>
			<p v-if="formatCaption" class="text-[9px] font-mono uppercase tracking-wider text-slate-400 mt-0.5 leading-tight">
				{{ formatCaption }}
			</p>

			<!-- Format Selection -->
			<div class="mt-2 space-y-1" role="radiogroup" aria-label="Reading format selection">
				<template v-if="availableFormats.length > 1">
					<button v-for="fmt in availableFormats" :key="fmt.id" type="button" role="radio"
						:aria-checked="activeFormat?.id === fmt.id"
						class="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-sans transition-all cursor-pointer select-none leading-tight border"
						:class="
              activeFormat?.id === fmt.id
                ? 'border-[#E8750D] bg-[#FFF7ED] text-[#C25E00] font-extrabold'
                : 'border-slate-200 bg-slate-50/80 text-slate-700 hover:border-orange-300 hover:bg-orange-50/40 font-bold'
            " @click="selectFormat(fmt.id, $event)">
						<span class="truncate pr-1">{{ getFormatDisplayLabel(fmt) }}</span>
						<span class="font-mono font-black text-xs flex-shrink-0"
							:class="activeFormat?.id === fmt.id ? 'text-[#B84A00]' : 'text-slate-700'">
							{{ formatCurrency(fmt.price) }}
						</span>
					</button>
				</template>
				<div v-else-if="activeFormat"
					class="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border border-[#E8750D] bg-[#FFF7ED] text-xs font-sans font-extrabold text-[#C25E00]">
					<span class="truncate pr-1">{{ getFormatDisplayLabel(activeFormat) }}</span>
					<span class="font-mono font-black text-xs flex-shrink-0 text-[#B84A00]">
						{{ formatCurrency(activeFormat.price) }}
					</span>
				</div>
			</div>
		</div>

		<!-- Bottom Action Row -->
		<div class="pt-2.5 mt-2 border-t border-slate-100 flex flex-col gap-1.5">
			<div class="flex items-baseline gap-1.5 flex-wrap">
				<span v-if="originalPrice && originalPrice > currentPrice"
					class="text-xs text-slate-400 line-through font-mono font-bold leading-none">
					{{ formatCurrency(originalPrice) }}
				</span>
				<span class="text-lg font-black font-mono leading-tight text-[#141E1A] tracking-tight">
					{{ formatCurrency(currentPrice) }}
				</span>
				<span v-if="discountPercentage > 0"
					class="text-[9px] font-mono font-bold text-white bg-red-600 px-1 py-0.5 rounded">
					SAVE {{ discountPercentage }}%
				</span>
			</div>

			<button type="button"
				class="w-full flex items-center justify-center gap-1.5 rounded-xl font-bold text-xs sm:text-sm py-2.5 transition-all duration-200 cursor-pointer active:scale-[0.98]"
				:class="isRecentlyAdded
          ? 'bg-emerald-600 text-white'
          : 'bg-[#141E1A] hover:bg-[#E8750D] text-white'"
				@click="handleAddToCart">
				<Check v-if="isRecentlyAdded" :size="16" class="stroke-[3]" />
				<ShoppingCart v-else :size="15" />
				<span>{{ isRecentlyAdded ? 'Added to Cart ✓' : (book.isSeed ? 'Request Book' : 'Add to Cart') }}</span>
			</button>
		</div>
	</div>
</template>
