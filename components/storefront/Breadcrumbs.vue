<!-- components/storefront/Breadcrumbs.vue -->
<script setup lang="ts">
import { ChevronRight } from 'lucide-vue-next';

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

interface Props {
  items: BreadcrumbItem[];
}

defineProps<Props>();
</script>

<template>
	<nav v-if="items && items.length > 0" aria-label="Breadcrumb" class="w-full py-2.5 select-none font-sans">
		<ol class="flex items-center flex-wrap gap-1 text-[11.5px] sm:text-xs text-[#5F6964]">
			<li v-for="(item, idx) in items" :key="idx" class="inline-flex items-center gap-1 min-w-0">
				<NuxtLink v-if="item.to && idx < items.length - 1" :to="item.to"
					class="hover:text-[#E8750D] transition-colors truncate max-w-[130px] sm:max-w-[200px]">
					{{ item.label }}
				</NuxtLink>

				<span v-else class="font-semibold text-[#141E1A] truncate max-w-[180px] sm:max-w-[280px]"
					aria-current="page">
					{{ item.label }}
				</span>

				<ChevronRight v-if="idx < items.length - 1" :size="12" class="text-slate-400 flex-shrink-0 mx-0.5"
					aria-hidden="true" />
			</li>
		</ol>
	</nav>
</template>