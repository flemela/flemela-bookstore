<!-- pages/admin/register.vue -->
<script setup lang="ts">
onMounted(() => {
  navigateTo('/admin/login', { replace: true });
});
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-paper-cream p-4">
    <p class="text-xs text-ink-muted">Redirecting to administrator login...</p>
  </div>
</template>