<!-- components/ui/CurrencyInput.vue -->
<script setup lang="ts">
interface Props {
  modelValue: number;
  placeholder?: string;
  disabled?: boolean;
  showQuickChips?: boolean;
  quickChips?: number[];
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '0',
  disabled: false,
  showQuickChips: false,
  quickChips: () => [149, 499, 999, 1499, 2499],
});

const emit = defineEmits<{
  'update:modelValue': [val: number];
}>();

const isFocused = ref(false);
const rawInput = ref<string>(props.modelValue > 0 ? String(props.modelValue) : '');

const displayValue = computed(() => {
  if (isFocused.value) return rawInput.value;
  const num = parseFloat(rawInput.value);
  if (isNaN(num) || num === 0) return '';
  return num.toLocaleString('en-KE');
});

function handleInput(event: Event): void {
  const target = event.target as HTMLInputElement;
  const cleaned = target.value.replace(/[^\d.]/g, '');
  rawInput.value = cleaned;
  const num = parseFloat(cleaned);
  emit('update:modelValue', isNaN(num) ? 0 : num);
}

function handleChip(amount: number): void {
  rawInput.value = String(amount);
  emit('update:modelValue', amount);
}

watch(
  () => props.modelValue,
  (newVal: number) => {
    if (newVal === 0 && rawInput.value !== '') {
      rawInput.value = '';
    } else if (newVal > 0 && parseFloat(rawInput.value) !== newVal) {
      rawInput.value = String(newVal);
    }
  }
);
</script>

<template>
  <div class="space-y-1.5 w-full">
    <div
      class="flex items-center bg-white border border-ink-border rounded-md px-3 h-10 transition-all focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green"
      :class="{ 'opacity-60 bg-slate-50 cursor-not-allowed': disabled }"
    >
      <span class="text-xs font-mono font-bold text-ink-muted select-none mr-2">KSh</span>
      <input
        type="text"
        inputmode="decimal"
        :value="displayValue"
        :placeholder="placeholder"
        :disabled="disabled"
        class="w-full bg-transparent outline-none font-mono text-sm text-ink tabular-figure"
        @input="handleInput"
        @focus="isFocused = true"
        @blur="isFocused = false"
      />
    </div>

    <!-- Quick Preset Chips -->
    <div v-if="showQuickChips && !disabled" class="flex flex-wrap gap-1.5">
      <button
        v-for="chip in quickChips"
        :key="chip"
        type="button"
        class="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-[10px] font-mono font-semibold rounded transition-colors text-ink cursor-pointer"
        @click="handleChip(chip)"
      >
        KSh {{ chip }}
      </button>
    </div>
  </div>
</template>