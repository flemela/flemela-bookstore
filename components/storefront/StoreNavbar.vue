<!-- components/storefront/StoreNavbar.vue -->
<script setup lang="ts">
import { ref } from 'vue';
import { ShoppingBag, Heart, User, Menu, X, Search } from 'lucide-vue-next';
import { useCart } from '~/composables/useCart';

const emit = defineEmits<{
  search: [query: string];
}>();

const { totalItems, openDrawer } = useCart();
const isMobileOpen = ref(false);
const isSearchOpen = ref(false);
const searchInput = ref('');

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Flash Sale', href: '#flash-sale' },
  { label: 'Categories', href: '#categories-bento' },
  { label: 'Bestsellers', href: '#catalog-results' },
  { label: 'Deals', href: '#deals-week' },
  { label: 'Concierge', href: 'https://wa.me/254700000000' },
];

function submitSearch(): void {
  if (searchInput.value.trim()) {
    emit('search', searchInput.value.trim());
    isSearchOpen.value = false;
    isMobileOpen.value = false;
  }
}
</script>

<template>
  <header
    class="bg-[#052219]/90 backdrop-blur-md border-b border-white/10 sticky top-0 z-40 transition-all shadow-[0_2px_12px_rgba(0,0,0,0.12)] select-none"
  >
    <!-- Compact Container: Height ~54px on Mobile, ~60px on Desktop -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-15 flex items-center justify-between gap-3">
      
      <!-- Left: Mobile Menu Trigger & Brand Mark -->
      <div class="flex items-center gap-3">
        <button
          type="button"
          class="md:hidden p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          aria-label="Toggle navigation menu"
          @click="isMobileOpen = !isMobileOpen"
        >
          <component :is="isMobileOpen ? X : Menu" :size="20" />
        </button>

        <NuxtLink to="/" class="flex items-center gap-2 group">
          <!-- Teal/Mint Brand Mark -->
          <svg width="26" height="26" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 28C7 25 5 21 5 16C5 8.268 11.268 2 19 2C26.732 2 33 8.268 33 16C33 22 29 27 24 29"
              stroke="#2EE59D"
              stroke-width="5"
              stroke-linecap="round"
            />
            <path
              d="M19 12C15 12 13 14 13 16C13 20 25 19 25 24C25 27 22 29 18 29C14 29 12 27 11 26"
              stroke="#2EE59D"
              stroke-width="4.5"
              stroke-linecap="round"
            />
          </svg>
          <span class="font-sans font-extrabold text-lg sm:text-xl tracking-tight text-white group-hover:text-[#2EE59D] transition-colors">
            Flemela
          </span>
        </NuxtLink>
      </div>

      <!-- Center: Desktop Menu Links -->
      <nav aria-label="Main Navigation" class="hidden md:flex items-center gap-7 text-xs font-semibold text-white/80">
        <a
          v-for="link in navLinks"
          :key="link.label"
          :href="link.href"
          class="hover:text-white transition-colors"
        >
          {{ link.label }}
        </a>
      </nav>

      <!-- Right: Search, Cart, Profile Actions -->
      <div class="flex items-center gap-2 sm:gap-3.5 text-white">
        <!-- Quick Search Toggle -->
        <button
          type="button"
          class="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          aria-label="Search catalog"
          @click="isSearchOpen = !isSearchOpen"
        >
          <Search :size="17" />
        </button>

        <!-- Wishlist (Desktop) -->
        <button
          type="button"
          class="relative p-1.5 text-white/80 hover:text-[#F05A36] transition-colors hidden sm:block cursor-pointer"
          aria-label="Wishlist"
        >
          <Heart :size="17" />
        </button>

        <!-- Cart Icon with Badge -->
        <button
          type="button"
          class="relative p-1.5 text-white hover:text-[#2EE59D] transition-colors cursor-pointer"
          aria-label="Open Cart"
          @click="openDrawer"
        >
          <ShoppingBag :size="17" />
          <span
            v-if="totalItems > 0"
            class="absolute -top-1 -right-1 bg-[#F05A36] text-white font-mono text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs"
          >
            {{ totalItems }}
          </span>
        </button>

        <!-- Profile / Admin Portal -->
        <NuxtLink
          to="/admin/login"
          class="p-1.5 text-white/80 hover:text-[#2EE59D] transition-colors"
          title="Admin Portal"
        >
          <User :size="17" />
        </NuxtLink>
      </div>
    </div>

    <!-- Collapsible Quick Search Dropdown Bar -->
    <div v-if="isSearchOpen" class="border-t border-white/10 px-4 py-2 bg-[#052219]/95 backdrop-blur-md">
      <form class="max-w-2xl mx-auto flex items-center gap-2" @submit.prevent="submitSearch">
        <input
          v-model="searchInput"
          type="text"
          placeholder="Search books by title, author, or ISBN..."
          class="flex-1 px-3.5 py-1.5 bg-white/10 border border-white/15 rounded-full text-xs text-white placeholder:text-white/50 outline-none focus:border-[#2EE59D] transition-all font-sans"
          autofocus
        />
        <button
          type="submit"
          class="bg-[#F05A36] hover:bg-[#D94827] text-white text-[11px] font-bold uppercase tracking-wider px-4 py-1.5 rounded-full transition-all cursor-pointer"
        >
          Search
        </button>
      </form>
    </div>

    <!-- Mobile Drawer Menu -->
    <div v-if="isMobileOpen" class="md:hidden bg-[#072d21]/95 backdrop-blur-lg border-t border-white/10 px-6 py-4 space-y-3">
      <div class="flex flex-col gap-2.5 text-xs font-semibold">
        <a
          v-for="link in navLinks"
          :key="link.label"
          :href="link.href"
          class="py-1.5 text-white/90 hover:text-white border-b border-white/5"
          @click="isMobileOpen = false"
        >
          {{ link.label }}
        </a>
        <NuxtLink
          to="/admin/login"
          class="py-1.5 text-[#2EE59D] font-bold"
          @click="isMobileOpen = false"
        >
          Admin Portal
        </NuxtLink>
      </div>
    </div>
  </header>
</template>