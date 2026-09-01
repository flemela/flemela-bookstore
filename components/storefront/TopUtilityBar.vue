<!-- components/storefront/TopUtilityBar.vue -->
<script setup lang="ts">
import { Truck, MessageCircle, Search } from 'lucide-vue-next';

const router = useRouter();

function handleTrackOrderClick(): void {
  const orderRef = prompt('Enter your Order Reference or UUID (e.g. 7K9M or full order ID):');
  if (orderRef && orderRef.trim()) {
    router.push({
      path: '/checkout/confirm',
      query: { orderId: orderRef.trim() },
    });
  }
}

const whatsappHelpUrl =
  'https://wa.me/254700000000?text=' +
  encodeURIComponent('Hello Flemela Bookstore Concierge, I need assistance with my book order.');
</script>

<template>
  <aside aria-label="Store utility notice" class="bg-forest-950 text-paper text-[11px] py-1.5 px-4 border-b border-forest-900/60 select-none">
    <div class="max-w-7xl mx-auto flex justify-between items-center gap-2">
      <!-- Left: Free Delivery Accent -->
      <div class="flex items-center gap-1.5 truncate">
        <Truck :size="13" class="text-gold-400 flex-shrink-0" />
        <span class="font-medium text-paper/90 truncate">
          <strong class="text-gold-300 font-semibold">FREE DELIVERY</strong> across Nairobi on orders above KSh 2,500
        </span>
      </div>

      <!-- Right: Reader Concierge & Order Tracking -->
      <div class="flex items-center gap-3.5 text-paper/80 font-sans flex-shrink-0 text-[11px]">
        <button
          type="button"
          class="hover:text-gold-300 transition-colors flex items-center gap-1 cursor-pointer"
          @click="handleTrackOrderClick"
        >
          <Search :size="11" />
          <span class="hidden sm:inline">Track Order</span>
        </button>

        <span class="opacity-30">•</span>

        <a
          :href="whatsappHelpUrl"
          target="_blank"
          rel="noopener"
          class="hover:text-gold-300 transition-colors flex items-center gap-1"
        >
          <MessageCircle :size="11" class="text-emerald-400" />
          <span>Concierge</span>
        </a>

        <span class="hidden md:inline opacity-30">•</span>

        <span class="text-gold-300 font-mono font-medium hidden md:inline text-[10px] tracking-wider uppercase">
          Nairobi, Kenya
        </span>
      </div>
    </div>
  </aside>
</template>