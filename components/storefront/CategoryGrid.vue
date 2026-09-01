<!-- components/storefront/CategoryGrid.vue -->
<script setup lang="ts">
import { ArrowUpRight } from 'lucide-vue-next';

const emit = defineEmits<{
  select: [categoryName: string];
}>();

const categories = [
  { id: '01', name: 'Fiction', label: 'Fiction & Literature' },
  { id: '02', name: 'Self-Help', label: 'Psychology & Self-Help' },
  { id: '03', name: 'Finance', label: 'Business & Finance' },
  { id: '04', name: 'Biography', label: 'Biography & Memoir' },
  { id: '05', name: 'Religious', label: 'Christian & Spiritual' },
  { id: '06', name: 'Education', label: 'Education & Academic' },
];

function handleClick(categoryKey: string): void {
  emit('select', categoryKey);
  if (process.client) {
    const section = document.getElementById('bestsellers');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
</script>

<template>
  <section id="categories" class="py-10 sm:py-14 px-4 max-w-6xl mx-auto w-full space-y-5">
    <div class="flex items-baseline justify-between border-b border-ink-border pb-3">
      <div>
        <span class="text-xs font-mono uppercase font-bold tracking-widest text-gold-600 block">Catalog Navigation</span>
        <h2 class="font-display text-xl sm:text-2xl font-bold text-forest-950">Shop by Category</h2>
      </div>
      <span class="text-xs text-ink font-semibold hidden sm:inline">Curated Sections</span>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
      <button
        v-for="cat in categories"
        :key="cat.id"
        type="button"
        class="bg-paper-surface p-4 sm:p-5 rounded-lg border border-ink-border hover:border-forest-900 transition-all flex flex-col justify-between text-left group cursor-pointer shadow-subtle min-h-[90px] sm:min-h-[110px]"
        @click="handleClick(cat.name)"
      >
        <div class="flex justify-between items-center w-full text-xs font-mono text-forest-800 font-bold">
          <span>{{ cat.id }}</span>
          <ArrowUpRight :size="14" class="text-forest-900 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </div>

        <span class="font-display text-sm sm:text-base font-bold text-forest-950 group-hover:text-forest-800 transition-colors leading-snug">
          {{ cat.label }}
        </span>
      </button>
    </div>
  </section>
</template>