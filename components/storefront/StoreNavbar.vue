<!-- components/storefront/StoreNavbar.vue -->
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { ShoppingCart, Menu, X, Search, ChevronDown, Sparkles } from 'lucide-vue-next';
import WhatsAppIcon from '~/components/icons/WhatsAppIcon.vue';
import { useCart } from '~/composables/useCart';
import { buildWhatsAppLink } from '~/utils/phone';
import type { Book } from '~/types';

const emit = defineEmits<{
  search: [query: string];
  'select-category': [category: string];
  'request-book': [];
}>();

const { totalItems, openDrawer } = useCart();

const isMobileOpen = ref(false);
const searchInput = ref('');
const isCategoryDropdownOpen = ref(false);
let closeTimer: ReturnType<typeof setTimeout> | undefined;

// Dynamic categories extraction from catalog with baseline fallback
const { data: catalogBooks } = await useFetch<Book[]>('/api/products');

const categories = computed<string[]>(() => {
  const set = new Set<string>();
  if (catalogBooks.value) {
    for (const book of catalogBooks.value) {
      if (book.category_name && book.category_name.trim()) {
        set.add(book.category_name.trim());
      }
    }
  }
  if (set.size > 0) {
    return Array.from(set).sort();
  }
  return [
    'Business & Finance',
    'Psychology & Self-Help',
    'Self-Help',
    'Fiction & Literature',
    'Christian Books',
    'Education & Textbooks',
    'Biographies & Memoir',
  ];
});

const helpWhatsAppUrl = buildWhatsAppLink(
  'Hello The Sunrise Bookstore Help Desk, I need assistance with an order or book inquiry.'
);

// Standard text navigation links
const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Flash Sale', href: '#flash-sale' },
  { label: 'Categories', isCategoryMenu: true },
  { label: 'Bestsellers', href: '#bestsellers-week' },
  { label: 'Help', href: helpWhatsAppUrl, isExternal: true },
];

function submitSearch(): void {
  if (searchInput.value.trim()) {
    emit('search', searchInput.value.trim());
    isMobileOpen.value = false;
  }
}

function clearSearch(): void {
  searchInput.value = '';
  emit('search', '');
}

// Category selection: scrolls smoothly to catalogue and applies filter
function chooseCategory(cat: string): void {
  emit('select-category', cat);
  isCategoryDropdownOpen.value = false;
  isMobileOpen.value = false;

  if (process.client) {
    const el = document.getElementById('catalog-results');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }
}

// Trigger Custom Sourcing / Book Request Modal
function handleRequestBookClick(event: Event): void {
  event.preventDefault();
  emit('request-book');
  isMobileOpen.value = false;
}

// Hover ergonomics with grace buffer
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

// Close dropdown on outside click
function handleOutsideClick(event: MouseEvent): void {
  const target = event.target as HTMLElement | null;
  if (target && !target.closest('#nav-category-dropdown') && !target.closest('#nav-category-trigger')) {
    isCategoryDropdownOpen.value = false;
  }
}

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
});
</script>

<template>
  <header
    class="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 transition-all shadow-[0_4px_20px_rgba(5,34,25,0.04)] select-none"
  >
    <!-- Top Row: Real Logo & Main Navigation -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
      <!-- Left: Mobile Trigger & Authentic Real Logo -->
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

      <!-- Center: Desktop Navigation Links + "Request Book!" Brand Orange CTA -->
      <nav aria-label="Main Navigation" class="hidden md:flex items-center gap-7 text-xs font-bold tracking-wide">
        <template v-for="link in navLinks" :key="link.label">
          <!-- Categories Dropdown (Hover & Click) -->
          <div
            v-if="link.isCategoryMenu"
            class="relative"
            @mouseenter="onCategoryMouseEnter"
            @mouseleave="onCategoryMouseLeave"
          >
            <button
              id="nav-category-trigger"
              type="button"
              class="nav-link-item text-[#052219] py-1 flex items-center gap-1 cursor-pointer font-bold select-none"
              :class="{ 'text-[#E8750D]': isCategoryDropdownOpen }"
              @click.stop="toggleCategoryDropdown"
            >
              <span>Categories</span>
              <ChevronDown
                :size="13"
                class="transition-transform duration-200 text-slate-500"
                :class="{ 'rotate-180 text-[#E8750D]': isCategoryDropdownOpen }"
              />
            </button>

            <!-- Dropdown Menu Panel -->
            <Transition name="dropdown-fade">
              <div
                v-if="isCategoryDropdownOpen"
                id="nav-category-dropdown"
                class="absolute top-full left-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 text-left"
                @mouseenter="onCategoryMouseEnter"
                @mouseleave="onCategoryMouseLeave"
              >
                <div class="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between">
                  <span class="text-[10px] font-mono uppercase font-bold text-slate-400 tracking-wider">
                    Browse Genres
                  </span>
                  <span class="text-[10px] font-mono text-[#E8750D] font-bold">
                    {{ categories.length }} Categories
                  </span>
                </div>

                <div class="max-h-72 overflow-y-auto py-1">
                  <button
                    type="button"
                    class="w-full text-left px-4 py-2 hover:bg-[#FFF7ED] hover:text-[#C25E00] text-xs font-bold transition-colors text-slate-800 cursor-pointer flex items-center justify-between group"
                    @click="chooseCategory('ALL')"
                  >
                    <span>All Editions</span>
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

          <!-- Standard Text Links (Home, Flash Sale, Bestsellers, Help) -->
          <a
            v-else
            :href="link.href"
            :target="link.isExternal ? '_blank' : undefined"
            :rel="link.isExternal ? 'noopener noreferrer' : undefined"
            class="nav-link-item text-[#052219] py-1 cursor-pointer"
          >
            {{ link.label }}
          </a>
        </template>

        <!-- Prominent "Request Book!" Call-To-Action (Styled in Brand Orange) -->
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

      <!-- Right: Action Icons (WhatsApp Messenger + Supermarket Cart) -->
      <div class="flex items-center gap-3 sm:gap-4 text-[#052219]">
        <!-- 1. WhatsApp Messenger Button -->
        <a
          :href="helpWhatsAppUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="p-1.5 text-[#25D366] hover:text-[#1eb855] hover:bg-emerald-50 rounded-lg transition-all cursor-pointer flex items-center justify-center"
          title="Chat with The Sunrise Bookstore on WhatsApp"
          aria-label="Chat with The Sunrise Bookstore on WhatsApp"
        >
          <WhatsAppIcon class="w-5 h-5 transition-transform hover:scale-110" />
        </a>

        <!-- 2. Supermarket Cart Button with Live Item Badge -->
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

    <!-- Row 2: Search Bar Strip -->
    <div
      class="w-full px-4 sm:px-6 py-2.5 sm:py-3 transition-all relative overflow-hidden"
      style="
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.35) 100%);
        backdrop-filter: blur(20px) saturate(180%);
        -webkit-backdrop-filter: blur(20px) saturate(180%);
        border-top: 1px solid rgba(255, 255, 255, 0.7);
        border-bottom: 1px solid rgba(5, 34, 25, 0.08);
        box-shadow: 0 8px 32px 0 rgba(5, 34, 25, 0.04), inset 0 1px 1px 0 rgba(255, 255, 255, 0.9);
      "
    >
      <form
        class="max-w-3xl mx-auto flex items-center gap-2 relative z-10"
        @submit.prevent="submitSearch"
      >
        <div
          class="flex-1 flex items-center gap-2 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full transition-all duration-300 shadow-sm focus-within:shadow-md"
          style="
            background: rgba(255, 255, 255, 0.85);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.95);
          "
        >
          <Search :size="16" class="text-slate-400 flex-shrink-0" />

          <input
            v-model="searchInput"
            type="text"
            placeholder="Search books by title, author, or ISBN..."
            class="w-full bg-transparent text-xs sm:text-sm text-[#052219] placeholder:text-slate-400 outline-none font-sans font-medium"
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
      </form>
    </div>

    <!-- Mobile Drawer Menu -->
    <div
      v-if="isMobileOpen"
      class="md:hidden bg-white/95 backdrop-blur-xl border-t border-slate-200 px-6 py-4 space-y-4 shadow-xl max-h-[85vh] overflow-y-auto"
    >
      <div class="flex flex-col gap-2.5 text-xs font-bold tracking-wide">
        <!-- Prominent Mobile Request Book CTA -->
        <button
          type="button"
          class="w-full text-center bg-[#E8750D] hover:bg-[#D45B05] text-white font-extrabold text-xs uppercase tracking-wider py-2.5 px-4 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer mb-1"
          @click="handleRequestBookClick"
        >
          <Sparkles :size="14" />
          <span>Request Book!</span>
        </button>

        <a
          href="/"
          class="py-2 text-[#052219] hover:text-[#E8750D] border-b border-slate-100 transition-colors"
          @click="isMobileOpen = false"
        >
          Home
        </a>
        <a
          href="#flash-sale"
          class="py-2 text-[#052219] hover:text-[#E8750D] border-b border-slate-100 transition-colors"
          @click="isMobileOpen = false"
        >
          Flash Sale
        </a>
        <a
          href="#bestsellers-week"
          class="py-2 text-[#052219] hover:text-[#E8750D] border-b border-slate-100 transition-colors"
          @click="isMobileOpen = false"
        >
          Bestsellers
        </a>
        <a
          :href="helpWhatsAppUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="py-2 text-[#25D366] font-bold border-b border-slate-100 flex items-center gap-2"
          @click="isMobileOpen = false"
        >
          <WhatsAppIcon class="w-4 h-4 text-[#25D366]" />
          <span>Help & Support</span>
        </a>
      </div>

      <!-- Mobile Categories List -->
      <div class="pt-2">
        <span class="text-[10px] font-mono uppercase font-bold text-slate-400 tracking-wider block mb-2">
          Filter Catalogue by Genre:
        </span>
        <div class="grid grid-cols-2 gap-2">
          <button
            type="button"
            class="text-left px-3 py-2 rounded-lg bg-slate-50 text-[11px] font-bold text-[#E8750D] border border-orange-200"
            @click="chooseCategory('ALL')"
          >
            All Editions
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