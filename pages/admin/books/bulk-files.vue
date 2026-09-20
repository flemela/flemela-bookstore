<!-- pages/admin/books/bulk-files.vue -->
<!--
  Bulk eBook & Cover Upload.
  Attaches files to existing books by SKU, using the same calls as the book edit page:
    - PDFs  (SR-B123.pdf)  -> upload-url + R2 PUT, then PATCH/POST the book's PDF format
    - Covers (SR-B123.jpg) -> Cloudinary signed upload, then PATCH the book's images
    - Cover links (CSV of SKU,image_url) -> PATCH the book's images, no upload
  Runs in the admin's own browser session. Finished SKUs are remembered per mode, so a
  re-run (e.g. after logging in again) skips them.
-->
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { ofetch } from 'ofetch';
import { UploadCloud, Play, Pause, RefreshCw, Download, AlertTriangle, CheckCircle2 } from 'lucide-vue-next';
import AdminLayout from '~/components/admin/AdminLayout.vue';
import { useToast } from '~/composables/useToast';

definePageMeta({
  middleware: 'admin-auth',
});

const { push: pushToast } = useToast();

type Mode = 'pdf' | 'cover' | 'cover-links';

interface BookRef {
  id: string;
  name: string;
  pdfFormatId: string | null;
  pdfPrice: number | null;
}

interface Job {
  sku: string;
  file?: File;
  imageUrl?: string;
}

interface LogRow {
  sku: string;
  status: 'done' | 'skipped' | 'failed';
  detail: string;
}

const mode = ref<Mode>('pdf');
const defaultPdfPrice = ref(100);
// The store refuses bursts, so work one book at a time with a gap between them.
const concurrency = 1;
const gapMs = 400;
const throttleWaits = [15000, 30000, 60000, 120000];
const throttledUntil = ref(0);
const throttleNotice = ref('');

const lookupCache = new Map<string, BookRef | null>();
const indexProgress = ref('');

const jobs = ref<Job[]>([]);
const isDragging = ref(false);
const running = ref(false);
const pausedForLogin = ref(false);
const stopRequested = ref(false);
const log = ref<LogRow[]>([]);

const doneCount = computed(() => log.value.filter((r) => r.status === 'done').length);
const failedCount = computed(() => log.value.filter((r) => r.status === 'failed').length);
const skippedCount = computed(() => log.value.filter((r) => r.status === 'skipped').length);
const processed = computed(() => log.value.length);

const SKU_RE = /^(SR-B\d+)/i;

// ---------- remembered progress ----------
function doneKey(): string {
  return `bulk-files-done:${mode.value}`;
}
function loadDone(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(doneKey()) || '[]'));
  } catch {
    return new Set();
  }
}
function markDone(sku: string): void {
  try {
    const s = loadDone();
    s.add(sku);
    localStorage.setItem(doneKey(), JSON.stringify([...s]));
  } catch {
    // Storage full or blocked: the run still works, it just won't remember this SKU.
  }
}
function forgetProgress(): void {
  try {
    localStorage.removeItem(doneKey());
  } catch {}
  pushToast({ message: 'Remembered progress cleared for this mode', variant: 'info' });
}

// ---------- SKU -> book ----------
// Looked up one SKU at a time: the catalog search puts an exact SKU match first.
// (Reading the whole catalog up front meant 400+ requests, and one failed page lost the lot.)
async function lookupBySku(sku: string): Promise<BookRef | null> {
  if (lookupCache.has(sku)) return lookupCache.get(sku)!;
  const res = await ofetch<{ products: any[] }>('/api/admin/books', { query: { q: sku, limit: 5 } });
  const b = (res.products || []).find((p: any) => String(p.sku || '').toUpperCase() === sku);
  const pdf = b ? (b.formats || []).find((f: any) => f.format === 'pdf') : null;
  const found = b
    ? { id: b.id, name: b.name, pdfFormatId: pdf?.id || null, pdfPrice: pdf ? Number(pdf.price) : null }
    : null;
  lookupCache.set(sku, found);
  return found;
}

// ---------- choosing files ----------
function onFilesChosen(e: Event): void {
  const input = e.target as HTMLInputElement;
  const files = [...(input.files || [])];
  const wanted = mode.value === 'pdf' ? /\.pdf$/i : /\.(jpe?g|png|webp)$/i;
  jobs.value = files
    .filter((f) => wanted.test(f.name))
    .map((f) => ({ sku: (SKU_RE.exec(f.name)?.[1] || '').toUpperCase(), file: f }))
    .filter((j) => j.sku);
  log.value = [];
  input.value = '';
  pushToast({ message: `${jobs.value.length} files matched a SKU`, variant: 'info' });
}

function acceptFiles(files: File[]): void {
  const wanted = mode.value === 'pdf' ? /\.pdf$/i : /\.(jpe?g|png|webp)$/i;
  jobs.value = files
    .filter((f) => wanted.test(f.name))
    .map((f) => ({ sku: (SKU_RE.exec(f.name)?.[1] || '').toUpperCase(), file: f }))
    .filter((j) => j.sku);
  log.value = [];
  pushToast({
    message: jobs.value.length
      ? `${jobs.value.length} files matched a SKU`
      : 'No files here are named by SKU (e.g. SR-B2534.pdf)',
    variant: jobs.value.length ? 'info' : 'error',
  });
}

// Chrome can hand over a whole folder in one click, with no file dialog to navigate.
const canPickFolder = typeof window !== 'undefined' && 'showDirectoryPicker' in window;
const savedFolderName = ref('');

// The chosen folder is kept in IndexedDB so a reload (or a deploy) doesn't cost the
// admin another trip through File Explorer.
function handleStore(mode: IDBTransactionMode): Promise<IDBObjectStore> {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open('bulk-files', 1);
    open.onupgradeneeded = () => open.result.createObjectStore('handles');
    open.onsuccess = () => resolve(open.result.transaction('handles', mode).objectStore('handles'));
    open.onerror = () => reject(open.error);
  });
}

async function rememberFolder(dir: any): Promise<void> {
  try {
    const store = await handleStore('readwrite');
    store.put(dir, 'folder');
    savedFolderName.value = dir.name;
  } catch {
    // Without storage the page still works; the folder just has to be chosen again.
  }
}

async function savedFolder(): Promise<any | null> {
  try {
    const store = await handleStore('readonly');
    return await new Promise((resolve) => {
      const req = store.get('folder');
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

async function readFolder(dir: any): Promise<void> {
  const files: File[] = [];
  for await (const entry of dir.values()) {
    if (entry.kind === 'file') files.push(await entry.getFile());
  }
  acceptFiles(files);
}

async function pickFolder(): Promise<void> {
  try {
    const dir = await (window as any).showDirectoryPicker();
    await rememberFolder(dir);
    await readFolder(dir);
  } catch {
    // The picker was closed without choosing anything.
  }
}

async function useSavedFolder(): Promise<void> {
  const dir = await savedFolder();
  if (!dir) return;
  try {
    const opts = { mode: 'read' as const };
    let permission = await dir.queryPermission(opts);
    if (permission !== 'granted') permission = await dir.requestPermission(opts);
    if (permission !== 'granted') return;
    await readFolder(dir);
  } catch {
    pushToast({ message: 'That folder could not be reopened - choose it again', variant: 'error' });
  }
}

onMounted(async () => {
  const dir = await savedFolder();
  if (!dir) return;
  savedFolderName.value = dir.name;
  try {
    if ((await dir.queryPermission({ mode: 'read' })) === 'granted') await readFolder(dir);
  } catch {
    // Permission lapsed: the "Use saved folder" button asks for it back with one click.
  }
});

async function onDrop(e: DragEvent): Promise<void> {
  isDragging.value = false;
  const files = [...(e.dataTransfer?.files || [])];
  if (files.length) acceptFiles(files);
}

async function onLinksCsvChosen(e: Event): Promise<void> {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;
  const text = await file.text();
  jobs.value = text
    .split(/\r?\n/)
    .map((line) => line.split(','))
    .filter((c) => SKU_RE.test((c[0] || '').trim()) && /^https?:\/\//.test((c[1] || '').trim()))
    .map((c) => ({ sku: c[0].trim().toUpperCase(), imageUrl: c[1].trim() }));
  log.value = [];
  pushToast({ message: `${jobs.value.length} cover links read`, variant: 'info' });
}

// ---------- per-file work ----------
class SessionExpired extends Error {}

function isAuthError(err: any): boolean {
  const status = err?.response?.status || err?.statusCode;
  return status === 401 || status === 403;
}

// The store answers 429 when asked for too much at once. Waiting and retrying the same
// book is right here; giving up on it (as this page first did) loses work for no reason.
function isThrottled(err: any): boolean {
  const status = err?.response?.status || err?.statusCode;
  const message = err?.data?.message || err?.statusMessage || err?.message || '';
  return status === 429 || /too many requests/i.test(message);
}

async function waitOutThrottle(level: number): Promise<void> {
  const ms = throttleWaits[Math.min(level, throttleWaits.length - 1)];
  throttledUntil.value = Date.now() + ms;
  throttleNotice.value = `Store asked us to slow down - waiting ${Math.round(ms / 1000)}s before retrying`;
  await new Promise((r) => setTimeout(r, ms));
  throttleNotice.value = '';
}

function putToR2(uploadUrl: string, file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl, true);
    xhr.setRequestHeader('Content-Type', 'application/pdf');
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`R2 returned HTTP ${xhr.status}`)));
    xhr.onerror = () => reject(new Error('Network error uploading to R2'));
    xhr.send(file);
  });
}

async function attachPdf(book: BookRef, file: File): Promise<string> {
  const slot = await ofetch<{ uploadUrl: string; key: string; fileUrl?: string }>('/api/admin/books/upload-url', {
    method: 'POST',
    body: { filename: file.name, format: 'pdf', contentType: 'application/pdf' },
  });
  await putToR2(slot.uploadUrl, file);

  const fileFields = {
    file_url: slot.fileUrl || slot.key,
    file_public_id: slot.key,
    file_size_bytes: file.size,
  };
  if (book.pdfFormatId) {
    await ofetch(`/api/admin/books/${book.id}/formats/${book.pdfFormatId}`, {
      method: 'PATCH',
      body: { price: book.pdfPrice ?? defaultPdfPrice.value, ...fileFields },
    });
  } else {
    await ofetch(`/api/admin/books/${book.id}/formats`, {
      method: 'POST',
      body: { format: 'pdf', price: defaultPdfPrice.value, ...fileFields },
    });
  }
  return slot.key;
}

let signature: { data: any; fetchedAt: number } | null = null;

async function cloudinarySignature(): Promise<any> {
  // Signatures last about an hour; refresh well before that.
  if (!signature || Date.now() - signature.fetchedAt > 45 * 60 * 1000) {
    signature = {
      data: await ofetch('/api/admin/upload-signature', { method: 'POST' }),
      fetchedAt: Date.now(),
    };
  }
  return signature.data;
}

async function setCover(book: BookRef, imageUrl: string, publicId: string): Promise<void> {
  await ofetch(`/api/admin/books/${book.id}`, {
    method: 'PATCH',
    body: { images: [{ image_url: imageUrl, image_public_id: publicId }] },
  });
}

async function attachCoverFile(book: BookRef, file: File): Promise<string> {
  const sig = await cloudinarySignature();
  const form = new FormData();
  form.append('file', file);
  form.append('api_key', sig.apiKey);
  form.append('timestamp', String(sig.timestamp));
  form.append('signature', sig.signature);
  form.append('folder', sig.folder);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, { method: 'POST', body: form });
  const data = await res.json();
  if (!data.secure_url) {
    signature = null; // likely expired; the next attempt fetches a fresh one
    throw new Error(data.error?.message || 'Cloudinary upload failed');
  }
  await setCover(book, data.secure_url, data.public_id);
  return data.secure_url;
}

async function runJob(job: Job, done: Set<string>): Promise<void> {
  if (done.has(job.sku)) {
    log.value.push({ sku: job.sku, status: 'skipped', detail: 'already done in an earlier run' });
    return;
  }
  let attempt = 0;
  let throttles = 0;
  while (attempt < 3 && throttles <= throttleWaits.length + 2) {
    try {
      const book = await lookupBySku(job.sku);
      if (!book) {
        log.value.push({ sku: job.sku, status: 'failed', detail: 'no book with this SKU in the store' });
        return;
      }
      let detail = '';
      if (mode.value === 'pdf') detail = await attachPdf(book, job.file!);
      else if (mode.value === 'cover') detail = await attachCoverFile(book, job.file!);
      else {
        await setCover(book, job.imageUrl!, 'cover_img');
        detail = job.imageUrl!;
      }
      markDone(job.sku);
      log.value.push({ sku: job.sku, status: 'done', detail });
      return;
    } catch (err: any) {
      if (isAuthError(err)) throw new SessionExpired();
      if (isThrottled(err)) {
        await waitOutThrottle(throttles++);     // a refusal to serve is not this book's fault
        if (stopRequested.value) return;
        continue;
      }
      if (++attempt >= 3) {
        log.value.push({ sku: job.sku, status: 'failed', detail: err?.data?.message || err?.message || 'failed' });
      }
    }
  }
  if (throttles > throttleWaits.length + 2) {
    log.value.push({ sku: job.sku, status: 'failed', detail: 'store kept refusing requests - try again later' });
  }
}

async function start(testOne = false): Promise<void> {
  if (!jobs.value.length) return;

  running.value = true;
  pausedForLogin.value = false;
  stopRequested.value = false;
  const done = loadDone();
  const queue = testOne ? jobs.value.filter((j) => !done.has(j.sku)).slice(0, 1) : [...jobs.value];
  let next = 0;

  try {
    await Promise.all(
      Array.from({ length: testOne ? 1 : concurrency }, async () => {
        while (!stopRequested.value && next < queue.length) {
          await runJob(queue[next++], done);
          if (gapMs) await new Promise((r) => setTimeout(r, gapMs));   // keep under the store's rate limit
        }
      })
    );
    if (!stopRequested.value) {
      pushToast({
        message: testOne ? 'Test file done - check that book, then run the rest' : `Finished: ${doneCount.value} done, ${failedCount.value} failed`,
        variant: failedCount.value ? 'error' : 'success',
      });
    }
  } catch (err) {
    if (err instanceof SessionExpired) {
      stopRequested.value = true;
      pausedForLogin.value = true;
      running.value = false;
      watchForLogin(testOne);        // carry on by itself once the admin logs back in
    } else {
      throw err;
    }
  } finally {
    running.value = false;
  }
}

// After a session lapse there is nothing to decide: keep checking, and pick the run back
// up the moment the login works again.
let loginWatch: ReturnType<typeof setInterval> | undefined;

function watchForLogin(testOne: boolean): void {
  clearInterval(loginWatch);
  loginWatch = setInterval(async () => {
    if (!pausedForLogin.value) return clearInterval(loginWatch);
    try {
      const res = await fetch('/api/admin/books?q=SR-B1&limit=1', { credentials: 'include' });
      if (res.status !== 200) return;
      clearInterval(loginWatch);
      pausedForLogin.value = false;
      pushToast({ message: 'Signed in again - carrying on', variant: 'success' });
      start(testOne);
    } catch {
      // Still offline or still logged out; try again on the next tick.
    }
  }, 10000);
}

onUnmounted(() => clearInterval(loginWatch));

function stop(): void {
  stopRequested.value = true;
}

function downloadLog(): void {
  const lines = ['SellerSKU,status,detail', ...log.value.map((r) => [r.sku, r.status, `"${r.detail.replace(/"/g, '""')}"`].join(','))];
  const url = URL.createObjectURL(new Blob([lines.join('\r\n')], { type: 'text/csv' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `bulk-${mode.value}-results.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
</script>

<template>
  <AdminLayout>
    <div class="max-w-4xl mx-auto space-y-6">
      <div class="bg-paper-surface rounded-2xl shadow-soft border border-paper-border p-6 sm:p-8 space-y-6">
        <div class="pb-4 border-b border-paper-border">
          <span class="text-[10px] font-mono uppercase tracking-widest text-gold-600 font-bold block">Catalog Files</span>
          <h1 class="font-display text-2xl font-bold text-forest-950">Bulk eBook &amp; Cover Upload</h1>
          <p class="text-xs text-ink-muted mt-1">
            Attach PDFs or covers to books that are already in the store. Name each file by SKU, e.g.
            <code>SR-B2534.pdf</code> or <code>SR-B2534.jpg</code>.
          </p>
        </div>

        <!-- 1. Mode -->
        <div class="space-y-2">
          <label class="text-xs font-bold uppercase text-forest-950 tracking-wider font-mono block">1. What are you uploading?</label>
          <div class="flex flex-wrap gap-2 text-xs">
            <label v-for="m in [
              { v: 'pdf', t: 'PDF eBooks (.pdf)' },
              { v: 'cover', t: 'Cover images (.jpg / .png)' },
              { v: 'cover-links', t: 'Cover links (CSV: SKU, image URL)' },
            ]" :key="m.v"
              class="px-3 py-2 rounded-xl border cursor-pointer"
              :class="mode === m.v ? 'bg-forest-950 text-paper border-forest-950' : 'bg-white border-paper-border text-forest-950'">
              <input v-model="mode" type="radio" :value="m.v" class="hidden" :disabled="running" @change="jobs = []; log = []" />
              {{ m.t }}
            </label>
          </div>
          <div v-if="mode === 'pdf'" class="flex items-center gap-2 text-xs text-ink-muted">
            PDF price for books that don't have a PDF option yet (KSh):
            <input v-model.number="defaultPdfPrice" type="number" min="1" class="w-24 px-2 py-1 border border-paper-border rounded-lg font-mono" />
          </div>
        </div>

        <!-- 2. Files -->
        <div class="space-y-2">
          <label class="text-xs font-bold uppercase text-forest-950 tracking-wider font-mono block">2. Choose files</label>
          <div v-if="mode !== 'cover-links'" class="space-y-2">
            <div
              class="border-2 border-dashed rounded-2xl p-6 text-center transition-all"
              :class="isDragging ? 'border-forest-900 bg-emerald-50/60' : 'border-paper-border bg-paper-canvas/40'"
              @dragover.prevent="isDragging = true"
              @dragleave.prevent="isDragging = false"
              @drop.prevent="onDrop"
            >
              <p class="text-xs font-bold text-forest-950">
                Drag the {{ mode === 'pdf' ? 'PDFs' : 'cover images' }} here from File Explorer
              </p>
              <p class="text-[11px] text-ink-muted mt-1">
                Open the folder, press Ctrl+A to select everything, then drag it onto this box.
              </p>
            </div>

            <div class="flex flex-wrap gap-2">
              <button
                v-if="canPickFolder"
                type="button"
                class="bg-forest-950 text-paper text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
                :disabled="running"
                @click="pickFolder"
              >
                <UploadCloud :size="14" /> Choose a folder
              </button>
              <button
                v-if="savedFolderName && !jobs.length"
                type="button"
                class="bg-white border border-gold-400 text-forest-950 text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer inline-flex items-center gap-1.5"
                :disabled="running"
                @click="useSavedFolder"
              >
                <RefreshCw :size="13" /> Use saved folder ({{ savedFolderName }})
              </button>
              <label class="bg-white border border-paper-border text-forest-950 text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer">
                …or select files
                <input type="file" class="hidden" multiple :accept="mode === 'pdf' ? '.pdf' : 'image/*'" :disabled="running" @change="onFilesChosen" />
              </label>
            </div>
          </div>
          <label v-else class="bg-forest-950 text-paper text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer inline-flex items-center gap-1.5">
            <UploadCloud :size="14" /> Select links CSV
            <input type="file" class="hidden" accept=".csv" :disabled="running" @change="onLinksCsvChosen" />
          </label>
          <p class="text-xs text-ink-muted">{{ jobs.length }} ready{{ indexProgress ? ` - ${indexProgress}` : '' }}</p>
        </div>

        <!-- 3. Run -->
        <div class="space-y-3">
          <label class="text-xs font-bold uppercase text-forest-950 tracking-wider font-mono block">3. Run</label>
          <div class="flex flex-wrap gap-2">
            <button type="button" class="bg-white border border-paper-border text-forest-950 text-xs font-bold px-4 py-2.5 rounded-xl disabled:opacity-50"
              :disabled="running || !jobs.length" @click="start(true)">
              Test with 1 file first
            </button>
            <button type="button" class="bg-forest-950 text-paper text-xs font-bold px-4 py-2.5 rounded-xl inline-flex items-center gap-1.5 disabled:opacity-50"
              :disabled="running || !jobs.length" @click="start(false)">
              <Play :size="13" /> {{ pausedForLogin ? 'Resume' : 'Run all' }}
            </button>
            <button v-if="running" type="button" class="bg-white border border-paper-border text-forest-950 text-xs font-bold px-4 py-2.5 rounded-xl inline-flex items-center gap-1.5" @click="stop">
              <Pause :size="13" /> Stop
            </button>
            <span v-if="running" class="text-xs text-ink-muted px-3 py-2.5 inline-flex items-center gap-1.5">
              <RefreshCw :size="13" class="animate-spin" /> working…
            </span>
          </div>

          <div v-if="throttleNotice" class="p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 flex items-start gap-2">
            <RefreshCw :size="14" class="mt-0.5 flex-shrink-0 animate-spin" />
            {{ throttleNotice }} - nothing is lost, the same book is retried.
          </div>

          <div v-if="pausedForLogin" class="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-start gap-2">
            <AlertTriangle :size="14" class="mt-0.5 flex-shrink-0" />
            Your admin session expired. Log in again in another tab, come back here and press <strong>Resume</strong> - finished books are skipped.
          </div>

          <div v-if="processed" class="grid grid-cols-3 gap-3 text-center">
            <div class="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <span class="text-[10px] uppercase font-mono font-bold text-emerald-900 block">Done</span>
              <span class="text-xl font-mono font-extrabold text-emerald-950">{{ doneCount }}</span>
            </div>
            <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span class="text-[10px] uppercase font-mono font-bold text-slate-700 block">Skipped</span>
              <span class="text-xl font-mono font-extrabold text-slate-900">{{ skippedCount }}</span>
            </div>
            <div class="p-3 bg-red-50 border border-red-200 rounded-xl">
              <span class="text-[10px] uppercase font-mono font-bold text-red-900 block">Failed</span>
              <span class="text-xl font-mono font-extrabold text-red-950">{{ failedCount }}</span>
            </div>
          </div>
          <p v-if="processed" class="text-xs text-ink-muted">
            <CheckCircle2 :size="12" class="inline" /> {{ processed }} of {{ jobs.length }} processed
          </p>

          <div class="flex flex-wrap gap-3">
            <button v-if="processed" type="button" class="text-xs font-semibold text-forest-900 underline inline-flex items-center gap-1" @click="downloadLog">
              <Download :size="12" /> Download results CSV
            </button>
            <button type="button" class="text-xs text-ink-muted underline" :disabled="running" @click="forgetProgress">
              Forget remembered progress for this mode
            </button>
          </div>

          <div v-if="failedCount" class="max-h-48 overflow-y-auto border border-red-200 rounded-xl bg-red-50/40 divide-y divide-red-100 text-xs">
            <div v-for="r in log.filter((x) => x.status === 'failed')" :key="r.sku" class="p-2 text-red-900">
              <strong>{{ r.sku }}</strong>: {{ r.detail }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>
