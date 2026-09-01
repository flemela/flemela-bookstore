<!-- components/ui/Modal.vue -->
<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import { X } from 'lucide-vue-next';

interface Props {
  open: boolean;
  title: string;
  persistent?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  persistent: false,
});

const emit = defineEmits<{
  close: [];
}>();

const modalRef = ref<HTMLElement | null>(null);
let previouslyFocusedElement: HTMLElement | null = null;

function getFocusableElements(): HTMLElement[] {
  if (!modalRef.value) return [];
  const selector =
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  return Array.from(modalRef.value.querySelectorAll<HTMLElement>(selector));
}

function handleKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && !props.persistent) {
    emit('close');
    return;
  }

  if (event.key !== 'Tab') return;

  const focusable = getFocusableElements();
  if (focusable.length === 0) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const active = document.activeElement;

  if (event.shiftKey && active === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
}

watch(
  () => props.open,
  async (isOpen: boolean) => {
    if (process.client) {
      if (isOpen) {
        previouslyFocusedElement = document.activeElement as HTMLElement | null;
        document.addEventListener('keydown', handleKeydown);
        await nextTick();
        const focusable = getFocusableElements();
        (focusable[0] ?? modalRef.value)?.focus();
      } else {
        document.removeEventListener('keydown', handleKeydown);
        previouslyFocusedElement?.focus();
      }
    }
  }
);
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        @click.self="!persistent && emit('close')"
      >
        <div
          ref="modalRef"
          class="bg-white rounded-xl shadow-2xl border border-ink-border w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden outline-none"
          role="dialog"
          aria-modal="true"
          :aria-label="title"
          tabindex="-1"
        >
          <!-- Modal Header -->
          <header class="flex items-center justify-between px-6 py-4 border-b border-ink-border bg-paper-cream">
            <h2 class="font-display text-base font-bold text-forest-950">
              {{ title }}
            </h2>
            <button
              v-if="!persistent"
              type="button"
              class="p-1 rounded-md text-ink-muted hover:text-forest-950 hover:bg-black/5 transition-colors cursor-pointer"
              aria-label="Close dialog"
              @click="emit('close')"
            >
              <X :size="18" />
            </button>
          </header>

          <!-- Modal Body -->
          <div class="p-6 overflow-y-auto space-y-4">
            <slot />
          </div>

          <!-- Modal Footer -->
          <footer v-if="$slots.footer" class="flex justify-end gap-3 px-6 py-4 border-t border-ink-border bg-slate-50">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>