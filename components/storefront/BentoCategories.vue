<!-- components/storefront/BentoCategories.vue -->
<script setup lang="ts">
import { computed } from 'vue';
import { ArrowUpRight, TrendingUp, Sparkles, Flame, Heart, BookOpen } from 'lucide-vue-next';
import type { Book } from '~/types';

const emit = defineEmits<{
  select: [category: string];
}>();

// Fetch real catalog books to calculate live inventory counts
const { data: catalogBooks } = await useFetch<Book[]>('/api/products');

// High-Energy Flashy Neon & Duotone Palettes matching the Hero Banner Tone
// 5 Eye-Catching Flagship Categories
const FLAGSHIP_BENTO = [
  {
    key: 'finance',
    name: 'Finance & Wealth',
    subtitle: 'Money, Power, Investing & Freedom',
    tag: 'Trending 📈',
    icon: TrendingUp,
    gradient: 'linear-gradient(135deg, #052A1D 0%, #0A4A33 50%, #10704D 100%)',
    borderColor: 'border-emerald-400/30',
    accentColor: '#2EE59D',
    textColor: 'text-[#2EE59D]',
    cover: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80',
    categoryQuery: 'Finance',
  },
  {
    key: 'self-help',
    name: 'Self-Help & Mindset',
    subtitle: 'Habits, Psychology, Mastery & Focus',
    tag: 'Essential ⚡',
    icon: Sparkles,
    gradient: 'linear-gradient(135deg, #7C2405 0%, #B83C0C 50%, #E8590C 100%)',
    borderColor: 'border-orange-400/40',
    accentColor: '#FFB300',
    textColor: 'text-[#FFB300]',
    cover: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&auto=format&fit=crop&q=80',
    categoryQuery: 'Self-Help',
  },
  {
    key: 'fiction',
    name: 'Fiction & Literature',
    subtitle: 'Sci-Fi, Dystopian, Classics & Thrillers',
    tag: 'Bestselling 📖',
    icon: BookOpen,
    gradient: 'linear-gradient(135deg, #08203D 0%, #0E3E73 50%, #1664A6 100%)',
    borderColor: 'border-cyan-400/30',
    accentColor: '#2CD4BF',
    textColor: 'text-[#2CD4BF]',
    cover: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&auto=format&fit=crop&q=80',
    categoryQuery: 'Fiction',
  },
  {
    key: 'adult',
    name: 'Adult & Erotics',
    subtitle: 'Passionate, Spicy, Taboo & Uncensored',
    tag: '18+ Uncensored 🔥',
    icon: Flame,
    gradient: 'linear-gradient(135deg, #420A14 0%, #701020 50%, #A3182E 100%)',
    borderColor: 'border-rose-400/40',
    accentColor: '#FF2E54',
    textColor: 'text-[#FF2E54]',
    cover: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400&auto=format&fit=crop&q=80',
    categoryQuery: 'Adult & Erotics',
  },
  {
    key: 'romance',
    name: 'Romance & Drama',
    subtitle: 'Enemies to Lovers, Heartbreak & Soulmates',
    tag: 'Hot Tropes 💕',
    icon: Heart,
    gradient: 'linear-gradient(135deg, #350B47 0%, #581673 50%, #8522AD 100%)',
    borderColor: 'border-purple-400/30',
    accentColor: '#F472B6',
    textColor: 'text-[#F472B6]',
    cover: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&auto=format&fit=crop&q=80',
    categoryQuery: 'Romance & Drama',
  },
];

// Compute count per category dynamically
const countMap = computed(() => {
  const map = new Map<string, number>();
  if (catalogBooks.value) {
    for (const b of catalogBooks.value) {
      const cat = (b.category_name || 'General').toLowerCase();
      map.set(cat, (map.get(cat) || 0) + 1);
    }
  }
  return map;
});

function getCategoryCount(query: string): number {
  const q = query.toLowerCase();
  let total = 0;
  for (const [cat, count] of countMap.value.entries()) {
    if (cat.includes(q) || q.includes(cat)) {
      total += count;
    }
  }
  return total;
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
  <section id="categories-bento" class="py-12 sm:py-16 px-4 max-w-6xl mx-auto space-y-8 select-none overflow-hidden">
    <!-- Header: Flashy Hero Vibe -->
    <div class="text-center space-y-2">
      <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#052219] text-[#2EE59D] text-[10px] font-mono font-bold uppercase tracking-widest border border-[#2EE59D]/30 shadow-xs">
        <Sparkles :size="12" class="text-[#2EE59D]" />
        <span>CURATED COLLECTIONS</span>
      </div>
      <h2 class="font-poster text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#141E1A] tracking-wide uppercase leading-none">
        WHAT ARE YOU CRAVING TO READ TODAY?
      </h2>
      <p class="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto font-sans font-medium">
        Explore our 5 most demanded collections. Tap any genre to filter the full collection immediately.
      </p>
    </div>

    <!-- 5-Card High-Energy Bento Grid -->
    <div class="grid grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-4 auto-rows-[170px] sm:auto-rows-[195px]">
      
      <!-- 1. Finance & Wealth (Wide Anchor Card) -->
      <div
        class="rounded-2xl p-4 sm:p-5 text-white relative overflow-hidden flex flex-col justify-between cursor-pointer group shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl border"
        :class="FLAGSHIP_BENTO[0].borderColor"
        :style="{ background: FLAGSHIP_BENTO[0].gradient }"
        @click="handleCategoryClick(FLAGSHIP_BENTO[0].categoryQuery)"
      >
        <div class="absolute inset-0 bg-radial-at-tl from-white/20 via-transparent to-black/40 pointer-events-none z-0" />

        <div class="flex justify-between items-start z-10">
          <span class="text-[10px] sm:text-[11px] font-mono font-extrabold tracking-wider px-2.5 py-0.5 rounded-full bg-black/40 backdrop-blur-xs flex items-center gap-1" :style="{ color: FLAGSHIP_BENTO[0].accentColor }">
            <component :is="FLAGSHIP_BENTO[0].icon" :size="12" />
            <span>{{ FLAGSHIP_BENTO[0].tag }}</span>
            <span v-if="getCategoryCount(FLAGSHIP_BENTO[0].categoryQuery) > 0" class="text-[9px] opacity-75 font-normal">
              • {{ getCategoryCount(FLAGSHIP_BENTO[0].categoryQuery) }}
            </span>
          </span>
          <div class="w-7 h-7 rounded-full bg-white/15 backdrop-blur-xs flex items-center justify-center group-hover:bg-white group-hover:text-[#052219] transition-colors shadow-xs">
            <ArrowUpRight :size="14" />
          </div>
        </div>

        <div class="z-10 max-w-[70%] space-y-0.5">
          <h3 class="font-poster text-2xl sm:text-3xl font-extrabold uppercase tracking-wide leading-tight drop-shadow-xs">
            {{ FLAGSHIP_BENTO[0].name }}
          </h3>
          <p class="text-[10px] sm:text-[11px] text-white/80 font-medium font-sans truncate">
            {{ FLAGSHIP_BENTO[0].subtitle }}
          </p>
        </div>

        <!-- 3D Book Cover Overlay -->
        <div class="absolute -right-2 -bottom-3 w-[36%] max-w-[115px] min-w-[65px] aspect-[1/1.45] rounded-md overflow-hidden shadow-2xl rotate-[10deg] group-hover:rotate-6 group-hover:scale-105 transition-transform duration-300 z-1 pointer-events-none border border-white/20 book-cover-3d">
          <img :src="FLAGSHIP_BENTO[0].cover" alt="" class="w-full h-full object-cover" />
          <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>
      </div>

      <!-- 2. Self-Help & Mindset (Center Feature Column) -->
      <div
        class="col-span-2 md:col-span-1 md:row-span-2 rounded-2xl p-5 sm:p-6 text-white relative overflow-hidden flex flex-col justify-between cursor-pointer group shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl order-last md:order-none min-h-[220px] md:min-h-0 border"
        :class="FLAGSHIP_BENTO[1].borderColor"
        :style="{ background: FLAGSHIP_BENTO[1].gradient }"
        @click="handleCategoryClick(FLAGSHIP_BENTO[1].categoryQuery)"
      >
        <div class="absolute inset-0 bg-radial-at-tl from-white/20 via-transparent to-black/40 pointer-events-none z-0" />

        <div class="flex justify-between items-start z-10">
          <span class="text-[10px] sm:text-[11px] font-mono font-extrabold tracking-wider px-2.5 py-0.5 rounded-full bg-black/40 backdrop-blur-xs flex items-center gap-1" :style="{ color: FLAGSHIP_BENTO[1].accentColor }">
            <component :is="FLAGSHIP_BENTO[1].icon" :size="12" />
            <span>{{ FLAGSHIP_BENTO[1].tag }}</span>
            <span v-if="getCategoryCount(FLAGSHIP_BENTO[1].categoryQuery) > 0" class="text-[9px] opacity-75 font-normal">
              • {{ getCategoryCount(FLAGSHIP_BENTO[1].categoryQuery) }}
            </span>
          </span>
          <div class="w-7 h-7 rounded-full bg-white/15 backdrop-blur-xs flex items-center justify-center group-hover:bg-white group-hover:text-[#052219] transition-colors shadow-xs">
            <ArrowUpRight :size="14" />
          </div>
        </div>

        <!-- Fanned Book Cluster -->
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
            <img :src="FLAGSHIP_BENTO[1].cover" alt="" class="w-full h-full object-cover" />
            <div class="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          </div>
        </div>

        <div class="z-10 space-y-0.5">
          <h3 class="font-poster text-2xl sm:text-3xl font-extrabold uppercase tracking-wide leading-tight drop-shadow-xs">
            {{ FLAGSHIP_BENTO[1].name }}
          </h3>
          <p class="text-[11px] text-white/85 font-medium font-sans">
            {{ FLAGSHIP_BENTO[1].subtitle }}
          </p>
        </div>
      </div>

      <!-- 3. Fiction & Literature -->
      <div
        class="rounded-2xl p-4 sm:p-5 text-white relative overflow-hidden flex flex-col justify-between cursor-pointer group shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl border"
        :class="FLAGSHIP_BENTO[2].borderColor"
        :style="{ background: FLAGSHIP_BENTO[2].gradient }"
        @click="handleCategoryClick(FLAGSHIP_BENTO[2].categoryQuery)"
      >
        <div class="absolute inset-0 bg-radial-at-tl from-white/20 via-transparent to-black/40 pointer-events-none z-0" />

        <div class="flex justify-between items-start z-10">
          <span class="text-[10px] sm:text-[11px] font-mono font-extrabold tracking-wider px-2.5 py-0.5 rounded-full bg-black/40 backdrop-blur-xs flex items-center gap-1" :style="{ color: FLAGSHIP_BENTO[2].accentColor }">
            <component :is="FLAGSHIP_BENTO[2].icon" :size="12" />
            <span>{{ FLAGSHIP_BENTO[2].tag }}</span>
            <span v-if="getCategoryCount(FLAGSHIP_BENTO[2].categoryQuery) > 0" class="text-[9px] opacity-75 font-normal">
              • {{ getCategoryCount(FLAGSHIP_BENTO[2].categoryQuery) }}
            </span>
          </span>
          <div class="w-7 h-7 rounded-full bg-white/15 backdrop-blur-xs flex items-center justify-center group-hover:bg-white group-hover:text-[#052219] transition-colors shadow-xs">
            <ArrowUpRight :size="14" />
          </div>
        </div>

        <div class="z-10 max-w-[75%] space-y-0.5">
          <h3 class="font-poster text-2xl sm:text-3xl font-extrabold uppercase tracking-wide drop-shadow-xs leading-tight">
            {{ FLAGSHIP_BENTO[2].name }}
          </h3>
          <p class="text-[10px] sm:text-[11px] text-white/80 font-medium font-sans truncate">
            {{ FLAGSHIP_BENTO[2].subtitle }}
          </p>
        </div>

        <div class="absolute -right-2 -bottom-3 w-[38%] max-w-[115px] min-w-[65px] aspect-[1/1.45] rounded-md overflow-hidden shadow-2xl rotate-[-8deg] group-hover:rotate-0 group-hover:scale-105 transition-transform duration-300 z-1 pointer-events-none border border-white/20 book-cover-3d">
          <img :src="FLAGSHIP_BENTO[2].cover" alt="" class="w-full h-full object-cover" />
          <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>
      </div>

      <!-- 4. Adult & Erotics (Hot Crimson) -->
      <div
        class="rounded-2xl p-4 sm:p-5 text-white relative overflow-hidden flex flex-col justify-between cursor-pointer group shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl border"
        :class="FLAGSHIP_BENTO[3].borderColor"
        :style="{ background: FLAGSHIP_BENTO[3].gradient }"
        @click="handleCategoryClick(FLAGSHIP_BENTO[3].categoryQuery)"
      >
        <div class="absolute inset-0 bg-radial-at-tl from-white/20 via-transparent to-black/40 pointer-events-none z-0" />

        <div class="flex justify-between items-start z-10">
          <span class="text-[10px] sm:text-[11px] font-mono font-extrabold tracking-wider px-2.5 py-0.5 rounded-full bg-black/40 backdrop-blur-xs flex items-center gap-1" :style="{ color: FLAGSHIP_BENTO[3].accentColor }">
            <component :is="FLAGSHIP_BENTO[3].icon" :size="12" />
            <span>{{ FLAGSHIP_BENTO[3].tag }}</span>
            <span v-if="getCategoryCount(FLAGSHIP_BENTO[3].categoryQuery) > 0" class="text-[9px] opacity-75 font-normal">
              • {{ getCategoryCount(FLAGSHIP_BENTO[3].categoryQuery) }}
            </span>
          </span>
          <div class="w-7 h-7 rounded-full bg-white/15 backdrop-blur-xs flex items-center justify-center group-hover:bg-white group-hover:text-[#052219] transition-colors shadow-xs">
            <ArrowUpRight :size="14" />
          </div>
        </div>

        <div class="z-10 max-w-[75%] space-y-0.5">
          <h3 class="font-poster text-2xl sm:text-3xl font-extrabold uppercase tracking-wide drop-shadow-xs leading-tight">
            {{ FLAGSHIP_BENTO[3].name }}
          </h3>
          <p class="text-[10px] sm:text-[11px] text-white/80 font-medium font-sans truncate">
            {{ FLAGSHIP_BENTO[3].subtitle }}
          </p>
        </div>

        <div class="absolute -right-2 -bottom-3 w-[38%] max-w-[115px] min-w-[65px] aspect-[1/1.45] rounded-md overflow-hidden shadow-2xl rotate-[6deg] group-hover:rotate-0 group-hover:scale-105 transition-transform duration-300 z-1 pointer-events-none border border-white/20 book-cover-3d">
          <img :src="FLAGSHIP_BENTO[3].cover" alt="" class="w-full h-full object-cover" />
          <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>
      </div>

      <!-- 5. Romance & Drama (Royal Amethyst Orchid) -->
      <div
        class="rounded-2xl p-4 sm:p-5 text-white relative overflow-hidden flex flex-col justify-between cursor-pointer group shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl border"
        :class="FLAGSHIP_BENTO[4].borderColor"
        :style="{ background: FLAGSHIP_BENTO[4].gradient }"
        @click="handleCategoryClick(FLAGSHIP_BENTO[4].categoryQuery)"
      >
        <div class="absolute inset-0 bg-radial-at-tl from-white/20 via-transparent to-black/40 pointer-events-none z-0" />

        <div class="flex justify-between items-start z-10">
          <span class="text-[10px] sm:text-[11px] font-mono font-extrabold tracking-wider px-2.5 py-0.5 rounded-full bg-black/40 backdrop-blur-xs flex items-center gap-1" :style="{ color: FLAGSHIP_BENTO[4].accentColor }">
            <component :is="FLAGSHIP_BENTO[4].icon" :size="12" />
            <span>{{ FLAGSHIP_BENTO[4].tag }}</span>
            <span v-if="getCategoryCount(FLAGSHIP_BENTO[4].categoryQuery) > 0" class="text-[9px] opacity-75 font-normal">
              • {{ getCategoryCount(FLAGSHIP_BENTO[4].categoryQuery) }}
            </span>
          </span>
          <div class="w-7 h-7 rounded-full bg-white/15 backdrop-blur-xs flex items-center justify-center group-hover:bg-white group-hover:text-[#052219] transition-colors shadow-xs">
            <ArrowUpRight :size="14" />
          </div>
        </div>

        <div class="z-10 max-w-[75%] space-y-0.5">
          <h3 class="font-poster text-2xl sm:text-3xl font-extrabold uppercase tracking-wide drop-shadow-xs leading-tight">
            {{ FLAGSHIP_BENTO[4].name }}
          </h3>
          <p class="text-[10px] sm:text-[11px] text-white/80 font-medium font-sans truncate">
            {{ FLAGSHIP_BENTO[4].subtitle }}
          </p>
        </div>

        <div class="absolute -right-2 -bottom-3 w-[38%] max-w-[115px] min-w-[65px] aspect-[1/1.45] rounded-md overflow-hidden shadow-2xl rotate-[-6deg] group-hover:rotate-0 group-hover:scale-105 transition-transform duration-300 z-1 pointer-events-none border border-white/20 book-cover-3d">
          <img :src="FLAGSHIP_BENTO[4].cover" alt="" class="w-full h-full object-cover" />
          <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>
      </div>

    </div>
  </section>
</template>