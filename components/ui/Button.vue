<!-- components/ui/Button.vue -->
<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit';
}

withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  loading: false,
  disabled: false,
  type: 'button',
});
</script>

<template>
  <button
    :type="type"
    class="relative inline-flex items-center justify-center gap-2 font-bold uppercase transition-all rounded-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none focus-visible:outline-2 focus-visible:outline-gold-500"
    :class="[
      {
        'bg-forest-900 text-white hover:bg-forest-800 shadow-sm': variant === 'primary',
        'bg-white text-forest-950 border border-ink-border hover:bg-paper-cream': variant === 'secondary',
        'bg-transparent text-forest-950 hover:bg-black/5': variant === 'ghost',
        'bg-red-700 text-white hover:bg-red-800 shadow-sm': variant === 'danger',
      },
      {
        'px-3 py-1.5 text-[11px] min-h-[36px]': size === 'sm',
        'px-4 py-2 text-xs min-h-[42px]': size === 'md',
        'px-6 py-3 text-xs min-h-[48px]': size === 'lg',
      },
      { 'pointer-events-none': loading }
    ]"
    :disabled="disabled || loading"
  >
    <span
      v-if="loading"
      class="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full"
      aria-hidden="true"
    />
    <span :class="{ 'opacity-0': loading }">
      <slot />
    </span>
  </button>
</template>