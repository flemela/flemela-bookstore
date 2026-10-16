<!-- pages/admin/curated.vue -->
<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import {
  Layers,
  Sparkles,
  Search,
  Trash2,
  Palette,
  BookOpen,
  PlusCircle,
  Save,
  RefreshCw,
  CheckCircle2,
} from 'lucide-vue-next';
import AdminLayout from '~/components/admin/AdminLayout.vue';
import { useToast } from '~/composables/useToast';
import type { Book } from '~/types';

definePageMeta({
  middleware: 'admin-auth',
});

const { push: pushToast } = useToast();

interface CuratedSection {
  id: string;
  title: string;
  subtitle: string | null;
  badge_trigger: string;
  bg_color: string;
  countdown_ends_at: string | null;
  is_active: boolean;
  sort_order: number;
}

const { data: sections, refresh: refreshSections, status: sectionsStatus } = await useFetch<CuratedSection[]>('/api/admin/curated-sections');

const selectedSection = ref<CuratedSection | null>(null);

// Books currently on the shelf
const shelfBooks = ref<Book[]>([]);
const isLoadingShelfBooks = ref(false);

// Live search across the entire store catalogue
const catalogSearchQuery = ref('');
const catalogSearchResults = ref<Book[]>([]);
const isSearchingCatalog = ref(false);
let searchDebounceTimer: ReturnType<typeof setTimeout> | undefined;

// Styling controls for active shelf
const editTitle = ref('');
const editBgColor = ref('#052219');
const isSavingStyle = ref(false);

const PRESET_SWATCHES = [
  { name: 'Dark Pine', hex: '#052219' },
  { name: 'Forest Noir', hex: '#0C3A2B' },
  { name: 'Pure White', hex: '#FFFFFF' },
  { name: 'Warm Cream', hex: '#FAF7F0' },
  { name: 'Deep Crimson', hex: '#7F1D1D' },
  { name: 'Studio Black', hex: '#17171C' },
];

function selectSection(section: CuratedSection): void {
  selectedSection.value = section;
  editTitle.value = section.title;
  editBgColor.value = section.bg_color || '#052219';
  catalogSearchQuery.value = '';
  catalogSearchResults.value = [];
  loadShelfBooks(section.badge_trigger);
}

async function loadShelfBooks(badge: string): Promise<void> {
  isLoadingShelfBooks.value = true;
  try {
    const res = await $fetch<any>('/api/admin/books', {
      query: { badge, limit: 50 },
    });
    shelfBooks.value = res?.products || (Array.isArray(res) ? res : []);
  } catch {
    shelfBooks.value = [];
  } finally {
    isLoadingShelfBooks.value = false;
  }
}

// Search the store catalog as the merchant types
watch(catalogSearchQuery, (val) => {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
  const q = val.trim();
  if (!q) {
    catalogSearchResults.value = [];
    return;
  }

  searchDebounceTimer = setTimeout(async () => {
    isSearchingCatalog.value = true;
    try {
      const res = await $fetch<any>('/api/admin/books', {
        query: { q, limit: 10 },
      });
      catalogSearchResults.value = res?.products || (Array.isArray(res) ? res : []);
    } catch {
      catalogSearchResults.value = [];
    } finally {
      isSearchingCatalog.value = false;
    }
  }, 200);
});

async function handleSaveShelfStyle(): Promise<void> {
  if (!selectedSection.value) return;
  const title = editTitle.value.trim();
  if (!title) {
    pushToast({ message: 'Shelf title is required', variant: 'error' });
    return;
  }

  isSavingStyle.value = true;
  try {
    const payload = {
      title,
      bg_color: editBgColor.value || '#052219',
    };

    await $fetch(`/api/admin/curated-sections/${selectedSection.value.id}`, {
      method: 'PATCH',
      body: payload,
    });

    selectedSection.value.title = title;
    selectedSection.value.bg_color = payload.bg_color;

    pushToast({ message: `"${title}" appearance saved!`, variant: 'success' });
    await refreshSections();
  } catch (err: any) {
    pushToast({ message: err.data?.message || 'Failed to save appearance', variant: 'error' });
  } finally {
    isSavingStyle.value = false;
  }
}

async function handleAddBookToShelf(book: Book): Promise<void> {
  if (!selectedSection.value) return;
  const badge = selectedSection.value.badge_trigger;

  try {
    await $fetch('/api/admin/books/bulk-badge', {
      method: 'POST',
      body: {
        productIds: [book.id],
        badge,
      },
    });

    pushToast({ message: `"${book.name}" added to ${selectedSection.value.title}!`, variant: 'success' });
    await loadShelfBooks(badge);
  } catch (err: any) {
    pushToast({ message: err.data?.message || 'Failed to add book', variant: 'error' });
  }
}

async function handleRemoveBookFromShelf(book: Book): Promise<void> {
  if (!selectedSection.value) return;

  try {
    await $fetch('/api/admin/books/bulk-badge', {
      method: 'POST',
      body: {
        productIds: [book.id],
        badge: null,
      },
    });

    pushToast({ message: `"${book.name}" removed from shelf`, variant: 'info' });
    await loadShelfBooks(selectedSection.value.badge_trigger);
  } catch (err: any) {
    pushToast({ message: err.data?.message || 'Failed to remove book', variant: 'error' });
  }
}

// Default standard sections if database has none
const defaultTemplates = [
  { title: 'FLASH SALE DEALS', trigger: 'FLASH_SALE', color: '#052219' },
  { title: 'DEALS OF THE WEEK', trigger: 'DEAL_OF_WEEK', color: '#FFFFFF' },
];

async function initializeDefaultSections(): Promise<void> {
  if (!sections.value || sections.value.length === 0) {
    for (const t of defaultTemplates) {
      try {
        await $fetch('/api/admin/curated-sections', {
          method: 'POST',
          body: {
            title: t.title,
            badge_trigger: t.trigger,
            bg_color: t.color,
            is_active: true,
          },
        });
      } catch {}
    }
    await refreshSections();
  }

  if (sections.value && sections.value.length > 0 && !selectedSection.value) {
    selectSection(sections.value[0]);
  }
}

onMounted(() => {
  initializeDefaultSections();
});

watch(sections, (list) => {
  if (list && list.length > 0 && !selectedSection.value) {
    selectSection(list[0]);
  }
});

function resolveCover(book: Book): string {
  const img = book.images?.[0];
  if (!img) return (book as any).cover_image_url || '/images/book-placeholder.svg';
  if (typeof img === 'string') return img;
  return img.image_url || (book as any).cover_image_url || '/images/book-placeholder.svg';
}
</script>

<template>
	<AdminLayout>
		<div class="space-y-6 max-w-7xl mx-auto">

			<!-- Top Title Bar -->
			<div class="pb-4 border-b border-paper-border flex flex-wrap items-center justify-between gap-4">
				<div>
					<span class="text-[10px] font-mono uppercase tracking-widest text-gold-600 font-bold block">
						Store Merchandising
					</span>
					<h1 class="font-display text-2xl sm:text-3xl font-bold text-forest-950">
						Curated Categories &amp; Shelves
					</h1>
					<p class="text-xs text-ink-muted mt-0.5">
						Set custom headings and background colors, and search the entire store catalog to add or remove
						titles.
					</p>
				</div>

				<button type="button"
					class="px-3.5 py-2 bg-paper-surface border border-paper-border rounded-xl text-forest-950 text-xs font-semibold flex items-center gap-1.5 hover:bg-paper-cream cursor-pointer"
					@click="() => refreshSections()">
					<RefreshCw :size="13" :class="{ 'animate-spin': sectionsStatus === 'pending' }" />
					<span>Refresh</span>
				</button>
			</div>

			<!-- Main Layout: Shelf Controls (Left 4 cols) & Catalog Search/Shelf Books (Right 8 cols) -->
			<div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

				<!-- LEFT: Shelf Picker & Styling (4 cols) -->
				<div class="lg:col-span-4 space-y-5">
					<!-- Shelf Selection Cards -->
					<div class="bg-paper-surface rounded-2xl border border-paper-border p-4 shadow-soft space-y-2">
						<span class="text-[10px] uppercase font-mono font-bold text-ink-subtle px-1 block">
							1. Select Curated Category:
						</span>

						<div class="space-y-1.5">
							<button v-for="section in sections" :key="section.id" type="button"
								class="w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3"
								:class="selectedSection?.id === section.id ? 'border-forest-950 bg-paper-cream shadow-xs ring-1 ring-forest-950' : 'border-paper-border bg-white hover:border-slate-300'"
								@click="selectSection(section)">
								<div class="flex items-center gap-2.5 min-w-0">
									<span class="w-4 h-4 rounded-full border border-black/20 flex-shrink-0"
										:style="{ backgroundColor: section.bg_color || '#052219' }" />
									<div class="min-w-0">
										<strong class="text-xs font-bold text-forest-950 block truncate">{{
											section.title }}</strong>
										<span class="text-[10px] text-ink-muted font-mono uppercase">Badge: {{
											section.badge_trigger }}</span>
									</div>
								</div>

								<span class="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded"
									:class="section.is_active ? 'bg-emerald-100 text-emerald-900' : 'bg-slate-200 text-slate-700'">
									<template v-if="section.is_active">Active</template>
									<template v-else>Off</template>
								</span>
							</button>
						</div>
					</div>

					<!-- Shelf Styling Form -->
					<div v-if="selectedSection"
						class="bg-paper-surface rounded-2xl border border-paper-border p-5 shadow-soft space-y-4">
						<div class="flex items-center justify-between border-b border-paper-border pb-2.5">
							<h3 class="font-display font-bold text-sm text-forest-950">2. Shelf Appearance</h3>
							<span class="text-[10px] font-mono font-bold text-gold-600 uppercase">{{
								selectedSection.badge_trigger }}</span>
						</div>

						<form class="space-y-3.5" @submit.prevent="handleSaveShelfStyle">
							<div class="space-y-1">
								<label class="text-xs font-semibold text-forest-950">Shelf Heading *</label>
								<input v-model="editTitle" type="text" placeholder="e.g. FLASH SALE DEALS"
									class="w-full px-3 py-2 bg-white border border-paper-border rounded-xl text-xs font-bold outline-none focus:border-forest-900"
									required />
							</div>

							<!-- Color Swatches & Picker -->
							<div class="space-y-2 pt-1 border-t border-paper-border">
								<label class="text-xs font-semibold text-forest-950 flex items-center gap-1.5">
									<Palette :size="13" />
									<span>Background Color</span>
								</label>

								<div class="flex flex-wrap gap-1.5">
									<button v-for="color in PRESET_SWATCHES" :key="color.hex" type="button"
										class="w-7 h-7 rounded-lg border transition-transform cursor-pointer shadow-2xs"
										:class="editBgColor === color.hex ? 'scale-110 ring-2 ring-forest-950 border-white' : 'border-black/20 hover:scale-105'"
										:style="{ backgroundColor: color.hex }" :title="color.name"
										@click="editBgColor = color.hex" />
								</div>

								<div class="flex items-center gap-2 pt-1">
									<input v-model="editBgColor" type="color"
										class="w-8 h-8 rounded border border-paper-border cursor-pointer p-0.5" />
									<input v-model="editBgColor" type="text" placeholder="#052219"
										class="flex-1 px-3 py-1.5 bg-white border border-paper-border rounded-xl text-xs font-mono outline-none" />
								</div>
							</div>

							<div class="pt-2">
								<button type="submit"
									class="w-full bg-forest-950 hover:bg-forest-900 text-paper font-bold text-xs uppercase tracking-wider py-2.5 rounded-xl shadow-subtle flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
									:disabled="isSavingStyle">
									<Save :size="13" class="text-gold-300" />
									<span v-if="isSavingStyle">Saving...</span>
									<span v-else>Save Appearance</span>
								</button>
							</div>
						</form>
					</div>
				</div>

				<!-- RIGHT: Live Catalog Search & Books Currently on Shelf (8 cols) -->
				<div v-if="selectedSection" class="lg:col-span-8 space-y-6">

					<!-- SEARCH THE ENTIRE CATALOG -->
					<div class="bg-paper-surface rounded-2xl border border-paper-border p-5 shadow-soft space-y-3">
						<div class="flex items-center justify-between">
							<h3 class="font-display font-bold text-sm text-forest-950 flex items-center gap-2">
								<Search :size="15" class="text-forest-900" />
								<span>Search Entire Catalog to Add Books</span>
							</h3>
							<span class="text-[10px] font-mono text-ink-muted">Live search across all inventory</span>
						</div>

						<div class="relative">
							<Search :size="15" class="absolute left-3.5 top-3 text-ink-subtle pointer-events-none" />
							<input v-model="catalogSearchQuery" type="text"
								placeholder="Search by title, author name, or SKU (e.g. Atomic Habits)..."
								class="w-full pl-10 pr-3.5 py-2.5 bg-paper-canvas border border-paper-border rounded-xl text-xs sm:text-sm outline-none focus:bg-white focus:border-forest-900 transition-all text-forest-950 placeholder:text-ink-subtle" />
						</div>

						<!-- Search Results Dropdown List -->
						<div v-if="catalogSearchQuery.trim()"
							class="border border-paper-border rounded-xl bg-white overflow-hidden shadow-2xs divide-y divide-paper-border/60">
							<div v-if="isSearchingCatalog" class="p-6 text-center text-xs text-ink-muted">
								<RefreshCw :size="16" class="animate-spin mx-auto text-forest-900 mb-1" />
								<span>Searching catalog...</span>
							</div>

							<div v-else-if="!catalogSearchResults.length"
								class="p-6 text-center text-xs text-ink-muted">
								No catalog titles found matching "{{ catalogSearchQuery }}".
							</div>

							<div v-for="book in catalogSearchResults" :key="book.id"
								class="p-3 flex items-center justify-between gap-3 hover:bg-paper-cream/40 transition-colors">
								<div class="flex items-center gap-3 min-w-0 flex-1">
									<img :src="resolveCover(book)"
										class="w-9 h-12 object-cover rounded border border-paper-border flex-shrink-0" />
									<div class="min-w-0 flex-1 space-y-0.5">
										<strong class="text-xs font-bold text-forest-950 block truncate">{{ book.name
											}}</strong>
										<span class="text-[11px] text-ink-muted truncate block">{{ book.author ||
											'Original Edition' }}</span>
										<span class="text-[10px] font-mono text-ink-subtle block">KSh {{ book.price
											}}</span>
									</div>
								</div>

								<!-- Add Button / Status Indicator -->
								<button type="button"
									class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 flex-shrink-0 border shadow-2xs"
									:class="book.badge === selectedSection.badge_trigger ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-300'"
									:disabled="book.badge === selectedSection.badge_trigger"
									@click="handleAddBookToShelf(book)">
									<CheckCircle2 v-if="book.badge === selectedSection.badge_trigger" :size="13" />
									<PlusCircle v-else :size="13" />
									<span v-if="book.badge === selectedSection.badge_trigger">On Shelf</span>
									<span v-else>+ Add to Shelf</span>
								</button>
							</div>
						</div>
					</div>

					<!-- BOOKS CURRENTLY ON THIS SHELF -->
					<div class="bg-paper-surface rounded-2xl border border-paper-border p-5 shadow-soft space-y-4">
						<div class="flex items-center justify-between pb-3 border-b border-paper-border">
							<div>
								<h3 class="font-display font-bold text-sm text-forest-950 flex items-center gap-2">
									<BookOpen :size="16" class="text-forest-900" />
									<span>Books on "{{ selectedSection.title }}" ({{ shelfBooks.length }})</span>
								</h3>
								<p class="text-[11px] text-ink-muted">These titles appear directly in this shelf's
									carousel.</p>
							</div>

							<button type="button"
								class="text-xs font-bold text-forest-900 hover:underline flex items-center gap-1 cursor-pointer"
								@click="loadShelfBooks(selectedSection.badge_trigger)">
								<RefreshCw :size="11" />
								<span>Refresh</span>
							</button>
						</div>

						<!-- Items List -->
						<div v-if="isLoadingShelfBooks" class="p-8 text-center text-xs text-ink-muted">
							Loading shelf books...
						</div>

						<div v-else-if="!shelfBooks.length" class="p-10 text-center text-xs text-ink-muted space-y-2">
							<p>No books are currently assigned to this shelf.</p>
							<span class="text-[11px] text-ink-subtle block">Use the search box above to add titles from
								your catalog.</span>
						</div>

						<div v-else class="divide-y divide-paper-border/60">
							<div v-for="(book, index) in shelfBooks" :key="book.id"
								class="py-3 first:pt-0 flex items-center justify-between gap-3 hover:bg-paper-cream/30 transition-colors rounded-xl px-2">
								<div class="flex items-center gap-3 min-w-0 flex-1">
									<span class="w-5 text-center font-mono font-bold text-xs text-slate-400">
										{{ index + 1 }}
									</span>

									<img :src="resolveCover(book)"
										class="w-10 h-13 object-cover rounded border border-paper-border flex-shrink-0" />

									<div class="min-w-0 flex-1 space-y-0.5">
										<strong class="text-xs font-bold text-forest-950 block truncate">{{ book.name
											}}</strong>
										<span class="text-[11px] text-ink-muted truncate block">{{ book.author ||
											'Original Edition' }}</span>
										<span class="text-[10px] font-mono text-emerald-800 font-bold block">KSh {{
											book.price }}</span>
									</div>
								</div>

								<!-- Remove Button -->
								<button type="button"
									class="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 flex-shrink-0 shadow-2xs"
									title="Remove from this curated shelf" @click="handleRemoveBookFromShelf(book)">
									<Trash2 :size="13" />
									<span>Remove</span>
								</button>
							</div>
						</div>
					</div>

				</div>

			</div>

		</div>
	</AdminLayout>
</template>