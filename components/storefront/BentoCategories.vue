<!-- components/storefront/BentoCategories.vue -->
<script setup lang="ts">
import { ArrowUpRight } from 'lucide-vue-next';

const emit = defineEmits<{
  select: [category: string];
}>();

// Color-sampled directly from reference screenshot with 100% saturation parity
const bentoItems = [
  {
    name: 'Fiction & Literature',
    title: 'FICTION',
    count: '234 Books',
    bg: '#2A805A', // Vibrant Emerald
    cover: 'https://books.google.com/books/content?id=kotPYEqCoach&printsec=frontcover&img=1&zoom=1',
  },
  {
    name: 'Psychology & Self-Help',
    title: 'THRILLER',
    count: '189 Books',
    bg: '#E5A636', // Punchy Golden Amber
  },
  {
    name: 'Christian Books',
    title: 'FANTASY',
    count: '142 Books',
    bg: '#189CB0', // Electric Teal/Lagoon
    cover: 'https://books.google.com/books/content?id=FzVjBgAAQBAJ&printsec=frontcover&img=1&zoom=1',
  },
  {
    name: 'Education & Textbooks',
    title: 'NONFICTION',
    count: '156 Books',
    bg: '#EE5335', // Vivid Vermilion Coral
    cover: 'https://books.google.com/books/content?id=1myBAgAAQBAJ&printsec=frontcover&img=1&zoom=1',
  },
  {
    name: 'Business & Finance',
    title: 'ROMANCE',
    count: '210 Books',
    bg: '#7A62B3', // Saturated Royal Lavender
    cover: 'https://books.google.com/books/content?id=Yw32DwAAQBAJ&printsec=frontcover&img=1&zoom=1',
  },
];
</script>

<template>
  <section id="categories-bento" class="py-12 sm:py-16 px-4 max-w-6xl mx-auto space-y-7 select-none overflow-hidden">
    <!-- Header -->
    <div class="text-center space-y-1.5">
      <span class="text-[10px] sm:text-[11px] font-mono uppercase font-bold tracking-widest text-[#EE5335] block">
        BOOK CATEGORIES
      </span>
      <h2 class="font-poster text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#141E1A] tracking-wide uppercase leading-none">
        WHAT KIND OF STORY ARE YOU CRAVING TODAY?
      </h2>
    </div>

    <!-- Responsive Bento Grid: 2 Cols on Mobile, 3 Cols on Desktop -->
    <div class="grid grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-4 auto-rows-[160px] sm:auto-rows-[190px]">
      
      <!-- Card 1: Fiction (Top-Left) -->
      <div
        class="rounded-2xl p-4 sm:p-5 text-white relative overflow-hidden flex flex-col justify-between cursor-pointer group shadow-sm transition-transform duration-300 hover:-translate-y-1"
        :style="{ backgroundColor: bentoItems[0].bg }"
        @click="emit('select', bentoItems[0].name)"
      >
        <div class="flex justify-between items-start z-10">
          <span class="text-[10px] sm:text-xs text-white/90 font-mono font-medium">{{ bentoItems[0].count }}</span>
          <div class="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/25 flex items-center justify-center group-hover:bg-white group-hover:text-[#141E1A] transition-colors">
            <ArrowUpRight :size="14" />
          </div>
        </div>
        <h3 class="font-poster text-2xl sm:text-3xl font-bold uppercase tracking-wide z-10 leading-none">
          {{ bentoItems[0].title }}
        </h3>
        
        <!-- Fluid Responsive Corner Book (Shrinks & Grows with Card) -->
        <div class="absolute -right-2 sm:-right-3 -bottom-3 sm:-bottom-4 w-[36%] max-w-[120px] min-w-[65px] aspect-[3/4.2] rounded-md overflow-hidden shadow-2xl rotate-[10deg] group-hover:rotate-6 transition-transform duration-300 pointer-events-none">
          <img
            :src="bentoItems[0].cover"
            alt=""
            class="w-full h-full object-cover"
            referrerpolicy="no-referrer"
          />
        </div>
      </div>

      <!-- Card 2: Center Tall Card (Thriller - Spans 2 Rows on Desktop, Full Width on Mobile) -->
      <div
        class="col-span-2 md:col-span-1 md:row-span-2 rounded-2xl p-5 sm:p-6 text-white relative overflow-hidden flex flex-col justify-between cursor-pointer group shadow-sm transition-transform duration-300 hover:-translate-y-1 order-last md:order-none min-h-[220px] md:min-h-0"
        :style="{ backgroundColor: bentoItems[1].bg }"
        @click="emit('select', bentoItems[1].name)"
      >
        <div class="flex justify-between items-start z-10">
          <span class="text-[10px] sm:text-xs text-white/90 font-mono font-medium">{{ bentoItems[1].count }}</span>
          <div class="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/25 flex items-center justify-center group-hover:bg-white group-hover:text-[#141E1A] transition-colors">
            <ArrowUpRight :size="14" />
          </div>
        </div>

        <!-- Fluid Fanned 3-Book Cluster (Scales smoothly without clipping) -->
        <div class="relative w-full h-36 sm:h-48 md:h-56 flex items-center justify-center my-auto pointer-events-none">
          <!-- Left Tilted Book -->
          <div class="absolute w-[32%] max-w-[105px] min-w-[60px] aspect-[3/4.2] rounded-md overflow-hidden shadow-xl -translate-x-[40%] sm:-translate-x-[45%] rotate-[-14deg] group-hover:rotate-[-10deg] transition-transform duration-300">
            <img
              src="https://books.google.com/books/content?id=s_4dDAAAQBAJ&printsec=frontcover&img=1&zoom=1"
              alt=""
              class="w-full h-full object-cover"
              referrerpolicy="no-referrer"
            />
          </div>
          <!-- Right Tilted Book -->
          <div class="absolute w-[32%] max-w-[105px] min-w-[60px] aspect-[3/4.2] rounded-md overflow-hidden shadow-xl translate-x-[40%] sm:translate-x-[45%] rotate-[14deg] group-hover:rotate-[10deg] transition-transform duration-300">
            <img
              src="https://books.google.com/books/content?id=P_zMW3EHnTEC&printsec=frontcover&img=1&zoom=1"
              alt=""
              class="w-full h-full object-cover"
              referrerpolicy="no-referrer"
            />
          </div>
          <!-- Dominant Center Book -->
          <div class="absolute w-[36%] max-w-[115px] min-w-[68px] aspect-[3/4.2] rounded-md overflow-hidden shadow-2xl z-10 scale-105 group-hover:scale-110 transition-transform duration-300">
            <img
              src="https://books.google.com/books/content?id=fFCjDQAAQBAJ&printsec=frontcover&img=1&zoom=1"
              alt=""
              class="w-full h-full object-cover"
              referrerpolicy="no-referrer"
            />
          </div>
        </div>

        <h3 class="font-poster text-2xl sm:text-3xl font-bold uppercase tracking-wide z-10 leading-none">
          {{ bentoItems[1].title }}
        </h3>
      </div>

      <!-- Card 3: Fantasy (Top-Right) -->
      <div
        class="rounded-2xl p-4 sm:p-5 text-white relative overflow-hidden flex flex-col justify-between cursor-pointer group shadow-sm transition-transform duration-300 hover:-translate-y-1"
        :style="{ backgroundColor: bentoItems[2].bg }"
        @click="emit('select', bentoItems[2].name)"
      >
        <div class="flex justify-between items-start z-10">
          <span class="text-[10px] sm:text-xs text-white/90 font-mono font-medium">{{ bentoItems[2].count }}</span>
          <div class="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/25 flex items-center justify-center group-hover:bg-white group-hover:text-[#141E1A] transition-colors">
            <ArrowUpRight :size="14" />
          </div>
        </div>
        <h3 class="font-poster text-2xl sm:text-3xl font-bold uppercase tracking-wide z-10 leading-none">
          {{ bentoItems[2].title }}
        </h3>
        
        <!-- Fluid Responsive Corner Book -->
        <div class="absolute -right-2 sm:-right-3 -bottom-3 sm:-bottom-4 w-[36%] max-w-[120px] min-w-[65px] aspect-[3/4.2] rounded-md overflow-hidden shadow-2xl rotate-[-8deg] group-hover:rotate-0 transition-transform duration-300 pointer-events-none">
          <img
            :src="bentoItems[2].cover"
            alt=""
            class="w-full h-full object-cover"
            referrerpolicy="no-referrer"
          />
        </div>
      </div>

      <!-- Card 4: Nonfiction (Bottom-Left) -->
      <div
        class="rounded-2xl p-4 sm:p-5 text-white relative overflow-hidden flex flex-col justify-between cursor-pointer group shadow-sm transition-transform duration-300 hover:-translate-y-1"
        :style="{ backgroundColor: bentoItems[3].bg }"
        @click="emit('select', bentoItems[3].name)"
      >
        <div class="flex justify-between items-start z-10">
          <span class="text-[10px] sm:text-xs text-white/90 font-mono font-medium">{{ bentoItems[3].count }}</span>
          <div class="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/25 flex items-center justify-center group-hover:bg-white group-hover:text-[#141E1A] transition-colors">
            <ArrowUpRight :size="14" />
          </div>
        </div>
        <h3 class="font-poster text-2xl sm:text-3xl font-bold uppercase tracking-wide z-10 leading-none">
          {{ bentoItems[3].title }}
        </h3>
        
        <!-- Fluid Responsive Corner Book -->
        <div class="absolute -right-2 sm:-right-3 -bottom-3 sm:-bottom-4 w-[36%] max-w-[120px] min-w-[65px] aspect-[3/4.2] rounded-md overflow-hidden shadow-2xl rotate-[6deg] group-hover:rotate-0 transition-transform duration-300 pointer-events-none">
          <img
            :src="bentoItems[3].cover"
            alt=""
            class="w-full h-full object-cover"
            referrerpolicy="no-referrer"
          />
        </div>
      </div>

      <!-- Card 5: Romance (Bottom-Right) -->
      <div
        class="rounded-2xl p-4 sm:p-5 text-white relative overflow-hidden flex flex-col justify-between cursor-pointer group shadow-sm transition-transform duration-300 hover:-translate-y-1"
        :style="{ backgroundColor: bentoItems[4].bg }"
        @click="emit('select', bentoItems[4].name)"
      >
        <div class="flex justify-between items-start z-10">
          <span class="text-[10px] sm:text-xs text-white/90 font-mono font-medium">{{ bentoItems[4].count }}</span>
          <div class="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/25 flex items-center justify-center group-hover:bg-white group-hover:text-[#141E1A] transition-colors">
            <ArrowUpRight :size="14" />
          </div>
        </div>
        <h3 class="font-poster text-2xl sm:text-3xl font-bold uppercase tracking-wide z-10 leading-none">
          {{ bentoItems[4].title }}
        </h3>
        
        <!-- Fluid Responsive Corner Book -->
        <div class="absolute -right-2 sm:-right-3 -bottom-3 sm:-bottom-4 w-[36%] max-w-[120px] min-w-[65px] aspect-[3/4.2] rounded-md overflow-hidden shadow-2xl rotate-[-6deg] group-hover:rotate-0 transition-transform duration-300 pointer-events-none">
          <img
            :src="bentoItems[4].cover"
            alt=""
            class="w-full h-full object-cover"
            referrerpolicy="no-referrer"
          />
        </div>
      </div>

    </div>
  </section>
</template>