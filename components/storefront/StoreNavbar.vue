<!-- components/storefront/StoreNavbar.vue -->
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import {
  ShoppingCart,
  Menu,
  X,
  Search,
  ChevronDown,
  Sparkles,
  LayoutGrid,
  BookOpen,
  ArrowRight,
  Zap,
} from 'lucide-vue-next';
import WhatsAppIcon from '~/components/icons/WhatsAppIcon.vue';
import { useCart } from '~/composables/useCart';
import { buildWhatsAppLink } from '~/utils/phone';
import { MONTHLY_TOP_SEEDS, DEALS_SEEDS, mergeWithSeeds } from '~/data/seeds';
import type { Book } from '~/types';

const router = useRouter();

const emit = defineEmits<{
  search: [query: string];
  'select-category': [category: string];
  'request-book': [];
}>();

const { totalItems, openDrawer } = useCart();

const isMobileOpen = ref(false);
const searchInput = ref('');
const isCategoryDropdownOpen = ref(false);
const isSearchDropdownOpen = ref(false);
const selectedIndex = ref(-1);
const searchContainerRef = ref<HTMLElement | null>(null);

let debounceTimer: ReturnType<typeof setTimeout> | undefined;
let closeTimer: ReturnType<typeof setTimeout> | undefined;

// Catalog products dataset
const { data: catalogResponse } = await useFetch<any>('/api/products');

const allBooks = computed<Book[]>(() => {
  const remoteList: Book[] = Array.isArray(catalogResponse.value)
    ? catalogResponse.value
    : catalogResponse.value?.products || [];
  return mergeWithSeeds(remoteList, [...MONTHLY_TOP_SEEDS, ...DEALS_SEEDS], 12);
});

const categories = computed<string[]>(() => {
  const set = new Set<string>();
  for (const book of allBooks.value) {
    if (book?.category_name && book.category_name.trim()) {
      const name = book.category_name.trim();
      if (name.toLowerCase() !== 'general') {
        set.add(name);
      }
    }
  }
  return set.size > 0
    ? Array.from(set).sort()
    : ['Business & Finance', 'Psychology & Self-Help', 'Self-Help', 'Fiction & Literature'];
});

// Live recommendations from global search endpoint
const searchSuggestions = ref<Book[]>([]);

watch(searchInput, (val) => {
  if (debounceTimer) clearTimeout(debounceTimer);
  selectedIndex.value = -1;

  const queryText = val.trim();
  if (!queryText) {
    searchSuggestions.value = [];
    isSearchDropdownOpen.value = false;
    return;
  }

  debounceTimer = setTimeout(async () => {
    try {
      const results = await $fetch<Book[]>('/api/products/search', {
        query: { q: queryText },
      });
      searchSuggestions.value = results || [];
      isSearchDropdownOpen.value = searchSuggestions.value.length > 0;
    } catch {
      searchSuggestions.value = [];
    }
  }, 120);
});

function getLowestPrice(book: Book): number {
  if (book.formats && book.formats.length > 0) {
    const prices = book.formats.map((f) => f.price).filter((p) => p > 0);
    if (prices.length > 0) return Math.min(...prices);
  }
  return book.price || 999;
}

function selectSuggestion(book: Book): void {
  isSearchDropdownOpen.value = false;
  searchInput.value = book.name;
  router.push(`/book/${book.slug}`);
}

function submitSearch(): void {
  if (selectedIndex.value >= 0 && searchSuggestions.value[selectedIndex.value]) {
    selectSuggestion(searchSuggestions.value[selectedIndex.value]);
    return;
  }

  if (searchInput.value.trim()) {
    emit('search', searchInput.value.trim());
    isSearchDropdownOpen.value = false;
    isMobileOpen.value = false;
  }
}

function handleKeydown(e: KeyboardEvent): void {
  if (!isSearchDropdownOpen.value || searchSuggestions.value.length === 0) {
    if (e.key === 'Enter') {
      submitSearch();
    }
    return;
  }

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    selectedIndex.value = (selectedIndex.value + 1) % searchSuggestions.value.length;
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    selectedIndex.value = (selectedIndex.value - 1 + searchSuggestions.value.length) % searchSuggestions.value.length;
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (selectedIndex.value >= 0 && searchSuggestions.value[selectedIndex.value]) {
      selectSuggestion(searchSuggestions.value[selectedIndex.value]);
    } else {
      submitSearch();
    }
  } else if (e.key === 'Escape') {
    isSearchDropdownOpen.value = false;
  }
}

function clearSearch(): void {
  searchInput.value = '';
  searchSuggestions.value = [];
  isSearchDropdownOpen.value = false;
  emit('search', '');
}

function chooseCategory(cat: string): void {
  emit('select-category', cat);
  isCategoryDropdownOpen.value = false;
  isMobileOpen.value = false;

  if (process.client) {
    const el = document.getElementById('catalog-results');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }
}

function handleRequestBookClick(event: Event): void {
  event.preventDefault();
  emit('request-book');
  isMobileOpen.value = false;
}

function onCategoryMouseEnter(): void {
  if (closeTimer) clearTimeout(closeTimer);
  isCategoryDropdownOpen.value = true;
}

function onCategoryMouseLeave(): void {
  closeTimer = setTimeout(() => {
    isCategoryDropdownOpen.value = false;
  }, 160);
}

function toggleCategoryDropdown(): void {
  isCategoryDropdownOpen.value = !isCategoryDropdownOpen.value;
}

function handleOutsideClick(event: MouseEvent): void {
  const target = event.target as HTMLElement | null;
  if (target && !target.closest('#nav-category-dropdown') && !target.closest('#nav-category-trigger')) {
    isCategoryDropdownOpen.value = false;
  }
  if (searchContainerRef.value && !searchContainerRef.value.contains(target as Node)) {
    isSearchDropdownOpen.value = false;
  }
}

const helpWhatsAppUrl = buildWhatsAppLink(
  'Hello The Sunrise Bookstore Help Desk, I need assistance with an order or book inquiry.'
);

onMounted(() => {
  if (process.client) {
    window.addEventListener('click', handleOutsideClick);
  }
});

onUnmounted(() => {
  if (process.client) {
    window.removeEventListener('click', handleOutsideClick);
  }
  if (closeTimer) clearTimeout(closeTimer);
  if (debounceTimer) clearTimeout(debounceTimer);
});
</script>

<template>
  <header
    class="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 shadow-[0_4px_20px_rgba(5,34,25,0.05)] select-none"
  >
    <!-- Top Row: Brand & Navigation -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <button
          type="button"
          class="md:hidden p-1.5 text-[#052219] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          aria-label="Toggle navigation menu"
          @click="isMobileOpen = !isMobileOpen"
        >
          <component :is="isMobileOpen ? X : Menu" :size="20" />
        </button>

        <NuxtLink to="/" class="flex items-center group py-1" aria-label="The Sunrise Bookstore Home">
          <img
            src="/images/logo.png"
            alt="The Sunrise Bookstore"
            class="h-8 sm:h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
            loading="eager"
            width="120"
            height="40"
          />
        </NuxtLink>
      </div>

      <!-- Center Desktop Navigation -->
      <nav aria-label="Main Navigation" class="hidden md:flex items-center gap-6 lg:gap-7 text-xs font-bold tracking-wide">
        <a href="/" class="nav-link-item text-[#052219] py-1 cursor-pointer">Home</a>

        <!-- Category Dropdown -->
        <div
          class="relative"
          @mouseenter="onCategoryMouseEnter"
          @mouseleave="onCategoryMouseLeave"
        >
          <button
            id="nav-category-trigger"
            type="button"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 hover:border-[#E8750D] text-[#052219] hover:text-[#E8750D] bg-slate-50/70 hover:bg-[#FFF7ED] transition-all cursor-pointer font-bold select-none text-xs"
            :class="{ 'border-[#E8750D] text-[#E8750D] bg-[#FFF7ED] shadow-2xs': isCategoryDropdownOpen }"
            @click.stop="toggleCategoryDropdown"
          >
            <LayoutGrid :size="13" class="text-[#E8750D] flex-shrink-0" />
            <span>Categories</span>
            <ChevronDown
              :size="12"
              class="transition-transform duration-200 text-slate-500 flex-shrink-0"
              :class="{ 'rotate-180 text-[#E8750D]': isCategoryDropdownOpen }"
            />
          </button>

          <Transition name="dropdown-fade">
            <div
              v-if="isCategoryDropdownOpen"
              id="nav-category-dropdown"
              class="absolute top-full left-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 text-left"
            >
              <div class="px-4 py-1.5 border-b border-slate-100 flex items-center justify-between">
                <span class="text-[10px] font-mono uppercase font-bold text-slate-400 tracking-wider">
                  Store Catalog
                </span>
                <span class="text-[10px] font-mono text-[#E8750D] font-bold">
                  {{ categories.length + 1 }} Options
                </span>
              </div>

              <div class="max-h-72 overflow-y-auto py-1">
                <button
                  type="button"
                  class="w-full text-left px-4 py-2 hover:bg-[#FFF7ED] hover:text-[#C25E00] text-xs font-bold transition-colors text-slate-900 cursor-pointer flex items-center justify-between group"
                  @click="chooseCategory('General')"
                >
                  <span class="flex items-center gap-1.5">
                    <span class="w-1.5 h-1.5 rounded-full bg-[#E8750D]"></span>
                    General (All Books)
                  </span>
                  <span class="text-[10px] font-mono text-slate-400 group-hover:text-[#E8750D]">↗</span>
                </button>

                <button
                  v-for="cat in categories"
                  :key="cat"
                  type="button"
                  class="w-full text-left px-4 py-2 hover:bg-[#FFF7ED] hover:text-[#C25E00] text-xs font-semibold transition-colors text-slate-700 cursor-pointer flex items-center justify-between group"
                  @click="chooseCategory(cat)"
                >
                  <span class="truncate pr-2">{{ cat }}</span>
                  <span class="text-[10px] font-mono text-slate-400 group-hover:text-[#E8750D]">↗</span>
                </button>
              </div>
            </div>
          </Transition>
        </div>

        <a href="#flash-sale" class="nav-link-item text-[#052219] py-1 cursor-pointer">Flash Sale</a>
        <a href="#bestsellers-week" class="nav-link-item text-[#052219] py-1 cursor-pointer">Bestsellers</a>
        <a :href="helpWhatsAppUrl" target="_blank" rel="noopener noreferrer" class="nav-link-item text-[#052219] py-1 cursor-pointer">Help</a>

        <button
          type="button"
          class="bg-[#E8750D] hover:bg-[#D45B05] active:bg-[#B84A00] text-white text-[11px] font-extrabold uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-xs hover:shadow transition-all duration-200 cursor-pointer active:scale-95 flex items-center gap-1.5 flex-shrink-0"
          title="Request any title you can't find in stock"
          @click="handleRequestBookClick"
        >
          <Sparkles :size="12" class="text-white" />
          <span>Request Book!</span>
        </button>
      </nav>

      <!-- Right Action Icons -->
      <div class="flex items-center gap-3 sm:gap-4 text-[#052219]">
        <a
          :href="helpWhatsAppUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="p-1.5 text-[#25D366] hover:text-[#1eb855] hover:bg-emerald-50 rounded-lg transition-all cursor-pointer flex items-center justify-center"
          title="Chat with The Sunrise Bookstore on WhatsApp"
        >
          <WhatsAppIcon class="w-5 h-5 transition-transform hover:scale-110" />
        </a>

        <button
          type="button"
          class="relative p-1.5 text-[#052219] hover:text-[#E8750D] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
          aria-label="Open Shopping Cart"
          @click="openDrawer"
        >
          <ShoppingCart :size="19" class="transition-transform hover:scale-105" />
          <span
            v-if="totalItems > 0"
            class="absolute -top-1 -right-1 bg-[#E8750D] text-white font-mono text-[9px] font-bold min-w-4 h-4 px-1 rounded-full flex items-center justify-center shadow-xs"
          >
            {{ totalItems }}
          </span>
        </button>
      </div>
    </div>

    <!-- Row 2: Search Bar Strip with Instant Recommendations Dropdown -->
    <div
      ref="searchContainerRef"
      class="w-full px-4 sm:px-6 py-2.5 sm:py-3 transition-all relative overflow-visible bg-slate-50/70 border-t border-slate-100"
    >
      <form
        class="max-w-3xl mx-auto flex items-center gap-2 relative z-20"
        @submit.prevent="submitSearch"
      >
        <div
          class="flex-1 flex items-center gap-2 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white border border-slate-200 transition-all shadow-xs focus-within:border-[#E8750D] focus-within:ring-1 focus-within:ring-[#E8750D]/20 relative"
        >
          <Search :size="16" class="text-slate-400 flex-shrink-0" />

          <input
            v-model="searchInput"
            type="text"
            placeholder="Search books by title, author, or keyword (typo tolerant)..."
            class="w-full bg-transparent text-xs sm:text-sm text-[#052219] placeholder:text-slate-400 outline-none font-sans font-medium"
            autocomplete="off"
            @focus="isSearchDropdownOpen = searchSuggestions.length > 0"
            @keydown="handleKeydown"
          />

          <button
            v-if="searchInput"
            type="button"
            class="text-slate-400 hover:text-[#052219] p-0.5 transition-colors cursor-pointer"
            aria-label="Clear search"
            @click="clearSearch"
          >
            <X :size="14" />
          </button>
        </div>

        <button
          type="submit"
          class="bg-[#E8750D] hover:bg-[#D45B05] text-white text-[11px] sm:text-xs font-bold uppercase tracking-wider px-5 sm:px-6 py-2.5 rounded-full transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md active:scale-95 flex-shrink-0 flex items-center gap-1.5"
        >
          <Search :size="13" class="hidden sm:inline" />
          <span>Search</span>
        </button>

        <!-- RECOMMENDATIONS DROPDOWN -->
        <Transition name="dropdown-fade">
          <div
            v-if="isSearchDropdownOpen && searchSuggestions.length > 0"
            class="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden z-50 text-left divide-y divide-slate-100"
          >
            <div class="px-4 py-2 bg-[#FFF7ED] border-b border-orange-100 flex items-center justify-between text-xs">
              <div class="flex items-center gap-1.5 text-[#C25E00] font-semibold text-[11px]">
                <Zap :size="12" class="text-[#E8750D]" />
                <span>Recommendations for "<strong>{{ searchInput }}</strong>":</span>
              </div>
              <span class="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Closest Match</span>
            </div>

            <!-- List of Recommended Titles -->
            <div class="max-h-80 overflow-y-auto py-1">
              <button
                v-for="(book, idx) in searchSuggestions"
                :key="book.id"
                type="button"
                class="w-full px-3.5 py-2.5 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer"
                :class="selectedIndex === idx ? 'bg-[#FFF7ED] text-[#C25E00]' : 'hover:bg-slate-50 text-slate-900'"
                @click="selectSuggestion(book)"
              >
                <!-- Cover & Info -->
                <div class="flex items-center gap-3 min-w-0 flex-1">
                  <div class="w-9 h-12 rounded bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center shadow-2xs">
                    <img
                      v-if="book.images?.[0]?.image_url || (book as any).cover_image_url"
                      :src="book.images?.[0]?.image_url || (book as any).cover_image_url"
                      :alt="book.name"
                      class="w-full h-full object-cover"
                      referrerpolicy="no-referrer"
                    />
                    <BookOpen v-else :size="14" class="text-slate-400 opacity-40" />
                  </div>

                  <div class="min-w-0 flex-1 space-y-0.5">
                    <h4 class="text-xs font-bold truncate leading-tight">
                      {{ book.name }}
                    </h4>
                    <p class="text-[11px] text-slate-500 truncate italic">
                      {{ book.author || book.category_name || 'Publisher Edition' }}
                    </p>
                  </div>
                </div>

                <!-- Price and Arrow -->
                <div class="flex items-center gap-2 flex-shrink-0 text-right font-mono">
                  <div class="flex flex-col items-end">
                    <span class="text-xs font-bold text-slate-900">
                      KSh {{ getLowestPrice(book).toLocaleString('en-KE') }}
                    </span>
                    <span class="text-[9px] text-slate-400 uppercase">
                      {{ book.formats?.some(f => f.format === 'pdf') ? 'eBook / Print' : 'Hardcopy' }}
                    </span>
                  </div>
                  <ArrowRight :size="13" class="text-slate-400" />
                </div>
              </button>
            </div>

            <!-- Footer: See all filtered matches -->
            <div class="p-2.5 bg-slate-50 text-center border-t border-slate-100">
              <button
                type="button"
                class="text-xs font-bold text-[#E8750D] hover:underline cursor-pointer inline-flex items-center gap-1"
                @click="submitSearch"
              >
                <span>Filter all results for "{{ searchInput }}" in catalogue</span>
                <ArrowRight :size="12" />
              </button>
            </div>
          </div>
        </Transition>
      </form>
    </div>

    <!-- Mobile Drawer Menu -->
    <div
      v-if="isMobileOpen"
      class="md:hidden bg-white border-t border-slate-200 px-6 py-4 space-y-4 shadow-xl max-h-[85vh] overflow-y-auto"
    >
      <div class="flex flex-col gap-2.5 text-xs font-bold tracking-wide">
        <button
          type="button"
          class="w-full text-center bg-[#E8750D] hover:bg-[#D45B05] text-white font-extrabold text-xs uppercase tracking-wider py-2.5 px-4 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer mb-1"
          @click="handleRequestBookClick"
        >
          <Sparkles :size="14" />
          <span>Request Book!</span>
        </button>

        <a href="/" class="py-2 text-[#052219] hover:text-[#E8750D] border-b border-slate-100 transition-colors" @click="isMobileOpen = false">Home</a>
        <a href="#flash-sale" class="py-2 text-[#052219] hover:text-[#E8750D] border-b border-slate-100 transition-colors" @click="isMobileOpen = false">Flash Sale</a>
        <a href="#bestsellers-week" class="py-2 text-[#052219] hover:text-[#E8750D] border-b border-slate-100 transition-colors" @click="isMobileOpen = false">Bestsellers</a>
        <a :href="helpWhatsAppUrl" target="_blank" rel="noopener noreferrer" class="py-2 text-[#25D366] font-bold border-b border-slate-100 flex items-center gap-2" @click="isMobileOpen = false">
          <WhatsAppIcon class="w-4 h-4 text-[#25D366]" />
          <span>Help & Support</span>
        </a>
      </div>

      <div class="pt-2">
        <span class="text-[10px] font-mono uppercase font-bold text-slate-400 tracking-wider block mb-2">
          Filter by Category:
        </span>
        <div class="grid grid-cols-2 gap-2">
          <button
            type="button"
            class="text-left px-3 py-2 rounded-lg bg-slate-50 text-[11px] font-bold text-[#E8750D] border border-orange-200"
            @click="chooseCategory('General')"
          >
            General (All Books)
          </button>
          <button
            v-for="cat in categories"
            :key="cat"
            type="button"
            class="text-left px-3 py-2 rounded-lg bg-slate-50 text-[11px] font-semibold text-slate-800 border border-slate-100 truncate"
            @click="chooseCategory(cat)"
          >
            {{ cat }}
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.nav-link-item {
  position: relative;
  display: inline-block;
  transition: color 0.25s ease;
}

.nav-link-item:hover {
  color: #E8750D;
}

.nav-link-item::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 50%;
  width: 100%;
  height: 2px;
  background-color: #E8750D;
  transform: translateX(-50%) scaleX(0);
  transform-origin: center;
  transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
  border-radius: 9999px;
}

.nav-link-item:hover::after {
  transform: translateX(-50%) scaleX(1);
}

.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>