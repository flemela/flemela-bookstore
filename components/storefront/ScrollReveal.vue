<!-- components/storefront/ScrollReveal.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useIntersectionObserver } from '@vueuse/core';

interface Props {
  delay?: number;
}

const props = withDefaults(defineProps<Props>(), {
  delay: 0,
});

const target = ref<HTMLElement | null>(null);
const isVisible = ref(false);

const { stop } = useIntersectionObserver(
  target,
  ([{ isIntersecting }]) => {
    if (isIntersecting) {
      if (props.delay > 0) {
        setTimeout(() => {
          isVisible.value = true;
        }, props.delay);
      } else {
        isVisible.value = true;
      }
      stop(); // Disconnect immediately: zero scroll-jacking, zero ongoing CPU overhead
    }
  },
  {
    threshold: 0.05,
    rootMargin: '60px 0px',
  }
);

// Fallback safeguard: ensures content is always visible even on legacy browsers
onMounted(() => {
  setTimeout(() => {
    if (!isVisible.value) {
      isVisible.value = true;
      stop();
    }
  }, 1200);
});
</script>

<template>
  <div
    ref="target"
    class="transition-all duration-500 ease-out will-change-[opacity,transform]"
    :class="[
      isVisible
        ? 'opacity-100 translate-y-0'
        : 'opacity-0 translate-y-4 motion-reduce:opacity-100 motion-reduce:translate-y-0'
    ]"
  >
    <slot />
  </div>
</template>