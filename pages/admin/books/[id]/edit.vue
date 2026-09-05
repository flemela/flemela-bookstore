<!-- pages/admin/books/[id]/edit.vue -->
<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
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
  ShieldCheck,
  CheckCircle2,
  FolderPlus,
  X,
  Save,
} from 'lucide-vue-next';
import AdminLayout from '~/components/admin/AdminLayout.vue';
import AddCategoryModal from '~/components/admin/AddCategoryModal.vue';
import { useToast } from '~/composables/useToast';
import type { Book, BookFormatType } from '~/types';

definePageMeta({
  middleware: 'admin-auth',
});

const route = useRoute();
const { push: pushToast } = useToast();
const bookId = computed(() => route.params.id as string);

const { data: categories } = await useFetch<Array<{ id: string; name: string }>>('/api/admin/categories');
const { data: book, refresh, status: fetchStatus } = await useFetch<Book>(`/api/admin/books/${bookId.value}`);

// Dynamic Inline Category State
const showAddCategoryModal = ref(false);

// Book Form Fields
const name = ref('');
const author = ref('');
const categoryId = ref('');
const description = ref('');
const price = ref<number>(999);
const compareAtPrice = ref<number | null>(null);
const sku = ref('');
const badge = ref<'BESTSELLER' | 'FLASH_SALE' | 'NO1_PICK' | 'DEAL_OF_WEEK' | 'LIMITED_TIME' | null>(null);
const saleEndsAt = ref<string>('');
const status = ref<'draft' | 'published' | 'archived'>('published');

// Cover art state
const coverUrl = ref('');
const coverPublicId = ref('');
const isUploadingCover = ref(false);
const isSearchingCover = ref(false);

// Existing Formats (Editable in-place)
interface EditableFormat {
  id: string;
  format: BookFormatType;
  price: number;
  compare_at_price: number | null;
  stock: number | null;
  file_public_id: string | null;
  isSaving: boolean;
}

const existingFormats = ref<EditableFormat[]>([]);

// New Format Draft State
const newFormatType = ref<BookFormatType>('pdf');
const newFormatPrice = ref(149);
const newFormatCompareAtPrice = ref<number | null>(null);
const newFormatStock = ref<number | null>(null);
const newFormatFileKey = ref<string | null>(null);
const newFormatFileSize = ref<number | null>(null);
const isUploadingNewEbook = ref(false);
const newEbookUploadProgress = ref(0);

// Modal State: Cloudflare R2 Upload Confirmation Dialog
const showR2SuccessModal = ref(false);
const r2ConfirmedAsset = ref<{
  fileName: string;
  format: string;
  fileSizeMb: string;
  key: string;
} | null>(null);

const isSaving = ref(false);
const formError = ref<string | null>(null);

// -----------------------------------------------------------------------------
// Form Autofill Engine
// -----------------------------------------------------------------------------
function populateForm(data: Book | null | undefined): void {
  if (!data) return;

  name.value = data.name || '';

  // 1. Demux Author and Synopsis from Description
  let extractedAuthor = data.author || '';
  let cleanDesc = data.description || '';

  if (!extractedAuthor && cleanDesc) {
    const match = cleanDesc.match(/^(?:<p>)?(?:By|Author|Written by)[:\s]+([^<\n\r]+)(?:<\/p>|\n\n|\n|$)/i);
    if (match && match[1]) {
      extractedAuthor = match[1].trim();
      cleanDesc = cleanDesc.slice(match[0].length).trim();
    }
  }

  author.value = extractedAuthor;
  description.value = cleanDesc;

  // 2. Category & Status
  categoryId.value = data.category_id || '';
  status.value = data.status || 'published';

  // 3. Pricing & SKU
  price.value = data.price ? Number(data.price) : 999;
  compareAtPrice.value = data.compare_at_price ? Number(data.compare_at_price) : null;
  sku.value = data.sku || '';

  // 4. Badge & Sale Expiration
  badge.value = (data.badge as any) || null;

  if (data.sale_ends_at) {
    const d = new Date(data.sale_ends_at);
    if (!isNaN(d.getTime())) {
      const pad = (n: number) => String(n).padStart(2, '0');
      saleEndsAt.value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } else {
      saleEndsAt.value = '';
    }
  } else {
    saleEndsAt.value = '';
  }

  // 5. Cover Image
  const firstImg = data.images?.[0];
  if (firstImg) {
    coverUrl.value = typeof firstImg === 'string' ? firstImg : firstImg.image_url || '';
    coverPublicId.value = typeof firstImg === 'object' ? firstImg.image_public_id || '' : '';
  } else if ((data as any).cover_image_url) {
    coverUrl.value = (data as any).cover_image_url;
    coverPublicId.value = (data as any).cover_image_public_id || '';
  } else {
    coverUrl.value = '';
    coverPublicId.value = '';
  }

  // 6. Existing Formats
  existingFormats.value = (data.formats || []).map((f) => ({
    id: f.id,
    format: f.format,
    price: Number(f.price),
    compare_at_price: f.compare_at_price ? Number(f.compare_at_price) : null,
    stock: f.stock !== null ? Number(f.stock) : null,
    file_public_id: f.file_public_id,
    isSaving: false,
  }));
}

// Watcher guarantees immediate population on mount + whenever data loads asynchronously
watch(
  book,
  (newVal) => {
    populateForm(newVal);
  },
  { immediate: true }
);

onMounted(() => {
  if (book.value) {
    populateForm(book.value);
  }
});

function handleCategoryCreated(newCat: { id: string; name: string; slug: string }): void {
  if (categories.value) {
    categories.value.push({ id: newCat.id, name: newCat.name });
  }
  categoryId.value = newCat.id;
}

async function handleAutoFindCover(): Promise<void> {
  if (!name.value.trim()) {
    pushToast({ message: 'Enter a book title first', variant: 'error' });
    return;
  }

  isSearchingCover.value = true;
  try {
    const res = await $fetch<{ coverUrl: string | null; title: string; source: string | null }>(
      '/api/admin/books/find-cover',
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
      pushToast({
        message: `Discovered cover art from ${res.source === 'googlebooks' ? 'Google Books' : 'Apple Books'}!`,
        variant: 'success',
      });
    } else {
      pushToast({ message: 'No online cover found.', variant: 'info' });
    }
  } catch {
    pushToast({ message: 'Auto-discovery timed out.', variant: 'error' });
  } finally {
    isSearchingCover.value = false;
  }
}

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

async function handleNewEbookUpload(event: Event): Promise<void> {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  isUploadingNewEbook.value = true;
  newEbookUploadProgress.value = 0;

  try {
    const mimeType = file.type || (newFormatType.value === 'pdf' ? 'application/pdf' : 'application/epub+zip');

    const presigned = await $fetch<{ uploadUrl: string; key: string }>('/api/admin/books/upload-url', {
      method: 'POST',
      body: {
        filename: file.name,
        format: newFormatType.value,
        contentType: mimeType,
      },
    });

    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', presigned.uploadUrl);
      xhr.setRequestHeader('Content-Type', mimeType);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          newEbookUploadProgress.value = Math.round((e.loaded / e.total) * 100);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Cloudflare R2 returned HTTP ${xhr.status}`));
        }
      };

      xhr.onerror = () => {
        reject(new Error('Network error or CORS failure communicating with Cloudflare R2'));
      };

      xhr.send(file);
    });

    newFormatFileKey.value = presigned.key;
    newFormatFileSize.value = file.size;

    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
    r2ConfirmedAsset.value = {
      fileName: file.name,
      format: newFormatType.value.toUpperCase(),
      fileSizeMb: `${sizeMb} MB`,
      key: presigned.key,
    };
    showR2SuccessModal.value = true;
  } catch (err: any) {
    pushToast({ message: err.message || 'eBook upload to Cloudflare R2 failed', variant: 'error' });
  } finally {
    isUploadingNewEbook.value = false;
  }
}

async function handleUpdateBook(): Promise<void> {
  if (compareAtPrice.value !== null && compareAtPrice.value <= price.value) {
    formError.value = 'Original strike-through price must be strictly greater than selling price.';
    return;
  }

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
        category_id: categoryId.value || null,
        description: formattedDescription,
        price: Number(price.value),
        compare_at_price: compareAtPrice.value ? Number(compareAtPrice.value) : null,
        sku: sku.value?.trim() || null,
        badge: badge.value || null,
        sale_ends_at: saleEndsAt.value ? new Date(saleEndsAt.value).toISOString() : null,
        status: status.value,
        images: coverUrl.value
          ? [{ image_url: coverUrl.value.trim(), image_public_id: coverPublicId.value || 'cover_img' }]
          : undefined,
      },
    });

    pushToast({ message: 'Book details updated successfully!', variant: 'success' });
    await refresh();
  } catch (err: any) {
    formError.value = err.data?.message || err.statusMessage || 'Failed to update book';
  } finally {
    isSaving.value = false;
  }
}

async function handleUpdateExistingFormat(fmt: EditableFormat): Promise<void> {
  if (fmt.compare_at_price !== null && fmt.compare_at_price <= fmt.price) {
    pushToast({
      message: `Strike-through price for ${fmt.format.toUpperCase()} must be greater than its selling price.`,
      variant: 'error',
    });
    return;
  }

  fmt.isSaving = true;
  try {
    await $fetch(`/api/admin/books/${bookId.value}/formats/${fmt.id}`, {
      method: 'PATCH',
      body: {
        price: Number(fmt.price),
        compare_at_price: fmt.compare_at_price ? Number(fmt.compare_at_price) : null,
        stock: fmt.format === 'hardcopy' ? Number(fmt.stock || 0) : null,
      },
    });

    pushToast({ message: `Updated ${fmt.format.toUpperCase()} edition!`, variant: 'success' });
    await refresh();
  } catch (err: any) {
    pushToast({
      message: err.data?.message || err.statusMessage || 'Failed to update format',
      variant: 'error',
    });
  } finally {
    fmt.isSaving = false;
  }
}

async function handleAddFormat(): Promise<void> {
  const isDigital = newFormatType.value === 'pdf' || newFormatType.value === 'epub';

  if (
    newFormatCompareAtPrice.value !== null &&
    newFormatCompareAtPrice.value <= newFormatPrice.value
  ) {
    pushToast({
      message: 'Format strike-through price must be strictly greater than format selling price.',
      variant: 'error',
    });
    return;
  }

  try {
    await $fetch(`/api/admin/books/${bookId.value}/formats`, {
      method: 'POST',
      body: {
        format: newFormatType.value,
        price: Number(newFormatPrice.value),
        compare_at_price: newFormatCompareAtPrice.value ? Number(newFormatCompareAtPrice.value) : null,
        stock: newFormatType.value === 'hardcopy' ? Number(newFormatStock.value || 0) : null,
        file_url: isDigital ? newFormatFileKey.value || null : null,
        file_public_id: isDigital ? newFormatFileKey.value || null : null,
        file_size_bytes: isDigital ? newFormatFileSize.value || null : null,
      },
    });

    pushToast({ message: `Added ${newFormatType.value.toUpperCase()} format`, variant: 'success' });
    newFormatCompareAtPrice.value = null;
    newFormatFileKey.value = null;
    newFormatFileSize.value = null;
    await refresh();
  } catch (err: any) {
    pushToast({
      message: err.data?.message || err.statusMessage || 'Failed to add format',
      variant: 'error',
    });
  }
}

async function handleDeleteFormat(formatId: string): Promise<void> {
  try {
    await $fetch(`/api/admin/books/${bookId.value}/formats/${formatId}`, { method: 'DELETE' });
    pushToast({ message: 'Format removed', variant: 'info' });
    await refresh();
  } catch (err: any) {
    const errorMsg = err.data?.message || err.statusMessage || 'Failed to delete format';
    pushToast({ message: errorMsg, variant: 'error' });
  }
}
</script>

<template>
  <AdminLayout>
    <div class="max-w-4xl mx-auto space-y-6">
      <NuxtLink
        to="/admin/books"
        class="inline-flex items-center gap-1.5 text-xs font-semibold text-forest-900 hover:text-gold-600 transition-colors"
      >
        <ArrowLeft :size="14" /> Return to Books Catalog
      </NuxtLink>

      <div class="bg-paper-surface rounded-2xl shadow-soft border border-paper-border p-6 sm:p-8 space-y-7">
        <div class="pb-4 border-b border-paper-border flex items-center justify-between">
          <div>
            <h1 class="font-display text-2xl font-bold text-forest-950">
              Edit Book: {{ name || book?.name || 'Loading...' }}
            </h1>
            <p class="text-xs text-ink-muted">
              Update catalog details, categories, strike-through discounts, and reading formats.
            </p>
          </div>

          <span
            v-if="fetchStatus === 'pending'"
            class="text-[11px] font-mono text-gold-600 flex items-center gap-1.5 bg-paper-cream px-3 py-1 rounded-full border border-paper-border"
          >
            <RefreshCw :size="12" class="animate-spin" /> Loading data...
          </span>
        </div>

        <form class="space-y-5" @submit.prevent="handleUpdateBook">
          <!-- 1. General Details -->
          <div class="grid sm:grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-forest-950">Book Title *</label>
              <div class="flex gap-2">
                <input
                  v-model="name"
                  type="text"
                  placeholder="e.g. Atomic Habits"
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
                placeholder="e.g. James Clear"
                class="w-full px-3.5 py-2.5 bg-paper-canvas/50 border border-paper-border rounded-xl text-xs outline-none focus:bg-white focus:border-forest-900 transition-all text-forest-950"
              />
            </div>
          </div>

          <!-- 2. Pricing & SKU Row -->
          <div class="grid sm:grid-cols-3 gap-4">
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-forest-950">Catalog Selling Price (KSh) *</label>
              <input
                v-model.number="price"
                type="number"
                min="0"
                placeholder="999"
                class="w-full px-3.5 py-2.5 bg-paper-canvas/50 border border-paper-border rounded-xl text-xs font-mono font-bold outline-none focus:bg-white focus:border-forest-900 transition-all text-forest-950"
                required
              />
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-forest-950">Strike-through Price (KSh)</label>
              <input
                v-model.number="compareAtPrice"
                type="number"
                min="0"
                placeholder="e.g. 1500 (Optional)"
                class="w-full px-3.5 py-2.5 bg-paper-canvas/50 border border-paper-border rounded-xl text-xs font-mono outline-none focus:bg-white focus:border-forest-900 transition-all text-forest-950"
              />
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-forest-950">SKU / ISBN / Barcode</label>
              <input
                v-model="sku"
                type="text"
                placeholder="e.g. 9780735211292 (Optional)"
                class="w-full px-3.5 py-2.5 bg-paper-canvas/50 border border-paper-border rounded-xl text-xs font-mono outline-none focus:bg-white focus:border-forest-900 transition-all text-forest-950"
              />
            </div>
          </div>

          <!-- 3. Category & Status -->
          <div class="grid sm:grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <div class="flex justify-between items-center">
                <label class="text-xs font-semibold text-forest-950">Category</label>
                <button
                  type="button"
                  class="text-[11px] font-bold text-forest-900 hover:text-gold-600 flex items-center gap-1 cursor-pointer"
                  @click="showAddCategoryModal = true"
                >
                  <FolderPlus :size="12" />
                  <span>+ New Category</span>
                </button>
              </div>
              <select
                v-model="categoryId"
                class="w-full px-3.5 py-2.5 bg-paper-canvas/50 border border-paper-border rounded-xl text-xs outline-none focus:bg-white focus:border-forest-900 transition-all text-forest-950"
              >
                <option value="">Select category (or leave for default)...</option>
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

          <!-- 4. Promotions & Badges -->
          <div class="p-4 bg-paper-cream/60 rounded-xl border border-paper-border grid sm:grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="text-xs font-semibold text-forest-950">Promotional Badge / Placement</label>
              <select
                v-model="badge"
                class="w-full px-3 py-2 bg-white border border-paper-border rounded-xl text-xs outline-none focus:border-forest-900 font-semibold"
              >
                <option :value="null">None (Standard Catalog)</option>
                <option value="BESTSELLER">ðŸ”¥ Bestseller (Monthly Section)</option>
                <option value="NO1_PICK">â­ #1 Pick (Featured Top Slot)</option>
                <option value="FLASH_SALE">âš¡ Flash Sale (High Urgency)</option>
                <option value="DEAL_OF_WEEK">ðŸ·ï¸ Deal of the Week</option>
                <option value="LIMITED_TIME">â³ Limited Time Sale</option>
              </select>
            </div>

            <div class="space-y-1">
              <label class="text-xs font-semibold text-forest-950">Sale Expiration (Optional)</label>
              <input
                v-model="saleEndsAt"
                type="datetime-local"
                class="w-full px-3 py-1.5 bg-white border border-paper-border rounded-xl text-xs font-mono outline-none focus:border-forest-900"
              />
              <span class="text-[10px] text-ink-muted">Auto-expires flash sales to keep promotions fresh.</span>
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-forest-950">Description / Synopsis</label>
            <textarea
              v-model="description"
              rows="3"
              placeholder="Synopsis and details about the book..."
              class="w-full px-3.5 py-2.5 bg-paper-canvas/50 border border-paper-border rounded-xl text-xs outline-none focus:bg-white focus:border-forest-900 transition-all text-forest-950 resize-none"
            />
          </div>
		                    <!-- 5. Cover Art -->
          <div class="space-y-3 pt-3 border-t border-paper-border">
            <h3 class="text-xs font-bold uppercase text-forest-950 tracking-wider font-mono">Cover Image</h3>
            <div class="flex items-start gap-4">
              <div
                class="w-20 h-28 bg-paper-cream rounded-book border border-paper-border overflow-hidden flex items-center justify-center flex-shrink-0 shadow-xs"
              >
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

                  <label
                    class="cursor-pointer bg-white border border-paper-border text-forest-950 text-xs font-bold px-3.5 py-2 rounded-xl hover:bg-paper-cream transition-colors inline-flex items-center gap-1.5 shadow-2xs"
                  >
                    <Upload :size="13" />
                    {{ isUploadingCover ? 'Uploading...' : 'Upload Image' }}
                    <input
                      type="file"
                      accept="image/*"
                      class="hidden"
                      :disabled="isUploadingCover"
                      @change="handleCoverUpload"
                    />
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

          <div
            v-if="formError"
            class="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2"
          >
            <AlertCircle :size="14" class="flex-shrink-0" />
            <span>{{ formError }}</span>
          </div>

          <div class="flex justify-end pt-2">
            <button
              type="submit"
              class="bg-forest-950 hover:bg-forest-900 text-paper text-xs font-bold uppercase tracking-wider px-6 py-3 rounded-xl shadow-medium cursor-pointer transition-all active:scale-[0.98] disabled:opacity-50"
              :disabled="isSaving || isUploadingNewEbook"
            >
              {{ isSaving ? 'Saving...' : 'Save Book Details' }}
            </button>
          </div>
        </form>

        <!-- 6. Active Editions & Formats (Editable In-Place) -->
        <div class="pt-6 border-t border-paper-border space-y-4">
          <h3 class="text-xs font-bold uppercase text-forest-950 tracking-wider font-mono">
            Active Editions &amp; Formats
          </h3>

          <div class="space-y-3">
            <div
              v-for="fmt in existingFormats"
              :key="fmt.id"
              class="p-4 bg-paper-canvas/60 border border-paper-border rounded-xl grid sm:grid-cols-12 gap-3 items-center text-xs"
            >
			<div class="sm:col-span-2">
                <span class="font-bold uppercase text-forest-950 flex items-center gap-1.5 font-mono">
                  <component
                    :is="fmt.format === 'hardcopy' ? Truck : Download"
                    :size="13"
                    class="text-gold-600"
                  />
                  {{ fmt.format }}
                </span>
                <span v-if="fmt.format !== 'hardcopy'" class="text-[10px] text-emerald-800 font-medium block">
                  {{ fmt.file_public_id ? 'Cloudflare R2 Ready âœ“' : 'File Optional' }}
                </span>
              </div>

              <!-- Price Input -->
              <div class="sm:col-span-3 space-y-1">
                <label class="text-[10px] text-ink-muted font-semibold">Sale Price (KSh)</label>
                <input
                  v-model.number="fmt.price"
                  type="number"
                  min="0"
                  class="w-full px-2.5 py-1.5 bg-white border border-paper-border rounded-lg text-xs font-mono font-bold"
                />
              </div>

              <!-- Strike-Through Price Input -->
              <div class="sm:col-span-3 space-y-1">
                <label class="text-[10px] text-ink-muted font-semibold">Strike-through (KSh)</label>
                <input
                  v-model.number="fmt.compare_at_price"
                  type="number"
                  min="0"
                  placeholder="e.g. 1500"
                  class="w-full px-2.5 py-1.5 bg-white border border-paper-border rounded-lg text-xs font-mono"
                />
              </div>

              <!-- Stock Input for Hardcopy -->
              <div v-if="fmt.format === 'hardcopy'" class="sm:col-span-2 space-y-1">
                <label class="text-[10px] text-ink-muted font-semibold">Stock Count</label>
                <input
                  v-model.number="fmt.stock"
                  type="number"
                  min="0"
                  class="w-full px-2.5 py-1.5 bg-white border border-paper-border rounded-lg text-xs font-mono font-bold"
                />
              </div>
              <div v-else class="sm:col-span-2"></div>

              <!-- Actions: Save & Delete -->
              <div class="sm:col-span-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  class="p-1.5 bg-forest-950 text-paper rounded-lg hover:bg-forest-900 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1 shadow-2xs"
                  :disabled="fmt.isSaving"
                  title="Update format price and stock"
                  @click="handleUpdateExistingFormat(fmt)"
                >
                  <RefreshCw v-if="fmt.isSaving" :size="12" class="animate-spin" />
                  <Save v-else :size="12" />
                  <span class="text-[10px] font-bold uppercase">Update</span>
                </button>

                <button
                  type="button"
                  class="p-1.5 text-ink-muted hover:text-red-700 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                  title="Remove format"
                  @click="handleDeleteFormat(fmt.id)"
                >
                  <Trash2 :size="14" />
                </button>
              </div>
            </div>
          </div>

          <!-- Add New Format Draft Form -->
          <div class="p-5 bg-paper-cream/60 border border-paper-border rounded-2xl space-y-3.5 shadow-2xs">
            <h4 class="text-xs font-bold text-forest-950 uppercase font-mono">
              + Add Another Format / Edition
            </h4>

            <div class="grid sm:grid-cols-12 gap-3 items-end">
              <div class="sm:col-span-2 space-y-1">
                <label class="text-[10px] text-ink-muted font-semibold">Format</label>
                <select
                  v-model="newFormatType"
                  class="w-full px-3 py-2 bg-white border border-paper-border rounded-xl text-xs font-medium"
                >
                  <option value="pdf">PDF eBook</option>
                  <option value="epub">EPUB eBook</option>
                  <option value="hardcopy">Physical Hardcopy</option>
                </select>
              </div>

              <div class="sm:col-span-2 space-y-1">
                <label class="text-[10px] text-ink-muted font-semibold">Sale (KSh) *</label>
                <input
                  v-model.number="newFormatPrice"
                  type="number"
                  min="1"
                  class="w-full px-3 py-2 bg-white border border-paper-border rounded-xl text-xs font-mono font-bold"
                />
              </div>

              <div class="sm:col-span-3 space-y-1">
                <label class="text-[10px] text-ink-muted font-semibold">Strike-through (KSh)</label>
                <input
                  v-model.number="newFormatCompareAtPrice"
                  type="number"
                  min="1"
                  placeholder="e.g. 1200"
                  class="w-full px-3 py-2 bg-white border border-paper-border rounded-xl text-xs font-mono"
                />
              </div>

              <div v-if="newFormatType === 'hardcopy'" class="sm:col-span-3 space-y-1">
                <label class="text-[10px] text-ink-muted font-semibold">Stock Count</label>
                <input
                  v-model.number="newFormatStock"
                  type="number"
                  min="0"
                  class="w-full px-3 py-2 bg-white border border-paper-border rounded-xl text-xs font-mono font-medium"
                />
              </div>

              <!-- Upload File Picker with Real-Time Progress -->
              <div v-else class="sm:col-span-3 space-y-1">
                <label class="text-[10px] text-ink-muted font-semibold">File (Cloudflare R2)</label>

                <div v-if="isUploadingNewEbook" class="space-y-1">
                  <div class="flex justify-between text-[10px] font-mono text-forest-950 font-bold">
                    <span>Uploading...</span>
                    <span>{{ newEbookUploadProgress }}%</span>
                  </div>
                  <div class="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      class="bg-forest-950 h-full transition-all duration-150 rounded-full"
                      :style="{ width: `${newEbookUploadProgress}%` }"
                    />
                  </div>
                </div>

                <div v-else-if="newFormatFileKey" class="flex items-center justify-between bg-emerald-50 border border-emerald-300 px-2.5 py-1.5 rounded-xl text-[11px]">
                  <span class="text-emerald-900 font-semibold truncate flex items-center gap-1">
                    <ShieldCheck :size="13" class="text-emerald-700" /> R2 Asset Verified
                  </span>
                  <button
                    type="button"
                    class="text-ink-muted hover:text-red-700 text-[10px] font-mono underline ml-1 cursor-pointer"
                    @click="newFormatFileKey = null"
                  >
                    Clear
                  </button>
                </div>

                <label
                  v-else
                  class="w-full bg-white border border-paper-border text-forest-950 text-[11px] font-medium px-3 py-2 rounded-xl flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <span class="truncate">Upload {{ newFormatType.toUpperCase() }}</span>
                  <input
                    type="file"
                    :accept="newFormatType === 'pdf' ? '.pdf' : '.epub'"
                    class="hidden"
                    :disabled="isUploadingNewEbook"
                    @change="handleNewEbookUpload"
                  />
                </label>
              </div>

              <div class="sm:col-span-2">
                <button
                  type="button"
                  class="w-full bg-forest-950 hover:bg-forest-900 text-paper text-xs font-bold py-2.5 rounded-xl shadow-subtle cursor-pointer transition-all active:scale-[0.98] disabled:opacity-50"
                  :disabled="isUploadingNewEbook"
                  @click="handleAddFormat"
                >
                  + Add
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
	<!-- DIALOGUE MODAL: Cloudflare R2 Upload Verification -->
    <Teleport to="body">
      <div
        v-if="showR2SuccessModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      >
        <div class="bg-white rounded-2xl shadow-2xl border border-paper-border max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
          <div class="flex items-start justify-between pb-2 border-b border-paper-border">
            <div class="flex items-center gap-2 text-emerald-800 font-display font-bold text-base">
              <CheckCircle2 :size="20" class="text-emerald-600" />
              <span>Cloudflare R2 Asset Verified</span>
            </div>
            <button
              type="button"
              class="text-ink-muted hover:text-ink p-1 cursor-pointer"
              @click="showR2SuccessModal = false"
            >
              <X :size="16" />
            </button>
          </div>

          <div class="p-4 bg-paper-cream/60 rounded-xl border border-gold-300 space-y-2 text-xs">
            <div class="flex justify-between">
              <span class="text-ink-muted">File:</span>
              <strong class="text-forest-950 font-mono truncate max-w-[200px]">{{ r2ConfirmedAsset?.fileName }}</strong>
            </div>
            <div class="flex justify-between">
              <span class="text-ink-muted">Format:</span>
              <span class="font-mono font-bold text-forest-950">{{ r2ConfirmedAsset?.format }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-ink-muted">Payload Size:</span>
              <span class="font-mono font-bold text-forest-950">{{ r2ConfirmedAsset?.fileSizeMb }}</span>
            </div>
            <div class="pt-2 border-t border-paper-border/60">
              <span class="text-[10px] text-ink-muted block">Storage Key:</span>
              <code class="text-[10px] font-mono text-forest-950 break-all bg-white px-2 py-1 rounded block mt-0.5 border border-ink-border">
                {{ r2ConfirmedAsset?.key }}
              </code>
            </div>
          </div>

          <p class="text-[11px] text-ink-muted leading-relaxed">
            This digital file is confirmed in your private R2 bucket. Saving this book makes it ready for customer purchase and signed token delivery.
          </p>

          <div class="flex justify-end pt-2">
            <button
              type="button"
              class="bg-forest-950 text-paper text-xs font-bold uppercase px-5 py-2.5 rounded-xl hover:bg-forest-900 cursor-pointer transition-colors shadow-sm"
              @click="showR2SuccessModal = false"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- INLINE MODAL: Create New Category on the fly -->
    <AddCategoryModal
      :open="showAddCategoryModal"
      @close="showAddCategoryModal = false"
      @created="handleCategoryCreated"
    />
  </AdminLayout>
</template>