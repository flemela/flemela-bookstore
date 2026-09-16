<!-- components/storefront/BentoCategories.vue -->
<script setup lang="ts">
import { computed } from 'vue';
import {
  BookOpen,
  GraduationCap,
  Heart,
  Briefcase,
  Laptop,
  Star,
  ArrowRight,
} from 'lucide-vue-next';
import type { Book } from '~/types';

const emit = defineEmits<{
  select: [category: string];
}>();

// Fetch live catalog books to dynamically calculate inventory counts
const { data: catalogResponse } = await useFetch<any>('/api/products');

const CATEGORIES = [
  {
    name: 'Fiction',
    icon: BookOpen,
    fallbackCount: '2,450+',
    query: 'Fiction',
  },
  {
    name: 'Non-Fiction',
    icon: GraduationCap,
    fallbackCount: '1,630+',
    query: 'Non-Fiction',
  },
  {
    name: 'Self Help',
    icon: Heart,
    fallbackCount: '980+',
    query: 'Self-Help',
  },
  {
    name: 'Business',
    icon: Briefcase,
    fallbackCount: '760+',
    query: 'Business',
  },
  {
    name: 'Technology',
    icon: Laptop,
    fallbackCount: '540+',
    query: 'Technology',
  },
  {
    name: 'Classic',
    icon: Star,
    fallbackCount: '320+',
    query: 'Classic',
  },
];

const countMap = computed(() => {
  const map = new Map<string, number>();
  const list: Book[] = Array.isArray(catalogResponse.value)
    ? catalogResponse.value
    : catalogResponse.value?.products || [];

  for (const b of list) {
    const cat = (b?.category_name || 'General').toLowerCase();
    map.set(cat, (map.get(cat) || 0) + 1);
  }
  return map;
});

function getDisplayCount(query: string, fallback: string): string {
  const q = query.toLowerCase();
  let total = 0;
  for (const [cat, count] of countMap.value.entries()) {
    if (cat.includes(q) || q.includes(cat)) {
      total += count;
    }
  }
  return total > 0 ? `${total} titles` : `${fallback} titles`;
}

function handleCategoryClick(catQuery: string): void {
  emit('select', catQuery);
  if (process.client) {
    const el = document.getElementById('catalog-results');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
</script>

<template>
  <section id="categories-grid" class="py-10 sm:py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-5 select-none">
    <!-- Standardized Section Heading -->
    <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-200">
      <div class="space-y-1">
        <span class="text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-widest text-[#E8750D] block">
          CURATED GENRES
        </span>
        <h2 class="font-poster text-3xl sm:text-4xl lg:text-5xl font-extrabold uppercase text-[#141E1A] tracking-wide leading-none">
          SHOP BY CATEGORY
        </h2>
      </div>

      <button
        type="button"
        class="text-xs sm:text-sm font-bold text-[#E8750D] hover:underline flex items-center gap-1 transition-colors cursor-pointer self-start sm:self-auto"
        @click="handleCategoryClick('General')"
      >
        <span>View all books</span>
        <ArrowRight :size="14" />
      </button>
    </div>

    <!-- Category Grid: 3 Icons per Row on Mobile, 6 on Desktop -->
    <div class="grid grid-cols-3 md:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
      <button
        v-for="cat in CATEGORIES"
        :key="cat.name"
        type="button"
        class="bg-white hover:bg-orange-50/40 border border-slate-200 hover:border-[#E8750D] rounded-xl p-3 sm:p-4 md:p-5 flex flex-col items-center justify-center text-center gap-1.5 sm:gap-2.5 transition-all duration-200 group cursor-pointer shadow-2xs hover:shadow-xs hover:-translate-y-0.5 min-h-[96px] sm:min-h-[114px]"
        @click="handleCategoryClick(cat.query)"
      >
        <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-100 group-hover:bg-[#FFF7ED] text-slate-800 group-hover:text-[#E8750D] flex items-center justify-center transition-colors flex-shrink-0">
          <component :is="cat.icon" :size="18" class="sm:w-5 sm:h-5 stroke-[1.75]" />
        </div>

        <div class="space-y-0.5 w-full min-w-0">
          <h3 class="font-sans font-bold text-[11px] sm:text-xs md:text-sm text-slate-900 group-hover:text-[#E8750D] transition-colors leading-tight truncate">
            {{ cat.name }}
          </h3>
          <p class="text-[9px] sm:text-[10px] md:text-[11px] text-slate-500 font-medium truncate">
            {{ getDisplayCount(cat.query, cat.fallbackCount) }}
          </p>
        </div>
      </button>
    </div>
  </section>
</template>