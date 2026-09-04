<!-- pages/admin/books/new.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  ArrowLeft,
  Trash2,
  Upload,
  BookOpen,
  AlertCircle,
  Sparkles,
  Link as LinkIcon,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  FolderPlus,
  X,
} from 'lucide-vue-next';
import AdminLayout from '~/components/admin/AdminLayout.vue';
import AddCategoryModal from '~/components/admin/AddCategoryModal.vue';
import { useToast } from '~/composables/useToast';
import type { BookFormatType } from '~/types';

definePageMeta({
  middleware: 'admin-auth',
});

const router = useRouter();
const { push: pushToast } = useToast();

const { data: categories } = await useFetch<Array<{ id: string; name: string }>>('/api/admin/categories');

// Dynamic Inline Category State
const showAddCategoryModal = ref(false);

// Book base fields
const name = ref('');
const author = ref('');
const categoryId = ref('');
const description = ref('');
const price = ref(999);
const compareAtPrice = ref<number | null>(null);
const badge = ref<'BESTSELLER' | 'FLASH_SALE' | 'NO1_PICK' | 'DEAL_OF_WEEK' | 'LIMITED_TIME' | null>(null);
const saleEndsAt = ref<string>('');
const status = ref<'draft' | 'published'>('published');

// Cover art state
const coverUrl = ref('');
const coverPublicId = ref('');
const isUploadingCover = ref(false);
const isSearchingCover = ref(false);

interface FormatDraft {
  format: BookFormatType;
  price: number;
  compare_at_price: number | null;
  stock: number | null;
  file_url: string | null;
  file_public_id: string | null;
  file_size_bytes: number | null;
  uploading: boolean;
  uploadProgress: number;
  fileName?: string;
}

const formats = ref<FormatDraft[]>([
  {
    format: 'hardcopy',
    price: 999,
    compare_at_price: null,
    stock: 25,
    file_url: null,
    file_public_id: null,
    file_size_bytes: null,
    uploading: false,
    uploadProgress: 0,
  },
  {
    format: 'pdf',
    price: 149,
    compare_at_price: null,
    stock: null,
    file_url: null,
    file_public_id: null,
    file_size_bytes: null,
    uploading: false,
    uploadProgress: 0,
  },
]);

// Modal State: Cloudflare R2 Upload Confirmation Dialog
const showR2SuccessModal = ref(false);
const r2ConfirmedAsset = ref<{
  fileName: string;
  format: string;
  fileSizeMb: string;
  key: string;
} | null>(null);

const isSubmitting = ref(false);
const formError = ref<string | null>(null);

const isAnyUploadInProgress = computed(() => {
  return isUploadingCover.value || formats.value.some((f) => f.uploading);
});

function handleCategoryCreated(newCat: { id: string; name: string; slug: string }): void {
  if (categories.value) {
    categories.value.push({ id: newCat.id, name: newCat.name });
  }
  categoryId.value = newCat.id;
}

function addFormatRow(type: BookFormatType): void {
  if (formats.value.some((f) => f.format === type)) return;
  formats.value.push({
    format: type,
    price: type === 'hardcopy' ? 999 : 149,
    compare_at_price: null,
    stock: type === 'hardcopy' ? 20 : null,
    file_url: null,
    file_public_id: null,
    file_size_bytes: null,
    uploading: false,
    uploadProgress: 0,
  });
}

function removeFormatRow(index: number): void {
  formats.value.splice(index, 1);
}

function removeFormatFile(index: number): void {
  formats.value[index].file_url = null;
  formats.value[index].file_public_id = null;
  formats.value[index].file_size_bytes = null;
  formats.value[index].fileName = undefined;
  formats.value[index].uploadProgress = 0;
}

async function handleAutoFindCover(): Promise<void> {
  if (!name.value.trim()) {
    pushToast({ message: 'Enter a book title first to auto-discover cover art', variant: 'error' });
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
        message: `Discovered cover art from ${res.source === 'googlebooks' ? 'Google Books' : 'Open Library'}!`,
        variant: 'success',
      });
    } else {
      pushToast({ message: 'No online cover found. You can upload or paste an image link.', variant: 'info' });
    }
  } catch {
    pushToast({ message: 'Auto-discovery timed out. You can upload an image directly.', variant: 'error' });
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
      pushToast({ message: 'Cover image uploaded to Cloudinary', variant: 'success' });
    }
  } catch {
    pushToast({ message: 'Cloudinary upload failed', variant: 'error' });
  } finally {
    isUploadingCover.value = false;
  }
}

async function handleEbookUpload(event: Event, index: number): Promise<void> {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  const currentFmt = formats.value[index];
  currentFmt.uploading = true;
  currentFmt.uploadProgress = 0;
  currentFmt.fileName = file.name;

  try {
    const mimeType = file.type || (currentFmt.format === 'pdf' ? 'application/pdf' : 'application/epub+zip');

    const presigned = await $fetch<{ uploadUrl: string; key: string }>('/api/admin/books/upload-url', {
      method: 'POST',
      body: {
        filename: file.name,
        format: currentFmt.format,
        contentType: mimeType,
      },
    });

    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', presigned.uploadUrl);
      xhr.setRequestHeader('Content-Type', mimeType);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          currentFmt.uploadProgress = Math.round((e.loaded / e.total) * 100);
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

    currentFmt.file_url = presigned.key;
    currentFmt.file_public_id = presigned.key;
    currentFmt.file_size_bytes = file.size;

    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);

    r2ConfirmedAsset.value = {
      fileName: file.name,
      format: currentFmt.format.toUpperCase(),
      fileSizeMb: `${sizeMb} MB`,
      key: presigned.key,
    };
    showR2SuccessModal.value = true;
  } catch (err: any) {
    pushToast({
      message: err.message || 'eBook upload to Cloudflare R2 failed',
      variant: 'error',
    });
    removeFormatFile(index);
  } finally {
    currentFmt.uploading = false;
  }
}

async function handleSubmit(): Promise<void> {
  if (!name.value.trim() || formats.value.length === 0) return;

  if (isAnyUploadInProgress.value) {
    pushToast({
      message: 'Please wait for file uploads to complete before saving.',
      variant: 'error',
    });
    return;
  }

  for (const f of formats.value) {
    if (f.compare_at_price !== null && f.compare_at_price <= f.price) {
      formError.value = `Strike-through price for ${f.format.toUpperCase()} must be greater than its selling price.`;
      return;
    }
  }

  isSubmitting.value = true;
  formError.value = null;

  try {
    await $fetch('/api/admin/books', {
      method: 'POST',
      body: {
        name: name.value.trim(),
        author: author.value.trim() || undefined,
        category_id: categoryId.value || null,
        description: description.value.trim() || undefined,
        price: formats.value[0]?.price || price.value,
        compare_at_price: compareAtPrice.value || null,
        badge: badge.value || null,
        sale_ends_at: saleEndsAt.value ? new Date(saleEndsAt.value).toISOString() : null,
        cover_image_url: coverUrl.value.trim() || undefined,
        cover_image_public_id: coverPublicId.value || undefined,
        status: status.value,
        formats: formats.value.map((f) => ({
          format: f.format,
          price: Number(f.price),
          compare_at_price: f.compare_at_price ? Number(f.compare_at_price) : null,
          file_url: f.file_url,
          file_public_id: f.file_public_id,
          file_size_bytes: f.file_size_bytes,
          stock: f.format === 'hardcopy' ? Number(f.stock) : null,
        })),
      },
    });

    pushToast({ message: `Book "${name.value}" created and published!`, variant: 'success' });
    router.push('/admin/books');
  } catch (err: any) {
    formError.value = err.data?.message || err.data?.statusMessage || err.statusMessage || 'Failed to save book';
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <AdminLayout>
    <div class="max-w-4xl mx-auto space-y-6">
      <NuxtLink to="/admin/books" class="inline-flex items-center gap-1.5 text-xs font-bold text-forest-900 hover:underline">
        <ArrowLeft :size="14" /> Back to Books
      </NuxtLink>

      <div class="bg-white rounded-xl shadow-subtle border border-ink-border p-6 sm:p-8 space-y-6">
        <div class="pb-4 border-b border-ink-border">
          <h1 class="font-display text-2xl font-bold text-forest-950">Add New Book</h1>
          <p class="text-xs text-ink-muted">
            Configure catalog details, custom categories, strike-through discounts, and verified Cloudflare R2 digital storage.
          </p>
        </div>

        <form class="space-y-6" @submit.prevent="handleSubmit">
          <!-- 1. General Details -->
          <div class="space-y-4">
            <h3 class="text-xs font-bold uppercase text-forest-950 tracking-wider font-mono">
              Book Information
            </h3>

            <div class="grid sm:grid-cols-2 gap-4">
              <div class="space-y-1">
                <label class="text-xs font-semibold text-forest-950">Book Title *</label>
                <div class="flex gap-2">
                  <input
                    v-model="name"
                    type="text"
                    placeholder="e.g. Atomic Habits"
                    class="flex-1 px-3 py-2 border border-ink-border rounded text-xs outline-none focus:border-forest-900"
                    required
                    @blur="
                      () => {
                        if (!coverUrl && name) handleAutoFindCover();
                      }
                    "
                  />
                  <button
                    type="button"
                    class="px-3 py-2 bg-paper-cream border border-ink-border hover:border-forest-900 text-forest-950 rounded text-xs font-bold flex items-center gap-1 cursor-pointer transition-all whitespace-nowrap"
                    :disabled="isSearchingCover || !name"
                    @click="handleAutoFindCover"
                  >
                    <RefreshCw v-if="isSearchingCover" :size="12" class="animate-spin" />
                    <Sparkles v-else :size="12" class="text-gold-600" />
                    <span>{{ isSearchingCover ? 'Searching...' : '🪄 Find Cover' }}</span>
                  </button>
                </div>
              </div>

              <div class="space-y-1">
                <label class="text-xs font-semibold text-forest-950">Author Name</label>
                <input
                  v-model="author"
                  type="text"
                  placeholder="e.g. James Clear"
                  class="w-full px-3 py-2 border border-ink-border rounded text-xs outline-none focus:border-forest-900"
                />
              </div>
            </div>

            <div class="grid sm:grid-cols-2 gap-4">
              <!-- Category Selector with Inline + New Category Trigger -->
              <div class="space-y-1">
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
                  class="w-full px-3 py-2 border border-ink-border rounded text-xs outline-none focus:border-forest-900 bg-white"
                >
                  <option value="">Select category (or leave for default)...</option>
                  <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
                </select>
              </div>

              <div class="space-y-1">
                <label class="text-xs font-semibold text-forest-950">Publishing Status</label>
                <select
                  v-model="status"
                  class="w-full px-3 py-2 border border-ink-border rounded text-xs outline-none focus:border-forest-900 bg-white"
                >
                  <option value="published">Published &amp; Live</option>
                  <option value="draft">Draft Mode</option>
                </select>
              </div>
            </div>

            <!-- Merchandising & Compare-at Price -->
            <div class="p-4 bg-paper-cream/60 rounded-xl border border-ink-border grid sm:grid-cols-2 gap-4">
              <div class="space-y-1">
                <label class="text-xs font-semibold text-forest-950">
                  Promotional Badge / Placement
                </label>
                <select
                  v-model="badge"
                  class="w-full px-3 py-2 bg-white border border-ink-border rounded text-xs outline-none focus:border-forest-900 font-semibold"
                >
                  <option :value="null">None (Standard Catalog)</option>
                  <option value="BESTSELLER">🔥 Bestseller (Monthly Section)</option>
                  <option value="NO1_PICK">⭐ #1 Pick (Featured Top Slot)</option>
                  <option value="FLASH_SALE">⚡ Flash Sale (High Urgency)</option>
                  <option value="DEAL_OF_WEEK">🏷️ Deal of the Week</option>
                  <option value="LIMITED_TIME">⏳ Limited Time Sale</option>
                </select>
              </div>

              <div class="space-y-1">
                <label class="text-xs font-semibold text-forest-950">Sale Expiration (Optional)</label>
                <input
                  v-model="saleEndsAt"
                  type="datetime-local"
                  class="w-full px-3 py-1.5 bg-white border border-ink-border rounded text-xs font-mono outline-none focus:border-forest-900"
                />
                <span class="text-[10px] text-ink-muted">
                  Auto-removes flash sale badge once passed.
                </span>
              </div>
            </div>

            <div class="space-y-1">
              <label class="text-xs font-semibold text-forest-950">Description / Synopsis</label>
              <textarea
                v-model="description"
                rows="3"
                placeholder="Overview of the book..."
                class="w-full px-3 py-2 border border-ink-border rounded text-xs outline-none focus:border-forest-900 resize-none"
              />
            </div>
          </div>

          <!-- 2. Cover Art -->
          <div class="space-y-3 pt-4 border-t border-ink-border">
            <h3 class="text-xs font-bold uppercase text-forest-950 tracking-wider font-mono">
              Cover Art
            </h3>
            <div class="flex items-start gap-4">
              <div
                class="w-20 h-28 bg-paper-cream rounded border border-ink-border overflow-hidden flex items-center justify-center flex-shrink-0 shadow-sm relative"
              >
                <img
                  v-if="coverUrl"
                  :src="coverUrl"
                  :alt="name ? `${name} Cover` : 'Cover'"
                  class="w-full h-full object-cover"
                  @error="coverUrl = ''"
                />
                <BookOpen v-else :size="24" class="text-ink-muted opacity-40" />
              </div>
              <div class="space-y-2 flex-1">
                <div class="flex flex-wrap gap-2 items-center">
                  <button
                    type="button"
                    class="bg-forest-950 text-white hover:bg-forest-800 text-xs font-bold px-3 py-1.5 rounded inline-flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                    :disabled="isSearchingCover || !name"
                    @click="handleAutoFindCover"
                  >
                    <Sparkles :size="13" class="text-gold-300" /> Auto-Find HD Cover
                  </button>

                  <label
                    class="cursor-pointer bg-white border border-ink-border text-forest-950 text-xs font-bold px-3 py-1.5 rounded hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5 shadow-xs"
                  >
                    <Upload :size="13" /> {{ isUploadingCover ? 'Uploading...' : 'Upload File' }}
                    <input
                      type="file"
                      accept="image/*"
                      class="hidden"
                      :disabled="isUploadingCover"
                      @change="handleCoverUpload"
                    />
                  </label>
                </div>

                <div class="space-y-1 pt-1">
                  <label class="text-[11px] text-ink-muted flex items-center gap-1">
                    <LinkIcon :size="12" /> Direct Cover Image URL:
                  </label>
                  <input
                    v-model="coverUrl"
                    type="url"
                    placeholder="https://..."
                    class="w-full px-3 py-1.5 border border-ink-border rounded text-xs outline-none focus:border-forest-900"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- 3. Formats & Verified Cloudflare R2 Uploads -->
        	<div class="space-y-4 pt-4 border-t border-ink-border">
            <div class="flex justify-between items-center">
              <div>
                <h3 class="text-xs font-bold uppercase text-forest-950 tracking-wider font-mono">
                  Reading Formats &amp; Digital Assets
                </h3>
                <p class="text-[11px] text-ink-muted">
                  Stream files directly into private Cloudflare R2 storage buckets.
                </p>
              </div>
              <div class="flex gap-2">
                <button
                  type="button"
                  class="text-[10px] font-mono font-bold uppercase px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded hover:bg-amber-100 cursor-pointer"
                  @click="addFormatRow('hardcopy')"
                >
                  + Hardcopy
                </button>
                <button
                  type="button"
                  class="text-[10px] font-mono font-bold uppercase px-2.5 py-1 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded hover:bg-emerald-100 cursor-pointer"
                  @click="addFormatRow('pdf')"
                >
                  + PDF
                </button>
                <button
                  type="button"
                  class="text-[10px] font-mono font-bold uppercase px-2.5 py-1 bg-blue-50 text-blue-900 border border-blue-200 rounded hover:bg-blue-100 cursor-pointer"
                  @click="addFormatRow('epub')"
                >
                  + EPUB
                </button>
              </div>
            </div>

            <div class="space-y-3">
              <div
                v-for="(fmt, idx) in formats"
                :key="fmt.format"
                class="p-4 bg-slate-50 border border-ink-border rounded-xl grid sm:grid-cols-12 gap-3 items-center"
              >
                <div class="sm:col-span-2">
                  <span class="text-xs font-bold uppercase text-forest-950 font-mono">{{ fmt.format }}</span>
                </div>

                <div class="sm:col-span-2 space-y-1">
                  <label class="text-[10px] text-ink-muted font-semibold">Sale (KSh) *</label>
                  <input
                    v-model.number="fmt.price"
                    type="number"
                    min="1"
                    class="w-full px-2.5 py-1.5 bg-white border border-ink-border rounded text-xs font-mono font-bold"
                  />
                </div>

                <div class="sm:col-span-3 space-y-1">
                  <label class="text-[10px] text-ink-muted font-semibold">Strike-through (KSh)</label>
                  <input
                    v-model.number="fmt.compare_at_price"
                    type="number"
                    min="1"
                    placeholder="e.g. 1200"
                    class="w-full px-2.5 py-1.5 bg-white border border-ink-border rounded text-xs font-mono"
                  />
                </div>

                <div v-if="fmt.format === 'hardcopy'" class="sm:col-span-4 space-y-1">
                  <label class="text-[10px] text-ink-muted font-semibold">Physical Stock</label>
                  <input
                    v-model.number="fmt.stock"
                    type="number"
                    min="0"
                    class="w-full px-2.5 py-1.5 bg-white border border-ink-border rounded text-xs font-mono"
                  />
                </div>

                <!-- Digital Format File Picker with Real-Time Progress -->
                <div v-else class="sm:col-span-4 space-y-1">
                  <label class="text-[10px] text-ink-muted font-semibold">Digital File (Cloudflare R2)</label>
                  
                  <div v-if="fmt.uploading" class="space-y-1">
                    <div class="flex justify-between text-[10px] font-mono text-forest-950 font-bold">
                      <span>Uploading to R2...</span>
                      <span>{{ fmt.uploadProgress }}%</span>
                    </div>
                    <div class="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        class="bg-forest-950 h-full transition-all duration-150 rounded-full"
                        :style="{ width: `${fmt.uploadProgress}%` }"
                      />
                    </div>
                  </div>

                  <div v-else-if="fmt.file_public_id" class="flex items-center justify-between bg-emerald-50 border border-emerald-300 px-2.5 py-1 rounded-lg text-[11px]">
                    <span class="text-emerald-900 font-semibold truncate flex items-center gap-1">
                      <ShieldCheck :size="13" class="text-emerald-700" /> R2 Asset Verified
                    </span>
                    <button
                      type="button"
                      class="text-ink-muted hover:text-red-700 text-[10px] font-mono underline ml-2"
                      @click="removeFormatFile(idx)"
                    >
                      Remove
                    </button>
                  </div>

                  <label
                    v-else
                    class="w-full bg-white border border-ink-border text-forest-950 text-[11px] font-medium px-2 py-1.5 rounded flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    <span class="truncate">Upload {{ fmt.format.toUpperCase() }} to R2</span>
                    <input
                      type="file"
                      :accept="fmt.format === 'pdf' ? '.pdf' : '.epub'"
                      class="hidden"
                      :disabled="fmt.uploading"
                      @change="handleEbookUpload($event, idx)"
                    />
                  </label>
                </div>

                <div class="sm:col-span-1 text-right">
                  <button
                    type="button"
                    class="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                    @click="removeFormatRow(idx)"
                  >
                    <Trash2 :size="14" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div
            v-if="formError"
            class="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-center gap-2"
          >
            <AlertCircle :size="14" class="flex-shrink-0" />
            <span>{{ formError }}</span>
          </div>

          <div class="pt-4 border-t border-ink-border flex justify-end gap-3">
            <NuxtLink
              to="/admin/books"
              class="px-4 py-2.5 border border-ink-border rounded text-xs font-semibold hover:bg-slate-50"
            >
              Cancel
            </NuxtLink>
            <button
              type="submit"
              class="bg-forest-900 text-white text-xs font-bold uppercase px-6 py-2.5 rounded hover:bg-forest-800 transition-colors shadow cursor-pointer disabled:opacity-50 flex items-center gap-2"
              :disabled="isSubmitting || isAnyUploadInProgress"
            >
              <RefreshCw v-if="isSubmitting || isAnyUploadInProgress" :size="14" class="animate-spin" />
              <span>{{ isAnyUploadInProgress ? 'Upload in Progress...' : (isSubmitting ? 'Saving Book...' : 'Save & Publish Book') }}</span>
            </button>
          </div>
        </form>
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
            This digital file is now stored in your private R2 bucket. Customers who purchase this edition will receive verified, expiring signed tokens.
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