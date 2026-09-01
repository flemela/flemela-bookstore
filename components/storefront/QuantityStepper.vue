<!-- components/storefront/QuantityStepper.vue -->
<script setup lang="ts">
import { Minus, Plus } from 'lucide-vue-next';

interface Props {
  modelValue: number;
  min?: number;
  max?: number;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  min: 1,
  max: 99,
  disabled: false,
});

const emit = defineEmits<{
  'update:modelValue': [val: number];
}>();

function decrement(): void {
  if (props.disabled || props.modelValue <= props.min) return;
  emit('update:modelValue', props.modelValue - 1);
}

function increment(): void {
  if (props.disabled || props.modelValue >= props.max) return;
  emit('update:modelValue', props.modelValue + 1);
}
</script>

<template>
  <div class="inline-flex items-center border border-ink-border rounded-md bg-white overflow-hidden shadow-subtle min-h-[40px] h-10">
    <button
      type="button"
      class="w-10 h-full flex items-center justify-center text-ink-muted hover:text-forest-950 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
      :disabled="disabled || modelValue <= min"
      aria-label="Decrease quantity"
      @click="decrement"
    >
      <Minus :size="14" />
    </button>
    <span class="w-10 text-center text-xs font-mono font-bold text-forest-950 tabular-figure select-none">
      {{ modelValue }}
    </span>
    <button
      type="button"
      class="w-10 h-full flex items-center justify-center text-ink-muted hover:text-forest-950 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
      :disabled="disabled || modelValue >= max"
      aria-label="Increase quantity"
      @click="increment"
    >
      <Plus :size="14" />
    </button>
  </div>
</template>