<!-- components/ui/Pagination.vue -->
<script setup lang="ts">
import { ChevronLeft, ChevronRight } from 'lucide-vue-next';

interface Props {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

const props = defineProps<Props>();

function goPrev(): void {
  if (props.page > 1) props.onChange(props.page - 1);
}

function goNext(): void {
  if (props.page < props.totalPages) props.onChange(props.page + 1);
}
</script>

<template>
  <nav class="flex items-center justify-center gap-3 pt-4" aria-label="Pagination Navigation">
    <button
      type="button"
      class="w-9 h-9 flex items-center justify-center bg-white border border-ink-border rounded text-ink hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
      :disabled="page <= 1"
      aria-label="Previous Page"
      @click="goPrev"
    >
      <ChevronLeft :size="16" />
    </button>

    <span class="text-xs font-mono font-semibold text-ink-muted tabular-figure select-none">
      Page {{ page }} of {{ totalPages || 1 }}
    </span>

    <button
      type="button"
      class="w-9 h-9 flex items-center justify-center bg-white border border-ink-border rounded text-ink hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
      :disabled="page >= totalPages"
      aria-label="Next Page"
      @click="goNext"
    >
      <ChevronRight :size="16" />
    </button>
  </nav>
</template>