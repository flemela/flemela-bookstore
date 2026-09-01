<!-- components/ui/Badge.vue -->
<script setup lang="ts">
interface Props {
  label: string;
  variant?: 'success' | 'danger' | 'warning' | 'neutral' | 'gold';
}

withDefaults(defineProps<Props>(), {
  variant: 'neutral',
});
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wide whitespace-nowrap"
    :class="{
      'bg-emerald-100 text-emerald-900 border border-emerald-300': variant === 'success',
      'bg-red-100 text-red-900 border border-red-300': variant === 'danger',
      'bg-amber-100 text-amber-950 border border-amber-300': variant === 'warning',
      'bg-gold-100 text-gold-600 border border-gold-300': variant === 'gold',
      'bg-slate-100 text-slate-800 border border-slate-300': variant === 'neutral',
    }"
  >
    <span
      class="w-1.5 h-1.5 rounded-full flex-shrink-0"
      :class="{
        'bg-emerald-600': variant === 'success',
        'bg-red-600': variant === 'danger',
        'bg-amber-600': variant === 'warning',
        'bg-gold-500': variant === 'gold',
        'bg-slate-500': variant === 'neutral',
      }"
    />
    {{ label }}
  </span>
</template>