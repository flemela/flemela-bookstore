<!-- pages/admin/books/index.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue';
import { Plus, Search, Trash2, Edit2, BookOpen, Download, Truck, ExternalLink } from 'lucide-vue-next';
import AdminLayout from '~/components/admin/AdminLayout.vue';
import { useToast } from '~/composables/useToast';
import type { Book } from '~/types';

definePageMeta({
  middleware: 'admin-auth',
});

const { push: pushToast } = useToast();
const { data: books, refresh, status: fetchStatus } = await useFetch<Book[]>('/api/admin/books');

const searchQuery = ref('');
const selectedCategory = ref('');

const filteredBooks = computed(() => {
  if (!books.value) return [];
  let list = [...books.value];

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim();
    list = list.filter((b) => b.name.toLowerCase().includes(q) || b.author?.toLowerCase().includes(q));
  }

  if (selectedCategory.value) {
    list = list.filter((b) => b.category_id === selectedCategory.value);
  }

  return list;
});

function resolveCoverUrl(book: Book): string {
  const firstImg = book.images?.[0];
  if (!firstImg) return (book as any).cover_image_url || '';
  if (typeof firstImg === 'string') return firstImg;
  return firstImg.image_url || (book as any).cover_image_url || '';
}

async function handleDeleteBook(id: string, name: string): Promise<void> {
  if (!confirm(`Are you sure you want to permanently delete "${name}"? All formats, covers, and stock will be deleted cleanly.`)) {
    return;
  }

  try {
    await $fetch(`/api/admin/books/${id}`, { method: 'DELETE' });
    pushToast({ message: `"${name}" removed from catalog`, variant: 'success' });
    await refresh();
  } catch (err: any) {
    pushToast({ message: err.statusMessage || 'Failed to delete book', variant: 'error' });
  }
}
</script>

<template>
  <AdminLayout>
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-ink-border">
        <div>
          <h1 class="font-display text-2xl font-bold text-forest-950">Books &amp; eBooks Catalog</h1>
          <p class="text-xs text-ink-muted">Manage multi-format pricing, physical stock, and digital files.</p>
        </div>

        <NuxtLink
          to="/admin/books/new"
          class="bg-forest-900 text-white text-xs font-bold uppercase py-2.5 px-4 rounded-md hover:bg-forest-800 transition-colors flex items-center gap-1.5 shadow-sm"
        >
          <Plus :size="16" /> Add New Book
        </NuxtLink>
      </div>

      <!-- Filter Controls -->
      <div class="bg-white p-4 rounded-lg border border-ink-border shadow-subtle flex flex-wrap gap-4 items-center justify-between">
        <div class="relative flex-1 min-w-[240px]">
          <Search :size="16" class="absolute left-3 top-2.5 text-ink-muted pointer-events-none" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search catalog by title or author..."
            class="w-full pl-9 pr-3 py-1.5 border border-ink-border rounded text-xs outline-none focus:border-forest-900"
          />
        </div>
        <div class="text-xs text-ink-muted font-mono tabular-figure">
          Showing <strong>{{ filteredBooks.length }}</strong> books
        </div>
      </div>

      <!-- Inventory Table -->
      <div class="bg-white rounded-lg border border-ink-border shadow-subtle overflow-hidden">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="bg-slate-50 border-b border-ink-border text-ink-muted uppercase tracking-wider font-bold font-mono text-[9px]">
              <th class="py-3 px-4">Cover</th>
              <th class="py-3 px-4">Title &amp; Author</th>
              <th class="py-3 px-4">Category</th>
              <th class="py-3 px-4">Available Formats</th>
              <th class="py-3 px-4">Status</th>
              <th class="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-if="fetchStatus === 'pending'">
              <td colspan="6" class="py-12 text-center text-ink-muted">
                Loading catalog...
              </td>
            </tr>

            <tr v-else-if="filteredBooks.length === 0">
              <td colspan="6" class="py-12 text-center text-ink-muted">
                No books found in catalog. Add your first book or run an Excel import.
              </td>
            </tr>

            <tr v-for="book in filteredBooks" :key="book.id" class="hover:bg-slate-50/80 transition-colors">
              <!-- Cover Thumbnail -->
              <td class="py-3 px-4 w-16">
                <div class="w-10 h-14 bg-paper-cream rounded border border-ink-border overflow-hidden flex items-center justify-center">
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
              <td class="py-3 px-4 max-w-xs">
                <NuxtLink :to="`/admin/books/${book.id}/edit`" class="font-bold text-forest-950 hover:text-forest-800 line-clamp-1">
                  {{ book.name }}
                </NuxtLink>
                <p class="text-[11px] text-ink-muted truncate">{{ book.author || '—' }}</p>
              </td>

              <!-- Category -->
              <td class="py-3 px-4">
                <span class="inline-block text-[9px] font-mono font-extrabold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                  {{ book.category_name || 'General' }}
                </span>
              </td>

              <!-- Formats Array -->
              <td class="py-3 px-4">
                <div class="flex flex-wrap gap-1.5">
                  <span
                    v-for="fmt in book.formats"
                    :key="fmt.id"
                    class="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded border"
                    :class="{
                      'bg-amber-50 text-amber-900 border-amber-200': fmt.format === 'hardcopy',
                      'bg-emerald-50 text-emerald-900 border-emerald-200': fmt.format === 'pdf',
                      'bg-blue-50 text-blue-900 border-blue-200': fmt.format === 'epub',
                    }"
                  >
                    <component :is="fmt.format === 'hardcopy' ? Truck : Download" :size="10" />
                    {{ fmt.format.toUpperCase() }}: KSh {{ fmt.price }}
                  </span>
                  <span v-if="!book.formats?.length" class="text-[10px] text-slate-400 italic">No formats configured</span>
                </div>
              </td>

              <!-- Status -->
              <td class="py-3 px-4">
                <span
                  class="inline-block text-[9px] font-mono font-extrabold uppercase px-2 py-0.5 rounded"
                  :class="book.status === 'published' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'"
                >
                  {{ book.status }}
                </span>
              </td>

              <!-- Actions -->
              <td class="py-3 px-4 text-right">
                <div class="inline-flex items-center gap-2">
                  <NuxtLink
                    :to="`/book/${book.slug}`"
                    target="_blank"
                    class="p-1.5 rounded hover:bg-slate-100 text-ink-muted hover:text-forest-900 transition-colors"
                    title="View on Storefront"
                  >
                    <ExternalLink :size="14" />
                  </NuxtLink>

                  <NuxtLink
                    :to="`/admin/books/${book.id}/edit`"
                    class="p-1.5 rounded hover:bg-slate-100 text-ink-muted hover:text-forest-900 transition-colors"
                    title="Edit Book"
                  >
                    <Edit2 :size="14" />
                  </NuxtLink>

                  <button
                    type="button"
                    class="p-1.5 rounded hover:bg-red-50 text-ink-muted hover:text-red-600 transition-colors cursor-pointer"
                    title="Delete Book"
                    @click="handleDeleteBook(book.id, book.name)"
                  >
                    <Trash2 :size="14" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </AdminLayout>
</template>