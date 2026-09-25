<!-- components/storefront/HeroNotesPanel.vue -->
<script setup lang="ts">
export interface StoreHeroNotes {
  is_active: boolean;
  title: string;
  content_html: string;
  bg_color?: string;
  text_color?: string;
}

interface Props {
  notes?: StoreHeroNotes | null;
}

const props = withDefaults(defineProps<Props>(), {
  notes: null,
});
</script>

<template>
	<aside v-if="notes && notes.is_active && notes.content_html"
		class="w-full h-full rounded-2xl md:rounded-3xl border border-slate-200/60 shadow-md p-5 sm:p-6 flex flex-col justify-between overflow-hidden transition-all duration-300 relative select-none"
		:style="{
      backgroundColor: notes.bg_color || '#FAF7F0',
      color: notes.text_color || '#141E1A',
    }" aria-label="Editorial Notes & Announcements">
		<!-- Card Header -->
		<div class="flex items-center justify-between pb-3 border-b border-black/10">
			<div class="flex items-center gap-2 min-w-0">
				<span class="w-2 h-2 rounded-full bg-emerald-600 animate-pulse flex-shrink-0" />
				<h3 class="font-display font-bold text-xs sm:text-sm uppercase tracking-wider truncate">
					{{ notes.title || 'Reader Announcements' }}
				</h3>
			</div>
			<span class="text-[9px] font-mono uppercase tracking-widest opacity-60 font-bold flex-shrink-0">
				Notice
			</span>
		</div>

		<!-- Rich Text & Embedded Media Body -->
		<div class="prose prose-sm max-w-none text-xs sm:text-[13px] leading-relaxed py-3 flex-1 overflow-y-auto no-scrollbar"
			v-html="notes.content_html" />

		<!-- Bottom Sign-off Footer -->
		<div class="pt-2.5 border-t border-black/10 flex items-center justify-between text-[10px] font-mono opacity-65">
			<span>The Sunrise Bookstore</span>
			<span>Nairobi Hub</span>
		</div>
	</aside>
</template>

<style scoped>
	.no-scrollbar::-webkit-scrollbar {
		display: none;
	}

	.no-scrollbar {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}

	:deep(a) {
		color: #0C3A2B;
		font-weight: 700;
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	:deep(a:hover) {
		color: #E8750D;
	}

	:deep(iframe) {
		max-width: 100%;
	}
</style>