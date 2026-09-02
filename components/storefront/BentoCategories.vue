<!-- components/storefront/BentoCategories.vue -->
<script setup lang="ts">
import { ArrowUpRight } from 'lucide-vue-next';

const emit = defineEmits<{
  select: [category: string];
}>();

const bentoItems = [
  {
    name: 'Fiction & Literature',
    shortName: 'Fiction',
    count: 'Curated Editions',
    bgClass: 'bg-bento-fiction',
    cover: 'https://covers.openlibrary.org/b/isbn/9780062315007-M.jpg',
  },
  {
    name: 'Psychology & Self-Help',
    shortName: 'Self-Help',
    count: 'Bestselling Titles',
    bgClass: 'bg-bento-thriller',
    cover: 'https://covers.openlibrary.org/b/isbn/9780735211292-M.jpg',
    isLarge: true,
  },
  {
    name: 'Christian Books',
    shortName: 'Christian',
    count: 'Spiritual Wisdom',
    bgClass: 'bg-bento-fantasy',
    cover: 'https://covers.openlibrary.org/b/isbn/9780807014295-M.jpg',
  },
  {
    name: 'Nonfiction',
    shortName: 'Nonfiction',
    count: 'History & Science',
    bgClass: 'bg-bento-nonfiction',
    cover: 'https://covers.openlibrary.org/b/isbn/9780062316097-M.jpg',
  },
  {
    name: 'Business & Finance',
    shortName: 'Finance',
    count: 'Wealth & Strategy',
    bgClass: 'bg-bento-romance',
    cover: 'https://covers.openlibrary.org/b/isbn/9780857197689-M.jpg',
  },
];
</script>

<template>
  <section class="py-14 px-4 max-w-6xl mx-auto space-y-6">
    <div class="text-center space-y-1">
      <span class="text-[10px] font-mono uppercase font-bold tracking-widest text-theme-coral block">Browse by Genre</span>
      <h2 class="font-display text-2xl sm:text-3xl font-extrabold text-theme-ink tracking-tight uppercase">
        WHAT KIND OF STORY ARE YOU CRAVING TODAY?
      </h2>
    </div>

    <!-- Bento Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-[170px]">
      <!-- Card 1 -->
      <div
        class="rounded-2xl p-5 text-white relative overflow-hidden flex flex-col justify-between cursor-pointer group shadow-card transition-transform hover:-translate-y-1"
        :class="bentoItems[0].bgClass"
        @click="emit('select', bentoItems[0].name)"
      >
        <div class="flex justify-between items-start z-10">
          <span class="text-[10px] text-white/80 font-mono">{{ bentoItems[0].count }}</span>
          <div class="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-theme-ink transition-colors">
            <ArrowUpRight :size="14" />
          </div>
        </div>
        <h3 class="font-display text-xl font-bold uppercase z-10">{{ bentoItems[0].shortName }}</h3>
        <img :src="bentoItems[0].cover" alt="" class="absolute right-2 -bottom-4 w-20 h-28 object-cover rounded shadow-xl rotate-[8deg] group-hover:rotate-0 transition-transform duration-300" referrerpolicy="no-referrer" />
      </div>

      <!-- Card 2: Self-Help (Spans 2 rows on desktop) -->
      <div
        class="lg:row-span-2 rounded-2xl p-6 text-white relative overflow-hidden flex flex-col justify-between cursor-pointer group shadow-card transition-transform hover:-translate-y-1"
        :class="bentoItems[1].bgClass"
        @click="emit('select', bentoItems[1].name)"
      >
        <div class="flex justify-between items-start z-10">
          <span class="text-[11px] text-white/80 font-mono">{{ bentoItems[1].count }}</span>
          <div class="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-theme-ink transition-colors">
            <ArrowUpRight :size="15" />
          </div>
        </div>
        <div class="relative h-44 flex items-center justify-center">
          <img :src="bentoItems[1].cover" alt="" class="w-28 h-40 object-cover rounded-lg shadow-2xl rotate-[-8deg] group-hover:rotate-0 transition-transform duration-300" referrerpolicy="no-referrer" />
        </div>
        <h3 class="font-display text-2xl font-bold uppercase z-10">{{ bentoItems[1].shortName }}</h3>
      </div>

      <!-- Card 3 -->
      <div
        class="rounded-2xl p-5 text-white relative overflow-hidden flex flex-col justify-between cursor-pointer group shadow-card transition-transform hover:-translate-y-1"
        :class="bentoItems[2].bgClass"
        @click="emit('select', bentoItems[2].name)"
      >
        <div class="flex justify-between items-start z-10">
          <span class="text-[10px] text-white/80 font-mono">{{ bentoItems[2].count }}</span>
          <div class="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-theme-ink transition-colors">
            <ArrowUpRight :size="14" />
          </div>
        </div>
        <h3 class="font-display text-xl font-bold uppercase z-10">{{ bentoItems[2].shortName }}</h3>
        <img :src="bentoItems[2].cover" alt="" class="absolute right-2 -bottom-4 w-20 h-28 object-cover rounded shadow-xl rotate-[-10deg] group-hover:rotate-0 transition-transform duration-300" referrerpolicy="no-referrer" />
      </div>

      <!-- Card 4 -->
      <div
        class="rounded-2xl p-5 text-white relative overflow-hidden flex flex-col justify-between cursor-pointer group shadow-card transition-transform hover:-translate-y-1"
        :class="bentoItems[3].bgClass"
        @click="emit('select', bentoItems[3].name)"
      >
        <div class="flex justify-between items-start z-10">
          <span class="text-[10px] text-white/80 font-mono">{{ bentoItems[3].count }}</span>
          <div class="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-theme-ink transition-colors">
            <ArrowUpRight :size="14" />
          </div>
        </div>
        <h3 class="font-display text-xl font-bold uppercase z-10">{{ bentoItems[3].shortName }}</h3>
        <img :src="bentoItems[3].cover" alt="" class="absolute right-2 -bottom-4 w-20 h-28 object-cover rounded shadow-xl rotate-[6deg] group-hover:rotate-0 transition-transform duration-300" referrerpolicy="no-referrer" />
      </div>

      <!-- Card 5 -->
      <div
        class="rounded-2xl p-5 text-white relative overflow-hidden flex flex-col justify-between cursor-pointer group shadow-card transition-transform hover:-translate-y-1"
        :class="bentoItems[4].bgClass"
        @click="emit('select', bentoItems[4].name)"
      >
        <div class="flex justify-between items-start z-10">
          <span class="text-[10px] text-white/80 font-mono">{{ bentoItems[4].count }}</span>
          <div class="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-theme-ink transition-colors">
            <ArrowUpRight :size="14" />
          </div>
        </div>
        <h3 class="font-display text-xl font-bold uppercase z-10">{{ bentoItems[4].shortName }}</h3>
        <img :src="bentoItems[4].cover" alt="" class="absolute right-2 -bottom-4 w-20 h-28 object-cover rounded shadow-xl rotate-[-6deg] group-hover:rotate-0 transition-transform duration-300" referrerpolicy="no-referrer" />
      </div>
    </div>
  </section>
</template>