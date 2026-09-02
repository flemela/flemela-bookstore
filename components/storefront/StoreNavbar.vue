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
  <header class="bg-[#052219] text-white sticky top-0 z-40">
    <div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
      
      <!-- Left: Logo -->
      <div class="flex items-center gap-3">
        <button
          type="button"
          class="md:hidden p-1 text-white/80 hover:text-white cursor-pointer"
          @click="isMobileOpen = !isMobileOpen"
        >
          <component :is="isMobileOpen ? X : Menu" :size="22" />
        </button>

        <NuxtLink to="/" class="flex items-center gap-2">
          <!-- Teal/Green Brand Mark -->
          <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
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
          <span class="font-sans font-bold text-xl tracking-tight text-white">
            Seller
          </span>
        </NuxtLink>
      </div>

      <!-- Center: Menu Links -->
      <nav class="hidden md:flex items-center gap-9 text-xs font-semibold text-white/80">
        <a
          v-for="link in navLinks"
          :key="link.label"
          :href="link.href"
          class="hover:text-white transition-colors"
        >
          {{ link.label }}
        </a>
      </nav>

      <!-- Right: Badges -->
      <div class="flex items-center gap-4 text-white">
        <!-- Cart -->
        <button
          type="button"
          class="relative p-1 text-white hover:text-[#2EE59D] transition-colors cursor-pointer"
          @click="openDrawer"
        >
          <ShoppingBag :size="18" />
          <span
            class="absolute -top-1 -right-2 bg-[#F05A36] text-white font-mono text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center"
          >
            {{ totalItems }}
          </span>
        </button>

        <!-- Wishlist -->
        <button type="button" class="relative p-1 text-white hover:text-[#F05A36] transition-colors hidden sm:block cursor-pointer">
          <Heart :size="18" />
          <span class="absolute -top-1 -right-2 bg-[#F05A36] text-white font-mono text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
            0
          </span>
        </button>

        <!-- Profile -->
        <NuxtLink to="/admin/login" class="p-1 text-white hover:text-[#2EE59D] transition-colors">
          <User :size="18" />
        </NuxtLink>
      </div>
    </div>

    <!-- Mobile Drawer -->
    <div v-if="isMobileOpen" class="md:hidden bg-[#072d21] border-t border-white/10 px-6 py-4 space-y-3">
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
        <NuxtLink to="/admin/login" class="py-1.5 text-[#2EE59D] font-bold" @click="isMobileOpen = false">
          Admin Portal
        </NuxtLink>
      </div>
    </div>
  </header>
</template>