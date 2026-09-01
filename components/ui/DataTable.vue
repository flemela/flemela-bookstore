<!-- components/ui/DataTable.vue -->
<script setup lang="ts" generic="T extends object">
import Skeleton from './Skeleton.vue';

export interface DataTableColumn<T = any> {
  key: string;
  label: string;
  align?: 'left' | 'right';
  render?: (row: T) => string;
  cellClass?: (row: T) => string;
}

interface Props<T = any> {
  columns: DataTableColumn<T>[];
  rows: T[];
  loading?: boolean;
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  emptyTitle?: string;
  emptyDescription?: string;
}

withDefaults(defineProps<Props<T>>(), {
  loading: false,
  emptyTitle: 'No records found',
});

function cellValue(row: T, column: DataTableColumn<T>): string {
  if (column.render) return column.render(row);
  const value = (row as Record<string, unknown>)[column.key];
  return value === null || value === undefined ? '—' : String(value);
}
</script>

<template>
  <div class="bg-white rounded-lg border border-ink-border shadow-card overflow-hidden w-full">
    <div class="overflow-x-auto">
      <table class="w-full text-left text-xs border-collapse">
        <thead class="bg-slate-50 border-b border-ink-border sticky top-0 z-10">
          <tr class="text-ink-muted uppercase tracking-wider font-bold">
            <th
              v-for="col in columns"
              :key="col.key"
              class="py-3 px-4"
              :class="{ 'text-right': col.align === 'right' }"
            >
              <slot :name="`header-${col.key}`">
                {{ col.label }}
              </slot>
            </th>
          </tr>
        </thead>

        <!-- Shimmer Skeleton Loading Rows -->
        <tbody v-if="loading" class="divide-y divide-slate-100">
          <tr v-for="n in 5" :key="`skeleton-${n}`">
            <td v-for="col in columns" :key="col.key" class="py-3.5 px-4">
              <Skeleton height="14px" />
            </td>
          </tr>
        </tbody>

        <!-- Data Rows -->
        <tbody v-else-if="rows.length > 0" class="divide-y divide-slate-100">
          <tr
            v-for="row in rows"
            :key="rowKey(row)"
            class="hover:bg-slate-50/80 transition-colors"
            :class="{ 'cursor-pointer': !!onRowClick }"
            @click="onRowClick?.(row)"
          >
            <td
              v-for="col in columns"
              :key="col.key"
              class="py-3 px-4"
              :class="[col.align === 'right' ? 'text-right' : '', col.cellClass?.(row)]"
            >
              <slot :name="`cell-${col.key}`" :row="row">
                {{ cellValue(row, col) }}
              </slot>
            </td>
          </tr>
        </tbody>

        <!-- Empty State -->
        <tbody v-else>
          <tr>
            <td :colspan="columns.length" class="py-12 text-center text-ink-muted">
              <p class="font-bold text-sm text-ink">{{ emptyTitle }}</p>
              <p v-if="emptyDescription" class="text-xs text-ink-muted mt-1">{{ emptyDescription }}</p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>