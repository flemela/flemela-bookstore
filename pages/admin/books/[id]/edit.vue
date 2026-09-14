<!-- =============================================================================
     flemela/pages/admin/books/[id]/edit.vue
     Edit Book: Seamless In-Place PDF Replacement & Retroactive Fulfillment Trigger
     ============================================================================= -->

<template>
  <div class="min-h-screen bg-gray-50/50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
    <div class="max-w-4xl mx-auto">

      <!-- Initial Loading Skeleton -->
      <div v-if="isLoadingInitial" class="space-y-6">
        <div class="h-10 bg-gray-200 rounded-lg w-1/3 animate-pulse"></div>
        <div class="h-64 bg-white rounded-2xl border border-gray-200 p-6 animate-pulse"></div>
      </div>

      <!-- Main Edit Canvas -->
      <div v-else>
        <!-- Top Navigation Header -->
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
              <p class="text-xs text-gray-500 mt-0.5">Update pricing, inventory, and manage digital eBook files</p>
            </div>
          </div>

          <div class="flex items-center space-x-3">
            <NuxtLink
              to="/admin/books"
              class="px-4 py-2 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
            >
              Cancel
            </NuxtLink>
            <button
              type="button"
              :disabled="isSubmitting"
              @click="handleUpdate"
              class="inline-flex items-center space-x-2 px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-lg transition-all shadow-sm"
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

          <!-- Success Alert Toast -->
          <div v-if="successToast" class="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <svg class="w-5 h-5 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <p class="text-xs font-bold text-emerald-900">{{ successToast }}</p>
            </div>
            <button type="button" @click="successToast = ''" class="text-xs text-emerald-700 hover:text-emerald-900 font-bold">Dismiss</button>
          </div>

          <!-- Error Alert Banner -->
          <div v-if="formError" class="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start space-x-3">
            <svg class="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 class="text-xs font-bold text-red-900">Update Failed</h4>
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
                <label class="block text-xs font-bold text-gray-700 mb-1.5">Category *</label>
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

          <!-- Section 2: Formats & Single PDF Management -->
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

            <!-- B. Digital PDF Format (Integrated with SinglePdfUploader) -->
            <div class="p-5 rounded-xl border border-gray-200 bg-gray-50/30 space-y-4">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2.5">
                  <span class="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                  <h3 class="text-sm font-bold text-gray-900">Digital PDF Edition</h3>
                </div>
                <span v-if="pdfFormatId" class="text-xs text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                  Format Active (ID: {{ pdfFormatId.slice(0, 8) }}...)
                </span>
              </div>

              <div>
                <label class="block text-xs font-semibold text-gray-700 mb-1">eBook Selling Price (KSh)</label>
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
                  Attached PDF eBook File
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
                  A new PDF file has been uploaded to R2. Click <strong>Save Changes</strong> to update customer digital delivery tokens.
                </p>
              </div>
            </div>

          </div>

        </form>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import SinglePdfUploader from '~/components/admin/SinglePdfUploader.vue';

const route = useRoute();
const productId = route.params.id as string;

const isLoadingInitial = ref(true);
const isSubmitting = ref(false);
const isPdfDirty = ref(false);
const formError = ref('');
const successToast = ref('');

const categories = ref<Array<{ id: string; name: string }>>([]);
const hardcopyFormatId = ref<string | null>(null);
const pdfFormatId = ref<string | null>(null);

const form = reactive({
  name: '',
  category_id: '',
  sku: '',
  description: '',
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
    // 1. Fetch categories
    const catRes = await $fetch<{ success: boolean; data: Array<{ id: string; name: string }> }>('/api/admin/categories');
    if (catRes.data) categories.value = catRes.data;

    // 2. Fetch existing product with formats
    const prodRes = await $fetch<{ success: boolean; data: any }>(`/api/admin/products/${productId}`);
    const prod = prodRes.data;

    form.name = prod.name;
    form.category_id = prod.category_id;
    form.sku = prod.sku || '';
    form.description = prod.description || '';

    // Inspect formats attached to this book
    const formats: any[] = prod.formats || [];

    const hardcopy = formats.find((f) => f.format === 'hardcopy');
    if (hardcopy) {
      hardcopyFormatId.value = hardcopy.id;
      form.hardcopyPrice = parseFloat(hardcopy.price);
      form.hardcopyStock = hardcopy.stock ?? 10;
    }

    const pdf = formats.find((f) => f.format === 'pdf');
    if (pdf) {
      pdfFormatId.value = pdf.id;
      form.pdfPrice = parseFloat(pdf.price);
      form.pdfKey = pdf.file_public_id || pdf.file_url;
      form.pdfFileUrl = pdf.file_url;
      form.pdfFileSize = pdf.file_size_bytes ? parseInt(pdf.file_size_bytes, 10) : 0;
      form.pdfFileName = `${prod.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    }
  } catch (err: any) {
    formError.value = 'Failed to load existing book data.';
  } finally {
    isLoadingInitial.value = false;
  }
});

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
    // 1. Update Base Product Details
    await $fetch(`/api/admin/products/${productId}`, {
      method: 'PATCH',
      body: {
        name: form.name.trim(),
        category_id: form.category_id,
        sku: form.sku.trim() || null,
        description: form.description.trim() || null,
      },
    });

    // 2. Update Hardcopy Format
    if (hardcopyFormatId.value) {
      await $fetch(`/api/admin/products/${productId}/formats/${hardcopyFormatId.value}`, {
        method: 'PATCH',
        body: {
          price: form.hardcopyPrice,
          stock: form.hardcopyStock,
        },
      });
    }

    // 3. Update or Create PDF Format
    if (pdfFormatId.value) {
      // Update existing format (triggers retroactive fulfillment in Soko if file was replaced)
      await $fetch(`/api/admin/products/${productId}/formats/${pdfFormatId.value}`, {
        method: 'PATCH',
        body: {
          price: form.pdfPrice,
          file_url: form.pdfFileUrl || form.pdfKey,
          file_public_id: form.pdfKey,
          file_size_bytes: form.pdfFileSize || null,
        },
      });
    } else if (form.pdfKey) {
      // Create PDF format if book did not have one previously
      const newPdfRes = await $fetch<{ success: boolean; data: { id: string } }>(`/api/admin/products/${productId}/formats`, {
        method: 'POST',
        body: {
          format: 'pdf',
          price: form.pdfPrice,
          file_url: form.pdfFileUrl || form.pdfKey,
          file_public_id: form.pdfKey,
          file_size_bytes: form.pdfFileSize,
        },
      });
      pdfFormatId.value = newPdfRes.data.id;
    }

    isPdfDirty.value = false;
    successToast.value = 'Book and digital formats updated successfully!';
  } catch (err: any) {
    formError.value = err.data?.message || err.message || 'Failed to save book changes.';
  } finally {
    isSubmitting.value = false;
  }
}
</script>