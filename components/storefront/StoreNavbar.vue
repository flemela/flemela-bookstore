<!-- components/storefront/StoreNavbar.vue -->
<script setup lang="ts">
import { ref } from 'vue';
import { ShoppingBag, Bookmark, User, Menu, X } from 'lucide-vue-next';
import { useCart } from '~/composables/useCart';

const { totalItems, openDrawer } = useCart();
const isMobileOpen = ref(false);

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Shop', href: '#catalog-results' },
  { label: 'Categories', href: '#categories-bento' },
  { label: 'Deals', href: '#deals-week' },
  { label: 'Help', href: 'https://wa.me/254700000000' },
];
</script>

<template>
  <header class="bg-theme-dark text-white border-b border-white/10 sticky top-0 z-40">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
      
      <!-- Left: Logo Emblem -->
      <div class="flex items-center gap-3">
        <button
          type="button"
          class="md:hidden p-1.5 text-white/80 hover:text-white rounded-lg transition-colors cursor-pointer"
          aria-label="Toggle navigation"
          @click="isMobileOpen = !isMobileOpen"
        >
          <component :is="isMobileOpen ? X : Menu" :size="20" />
        </button>

        <NuxtLink to="/" class="flex items-center gap-2 group">
          <div class="w-8 h-8 rounded-lg bg-theme-turquoise text-theme-dark flex items-center justify-center font-display font-extrabold text-lg shadow-sm">
            F
          </div>
          <span class="font-display font-extrabold text-lg sm:text-xl tracking-tight text-white group-hover:text-theme-turquoise transition-colors">
            flemela
          </span>
        </NuxtLink>
      </div>

      <!-- Center: Clean Menu Navigation (Desktop) -->
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

      <!-- Right: Utility Badges (Cart, Bookmark, Profile) -->
      <div class="flex items-center gap-3">
        <!-- Bookmark / Saved (0) -->
        <button
          type="button"
          class="relative p-2 text-white/80 hover:text-white transition-colors hidden sm:flex items-center justify-center cursor-pointer"
          title="Saved Books"
        >
          <Bookmark :size="17" />
          <span class="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-theme-coral text-white font-mono text-[9px] font-bold flex items-center justify-center">
            0
          </span>
        </button>

        <!-- Cart Bag with Live Counter -->
        <button
          type="button"
          class="relative p-2 text-white/80 hover:text-white transition-colors flex items-center justify-center cursor-pointer"
          title="Shopping Cart"
          @click="openDrawer"
        >
          <ShoppingBag :size="17" />
          <span
            v-if="totalItems > 0"
            class="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-theme-coral text-white font-mono text-[9px] font-bold flex items-center justify-center shadow-xs"
          >
            {{ totalItems }}
          </span>
          <span
            v-else
            class="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-white/20 text-white font-mono text-[9px] font-bold flex items-center justify-center"
          >
            0
          </span>
        </button>

        <!-- Profile / Admin Portal -->
        <NuxtLink
          to="/admin/login"
          class="p-2 text-white/80 hover:text-white transition-colors flex items-center justify-center"
          title="Admin Portal"
        >
          <User :size="17" />
        </NuxtLink>
      </div>
    </div>

    <!-- Mobile Drawer -->
    <div v-if="isMobileOpen" class="md:hidden bg-theme-forest border-t border-white/10 px-4 py-4 space-y-3">
      <div class="flex flex-col gap-2.5 text-xs font-semibold">
        <a
          v-for="link in navLinks"
          :key="link.label"
          :href="link.href"
          class="py-2 text-white/90 hover:text-white border-b border-white/5"
          @click="isMobileOpen = false"
        >
          {{ link.label }}
        </a>
        <NuxtLink to="/admin/login" class="py-2 text-theme-turquoise font-bold" @click="isMobileOpen = false">
          Admin Portal
        </NuxtLink>
      </div>
    </div>
  </header>
</template>