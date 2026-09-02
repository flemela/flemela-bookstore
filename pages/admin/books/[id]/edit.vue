<!-- flemela/pages/admin/books/[id]/edit.vue -->
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import {
  ArrowLeft,
  Trash2,
  Upload,
  BookOpen,
  AlertCircle,
  Truck,
  Download,
  Sparkles,
  Link as LinkIcon,
  RefreshCw,
} from 'lucide-vue-next';
import AdminLayout from '~/components/admin/AdminLayout.vue';
import { useToast } from '~/composables/useToast';
import type { Book, BookFormatType } from '~/types';

definePageMeta({
  middleware: 'admin-auth',
});

const route = useRoute();
const { push: pushToast } = useToast();
const bookId = computed(() => route.params.id as string);

const { data: categories } = await useFetch<Array<{ id: string; name: string }>>('/api/admin/categories');
const { data: book, refresh } = await useFetch<Book>(`/api/admin/books/${bookId.value}`);

// Base Form Fields
const name = ref('');
const author = ref('');
const categoryId = ref('');
const description = ref('');
const status = ref<'draft' | 'published' | 'archived'>('published');

// Cover art state
const coverUrl = ref('');
const coverPublicId = ref('');
const isUploadingCover = ref(false);
const isSearchingCover = ref(false);

// New Format State
const newFormatType = ref<BookFormatType>('pdf');
const newFormatPrice = ref(149);
const newFormatStock = ref<number | null>(null);
const newFormatFileKey = ref<string | null>(null);
const newFormatFileSize = ref<number | null>(null);
const isUploadingNewEbook = ref(false);

const isSaving = ref(false);
const formError = ref<string | null>(null);

onMounted(() => {
  if (book.value) {
    name.value = book.value.name;
    author.value = book.value.author || '';
    categoryId.value = book.value.category_id || '';
    description.value = book.value.description || '';
    status.value = book.value.status;
    const firstImg = book.value.images?.[0];
    coverUrl.value = typeof firstImg === 'string' ? firstImg : firstImg?.image_url || '';
    coverPublicId.value = typeof firstImg === 'object' ? firstImg?.image_public_id || '' : '';
  }
});

// Automated High-Res Cover Discovery
async function handleAutoFindCover(): Promise<void> {
  if (!name.value.trim()) {
    pushToast({ message: 'Enter a book title first', variant: 'error' });
    return;
  }

  isSearchingCover.value = true;
  try {
    const res = await $fetch<{ coverUrl: string | null; title: string; source: string | null }>(
      '/api/admin/books/findCover',
      {
        query: {
          title: name.value.trim(),
          author: author.value.trim() || undefined,
        },
      }
    );

    if (res?.coverUrl) {
      coverUrl.value = res.coverUrl;
      coverPublicId.value = `auto_${res.source || 'web'}`;
      pushToast({ message: `Discovered cover art from ${res.source === 'googlebooks' ? 'Google Books' : 'Open Library'}!`, variant: 'success' });
    } else {
      pushToast({ message: 'No online cover found.', variant: 'info' });
    }
  } catch {
    pushToast({ message: 'Auto-discovery timed out.', variant: 'error' });
  } finally {
    isSearchingCover.value = false;
  }
}

// Upload Cover Art to Cloudinary
async function handleCoverUpload(event: Event): Promise<void> {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  isUploadingCover.value = true;
  try {
    const sig = await $fetch<{
      signature: string;
      timestamp: number;
      folder: string;
      apiKey: string;
      cloudName: string;
    }>('/api/admin/upload-signature', { method: 'POST' });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', sig.apiKey);
    formData.append('timestamp', String(sig.timestamp));
    formData.append('signature', sig.signature);
    formData.append('folder', sig.folder);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();

    if (data.secure_url) {
      coverUrl.value = data.secure_url;
      coverPublicId.value = data.public_id;
      pushToast({ message: 'Cover art updated on Cloudinary', variant: 'success' });
    }
  } catch {
    pushToast({ message: 'Cover image upload failed', variant: 'error' });
  } finally {
    isUploadingCover.value = false;
  }
}

// Upload eBook to Cloudflare R2
async function handleNewEbookUpload(event: Event): Promise<void> {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  isUploadingNewEbook.value = true;
  try {
    const presigned = await $fetch<{ uploadUrl: string; key: string }>('/api/admin/books/upload-url', {
      method: 'POST',
      body: {
        filename: file.name,
        format: newFormatType.value,
        contentType: file.type || 'application/pdf',
      },
    });

    const uploadRes = await fetch(presigned.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type || 'application/pdf' },
      body: file,
    });

    if (!uploadRes.ok) throw new Error('R2 upload failed');

    newFormatFileKey.value = presigned.key;
    newFormatFileSize.value = file.size;

    pushToast({ message: `Uploaded ${file.name} to Cloudflare R2!`, variant: 'success' });
  } catch {
    pushToast({ message: 'eBook upload to Cloudflare R2 failed', variant: 'error' });
  } finally {
    isUploadingNewEbook.value = false;
  }
}

async function handleUpdateBook(): Promise<void> {
  isSaving.value = true;
  formError.value = null;

  try {
    const formattedDescription = author.value.trim()
      ? `By ${author.value.trim()}${description.value ? `\n\n${description.value.trim()}` : ''}`
      : description.value.trim() || null;

    await $fetch(`/api/admin/books/${bookId.value}`, {
      method: 'PATCH',
      body: {
        name: name.value.trim(),
        author: author.value.trim() || null,
        category_id: categoryId.value || undefined,
        description: formattedDescription,
        status: status.value,
        images: coverUrl.value
          ? [{ image_url: coverUrl.value.trim(), image_public_id: coverPublicId.value || 'cover_img' }]
          : undefined,
      },
    });
    pushToast({ message: 'Book details updated successfully!', variant: 'success' });
  } catch (err: any) {
    formError.value = err.data?.message || err.statusMessage || 'Failed to update book';
  } finally {
    isSaving.value = false;
  }
}

// Add format (EPUB/PDF permitted even if file is not yet uploaded)
async function handleAddFormat(): Promise<void> {
  const isDigital = newFormatType.value === 'pdf' || newFormatType.value === 'epub';

  try {
    await $fetch(`/api/admin/books/${bookId.value}/formats`, {
      method: 'POST',
      body: {
        format: newFormatType.value,
        price: Number(newFormatPrice.value),
        stock: newFormatType.value === 'hardcopy' ? Number(newFormatStock.value || 0) : null,
        file_url: isDigital ? (newFormatFileKey.value || null) : null,
        file_public_id: isDigital ? (newFormatFileKey.value || null) : null,
        file_size_bytes: isDigital ? (newFormatFileSize.value || null) : null,
      },
    });

    pushToast({ message: `Added ${newFormatType.value.toUpperCase()} format`, variant: 'success' });
    newFormatFileKey.value = null;
    newFormatFileSize.value = null;
    await refresh();
  } catch (err: any) {
    pushToast({ message: err.data?.message || err.statusMessage || 'Failed to add format', variant: 'error' });
  }
}

// Immediate format removal (Zero Dialogue)
async function handleDeleteFormat(formatId: string): Promise<void> {
  try {
    await $fetch(`/api/admin/books/${bookId.value}/formats/${formatId}`, { method: 'DELETE' });
    pushToast({ message: 'Format removed', variant: 'info' });
    await refresh();
  } catch (err: any) {
    pushToast({ message: err.statusMessage || 'Failed to delete format', variant: 'error' });
  }
}
</script>

<template>
  <AdminLayout>
    <div class="max-w-4xl mx-auto space-y-6">
      <NuxtLink to="/admin/books" class="inline-flex items-center gap-1.5 text-xs font-semibold text-forest-900 hover:text-gold-600 transition-colors">
        <ArrowLeft :size="14" /> Return to Books Catalog
      </NuxtLink>

      <div class="bg-paper-surface rounded-2xl shadow-soft border border-paper-border p-6 sm:p-8 space-y-7">
        <div class="pb-4 border-b border-paper-border">
          <h1 class="font-display text-2xl font-bold text-forest-950">Edit Book: {{ book?.name }}</h1>
          <p class="text-xs text-ink-muted">Update book metadata, cover art, physical stock, and digital editions.</p>
        </div>

        <form class="space-y-5" @submit.prevent="handleUpdateBook">
          <div class="grid sm:grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-forest-950">Book Title *</label>
              <div class="flex gap-2">
                <input
                  v-model="name"
                  type="text"
                  class="flex-1 px-3.5 py-2.5 bg-paper-canvas/50 border border-paper-border rounded-xl text-xs outline-none focus:bg-white focus:border-forest-900 transition-all text-forest-950"
                  required
                />
                <button
                  type="button"
                  class="px-3 py-2.5 bg-paper-cream border border-paper-border hover:border-forest-900 text-forest-950 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all whitespace-nowrap shadow-2xs"
                  :disabled="isSearchingCover || !name"
                  @click="handleAutoFindCover"
                >
                  <RefreshCw v-if="isSearchingCover" :size="12" class="animate-spin" />
                  <Sparkles v-else :size="12" class="text-gold-600" />
                  <span>{{ isSearchingCover ? 'Searching...' : '🪄 Find Cover' }}</span>
                </button>
              </div>
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-forest-950">Author Name</label>
              <input
                v-model="author"
                type="text"
                class="w-full px-3.5 py-2.5 bg-paper-canvas/50 border border-paper-border rounded-xl text-xs outline-none focus:bg-white focus:border-forest-900 transition-all text-forest-950"
              />
            </div>
          </div>

          <div class="grid sm:grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-forest-950">Category</label>
              <select
                v-model="categoryId"
                class="w-full px-3.5 py-2.5 bg-paper-canvas/50 border border-paper-border rounded-xl text-xs outline-none focus:bg-white focus:border-forest-900 transition-all text-forest-950"
              >
                <option value="">Select category...</option>
                <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
              </select>
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-forest-950">Publishing Status</label>
              <select
                v-model="status"
                class="w-full px-3.5 py-2.5 bg-paper-canvas/50 border border-paper-border rounded-xl text-xs outline-none focus:bg-white focus:border-forest-900 transition-all text-forest-950"
              >
                <option value="published">Published &amp; Live</option>
                <option value="draft">Draft Mode</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-forest-950">Description / Synopsis</label>
            <textarea
              v-model="description"
              rows="3"
              class="w-full px-3.5 py-2.5 bg-paper-canvas/50 border border-paper-border rounded-xl text-xs outline-none focus:bg-white focus:border-forest-900 transition-all text-forest-950 resize-none"
            />
          </div>

          <!-- Cover Image Frame -->
          <div class="space-y-3 pt-3 border-t border-paper-border">
            <h3 class="text-xs font-bold uppercase text-forest-950 tracking-wider font-mono">Cover Image</h3>
            <div class="flex items-start gap-4">
              <div class="w-20 h-28 bg-paper-cream rounded-book border border-paper-border overflow-hidden flex items-center justify-center flex-shrink-0 shadow-xs">
                <img
                  v-if="coverUrl"
                  :src="coverUrl"
                  :alt="name ? `${name} Cover` : 'Cover'"
                  class="w-full h-full object-cover"
                  referrerpolicy="no-referrer"
                  @error="coverUrl = ''"
                />
                <BookOpen v-else :size="24" class="text-ink-muted opacity-40" />
              </div>
              <div class="space-y-2.5 flex-1">
                <div class="flex flex-wrap gap-2 items-center">
                  <button
                    type="button"
                    class="bg-forest-950 text-paper hover:bg-forest-900 text-xs font-bold px-3.5 py-2 rounded-xl inline-flex items-center gap-1.5 cursor-pointer transition-all shadow-subtle"
                    :disabled="isSearchingCover || !name"
                    @click="handleAutoFindCover"
                  >
                    <Sparkles :size="13" class="text-gold-300" /> Auto-Find HD Cover
                  </button>

                  <label class="cursor-pointer bg-white border border-paper-border text-forest-950 text-xs font-bold px-3.5 py-2 rounded-xl hover:bg-paper-cream transition-colors inline-flex items-center gap-1.5 shadow-2xs">
                    <Upload :size="13" /> {{ isUploadingCover ? 'Uploading...' : 'Upload Image' }}
                    <input type="file" accept="image/*" class="hidden" :disabled="isUploadingCover" @change="handleCoverUpload" />
                  </label>
                </div>

                <div class="space-y-1">
                  <label class="text-[11px] text-ink-muted flex items-center gap-1">
                    <LinkIcon :size="12" /> Direct Cover Image URL:
                  </label>
                  <input
                    v-model="coverUrl"
                    type="url"
                    placeholder="https://..."
                    class="w-full px-3.5 py-2 bg-paper-canvas/50 border border-paper-border rounded-xl text-xs outline-none focus:bg-white focus:border-forest-900 transition-all text-forest-950"
                  />
                </div>
              </div>
            </div>
          </div>

          <div v-if="formError" class="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
            <AlertCircle :size="14" class="flex-shrink-0" />
            <span>{{ formError }}</span>
          </div>

          <div class="flex justify-end pt-2">
            <button
              type="submit"
              class="bg-forest-950 hover:bg-forest-900 text-paper text-xs font-bold uppercase tracking-wider px-6 py-3 rounded-xl shadow-medium cursor-pointer transition-all active:scale-[0.98] disabled:opacity-50"
              :disabled="isSaving"
            >
              {{ isSaving ? 'Saving...' : 'Save Book Details' }}
            </button>
          </div>
        </form>

        <!-- Formats Section -->
        <div class="pt-6 border-t border-paper-border space-y-4">
          <h3 class="text-xs font-bold uppercase text-forest-950 tracking-wider font-mono">Active Editions &amp; Formats</h3>

          <div class="space-y-2.5">
            <div
              v-for="fmt in book?.formats"
              :key="fmt.id"
              class="p-3.5 bg-paper-canvas/60 border border-paper-border rounded-xl flex justify-between items-center text-xs"
            >
              <div class="flex items-center gap-3">
                <span class="font-bold uppercase text-forest-950 flex items-center gap-1.5 font-mono">
                  <component :is="fmt.format === 'hardcopy' ? Truck : Download" :size="13" class="text-gold-600" />
                  {{ fmt.format }}
                </span>
                <span class="font-mono font-bold text-forest-950">KSh {{ fmt.price }}</span>
                <span v-if="fmt.format === 'hardcopy'" class="text-ink-muted">({{ fmt.stock }} in stock)</span>
                <span v-else class="text-emerald-800 font-medium">{{ fmt.file_public_id ? 'Cloudflare R2 Ready ✓' : 'Digital Edition (File Optional)' }}</span>
              </div>
              
              <!-- Immediate Format Delete -->
              <button
                type="button"
                class="text-ink-muted hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                title="Remove format immediately"
                @click="handleDeleteFormat(fmt.id)"
              >
                <Trash2 :size="14" />
              </button>
            </div>
          </div>

          <!-- Add Format Form -->
          <div class="p-5 bg-paper-cream/60 border border-paper-border rounded-2xl space-y-3.5 shadow-2xs">
            <h4 class="text-xs font-bold text-forest-950 uppercase font-mono">Add Format / Edition</h4>
            <div class="grid sm:grid-cols-12 gap-3 items-end">
              <div class="sm:col-span-3 space-y-1">
                <label class="text-[10px] text-ink-muted font-semibold">Format Type</label>
                <select v-model="newFormatType" class="w-full px-3 py-2 bg-white border border-paper-border rounded-xl text-xs font-medium">
                  <option value="pdf">PDF eBook</option>
                  <option value="epub">EPUB eBook</option>
                  <option value="hardcopy">Physical Hardcopy</option>
                </select>
              </div>

              <div class="sm:col-span-3 space-y-1">
                <label class="text-[10px] text-ink-muted font-semibold">Price (KSh)</label>
                <input v-model.number="newFormatPrice" type="number" min="0" class="w-full px-3 py-2 bg-white border border-paper-border rounded-xl text-xs font-mono font-bold" />
              </div>

              <div v-if="newFormatType === 'hardcopy'" class="sm:col-span-4 space-y-1">
                <label class="text-[10px] text-ink-muted font-semibold">Stock Count</label>
                <input v-model.number="newFormatStock" type="number" min="0" class="w-full px-3 py-2 bg-white border border-paper-border rounded-xl text-xs font-mono font-medium" />
              </div>

              <div v-else class="sm:col-span-4 space-y-1">
                <label class="text-[10px] text-ink-muted font-semibold">Cloudflare R2 File (Optional)</label>
                <label class="w-full bg-white border border-paper-border text-forest-950 text-[11px] font-medium px-3 py-2 rounded-xl flex items-center justify-between cursor-pointer">
                  <span class="truncate">{{ newFormatFileKey ? 'R2 File Ready ✓' : (isUploadingNewEbook ? 'Uploading...' : 'Upload File') }}</span>
                  <input type="file" :accept="newFormatType === 'pdf' ? '.pdf' : '.epub'" class="hidden" :disabled="isUploadingNewEbook" @change="handleNewEbookUpload" />
                </label>
              </div>

              <div class="sm:col-span-2">
                <button type="button" class="w-full bg-forest-950 hover:bg-forest-900 text-paper text-xs font-bold py-2.5 rounded-xl shadow-subtle cursor-pointer transition-all active:scale-[0.98]" @click="handleAddFormat">
                  + Add
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>