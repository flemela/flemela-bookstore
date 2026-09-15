<!-- =============================================================================
     flemela/pages/admin/books/new.vue
     Add Book: Production Type-Safe with Auto-Find & Upload Cover Art
     ============================================================================= -->

<template>
  <div class="min-h-screen bg-gray-50/50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
    <div class="max-w-4xl mx-auto">
      
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
            <h1 class="text-2xl font-bold text-gray-900 tracking-tight">Add New Book</h1>
            <p class="text-xs text-gray-500 mt-0.5">Publish physical hardcopies and instant digital PDF eBooks</p>
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
            @click="handleSubmit"
            class="inline-flex items-center space-x-2 px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-lg shadow-sm transition-all"
          >
            <svg v-if="isSubmitting" class="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
            </svg>
            <span>{{ isSubmitting ? 'Publishing Book...' : 'Publish Book' }}</span>
          </button>
        </div>
      </div>

      <!-- Main Form -->
      <form @submit.prevent="handleSubmit" class="space-y-6">

        <!-- Error Banner -->
        <div v-if="formError" class="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start space-x-3">
          <svg class="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h4 class="text-xs font-bold text-red-900">Validation Error</h4>
            <p class="text-xs text-red-700 mt-0.5">{{ formError }}</p>
          </div>
        </div>

        <!-- Section 1: Book Essentials -->
        <div class="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5">
          <h2 class="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-3">
            Book Information
          </h2>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div class="sm:col-span-2">
              <label class="block text-xs font-bold text-gray-700 mb-1.5">Book Title *</label>
              <input
                v-model="form.name"
                type="text"
                placeholder="e.g. The Psychology of Money"
                class="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 transition-all"
                required
              />
            </div>

            <div>
              <label class="block text-xs font-bold text-gray-700 mb-1.5">Author</label>
              <input
                v-model="form.author"
                type="text"
                placeholder="e.g. Morgan Housel"
                class="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 transition-all"
              />
            </div>

            <div>
              <label class="block text-xs font-bold text-gray-700 mb-1.5">Category *</label>
              <select
                v-model="form.category_id"
                class="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 transition-all"
                required
              >
                <option value="" disabled>Select category</option>
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
                placeholder="e.g. 978-0857197689"
                class="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 transition-all"
              />
            </div>

            <div>
              <label class="block text-xs font-bold text-gray-700 mb-1.5">Promotional Badge</label>
              <select
                v-model="form.badge"
                class="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 transition-all"
              >
                <option :value="null">None</option>
                <option value="BESTSELLER">Bestseller</option>
                <option value="FLASH_SALE">Flash Sale</option>
                <option value="NO1_PICK">#1 Staff Pick</option>
                <option value="DEAL_OF_WEEK">Deal of the Week</option>
              </select>
            </div>

            <div class="sm:col-span-2">
              <label class="block text-xs font-bold text-gray-700 mb-1.5">Synopsis / Description</label>
              <textarea
                v-model="form.description"
                rows="3"
                placeholder="Describe the book..."
                class="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 transition-all"
              ></textarea>
            </div>
          </div>
        </div>

        <!-- Section 2: Book Cover Image with Auto-Find & Upload -->
        <div class="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5">
          <div class="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h2 class="text-sm font-bold text-gray-900 uppercase tracking-wider">Book Cover Art</h2>
              <p class="text-xs text-gray-500 mt-0.5">Auto-find publisher jacket or upload custom image</p>
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

        <!-- Section 3: Formats & Uploader -->
        <div class="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
          <h2 class="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-3">
            Formats &amp; eBook Editions
          </h2>

          <!-- Physical Edition -->
          <div class="p-5 rounded-xl border border-gray-200 bg-gray-50/30 space-y-4">
            <h3 class="text-sm font-bold text-gray-900">Physical Hardcopy Edition</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-gray-700 mb-1">Selling Price (KSh) *</label>
                <input
                  v-model.number="form.hardcopyPrice"
                  type="number"
                  min="0"
                  class="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                  required
                />
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-700 mb-1">Stock Count *</label>
                <input
                  v-model.number="form.hardcopyStock"
                  type="number"
                  min="0"
                  class="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                  required
                />
              </div>
            </div>
          </div>

          <!-- Digital Edition with SinglePdfUploader -->
          <div class="p-5 rounded-xl border border-gray-200 bg-gray-50/30 space-y-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-2.5">
                <input
                  id="hasPdfCheck"
                  v-model="form.hasPdf"
                  type="checkbox"
                  class="w-4 h-4 text-emerald-700 border-gray-300 rounded focus:ring-emerald-700"
                />
                <label for="hasPdfCheck" class="text-sm font-bold text-gray-900 cursor-pointer">
                  Offer Digital PDF Edition
                </label>
              </div>
              <span v-if="form.hasPdf" class="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                Instant R2 Delivery
              </span>
            </div>

            <div v-if="form.hasPdf" class="space-y-4 pt-2">
              <div>
                <label class="block text-xs font-semibold text-gray-700 mb-1">eBook Price (KSh) *</label>
                <input
                  v-model.number="form.pdfPrice"
                  type="number"
                  min="0"
                  class="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm max-w-xs"
                  required
                />
              </div>

              <!-- SINGLE PDF UPLOADER -->
              <div>
                <label class="block text-xs font-semibold text-gray-700 mb-1.5">
                  Upload PDF eBook File *
                </label>
                <SinglePdfUploader
                  v-model="form.pdfKey"
                  :initial-file-name="form.pdfFileName"
                  :initial-file-size="form.pdfFileSize"
                  :max-file-size-mb="50"
                  @success="handlePdfSuccess"
                  @remove="handlePdfRemove"
                />
              </div>
            </div>
          </div>

        </div>

      </form>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ofetch } from 'ofetch';
import SinglePdfUploader from '~/components/admin/SinglePdfUploader.vue';
import { useToast } from '~/composables/useToast';

const router = useRouter();
const { push: pushToast } = useToast();

const isSubmitting = ref(false);
const isFindingCover = ref(false);
const isUploadingCover = ref(false);
const formError = ref('');
const coverFileInputRef = ref<HTMLInputElement | null>(null);
const categories = ref<Array<{ id: string; name: string }>>([]);

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
  hasPdf: true,
  pdfPrice: 149,
  pdfKey: null as string | null,
  pdfFileUrl: null as string | null,
  pdfFileSize: 0,
  pdfFileName: '',
});

onMounted(async () => {
  try {
    const raw = await ofetch<any>('/api/admin/categories');
    const list = raw?.data || raw;
    if (Array.isArray(list)) {
      categories.value = list;
      if (list.length > 0) form.category_id = list[0].id;
    }
  } catch (e) {
    console.error('Failed to load categories', e);
  }
});

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

function handlePdfSuccess(payload: { key: string; fileUrl: string; sizeBytes: number; fileName: string }) {
  form.pdfKey = payload.key;
  form.pdfFileUrl = payload.fileUrl;
  form.pdfFileSize = payload.sizeBytes;
  form.pdfFileName = payload.fileName;
  formError.value = '';
}

function handlePdfRemove() {
  form.pdfKey = null;
  form.pdfFileUrl = null;
  form.pdfFileSize = 0;
  form.pdfFileName = '';
}

async function handleSubmit() {
  formError.value = '';

  if (!form.name.trim()) {
    formError.value = 'Book title is required.';
    return;
  }
  if (!form.category_id) {
    formError.value = 'Please select a catalog category.';
    return;
  }
  if (form.hasPdf && !form.pdfKey) {
    formError.value = 'Please upload a PDF document for the digital edition or uncheck the digital option.';
    return;
  }

  isSubmitting.value = true;

  try {
    const productPayload = {
      name: form.name.trim(),
      category_id: form.category_id,
      price: form.hardcopyPrice,
      sku: form.sku.trim() || null,
      badge: form.badge || null,
      description: form.author ? `By ${form.author.trim()}. ${form.description}` : form.description,
      stock: form.hardcopyStock,
      publish: true,
      images: form.cover_image_url
        ? [{ image_url: form.cover_image_url, image_public_id: 'cover_img' }]
        : [],
    };

    const createdProduct = await ofetch<any>('/api/admin/books', {
      method: 'POST',
      body: productPayload,
    });

    const productId = createdProduct?.id || createdProduct?.data?.id;

    // Attach Hardcopy Format
    await ofetch(`/api/admin/products/${productId}/formats`, {
      method: 'POST',
      body: {
        format: 'hardcopy',
        price: form.hardcopyPrice,
        stock: form.hardcopyStock,
      },
    });

    // Attach PDF Format
    if (form.hasPdf && form.pdfKey) {
      await ofetch(`/api/admin/products/${productId}/formats`, {
        method: 'POST',
        body: {
          format: 'pdf',
          price: form.pdfPrice,
          file_url: form.pdfFileUrl || form.pdfKey,
          file_public_id: form.pdfKey,
          file_size_bytes: form.pdfFileSize,
        },
      });
    }

    pushToast({ message: `"${form.name}" published to store!`, variant: 'success' });
    await router.push('/admin/books');
  } catch (err: any) {
    formError.value =
      err.data?.data?.message || err.data?.message || err.message || 'Failed to publish book.';
  } finally {
    isSubmitting.value = false;
  }
				}
</script>