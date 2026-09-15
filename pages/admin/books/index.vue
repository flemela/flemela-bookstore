<!-- pages/admin/books/index.vue -->
<script setup lang="ts">
import { ref, computed,onMounted } from 'vue';
import {
  Plus,
  Search,
  Trash2,
  Edit2,
  BookOpen,
  Download,
  Truck,
  ExternalLink,
  Loader2,
  X,
  RotateCcw,
} from 'lucide-vue-next';
import AdminLayout from '~/components/admin/AdminLayout.vue';
import Pagination from '~/components/ui/Pagination.vue';
import { useToast } from '~/composables/useToast';
import type { Book } from '~/types';

definePageMeta({
  middleware: 'admin-auth',
});

const { push: pushToast } = useToast();

// Pagination & Search Reactive State
const currentPage = ref(1);
const itemsPerPage = ref(50);
const searchInput = ref('');
const debouncedSearch = ref('');
const selectedCategory = ref('');
const categories = ref<Array<{ id: string; name: string }>>([]);

let debounceTimer: ReturnType<typeof setTimeout> | undefined;

function onSearchInput(): void {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debouncedSearch.value = searchInput.value.trim();
    currentPage.value = 1; // Reset to page 1 on new search
  }, 350);
}

// Reactive useFetch: Automatically queries PostgreSQL on search, category, or page change
const { data: booksData, refresh, status: fetchStatus } = await useFetch<{
  products: Book[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}>('/api/admin/books', {
  query: {
    page: currentPage,
    limit: itemsPerPage,
    q: computed(() => (debouncedSearch.value ? debouncedSearch.value : undefined)),
    category_id: computed(() => (selectedCategory.value ? selectedCategory.value : undefined)),
  },
  watch: [currentPage, debouncedSearch, selectedCategory],
});

// Load category options for the filter dropdown
onMounted(async () => {
  try {
    const res = await $fetch<any>('/api/admin/categories');
    categories.value = Array.isArray(res) ? res : res?.data || [];
  } catch {
    categories.value = [];
  }
});

const books = computed<Book[]>(() => booksData.value?.products || []);
const totalBooks = computed(() => booksData.value?.total ?? 0);
const totalPages = computed(() => booksData.value?.totalPages ?? 1);

// Summary Text: "Showing 1–50 of 240 books"
const rangeText = computed(() => {
  const total = totalBooks.value;
  if (total === 0) return '0 books';
  const start = (currentPage.value - 1) * itemsPerPage.value + 1;
  const end = Math.min(currentPage.value * itemsPerPage.value, total);
  return `Showing ${start}–${end} of ${total.toLocaleString('en-KE')} books`;
});

const isFilterActive = computed(() => {
  return debouncedSearch.value.length > 0 || selectedCategory.value.length > 0;
});

function clearFilters(): void {
  searchInput.value = '';
  debouncedSearch.value = '';
  selectedCategory.value = '';
  currentPage.value = 1;
}

// Selection & Deletion State
const selectedBookIds = ref<string[]>([]);
const deletingBookId = ref<string | null>(null);
const isDeletingBulk = ref(false);

const isAllSelected = computed(() => {
  return books.value.length > 0 && selectedBookIds.value.length === books.value.length;
});

function toggleSelectAll(): void {
  if (isAllSelected.value) {
    selectedBookIds.value = [];
  } else {
    selectedBookIds.value = books.value.map((b) => b.id);
  }
}

function handlePageChange(newPage: number): void {
  currentPage.value = newPage;
  selectedBookIds.value = [];
  if (process.client) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function resolveCoverUrl(book: Book): string {
  const firstImg = book.images?.[0];
  if (!firstImg) return (book as any).cover_image_url || '';
  if (typeof firstImg === 'string') return firstImg;
  return firstImg.image_url || (book as any).cover_image_url || '';
}

// Server-Confirmed Single Delete
async function handleDeleteBook(id: string, name: string): Promise<void> {
  deletingBookId.value = id;

  try {
    const res = await $fetch<{ deleted: boolean; action: 'hard_deleted' | 'soft_deleted' }>(
      `/api/admin/books/${id}`,
      { method: 'DELETE' }
    );

    selectedBookIds.value = selectedBookIds.value.filter((bId) => bId !== id);

    const message = res?.action === 'soft_deleted'
      ? `"${name}" removed from catalog (historical orders & customer downloads preserved)`
      : `"${name}" permanently deleted`;

    pushToast({ message, variant: 'success' });
    await refresh();
  } catch (err: any) {
    const errorMsg = err.data?.message || err.statusMessage || 'Failed to delete book';
    pushToast({ message: errorMsg, variant: 'error' });
    await refresh();
  } finally {
    deletingBookId.value = null;
  }
}

// Server-Confirmed Bulk Delete
async function handleBulkDelete(): Promise<void> {
  if (selectedBookIds.value.length === 0 || isDeletingBulk.value) return;

  const count = selectedBookIds.value.length;
  const idsToDelete = [...selectedBookIds.value];
  isDeletingBulk.value = true;

  try {
    const res = await $fetch<{
      deleted: boolean;
      count: number;
      softDeleted: number;
      hardDeleted: number;
    }>('/api/admin/books/bulk-delete', {
      method: 'POST',
      body: { productIds: idsToDelete },
    });

    selectedBookIds.value = [];
    const details = res?.softDeleted > 0
      ? `(${res.hardDeleted} purged, ${res.softDeleted} archived with active orders)`
      : '';

    pushToast({ message: `Successfully deleted ${count} book(s) ${details}`, variant: 'success' });
    await refresh();
  } catch (err: any) {
    const errorMsg = err.data?.message || err.statusMessage || 'Bulk deletion failed';
    pushToast({ message: errorMsg, variant: 'error' });
    await refresh();
  } finally {
    isDeletingBulk.value = false;
  }
}
</script>

<template>
  <AdminLayout>
    <div class="space-y-6 max-w-7xl mx-auto">
      
      <!-- Top Header Bar -->
      <div class="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-paper-border">
        <div>
          <h1 class="font-display text-2xl font-bold text-forest-950">Books &amp; eBooks Catalog</h1>
          <p class="text-xs text-ink-muted">Manage multi-format pricing, physical stock, and digital downloads.</p>
        </div>

        <div class="flex items-center gap-2.5">
          <button
            v-if="selectedBookIds.length > 0"
            type="button"
            class="bg-red-700 hover:bg-red-800 text-white text-xs font-bold uppercase tracking-wider py-2.5 px-4 rounded-xl transition-all flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-[0.98] disabled:opacity-50"
            :disabled="isDeletingBulk"
            @click="handleBulkDelete"
          >
            <Loader2 v-if="isDeletingBulk" :size="14" class="animate-spin" />
            <Trash2 v-else :size="14" />
            <span>{{ isDeletingBulk ? 'Deleting...' : `Delete Selected (${selectedBookIds.length})` }}</span>
          </button>

          <NuxtLink
            to="/admin/books/new"
            class="bg-forest-950 text-paper hover:bg-forest-900 text-xs font-bold uppercase tracking-wider py-2.5 px-4 rounded-xl transition-all flex items-center gap-1.5 shadow-sm active:scale-[0.98]"
          >
            <Plus :size="15" class="text-gold-300" />
            <span>Add New Book</span>
          </NuxtLink>
        </div>
      </div>

      <!-- Search & Database Filter Toolbar -->
      <div class="bg-paper-surface p-4 rounded-2xl border border-paper-border shadow-soft flex flex-wrap gap-3 items-center justify-between">
        
        <!-- Live Database Search Input -->
        <div class="relative flex-1 min-w-[260px]">
          <Search :size="15" class="absolute left-3.5 top-3 text-ink-subtle pointer-events-none" />
          <input
            v-model="searchInput"
            type="text"
            placeholder="Search entire database by title, author, or SKU..."
            class="w-full pl-10 pr-9 py-2 bg-paper-canvas/50 border border-paper-border rounded-xl text-xs outline-none focus:bg-white focus:border-forest-900 transition-all text-forest-950 placeholder:text-ink-subtle"
            @input="onSearchInput"
          />
          <button
            v-if="searchInput"
            type="button"
            class="absolute right-3 top-2.5 text-ink-subtle hover:text-forest-950"
            @click="searchInput = ''; debouncedSearch = ''; currentPage = 1;"
          >
            <X :size="14" />
          </button>
        </div>

        <!-- Category Dropdown Filter -->
        <select
          v-model="selectedCategory"
          class="px-3 py-2 bg-paper-canvas/50 border border-paper-border rounded-xl text-xs font-semibold text-forest-950 outline-none focus:bg-white focus:border-forest-900"
          @change="currentPage = 1"
        >
          <option value="">All Categories</option>
          <option v-for="cat in categories" :key="cat.id" :value="cat.id">
            {{ cat.name }}
          </option>
        </select>

        <!-- Reset Button -->
        <button
          v-if="isFilterActive"
          type="button"
          class="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
          @click="clearFilters"
        >
          <RotateCcw :size="13" />
          <span>Reset</span>
        </button>

        <!-- Count Range Indicator -->
        <div class="text-xs text-ink-muted font-mono font-bold bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
          {{ rangeText }}
        </div>
      </div>

      <!-- Catalog Table -->
      <div class="bg-paper-surface rounded-2xl border border-paper-border shadow-soft overflow-hidden">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="bg-paper-cream/40 border-b border-paper-border text-ink-subtle uppercase tracking-wider font-mono text-[9px]">
              <th class="py-3 px-4 w-10">
                <input
                  type="checkbox"
                  :checked="isAllSelected"
                  class="rounded border-paper-border text-forest-950 focus:ring-forest-900 cursor-pointer"
                  @change="toggleSelectAll"
                />
              </th>
              <th class="py-3 px-4">Cover</th>
              <th class="py-3 px-4">Title &amp; Author</th>
              <th class="py-3 px-4">Category</th>
              <th class="py-3 px-4">Available Formats</th>
              <th class="py-3 px-4">Status</th>
              <th class="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-paper-border/60">
            <tr v-if="fetchStatus === 'pending'">
              <td colspan="7" class="py-12 text-center text-ink-muted text-xs">
                Searching database catalog...
              </td>
            </tr>

            <tr v-else-if="books.length === 0">
              <td colspan="7" class="py-12 text-center text-ink-muted text-xs space-y-2">
                <p>No books match the current query.</p>
                <button
                  v-if="isFilterActive"
                  type="button"
                  class="text-forest-900 font-bold underline cursor-pointer text-xs"
                  @click="clearFilters"
                >
                  Clear all search filters
                </button>
              </td>
            </tr>

            <tr
              v-for="book in books"
              :key="book.id"
              class="hover:bg-paper-cream/30 transition-colors"
              :class="{ 'bg-paper-cream/50': selectedBookIds.includes(book.id) }"
            >
              <!-- Checkbox -->
              <td class="py-3.5 px-4">
                <input
                  type="checkbox"
                  :value="book.id"
                  v-model="selectedBookIds"
                  class="rounded border-paper-border text-forest-950 focus:ring-forest-900 cursor-pointer"
                />
              </td>

              <!-- Cover Thumbnail -->
              <td class="py-3.5 px-4 w-16">
                <div class="w-10 h-14 bg-paper-cream rounded-book border border-paper-border overflow-hidden flex items-center justify-center shadow-xs">
                  <img
                    v-if="resolveCoverUrl(book)"
                    :src="resolveCoverUrl(book)"
                    :alt="`Cover for ${book.name}`"
                    class="w-full h-full object-cover"
                    referrerpolicy="no-referrer"
                    @error="($event.target as HTMLImageElement).src = '/images/book-placeholder.svg'"
                  />
                  <BookOpen v-else :size="16" class="text-ink-muted opacity-40" />
                </div>
              </td>

              <!-- Title & Author -->
              <td class="py-3.5 px-4 max-w-xs">
                <NuxtLink :to="`/admin/books/${book.id}/edit`" class="font-bold text-forest-950 hover:text-gold-600 transition-colors line-clamp-1">
                  {{ book.name }}
                </NuxtLink>
                <p class="text-[11px] text-ink-muted truncate italic">{{ book.author || '—' }}</p>
                <span v-if="book.sku" class="text-[10px] font-mono text-ink-subtle">SKU: {{ book.sku }}</span>
              </td>

              <!-- Category -->
              <td class="py-3.5 px-4">
                <span class="inline-block text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-md bg-paper-cream text-forest-950 border border-paper-border">
                  {{ book.category_name || 'General' }}
                </span>
              </td>

              <!-- Formats -->
              <td class="py-3.5 px-4">
                <div class="flex flex-wrap gap-1.5">
                  <span
                    v-for="fmt in book.formats"
                    :key="fmt.id"
                    class="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border"
                    :class="{
                      'bg-amber-50 text-amber-900 border-amber-200': fmt.format === 'hardcopy',
                      'bg-emerald-50 text-emerald-900 border-emerald-200': fmt.format === 'pdf',
                      'bg-blue-50 text-blue-900 border-blue-200': fmt.format === 'epub',
                    }"
                  >
                    <component :is="fmt.format === 'hardcopy' ? Truck : Download" :size="10" />
                    {{ fmt.format.toUpperCase() }}: KSh {{ fmt.price }}
                  </span>
                  <span v-if="!book.formats?.length" class="text-[10px] text-ink-subtle italic">No formats</span>
                </div>
              </td>

              <!-- Status -->
              <td class="py-3.5 px-4">
                <span
                  class="inline-flex items-center gap-1.5 text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border"
                  :class="book.status === 'published' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-700 border-slate-200'"
                >
                  <span class="w-1.5 h-1.5 rounded-full" :class="book.status === 'published' ? 'bg-emerald-600' : 'bg-slate-400'" />
                  {{ book.status }}
                </span>
              </td>

              <!-- Actions -->
              <td class="py-3.5 px-4 text-right">
                <div class="inline-flex items-center gap-1">
                  <NuxtLink
                    :to="`/book/${book.slug}`"
                    target="_blank"
                    class="p-1.5 rounded-lg hover:bg-paper-cream text-ink-muted hover:text-forest-950 transition-colors"
                    title="View on Storefront"
                  >
                    <ExternalLink :size="14" />
                  </NuxtLink>

                  <NuxtLink
                    :to="`/admin/books/${book.id}/edit`"
                    class="p-1.5 rounded-lg hover:bg-paper-cream text-ink-muted hover:text-forest-950 transition-colors"
                    title="Edit Book"
                  >
                    <Edit2 :size="14" />
                  </NuxtLink>

                  <button
                    type="button"
                    class="p-1.5 rounded-lg hover:bg-red-50 text-ink-muted hover:text-red-700 transition-colors cursor-pointer disabled:opacity-50"
                    :disabled="deletingBookId === book.id"
                    title="Delete book"
                    @click="handleDeleteBook(book.id, book.name)"
                  >
                    <Loader2 v-if="deletingBookId === book.id" :size="14" class="animate-spin text-red-700" />
                    <Trash2 v-else :size="14" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Controls for Previous, Nth Page, and Next -->
      <Pagination
        :page="currentPage"
        :total-pages="totalPages"
        :disabled="fetchStatus === 'pending'"
        @change="handlePageChange"
      />
    </div>
  </AdminLayout>
</template>