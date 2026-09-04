<!-- components/admin/AdminLayout.vue -->
<script setup lang="ts">
import {
  BookOpen,
  LayoutDashboard,
  FileSpreadsheet,
  PlusCircle,
  MapPin,
  ExternalLink,
  LogOut,
  Zap,
  Images,
} from 'lucide-vue-next';
import { useAdminAuth } from '~/composables/useAdminAuth';

const { logout } = useAdminAuth();
const route = useRoute();
</script>

<template>
  <div class="min-h-screen bg-paper-canvas text-ink flex flex-col antialiased">
    <!-- Top Admin Header -->
    <header class="bg-forest-950 text-paper py-2.5 px-4 sm:px-6 shadow-medium sticky top-0 z-40 border-b border-forest-900/80 backdrop-blur-md">
      <div class="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        <!-- Brand Identity -->
        <NuxtLink to="/admin" class="flex items-center gap-2.5 group">
          <img
            src="/images/logo.png"
            alt="Flemela Logo"
            class="h-8 sm:h-9 w-auto object-contain brightness-0 invert transition-transform duration-300 group-hover:scale-105"
          />
          <span class="text-[9px] uppercase tracking-widest text-gold-300 font-mono font-bold hidden sm:inline-block pl-2 border-l border-white/15">
            Admin Portal
          </span>
        </NuxtLink>

        <!-- Navigation Links -->
        <nav aria-label="Admin Navigation" class="flex items-center gap-1 sm:gap-1.5 text-xs font-semibold">
          <NuxtLink
            to="/admin"
            class="px-2.5 py-1.5 rounded-lg transition-all"
            :class="route.path === '/admin' ? 'bg-white/15 text-paper font-bold shadow-2xs' : 'text-paper/70 hover:text-paper hover:bg-white/5'"
          >
            <span class="hidden sm:inline">Overview</span>
            <LayoutDashboard :size="15" class="sm:hidden" />
          </NuxtLink>

          <NuxtLink
            to="/admin/books"
            class="px-2.5 py-1.5 rounded-lg transition-all"
            :class="route.path.startsWith('/admin/books') && !route.path.includes('import') && !route.path.includes('new') ? 'bg-white/15 text-paper font-bold shadow-2xs' : 'text-paper/70 hover:text-paper hover:bg-white/5'"
          >
            <span class="hidden sm:inline">Catalog</span>
            <BookOpen :size="15" class="sm:hidden" />
          </NuxtLink>

          <!-- Promotional Hero Banners Manager Link -->
          <NuxtLink
            to="/admin/banners"
            class="px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1"
            :class="route.path.includes('banners') ? 'bg-white/15 text-paper font-bold shadow-2xs' : 'text-paper/70 hover:text-paper hover:bg-white/5'"
          >
            <Images :size="13" class="text-gold-300" />
            <span class="hidden sm:inline">Banners</span>
          </NuxtLink>

          <NuxtLink
            to="/admin/location"
            class="px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1"
            :class="route.path.includes('location') ? 'bg-white/15 text-paper font-bold shadow-2xs' : 'text-paper/70 hover:text-paper hover:bg-white/5'"
          >
            <MapPin :size="13" class="text-gold-300" />
            <span class="hidden sm:inline">Hub &amp; Delivery</span>
          </NuxtLink>

          <NuxtLink
            to="/admin/mpesa"
            class="px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1"
            :class="route.path.includes('mpesa') ? 'bg-white/15 text-paper font-bold shadow-2xs' : 'text-paper/70 hover:text-paper hover:bg-white/5'"
          >
            <Zap :size="13" class="text-emerald-400" />
            <span class="hidden sm:inline">M-Pesa</span>
          </NuxtLink>

          <NuxtLink
            to="/admin/books/import"
            class="px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1"
            :class="route.path.includes('import') ? 'bg-white/15 text-paper font-bold shadow-2xs' : 'text-paper/70 hover:text-paper hover:bg-white/5'"
          >
            <FileSpreadsheet :size="13" class="text-gold-400" />
            <span class="hidden sm:inline">Excel Import</span>
          </NuxtLink>

          <NuxtLink
            to="/admin/books/new"
            class="px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1"
            :class="route.path.includes('new') ? 'bg-white/15 text-paper font-bold shadow-2xs' : 'text-paper/70 hover:text-paper hover:bg-white/5'"
          >
            <PlusCircle :size="13" class="text-gold-300" />
            <span class="hidden sm:inline">Add Book</span>
          </NuxtLink>

          <div class="h-4 w-px bg-white/15 mx-1 hidden md:block" />

          <NuxtLink
            to="/"
            target="_blank"
            class="text-paper/70 hover:text-paper hidden md:inline-flex items-center gap-1 px-2 py-1 rounded-md hover:bg-white/5 transition-colors"
          >
            <span>Store</span>
            <ExternalLink :size="11" />
          </NuxtLink>

          <button
            type="button"
            class="text-red-300 hover:text-white hover:bg-red-950/40 px-2 py-1 rounded-md flex items-center gap-1 transition-colors cursor-pointer ml-1"
            title="Sign out of portal"
            @click="logout"
          >
            <LogOut :size="13" />
            <span class="hidden sm:inline">Logout</span>
          </button>
        </nav>
      </div>
    </header>

    <!-- Main Workspace Canvas -->
    <main class="max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 flex-1">
      <slot />
    </main>
  </div>
</template>