<!-- components/ui/Toast.vue -->
<script setup lang="ts">
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-vue-next';
import type { Toast } from '~/composables/useToast';

interface Props {
  toast: Toast;
}

defineProps<Props>();

const emit = defineEmits<{
  dismiss: [id: string];
}>();
</script>

<template>
  <div
    class="flex items-center gap-3 p-3.5 bg-white border rounded-lg shadow-high min-w-[280px] max-w-sm pointer-events-auto transition-all"
    :class="{
      'border-emerald-300 text-emerald-950': toast.variant === 'success',
      'border-red-300 text-red-950': toast.variant === 'error',
      'border-blue-300 text-blue-950': toast.variant === 'info',
    }"
    role="status"
  >
    <div class="flex-shrink-0">
      <CheckCircle2 v-if="toast.variant === 'success'" :size="18" class="text-emerald-700" />
      <AlertCircle v-else-if="toast.variant === 'error'" :size="18" class="text-red-700" />
      <Info v-else :size="18" class="text-blue-700" />
    </div>

    <p class="flex-1 text-xs font-semibold leading-snug">
      {{ toast.message }}
    </p>

    <button
      type="button"
      class="p-1 rounded text-ink-muted hover:text-forest-950 hover:bg-black/5 transition-colors cursor-pointer"
      aria-label="Dismiss notification"
      @click="emit('dismiss', toast.id)"
    >
      <X :size="14" />
    </button>
  </div>
</template>