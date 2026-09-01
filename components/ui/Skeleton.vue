<!-- components/ui/Skeleton.vue -->
<script setup lang="ts">
interface Props {
  width?: string;
  height?: string;
  radius?: string;
}

withDefaults(defineProps<Props>(), {
  width: '100%',
  height: '16px',
  radius: '6px',
});
</script>

<template>
  <div
    class="animate-pulse bg-slate-200"
    :style="{
      width,
      height,
      borderRadius: radius,
    }"
    aria-hidden="true"
  />
</template>