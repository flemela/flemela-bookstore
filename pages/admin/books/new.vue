<!-- pages/admin/books/new.vue -->
<script setup lang="ts">
import { ref } from 'vue';
import {
  ArrowLeft,
  Trash2,
  Upload,
  BookOpen,
  AlertCircle,
  Sparkles,
  Link as LinkIcon,
  RefreshCw,
} from 'lucide-vue-next';
import AdminLayout from '~/components/admin/AdminLayout.vue';
import { useToast } from '~/composables/useToast';
import type { BookFormatType } from '~/types';

definePageMeta({
  middleware: 'admin-auth',
});

const router = useRouter();
const { push: pushToast } = useToast();

const { data: categories } = await useFetch<Array<{ id: string; name: string }>>('/api/admin/categories');

// Book base fields
const name = ref('');
const author = ref('');
const categoryId = ref('');
const description = ref('');
const price = ref(999);
const compareAtPrice = ref<number | null>(1200);
const badge = ref<
  'BESTSELLER' | 'FLASH_SALE' | 'NO1_PICK' | 'DEAL_OF_WEEK' | 'LIMITED_TIME' | null
>(null);
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
}

const formats = ref<FormatDraft[]>([
  {
    format: 'hardcopy',
    price: 999,
    compare_at_price: 1200,
    stock: 25,
    file_url: null,
    file_public_id: null,
    file_size_bytes: null,
    uploading: false,
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
  },
]);

const isSubmitting = ref(false);
const formError = ref<string | null>(null);

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
  });
}

function removeFormatRow(index: number): void {
  formats.value.splice(index, 1);
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
        message: `Discovered cover art from ${
          res.source === 'googlebooks' ? 'Google Books' : 'Open Library'
        }!`,
        variant: 'success',
      });
    } else {
      pushToast({
        message: 'No online cover found. You can upload or paste an image link.',
        variant: 'info',
      });
    }
  } catch {
    pushToast({
      message: 'Auto-discovery timed out. You can upload a photo directly.',
      variant: 'error',
    });
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

  formats.value[index].uploading = true;
  try {
    const presigned = await $fetch<{ uploadUrl: string; key: string }>(
      '/api/admin/books/upload-url',
      {
        method: 'POST',
        body: {
          filename: file.name,
          format: formats.value[index].format,
          contentType: file.type || 'application/pdf',
        },
      }
    );

    const uploadRes = await fetch(presigned.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type || 'application/pdf' },
      body: file,
    });

    if (!uploadRes.ok) throw new Error('R2 upload failed');

    formats.value[index].file_url = presigned.key;
    formats.value[index].file_public_id = presigned.key;
    formats.value[index].file_size_bytes = file.size;

    pushToast({ message: `Uploaded ${file.name} to Cloudflare R2!`, variant: 'success' });
  } catch {
    pushToast({ message: 'eBook upload to Cloudflare R2 failed', variant: 'error' });
  } finally {
    formats.value[index].uploading = false;
  }
}

async function handleSubmit(): Promise<void> {
  if (!name.value.trim() || formats.value.length === 0) return;

  // Validate format-level compare-at price to avoid inverted discounts
  for (const f of formats.value) {
    if (f.compare_at_price !== null && f.compare_at_price <= f.price) {
      formError.value = `Compare-at price for ${f.format.toUpperCase()} must be strictly greater than its selling price.`;
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
        category_id: categoryId.value || undefined,
        description: description.value.trim() || undefined,
        price: formats.value[0]?.price || price.value,
        compare_at_price: compareAtPrice.value || null,
        badge: badge.value || null,
        sale_ends_at: saleEndsAt.value ? new Date(saleEndsAt.value).toISOString() : null,
        cover_image_url: coverUrl.value.trim() || undefined,
        cover_image_public_id: coverPublicId.value || undefined,
        status: status.value,
        formats: formats.value.map((f: FormatDraft) => ({
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
    formError.value = err.data?.message || err.statusMessage || 'Failed to save book';
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <AdminLayout>
    <div class="max-w-4xl mx-auto space-y-6">
      <NuxtLink
        to="/admin/books"
        class="inline-flex items-center gap-1.5 text-xs font-bold text-forest-900 hover:underline"
      >
        <ArrowLeft :size="14" /> Back to Books
      </NuxtLink>

      <div class="bg-white rounded-xl shadow-subtle border border-ink-border p-6 sm:p-8 space-y-6">
        <div class="pb-4 border-b border-ink-border">
          <h1 class="font-display text-2xl font-bold text-forest-950">Add New Book</h1>
          <p class="text-xs text-ink-muted">
            Configure catalog details, strike-through discounts, and automated homepage merchandising.
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
              <div class="space-y-1">
                <label class="text-xs font-semibold text-forest-950">Category</label>
                <select
                  v-model="categoryId"
                  class="w-full px-3 py-2 border border-ink-border rounded text-xs outline-none focus:border-forest-900 bg-white"
                >
                  <option value="">Select category...</option>
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

            <!-- Promotion & Badge Merchandising -->
            <div
              class="p-4 bg-paper-cream/60 rounded-xl border border-ink-border grid sm:grid-cols-2 gap-4"
            >
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
                <label class="text-xs font-semibold text-forest-950">
                  Sale Expiration (Optional)
                </label>
                <input
                  v-model="saleEndsAt"
                  type="datetime-local"
                  class="w-full px-3 py-1.5 bg-white border border-ink-border rounded text-xs font-mono outline-none focus:border-forest-900"
                />
                <span class="text-[10px] text-ink-muted">
                  Auto-removes flash sale badge once passed to prevent perpetual sales.
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

          <!-- 2. Cover Art Preview -->
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

          <!-- 3. Formats Repeater (With Format-Specific Compare-at Price) -->
          <div class="space-y-4 pt-4 border-t border-ink-border">
            <div class="flex justify-between items-center">
              <div>
                <h3 class="text-xs font-bold uppercase text-forest-950 tracking-wider font-mono">
                  Reading Formats &amp; Discounts
                </h3>
                <p class="text-[11px] text-ink-muted">
                  Set individual sale prices and optional strike-through regular prices per format.
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
                class="p-4 bg-slate-50 border border-ink-border rounded-lg grid sm:grid-cols-12 gap-3 items-center"
              >
                <div class="sm:col-span-2">
                  <span class="text-xs font-bold uppercase text-forest-950 font-mono">{{
                    fmt.format
                  }}</span>
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
                  <label class="text-[10px] text-ink-muted font-semibold">
                    Strike-through (KSh)
                  </label>
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

                <div v-else class="sm:col-span-4 space-y-1">
                  <label class="text-[10px] text-ink-muted font-semibold">
                    Digital File (Cloudflare R2)
                  </label>
                  <label
                    class="w-full bg-white border border-ink-border text-forest-950 text-[11px] font-medium px-2 py-1.5 rounded flex items-center justify-between cursor-pointer"
                  >
                    <span class="truncate">{{
                      fmt.file_public_id ? 'R2 File Ready âœ“' : 'Upload to R2'
                    }}</span>
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
              class="bg-forest-900 text-white text-xs font-bold uppercase px-6 py-2.5 rounded hover:bg-forest-800 transition-colors shadow cursor-pointer disabled:opacity-50"
              :disabled="isSubmitting"
            >
              {{ isSubmitting ? 'Saving Book...' : 'Save &amp; Publish Book' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </AdminLayout>
</template>