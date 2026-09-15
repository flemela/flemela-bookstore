<!-- error.vue (in project root) -->
<script setup lang="ts">
import type { NuxtError } from '#app';

defineProps<{
  error: NuxtError;
}>();

const handleError = () => clearError({ redirect: '/' });
</script>

<template>
  <div class="min-h-screen p-8 bg-slate-900 text-white font-mono">
    <h1 class="text-2xl font-bold text-red-400">
      {{ error.statusCode }} — {{ error.statusMessage || 'Server Error' }}
    </h1>
    <p class="mt-2 text-yellow-300">{{ error.message }}</p>
    <pre class="mt-4 p-4 bg-black/60 rounded text-xs overflow-auto text-slate-300">{{ error.stack }}</pre>
    <button
      class="mt-6 px-4 py-2 bg-emerald-600 rounded text-sm font-bold"
      @click="handleError"
    >
      Clear &amp; Return Home
    </button>
  </div>
</template>