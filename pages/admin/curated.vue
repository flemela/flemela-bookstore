<!-- pages/admin/curated.vue -->
<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import {
  Search,
  Trash2,
  Palette,
  BookOpen,
  PlusCircle,
  Save,
  RefreshCw,
  CheckCircle2,
  Zap,
  Tag,
  X,
} from 'lucide-vue-next';
import AdminLayout from '~/components/admin/AdminLayout.vue';
import { useToast } from '~/composables/useToast';
import type { Book } from '~/types';

definePageMeta({
  middleware: 'admin-auth',
});

const { push: pushToast } = useToast();

type ShelfKey = 'FLASH_SALE' | 'DEAL_OF_WEEK';

interface CuratedShelfConfig {
  id?: string;
  badge_trigger: ShelfKey;
  title: string;
  bg_color: string;
  is_active: boolean;
}

const SHELF_DEFINITIONS: Record<ShelfKey, { defaultTitle: string; defaultColor: string; subtitle: string }> = {
  FLASH_SALE: {
    defaultTitle: 'FLASH SALE DEALS',
    defaultColor: '#052219',
    subtitle: 'High-urgency promotional deals with countdown timer and red discount medallion.',
  },
  DEAL_OF_WEEK: {
    defaultTitle: 'DEALS OF THE WEEK',
    defaultColor: '#FFFFFF',
    subtitle: 'Weekly handpicked feature titles displayed prominently below the bento categories.',
  },
};

const activeTab = ref<ShelfKey>('FLASH_SALE');

const shelfConfigs = ref<Record<ShelfKey, CuratedShelfConfig>>({
  FLASH_SALE: {
    badge_trigger: 'FLASH_SALE',
    title: SHELF_DEFINITIONS.FLASH_SALE.defaultTitle,
    bg_color: SHELF_DEFINITIONS.FLASH_SALE.defaultColor,
    is_active: true,
  },
  DEAL_OF_WEEK: {
    badge_trigger: 'DEAL_OF_WEEK',
    title: SHELF_DEFINITIONS.DEAL_OF_WEEK.defaultTitle,
    bg_color: SHELF_DEFINITIONS.DEAL_OF_WEEK.defaultColor,
    is_active: true,
  },
});

const currentConfig = computed(() => shelfConfigs.value[activeTab.value]);

function isDarkColor(hex?: string | null): boolean {
  if (!hex || !hex.startsWith('#')) return false;
  const clean = hex.replace('#', '');
  if (clean.length !== 6 && clean.length !== 3) return false;
  const fullHex = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const r = parseInt(fullHex.slice(0, 2), 16);
  const g = parseInt(fullHex.slice(2, 4), 16);
  const b = parseInt(fullHex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.55;
}

const isCurrentBgDark = computed(() => isDarkColor(currentConfig.value.bg_color));

const contrastPreviewText = computed(() => {
  return isCurrentBgDark.value
    ? 'Text Mode: Crisp Pure White (#FFFFFF)'
    : 'Text Mode: Deep Rich Ink (#141E1A)';
});

const PRESET_SWATCHES = [
  { name: 'Dark Pine', hex: '#052219' },
  { name: 'Deep Forest', hex: '#0C3A2B' },
  { name: 'Pure White', hex: '#FFFFFF' },
  { name: 'Warm Cream', hex: '#FAF7F0' },
  { name: 'Deep Crimson', hex: '#7F1D1D' },
  { name: 'Studio Black', hex: '#17171C' },
];

// Assigned books state
const assignedBooks = ref<Book[]>([]);
const isLoadingAssigned = ref(false);

const flashSaleTabSubtitle = computed(() => {
  return activeTab.value === 'FLASH_SALE'
    ? `${assignedBooks.value.length} book(s) assigned`
    : 'Badge: FLASH_SALE';
});

const dealOfWeekTabSubtitle = computed(() => {
  return activeTab.value === 'DEAL_OF_WEEK'
    ? `${assignedBooks.value.length} book(s) assigned`
    : 'Badge: DEAL_OF_WEEK';
});

// Reactive Set of assigned book IDs — single source of truth for shelf membership
const assignedBookIdSet = computed(() => new Set(assignedBooks.value.map((b) => b.id)));

function isBookOnShelf(bookId: string): boolean {
  return assignedBookIdSet.value.has(bookId);
}

// Live catalog search state
const catalogQuery = ref('');
const searchResults = ref<Book[]>([]);
const isSearching = ref(false);
let searchDebounce: ReturnType<typeof setTimeout> | undefined;

const isSaving = ref(false);

function getBookAuthor(book: Book): string {
  return book.author?.trim() || 'Original Edition';
}

function resolveCover(book: Book): string {
  const img = book.images?.[0];
  if (!img) return (book as any).cover_image_url || '/images/book-placeholder.svg';
  if (typeof img === 'string') return img;
  return img.image_url || (book as any).cover_image_url || '/images/book-placeholder.svg';
}

async function loadRemoteSections(): Promise<void> {
  try {
    const remote = await $fetch<any[]>('/api/admin/curated-sections');
    if (Array.isArray(remote)) {
      for (const item of remote) {
        const trigger = (item.badge_trigger || '').toUpperCase() as ShelfKey;
        if (trigger === 'FLASH_SALE' || trigger === 'DEAL_OF_WEEK') {
          shelfConfigs.value[trigger] = {
            id: item.id,
            badge_trigger: trigger,
            title: item.title || SHELF_DEFINITIONS[trigger].defaultTitle,
            bg_color: item.bg_color || SHELF_DEFINITIONS[trigger].defaultColor,
            is_active: item.is_active ?? true,
          };
        }
      }
    }
  } catch {
    // Falls back gracefully
  }
}

async function loadAssignedBooks(): Promise<void> {
  isLoadingAssigned.value = true;
  try {
    const res = await $fetch<any>('/api/admin/books', {
      query: { badge: activeTab.value, limit: 50 },
    });
    assignedBooks.value = res?.products || (Array.isArray(res) ? res : []);
  } catch {
    assignedBooks.value = [];
  } finally {
    isLoadingAssigned.value = false;
  }
}

watch(catalogQuery, (val) => {
  if (searchDebounce) clearTimeout(searchDebounce);
  const q = val.trim();
  if (!q) {
    searchResults.value = [];
    return;
  }

  searchDebounce = setTimeout(async () => {
    isSearching.value = true;
    try {
      const res = await $fetch<any>('/api/admin/books', {
        query: { q, limit: 12 },
      });
      searchResults.value = res?.products || (Array.isArray(res) ? res : []);
    } catch {
      searchResults.value = [];
    } finally {
      isSearching.value = false;
    }
  }, 220);
});

watch(activeTab, () => {
  catalogQuery.value = '';
  searchResults.value = [];
  loadAssignedBooks();
});

async function handleSaveSettings(): Promise<void> {
  const cfg = currentConfig.value;
  if (!cfg.title.trim()) {
    pushToast({ message: 'Shelf title is required', variant: 'error' });
    return;
  }

  isSaving.value = true;
  try {
    if (cfg.id) {
      await $fetch(`/api/admin/curated-sections/${cfg.id}`, {
        method: 'PATCH',
        body: {
          title: cfg.title.trim(),
          bg_color: cfg.bg_color || '#052219',
          is_active: cfg.is_active,
        },
      });
    } else {
      const created = await $fetch<any>('/api/admin/curated-sections', {
        method: 'POST',
        body: {
          title: cfg.title.trim(),
          badge_trigger: cfg.badge_trigger,
          bg_color: cfg.bg_color || '#052219',
          is_active: cfg.is_active,
        },
      });
      cfg.id = created?.id;
    }

    pushToast({ message: `"${cfg.title}" settings saved!`, variant: 'success' });
  } catch (err: any) {
    pushToast({ message: err.data?.message || 'Failed to save shelf settings', variant: 'error' });
  } finally {
    isSaving.value = false;
  }
}

// Optimistic Add with Rollback Safety
async function handleAddBook(book: Book): Promise<void> {
  if (isBookOnShelf(book.id)) return;

  assignedBooks.value = [book, ...assignedBooks.value];

  try {
    await $fetch('/api/admin/books/bulk-badge', {
      method: 'POST',
      body: {
        productIds: [book.id],
        badge: activeTab.value,
      },
    });

    pushToast({ message: `"${book.name}" added to ${currentConfig.value.title}!`, variant: 'success' });
  } catch (err: any) {
    assignedBooks.value = assignedBooks.value.filter((b) => b.id !== book.id);
    pushToast({ message: err.data?.message || 'Failed to add book to shelf', variant: 'error' });
  }
}

// Optimistic Removal with Rollback Safety
async function handleRemoveBook(book: Book): Promise<void> {
  const previousList = [...assignedBooks.value];

  assignedBooks.value = assignedBooks.value.filter((b) => b.id !== book.id);

  try {
    await $fetch('/api/admin/books/bulk-badge', {
      method: 'POST',
      body: {
        productIds: [book.id],
        badge: null,
      },
    });

    pushToast({ message: `"${book.name}" removed from shelf`, variant: 'info' });
  } catch (err: any) {
    assignedBooks.value = previousList;
    pushToast({ message: err.data?.message || 'Failed to remove book from shelf', variant: 'error' });
  }
}

onMounted(async () => {
  await loadRemoteSections();
  await loadAssignedBooks();
});
</script>

<template>
	<AdminLayout>
		<div class="space-y-6 max-w-7xl mx-auto font-sans">

			<!-- Top Title Bar -->
			<div class="pb-4 border-b border-paper-border flex flex-wrap items-center justify-between gap-4">
				<div>
					<span class="text-[10px] font-mono uppercase tracking-widest text-gold-600 font-bold block">
						Store Merchandising
					</span>
					<h1 class="font-display text-2xl sm:text-3xl font-bold text-forest-950">
						Curated Shelves &amp; Promotions
					</h1>
					<p class="text-xs text-ink-muted mt-0.5">
						Manage your Flash Sale and Deals of the Week strips. Add or remove titles from your catalog.
					</p>
				</div>

				<button type="button"
					class="px-3.5 py-2 bg-paper-surface border border-paper-border rounded-xl text-forest-950 text-xs font-semibold flex items-center gap-1.5 hover:bg-paper-cream cursor-pointer shadow-2xs"
					@click="() => { loadRemoteSections(); loadAssignedBooks(); }">
					<RefreshCw :size="13" />
					<span>Refresh</span>
				</button>
			</div>

			<!-- Apple-Style 2-Shelf Segmented Selector -->
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5 select-none">
				<!-- Tab 1: Flash Sale -->
				<button type="button"
					class="p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 shadow-2xs"
					:class="activeTab === 'FLASH_SALE'
            ? 'border-forest-950 bg-paper-cream ring-2 ring-forest-950/20 shadow-soft'
            : 'border-paper-border bg-white hover:border-slate-300'" @click="activeTab = 'FLASH_SALE'">
					<div class="flex items-center gap-3 min-w-0">
						<div
							class="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center flex-shrink-0">
							<Zap :size="20" class="fill-current" />
						</div>
						<div class="min-w-0">
							<strong class="text-sm font-bold text-forest-950 block truncate">
								{{ shelfConfigs.FLASH_SALE.title }}
							</strong>
							<span class="text-[11px] text-ink-muted">
								{{ flashSaleTabSubtitle }}
							</span>
						</div>
					</div>

					<span class="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full"
						:class="shelfConfigs.FLASH_SALE.is_active ? 'bg-emerald-100 text-emerald-900' : 'bg-slate-200 text-slate-700'">
						{{ shelfConfigs.FLASH_SALE.is_active ? 'Active' : 'Hidden' }}
					</span>
				</button>

				<!-- Tab 2: Deals of the Week -->
				<button type="button"
					class="p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 shadow-2xs"
					:class="activeTab === 'DEAL_OF_WEEK'
            ? 'border-forest-950 bg-paper-cream ring-2 ring-forest-950/20 shadow-soft'
            : 'border-paper-border bg-white hover:border-slate-300'" @click="activeTab = 'DEAL_OF_WEEK'">
					<div class="flex items-center gap-3 min-w-0">
						<div
							class="w-10 h-10 rounded-xl bg-amber-100 text-gold-600 flex items-center justify-center flex-shrink-0">
							<Tag :size="20" />
						</div>
						<div class="min-w-0">
							<strong class="text-sm font-bold text-forest-950 block truncate">
								{{ shelfConfigs.DEAL_OF_WEEK.title }}
							</strong>
							<span class="text-[11px] text-ink-muted">
								{{ dealOfWeekTabSubtitle }}
							</span>
						</div>
					</div>

					<span class="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full"
						:class="shelfConfigs.DEAL_OF_WEEK.is_active ? 'bg-emerald-100 text-emerald-900' : 'bg-slate-200 text-slate-700'">
						{{ shelfConfigs.DEAL_OF_WEEK.is_active ? 'Active' : 'Hidden' }}
					</span>
				</button>
			</div>

			<!-- Main Workspace -->
			<div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

				<!-- LEFT: Appearance & Contrast Controls (4 cols) -->
				<div
					class="lg:col-span-4 bg-paper-surface rounded-2xl border border-paper-border p-5 sm:p-6 shadow-soft space-y-5">
					<div class="border-b border-paper-border pb-3 flex items-center justify-between">
						<h3 class="font-display font-bold text-sm text-forest-950">
							Shelf Appearance &amp; Contrast
						</h3>
						<span class="text-[10px] font-mono font-bold uppercase text-gold-600">
							{{ currentConfig.badge_trigger }}
						</span>
					</div>

					<form class="space-y-4" @submit.prevent="handleSaveSettings">
						<div class="space-y-1">
							<label class="text-xs font-semibold text-forest-950">Section Headline *</label>
							<input v-model="currentConfig.title" type="text"
								class="w-full px-3.5 py-2.5 bg-white border border-paper-border rounded-xl text-xs sm:text-sm font-bold outline-none focus:border-forest-900"
								required />
						</div>

						<!-- Background Color Palette -->
						<div class="space-y-2 pt-2 border-t border-paper-border">
							<label class="text-xs font-semibold text-forest-950 flex items-center gap-1.5">
								<Palette :size="13" class="text-forest-900" />
								<span>Background Color</span>
							</label>

							<div class="flex flex-wrap gap-2">
								<button v-for="color in PRESET_SWATCHES" :key="color.hex" type="button"
									class="w-8 h-8 rounded-xl border transition-transform cursor-pointer shadow-2xs"
									:class="currentConfig.bg_color === color.hex ? 'scale-110 ring-2 ring-forest-950 border-white' : 'border-black/15 hover:scale-105'"
									:style="{ backgroundColor: color.hex }" :title="color.name"
									@click="currentConfig.bg_color = color.hex" />
							</div>

							<div class="flex items-center gap-2 pt-1">
								<input v-model="currentConfig.bg_color" type="color"
									class="w-9 h-9 rounded-lg border border-paper-border cursor-pointer p-0.5" />
								<input v-model="currentConfig.bg_color" type="text"
									class="flex-1 px-3 py-1.5 bg-white border border-paper-border rounded-xl text-xs font-mono outline-none" />
							</div>
						</div>

						<!-- Real-Time Contrast Simulation Card -->
						<div class="space-y-1.5 pt-2 border-t border-paper-border">
							<span class="text-[10px] font-mono font-bold uppercase text-ink-subtle block">
								Automatic Contrast Preview
							</span>
							<div class="p-3.5 rounded-xl border shadow-2xs transition-colors space-y-1 text-center"
								:style="{ backgroundColor: currentConfig.bg_color }"
								:class="isCurrentBgDark ? 'border-white/20 text-white' : 'border-slate-300 text-[#141E1A]'">
								<span class="text-xs font-extrabold uppercase font-poster tracking-wide block">
									{{ currentConfig.title }}
								</span>
								<span class="text-[10px] opacity-75 font-mono block">
									{{ contrastPreviewText }}
								</span>
							</div>
						</div>

						<!-- Storefront Visibility Toggle -->
						<div class="pt-2 border-t border-paper-border flex items-center justify-between">
							<div>
								<span class="text-xs font-semibold text-forest-950 block">Visibility on Store</span>
								<span class="text-[10px] text-ink-muted">Toggle shelf display on storefront</span>
							</div>
							<label class="flex items-center gap-1.5 cursor-pointer text-xs font-bold select-none">
								<input v-model="currentConfig.is_active" type="checkbox"
									class="rounded border-paper-border text-forest-950" />
								<span :class="currentConfig.is_active ? 'text-emerald-700' : 'text-slate-400'">
									{{ currentConfig.is_active ? 'Visible' : 'Hidden' }}
								</span>
							</label>
						</div>

						<button type="submit"
							class="w-full bg-forest-950 hover:bg-forest-900 text-paper font-bold text-xs uppercase tracking-wider py-3 rounded-xl shadow-subtle flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all active:scale-[0.98]"
							:disabled="isSaving">
							<Save :size="13" class="text-gold-300" />
							<span>{{ isSaving ? 'Saving...' : 'Save Shelf Settings' }}</span>
						</button>
					</form>
				</div>

				<!-- RIGHT: Catalog Search & Assigned Shelf Books (8 cols) -->
				<div class="lg:col-span-8 space-y-6">

					<!-- SEARCH CATALOG TO ADD BOOKS -->
					<div
						class="bg-paper-surface rounded-2xl border border-paper-border p-5 sm:p-6 shadow-soft space-y-3">
						<div class="flex items-center justify-between">
							<h3 class="font-display font-bold text-sm text-forest-950 flex items-center gap-2">
								<Search :size="15" class="text-forest-900" />
								<span>Search Catalog to Add Books</span>
							</h3>
							<span class="text-[10px] font-mono text-ink-muted">Type title, author, or SKU</span>
						</div>

						<div class="relative">
							<Search :size="15" class="absolute left-3.5 top-3 text-ink-subtle pointer-events-none" />
							<input v-model="catalogQuery" type="text"
								placeholder="Search catalog (e.g. Atomic Habits, James Clear, SR-B0001)..."
								class="w-full pl-10 pr-9 py-2.5 bg-paper-canvas border border-paper-border rounded-xl text-xs sm:text-sm outline-none focus:bg-white focus:border-forest-900 transition-all text-forest-950 placeholder:text-ink-subtle"
								@keydown.esc="catalogQuery = ''" />
							<button v-if="catalogQuery" type="button"
								class="absolute right-3 top-2.5 text-slate-400 hover:text-black p-0.5 cursor-pointer"
								@click="catalogQuery = ''">
								<X :size="14" />
							</button>
						</div>

						<!-- Instant Search Dropdown Results with True Set Membership Verification -->
						<div v-if="catalogQuery.trim()"
							class="border border-paper-border rounded-xl bg-white overflow-hidden shadow-2xs divide-y divide-paper-border/60">
							<div v-if="isSearching" class="p-5 text-center text-xs text-ink-muted">
								<RefreshCw :size="14" class="animate-spin mx-auto text-forest-900 mb-1" />
								<span>Searching catalog...</span>
							</div>

							<div v-else-if="!searchResults.length" class="p-5 text-center text-xs text-ink-muted">
								No catalog titles match "{{ catalogQuery }}".
							</div>

							<div v-for="book in searchResults" :key="book.id"
								class="p-3 flex items-center justify-between gap-3 hover:bg-paper-cream/40 transition-colors">
								<div class="flex items-center gap-3 min-w-0 flex-1">
									<img :src="resolveCover(book)"
										class="w-9 h-12 object-cover rounded border border-paper-border flex-shrink-0" />
									<div class="min-w-0 flex-1 space-y-0.5">
										<strong class="text-xs font-bold text-forest-950 block truncate">{{ book.name
											}}</strong>
										<span class="text-[11px] text-ink-muted truncate block">{{ getBookAuthor(book)
											}}</span>
										<span class="text-[10px] font-mono text-ink-subtle block">KSh {{ book.price
											}}</span>
									</div>
								</div>

								<!-- True Set Membership Button: Disabled only if truly in assigned list -->
								<button type="button"
									class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 border shadow-2xs"
									:class="isBookOnShelf(book.id)
                    ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-300 cursor-pointer active:scale-95'"
									:disabled="isBookOnShelf(book.id)" @click="handleAddBook(book)">
									<CheckCircle2 v-if="isBookOnShelf(book.id)" :size="13" />
									<PlusCircle v-else :size="13" />
									<span>{{ isBookOnShelf(book.id) ? 'On Shelf' : '+ Add to Shelf' }}</span>
								</button>
							</div>
						</div>
					</div>

					<!-- ASSIGNED SHELF BOOKS LIST (With Functioning Delete Button) -->
					<div
						class="bg-paper-surface rounded-2xl border border-paper-border p-5 sm:p-6 shadow-soft space-y-4">
						<div class="flex items-center justify-between pb-3 border-b border-paper-border">
							<div>
								<h3 class="font-display font-bold text-sm text-forest-950 flex items-center gap-2">
									<BookOpen :size="16" class="text-forest-900" />
									<span>Books on {{ currentConfig.title }} ({{ assignedBooks.length }})</span>
								</h3>
								<p class="text-[11px] text-ink-muted">Active badge: {{ activeTab }}</p>
							</div>

							<button type="button"
								class="text-xs font-bold text-forest-900 hover:underline flex items-center gap-1 cursor-pointer"
								@click="loadAssignedBooks">
								<RefreshCw :size="11" />
								<span>Refresh</span>
							</button>
						</div>

						<div v-if="isLoadingAssigned" class="p-8 text-center text-xs text-ink-muted">
							Loading shelf books...
						</div>

						<div v-else-if="!assignedBooks.length"
							class="p-10 text-center text-xs text-ink-muted space-y-2">
							<p>No books are currently assigned to this shelf.</p>
							<span class="text-[11px] text-ink-subtle block">
								Type in the search box above to add titles from your catalog.
							</span>
						</div>

						<div v-else class="divide-y divide-paper-border/60">
							<div v-for="(book, index) in assignedBooks" :key="book.id"
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
										<span class="text-[11px] text-ink-muted truncate block">{{ getBookAuthor(book)
											}}</span>
										<span class="text-[10px] font-mono text-emerald-800 font-bold block">KSh {{
											book.price }}</span>
									</div>
								</div>

								<!-- Functioning Delete / Remove Button -->
								<button type="button"
									class="px-3.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 flex-shrink-0 shadow-2xs active:scale-95"
									title="Remove from this curated shelf" @click="handleRemoveBook(book)">
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