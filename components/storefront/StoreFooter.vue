<!-- components/storefront/StoreFooter.vue -->
<script setup lang="ts">
import { buildWhatsAppLink, FLEMELA_WHATSAPP_LOCAL } from '~/utils/phone';

const whatsappUrl = buildWhatsAppLink(
  'Hello The Sunrise Bookstore, I am reaching out from your website footer.'
);
</script>

<template>
  <footer class="bg-theme-dark text-white pt-14 pb-10 px-4 border-t border-white/10 mt-auto">
    <div class="max-w-6xl mx-auto space-y-10">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-8 text-xs text-white/70">
        <!-- Column 1: Need Help? -->
        <div class="space-y-3">
          <h5 class="font-mono font-bold uppercase text-white tracking-wider text-[11px]">NEED HELP?</h5>
          <ul class="space-y-2 font-medium">
            <li><a :href="whatsappUrl" target="_blank" rel="noopener noreferrer" class="hover:text-white transition-colors">WhatsApp Help Center</a></li>
            <li><a href="#" class="hover:text-white transition-colors">Shipping FAQs</a></li>
            <li><a href="/checkout/confirm" class="hover:text-white transition-colors">Track Your Order</a></li>
            <li><a href="#" class="hover:text-white transition-colors">Return Policy</a></li>
            <li><a href="#" class="hover:text-white transition-colors">Accessibility</a></li>
          </ul>
        </div>

        <!-- Column 2: About Us -->
        <div class="space-y-3">
          <h5 class="font-mono font-bold uppercase text-white tracking-wider text-[11px]">ABOUT US</h5>
          <ul class="space-y-2 font-medium">
            <li><a href="#" class="hover:text-white transition-colors">About Us</a></li>
            <li><a href="#" class="hover:text-white transition-colors">Sunrise Readers</a></li>
            <li><a href="#" class="hover:text-white transition-colors">Sarit Centre Hub</a></li>
            <li><a href="#" class="hover:text-white transition-colors">Delivery Information</a></li>
          </ul>
        </div>

        <!-- Column 3: Services -->
        <div class="space-y-3">
          <h5 class="font-mono font-bold uppercase text-white tracking-wider text-[11px]">SERVICES</h5>
          <ul class="space-y-2 font-medium">
            <li><a :href="whatsappUrl" target="_blank" rel="noopener noreferrer" class="hover:text-white transition-colors">Custom Book Sourcing</a></li>
            <li><a href="#" class="hover:text-white transition-colors">Corporate Orders</a></li>
            <li><a href="#" class="hover:text-white transition-colors">eBook Downloads FAQ</a></li>
          </ul>
        </div>

        <!-- Column 4: Payments & Contact -->
        <div class="space-y-3">
          <h5 class="font-mono font-bold uppercase text-white tracking-wider text-[11px]">PAYMENTS &amp; CONTACT</h5>
          <p class="text-[11px] text-white/70 font-medium">
            WhatsApp Line: <strong class="text-white font-bold">{{ FLEMELA_WHATSAPP_LOCAL }}</strong>
          </p>

          <div class="flex flex-wrap gap-1.5 pt-1">
            <span class="px-2 py-0.5 rounded bg-white/10 text-white font-mono text-[9px] font-bold">LIPA NA M-PESA</span>
            <span class="px-2 py-0.5 rounded bg-white/10 text-white font-mono text-[9px] font-bold">TILL: 174379</span>
          </div>

          <div class="flex items-center gap-3 pt-3 text-white">
            <a
              :href="whatsappUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="hover:text-[#2EE59D] transition-colors font-bold text-white flex items-center gap-1"
            >
              <span>WhatsApp Concierge</span>
            </a>
          </div>
        </div>
      </div>

      <!-- Bottom Bar -->
      <div class="pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-3 text-[11px] text-white/50 font-medium">
        <div class="flex gap-4">
          <a href="#" class="hover:text-white transition-colors">Terms of Use</a>
          <a href="#" class="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" class="hover:text-white transition-colors">Copyright</a>
        </div>
        <p>&copy; 2026 The Sunrise Bookstore • Sarit Centre, Westlands, Nairobi.</p>
      </div>
    </div>
  </footer>
</template>