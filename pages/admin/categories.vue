<!-- pages/admin/categories.vue -->
<script setup lang="ts">
// =============================================================================
// flemela/pages/admin/categories.vue
// Category Tiles Admin — upload images (or paste URLs), toggle featured,
// reorder, rename tiles shown on the storefront "Shop by Category" rail.
// =============================================================================
import { ref, onMounted } from 'vue';
import {
  LayoutGrid,
  Upload,
  RefreshCw,
  X as XIcon,
  Save,
  Check,
} from 'lucide-vue-next';
import AdminLayout from '~/components/admin/AdminLayout.vue';
import { useToast } from '~/composables/useToast';

definePageMeta({
  middleware: 'admin-auth',
});

interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  is_featured: boolean;
  sort_order: number;
  product_count?: number;
}

const { push: pushToast } = useToast();
const categories = ref<AdminCategory[]>([]);
const isLoading = ref(false);
const savingRow = ref<string | null>(null);
const uploadingRow = ref<string | null>(null);
const urlDrafts = ref<Record<string, string>>({});

async function loadCategories(): Promise<void> {
  isLoading.value = true;
  try {
    const res = await $fetch<AdminCategory[] | { categories?: AdminCategory[] }>('/api/admin/categories');
    const list = Array.isArray(res) ? res : (res?.categories ?? []);
    categories.value = list.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name));
    urlDrafts.value = Object.fromEntries(list.map((c) => [c.id, c.image_url ?? '']));
  } catch (err: any) {
    pushToast({ message: err.data?.statusMessage || 'Failed to load categories', variant: 'error' });
  } finally {
    isLoading.value = false;
  }
}

onMounted(loadCategories);

async function patchCategory(category: AdminCategory, body: Record<string, unknown>): Promise<void> {
  try {
    await $fetch(`/api/admin/categories/${category.id}`, {
      method: 'PATCH',
      body,
    });
  } catch (err: any) {
    pushToast({
      message: err.data?.statusMessage || err.statusMessage || 'Failed to save category',
      variant: 'error',
    });
    throw err;
  }
}

async function handleToggleFeatured(category: AdminCategory): Promise<void> {
  const next = !category.is_featured;
  category.is_featured = next;
  try {
    await patchCategory(category, { is_featured: next });
    pushToast({ message: `"${category.name}" ${next ? 'featured' : 'unfeatured'}`, variant: 'success' });
  } catch {
    category.is_featured = !next;
  }
}

async function handleSortChange(category: AdminCategory): Promise<void> {
  try {
    await patchCategory(category, { sort_order: Number(category.sort_order) || 0 });
    pushToast({ message: `Order saved for "${category.name}"`, variant: 'success' });
  } catch {
    // handled by patchCategory
  }
}

async function handleSaveImageUrl(category: AdminCategory): Promise<void> {
  const url = (urlDrafts.value[category.id] ?? '').trim();
  savingRow.value = category.id;
  try {
    const updated = await $fetch<{ image_url: string | null }>(`/api/admin/categories/${category.id}`, {
      method: 'PATCH',
      body: { image_url: url || null },
    });
    category.image_url = updated?.image_url ?? (url || null);
    pushToast({ message: `Image updated for "${category.name}"`, variant: 'success' });
  } catch (err: any) {
    pushToast({
      message: err.data?.statusMessage || err.statusMessage || 'Failed to save image',
      variant: 'error',
    });
  } finally {
    savingRow.value = null;
  }
}

async function handleImageUpload(category: AdminCategory, event: Event): Promise<void> {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  uploadingRow.value = category.id;
  try {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const mime = file.type || (ext === 'png' ? 'image/png' : 'image/jpeg');

    const slot = await $fetch<{ uploadUrl: string; publicUrl: string }>('/api/admin/upload-signature', {
      method: 'POST',
      body: {
        target: 'banners',
        filename: file.name,
        contentType: mime,
      },
    });

    const putRes = await fetch(slot.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': mime },
      body: file,
    });

    if (!putRes.ok) {
      throw new Error(`Upload rejected with HTTP ${putRes.status}`);
    }

    const updated = await $fetch<{ image_url: string | null }>(`/api/admin/categories/${category.id}`, {
      method: 'PATCH',
      body: { image_url: slot.publicUrl },
    });

    category.image_url = updated?.image_url ?? slot.publicUrl;
    urlDrafts.value[category.id] = category.image_url ?? '';
    pushToast({ message: `Cover image set for "${category.name}"`, variant: 'success' });
  } catch (err: any) {
    pushToast({ message: err.data?.message || err.message || 'Image upload failed', variant: 'error' });
  } finally {
    uploadingRow.value = null;
    target.value = '';
  }
}

async function handleRemoveImage(category: AdminCategory): Promise<void> {
  savingRow.value = category.id;
  try {
    await $fetch(`/api/admin/categories/${category.id}`, {
      method: 'PATCH',
      body: { image_url: null },
    });
    category.image_url = null;
    urlDrafts.value[category.id] = '';
    pushToast({ message: `Removed image for "${category.name}"`, variant: 'info' });
  } catch (err: any) {
    pushToast({
      message: err.data?.statusMessage || err.statusMessage || 'Failed to remove image',
      variant: 'error',
    });
  } finally {
    savingRow.value = null;
  }
}
</script>

<template>
  <AdminLayout>
    <div class="space-y-6 max-w-6xl mx-auto font-sans">
      <!-- Top Title Bar -->
      <div class="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-paper-border">
        <div>
          <span class="text-[9px] sm:text-[10px] font-mono uppercase tracking-widest text-gold-600 font-bold block">
            Storefront Shelves
          </span>
          <h1 class="font-display text-2xl sm:text-3xl font-bold text-forest-950 flex items-center gap-2">
            <LayoutGrid :size="22" />
            Category Tiles
          </h1>
          <p class="text-xs text-ink-muted mt-0.5">
            Images shown on the storefront "Shop by Category" rail. Featured categories show first.
          </p>
        </div>
        <button type="button"
          class="px-3.5 py-2 bg-paper-surface border border-paper-border hover:border-forest-800/40 rounded-xl text-forest-950 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-soft active:scale-[0.98]"
          @click="loadCategories">
          <RefreshCw :size="12" :class="{ 'animate-spin': isLoading }" />
          <span>Refresh</span>
        </button>
      </div>

      <!-- Loading -->
      <div v-if="isLoading" class="py-16 text-center text-xs text-ink-muted font-mono uppercase tracking-widest">
        Loading categories…
      </div>

      <!-- Empty state -->
      <div v-else-if="categories.length === 0"
        class="bg-paper-surface border border-paper-border rounded-2xl p-8 text-center space-y-2">
        <p class="text-sm font-semibold text-forest-950">No categories yet.</p>
        <p class="text-xs text-ink-muted">Create categories from the Books Catalog or Import tools — they will appear here automatically.</p>
      </div>

      <!-- Category rows -->
      <div v-else class="bg-paper-surface rounded-2xl border border-paper-border shadow-soft overflow-hidden divide-y divide-paper-border/60">
        <div v-for="cat in categories" :key="cat.id"
          class="flex flex-col lg:flex-row lg:items-center gap-4 p-4 hover:bg-paper-cream/30 transition-colors">

          <!-- Thumbnail + name -->
          <div class="flex items-center gap-3 w-full lg:w-72 shrink-0">
            <div class="w-20 h-14 rounded-lg overflow-hidden bg-forest-950/5 border border-paper-border flex items-center justify-center shrink-0">
              <img v-if="cat.image_url" :src="cat.image_url" :alt="cat.name"
                class="w-full h-full object-cover" />
              <span v-else class="font-display font-bold text-lg text-[#FCF6BA] bg-[#052219] w-full h-full flex items-center justify-center">
                {{ (cat.name || '?').charAt(0).toUpperCase() }}
              </span>
            </div>
            <div class="min-w-0">
              <p class="text-sm font-bold text-forest-950 leading-tight line-clamp-1">{{ cat.name }}</p>
              <p class="text-[10px] font-mono text-ink-muted mt-0.5">
                {{ cat.product_count ?? 0 }} titles
              </p>
            </div>
          </div>

          <!-- Image controls -->
          <div class="flex-1 flex flex-wrap items-center gap-2 min-w-0">
            <input v-model="urlDrafts[cat.id]" type="url" placeholder="Paste image URL…"
              class="flex-1 min-w-[180px] px-3 py-2 bg-paper-canvas border border-paper-border rounded-xl text-xs font-mono outline-none focus:border-forest-900 text-forest-950" />
            <button type="button"
              class="p-2 bg-paper-cream border border-paper-border rounded-xl text-forest-950 hover:bg-forest-950 hover:text-paper transition-colors cursor-pointer"
              title="Save image URL"
              :disabled="savingRow === cat.id"
              @click="handleSaveImageUrl(cat)">
              <RefreshCw v-if="savingRow === cat.id" :size="13" class="animate-spin" />
              <Save v-else :size="13" />
            </button>
            <label
              class="p-2 bg-paper-cream border border-paper-border rounded-xl text-forest-950 hover:bg-forest-950 hover:text-paper transition-colors cursor-pointer"
              title="Upload image to Cloudflare R2">
              <Upload :size="13" />
              <input type="file" accept="image/*" class="hidden"
                :disabled="uploadingRow === cat.id" @change="(e) => handleImageUpload(cat, e)" />
            </label>
            <button v-if="cat.image_url" type="button"
              class="p-2 text-ink-muted hover:text-red-700 rounded-xl hover:bg-red-50 transition-colors cursor-pointer"
              title="Remove image"
              @click="handleRemoveImage(cat)">
              <XIcon :size="13" />
            </button>
          </div>

          <!-- Order + featured -->
          <div class="flex items-center gap-3 shrink-0">
            <label class="flex flex-col items-center gap-1">
              <span class="text-[9px] font-mono uppercase text-ink-muted font-bold">Sort</span>
              <input v-model.number="cat.sort_order" type="number" min="0"
                class="w-16 px-2 py-1.5 border border-paper-border rounded-lg text-xs font-mono text-center outline-none focus:border-forest-900"
                @change="handleSortChange(cat)" />
            </label>

            <button type="button"
              class="flex flex-col items-center gap-1 group"
              :title="cat.is_featured ? 'Featured (shows first)' : 'Not featured'"
              @click="handleToggleFeatured(cat)">
              <span class="text-[9px] font-mono uppercase text-ink-muted font-bold">Featured</span>
              <span class="w-9 h-9 rounded-lg flex items-center justify-center transition-all"
                :class="cat.is_featured
                  ? 'bg-gold-500 text-forest-950 shadow-xs'
                  : 'bg-paper-cream text-ink-muted group-hover:bg-gold-500/40'">
                <Check :size="16" :class="{ invisible: !cat.is_featured }" />
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>
