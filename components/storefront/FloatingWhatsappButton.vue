<!-- components/storefront/FloatingWhatsappButton.vue -->
<script setup lang="ts">
import WhatsAppIcon from '~/components/icons/WhatsAppIcon.vue';
import { buildWhatsAppLink } from '~/utils/phone';

const whatsappUrl = buildWhatsAppLink(
  'Hello Flemela Bookstore Concierge, I have an inquiry about a book.'
);
</script>

<template>
  <aside
    class="fixed bottom-6 right-6 z-40 select-none pointer-events-auto"
    aria-label="WhatsApp Concierge"
  >
    <a
      :href="whatsappUrl"
      target="_blank"
      rel="noopener noreferrer"
      class="group w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white flex items-center justify-center shadow-lg hover:shadow-[0_8px_24px_rgba(37,211,102,0.45)] transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
      title="Chat with Flemela Bookstore on WhatsApp"
      aria-label="Chat with Flemela Bookstore on WhatsApp"
    >
      <WhatsAppIcon class="w-7 h-7 sm:w-8 sm:h-8 text-white transition-transform duration-300 group-hover:scale-110" />
    </a>
  </aside>
</template>