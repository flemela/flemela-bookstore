<!-- components/storefront/TrustStrip.vue -->
<script setup lang="ts">
import { Truck, BookOpen, Percent } from 'lucide-vue-next';
</script>

<template>
  <section class="py-12 bg-white border-y border-theme-border px-4">
    <div class="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
      
      <!-- Benefit 1: Free Standard Delivery -->
      <div class="flex flex-col items-center space-y-2.5">
        <div class="w-12 h-12 rounded-full bg-emerald-100 text-theme-forest flex items-center justify-center shadow-xs">
          <Truck :size="22" class="text-emerald-800" />
        </div>
        <h4 class="text-xs font-extrabold uppercase tracking-wider text-theme-ink">FREE STANDARD DELIVERY</h4>
        <p class="text-[11px] text-theme-muted max-w-xs leading-relaxed">
          These are the books everyone is reading, loving, and recommending right now.
        </p>
      </div>

      <!-- Benefit 2: 2 Million Books Availability -->
      <div class="flex flex-col items-center space-y-2.5">
        <div class="w-12 h-12 rounded-full bg-emerald-100 text-theme-forest flex items-center justify-center shadow-xs">
          <BookOpen :size="22" class="text-emerald-800" />
        </div>
        <h4 class="text-xs font-extrabold uppercase tracking-wider text-theme-ink">2 MILLION BOOKS AVAILABILITY</h4>
        <p class="text-[11px] text-theme-muted max-w-xs leading-relaxed">
          These are the books everyone is reading, loving, and recommending right now.
        </p>
      </div>

      <!-- Benefit 3: Special Discount -->
      <div class="flex flex-col items-center space-y-2.5">
        <div class="w-12 h-12 rounded-full bg-emerald-100 text-theme-forest flex items-center justify-center shadow-xs">
          <Percent :size="22" class="text-emerald-800" />
        </div>
        <h4 class="text-xs font-extrabold uppercase tracking-wider text-theme-ink">SPECIAL DISCOUNT</h4>
        <p class="text-[11px] text-theme-muted max-w-xs leading-relaxed">
          These are the books everyone is reading, loving, and recommending right now.
        </p>
      </div>

    </div>
  </section>
</template>