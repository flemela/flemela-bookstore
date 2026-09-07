<!-- components/storefront/FloatingWhatsappButton.vue -->
<script setup lang="ts">
import { ref } from 'vue';
import { X } from 'lucide-vue-next';
import { buildWhatsAppLink } from '~/utils/phone';

const showTooltip = ref(true);

const whatsappUrl = buildWhatsAppLink(
  'Hello Flemela Bookstore Concierge, I have an inquiry about a book.'
);
</script>

<template>
  <div class="fixed bottom-6 left-6 z-40 flex items-center gap-3 select-none pointer-events-auto">
    <!-- Interactive Tooltip Pill -->
    <div
      v-if="showTooltip"
      class="hidden sm:flex items-center gap-2 bg-forest-950/95 text-paper backdrop-blur-md border border-forest-900 px-3.5 py-2 rounded-2xl shadow-medium text-xs animate-in fade-in slide-in-from-left-4 duration-300"
    >
      <div class="space-y-0.5">
        <strong class="font-bold block text-paper text-[11px] leading-tight">Need help finding a book?</strong>
        <span class="text-[10px] text-emerald-400 block font-medium">Chat with our Concierge</span>
      </div>
      <button
        type="button"
        class="text-paper/60 hover:text-paper p-0.5 ml-1 transition-colors cursor-pointer"
        aria-label="Dismiss message"
        @click="showTooltip = false"
      >
        <X :size="12" />
      </button>
    </div>

    <!-- Main Floating WhatsApp Button -->
    <a
      :href="whatsappUrl"
      target="_blank"
      rel="noopener noreferrer"
      class="relative group w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white flex items-center justify-center shadow-lg hover:shadow-2xl transition-all duration-300 active:scale-95 cursor-pointer"
      aria-label="Chat with Flemela Bookstore on WhatsApp"
    >
      <!-- Pulsing Radar Ring -->
      <span class="absolute -inset-1 rounded-full bg-[#25D366]/40 animate-ping pointer-events-none opacity-75" />

      <!-- Official WhatsApp SVG Icon -->
      <svg
        class="w-7 h-7 sm:w-8 sm:h-8 fill-current relative z-10 transition-transform duration-300 group-hover:scale-110"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M17.472 14.382c-.301-.15-1.78-.878-2.056-.978-.276-.1-.476-.15-.677.15-.2.301-.776.978-.952 1.179-.175.2-.351.226-.652.075-.3-.151-1.27-.468-2.42-1.493-.894-.798-1.498-1.784-1.674-2.085-.176-.301-.019-.464.132-.614.136-.135.301-.351.452-.526.15-.176.2-.301.301-.502.101-.201.051-.377-.025-.527-.075-.15-.677-1.632-.928-2.235-.244-.588-.493-.508-.677-.517-.175-.008-.376-.01-.577-.01-.2 0-.527.075-.803.376-.276.301-1.054 1.03-1.054 2.511 0 1.482 1.079 2.912 1.23 3.113.151.201 2.124 3.243 5.145 4.549.719.311 1.28.497 1.718.636.722.23 1.378.197 1.9.12.581-.087 1.78-.727 2.031-1.43.251-.703.251-1.305.176-1.43-.076-.126-.276-.201-.577-.352zM12.004 21.75c-1.75 0-3.46-.46-4.965-1.332l-.356-.206-3.69.967.985-3.597-.229-.364a9.71 9.71 0 0 1-1.492-5.188c0-5.385 4.383-9.768 9.773-9.768 2.607 0 5.059 1.016 6.903 2.862a9.715 9.715 0 0 1 2.859 6.906c-.002 5.387-4.385 9.77-9.788 9.77zm0-17.75C6.49 4 2 8.49 2 14.004c0 1.961.569 3.842 1.644 5.462L2 26l6.688-1.754a11.94 11.94 0 0 0 5.316 1.254h.005c6.512 0 11.996-5.488 11.996-12.002A11.933 11.933 0 0 0 20.51 5.49 11.93 11.93 0 0 0 12.004 4z"
        />
      </svg>
    </a>
  </div>
</template>