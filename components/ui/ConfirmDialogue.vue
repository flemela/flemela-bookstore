<!-- components/ui/ConfirmDialog.vue -->
<script setup lang="ts">
import Modal from './Modal.vue';
import Button from './Button.vue';

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  loading?: boolean;
}

withDefaults(defineProps<Props>(), {
  confirmLabel: 'Confirm',
  danger: false,
  loading: false,
});

const emit = defineEmits<{
  confirm: [];
  cancel: [];
}>();
</script>

<template>
  <Modal :open="open" :title="title" persistent @close="emit('cancel')">
    <p class="text-xs sm:text-sm text-ink leading-relaxed">
      {{ message }}
    </p>

    <template #footer>
      <Button variant="ghost" size="sm" :disabled="loading" @click="emit('cancel')">
        Cancel
      </Button>
      <Button
        :variant="danger ? 'danger' : 'primary'"
        size="sm"
        :loading="loading"
        @click="emit('confirm')"
      >
        {{ confirmLabel }}
      </Button>
    </template>
  </Modal>
</template>