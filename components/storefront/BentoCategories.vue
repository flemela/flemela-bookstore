<!-- components/storefront/BentoCategories.vue -->
<script setup lang="ts">
// Shop by Category rail:
// - Dynamic categories from the API (admin-configurable images via /admin/categories)
// - No scrim overlay — image above, plain ink label below
// - No icons, no product counts — one job per tile
import { ref, computed } from 'vue';
import { ArrowRight } from 'lucide-vue-next';

const emit = defineEmits<{
  select: [category: string];
}>();

interface CategoryTile {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  is_featured?: boolean;
  sort_order?: number;
}

const { data: rawCategories } = await useFetch<CategoryTile[]>('/api/categories');

const categories = computed<CategoryTile[]>(() => {
  const list = Array.isArray(rawCategories.value) ? rawCategories.value : [];
  return [...list]
    .filter((c) => c && c.name && c.name.trim().toLowerCase() !== 'general')
    .sort((a, b) => {
      const f = Number(Boolean(b.is_featured)) - Number(Boolean(a.is_featured));
      if (f !== 0) return f;
      return (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name);
    })
    .slice(0, 6);
});

const failedImages = ref<Set<string>>(new Set());

function onImageError(id: string): void {
  failedImages.value = new Set(failedImages.value).add(id);
}

function handleCategoryClick(catName: string): void {
  emit('select', catName);
  if (process.client) {
    const el = document.getElementById('catalog-results');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
</script>

<template>
  <section v-if="categories.length" id="categories-grid"
    class="container-page section-block space-y-6 select-none">
    <!-- Section Heading -->
    <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-100">
      <h2
        class="font-poster heading-section font-extrabold uppercase text-[#141E1A] tracking-wide leading-none">
        SHOP BY CATEGORY
      </h2>

      <button type="button"
        class="text-xs sm:text-sm font-bold text-[#E8750D] hover:underline flex items-center gap-1 transition-colors cursor-pointer self-start sm:self-auto"
        @click="handleCategoryClick('General')">
        <span>View all books</span>
        <ArrowRight :size="14" />
      </button>
    </div>

    <!-- Category Grid: square-ish image tiles with ink caption below, no overlays -->
    <div class="grid grid-cols-3 md:grid-cols-6 gap-4 sm:gap-5 md:gap-6">
      <button v-for="cat in categories" :key="cat.id" type="button"
        class="flex flex-col items-center gap-2 group cursor-pointer"
        :aria-label="`Browse ${cat.name}`"
        @click="handleCategoryClick(cat.name)">
        <div
          class="w-full aspect-[4/3] rounded-2xl overflow-hidden bg-[#052219] transition-all duration-300 group-hover:shadow-card group-hover:-translate-y-1">
          <img v-if="cat.image_url && !failedImages.has(cat.id)" :src="cat.image_url" :alt="cat.name"
            class="w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
            loading="lazy" @error="onImageError(cat.id)" />
          <div v-else
            class="w-full h-full flex items-center justify-center bg-[#052219] text-[#FCF6BA] font-display font-bold text-3xl sm:text-4xl">
            {{ (cat.name || '?').charAt(0).toUpperCase() }}
          </div>
        </div>

        <span
          class="font-sans text-[11px] sm:text-xs md:text-sm font-bold text-[#141E1A] leading-tight text-center line-clamp-1 group-hover:text-[#E8750D] transition-colors px-1">
          {{ cat.name }}
        </span>
      </button>
    </div>
  </section>
</template>
