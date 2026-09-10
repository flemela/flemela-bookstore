<!-- components/storefront/PromoTickerStrip.vue -->
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight } from 'lucide-vue-next';

export interface PromoTickerMessage {
  id: string;
  text: string;
  link?: string | null;
  is_active: boolean;
  sort_order: number;
}

interface Props {
  messages?: PromoTickerMessage[];
}

const props = withDefaults(defineProps<Props>(), {
  messages: () => [],
});

// Built-in resilient store defaults
const fallbackMessages: PromoTickerMessage[] = [
  {
    id: 'default-1',
    text: 'FREE DELIVERY across Nairobi on orders above KSh 2,500',
    link: '#catalog-results',
    is_active: true,
    sort_order: 0,
  },
  {
    id: 'default-2',
    text: '⚡ Instant Cloudflare R2 Digital Downloads on all eBook editions',
    link: '#flash-sale',
    is_active: true,
    sort_order: 1,
  },
  {
    id: 'default-3',
    text: '🇰🇪 Need a hard-to-find title? Sourcing Any Book in Kenya via WhatsApp',
    link: 'https://wa.me/254143304460',
    is_active: true,
    sort_order: 2,
  },
];

const activeMessages = computed(() => {
  const filtered = props.messages.filter((m) => m.is_active && m.text && m.text.trim());
  if (filtered.length > 0) {
    return filtered.sort((a, b) => a.sort_order - b.sort_order);
  }
  return fallbackMessages;
});

const activeIndex = ref(0);
const isPaused = ref(false);
let rotationTimer: ReturnType<typeof setInterval> | undefined;

function nextMessage(): void {
  if (activeMessages.value.length <= 1) return;
  activeIndex.value = (activeIndex.value + 1) % activeMessages.value.length;
}

function prevMessage(): void {
  if (activeMessages.value.length <= 1) return;
  activeIndex.value = (activeIndex.value - 1 + activeMessages.value.length) % activeMessages.value.length;
}

function startTimer(): void {
  stopTimer();
  if (activeMessages.value.length > 1 && !isPaused.value) {
    rotationTimer = setInterval(nextMessage, 4500);
  }
}

function stopTimer(): void {
  if (rotationTimer) {
    clearInterval(rotationTimer);
    rotationTimer = undefined;
  }
}

function handleMouseEnter(): void {
  isPaused.value = true;
  stopTimer();
}

function handleMouseLeave(): void {
  isPaused.value = false;
  startTimer();
}

// Mobile swipe support
const touchStartX = ref(0);

function handleTouchStart(e: TouchEvent): void {
  touchStartX.value = e.touches[0].clientX;
  stopTimer();
}

function handleTouchEnd(e: TouchEvent): void {
  const diff = e.changedTouches[0].clientX - touchStartX.value;
  if (diff > 45) {
    prevMessage();
  } else if (diff < -45) {
    nextMessage();
  }
  startTimer();
}

function handleMessageClick(msg: PromoTickerMessage): void {
  if (!msg.link) return;
  if (msg.link.startsWith('http')) {
    window.open(msg.link, '_blank', 'noopener,noreferrer');
  } else if (msg.link.startsWith('#')) {
    const target = document.querySelector(msg.link);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  } else {
    navigateTo(msg.link);
  }
}

onMounted(() => {
  if (process.client && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    startTimer();
  }
});

onUnmounted(() => {
  stopTimer();
});
</script>

<template>
  <div
    class="relative w-full overflow-hidden select-none border-y border-[#916515] shadow-sm transition-all duration-300 z-20"
    :style="{
      background: 'linear-gradient(135deg, #BF953F 0%, #FCF6BA 25%, #B38728 50%, #FBF5B7 75%, #AA771C 100%)',
    }"
    aria-label="Promotional announcements"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @touchstart.passive="handleTouchStart"
    @touchend="handleTouchEnd"
  >
    <!-- Soft Metallic Gleam Highlight Layer -->
    <div
      class="absolute inset-0 bg-gradient-to-b from-white/35 via-transparent to-black/10 pointer-events-none"
    />

    <div class="max-w-6xl mx-auto px-4 sm:px-6 h-10 sm:h-11 flex items-center justify-between gap-3 relative z-10">
      <!-- Left Manual Chevron Button -->
      <button
        v-if="activeMessages.length > 1"
        type="button"
        class="w-6 h-6 rounded-full bg-[#052219]/10 hover:bg-[#052219] hover:text-[#FCF6BA] text-[#052219] flex items-center justify-center transition-all cursor-pointer flex-shrink-0 active:scale-95"
        aria-label="Previous announcement"
        @click="prevMessage"
      >
        <ChevronLeft :size="14" />
      </button>

      <!-- Center Rotating Announcement Message -->
      <div class="flex-1 min-w-0 text-center overflow-hidden py-1">
        <Transition name="ticker-slide" mode="out-in">
          <div
            :key="activeMessages[activeIndex]?.id"
            class="inline-flex items-center justify-center gap-2 cursor-pointer group px-2 max-w-full"
            @click="handleMessageClick(activeMessages[activeIndex])"
          >
            <!-- Left Gleam Icon -->
            <Sparkles :size="13" class="text-[#052219] flex-shrink-0 animate-pulse" />

            <!-- Text Content: Deep Pine High-Contrast on True Gold -->
            <span class="font-sans font-extrabold text-[11px] sm:text-xs tracking-wide text-[#052219] truncate drop-shadow-[0_1px_0_rgba(255,255,255,0.4)]">
              {{ activeMessages[activeIndex]?.text }}
            </span>

            <!-- Action Affordance (If message is linked) -->
            <span
              v-if="activeMessages[activeIndex]?.link"
              class="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-mono font-extrabold uppercase text-[#052219] underline underline-offset-2 ml-1 opacity-80 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all"
            >
              <span>Explore</span>
              <ArrowRight :size="11" />
            </span>
          </div>
        </Transition>
      </div>

      <!-- Right Manual Chevron Button & Pagination Pill -->
      <div class="flex items-center gap-2 flex-shrink-0">
        <span
          v-if="activeMessages.length > 1"
          class="hidden md:inline-block font-mono font-bold text-[9px] text-[#052219]/80 bg-[#052219]/10 px-1.5 py-0.5 rounded"
        >
          {{ activeIndex + 1 }}/{{ activeMessages.length }}
        </span>

        <button
          v-if="activeMessages.length > 1"
          type="button"
          class="w-6 h-6 rounded-full bg-[#052219]/10 hover:bg-[#052219] hover:text-[#FCF6BA] text-[#052219] flex items-center justify-center transition-all cursor-pointer flex-shrink-0 active:scale-95"
          aria-label="Next announcement"
          @click="nextMessage"
        >
          <ChevronRight :size="14" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ticker-slide-enter-active,
.ticker-slide-leave-active {
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}
.ticker-slide-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.ticker-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>