<!-- app.vue -->
<script setup lang="ts">
import { computed } from 'vue';
import FloatingWhatsappButton from '~/components/storefront/FloatingWhatsappButton.vue';

const route = useRoute();
const isAdminRoute = computed(() => route.path.startsWith('/admin'));
</script>

<template>
  <div class="min-h-screen bg-brand-cream text-ink antialiased">
    <NuxtPage />
    <!-- Global Floating WhatsApp Concierge on all Storefront Views -->
    <FloatingWhatsappButton v-if="!isAdminRoute" />
  </div>
</template>