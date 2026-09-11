<!-- components/storefront/BentoCategories.vue -->
<script setup lang="ts">
import { computed } from 'vue';
import { ArrowUpRight, Layers } from 'lucide-vue-next';
import type { Book } from '~/types';

const emit = defineEmits<{
  select: [category: string];
}>();

// 1. Fetch Real Catalog Books to calculate live, dynamic book counts per category
const { data: catalogBooks } = await useFetch<Book[]>('/api/products');

// 2. High-End Heritage Literary Color Palette
const LUXURY_PALETTE = [
  { bg: '#0C3A2B', border: 'border-emerald-500/20', accent: '#2EE59D', cover: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80' }, // British Racing Pine
  { bg: '#8E621E', border: 'border-amber-500/20', accent: '#FDE047', cover: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&auto=format&fit=crop&q=80' },   // Antique Ochre
  { bg: '#122438', border: 'border-sky-500/20', accent: '#7DD3FC', cover: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&auto=format&fit=crop&q=80' },     // Oxford Navy
  { bg: '#4D1B28', border: 'border-rose-500/20', accent: '#FDA4AF', cover: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400&auto=format&fit=crop&q=80' },   // Port Wine
  { bg: '#7D3222', border: 'border-orange-500/20', accent: '#FDBA74', cover: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&auto=format&fit=crop&q=80' }, // Tuscan Terracotta
  { bg: '#2B1D19', border: 'border-stone-500/20', accent: '#E7E5E4', cover: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?w=400&auto=format&fit=crop&q=80' }, // Espresso Leather
];

// 3. Fallback Curated Category Set if catalog is bootstrapping
const DEFAULT_CATEGORIES = [
  'Fiction & Literature',
  'Psychology & Self-Help',
  'Business & Finance',
  'Christian Books',
  'Education & Textbooks',
  'Biographies & Memoir',
  'Self-Help',
  'Philosophy & Mindset',
  'African Literature',
  'General',
];

interface FormattedCategory {
  name: string;
  count: number;
  bg: string;
  border: string;
  accent: string;
  cover: string;
}

const allCategories = computed<FormattedCategory[]>(() => {
  const counts = new Map<string, number>();

  if (catalogBooks.value) {
    for (const book of catalogBooks.value) {
      const name = (book.category_name || 'General').trim();
      counts.set(name, (counts.get(name) || 0) + 1);
    }
  }

  // Ensure default categories exist even if 0 items are added yet
  for (const def of DEFAULT_CATEGORIES) {
    if (!counts.has(def)) {
      counts.set(def, 0);
    }
  }

  const sortedNames = Array.from(counts.keys()).sort((a, b) => {
    // Sort by largest book volume first, fallback to alphabetical
    const countA = counts.get(a) || 0;
    const countB = counts.get(b) || 0;
    if (countB !== countA) return countB - countA;
    return a.localeCompare(b);
  });

  return sortedNames.map((name, idx) => {
    const palette = LUXURY_PALETTE[idx % LUXURY_PALETTE.length];
    return {
      name,
      count: counts.get(name) || 0,
      bg: palette.bg,
      border: palette.border,
      accent: palette.accent,
      cover: palette.cover,
    };
  });
});

// Top 5 Categories populate the Marquee Bento Grid
const marqueeCategories = computed(() => allCategories.value.slice(0, 5));

// Remaining categories populate the sleek architectural sub-shelf
const subCategories = computed(() => allCategories.value.slice(5));

function handleCategoryClick(catName: string): void {
  emit('select', catName);
}
</script>

<template>
  <section id="categories-bento" class="py-12 sm:py-16 px-4 max-w-6xl mx-auto space-y-9 select-none overflow-hidden">
    <!-- 1. Section Header: Anchored on the font-poster design foundation -->
    <div class="text-center space-y-1.5">
      <span class="text-[10px] sm:text-[11px] font-mono uppercase font-bold tracking-widest text-[#F05A36] block">
        EXPLORE BY GENRE
      </span>
      <h2 class="font-poster text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#141E1A] tracking-wide uppercase leading-none">
        WHAT KIND OF STORY ARE YOU CRAVING TODAY?
      </h2>
    </div>

    <!-- ================================================================= -->
    <!-- 2. ZONE A: MARQUEE BENTO (TOP 5 FLAGSHIP CATEGORIES)              -->
    <!-- ================================================================= -->
    <div class="grid grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-4 auto-rows-[165px] sm:auto-rows-[195px]">
      
      <!-- Card 1: Wide Anchor Tile -->
      <div
        v-if="marqueeCategories[0]"
        class="rounded-2xl p-4 sm:p-5 text-white relative overflow-hidden flex flex-col justify-between cursor-pointer group shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg border"
        :class="marqueeCategories[0].border"
        :style="{ backgroundColor: marqueeCategories[0].bg }"
        @click="handleCategoryClick(marqueeCategories[0].name)"
      >
        <div class="absolute inset-0 bg-radial-at-tl from-white/20 via-transparent to-black/35 pointer-events-none z-0" />

        <div class="flex justify-between items-start z-10">
          <span class="text-[10px] sm:text-xs font-mono font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/10 backdrop-blur-xs" :style="{ color: marqueeCategories[0].accent }">
            {{ marqueeCategories[0].count }} {{ marqueeCategories[0].count === 1 ? 'Title' : 'Titles' }}
          </span>
          <div class="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/15 backdrop-blur-xs flex items-center justify-center group-hover:bg-white group-hover:text-[#052219] transition-colors shadow-xs">
            <ArrowUpRight :size="14" />
          </div>
        </div>

        <h3 class="font-poster text-2xl sm:text-3xl font-extrabold uppercase tracking-wide z-10 drop-shadow-xs max-w-[70%]">
          {{ marqueeCategories[0].name }}
        </h3>

        <!-- Angled 3D Book Jacket with Depth Shadow -->
        <div class="absolute -right-2 -bottom-3 w-[36%] max-w-[115px] min-w-[65px] aspect-[1/1.45] rounded-md overflow-hidden shadow-2xl rotate-[10deg] group-hover:rotate-6 group-hover:scale-105 transition-transform duration-300 z-1 pointer-events-none border border-white/20 book-cover-3d">
          <img :src="marqueeCategories[0].cover" alt="" class="w-full h-full object-cover" />
          <div class="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        </div>
      </div>

      <!-- Card 2: Center Feature Column -->
      <div
        v-if="marqueeCategories[1]"
        class="col-span-2 md:col-span-1 md:row-span-2 rounded-2xl p-5 sm:p-6 text-white relative overflow-hidden flex flex-col justify-between cursor-pointer group shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg order-last md:order-none min-h-[220px] md:min-h-0 border"
        :class="marqueeCategories[1].border"
        :style="{ backgroundColor: marqueeCategories[1].bg }"
        @click="handleCategoryClick(marqueeCategories[1].name)"
      >
        <div class="absolute inset-0 bg-radial-at-tl from-white/20 via-transparent to-black/40 pointer-events-none z-0" />

        <div class="flex justify-between items-start z-10">
          <span class="text-[10px] sm:text-xs font-mono font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/10 backdrop-blur-xs" :style="{ color: marqueeCategories[1].accent }">
            {{ marqueeCategories[1].count }} {{ marqueeCategories[1].count === 1 ? 'Title' : 'Titles' }}
          </span>
          <div class="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/15 backdrop-blur-xs flex items-center justify-center group-hover:bg-white group-hover:text-[#052219] transition-colors shadow-xs">
            <ArrowUpRight :size="14" />
          </div>
        </div>

        <!-- Triple Fanned Book Cluster with Ambient Drop Shadow -->
        <div class="relative w-full h-36 sm:h-48 md:h-56 flex items-center justify-center my-auto pointer-events-none z-1">
          <div class="absolute w-[32%] max-w-[105px] min-w-[60px] aspect-[1/1.45] rounded-md overflow-hidden shadow-xl -translate-x-[40%] rotate-[-14deg] border border-white/20 book-cover-3d">
            <img src="https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&auto=format&fit=crop&q=80" alt="" class="w-full h-full object-cover" />
            <div class="absolute inset-0 bg-black/30" />
          </div>
          <div class="absolute w-[32%] max-w-[105px] min-w-[60px] aspect-[1/1.45] rounded-md overflow-hidden shadow-xl translate-x-[40%] rotate-[14deg] border border-white/20 book-cover-3d">
            <img src="https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&auto=format&fit=crop&q=80" alt="" class="w-full h-full object-cover" />
            <div class="absolute inset-0 bg-black/30" />
          </div>
          <div class="absolute w-[36%] max-w-[115px] min-w-[68px] aspect-[1/1.45] rounded-md overflow-hidden shadow-2xl z-10 scale-105 group-hover:scale-110 transition-transform duration-300 border border-white/30 book-cover-3d">
            <img :src="marqueeCategories[1].cover" alt="" class="w-full h-full object-cover" />
            <div class="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
          </div>
        </div>

        <h3 class="font-poster text-2xl sm:text-3xl font-extrabold uppercase tracking-wide z-10 leading-tight drop-shadow-xs">
          {{ marqueeCategories[1].name }}
        </h3>
      </div>

      <!-- Card 3: Standard Square Card -->
      <div
        v-if="marqueeCategories[2]"
        class="rounded-2xl p-4 sm:p-5 text-white relative overflow-hidden flex flex-col justify-between cursor-pointer group shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg border"
        :class="marqueeCategories[2].border"
        :style="{ backgroundColor: marqueeCategories[2].bg }"
        @click="handleCategoryClick(marqueeCategories[2].name)"
      >
        <div class="absolute inset-0 bg-radial-at-tl from-white/20 via-transparent to-black/35 pointer-events-none z-0" />

        <div class="flex justify-between items-start z-10">
          <span class="text-[10px] sm:text-xs font-mono font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/10 backdrop-blur-xs" :style="{ color: marqueeCategories[2].accent }">
            {{ marqueeCategories[2].count }} {{ marqueeCategories[2].count === 1 ? 'Title' : 'Titles' }}
          </span>
          <div class="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/15 backdrop-blur-xs flex items-center justify-center group-hover:bg-white group-hover:text-[#052219] transition-colors shadow-xs">
            <ArrowUpRight :size="14" />
          </div>
        </div>

        <h3 class="font-poster text-2xl sm:text-3xl font-extrabold uppercase tracking-wide z-10 drop-shadow-xs max-w-[75%]">
          {{ marqueeCategories[2].name }}
        </h3>

        <div class="absolute -right-2 -bottom-3 w-[38%] max-w-[115px] min-w-[65px] aspect-[1/1.45] rounded-md overflow-hidden shadow-2xl rotate-[-8deg] group-hover:rotate-0 group-hover:scale-105 transition-transform duration-300 z-1 pointer-events-none border border-white/20 book-cover-3d">
          <img :src="marqueeCategories[2].cover" alt="" class="w-full h-full object-cover" />
          <div class="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        </div>
      </div>

      <!-- Card 4: Standard Square Card -->
      <div
        v-if="marqueeCategories[3]"
        class="rounded-2xl p-4 sm:p-5 text-white relative overflow-hidden flex flex-col justify-between cursor-pointer group shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg border"
        :class="marqueeCategories[3].border"
        :style="{ backgroundColor: marqueeCategories[3].bg }"
        @click="handleCategoryClick(marqueeCategories[3].name)"
      >
        <div class="absolute inset-0 bg-radial-at-tl from-white/20 via-transparent to-black/35 pointer-events-none z-0" />

        <div class="flex justify-between items-start z-10">
          <span class="text-[10px] sm:text-xs font-mono font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/10 backdrop-blur-xs" :style="{ color: marqueeCategories[3].accent }">
            {{ marqueeCategories[3].count }} {{ marqueeCategories[3].count === 1 ? 'Title' : 'Titles' }}
          </span>
          <div class="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/15 backdrop-blur-xs flex items-center justify-center group-hover:bg-white group-hover:text-[#052219] transition-colors shadow-xs">
            <ArrowUpRight :size="14" />
          </div>
        </div>

        <h3 class="font-poster text-2xl sm:text-3xl font-extrabold uppercase tracking-wide z-10 drop-shadow-xs max-w-[75%]">
          {{ marqueeCategories[3].name }}
        </h3>

        <div class="absolute -right-2 -bottom-3 w-[38%] max-w-[115px] min-w-[65px] aspect-[1/1.45] rounded-md overflow-hidden shadow-2xl rotate-[6deg] group-hover:rotate-0 group-hover:scale-105 transition-transform duration-300 z-1 pointer-events-none border border-white/20 book-cover-3d">
          <img :src="marqueeCategories[3].cover" alt="" class="w-full h-full object-cover" />
          <div class="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        </div>
      </div>

      <!-- Card 5: Standard Square Card -->
      <div
        v-if="marqueeCategories[4]"
        class="rounded-2xl p-4 sm:p-5 text-white relative overflow-hidden flex flex-col justify-between cursor-pointer group shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg border"
        :class="marqueeCategories[4].border"
        :style="{ backgroundColor: marqueeCategories[4].bg }"
        @click="handleCategoryClick(marqueeCategories[4].name)"
      >
        <div class="absolute inset-0 bg-radial-at-tl from-white/20 via-transparent to-black/35 pointer-events-none z-0" />

        <div class="flex justify-between items-start z-10">
          <span class="text-[10px] sm:text-xs font-mono font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/10 backdrop-blur-xs" :style="{ color: marqueeCategories[4].accent }">
            {{ marqueeCategories[4].count }} {{ marqueeCategories[4].count === 1 ? 'Title' : 'Titles' }}
          </span>
          <div class="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/15 backdrop-blur-xs flex items-center justify-center group-hover:bg-white group-hover:text-[#052219] transition-colors shadow-xs">
            <ArrowUpRight :size="14" />
          </div>
        </div>

        <h3 class="font-poster text-2xl sm:text-3xl font-extrabold uppercase tracking-wide z-10 drop-shadow-xs max-w-[75%]">
          {{ marqueeCategories[4].name }}
        </h3>

        <div class="absolute -right-2 -bottom-3 w-[38%] max-w-[115px] min-w-[65px] aspect-[1/1.45] rounded-md overflow-hidden shadow-2xl rotate-[-6deg] group-hover:rotate-0 group-hover:scale-105 transition-transform duration-300 z-1 pointer-events-none border border-white/20 book-cover-3d">
          <img :src="marqueeCategories[4].cover" alt="" class="w-full h-full object-cover" />
          <div class="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        </div>
      </div>

    </div>

    <!-- ================================================================= -->
    <!-- 3. ZONE B: SLEEK ARCHITECTURAL SUB-CATEGORY SHELF (MANY GENRES)  -->
    <!-- ================================================================= -->
    <div v-if="subCategories.length > 0" class="space-y-3 pt-2">
      <div class="flex items-center justify-between border-b border-paper-border pb-2.5">
        <div class="flex items-center gap-2 text-forest-950">
          <Layers :size="15" class="text-gold-600" />
          <span class="font-mono text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-forest-950">
            More Specialty Categories &amp; Subjects
          </span>
        </div>
        <span class="text-[10px] font-mono text-ink-muted">
          {{ subCategories.length }} Specialized Departments
        </span>
      </div>

      <!-- Symmetrical Multi-Column Chip Shelf -->
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
        <button
          v-for="sub in subCategories"
          :key="sub.name"
          type="button"
          class="p-3 bg-paper-cream/60 hover:bg-white border border-paper-border hover:border-forest-900/40 rounded-xl transition-all flex flex-col justify-between text-left group cursor-pointer shadow-2xs hover:shadow-subtle hover:-translate-y-0.5 min-h-[74px]"
          @click="handleCategoryClick(sub.name)"
        >
          <div class="flex justify-between items-center w-full">
            <span class="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-white text-forest-950 border border-paper-border">
              {{ sub.count }}
            </span>
            <ArrowUpRight :size="13" class="text-ink-subtle group-hover:text-forest-950 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>

          <span class="font-sans text-xs font-bold text-forest-950 group-hover:text-[#F05A36] transition-colors truncate mt-1">
            {{ sub.name }}
          </span>
        </button>
      </div>
    </div>
  </section>
</template>