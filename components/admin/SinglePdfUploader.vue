<!-- =============================================================================
     flemela/components/admin/SinglePdfUploader.vue
     High-UX Single PDF Uploader: Zero Auth Header Leakage to R2, Complete States
     ============================================================================= -->

<template>
  <div class="w-full font-sans">
    <!-- State 1: IDLE / EMPTY DROPZONE -->
    <div
      v-if="currentState === 'idle'"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleFileDrop"
      :class="[
        'relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer',
        isDragging
          ? 'border-emerald-600 bg-emerald-50/50 scale-[0.99]'
          : 'border-gray-200 hover:border-gray-300 bg-gray-50/50 hover:bg-gray-50'
      ]"
      @click="triggerFileInput"
    >
      <input
        ref="fileInputRef"
        type="file"
        accept="application/pdf,.pdf"
        class="hidden"
        @change="handleFileSelect"
      />

      <div class="flex flex-col items-center justify-center space-y-3">
        <div class="w-12 h-12 rounded-full bg-white shadow-sm border border-gray-200 flex items-center justify-center text-gray-600">
          <svg class="w-6 h-6 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <div>
          <p class="text-sm font-semibold text-gray-900">
            Click to upload PDF or drag and drop
          </p>
          <p class="text-xs text-gray-500 mt-1">
            Standard eBook edition (PDF format, up to {{ maxFileSizeMb }}MB)
          </p>
        </div>
      </div>
    </div>

    <!-- State 2 & 3: PREPARING / UPLOADING (PROGRESS) -->
    <div
      v-else-if="currentState === 'preparing' || currentState === 'uploading'"
      class="border border-gray-200 rounded-xl p-6 bg-white shadow-sm"
    >
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
            <svg class="w-5 h-5 text-emerald-700 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h4 class="text-sm font-semibold text-gray-900 truncate max-w-xs sm:max-w-md">
              {{ activeFile?.name || 'Uploading digital edition...' }}
            </h4>
            <p class="text-xs text-gray-500">
              {{ currentState === 'preparing' ? 'Negotiating secure storage slot...' : `${uploadProgress}% completed (${formatBytes(uploadedBytes)} of ${formatBytes(activeFile?.size || 0)})` }}
            </p>
          </div>
        </div>

        <button
          type="button"
          @click="abortUpload"
          class="text-xs font-medium text-gray-500 hover:text-red-600 transition-colors px-2.5 py-1.5 rounded-md hover:bg-red-50"
        >
          Cancel
        </button>
      </div>

      <!-- Live Transfer Progress Bar -->
      <div class="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
        <div
          class="bg-emerald-700 h-2 rounded-full transition-all duration-150 ease-out"
          :style="{ width: `${uploadProgress}%` }"
        ></div>
      </div>
    </div>

    <!-- State 4: SUCCESS (UPLOAD VERIFIED & READY) -->
    <div
      v-else-if="currentState === 'success'"
      class="border border-emerald-200 rounded-xl p-5 bg-emerald-50/40 flex items-center justify-between"
    >
      <div class="flex items-center space-x-3.5">
        <div class="w-10 h-10 rounded-lg bg-emerald-700 text-white flex items-center justify-center shadow-sm">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <div class="flex items-center space-x-2">
            <h4 class="text-sm font-bold text-gray-900 truncate max-w-xs sm:max-w-md">
              {{ activeFileName || 'Digital Edition Ready' }}
            </h4>
            <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wide">
              PDF Synced
            </span>
          </div>
          <p class="text-xs text-emerald-800 mt-0.5">
            Verified &amp; secured in Cloudflare R2 storage ({{ formatBytes(activeFileSize) }})
          </p>
        </div>
      </div>

      <div class="flex items-center space-x-2">
        <button
          type="button"
          @click="triggerFileInput"
          class="text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm transition-all"
        >
          Replace
        </button>
        <button
          type="button"
          @click="clearFile"
          class="text-xs font-semibold text-red-600 hover:text-red-700 bg-white hover:bg-red-50 border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm transition-all"
        >
          Remove
        </button>
      </div>

      <input
        ref="fileInputRef"
        type="file"
        accept="application/pdf,.pdf"
        class="hidden"
        @change="handleFileSelect"
      />
    </div>

    <!-- State 5: ERROR (WITH RETRY & DIAGNOSTICS) -->
    <div
      v-else-if="currentState === 'error'"
      class="border border-red-200 rounded-xl p-5 bg-red-50/50"
    >
      <div class="flex items-start justify-between">
        <div class="flex items-start space-x-3">
          <div class="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg class="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h4 class="text-sm font-bold text-red-900">Upload Failed</h4>
            <p class="text-xs text-red-700 mt-1 leading-relaxed max-w-lg">
              {{ errorMessage }}
            </p>
          </div>
        </div>

        <div class="flex items-center space-x-2 flex-shrink-0 ml-4">
          <button
            type="button"
            @click="retryUpload"
            class="text-xs font-bold text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg transition-colors shadow-sm"
          >
            Retry
          </button>
          <button
            type="button"
            @click="clearFile"
            class="text-xs font-medium text-gray-600 hover:text-gray-900 bg-white border border-gray-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue';

type UploadState = 'idle' | 'preparing' | 'uploading' | 'success' | 'error';

const props = withDefaults(
  defineProps<{
    modelValue?: string | null;
    initialFileName?: string | null;
    initialFileSize?: number | null;
    maxFileSizeMb?: number;
  }>(),
  {
    modelValue: null,
    initialFileName: null,
    initialFileSize: 0,
    maxFileSizeMb: 50,
  }
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | null): void;
  (e: 'success', payload: { key: string; fileUrl: string; sizeBytes: number; fileName: string }): void;
  (e: 'error', error: { message: string; details?: unknown }): void;
  (e: 'remove'): void;
}>();

const currentState = ref<UploadState>('idle');
const isDragging = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);

const activeFile = ref<File | null>(null);
const activeFileName = ref<string>(props.initialFileName || '');
const activeFileSize = ref<number>(props.initialFileSize || 0);

const uploadProgress = ref(0);
const uploadedBytes = ref(0);
const errorMessage = ref('');

let activeXhr: XMLHttpRequest | null = null;

// Populate initial state if existing book has PDF format attached
watch(
  () => props.modelValue,
  (val) => {
    if (val && currentState.value === 'idle') {
      currentState.value = 'success';
      activeFileName.value = props.initialFileName || 'Current Edition.pdf';
      activeFileSize.value = props.initialFileSize || 0;
    } else if (!val && currentState.value === 'success') {
      currentState.value = 'idle';
    }
  },
  { immediate: true }
);

function triggerFileInput() {
  fileInputRef.value?.click();
}

function handleFileSelect(e: Event) {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    validateAndInitiate(target.files[0]);
  }
}

function handleFileDrop(e: DragEvent) {
  isDragging.value = false;
  if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
    validateAndInitiate(e.dataTransfer.files[0]);
  }
}

function validateAndInitiate(file: File) {
  if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
    currentState.value = 'error';
    errorMessage.value = 'Invalid file format. Only authentic PDF documents (.pdf) are allowed.';
    return;
  }

  const maxBytes = props.maxFileSizeMb * 1024 * 1024;
  if (file.size > maxBytes) {
    currentState.value = 'error';
    errorMessage.value = `File is too large (${formatBytes(file.size)}). The maximum permitted file size is ${props.maxFileSizeMb}MB.`;
    return;
  }

  activeFile.value = file;
  activeFileName.value = file.name;
  activeFileSize.value = file.size;
  startUploadProcess();
}

async function startUploadProcess() {
  if (!activeFile.value) return;

  currentState.value = 'preparing';
  uploadProgress.value = 0;
  uploadedBytes.value = 0;
  errorMessage.value = '';

  try {
    // -------------------------------------------------------------------------
    // STEP 1: Negotiate Presigned R2 URL via Nuxt BFF (Uses Session Auth)
    // -------------------------------------------------------------------------
    const negotiateRes = await $fetch<{
      uploadUrl: string;
      key: string;
      fileUrl: string;
    }>('/api/admin/books/upload-url', {
      method: 'POST',
      body: {
        filename: activeFile.value.name,
        format: 'pdf',
        contentType: 'application/pdf',
      },
    });

    if (!negotiateRes?.uploadUrl || !negotiateRes?.key) {
      throw new Error('Failed to acquire secure Cloudflare R2 upload slot.');
    }

    // -------------------------------------------------------------------------
    // STEP 2: Execute Direct PUT to Cloudflare R2 (STRICT: ZERO AUTH HEADERS)
    // -------------------------------------------------------------------------
    currentState.value = 'uploading';
    await uploadDirectToR2(negotiateRes.uploadUrl, activeFile.value);

    // -------------------------------------------------------------------------
    // STEP 3: Dispatch Verified Results
    // -------------------------------------------------------------------------
    currentState.value = 'success';
    emit('update:modelValue', negotiateRes.key);
    emit('success', {
      key: negotiateRes.key,
      fileUrl: negotiateRes.fileUrl,
      sizeBytes: activeFile.value.size,
      fileName: activeFile.value.name,
    });
  } catch (err: any) {
    currentState.value = 'error';
    errorMessage.value =
      err.message || 'An unexpected error occurred during storage upload. Please try again.';
    emit('error', { message: errorMessage.value, details: err });
  }
}

/**
 * Executes direct stream to Cloudflare R2.
 * CRITICAL ARCHITECTURAL REQUIREMENT:
 * Standard XMLHttpRequest is used without setting any Authorization header.
 * Sending any Authorization header causes Cloudflare R2's S3 engine to abort with
 * AuthorizationHeaderMalformed (HTTP 400).
 */
function uploadDirectToR2(uploadUrl: string, file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    activeXhr = xhr;

    xhr.open('PUT', uploadUrl, true);

    // Exact signed content-type contract
    xhr.setRequestHeader('Content-Type', 'application/pdf');

    // DO NOT SET: xhr.setRequestHeader('Authorization', ...)

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        uploadedBytes.value = e.loaded;
        uploadProgress.value = Math.min(99, Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      activeXhr = null;
      if (xhr.status >= 200 && xhr.status < 300) {
        uploadProgress.value = 100;
        resolve();
      } else {
        // Extract S3 XML error message if returned
        let parsedMessage = `Storage upload rejected with status ${xhr.status}`;
        if (xhr.responseText && xhr.responseText.includes('<Message>')) {
          const match = xhr.responseText.match(/<Message>(.*?)<\/Message>/);
          if (match && match[1]) parsedMessage = match[1];
        }
        reject(new Error(parsedMessage));
      }
    };

    xhr.onerror = () => {
      activeXhr = null;
      reject(new Error('Network connection failed during upload. Check internet connectivity and try again.'));
    };

    xhr.onabort = () => {
      activeXhr = null;
      reject(new Error('Upload canceled.'));
    };

    xhr.send(file);
  });
}

function abortUpload() {
  if (activeXhr) {
    activeXhr.abort();
    activeXhr = null;
  }
  clearFile();
}

function retryUpload() {
  if (activeFile.value) {
    startUploadProcess();
  } else {
    clearFile();
  }
}

function clearFile() {
  activeFile.value = null;
  activeFileName.value = '';
  activeFileSize.value = 0;
  currentState.value = 'idle';
  uploadProgress.value = 0;
  uploadedBytes.value = 0;
  errorMessage.value = '';
  if (fileInputRef.value) {
    fileInputRef.value.value = '';
  }
  emit('update:modelValue', null);
  emit('remove');
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

onBeforeUnmount(() => {
  if (activeXhr) {
    activeXhr.abort();
  }
});
</script>