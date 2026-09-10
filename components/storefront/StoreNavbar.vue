<!-- components/storefront/StoreNavbar.vue -->
<script setup lang="ts">
import { ref } from 'vue';
import { ShoppingBag, Heart, User, Menu, X, Search } from 'lucide-vue-next';
import { useCart } from '~/composables/useCart';
import { buildWhatsAppLink } from '~/utils/phone';

const emit = defineEmits<{
  search: [query: string];
}>();

const { totalItems, openDrawer } = useCart();
const isMobileOpen = ref(false);
const searchInput = ref('');

const conciergeWhatsAppUrl = buildWhatsAppLink(
  'Hello The Sunrise Bookstore Concierge, I have an inquiry.'
);

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Flash Sale', href: '#flash-sale' },
  { label: 'Categories', href: '#categories-bento' },
  { label: 'Bestsellers', href: '#bestsellers-week' },
  { label: 'Catalogue', href: '#catalog-results' },
  { label: 'Concierge', href: conciergeWhatsAppUrl, isExternal: true },
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
</script>

<template>
  <header
    class="bg-white/90 backdrop-blur-md border-b border-slate-200/70 sticky top-0 z-40 transition-all shadow-[0_4px_20px_rgba(5,34,25,0.04)] select-none"
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
      <!-- Left: Mobile Menu Trigger & Brand Identity -->
      <div class="flex items-center gap-3">
        <button
          type="button"
          class="md:hidden p-1.5 text-[#052219] hover:bg-slate-100/80 rounded-lg transition-colors cursor-pointer"
          aria-label="Toggle navigation menu"
          @click="isMobileOpen = !isMobileOpen"
        >
          <component :is="isMobileOpen ? X : Menu" :size="20" />
        </button>

        <NuxtLink to="/" class="flex items-center gap-2.5 group">
          <svg width="26" height="26" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 28C7 25 5 21 5 16C5 8.268 11.268 2 19 2C26.732 2 33 8.268 33 16C33 22 29 27 24 29"
              stroke="#052219"
              stroke-width="5"
              stroke-linecap="round"
            />
            <path
              d="M19 12C15 12 13 14 13 16C13 20 25 19 25 24C25 27 22 29 18 29C14 29 12 27 11 26"
              stroke="#E8750D"
              stroke-width="4.5"
              stroke-linecap="round"
            />
          </svg>
          <span class="font-sans font-extrabold text-base sm:text-lg tracking-tight text-[#052219] group-hover:text-[#C18B2F] transition-colors">
            The Sunrise Bookstore
          </span>
        </NuxtLink>
      </div>

      <!-- Center: Desktop Navigation Links -->
      <nav aria-label="Main Navigation" class="hidden md:flex items-center gap-8 text-xs font-bold tracking-wide">
        <a
          v-for="link in navLinks"
          :key="link.label"
          :href="link.href"
          :target="link.isExternal ? '_blank' : undefined"
          :rel="link.isExternal ? 'noopener noreferrer' : undefined"
          class="nav-link-item text-[#052219] py-1 cursor-pointer"
        >
          {{ link.label }}
        </a>
      </nav>

      <!-- Right: Action Icons (Wishlist, Cart, Profile) -->
      <div class="flex items-center gap-2 sm:gap-3.5 text-[#052219]">
        <button
          type="button"
          class="relative p-1.5 hover:text-[#C18B2F] transition-colors hidden sm:block cursor-pointer"
          aria-label="Wishlist"
        >
          <Heart :size="17" />
        </button>

        <!-- Cart Bag with Live Quantity Badge -->
        <button
          type="button"
          class="relative p-1.5 hover:text-[#C18B2F] transition-colors cursor-pointer"
          aria-label="Open Cart"
          @click="openDrawer"
        >
          <ShoppingBag :size="17" />
          <span
            v-if="totalItems > 0"
            class="absolute -top-1 -right-1 bg-[#E8750D] text-white font-mono text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs"
          >
            {{ totalItems }}
          </span>
        </button>

        <NuxtLink
          to="/admin/login"
          class="p-1.5 hover:text-[#C18B2F] transition-colors"
          title="Admin Portal"
        >
          <User :size="17" />
        </NuxtLink>
      </div>
    </div>

    <!-- Row 2: Permanent Ultra-Glassmorphic Search Strip -->
    <div
      class="w-full px-4 sm:px-6 py-2.5 sm:py-3 transition-all relative overflow-hidden"
      style="
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.55) 0%, rgba(255, 255, 255, 0.28) 100%);
        backdrop-filter: blur(20px) saturate(180%);
        -webkit-backdrop-filter: blur(20px) saturate(180%);
        border-top: 1px solid rgba(255, 255, 255, 0.7);
        border-bottom: 1px solid rgba(5, 34, 25, 0.08);
        box-shadow: 0 8px 32px 0 rgba(5, 34, 25, 0.04), inset 0 1px 1px 0 rgba(255, 255, 255, 0.9);
      "
    >
      <div
        class="absolute inset-0 bg-gradient-to-r from-white/30 via-transparent to-white/20 pointer-events-none"
      />

      <form
        class="max-w-3xl mx-auto flex items-center gap-2 relative z-10"
        @submit.prevent="submitSearch"
      >
        <div
          class="flex-1 flex items-center gap-2 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full transition-all duration-300 shadow-sm focus-within:shadow-md"
          style="
            background: rgba(255, 255, 255, 0.82);
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
      class="md:hidden bg-white/95 backdrop-blur-xl border-t border-slate-200 px-6 py-4 space-y-3 shadow-xl"
    >
      <div class="flex flex-col gap-3 text-xs font-bold tracking-wide">
        <a
          v-for="link in navLinks"
          :key="link.label"
          :href="link.href"
          class="py-2 text-[#052219] hover:text-[#C18B2F] border-b border-slate-100 transition-colors"
          @click="isMobileOpen = false"
        >
          {{ link.label }}
        </a>
        <NuxtLink
          to="/admin/login"
          class="py-2 text-[#E8750D] font-extrabold"
          @click="isMobileOpen = false"
        >
          Admin Portal
        </NuxtLink>
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
  color: #C18B2F;
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
</style>