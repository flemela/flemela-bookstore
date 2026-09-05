<!-- components/storefront/BentoCategories.vue -->
<script setup lang="ts">
import { ArrowUpRight } from 'lucide-vue-next';

const emit = defineEmits<{
  select: [category: string];
}>();

const bentoItems = [
  {
    name: 'Fiction & Literature',
    title: 'FICTION',
    count: '234 Books',
    bg: '#2A805A',
    cover: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80',
  },
  {
    name: 'Psychology & Self-Help',
    title: 'THRILLER',
    count: '189 Books',
    bg: '#E5A636',
  },
  {
    name: 'Christian Books',
    title: 'FANTASY',
    count: '142 Books',
    bg: '#189CB0',
    cover: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&auto=format&fit=crop&q=80',
  },
  {
    name: 'Education & Textbooks',
    title: 'NONFICTION',
    count: '156 Books',
    bg: '#EE5335',
    cover: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400&auto=format&fit=crop&q=80',
  },
  {
    name: 'Business & Finance',
    title: 'ROMANCE',
    count: '210 Books',
    bg: '#7A62B3',
    cover: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&auto=format&fit=crop&q=80',
  },
];
</script>

<template>
  <section id="categories-bento" class="py-12 sm:py-16 px-4 max-w-6xl mx-auto space-y-7 select-none overflow-hidden">
    <!-- Header -->
    <div class="text-center space-y-1">
      <span class="text-[10px] sm:text-[11px] font-mono uppercase font-bold tracking-widest text-[#EE5335] block">
        BOOK CATEGORIES
      </span>
      <h2 class="font-poster text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#141E1A] tracking-wide uppercase leading-none">
        WHAT KIND OF STORY ARE YOU CRAVING TODAY?
      </h2>
    </div>

    <!-- Bento Grid -->
    <div class="grid grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-4 auto-rows-[160px] sm:auto-rows-[190px]">
      
      <!-- Card 1: Fiction -->
      <div
        class="rounded-2xl p-4 sm:p-5 text-white relative overflow-hidden flex flex-col justify-between cursor-pointer group shadow-sm transition-transform duration-300 hover:-translate-y-1"
        :style="{ backgroundColor: bentoItems[0].bg }"
        @click="emit('select', bentoItems[0].name)"
      >
        <!-- Atmospheric Depth Overlay -->
        <div class="absolute inset-0 bg-gradient-to-br from-black/10 via-transparent to-black/40 pointer-events-none z-0" />

        <div class="flex justify-between items-start z-10">
          <span class="text-[10px] sm:text-xs text-white/90 font-mono">{{ bentoItems[0].count }}</span>
          <div class="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center group-hover:bg-white group-hover:text-[#141E1A] transition-colors">
            <ArrowUpRight :size="14" />
          </div>
        </div>
        <h3 class="font-poster text-2xl sm:text-3xl font-bold uppercase tracking-wide z-10">{{ bentoItems[0].title }}</h3>
        
        <!-- Book with Soft Shadow & Vignette Mask -->
        <div class="absolute -right-2 -bottom-3 w-[38%] max-w-[115px] min-w-[65px] aspect-[1/1.45] rounded-md overflow-hidden shadow-2xl rotate-[10deg] group-hover:rotate-6 transition-transform duration-300 z-1 pointer-events-none border border-white/20">
          <img :src="bentoItems[0].cover" alt="" class="w-full h-full object-cover" />
          <div class="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>
      </div>

      <!-- Card 2: Center Tall Card (Thriller Cluster) -->
      <div
        class="col-span-2 md:col-span-1 md:row-span-2 rounded-2xl p-5 sm:p-6 text-white relative overflow-hidden flex flex-col justify-between cursor-pointer group shadow-sm transition-transform duration-300 hover:-translate-y-1 order-last md:order-none min-h-[220px] md:min-h-0"
        :style="{ backgroundColor: bentoItems[1].bg }"
        @click="emit('select', bentoItems[1].name)"
      >
        <!-- Atmospheric Center Overlay -->
        <div class="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-black/35 pointer-events-none z-0" />

        <div class="flex justify-between items-start z-10">
          <span class="text-[10px] sm:text-xs text-white/90 font-mono">{{ bentoItems[1].count }}</span>
          <div class="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center group-hover:bg-white group-hover:text-[#141E1A] transition-colors">
            <ArrowUpRight :size="14" />
          </div>
        </div>

        <!-- Fanned Cluster with Shading & Vignettes -->
        <div class="relative w-full h-36 sm:h-48 md:h-56 flex items-center justify-center my-auto pointer-events-none z-1">
          <div class="absolute w-[32%] max-w-[105px] min-w-[60px] aspect-[1/1.45] rounded-md overflow-hidden shadow-xl -translate-x-[42%] rotate-[-14deg] border border-white/20">
            <img src="https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&auto=format&fit=crop&q=80" alt="" class="w-full h-full object-cover" />
            <div class="absolute inset-0 bg-black/25" />
          </div>
          <div class="absolute w-[32%] max-w-[105px] min-w-[60px] aspect-[1/1.45] rounded-md overflow-hidden shadow-xl translate-x-[42%] rotate-[14deg] border border-white/20">
            <img src="https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&auto=format&fit=crop&q=80" alt="" class="w-full h-full object-cover" />
            <div class="absolute inset-0 bg-black/25" />
          </div>
          <div class="absolute w-[36%] max-w-[115px] min-w-[68px] aspect-[1/1.45] rounded-md overflow-hidden shadow-2xl z-10 scale-105 group-hover:scale-110 transition-transform duration-300 border border-white/30">
            <img src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&auto=format&fit=crop&q=80" alt="" class="w-full h-full object-cover" />
            <div class="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
          </div>
        </div>

        <h3 class="font-poster text-2xl sm:text-3xl font-bold uppercase tracking-wide z-10 leading-none">
          {{ bentoItems[1].title }}
        </h3>
      </div>

      <!-- Card 3: Fantasy -->
      <div
        class="rounded-2xl p-4 sm:p-5 text-white relative overflow-hidden flex flex-col justify-between cursor-pointer group shadow-sm transition-transform duration-300 hover:-translate-y-1"
        :style="{ backgroundColor: bentoItems[2].bg }"
        @click="emit('select', bentoItems[2].name)"
      >
        <div class="absolute inset-0 bg-gradient-to-br from-black/10 via-transparent to-black/40 pointer-events-none z-0" />
        <div class="flex justify-between items-start z-10">
          <span class="text-[10px] sm:text-xs text-white/90 font-mono">{{ bentoItems[2].count }}</span>
          <div class="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center group-hover:bg-white group-hover:text-[#141E1A] transition-colors">
            <ArrowUpRight :size="14" />
          </div>
        </div>
        <h3 class="font-poster text-2xl sm:text-3xl font-bold uppercase tracking-wide z-10">{{ bentoItems[2].title }}</h3>
        
        <div class="absolute -right-2 -bottom-3 w-[38%] max-w-[115px] min-w-[65px] aspect-[1/1.45] rounded-md overflow-hidden shadow-2xl rotate-[-8deg] group-hover:rotate-0 transition-transform duration-300 z-1 pointer-events-none border border-white/20">
          <img :src="bentoItems[2].cover" alt="" class="w-full h-full object-cover" />
          <div class="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>
      </div>

      <!-- Card 4: Nonfiction -->
      <div
        class="rounded-2xl p-4 sm:p-5 text-white relative overflow-hidden flex flex-col justify-between cursor-pointer group shadow-sm transition-transform duration-300 hover:-translate-y-1"
        :style="{ backgroundColor: bentoItems[3].bg }"
        @click="emit('select', bentoItems[3].name)"
      >
        <div class="absolute inset-0 bg-gradient-to-br from-black/10 via-transparent to-black/40 pointer-events-none z-0" />
        <div class="flex justify-between items-start z-10">
          <span class="text-[10px] sm:text-xs text-white/90 font-mono">{{ bentoItems[3].count }}</span>
          <div class="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center group-hover:bg-white group-hover:text-[#141E1A] transition-colors">
            <ArrowUpRight :size="14" />
          </div>
        </div>
        <h3 class="font-poster text-2xl sm:text-3xl font-bold uppercase tracking-wide z-10">{{ bentoItems[3].title }}</h3>
        
        <div class="absolute -right-2 -bottom-3 w-[38%] max-w-[115px] min-w-[65px] aspect-[1/1.45] rounded-md overflow-hidden shadow-2xl rotate-[6deg] group-hover:rotate-0 transition-transform duration-300 z-1 pointer-events-none border border-white/20">
          <img :src="bentoItems[3].cover" alt="" class="w-full h-full object-cover" />
          <div class="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>
      </div>

      <!-- Card 5: Romance -->
      <div
        class="rounded-2xl p-4 sm:p-5 text-white relative overflow-hidden flex flex-col justify-between cursor-pointer group shadow-sm transition-transform duration-300 hover:-translate-y-1"
        :style="{ backgroundColor: bentoItems[4].bg }"
        @click="emit('select', bentoItems[4].name)"
      >
        <div class="absolute inset-0 bg-gradient-to-br from-black/10 via-transparent to-black/40 pointer-events-none z-0" />
        <div class="flex justify-between items-start z-10">
          <span class="text-[10px] sm:text-xs text-white/90 font-mono">{{ bentoItems[4].count }}</span>
          <div class="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center group-hover:bg-white group-hover:text-[#141E1A] transition-colors">
            <ArrowUpRight :size="14" />
          </div>
        </div>
        <h3 class="font-poster text-2xl sm:text-3xl font-bold uppercase tracking-wide z-10">{{ bentoItems[4].title }}</h3>
        
        <div class="absolute -right-2 -bottom-3 w-[38%] max-w-[115px] min-w-[65px] aspect-[1/1.45] rounded-md overflow-hidden shadow-2xl rotate-[-6deg] group-hover:rotate-0 transition-transform duration-300 z-1 pointer-events-none border border-white/20">
          <img :src="bentoItems[4].cover" alt="" class="w-full h-full object-cover" />
          <div class="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>
      </div>

    </div>
  </section>
</template>