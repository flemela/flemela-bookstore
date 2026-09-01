// =============================================================================
// composables/useToast.ts
// Reactive toast notification queue with auto-dismissal.
// =============================================================================

export type ToastVariant = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
}

const AUTO_DISMISS_MS = 4000;

export function useToast() {
  const toasts = useState<Toast[]>('flemela_toasts', () => []);

  function dismiss(id: string): void {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  }

  function push(input: { message: string; variant?: ToastVariant }): string {
    const id = Math.random().toString(36).substring(2, 11);
    const variant = input.variant || 'info';

    toasts.value.push({ id, message: input.message, variant });

    if (process.client) {
      setTimeout(() => {
        dismiss(id);
      }, AUTO_DISMISS_MS);
    }

    return id;
  }

  return {
    toasts,
    push,
    dismiss,
  };
}