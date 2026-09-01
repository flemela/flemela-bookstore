<!-- components/storefront/TrustBadgeStrip.vue -->
<script setup lang="ts">
import { Truck, ShieldCheck, Headphones, Lock } from 'lucide-vue-next';
</script>

<template>
  <section class="py-7 bg-paper-surface border-b border-ink-border px-4 shadow-subtle">
    <div class="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
      <div class="flex items-center gap-3">
        <div class="p-2.5 rounded-full bg-paper-cream border border-ink-border text-forest-950 flex-shrink-0">
          <Truck :size="20" />
        </div>
        <div>
          <h4 class="text-xs font-bold uppercase text-forest-950 leading-tight">FAST &amp; RELIABLE DELIVERY</h4>
          <p class="text-xs font-medium text-forest-900 mt-0.5">Nationwide door-to-door courier</p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <div class="p-2.5 rounded-full bg-paper-cream border border-ink-border text-forest-950 flex-shrink-0">
          <ShieldCheck :size="20" />
        </div>
        <div>
          <h4 class="text-xs font-bold uppercase text-forest-950 leading-tight">100% ORIGINAL BOOKS</h4>
          <p class="text-xs font-medium text-forest-900 mt-0.5">Authentic publisher editions</p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <div class="p-2.5 rounded-full bg-paper-cream border border-ink-border text-forest-950 flex-shrink-0">
          <Headphones :size="20" />
        </div>
        <div>
          <h4 class="text-xs font-bold uppercase text-forest-950 leading-tight">READER SUPPORT</h4>
          <p class="text-xs font-medium text-forest-900 mt-0.5">WhatsApp concierge help</p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <div class="p-2.5 rounded-full bg-paper-cream border border-ink-border text-forest-950 flex-shrink-0">
          <Lock :size="20" />
        </div>
        <div>
          <h4 class="text-xs font-bold uppercase text-forest-950 leading-tight">SECURE M-PESA</h4>
          <p class="text-xs font-medium text-forest-900 mt-0.5">Direct STK Push settlement</p>
        </div>
      </div>
    </div>
  </section>
</template>