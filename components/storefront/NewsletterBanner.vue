<!-- components/storefront/NewsletterBanner.vue -->
<script setup lang="ts">
import { ref } from 'vue';
import { useToast } from '~/composables/useToast';

const { push: pushToast } = useToast();
const email = ref('');
const isSubscribed = ref(false);

function handleSubscribe(): void {
  if (!email.value || !email.value.includes('@')) return;
  isSubscribed.value = true;
  pushToast({ message: '20% Coupon Code sent to your email!', variant: 'success' });
  email.value = '';
}
</script>

<template>
  <section class="py-12 px-4 max-w-6xl mx-auto">
    <div class="bg-theme-sand border border-stone-300 rounded-2xl p-6 sm:p-10 relative overflow-hidden shadow-card">
      
      <!-- Left Hand Illustrated Graphic -->
      <div class="absolute -left-4 top-1/2 -translate-y-1/2 hidden md:block text-5xl pointer-events-none opacity-80 rotate-[-12deg]">
        📖
      </div>

      <!-- Right Hand Illustrated Graphic -->
      <div class="absolute -right-4 top-1/2 -translate-y-1/2 hidden md:block text-5xl pointer-events-none opacity-80 rotate-[12deg]">
        📕
      </div>

      <!-- Center Content -->
      <div class="max-w-md mx-auto text-center space-y-4 relative z-10">
        <h3 class="font-display text-xl sm:text-2xl font-extrabold uppercase tracking-tight text-theme-ink">
          GET A <span class="text-theme-coral">20% DISCOUNT</span> ON YOUR FIRST ORDER!
        </h3>

        <!-- Integrated Email Subscription Pill -->
        <form class="flex items-center bg-white rounded-full p-1.5 border border-stone-300 shadow-sm" @submit.prevent="handleSubscribe">
          <input
            v-model="email"
            type="email"
            placeholder="Enter your email..."
            class="flex-1 px-4 py-2 text-xs text-theme-ink outline-none bg-transparent"
            required
          />
          <button
            type="submit"
            class="bg-theme-coral hover:bg-theme-coral-hover text-white text-xs font-bold uppercase tracking-wider px-6 py-2 rounded-full transition-all shadow-xs cursor-pointer flex-shrink-0"
          >
            {{ isSubscribed ? 'Sent!' : 'Send' }}
          </button>
        </form>
      </div>

    </div>
  </section>
</template>