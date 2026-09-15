<!-- =============================================================================
     flemela/pages/admin/books/[id]/edit.vue
     Edit Book: Pre-hydrated with Category Creation, Badges & Cover Suite
     ============================================================================= -->

<template>
  <div class="min-h-screen bg-gray-50/50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
    <div class="max-w-4xl mx-auto">

      <!-- Loading Skeleton -->
      <div v-if="isLoadingInitial" class="space-y-6">
        <div class="h-10 bg-gray-200 rounded-lg w-1/3 animate-pulse"></div>
        <div class="h-64 bg-white rounded-2xl border border-gray-200 p-6 animate-pulse"></div>
      </div>

      <div v-else>
        <!-- Top Action Bar -->
        <div class="flex items-center justify-between mb-8">
          <div class="flex items-center space-x-3">
            <NuxtLink
              to="/admin/books"
              class="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors shadow-sm"
            >
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </NuxtLink>
            <div>
              <h1 class="text-2xl font-bold text-gray-900 tracking-tight">Edit Book</h1>
              <p class="text-xs text-gray-500 mt-0.5">Manage pricing, stock, categories, badges, and formats</p>
            </div>
          </div>

          <div class="flex items-center space-x-3">
            <NuxtLink
              to="/admin/books"
              class="px-4 py-2 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm"
            >
              Cancel
            </NuxtLink>
            <button
              type="button"
              :disabled="isSubmitting"
              @click="handleUpdate"
              class="inline-flex items-center space-x-2 px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-lg shadow-sm transition-all"
            >
              <svg v-if="isSubmitting" class="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
              <span>{{ isSubmitting ? 'Saving Changes...' : 'Save Changes' }}</span>
            </button>
          </div>
        </div>

        <form @submit.prevent="handleUpdate" class="space-y-6">

          <!-- Success Alert -->
          <div v-if="successToast" class="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <svg class="w-5 h-5 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <p class="text-xs font-bold text-emerald-900">{{ successToast }}</p>
            </div>
            <button type="button" @click="successToast = ''" class="text-xs text-emerald-700 font-bold">Dismiss</button>
          </div>

          <!-- Error Alert -->
          <div v-if="formError" class="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start space-x-3">
            <svg class="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 class="text-xs font-bold text-red-900">Update Blocked</h4>
              <p class="text-xs text-red-700 mt-0.5">{{ formError }}</p>
            </div>
          </div>

          <!-- Section 1: Book Essentials -->
          <div class="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5">
            <h2 class="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-3">
              Book Details
            </h2>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div class="sm:col-span-2">
                <label class="block text-xs font-bold text-gray-700 mb-1.5">Book Title *</label>
                <input
                  v-model="form.name"
                  type="text"
                  class="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 transition-all"
                  required
                />
              </div>

              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1.5">Author</label>
                <input
                  v-model="form.author"
                  type="text"
                  class="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 transition-all"
                />
              </div>

              <!-- Category with "+ New Category" Action -->
              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <label class="block text-xs font-bold text-gray-700">Category *</label>
                  <button
                    type="button"
                    class="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                    @click="isCategoryModalOpen = true"
                  >
                    + New Category
                  </button>
                </div>
                <select
                  v-model="form.category_id"
                  class="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 transition-all"
                  required
                >
                  <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                    {{ cat.name }}
                  </option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1.5">ISBN / SKU</label>
                <input
                  v-model="form.sku"
                  type="text"
                  class="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 transition-all"
                />
              </div>

              <!-- Promotional Badge Selector -->
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1.5">Promotional Badge</label>
                <select
                  v-model="form.badge"
                  class="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 transition-all"
                >
                  <option :value="null">None (Standard)</option>
                  <option value="BESTSELLER">Bestseller</option>
                  <option value="FLASH_SALE">Flash Sale</option>
                  <option value="NO1_PICK">#1 Staff Pick</option>
                  <option value="DEAL_OF_WEEK">Deal of the Week</option>
                  <option value="LIMITED_TIME">Limited Time</option>
                </select>
              </div>

              <div class="sm:col-span-2">
                <label class="block text-xs font-bold text-gray-700 mb-1.5">Synopsis / Description</label>
                <textarea
                  v-model="form.description"
                  rows="3"
                  class="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 transition-all"
                ></textarea>
              </div>
            </div>
          </div>

          <!-- Section 2: Book Cover Art with Auto-Find & Upload -->
          <div class="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5">
            <div class="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h2 class="text-sm font-bold text-gray-900 uppercase tracking-wider">Book Cover Art</h2>
                <p class="text-xs text-gray-500 mt-0.5">High-definition publisher jacket</p>
              </div>
              <button
                type="button"
                :disabled="isFindingCover || !form.name.trim()"
                @click="handleAutoFindCover"
                class="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
              >
                <svg v-if="isFindingCover" class="animate-spin w-3.5 h-3.5 text-amber-900" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                <span v-else>🔍</span>
                <span>{{ isFindingCover ? 'Searching Studio Art...' : 'Auto-Find Cover' }}</span>
              </button>
            </div>

            <div class="flex flex-col sm:flex-row items-start gap-6">
              <!-- Cover Preview Box -->
              <div class="w-32 h-44 bg-gray-100 rounded-xl border border-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center relative shadow-sm">
                <img
                  v-if="form.cover_image_url"
                  :src="form.cover_image_url"
                  alt="Book cover preview"
                  class="w-full h-full object-cover"
                  @error="form.cover_image_url = ''"
                />
                <div v-else class="text-center p-3 text-gray-400">
                  <svg class="w-8 h-8 mx-auto mb-1 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <span class="text-[10px] block">No Cover</span>
                </div>
              </div>

              <!-- Upload & URL Controls -->
              <div class="flex-1 space-y-3 w-full">
                <div class="flex items-center gap-2">
                  <input
                    ref="coverFileInputRef"
                    type="file"
                    accept="image/*"
                    class="hidden"
                    @change="handleCoverFileSelected"
                  />
                  <button
                    type="button"
                    :disabled="isUploadingCover"
                    @click="coverFileInputRef?.click()"
                    class="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-xs font-bold transition-all inline-flex items-center space-x-1.5 shadow-sm disabled:opacity-50"
                  >
                    <svg v-if="isUploadingCover" class="animate-spin w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    <span>{{ isUploadingCover ? 'Uploading...' : 'Upload Cover Image' }}</span>
                  </button>

                  <button
                    v-if="form.cover_image_url"
                    type="button"
                    @click="form.cover_image_url = ''"
                    class="px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Remove
                  </button>
                </div>

                <div class="space-y-1">
                  <label class="block text-[11px] font-semibold text-gray-500">Or paste image URL directly:</label>
                  <input
                    v-model="form.cover_image_url"
                    type="url"
                    placeholder="https://..."
                    class="w-full px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-lg text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-emerald-700 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Section 3: Formats & Single PDF Management -->
          <div class="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
            <h2 class="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-3">
              Format Management
            </h2>

            <!-- A. Hardcopy Format -->
            <div class="p-5 rounded-xl border border-gray-200 bg-gray-50/30 space-y-4">
              <h3 class="text-sm font-bold text-gray-900">Physical Hardcopy Edition</h3>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-gray-700 mb-1">Selling Price (KSh)</label>
                  <input
                    v-model.number="form.hardcopyPrice"
                    type="number"
                    min="0"
                    class="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-700 mb-1">Current Stock Count</label>
                  <input
                    v-model.number="form.hardcopyStock"
                    type="number"
                    min="0"
                    class="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>

            <!-- B. Digital PDF Format -->
            <div class="p-5 rounded-xl border border-gray-200 bg-gray-50/30 space-y-4">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2.5">
                  <span class="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                  <h3 class="text-sm font-bold text-gray-900">Digital PDF Edition</h3>
                </div>
                <span v-if="pdfFormatId" class="text-xs text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                  Format Active (ID: {{ pdfFormatId.slice(0, 8) }})
                </span>
              </div>

              <div>
                <label class="block text-xs font-semibold text-gray-700 mb-1">eBook Price (KSh)</label>
                <input
                  v-model.number="form.pdfPrice"
                  type="number"
                  min="0"
                  class="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm max-w-xs"
                />
              </div>

              <!-- MOUNTED SINGLE PDF UPLOADER -->
              <div>
                <label class="block text-xs font-semibold text-gray-700 mb-1.5">
                  eBook PDF Document
                </label>
                <SinglePdfUploader
                  v-model="form.pdfKey"
                  :initial-file-name="form.pdfFileName"
                  :initial-file-size="form.pdfFileSize"
                  :max-file-size-mb="50"
                  @success="handlePdfReplaced"
                  @remove="handlePdfRemoved"
                />
              </div>

              <div v-if="isPdfDirty" class="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center space-x-2">
                <svg class="w-4 h-4 text-amber-700 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p class="text-[11px] text-amber-800 font-medium">
                  New PDF staged in R2. Click <strong>Save Changes</strong> to update customer delivery links.
                </p>
              </div>
            </div>

          </div>

        </form>
      </div>

      <!-- Add Category Modal -->
      <AddCategoryModal
        :open="isCategoryModalOpen"
        @close="isCategoryModalOpen = false"
        @created="handleCategoryCreated"
      />

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { ofetch } from 'ofetch';
import SinglePdfUploader from '~/components/admin/SinglePdfUploader.vue';
import AddCategoryModal from '~/components/admin/AddCategoryModal.vue';
import { useToast } from '~/composables/useToast';

const route = useRoute();
const productId = route.params.id as string;
const { push: pushToast } = useToast();

const isLoadingInitial = ref(true);
const isSubmitting = ref(false);
const isFindingCover = ref(false);
const isUploadingCover = ref(false);
const isPdfDirty = ref(false);
const isCategoryModalOpen = ref(false);
const formError = ref('');
const successToast = ref('');
const coverFileInputRef = ref<HTMLInputElement | null>(null);

const categories = ref<Array<{ id: string; name: string; slug?: string }>>([]);
const hardcopyFormatId = ref<string | null>(null);
const pdfFormatId = ref<string | null>(null);

const form = reactive({
  name: '',
  author: '',
  category_id: '',
  sku: '',
  badge: null as string | null,
  description: '',
  cover_image_url: '',
  hardcopyPrice: 999,
  hardcopyStock: 10,
  pdfPrice: 149,
  pdfKey: null as string | null,
  pdfFileUrl: null as string | null,
  pdfFileSize: 0,
  pdfFileName: '',
});

onMounted(async () => {
  try {
    // 1. Fetch Categories
    const catRaw = await ofetch<any>('/api/admin/categories');
    const catList = catRaw?.data || catRaw;
    if (Array.isArray(catList)) categories.value = catList;

    // 2. Fetch Book Details
    const bookRaw = await ofetch<any>(`/api/admin/books/${productId}`);
    const book = bookRaw?.data || bookRaw;

    if (!book || !book.id) {
      throw new Error('Book record could not be loaded.');
    }

    form.name = book.name || '';
    form.category_id = book.category_id || '';
    form.sku = book.sku || '';
    form.badge = book.badge || null;
    form.description = book.description || '';
    form.hardcopyPrice = Number(book.price) || 999;
    form.hardcopyStock = book.stock ?? 10;

    // Prefill author from description if prefixed "By ..."
    if (book.description && book.description.startsWith('By ')) {
      const match = book.description.match(/^By\s+([^.]+)\.\s*(.*)$/);
      if (match) {
        form.author = match[1].trim();
        form.description = match[2].trim();
      }
    } else if (book.author) {
      form.author = book.author;
    }

    // Prefill cover image
    const firstImg = book.images?.[0];
    if (typeof firstImg === 'string') {
      form.cover_image_url = firstImg;
    } else if (firstImg?.image_url) {
      form.cover_image_url = firstImg.image_url;
    } else if (book.cover_image_url) {
      form.cover_image_url = book.cover_image_url;
    }

    const formats: any[] = book.formats || [];

    const hardcopy = formats.find((f) => f.format === 'hardcopy');
    if (hardcopy) {
      hardcopyFormatId.value = hardcopy.id;
      form.hardcopyPrice = Number(hardcopy.price) || form.hardcopyPrice;
      form.hardcopyStock = hardcopy.stock ?? form.hardcopyStock;
    }

    const pdf = formats.find((f) => f.format === 'pdf');
    if (pdf) {
      pdfFormatId.value = pdf.id;
      form.pdfPrice = Number(pdf.price) || 149;
      form.pdfKey = pdf.file_public_id || pdf.file_url || null;
      form.pdfFileUrl = pdf.file_url || null;
      form.pdfFileSize = pdf.file_size_bytes ? Number(pdf.file_size_bytes) : 0;
      form.pdfFileName = pdf.file_public_id
        ? pdf.file_public_id.split('/').pop()?.replace(/^\d+-/, '') || 'eBook-edition.pdf'
        : `${book.name}.pdf`;
    }
  } catch (err: any) {
    formError.value =
      err.data?.data?.message || err.data?.message || err.message || 'Failed to load book data.';
  } finally {
    isLoadingInitial.value = false;
  }
});

function handleCategoryCreated(newCat: { id: string; name: string; slug: string }) {
  if (!categories.value.some((c) => c.id === newCat.id)) {
    categories.value.push(newCat);
  }
  form.category_id = newCat.id;
}

async function handleAutoFindCover() {
  if (!form.name.trim()) {
    pushToast({ message: 'Enter a book title first to search for cover art', variant: 'info' });
    return;
  }

  isFindingCover.value = true;
  try {
    const res = await ofetch<{ coverUrl: string | null; title: string; source: string | null }>(
      `/api/admin/books/find-cover`,
      {
        query: {
          title: form.name.trim(),
          author: form.author ? form.author.trim() : undefined,
        },
      }
    );

    if (res?.coverUrl) {
      form.cover_image_url = res.coverUrl;
      pushToast({
        message: `High-res cover located (${(res.source || 'Studio').toUpperCase()})!`,
        variant: 'success',
      });
    } else {
      pushToast({ message: 'No online cover found. You can upload an image file.', variant: 'info' });
    }
  } catch {
    pushToast({ message: 'Auto-find cover search timed out. You can upload manually.', variant: 'error' });
  } finally {
    isFindingCover.value = false;
  }
}

async function handleCoverFileSelected(e: Event) {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  isUploadingCover.value = true;
  try {
    const formData = new FormData();
    formData.append('file', file);

    const res = await ofetch<{ url: string }>('/api/admin/banners/upload', {
      method: 'POST',
      body: formData,
    });

    if (res?.url) {
      form.cover_image_url = res.url;
      pushToast({ message: 'Cover image uploaded successfully!', variant: 'success' });
    }
  } catch (err: any) {
    pushToast({ message: err.data?.message || 'Failed to upload cover image.', variant: 'error' });
  } finally {
    isUploadingCover.value = false;
    target.value = '';
  }
}

function handlePdfReplaced(payload: { key: string; fileUrl: string; sizeBytes: number; fileName: string }) {
  form.pdfKey = payload.key;
  form.pdfFileUrl = payload.fileUrl;
  form.pdfFileSize = payload.sizeBytes;
  form.pdfFileName = payload.fileName;
  isPdfDirty.value = true;
}

function handlePdfRemoved() {
  form.pdfKey = null;
  form.pdfFileUrl = null;
  form.pdfFileSize = 0;
  form.pdfFileName = '';
  isPdfDirty.value = true;
}

async function handleUpdate() {
  formError.value = '';
  successToast.value = '';
  isSubmitting.value = true;

  try {
    // 1. Update Base Product, Badge & Cover Image
    await ofetch(`/api/admin/books/${productId}`, {
      method: 'PATCH',
      body: {
        name: form.name.trim(),
        category_id: form.category_id,
        sku: form.sku.trim() || null,
        badge: form.badge || null,
        description: form.author ? `By ${form.author.trim()}. ${form.description}` : form.description,
        images: form.cover_image_url
          ? [{ image_url: form.cover_image_url, image_public_id: 'cover_img' }]
          : [],
      },
    });
	  // 2. Update Hardcopy Format
    if (hardcopyFormatId.value) {
      await ofetch(`/api/admin/products/${productId}/formats/${hardcopyFormatId.value}`, {
        method: 'PATCH',
        body: {
          price: form.hardcopyPrice,
          stock: form.hardcopyStock,
        },
      });
    }

    // 3. Update or Create PDF Format
    if (pdfFormatId.value) {
      await ofetch(`/api/admin/products/${productId}/formats/${pdfFormatId.value}`, {
        method: 'PATCH',
        body: {
          price: form.pdfPrice,
          file_url: form.pdfFileUrl || form.pdfKey,
          file_public_id: form.pdfKey,
          file_size_bytes: form.pdfFileSize || null,
        },
      });
    } else if (form.pdfKey) {
      const createdFormat = await ofetch<any>(`/api/admin/products/${productId}/formats`, {
        method: 'POST',
        body: {
          format: 'pdf',
          price: form.pdfPrice,
          file_url: form.pdfFileUrl || form.pdfKey,
          file_public_id: form.pdfKey,
          file_size_bytes: form.pdfFileSize,
        },
      });
      pdfFormatId.value = createdFormat?.id || createdFormat?.data?.id;
    }

    isPdfDirty.value = false;
    successToast.value = 'Book details, badges, cover art, and digital formats saved successfully!';
    pushToast({ message: successToast.value, variant: 'success' });
  } catch (err: any) {
    formError.value =
      err.data?.data?.message || err.data?.message || err.message || 'Failed to save changes.';
  } finally {
    isSubmitting.value = false;
  }
}
</script>