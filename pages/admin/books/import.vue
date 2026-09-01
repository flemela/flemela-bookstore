<!-- pages/admin/books/import.vue -->
<script setup lang="ts">
import {
  FileSpreadsheet,
  Download,
  Upload,
  RefreshCw,
  ArrowLeft,
} from 'lucide-vue-next';
import AdminLayout from '~/components/admin/AdminLayout.vue';
import { useToast } from '~/composables/useToast';

definePageMeta({
  middleware: 'admin-auth',
});

const { push: pushToast } = useToast();

const isDragging = ref(false);
const isUploading = ref(false);
const activeJobId = ref<string | null>(null);
const jobData = ref<any>(null);
let pollTimer: ReturnType<typeof setInterval> | undefined;

// Google Sheet state
const googleSheetUrl = ref('');
const isSubmittingSheet = ref(false);

const sampleCsvContent = [
  'Name,Description,SellerSKU,PrimaryCategory,Price_KES,Sale_Price_KES,PDF FILE,PDFS PRICE,Stock,author,Image 1,Image 2',
  '"The Power of Mindset","<p>Change your thoughts, change your life.</p>",A1,Self-Help,1200,999,https://drive.google.com/uc?export=download&id=SAMPLE_ID,149,25,"Darren Hardy",https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600,https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600',
  '"The Great Gatsby","<p>A classic tale of the Jazz Age.</p>",A2,Fiction,1400,1235,https://drive.google.com/uc?export=download&id=SAMPLE_ID,149,30,"F. Scott Fitzgerald",https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=600,https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=600',
].join('\n');

function downloadSampleTemplate(): void {
  const blob = new Blob([sampleCsvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'Flemela_Bookstore_Template.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  pushToast({ message: 'Sample template downloaded', variant: 'success' });
}

async function handleFileUpload(file: File): Promise<void> {
  if (!file) return;

  isUploading.value = true;
  jobData.value = null;

  try {
    const formData = new FormData();
    formData.append('file', file);

    const res = await $fetch<{ success: boolean; data: { jobId: string; status: string } }>(
      'http://localhost:3000/api/v1/books/import/excel',
      {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${useCookie('flemela_admin_session').value}`,
        },
      }
    );

    activeJobId.value = res.data.jobId;
    pushToast({ message: 'File accepted. Ingestion started in background!', variant: 'info' });
    startPollingJob(res.data.jobId);
  } catch (err: any) {
    pushToast({ message: err.data?.error?.message || 'Failed to upload spreadsheet', variant: 'error' });
  } finally {
    isUploading.value = false;
  }
}

async function handleGoogleSheetSubmit(): Promise<void> {
  if (!googleSheetUrl.value.trim()) return;

  isSubmittingSheet.value = true;
  jobData.value = null;

  try {
    const res = await $fetch<{ success: boolean; data: { jobId: string; status: string } }>(
      'http://localhost:3000/api/v1/books/import/google-sheet',
      {
        method: 'POST',
        body: { sheetUrl: googleSheetUrl.value.trim() },
        headers: {
          Authorization: `Bearer ${useCookie('flemela_admin_session').value}`,
        },
      }
    );

    activeJobId.value = res.data.jobId;
    pushToast({ message: 'Google Sheet import enqueued!', variant: 'info' });
    startPollingJob(res.data.jobId);
  } catch (err: any) {
    pushToast({ message: err.data?.error?.message || 'Failed to import Google Sheet', variant: 'error' });
  } finally {
    isSubmittingSheet.value = false;
  }
}

function startPollingJob(jobId: string): void {
  stopPolling();

  pollTimer = setInterval(async () => {
    try {
      const res = await $fetch<{ success: boolean; data: any }>(
        `http://localhost:3000/api/v1/books/import/${jobId}`,
        {
          headers: {
            Authorization: `Bearer ${useCookie('flemela_admin_session').value}`,
          },
        }
      );
      jobData.value = res.data;

      if (res.data.status === 'done' || res.data.status === 'failed') {
        stopPolling();
        if (res.data.status === 'done') {
          pushToast({
            message: `Import complete! Ingested ${res.data.processed_rows} titles successfully.`,
            variant: 'success',
          });
        }
      }
    } catch {
      stopPolling();
    }
  }, 2500);
}

function stopPolling(): void {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = undefined;
  }
}

onUnmounted(() => {
  stopPolling();
});

function onDrop(e: DragEvent): void {
  isDragging.value = false;
  const file = e.dataTransfer?.files?.[0];
  if (file) handleFileUpload(file);
}

function onFileSelect(e: Event): void {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) handleFileUpload(file);
}
</script>

<template>
  <AdminLayout>
    <div class="max-w-4xl mx-auto space-y-6">
      <!-- Back Link -->
      <NuxtLink to="/admin/books" class="inline-flex items-center gap-1.5 text-xs font-bold text-brand-green hover:underline">
        <ArrowLeft :size="14" /> Back to Books Catalog
      </NuxtLink>

      <!-- Main Import Container -->
      <div class="bg-white rounded-xl shadow-card border border-ink-border p-6 sm:p-8 space-y-6">
        <div class="flex flex-wrap justify-between items-start gap-4 pb-4 border-b border-ink-border">
          <div>
            <h1 class="font-display text-2xl font-bold text-brand-green">Bulk Excel / CSV Importer</h1>
            <p class="text-xs text-ink-muted">
              Ingest hundreds of book titles, stream PDFs directly into Cloudflare R2, and sync covers to Cloudinary.
            </p>
          </div>

          <button
            type="button"
            class="bg-brand-cream border border-brand-gold text-brand-gold-hover text-xs font-bold px-3.5 py-2 rounded hover:bg-amber-100 transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
            @click="downloadSampleTemplate"
          >
            <Download :size="14" /> Download Sample Template
          </button>
        </div>

        <!-- 1. Drag & Drop File Upload Zone -->
        <div class="space-y-2">
          <label class="text-xs font-bold uppercase text-ink tracking-wide block">1. Upload Spreadsheet File (.xlsx or .csv)</label>

          <div
            class="border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer bg-slate-50 flex flex-col items-center justify-center gap-3"
            :class="isDragging ? 'border-brand-green bg-emerald-50' : 'border-slate-300 hover:border-brand-green'"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="onDrop"
          >
            <div class="w-12 h-12 rounded-full bg-emerald-100 text-brand-green flex items-center justify-center">
              <Upload :size="24" />
            </div>

            <div class="space-y-1">
              <p class="text-xs font-bold text-ink">
                Drag &amp; drop your workbook here, or <span class="text-brand-green underline">browse files</span>
              </p>
              <p class="text-[11px] text-ink-muted">
                Supports .xlsx and .csv files matching the Flemela format (up to 50MB)
              </p>
            </div>

            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              class="hidden"
              id="excel-file-picker"
              @change="onFileSelect"
              :disabled="isUploading"
            />
            <label
              for="excel-file-picker"
              class="bg-brand-green text-white text-xs font-bold uppercase px-4 py-2 rounded hover:bg-brand-green-hover cursor-pointer shadow-sm inline-block"
            >
              {{ isUploading ? 'Uploading...' : 'Choose File' }}
            </label>
          </div>
        </div>

        <!-- 2. Google Sheets Alternative -->
        <div class="space-y-2 pt-4 border-t border-ink-border">
          <label class="text-xs font-bold uppercase text-ink tracking-wide block">2. Or Import via Published Google Sheet URL</label>

          <form class="flex gap-2" @submit.prevent="handleGoogleSheetSubmit">
            <input
              v-model="googleSheetUrl"
              type="url"
              placeholder="https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit"
              class="flex-1 px-3 py-2 border border-ink-border rounded text-xs outline-none focus:border-brand-green"
              :disabled="isSubmittingSheet"
            />
            <button
              type="submit"
              class="bg-brand-green text-white text-xs font-bold uppercase px-5 py-2 rounded hover:bg-brand-green-hover disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              :disabled="!googleSheetUrl || isSubmittingSheet"
            >
              <RefreshCw v-if="isSubmittingSheet" :size="13" class="animate-spin" />
              <span>Import Sheet</span>
            </button>
          </form>
          <p class="text-[10px] text-ink-muted">
            Ensure your Google Sheet is set to <em>"Anyone with the link can view"</em>.
          </p>
        </div>

        <!-- 3. Real-Time Import Progress Status Card -->
        <div v-if="jobData" class="p-5 bg-brand-cream border border-brand-gold/50 rounded-xl space-y-4">
          <div class="flex justify-between items-center">
            <div class="flex items-center gap-2">
              <FileSpreadsheet :size="18" class="text-brand-green" />
              <h3 class="font-display font-bold text-sm text-ink">
                Import Job Status: <span class="uppercase text-brand-green font-mono">{{ jobData.status }}</span>
              </h3>
            </div>
            <span class="text-xs font-mono font-bold text-ink tabular-figure">
              {{ jobData.processed_rows }} / {{ jobData.total_rows || 'Calculating...' }} processed
            </span>
          </div>

          <!-- Progress Bar -->
          <div class="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
            <div
              class="bg-brand-green h-full transition-all duration-300 rounded-full"
              :style="{
                width: `${jobData.total_rows ? Math.min(100, Math.round((jobData.processed_rows / jobData.total_rows) * 100)) : 10}%`,
              }"
            />
          </div>

          <!-- Error Rows Table -->
          <div v-if="jobData.error_rows && jobData.error_rows.length > 0" class="space-y-2 pt-2 border-t border-ink-border">
            <div class="flex items-center gap-1.5 text-xs font-bold text-red-600">
              <span>{{ jobData.error_rows.length }} Row(s) Failed Validation</span>
            </div>

            <div class="max-h-40 overflow-y-auto border border-red-200 rounded bg-white p-2 divide-y divide-slate-100 text-xs">
              <div v-for="(err, i) in jobData.error_rows" :key="i" class="py-1 text-slate-700">
                <strong>Row {{ err.row }}:</strong> <span class="text-red-700">{{ err.error }}</span>
                <span v-if="err.title" class="text-ink-muted"> ({{ err.title }})</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>