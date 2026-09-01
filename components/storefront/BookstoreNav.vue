<!-- components/storefront/BookstoreNav.vue -->
<script setup lang="ts">
import { ref } from 'vue';
import { Sparkles } from 'lucide-vue-next';

const emit = defineEmits<{
  'select-category': [category: string];
}>();

const navItems = [
  'ALL',
  'Business & Finance',
  'Psychology & Self-Help',
  'Self-Help',
  'Fiction & Literature',
  'Christian Books',
  'Education & Textbooks',
];

const activeItem = ref('ALL');

function handleSelect(category: string): void {
  activeItem.value = category;
  emit('select-category', category);
}
</script>

<template>
  <nav aria-label="Book categories" class="bg-forest-950 text-paper text-xs font-semibold px-4 shadow-subtle sticky top-[61px] sm:top-[65px] z-30 overflow-x-auto no-scrollbar border-b border-forest-900/60">
    <div class="max-w-7xl mx-auto flex items-center justify-between gap-4 py-2 min-w-max md:min-w-0">
      
      <!-- Category Pills Carousel -->
      <div class="flex items-center gap-1 sm:gap-1.5">
        <button
          v-for="item in navItems"
          :key="item"
          type="button"
          class="px-3 py-1 rounded-full transition-all text-[11px] font-sans font-medium whitespace-nowrap cursor-pointer select-none"
          :class="activeItem === item ? 'bg-gold-500 text-forest-950 font-bold shadow-xs' : 'text-paper/80 hover:text-paper hover:bg-white/10'"
          @click="handleSelect(item)"
        >
          {{ item === 'ALL' ? 'All Editions' : item }}
        </button>
      </div>

      <!-- Right Feature Badge -->
      <div class="hidden lg:flex items-center gap-1.5 text-gold-300 font-sans font-medium text-[11px] whitespace-nowrap">
        <Sparkles :size="12" class="text-gold-400" />
        <span>Instant Cloudflare R2 Downloads Available</span>
      </div>
    </div>
  </nav>
</template>