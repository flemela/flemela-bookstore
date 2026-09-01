<!-- components/ui/ToastContainer.vue -->
<script setup lang="ts">
import { useToast } from '~/composables/useToast';
import Toast from './Toast.vue';

const { toasts, dismiss } = useToast();
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 pointer-events-none max-w-sm w-full px-4 sm:px-0"
      aria-live="polite"
    >
      <TransitionGroup name="toast-list">
        <Toast
          v-for="toast in toasts"
          :key="toast.id"
          :toast="toast"
          @dismiss="dismiss"
        />
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-list-enter-active,
.toast-list-leave-active {
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
.toast-list-enter-from {
  opacity: 0;
  transform: translateY(12px) scale(0.95);
}
.toast-list-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.95);
}
</style>