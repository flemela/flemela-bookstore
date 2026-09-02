<!-- components/storefront/StoreFooter.vue -->
<script setup lang="ts">
//import { ref } from 'vue';
</script>

<template>
  <footer class="bg-theme-dark text-white pt-14 pb-10 px-4 border-t border-white/10 mt-auto">
    <div class="max-w-6xl mx-auto space-y-10">
      
      <!-- 4 Columns Grid -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-8 text-xs text-white/70">
        
        <!-- Column 1: Need Help? -->
        <div class="space-y-3">
          <h5 class="font-mono font-bold uppercase text-white tracking-wider text-[11px]">NEED HELP?</h5>
          <ul class="space-y-2">
            <li><a href="#" class="hover:text-white transition-colors">Help Center</a></li>
            <li><a href="#" class="hover:text-white transition-colors">Shipping FAQs</a></li>
            <li><a href="#" class="hover:text-white transition-colors">Track Your Order</a></li>
            <li><a href="#" class="hover:text-white transition-colors">Order Status</a></li>
            <li><a href="#" class="hover:text-white transition-colors">Product Recalls</a></li>
            <li><a href="#" class="hover:text-white transition-colors">Accessibility</a></li>
          </ul>
        </div>

        <!-- Column 2: About Us -->
        <div class="space-y-3">
          <h5 class="font-mono font-bold uppercase text-white tracking-wider text-[11px]">ABOUT US</h5>
          <ul class="space-y-2">
            <li><a href="#" class="hover:text-white transition-colors">About Us</a></li>
            <li><a href="#" class="hover:text-white transition-colors">Flemela Readers</a></li>
            <li><a href="#" class="hover:text-white transition-colors">Return Policy</a></li>
            <li><a href="#" class="hover:text-white transition-colors">Delivery Information</a></li>
            <li><a href="#" class="hover:text-white transition-colors">Loyalty Program</a></li>
          </ul>
        </div>

        <!-- Column 3: Categories -->
        <div class="space-y-3">
          <h5 class="font-mono font-bold uppercase text-white tracking-wider text-[11px]">CATEGORIES</h5>
          <ul class="space-y-2">
            <li><a href="#" class="hover:text-white transition-colors">Coupons</a></li>
            <li><a href="#" class="hover:text-white transition-colors">RX Prescription</a></li>
            <li><a href="#" class="hover:text-white transition-colors">Scholarship Program</a></li>
            <li><a href="#" class="hover:text-white transition-colors">Brand Directory</a></li>
            <li><a href="#" class="hover:text-white transition-colors">E-Catalog/Requests</a></li>
            <li><a href="#" class="hover:text-white transition-colors">Corporate Orders</a></li>
          </ul>
        </div>

        <!-- Column 4: Payments & Contact -->
        <div class="space-y-3">
          <h5 class="font-mono font-bold uppercase text-white tracking-wider text-[11px]">PAYMENTS &amp; CONTACT</h5>
          <p class="text-[11px] text-white/60">Payments are 100% secured and direct:</p>
          
          <!-- Payment Badges -->
          <div class="flex flex-wrap gap-1.5 pt-1">
            <span class="px-2 py-0.5 rounded bg-white/10 text-white font-mono text-[9px] font-bold">LIPA NA M-PESA</span>
            <span class="px-2 py-0.5 rounded bg-white/10 text-white font-mono text-[9px] font-bold">VISA</span>
            <span class="px-2 py-0.5 rounded bg-white/10 text-white font-mono text-[9px] font-bold">MASTERCARD</span>
          </div>

          <!-- Social Icons -->
          <div class="flex items-center gap-3 pt-3 text-white/60">
            <span class="hover:text-white cursor-pointer">Twitter</span>
            <span>•</span>
            <span class="hover:text-white cursor-pointer">Instagram</span>
            <span>•</span>
            <span class="hover:text-white cursor-pointer">WhatsApp</span>
          </div>
        </div>

      </div>

      <!-- Bottom Bar -->
      <div class="pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-3 text-[11px] text-white/50">
        <div class="flex gap-4">
          <a href="#" class="hover:text-white transition-colors">Terms of Use</a>
          <a href="#" class="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" class="hover:text-white transition-colors">Copyright</a>
          <a href="#" class="hover:text-white transition-colors">Sitemap</a>
        </div>
        <p>&copy; 2026 Flemela Bookstore. All Rights Reserved.</p>
      </div>

    </div>
  </footer>
</template>