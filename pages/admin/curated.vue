<!-- =============================================================================
     pages/admin/curated.vue
     Unified Merchandising Desk: Promotional Campaign Strips & Genre Shelves
     ============================================================================= -->
<script setup lang="ts">
import { ref, watch } from 'vue';
import {
  Layers,
  Sparkles,
  Bookmark,
  Plus,
  Trash2,
  Edit2,
  Search,
  Clock,
  Palette,
  X,
  BookOpen,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  PlusCircle,
  MinusCircle,
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
  countdown_ends_at: string | null;
  bg_color: string;
  bg_image_url: string | null;
  is_active: boolean;
  sort_order: number;
}

interface CategoryShelfItem {
  id: string;
  name: string;
  slug: string;
  show_as_shelf: boolean;
  shelf_sort_order: number;
  product_count?: number;
}

// 1. Tab state
const activeTab = ref<'campaigns' | 'categories'>('campaigns');

// 2. Curated Campaign Sections Data
const { data: sections, refresh: refreshSections, status: sectionsStatus } = await useFetch<CuratedSection[]>('/api/admin/curated-sections');

// 3. Category Shelves Data
const { data: categories, refresh: refreshCategories } = await useFetch<CategoryShelfItem[]>('/api/admin/categories');

// Preset Brand Swatches for Shelf Styling
const PRESET_COLORS = [
  { name: 'Dark Pine', hex: '#052219' },
  { name: 'Forest Noir', hex: '#0C3A2B' },
  { name: 'Studio Black', hex: '#17171C' },
  { name: 'Charcoal', hex: '#1C221F' },
  { name: 'Midnight', hex: '#0E1726' },
  { name: 'Warm Cream', hex: '#FAF7F0' },
  { name: 'Crimson Burst', hex: '#7F1D1D' },
];

const STANDARD_BADGES = [
  { label: 'Flash Sale (FLASH_SALE)', value: 'FLASH_SALE' },
  { label: 'Bestseller (BESTSELLER)', value: 'BESTSELLER' },
  { label: '#1 Staff Pick (NO1_PICK)', value: 'NO1_PICK' },
  { label: 'Deal of the Week (DEAL_OF_WEEK)', value: 'DEAL_OF_WEEK' },
  { label: 'Limited Time (LIMITED_TIME)', value: 'LIMITED_TIME' },
  { label: 'Clearance (CLEARANCE)', value: 'CLEARANCE' },
];

// Modal 1: Create / Edit Curated Campaign Section
const showSectionModal = ref(false);
const editingSectionId = ref<string | null>(null);
const isSavingSection = ref(false);

const sectionForm = ref({
  title: '',
  subtitle: '',
  badge_trigger: 'FLASH_SALE',
  customBadge: '',
  hasCountdown: false,
  countdown_ends_at: '',
  bg_color: '#052219',
  is_active: true,
  sort_order: 0,
});

// Modal 2: Manage Items on Shelf (Search & Add / Remove)
const showItemModal = ref(false);
const activeManagingSection = ref<CuratedSection | null>(null);
const searchBookQuery = ref('');
const searchResults = ref<Book[]>([]);
const isSearchingBooks = ref(false);
const shelfBooks = ref<Book[]>([]);
const isLoadingShelfBooks = ref(false);
let searchDebounceTimer: ReturnType<typeof setTimeout> | undefined;

function openCreateSectionModal(): void {
  editingSectionId.value = null;
  sectionForm.value = {
    title: '',
    subtitle: '',
    badge_trigger: 'FLASH_SALE',
    customBadge: '',
    hasCountdown: false,
    countdown_ends_at: '',
    bg_color: '#052219',
    is_active: true,
    sort_order: (sections.value?.length || 0) * 10,
  };
  showSectionModal.value = true;
}

function openEditSectionModal(section: CuratedSection): void {
  editingSectionId.value = section.id;
  const isCustomBadge = !STANDARD_BADGES.some((b) => b.value === section.badge_trigger);

  sectionForm.value = {
    title: section.title,
    subtitle: section.subtitle || '',
    badge_trigger: isCustomBadge ? '__CUSTOM__' : section.badge_trigger,
    customBadge: isCustomBadge ? section.badge_trigger : '',
    hasCountdown: Boolean(section.countdown_ends_at),
    countdown_ends_at: section.countdown_ends_at ? new Date(section.countdown_ends_at).toISOString().slice(0, 16) : '',
    bg_color: section.bg_color || '#052219',
    is_active: section.is_active,
    sort_order: section.sort_order,
  };
  showSectionModal.value = true;
}

async function handleSaveSection(): Promise<void> {
  const title = sectionForm.value.title.trim();
  if (!title) {
    pushToast({ message: 'Shelf title is required', variant: 'error' });
    return;
  }

  let finalBadge = sectionForm.value.badge_trigger;
  if (finalBadge === '__CUSTOM__') {
    finalBadge = sectionForm.value.customBadge.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
  }
  if (!finalBadge) {
    pushToast({ message: 'Valid badge identifier is required', variant: 'error' });
    return;
  }

  isSavingSection.value = true;
  try {
    const payload = {
      title,
      subtitle: sectionForm.value.subtitle.trim() || null,
      badge_trigger: finalBadge,
      countdown_ends_at: sectionForm.value.hasCountdown && sectionForm.value.countdown_ends_at
        ? new Date(sectionForm.value.countdown_ends_at).toISOString()
        : null,
      bg_color: sectionForm.value.bg_color.trim() || '#052219',
      is_active: sectionForm.value.is_active,
      sort_order: Number(sectionForm.value.sort_order) || 0,
    };

    if (editingSectionId.value) {
      await $fetch(`/api/admin/curated-sections/${editingSectionId.value}`, {
        method: 'PATCH',
        body: payload,
      });
      pushToast({ message: `Shelf "${title}" updated successfully!`, variant: 'success' });
    } else {
      await $fetch('/api/admin/curated-sections', {
        method: 'POST',
        body: payload,
      });
      pushToast({ message: `New shelf "${title}" published!`, variant: 'success' });
    }

    showSectionModal.value = false;
    await refreshSections();
  } catch (err: any) {
    pushToast({ message: err.data?.message || err.statusMessage || 'Failed to save shelf', variant: 'error' });
  } finally {
    isSavingSection.value = false;
  }
}

async function handleDeleteSection(section: CuratedSection): Promise<void> {
  if (!confirm(`Are you sure you want to delete shelf "${section.title}"? Books will remain in catalog.`)) return;

  try {
    await $fetch(`/api/admin/curated-sections/${section.id}`, { method: 'DELETE' });
    pushToast({ message: `Shelf "${section.title}" deleted.`, variant: 'success' });
    await refreshSections();
  } catch {
    pushToast({ message: 'Failed to delete section', variant: 'error' });
  }
}

async function toggleSectionActive(section: CuratedSection): Promise<void> {
  try {
    await $fetch(`/api/admin/curated-sections/${section.id}`, {
      method: 'PATCH',
      body: { is_active: !section.is_active },
    });
    section.is_active = !section.is_active;
    pushToast({ message: `Shelf ${section.is_active ? 'activated' : 'hidden'}`, variant: 'info' });
  } catch {
    pushToast({ message: 'Failed to toggle status', variant: 'error' });
  }
}

async function openItemManagementModal(section: CuratedSection): Promise<void> {
  activeManagingSection.value = section;
  searchBookQuery.value = '';
  searchResults.value = [];
  showItemModal.value = true;
  await loadShelfBooks(section.badge_trigger);
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

watch(searchBookQuery, (query) => {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
  const q = query.trim();
  if (!q) {
    searchResults.value = [];
    return;
  }
  searchDebounceTimer = setTimeout(async () => {
    isSearchingBooks.value = true;
    try {
      const res = await $fetch<any>('/api/admin/books', {
        query: { q, limit: 8 },
      });
      searchResults.value = res?.products || (Array.isArray(res) ? res : []);
    } catch {
      searchResults.value = [];
    } finally {
      isSearchingBooks.value = false;
    }
  }, 200);
});

async function addBookToActiveShelf(book: Book): Promise<void> {
  if (!activeManagingSection.value) return;

  const targetBadge = activeManagingSection.value.badge_trigger;
  const saleEndsAt = activeManagingSection.value.countdown_ends_at;

  try {
    await $fetch('/api/admin/books/bulk-badge', {
      method: 'POST',
      body: {
        productIds: [book.id],
        badge: targetBadge,
        sale_ends_at: saleEndsAt,
      },
    });

    pushToast({ message: `Added "${book.name}" to shelf!`, variant: 'success' });
    await loadShelfBooks(targetBadge);
  } catch (err: any) {
    pushToast({ message: err.data?.message || 'Failed to add item', variant: 'error' });
  }
}

async function removeBookFromActiveShelf(book: Book): Promise<void> {
  if (!activeManagingSection.value) return;

  try {
    await $fetch('/api/admin/books/bulk-badge', {
      method: 'POST',
      body: {
        productIds: [book.id],
        badge: null,
        sale_ends_at: null,
      },
    });

    pushToast({ message: `Removed "${book.name}" from shelf.`, variant: 'info' });
    await loadShelfBooks(activeManagingSection.value.badge_trigger);
  } catch (err: any) {
    pushToast({ message: err.data?.message || 'Failed to remove item', variant: 'error' });
  }
}

async function toggleCategoryShelf(category: CategoryShelfItem): Promise<void> {
  const nextValue = !category.show_as_shelf;
  try {
    await $fetch(`/api/admin/categories/${category.id}`, {
      method: 'PATCH',
      body: {
        show_as_shelf: nextValue,
        shelf_sort_order: category.shelf_sort_order || 0,
      },
    });
    category.show_as_shelf = nextValue;
    pushToast({
      message: `"${category.name}" shelf ${nextValue ? 'enabled' : 'disabled'} on storefront!`,
      variant: 'success',
    });
  } catch (err: any) {
    pushToast({ message: err.data?.message || 'Failed to update category shelf setting', variant: 'error' });
  }
}

async function updateCategoryShelfOrder(category: CategoryShelfItem, delta: number): Promise<void> {
  const newOrder = Math.max(0, (category.shelf_sort_order || 0) + delta);
  try {
    await $fetch(`/api/admin/categories/${category.id}`, {
      method: 'PATCH',
      body: { shelf_sort_order: newOrder },
    });
    category.shelf_sort_order = newOrder;
    await refreshCategories();
  } catch {
    pushToast({ message: 'Failed to update sort order', variant: 'error' });
  }
}

function resolveCoverThumbnail(book: Book): string {
  const img = book.images?.[0];
  if (typeof img === 'string') return img;
  return img?.image_url || '/images/book-placeholder.svg';
}

function isDarkHex(hex: string): boolean {
  if (!hex || !hex.startsWith('#')) return true;
  const c = hex.replace('#', '');
  if (c.length !== 6) return true;
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.55;
}
</script>

<template>
	<AdminLayout>
		<div class="space-y-6 max-w-6xl mx-auto">

			<!-- Top Title Bar -->
			<div class="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-paper-border">
				<div>
					<span
						class="text-[9px] sm:text-[10px] font-mono uppercase tracking-widest text-gold-600 font-bold block">
						Merchandising Architecture
					</span>
					<h1 class="font-display text-2xl sm:text-3xl font-bold text-forest-950">
						Curated Shelves &amp; Showcases
					</h1>
					<p class="text-xs text-ink-muted mt-0.5">
						Organize high-converting horizontal book shelves, flash sale countdowns, and genre rails.
					</p>
				</div>

				<!-- Tab Switcher -->
				<div class="flex items-center gap-1.5 bg-paper-cream p-1 rounded-xl border border-paper-border">
					<button type="button"
						class="px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
						:class="activeTab === 'campaigns' ? 'bg-[#052219] text-[#FCF6BA] shadow-xs' : 'text-forest-950 hover:bg-white/50'"
						@click="activeTab = 'campaigns'">
						<Sparkles :size="13" />
						<span>Campaign Strips</span>
					</button>

					<button type="button"
						class="px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
						:class="activeTab === 'categories' ? 'bg-[#052219] text-[#FCF6BA] shadow-xs' : 'text-forest-950 hover:bg-white/50'"
						@click="activeTab = 'categories'">
						<Bookmark :size="13" />
						<span>Category Shelves</span>
					</button>
				</div>
			</div>

			<!-- TAB 1: CURATED CAMPAIGN STRIPS -->
			<div v-if="activeTab === 'campaigns'" class="space-y-6">
				<div class="flex justify-between items-center">
					<p class="text-xs text-ink-muted">
						Campaign shelves group books marked with a dedicated promotional badge with custom banners and
						countdown timers.
					</p>

					<button type="button"
						class="bg-forest-950 hover:bg-forest-900 text-paper text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shadow-medium cursor-pointer"
						@click="openCreateSectionModal">
						<Plus :size="15" class="text-gold-300" />
						<span>New Campaign Shelf</span>
					</button>
				</div>

				<div class="bg-paper-surface rounded-2xl border border-paper-border shadow-soft overflow-hidden">
					<div v-if="sectionsStatus === 'pending'" class="p-12 text-center text-xs text-ink-muted">
						Loading active shelves...
					</div>

					<div v-else-if="!sections?.length" class="p-12 text-center space-y-3">
						<div
							class="w-12 h-12 bg-paper-cream rounded-full flex items-center justify-center text-forest-900 mx-auto">
							<Layers :size="24" />
						</div>
						<h3 class="font-display font-bold text-sm text-forest-950">No Campaign Shelves Configured</h3>
						<p class="text-xs text-ink-muted max-w-sm mx-auto">
							Create a Flash Sale strip, Deal of the Week shelf, or seasonal collection.
						</p>
						<button type="button"
							class="bg-forest-950 text-paper text-xs font-bold px-4 py-2 rounded-xl cursor-pointer"
							@click="openCreateSectionModal">
							Create First Shelf
						</button>
					</div>

					<div v-else class="divide-y divide-paper-border/60">
						<div v-for="section in sections" :key="section.id"
							class="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-paper-cream/30 transition-colors">
							<!-- Shelf Card Preview -->
							<div class="flex items-center gap-4 min-w-0 flex-1">
								<div class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-xs border border-black/10"
									:style="{ backgroundColor: section.bg_color || '#052219' }">
									<Sparkles :size="18"
										:class="isDarkHex(section.bg_color) ? 'text-amber-300' : 'text-forest-950'" />
								</div>

								<div class="space-y-1 min-w-0 flex-1">
									<div class="flex items-center gap-2">
										<h4 class="text-sm font-bold text-forest-950 truncate">
											{{ section.title }}
										</h4>
										<span class="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full"
											:class="section.is_active ? 'bg-emerald-100 text-emerald-900' : 'bg-slate-200 text-slate-700'">
											{{ section.is_active ? 'Active' : 'Hidden' }}
										</span>
									</div>

									<p v-if="section.subtitle" class="text-xs text-ink-muted line-clamp-1">
										{{ section.subtitle }}
									</p>

									<div
										class="flex flex-wrap items-center gap-3 text-[11px] font-mono text-ink-subtle">
										<span>Trigger: <strong class="text-forest-950">{{ section.badge_trigger
												}}</strong></span>
										<span>•</span>
										<span class="flex items-center gap-1">
											<Clock :size="12" />
											{{ section.countdown_ends_at ? `Ends ${new
											Date(section.countdown_ends_at).toLocaleDateString()}` : 'Perpetual' }}
										</span>
										<span>•</span>
										<span>Swatch: {{ section.bg_color }}</span>
									</div>
								</div>
							</div>

							<!-- Action Buttons -->
							<div class="flex items-center gap-2 self-end sm:self-center">
								<button type="button"
									class="px-3 py-1.5 bg-[#FFF7ED] text-[#C25E00] border border-orange-200 hover:bg-orange-100 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
									title="Search and assign books to this shelf"
									@click="openItemManagementModal(section)">
									<BookOpen :size="13" />
									<span>Curate Books</span>
								</button>

								<button type="button"
									class="p-2 text-ink-muted hover:text-forest-950 rounded-lg hover:bg-paper-cream transition-colors cursor-pointer"
									:title="section.is_active ? 'Hide from Store' : 'Show on Store'"
									@click="toggleSectionActive(section)">
									<component :is="section.is_active ? EyeOff : Eye" :size="15" />
								</button>

								<button type="button"
									class="p-2 text-ink-muted hover:text-forest-950 rounded-lg hover:bg-paper-cream transition-colors cursor-pointer"
									title="Edit Shelf Properties" @click="openEditSectionModal(section)">
									<Edit2 :size="15" />
								</button>

								<button type="button"
									class="p-2 text-ink-muted hover:text-red-700 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
									title="Delete Shelf" @click="handleDeleteSection(section)">
									<Trash2 :size="15" />
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- TAB 2: CATEGORY SHOWCASE RAILS -->
			<div v-else-if="activeTab === 'categories'" class="space-y-6">
				<div class="p-4 bg-paper-cream/60 border border-gold-300 rounded-2xl text-xs text-forest-950 space-y-1">
					<p class="font-bold">Automated Genre Rails</p>
					<p class="text-ink-muted leading-relaxed">
						Toggle any standard category to appear as a dedicated horizontal showcase shelf on the
						storefront. Books automatically populate based on their primary category.
					</p>
				</div>

				<div class="bg-paper-surface rounded-2xl border border-paper-border shadow-soft overflow-hidden">
					<table class="w-full text-left text-xs border-collapse">
						<thead>
							<tr
								class="bg-paper-cream/40 border-b border-paper-border text-ink-subtle uppercase tracking-wider font-mono text-[9px]">
								<th class="py-3 px-5">Category Name</th>
								<th class="py-3 px-5">Total Titles</th>
								<th class="py-3 px-5">Shelf Status</th>
								<th class="py-3 px-5 text-center">Display Sequence</th>
								<th class="py-3 px-5 text-right">Action</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-paper-border/60">
							<tr v-for="cat in categories" :key="cat.id"
								class="hover:bg-paper-cream/30 transition-colors">
								<td class="py-3.5 px-5 font-bold text-forest-950 text-xs">
									{{ cat.name }}
								</td>
								<td class="py-3.5 px-5 font-mono text-ink-muted">
									{{ cat.product_count ?? 'â€”' }} books
								</td>
								<td class="py-3.5 px-5">
									<span
										class="inline-flex items-center gap-1.5 text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full"
										:class="cat.show_as_shelf ? 'bg-emerald-100 text-emerald-900 border border-emerald-200' : 'bg-slate-100 text-slate-600'">
										<span class="w-1.5 h-1.5 rounded-full"
											:class="cat.show_as_shelf ? 'bg-emerald-600' : 'bg-slate-400'" />
										{{ cat.show_as_shelf ? 'Active Shelf' : 'Regular Genre' }}
									</span>
								</td>
								<td class="py-3.5 px-5 text-center font-mono">
									<div class="inline-flex items-center gap-2">
										<span class="font-bold text-forest-950 text-xs">{{ cat.shelf_sort_order || 0
											}}</span>
										<button v-if="cat.show_as_shelf" type="button"
											class="p-1 hover:text-forest-950 text-ink-muted cursor-pointer"
											title="Move up" @click="updateCategoryShelfOrder(cat, -1)">
											<ArrowUp :size="12" />
										</button>
										<button v-if="cat.show_as_shelf" type="button"
											class="p-1 hover:text-forest-950 text-ink-muted cursor-pointer"
											title="Move down" @click="updateCategoryShelfOrder(cat, 1)">
											<ArrowDown :size="12" />
										</button>
									</div>
								</td>
								<td class="py-3.5 px-5 text-right">
									<button type="button"
										class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs border"
										:class="cat.show_as_shelf ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100' : 'bg-forest-950 text-paper hover:bg-forest-900 border-forest-950'"
										@click="toggleCategoryShelf(cat)">
										{{ cat.show_as_shelf ? 'Disable Shelf' : 'Show as Shelf' }}
									</button>
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
		</div>

		<!-- MODAL 1: Create / Edit Campaign Shelf Customizer -->
		<Teleport to="body">
			<div v-if="showSectionModal"
				class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest-950/70 backdrop-blur-xs"
				@click.self="showSectionModal = false">
				<div
					class="bg-white rounded-2xl shadow-2xl border border-paper-border max-w-lg w-full p-6 sm:p-7 space-y-5 animate-in zoom-in-95 max-h-[92vh] overflow-y-auto">
					<div class="flex items-center justify-between pb-3 border-b border-paper-border">
						<div>
							<h3 class="font-display font-bold text-base text-forest-950">
								{{ editingSectionId ? 'Edit Campaign Shelf' : 'New Campaign Shelf' }}
							</h3>
							<p class="text-xs text-ink-muted">Customize headline, countdown, and background tone.</p>
						</div>
						<button type="button" class="text-ink-muted hover:text-ink p-1 cursor-pointer"
							@click="showSectionModal = false">
							<X :size="18" />
						</button>
					</div>

					<form class="space-y-4" @submit.prevent="handleSaveSection">
						<div class="space-y-1">
							<label class="text-xs font-bold text-forest-950">Shelf Headline *</label>
							<input v-model="sectionForm.title" type="text"
								placeholder="e.g. FLASH SALE DEALS or DEALS OF THE WEEK"
								class="w-full px-3.5 py-2.5 bg-paper-canvas/50 border border-paper-border rounded-xl text-xs sm:text-sm font-semibold outline-none focus:border-forest-900 text-forest-950"
								required />
						</div>

						<div class="space-y-1">
							<label class="text-xs font-semibold text-forest-950">Subtitle / Tagline (Optional)</label>
							<input v-model="sectionForm.subtitle" type="text"
								placeholder="e.g. Handpicked literature at special discounts"
								class="w-full px-3.5 py-2.5 bg-paper-canvas/50 border border-paper-border rounded-xl text-xs outline-none focus:border-forest-900 text-forest-950" />
						</div>

						<div class="space-y-1.5">
							<label class="text-xs font-bold text-forest-950">Marketing Badge Trigger</label>
							<select v-model="sectionForm.badge_trigger"
								class="w-full px-3.5 py-2.5 bg-paper-canvas/50 border border-paper-border rounded-xl text-xs font-semibold text-forest-950 outline-none focus:border-forest-900">
								<option v-for="b in STANDARD_BADGES" :key="b.value" :value="b.value">
									{{ b.label }}
								</option>
								<option value="__CUSTOM__">âœ¨ Custom Badge String...</option>
							</select>

							<input v-if="sectionForm.badge_trigger === '__CUSTOM__'" v-model="sectionForm.customBadge"
								type="text" placeholder="CUSTOM_TAG_NAME"
								class="w-full px-3 py-2 border border-amber-300 rounded-xl text-xs font-mono font-bold uppercase text-forest-950 outline-none" />
						</div>

						<!-- Background Tone & Custom Hex -->
						<div class="space-y-2 pt-1 border-t border-paper-border">
							<label class="text-xs font-bold text-forest-950 flex items-center gap-1.5">
								<Palette :size="14" />
								<span>Shelf Background Color</span>
							</label>

							<div class="flex flex-wrap gap-2 items-center">
								<button v-for="color in PRESET_COLORS" :key="color.hex" type="button"
									class="w-8 h-8 rounded-xl border-2 transition-transform cursor-pointer shadow-xs"
									:class="sectionForm.bg_color === color.hex ? 'border-amber-400 scale-110 ring-2 ring-amber-400/30' : 'border-black/10 hover:scale-105'"
									:style="{ backgroundColor: color.hex }" :title="color.name"
									@click="sectionForm.bg_color = color.hex" />
							</div>

							<div class="flex items-center gap-2 pt-1">
								<input v-model="sectionForm.bg_color" type="color"
									class="w-8 h-8 rounded border border-paper-border cursor-pointer p-0.5" />
								<input v-model="sectionForm.bg_color" type="text" placeholder="#052219"
									class="w-full px-3 py-1.5 border border-paper-border rounded-xl text-xs font-mono outline-none" />
							</div>
							<!-- Live Card Preview -->
							<div class="rounded-xl p-4 border border-black/10 transition-colors shadow-xs text-left"
								:style="{ backgroundColor: sectionForm.bg_color || '#052219' }">
								<span class="text-[9px] font-mono font-bold uppercase tracking-wider block"
									:class="isDarkHex(sectionForm.bg_color) ? 'text-amber-300' : 'text-forest-950'">
									LIVE PREVIEW
								</span>
								<h4 class="font-display font-bold text-base mt-0.5"
									:class="isDarkHex(sectionForm.bg_color) ? 'text-white' : 'text-forest-950'">
									{{ sectionForm.title || 'Untitled Shelf' }}
								</h4>
								<p class="text-[11px] opacity-80"
									:class="isDarkHex(sectionForm.bg_color) ? 'text-white/80' : 'text-ink-muted'">
									{{ sectionForm.subtitle || 'Shelf description will appear here' }}
								</p>
							</div>
						</div>

						<!-- Countdown Timer Switch -->
						<div class="space-y-2 pt-2 border-t border-paper-border">
							<label class="flex items-center gap-2 cursor-pointer select-none">
								<input v-model="sectionForm.hasCountdown" type="checkbox"
									class="rounded border-paper-border text-forest-950" />
								<span class="text-xs font-bold text-forest-950 flex items-center gap-1">
									<Clock :size="13" class="text-red-600" />
									<span>Display Live Countdown Clock</span>
								</span>
							</label>

							<div v-if="sectionForm.hasCountdown" class="pl-6 space-y-1">
								<input v-model="sectionForm.countdown_ends_at" type="datetime-local"
									class="w-full px-3 py-1.5 border border-red-200 rounded-xl text-xs font-mono text-gray-800 outline-none"
									required />
							</div>
						</div>

						<div class="grid grid-cols-2 gap-3 pt-2 border-t border-paper-border">
							<div class="space-y-1">
								<label class="text-xs font-semibold text-forest-950">Sort Sequence</label>
								<input v-model.number="sectionForm.sort_order" type="number" min="0"
									class="w-full px-3 py-1.5 border border-paper-border rounded-xl text-xs font-mono font-bold" />
							</div>

							<div class="flex items-center pt-5">
								<label class="flex items-center gap-2 cursor-pointer select-none">
									<input v-model="sectionForm.is_active" type="checkbox"
										class="rounded border-paper-border text-forest-950" />
									<span class="text-xs font-bold text-forest-950">Active on Storefront</span>
								</label>
							</div>
						</div>

						<div class="pt-3 flex justify-end gap-2.5 border-t border-paper-border">
							<button type="button"
								class="px-4 py-2 text-xs font-semibold text-ink-muted hover:text-forest-950 cursor-pointer"
								@click="showSectionModal = false">
								Cancel
							</button>
							<button type="submit"
								class="bg-forest-950 text-paper text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-medium hover:bg-forest-900 disabled:opacity-50 cursor-pointer"
								:disabled="isSavingSection">
								{{ isSavingSection ? 'Saving...' : (editingSectionId ? 'Update Shelf' : 'Publish Shelf')
								}}
							</button>
						</div>
					</form>
				</div>
			</div>
		</Teleport>
		<!-- MODAL 2: Curate Items on Shelf (Search & 1-Click Add / Remove) -->
		<Teleport to="body">
			<div v-if="showItemModal && activeManagingSection"
				class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest-950/70 backdrop-blur-xs"
				@click.self="showItemModal = false">
				<div
					class="bg-white rounded-2xl shadow-2xl border border-paper-border max-w-4xl w-full p-6 sm:p-7 space-y-5 animate-in zoom-in-95 max-h-[90vh] flex flex-col">
					<div class="flex items-center justify-between pb-3 border-b border-paper-border">
						<div>
							<span class="text-[10px] font-mono uppercase font-bold text-amber-600 block">
								Badge Assignment: {{ activeManagingSection.badge_trigger }}
							</span>
							<h3 class="font-display font-bold text-base text-forest-950">
								Curate Books on "{{ activeManagingSection.title }}"
							</h3>
						</div>
						<button type="button" class="text-ink-muted hover:text-ink p-1 cursor-pointer"
							@click="showItemModal = false">
							<X :size="18" />
						</button>
					</div>

					<div class="grid md:grid-cols-2 gap-6 flex-1 min-h-0 overflow-hidden">
						<!-- Left Pane: Catalog Search to Add -->
						<div class="flex flex-col space-y-3 min-h-0 border-r border-paper-border pr-0 md:pr-4">
							<div class="space-y-1">
								<label class="text-xs font-bold text-forest-950 uppercase font-mono">1. Search Catalog
									to Add</label>
								<div class="relative">
									<Search :size="14"
										class="absolute left-3 top-2.5 text-ink-subtle pointer-events-none" />
									<input v-model="searchBookQuery" type="text"
										placeholder="Search by title, author, or SKU..."
										class="w-full pl-8 pr-3 py-1.5 bg-paper-canvas/50 border border-paper-border rounded-xl text-xs outline-none focus:bg-white focus:border-forest-900" />
								</div>
							</div>

							<div class="flex-1 overflow-y-auto space-y-2 pr-1 divide-y divide-paper-border/60">
								<div v-if="isSearchingBooks" class="p-6 text-center text-xs text-ink-muted">
									Searching catalog...
								</div>
								<div v-else-if="!searchBookQuery" class="p-6 text-center text-xs text-ink-muted">
									Type a title or author above to find books.
								</div>
								<div v-else-if="!searchResults.length" class="p-6 text-center text-xs text-ink-muted">
									No matching books found.
								</div>

								<div v-for="book in searchResults" :key="book.id"
									class="pt-2 first:pt-0 flex items-center justify-between gap-3">
									<div class="flex items-center gap-2.5 min-w-0 flex-1">
										<img :src="resolveCoverThumbnail(book)"
											class="w-8 h-11 object-cover rounded border border-paper-border flex-shrink-0" />
										<div class="min-w-0 flex-1">
											<strong class="text-xs font-bold text-forest-950 block truncate">{{
												book.name }}</strong>
											<span class="text-[10px] text-ink-muted truncate block">{{ book.author ||
												'Original Edition' }}</span>
											<span class="text-[9px] font-mono text-ink-subtle block">KSh {{ book.price
												}}</span>
										</div>
									</div>

									<button type="button"
										class="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 flex-shrink-0"
										@click="addBookToActiveShelf(book)">
										<PlusCircle :size="13" />
										<span>Add</span>
									</button>
								</div>
							</div>
						</div>

						<!-- Right Pane: Currently on this Shelf -->
						<div class="flex flex-col space-y-3 min-h-0 pl-0 md:pl-2">
							<div class="flex items-center justify-between">
								<label class="text-xs font-bold text-forest-950 uppercase font-mono">
									2. Books on this Shelf ({{ shelfBooks.length }})
								</label>
								<span class="text-[10px] text-ink-muted font-mono">Live on Storefront</span>
							</div>

							<div class="flex-1 overflow-y-auto space-y-2 pr-1 divide-y divide-paper-border/60">
								<div v-if="isLoadingShelfBooks" class="p-6 text-center text-xs text-ink-muted">
									Loading shelf items...
								</div>
								<div v-else-if="!shelfBooks.length" class="p-6 text-center text-xs text-ink-muted">
									No books assigned to this shelf yet. Search on the left to add items.
								</div>

								<div v-for="book in shelfBooks" :key="book.id"
									class="pt-2 first:pt-0 flex items-center justify-between gap-3">
									<div class="flex items-center gap-2.5 min-w-0 flex-1">
										<img :src="resolveCoverThumbnail(book)"
											class="w-8 h-11 object-cover rounded border border-paper-border flex-shrink-0" />
										<div class="min-w-0 flex-1">
											<strong class="text-xs font-bold text-forest-950 block truncate">{{
												book.name }}</strong>
											<span class="text-[10px] text-ink-muted truncate block">{{ book.author ||
												'Original Edition' }}</span>
											<span class="text-[9px] font-mono text-emerald-800 font-bold block">Badge:
												{{ book.badge }}</span>
										</div>
									</div>

									<button type="button"
										class="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 flex-shrink-0"
										title="Remove from this shelf" @click="removeBookFromActiveShelf(book)">
										<MinusCircle :size="13" />
										<span>Remove</span>
									</button>
								</div>
							</div>
						</div>
					</div>

					<div class="pt-3 border-t border-paper-border flex justify-end">
						<button type="button"
							class="px-5 py-2 bg-forest-950 text-paper rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-forest-900 cursor-pointer"
							@click="showItemModal = false">
							Done Curating
						</button>
					</div>
				</div>
			</div>
		</Teleport>
	</AdminLayout>
</template>