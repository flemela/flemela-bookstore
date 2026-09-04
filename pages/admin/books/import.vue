<!-- pages/admin/books/import.vue -->
<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue';
import {
  FileSpreadsheet,
  Download,
  Upload,
  RefreshCw,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Layers,
  CopyCheck,
  PlusCircle,
  ShieldCheck,
  X,
  Search,
  BookOpen,
} from 'lucide-vue-next';
import AdminLayout from '~/components/admin/AdminLayout.vue';
import { useToast } from '~/composables/useToast';

definePageMeta({
  middleware: 'admin-auth',
});

const { push: pushToast } = useToast();

type UploadStage = 'idle' | 'uploading' | 'queued' | 'processing' | 'completed' | 'failed';

interface RowErrorDetail {
  row: number;
  title?: string;
  error: string;
}

interface ImportJobTelemetry {
  id: string;
  source: 'excel' | 'google_sheet';
  status: 'queued' | 'processing' | 'done' | 'failed';
  total_rows: number | null;
  processed_rows: number;
  inserted_rows: number;
  updated_rows: number;
  skipped_rows: number;
  error_rows: RowErrorDetail[];
  created_at: string;
}

// Drag & Drop / Upload State
const isDragging = ref(false);
const uploadStage = ref<UploadStage>('idle');
const uploadProgress = ref(0);
const uploadedFileName = ref<string>('');
const uploadedFileSize = ref<string>('');

// Active Job & Telemetry State
const activeJobId = ref<string | null>(null);
const jobData = ref<ImportJobTelemetry | null>(null);
let pollTimer: ReturnType<typeof setInterval> | undefined;

// Completion Modal State
const showCompletionModal = ref(false);
const errorSearchQuery = ref('');

// Google Sheet State
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

const progressPercentage = computed(() => {
  if (!jobData.value || !jobData.value.total_rows || jobData.value.total_rows <= 0) {
    return uploadStage.value === 'processing' ? 15 : 0;
  }
  return Math.min(100, Math.round((jobData.value.processed_rows / jobData.value.total_rows) * 100));
});

const filteredErrors = computed(() => {
  if (!jobData.value?.error_rows) return [];
  if (!errorSearchQuery.value.trim()) return jobData.value.error_rows;
  const q = errorSearchQuery.value.toLowerCase().trim();
  return jobData.value.error_rows.filter(
    (e) => String(e.row).includes(q) || e.title?.toLowerCase().includes(q) || e.error.toLowerCase().includes(q)
  );
});

async function handleFileUpload(file: File): Promise<void> {
  if (!file) return;

  const validExts = ['.xlsx', '.xls', '.csv'];
  const hasValidExt = validExts.some((ext) => file.name.toLowerCase().endsWith(ext));
  if (!hasValidExt) {
    pushToast({ message: 'Only Excel (.xlsx, .xls) or CSV (.csv) files are supported', variant: 'error' });
    return;
  }

  uploadedFileName.value = file.name;
  uploadedFileSize.value = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;
  uploadStage.value = 'uploading';
  uploadProgress.value = 0;
  jobData.value = null;

  try {
    const formData = new FormData();
    formData.append('file', file);

    const res = await new Promise<any>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/admin/books/import/excel');

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          uploadProgress.value = Math.round((e.loaded / e.total) * 100);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch {
            resolve({ success: true });
          }
        } else {
          try {
            const parsed = JSON.parse(xhr.responseText);
            reject(new Error(parsed.statusMessage || parsed.message || `Upload failed (HTTP ${xhr.status})`));
          } catch {
            reject(new Error(`Spreadsheet upload failed (HTTP ${xhr.status})`));
          }
        }
      };

      xhr.onerror = () => reject(new Error('Network connection error while uploading spreadsheet'));
      xhr.send(formData);
    });

    const jobId = res?.data?.jobId || res?.jobId;
    if (!jobId) {
      throw new Error('Server did not return a valid ingestion job ticket.');
    }

    activeJobId.value = jobId;
    uploadStage.value = 'queued';
    pushToast({ message: 'Spreadsheet received! Queued for background deduplication.', variant: 'info' });
    startPollingJob(jobId);
  } catch (err: any) {
    uploadStage.value = 'idle';
    pushToast({ message: err.message || 'Spreadsheet upload failed', variant: 'error' });
  }
}

async function handleGoogleSheetSubmit(): Promise<void> {
  if (!googleSheetUrl.value.trim()) return;

  isSubmittingSheet.value = true;
  jobData.value = null;
  uploadedFileName.value = 'Google Sheet Import';
  uploadedFileSize.value = 'Cloud Document';
  uploadStage.value = 'queued';

  try {
    const res = await $fetch<{ jobId: string; status: string }>('/api/admin/books/import', {
      method: 'POST',
      body: { sheetUrl: googleSheetUrl.value.trim() },
    });

    activeJobId.value = res.jobId;
    pushToast({ message: 'Google Sheet import queued for processing!', variant: 'info' });
    startPollingJob(res.jobId);
  } catch (err: any) {
    uploadStage.value = 'idle';
    pushToast({ message: err.data?.message || err.statusMessage || 'Failed to start Google Sheet import', variant: 'error' });
  } finally {
    isSubmittingSheet.value = false;
  }
}

function startPollingJob(jobId: string): void {
  stopPolling();

  pollTimer = setInterval(async () => {
    try {
      const res = await $fetch<ImportJobTelemetry>(`/api/admin/books/import/${jobId}`);
      jobData.value = res;

      if (res.status === 'processing') {
        uploadStage.value = 'processing';
      } else if (res.status === 'done') {
        uploadStage.value = 'completed';
        stopPolling();
        showCompletionModal.value = true;
        pushToast({
          message: `Import complete: ${res.inserted_rows} new added, ${res.updated_rows} deduplicated & updated.`,
          variant: 'success',
        });
      } else if (res.status === 'failed') {
        uploadStage.value = 'failed';
        stopPolling();
        showCompletionModal.value = true;
        pushToast({ message: 'Ingestion pipeline halted due to spreadsheet errors.', variant: 'error' });
      }
    } catch {
      // Non-blocking transient check
    }
  }, 2000);
}

function stopPolling(): void {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = undefined;
  }
}

function resetImport(): void {
  stopPolling();
  uploadStage.value = 'idle';
  activeJobId.value = null;
  jobData.value = null;
  uploadedFileName.value = '';
  googleSheetUrl.value = '';
  showCompletionModal.value = false;
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
  target.value = '';
}
</script>

<template>
  <AdminLayout>
    <div class="max-w-4xl mx-auto space-y-6">
      
      <!-- Top Return Navigation -->
      <NuxtLink
        to="/admin/books"
        class="inline-flex items-center gap-1.5 text-xs font-bold text-forest-900 hover:text-gold-600 transition-colors"
      >
        <ArrowLeft :size="14" /> Return to Books Catalog
      </NuxtLink>

      <div class="bg-paper-surface rounded-2xl shadow-soft border border-paper-border p-6 sm:p-8 space-y-7">
        
        <!-- Header -->
        <div class="flex flex-wrap justify-between items-start gap-4 pb-4 border-b border-paper-border">
          <div>
            <span class="text-[9px] sm:text-[10px] font-mono uppercase tracking-widest text-gold-600 font-bold block">
              Automated Catalog Ingestion
            </span>
            <h1 class="font-display text-2xl font-bold text-forest-950">
              Bulk Spreadsheet Importer &amp; Deduplication Engine
            </h1>
            <p class="text-xs text-ink-muted mt-1">
              Ingest titles in bulk. Existing catalog items are matched by SKU and Title to update stock, formats, and prices without duplicating.
            </p>
          </div>

          <button
            type="button"
            class="bg-paper-cream border border-gold-400/80 text-forest-950 text-xs font-bold px-3.5 py-2 rounded-xl hover:bg-amber-100 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
            @click="downloadSampleTemplate"
          >
            <Download :size="14" class="text-gold-600" /> Download CSV Template
          </button>
        </div>

        <!-- Deduplication Architecture Callout -->
        <div class="p-4 bg-paper-cream/60 border border-gold-300 rounded-2xl flex items-start gap-3.5 text-xs text-forest-950 shadow-2xs">
          <div class="w-8 h-8 rounded-xl bg-forest-950 text-gold-300 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
            <ShieldCheck :size="18" />
          </div>
          <div class="space-y-1">
            <h4 class="font-bold text-forest-950 font-sans">Active Deduplication Shield</h4>
            <p class="text-[11px] text-ink-muted leading-relaxed">
              Before inserting, the background worker performs a pre-flight scan against your active inventory. If an existing <strong>SKU</strong> or exact <strong>Title</strong> matches, it updates the pricing, formats, synopsis, and increments stock instead of spawning duplicate entries.
            </p>
          </div>
        </div>

        <!-- 1. Drag & Drop Upload Zone (Interactive when Idle) -->
        <div v-if="uploadStage === 'idle'" class="space-y-2.5">
          <label class="text-xs font-bold uppercase text-forest-950 tracking-wider font-mono block">
            1. Upload Spreadsheet File (.xlsx or .csv)
          </label>

          <div
            class="border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center transition-all cursor-pointer bg-paper-canvas/40 flex flex-col items-center justify-center gap-3.5"
            :class="isDragging ? 'border-forest-900 bg-emerald-50/50 scale-[1.01]' : 'border-paper-border hover:border-forest-900 hover:bg-paper-cream/20'"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="onDrop"
          >
            <div class="w-14 h-14 rounded-2xl bg-forest-950/5 text-forest-900 flex items-center justify-center shadow-xs">
              <Upload :size="24" />
            </div>

            <div class="space-y-1">
              <p class="text-xs sm:text-sm font-bold text-forest-950">
                Drag &amp; drop your workbook here, or <span class="text-forest-900 underline">browse files</span>
              </p>
              <p class="text-[11px] text-ink-muted">
                Accepts Excel (.xlsx, .xls) and CSV (.csv) spreadsheets up to 50MB
              </p>
            </div>

            <input
              id="excel-file-picker"
              type="file"
              accept=".xlsx,.xls,.csv"
              class="hidden"
              @change="onFileSelect"
            />
            <label
              for="excel-file-picker"
              class="bg-forest-950 text-paper text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-xl hover:bg-forest-900 cursor-pointer shadow-subtle inline-flex items-center gap-1.5 active:scale-[0.98] transition-all"
            >
              <FileSpreadsheet :size="14" class="text-gold-300" />
              <span>Select File</span>
            </label>
          </div>
        </div>

        <!-- 2. Active Upload / Processing Telemetry Dashboard -->
        <div v-else class="p-6 bg-paper-cream/60 border border-gold-400/80 rounded-2xl space-y-5 shadow-soft">
          
          <!-- Top Header State -->
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                :class="{
                  'bg-gold-500 text-forest-950 animate-pulse': uploadStage === 'uploading' || uploadStage === 'queued',
                  'bg-forest-950 text-gold-300': uploadStage === 'processing',
                  'bg-emerald-100 text-emerald-800': uploadStage === 'completed',
                  'bg-red-100 text-red-800': uploadStage === 'failed',
                }"
              >
                <RefreshCw v-if="uploadStage === 'uploading' || uploadStage === 'processing'" :size="18" class="animate-spin" />
                <CheckCircle2 v-else-if="uploadStage === 'completed'" :size="20" />
                <AlertCircle v-else-if="uploadStage === 'failed'" :size="20" />
                <FileSpreadsheet v-else :size="18" />
              </div>

              <div>
                <span class="text-[10px] font-mono uppercase font-bold tracking-wider text-ink-muted block">
                  Status:
                  <span
                    class="uppercase font-bold"
                    :class="{
                      'text-gold-600': uploadStage === 'uploading' || uploadStage === 'queued',
                      'text-forest-900': uploadStage === 'processing',
                      'text-emerald-800': uploadStage === 'completed',
                      'text-red-700': uploadStage === 'failed',
                    }"
                  >
                    {{ uploadStage }}
                  </span>
                </span>
                <h3 class="font-display font-bold text-sm sm:text-base text-forest-950 truncate max-w-sm">
                  {{ uploadedFileName }}
                </h3>
              </div>
            </div>

            <!-- Action Controls -->
            <div class="flex items-center gap-2">
              <button
                v-if="uploadStage === 'completed' || uploadStage === 'failed'"
                type="button"
                class="px-3.5 py-1.5 bg-white border border-paper-border rounded-xl text-xs font-semibold hover:bg-slate-100 text-forest-950 cursor-pointer shadow-2xs"
                @click="resetImport"
              >
                Upload Another File
              </button>
              <button
                v-if="uploadStage === 'completed'"
                type="button"
                class="px-3.5 py-1.5 bg-forest-950 text-paper rounded-xl text-xs font-bold hover:bg-forest-900 cursor-pointer shadow-subtle"
                @click="showCompletionModal = true"
              >
                View Summary
              </button>
            </div>
          </div>

          <!-- Progress Bar -->
          <div class="space-y-1.5">
            <div class="flex justify-between text-xs font-mono font-bold text-forest-950">
              <span v-if="uploadStage === 'uploading'">Uploading to pipeline ({{ uploadProgress }}%)...</span>
              <span v-else-if="uploadStage === 'queued'">Job queued in BullMQ worker. Awaiting worker slot...</span>
              <span v-else-if="uploadStage === 'processing'">
                Processing row {{ jobData?.processed_rows || 0 }} of {{ jobData?.total_rows || '...' }}
              </span>
              <span v-else-if="uploadStage === 'completed'">Ingestion Complete (100%)</span>
              <span v-else>Job Terminated with Errors</span>

              <span>{{ progressPercentage }}%</span>
            </div>

            <div class="w-full bg-paper-canvas rounded-full h-3 overflow-hidden border border-paper-border">
              <div
                class="h-full transition-all duration-300 rounded-full"
                :class="{
                  'bg-gold-500': uploadStage === 'uploading' || uploadStage === 'queued',
                  'bg-forest-950': uploadStage === 'processing',
                  'bg-emerald-600': uploadStage === 'completed',
                  'bg-red-600': uploadStage === 'failed',
                }"
                :style="{ width: `${progressPercentage}%` }"
              />
            </div>
          </div>

          <!-- Live Deduplication Telemetry Tiles -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <!-- Metric 1: Inserted -->
            <div class="bg-white p-3 rounded-xl border border-paper-border space-y-0.5 shadow-2xs">
              <div class="flex items-center gap-1.5 text-emerald-800 text-[10px] font-mono uppercase font-bold">
                <PlusCircle :size="12" />
                <span>New Titles</span>
              </div>
              <p class="font-mono text-lg font-bold text-forest-950 tabular-figure">
                {{ jobData?.inserted_rows || 0 }}
              </p>
            </div>

            <!-- Metric 2: Updated (Deduplicated) -->
            <div class="bg-white p-3 rounded-xl border border-paper-border space-y-0.5 shadow-2xs">
              <div class="flex items-center gap-1.5 text-gold-600 text-[10px] font-mono uppercase font-bold">
                <CopyCheck :size="12" />
                <span>Deduplicated</span>
              </div>
              <p class="font-mono text-lg font-bold text-gold-600 tabular-figure">
                {{ jobData?.updated_rows || 0 }}
              </p>
            </div>

            <!-- Metric 3: Skipped -->
            <div class="bg-white p-3 rounded-xl border border-paper-border space-y-0.5 shadow-2xs">
              <div class="flex items-center gap-1.5 text-ink-muted text-[10px] font-mono uppercase font-bold">
                <Layers :size="12" />
                <span>Skipped</span>
              </div>
              <p class="font-mono text-lg font-bold text-ink-muted tabular-figure">
                {{ jobData?.skipped_rows || 0 }}
              </p>
            </div>

            <!-- Metric 4: Failed Errors -->
            <div class="bg-white p-3 rounded-xl border border-paper-border space-y-0.5 shadow-2xs">
              <div class="flex items-center gap-1.5 text-red-700 text-[10px] font-mono uppercase font-bold">
                <AlertTriangle :size="12" />
                <span>Failed Rows</span>
              </div>
              <p class="font-mono text-lg font-bold text-red-700 tabular-figure">
                {{ jobData?.error_rows?.length || 0 }}
              </p>
            </div>
          </div>

          <!-- Active Error Warning Strip -->
          <div
            v-if="jobData?.error_rows && jobData.error_rows.length > 0"
            class="p-3.5 bg-red-50 border border-red-200 rounded-xl space-y-2 text-xs"
          >
            <div class="flex items-center justify-between font-bold text-red-800">
              <span class="flex items-center gap-1.5">
                <AlertCircle :size="14" /> {{ jobData.error_rows.length }} Row(s) encountered issues:
              </span>
              <button
                type="button"
                class="text-[11px] underline cursor-pointer hover:text-red-950"
                @click="showCompletionModal = true"
              >
                Inspect All
              </button>
            </div>
            <div class="max-h-24 overflow-y-auto space-y-1 text-red-700 font-mono text-[11px]">
              <div v-for="(err, i) in jobData.error_rows.slice(0, 3)" :key="i">
                Row {{ err.row }}: {{ err.error }} <span v-if="err.title">({{ err.title }})</span>
              </div>
              <div v-if="jobData.error_rows.length > 3" class="text-ink-muted italic">
                + {{ jobData.error_rows.length - 3 }} more errors...
              </div>
            </div>
          </div>
        </div>

        <!-- 3. Google Sheet Option (Available when Idle) -->
        <div v-if="uploadStage === 'idle'" class="space-y-2.5 pt-4 border-t border-paper-border">
          <label class="text-xs font-bold uppercase text-forest-950 tracking-wider font-mono block">
            2. Or Ingest Live via Public Google Sheet URL
          </label>

          <form class="flex gap-2.5" @submit.prevent="handleGoogleSheetSubmit">
            <input
              v-model="googleSheetUrl"
              type="url"
              placeholder="https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit"
              class="flex-1 px-3.5 py-2.5 bg-paper-canvas/50 border border-paper-border rounded-xl text-xs outline-none focus:bg-white focus:border-forest-900 transition-all text-forest-950"
              :disabled="isSubmittingSheet"
            />
            <button
              type="submit"
              class="bg-forest-950 text-paper text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-xl hover:bg-forest-900 disabled:opacity-50 cursor-pointer flex items-center gap-1.5 transition-all shadow-subtle"
              :disabled="!googleSheetUrl || isSubmittingSheet"
            >
              <RefreshCw v-if="isSubmittingSheet" :size="13" class="animate-spin" />
              <span>Import Sheet</span>
            </button>
          </form>
          <p class="text-[11px] text-ink-muted">
            Ensure your Google Sheet link access is set to <em>"Anyone with the link can view"</em>.
          </p>
        </div>
      </div>
    </div>

    <!-- DIALOGUE MODAL: Ingestion Completion & Deduplication Summary -->
    <Teleport to="body">
      <div
        v-if="showCompletionModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest-950/70 backdrop-blur-xs"
        @click.self="showCompletionModal = false"
      >
        <div
          class="bg-white rounded-2xl shadow-2xl border border-paper-border max-w-xl w-full p-6 sm:p-7 space-y-5 animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col"
        >
          <!-- Modal Header -->
          <div class="flex items-start justify-between pb-3 border-b border-paper-border">
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-xl flex items-center justify-center"
                :class="jobData?.status === 'done' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'"
              >
                <CheckCircle2 v-if="jobData?.status === 'done'" :size="20" />
                <AlertTriangle v-else :size="20" />
              </div>
              <div>
                <h3 class="font-display font-bold text-base text-forest-950">
                  {{ jobData?.status === 'done' ? 'Catalog Ingestion Complete' : 'Ingestion Pipeline Report' }}
                </h3>
                <p class="text-xs text-ink-muted">
                  Batch summary with duplicate tracking and error forensics.
                </p>
              </div>
            </div>

            <button
              type="button"
              class="text-ink-muted hover:text-forest-950 p-1 cursor-pointer"
              @click="showCompletionModal = false"
            >
              <X :size="18" />
            </button>
          </div>

          <!-- Summary Metric Blocks -->
          <div class="grid grid-cols-3 gap-3">
            <div class="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-0.5">
              <span class="text-[10px] uppercase font-mono font-bold text-emerald-900 block">Created</span>
              <span class="text-xl font-mono font-extrabold text-emerald-950">{{ jobData?.inserted_rows || 0 }}</span>
            </div>

            <div class="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center space-y-0.5">
              <span class="text-[10px] uppercase font-mono font-bold text-amber-900 block">Deduplicated</span>
              <span class="text-xl font-mono font-extrabold text-amber-950">{{ jobData?.updated_rows || 0 }}</span>
            </div>

            <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-0.5">
              <span class="text-[10px] uppercase font-mono font-bold text-slate-700 block">Skipped / Failed</span>
              <span class="text-xl font-mono font-extrabold text-slate-900">
                {{ (jobData?.skipped_rows || 0) + (jobData?.error_rows?.length || 0) }}
              </span>
            </div>
          </div>

          <!-- Error Rows Inspection Panel -->
          <div v-if="jobData?.error_rows && jobData.error_rows.length > 0" class="flex-1 min-h-0 space-y-2 pt-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-red-800 uppercase font-mono">
                Row Error Forensics ({{ jobData.error_rows.length }})
              </span>
              <div class="relative w-44">
                <Search :size="12" class="absolute left-2.5 top-2 text-ink-subtle pointer-events-none" />
                <input
                  v-model="errorSearchQuery"
                  type="text"
                  placeholder="Filter errors..."
                  class="w-full pl-7 pr-2 py-1 border border-paper-border rounded-lg text-[11px] outline-none"
                />
              </div>
            </div>

            <div class="max-h-48 overflow-y-auto border border-red-200 rounded-xl bg-red-50/40 divide-y divide-red-100 text-xs">
              <div
                v-for="(err, idx) in filteredErrors"
                :key="idx"
                class="p-2.5 flex items-start justify-between gap-3 text-red-900"
              >
                <div>
                  <strong>Row {{ err.row }}:</strong> {{ err.error }}
                  <span v-if="err.title" class="text-ink-muted block text-[11px]">Title: {{ err.title }}</span>
                </div>
              </div>
            </div>
          </div>

          <p v-else class="text-xs text-emerald-800 bg-emerald-50 p-3 rounded-xl border border-emerald-200">
            âœ“ Zero row errors encountered. All spreadsheet lines were ingested and verified successfully.
          </p>

          <!-- Modal Action Buttons -->
          <div class="pt-3 border-t border-paper-border flex flex-wrap justify-between gap-2.5 items-center">
            <button
              type="button"
              class="px-4 py-2 text-xs font-semibold text-ink-muted hover:text-forest-950 cursor-pointer"
              @click="resetImport"
            >
              Import Another File
            </button>

            <NuxtLink
              to="/admin/books"
              class="bg-forest-950 hover:bg-forest-900 text-paper text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-subtle flex items-center gap-1.5 transition-all"
            >
              <BookOpen :size="14" class="text-gold-300" />
              <span>Go to Books Catalog</span>
            </NuxtLink>
          </div>
        </div>
      </div>
    </Teleport>
  </AdminLayout>
</template>