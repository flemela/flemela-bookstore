<!-- components/storefront/StoreNavbar.vue -->
<script setup lang="ts">
import { ref } from 'vue';
import { ShoppingBag, Heart, User, Menu, X } from 'lucide-vue-next';
import { useCart } from '~/composables/useCart';

const { totalItems, openDrawer } = useCart();
const isMobileOpen = ref(false);

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Shop', href: '#catalog-results' },
  { label: 'Author', href: '#deals-week' },
  { label: 'Blog', href: '#' },
  { label: 'Help', href: 'https://wa.me/254700000000' },
];
</script>

<template>
  <header class="bg-[#04261B] text-white border-b border-white/10 sticky top-0 z-40">
    <div class="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
      
      <!-- Left: Logo Emblem -->
      <div class="flex items-center gap-3">
        <button
          type="button"
          class="md:hidden p-1.5 text-white/80 hover:text-white rounded-lg transition-colors cursor-pointer"
          aria-label="Toggle navigation menu"
          @click="isMobileOpen = !isMobileOpen"
        >
          <component :is="isMobileOpen ? X : Menu" :size="20" />
        </button>

        <NuxtLink to="/" class="flex items-center gap-2 group">
          <!-- Vector Logo S Mark -->
          <svg width="28" height="28" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 28C8 26 6 22 6 18C6 10.268 12.268 4 20 4C27.732 4 34 10.268 34 18C34 24 30 28 25 30"
              stroke="#26D48C"
              stroke-width="5"
              stroke-linecap="round"
            />
            <path
              d="M20 14C16 14 14 16 14 18C14 22 26 21 26 26C26 29 23 31 19 31C15 31 13 29 12 28"
              stroke="#26D48C"
              stroke-width="4.5"
              stroke-linecap="round"
            />
          </svg>
          <span class="font-display font-extrabold text-xl tracking-tight text-white group-hover:text-[#26D48C] transition-colors">
            Seller
          </span>
        </NuxtLink>
      </div>

      <!-- Center: Clean Menu Links (Desktop) -->
      <nav aria-label="Main navigation" class="hidden md:flex items-center gap-8 text-xs font-semibold text-white/80">
        <a
          v-for="link in navLinks"
          :key="link.label"
          :href="link.href"
          class="hover:text-white transition-colors"
        >
          {{ link.label }}
        </a>
      </nav>

      <!-- Right: Utility Badges (Cart with live counter, Heart, Profile) -->
      <div class="flex items-center gap-4 text-white">
        <!-- Shopping Cart (Live Badge) -->
        <button
          type="button"
          class="relative p-1.5 text-white hover:text-[#26D48C] transition-colors flex items-center justify-center cursor-pointer"
          title="Cart"
          @click="openDrawer"
        >
          <ShoppingBag :size="18" />
          <span
            v-if="totalItems > 0"
            class="absolute -top-1 -right-1.5 bg-[#F05A36] text-white font-mono text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs"
          >
            {{ totalItems }}
          </span>
          <span
            v-else
            class="absolute -top-1 -right-1.5 bg-[#F05A36] text-white font-mono text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center"
          >
            0
          </span>
        </button>

        <!-- Wishlist / Heart (0) -->
        <button
          type="button"
          class="relative p-1.5 text-white hover:text-[#F05A36] transition-colors hidden sm:flex items-center justify-center cursor-pointer"
          title="Saved Books"
        >
          <Heart :size="18" />
          <span class="absolute -top-1 -right-1.5 bg-[#F05A36] text-white font-mono text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
            0
          </span>
        </button>

        <!-- Profile Link -->
        <NuxtLink
          to="/admin/login"
          class="p-1.5 text-white hover:text-[#26D48C] transition-colors flex items-center justify-center"
          title="Admin Portal"
        >
          <User :size="18" />
        </NuxtLink>
      </div>
    </div>

    <!-- Mobile Navigation Drawer -->
    <div v-if="isMobileOpen" class="md:hidden bg-[#073022] border-t border-white/10 px-6 py-4 space-y-3">
      <div class="flex flex-col gap-3 text-xs font-semibold">
        <a
          v-for="link in navLinks"
          :key="link.label"
          :href="link.href"
          class="py-1.5 text-white/90 hover:text-white border-b border-white/5"
          @click="isMobileOpen = false"
        >
          {{ link.label }}
        </a>
        <NuxtLink to="/admin/login" class="py-1.5 text-[#26D48C] font-bold" @click="isMobileOpen = false">
          Admin Portal
        </NuxtLink>
      </div>
    </div>
  </header>
</template>