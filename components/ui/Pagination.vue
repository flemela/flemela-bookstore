<!-- components/ui/Pagination.vue -->
<script setup lang="ts">
import { computed } from 'vue';
import { ChevronLeft, ChevronRight } from 'lucide-vue-next';

interface Props {
  page: number;
  totalPages: number;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
});

const emit = defineEmits<{
  change: [page: number];
}>();

// Computes numbered pages with smart ellipsis (e.g. 1, ..., 4, 5, 6, ..., 12)
const visiblePages = computed<(number | '...')[]>(() => {
  const total = props.totalPages;
  const current = props.page;

  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | '...')[] = [];

  if (current <= 4) {
    pages.push(1, 2, 3, 4, 5, '...', total);
  } else if (current >= total - 3) {
    pages.push(1, '...', total - 4, total - 3, total - 2, total - 1, total);
  } else {
    pages.push(1, '...', current - 1, current, current + 1, '...', total);
  }

  return pages;
});

function handlePageClick(target: number): void {
  if (props.disabled || target === props.page || target < 1 || target > props.totalPages) return;
  emit('change', target);
}
</script>

<template>
  <nav
    v-if="totalPages > 1"
    class="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 pt-8 select-none"
    aria-label="Pagination Navigation"
  >
    <!-- Previous Button -->
    <button
      type="button"
      :disabled="disabled || page <= 1"
      class="px-3.5 py-2 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-1 bg-slate-50 border border-slate-200 text-slate-700 hover:bg-[#FFF7ED] hover:border-[#E8750D] hover:text-[#E8750D] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-slate-50 disabled:hover:border-slate-200 disabled:hover:text-slate-700 cursor-pointer shadow-2xs"
      aria-label="Previous page"
      @click="handlePageClick(page - 1)"
    >
      <ChevronLeft :size="15" />
      <span class="hidden sm:inline">Prev</span>
    </button>

    <!-- Nth Page Buttons -->
    <template v-for="(p, idx) in visiblePages" :key="`p-${idx}`">
      <span
        v-if="p === '...'"
        class="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-slate-400 font-mono text-xs select-none"
      >
        ...
      </span>

      <button
        v-else
        type="button"
        :disabled="disabled"
        :aria-current="page === p ? 'page' : undefined"
        class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center cursor-pointer shadow-2xs disabled:opacity-50"
        :class="
          page === p
            ? 'bg-[#E8750D] text-white border border-[#E8750D] shadow-sm'
            : 'bg-white text-slate-700 border border-slate-200 hover:bg-[#FFF7ED] hover:border-[#E8750D] hover:text-[#E8750D]'
        "
        @click="handlePageClick(p)"
      >
        {{ p }}
      </button>
    </template>

    <!-- Next Button -->
    <button
      type="button"
      :disabled="disabled || page >= totalPages"
      class="px-3.5 py-2 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-1 bg-slate-50 border border-slate-200 text-slate-700 hover:bg-[#FFF7ED] hover:border-[#E8750D] hover:text-[#E8750D] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-slate-50 disabled:hover:border-slate-200 disabled:hover:text-slate-700 cursor-pointer shadow-2xs"
      aria-label="Next page"
      @click="handlePageClick(page + 1)"
    >
      <span class="hidden sm:inline">Next</span>
      <ChevronRight :size="15" />
    </button>
  </nav>
</template>