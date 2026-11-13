<!-- components/storefront/HeroRightBanner.vue -->
<script setup lang="ts">
// Right flank promotional poster — same behaving twin of the left flank banner.
// Configurable via /admin/banners (Right Flank tab).
import HeroLeftBanner, { type StoreHeroLeftBanner } from './HeroLeftBanner.vue';

export interface StoreHeroRightBanner extends StoreHeroLeftBanner {}

interface Props {
  banner?: StoreHeroRightBanner | null;
}

withDefaults(defineProps<Props>(), {
  banner: null,
});
</script>

<template>
  <HeroLeftBanner :banner="banner ?? null" />
</template>
