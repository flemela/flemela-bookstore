<!-- pages/admin/banners.vue -->
<script setup lang="ts">
import { ref } from 'vue';
import {
  Images,
  Plus,
  Trash2,
  Upload,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  MousePointerClick,
  X,
} from 'lucide-vue-next';
import AdminLayout from '~/components/admin/AdminLayout.vue';
import { useToast } from '~/composables/useToast';

definePageMeta({
  middleware: 'admin-auth',
});

interface StoreBanner {
  id: string;
  title: string | null;
  subtitle: string | null;
  badge: string | null;
  image_url: string;
  mobile_image_url: string | null;
  cta_label: string | null;
  cta_link: string | null;
  bg_color: string;
  sort_order: number;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  click_count: number;
}

const { push: pushToast } = useToast();
const { data: banners, refresh, status } = await useFetch<StoreBanner[]>('/api/admin/banners');

// Modal State: Create / Edit Banner
const showModal = ref(false);
const editingBannerId = ref<string | null>(null);

const form = ref({
  title: '',
  subtitle: '',
  badge: '',
  image_url: '',
  mobile_image_url: '',
  cta_label: '',
  cta_link: '',
  bg_color: '#052219',
  is_active: true,
  starts_at: '',
  ends_at: '',
});

const isUploadingImage = ref(false);
const isSaving = ref(false);
const isReordering = ref(false);

function openCreateModal(): void {
  editingBannerId.value = null;
  form.value = {
    title: '',
    subtitle: '',
    badge: '',
    image_url: '',
    mobile_image_url: '',
    cta_label: '',
    cta_link: '',
    bg_color: '#052219',
    is_active: true,
    starts_at: '',
    ends_at: '',
  };
  showModal.value = true;
}

function openEditModal(banner: StoreBanner): void {
  editingBannerId.value = banner.id;
  form.value = {
    title: banner.title || '',
    subtitle: banner.subtitle || '',
    badge: banner.badge || '',
    image_url: banner.image_url,
    mobile_image_url: banner.mobile_image_url || '',
    cta_label: banner.cta_label || '',
    cta_link: banner.cta_link || '',
    bg_color: banner.bg_color || '#052219',
    is_active: banner.is_active,
    starts_at: banner.starts_at ? new Date(banner.starts_at).toISOString().slice(0, 16) : '',
    ends_at: banner.ends_at ? new Date(banner.ends_at).toISOString().slice(0, 16) : '',
  };
  showModal.value = true;
}

async function handleImageUpload(event: Event, targetField: 'image_url' | 'mobile_image_url'): Promise<void> {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  isUploadingImage.value = true;
  try {
    const sig = await $fetch<{
      signature: string;
      timestamp: number;
      folder: string;
      apiKey: string;
      cloudName: string;
    }>('/api/admin/upload-signature?target=store', { method: 'POST' });

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
      form.value[targetField] = data.secure_url;
      pushToast({ message: 'Banner image uploaded to Cloudinary', variant: 'success' });
    }
  } catch {
    pushToast({ message: 'Image upload failed. You can paste a direct URL.', variant: 'error' });
  } finally {
    isUploadingImage.value = false;
  }
}

async function handleSave(): Promise<void> {
  // ONLY image_url is required! Everything else is completely optional.
  if (!form.value.image_url.trim()) {
    pushToast({ message: 'Banner image is required', variant: 'error' });
    return;
  }

  isSaving.value = true;
  try {
    const payload = {
      title: form.value.title.trim() || null,
      subtitle: form.value.subtitle.trim() || null,
      badge: form.value.badge.trim() || null,
      image_url: form.value.image_url.trim(),
      mobile_image_url: form.value.mobile_image_url.trim() || null,
      cta_label: form.value.cta_label.trim() || null,
      cta_link: form.value.cta_link.trim() || null,
      bg_color: form.value.bg_color.trim() || '#052219',
      is_active: form.value.is_active,
      starts_at: form.value.starts_at ? new Date(form.value.starts_at).toISOString() : null,
      ends_at: form.value.ends_at ? new Date(form.value.ends_at).toISOString() : null,
    };

    if (editingBannerId.value) {
      await $fetch(`/api/admin/banners/${editingBannerId.value}`, {
        method: 'PATCH',
        body: payload,
      });
      pushToast({ message: 'Banner updated successfully', variant: 'success' });
    } else {
      await $fetch('/api/admin/banners', {
        method: 'POST',
        body: payload,
      });
      pushToast({ message: 'Banner published to hero carousel', variant: 'success' });
    }

    showModal.value = false;
    await refresh();
  } catch (err: any) {
    pushToast({ message: err.data?.statusMessage || err.statusMessage || 'Failed to save banner', variant: 'error' });
  } finally {
    isSaving.value = false;
  }
}

async function toggleActive(banner: StoreBanner): Promise<void> {
  try {
    await $fetch(`/api/admin/banners/${banner.id}`, {
      method: 'PATCH',
      body: { is_active: !banner.is_active },
    });
    banner.is_active = !banner.is_active;
    pushToast({ message: `Banner ${banner.is_active ? 'activated' : 'paused'}`, variant: 'info' });
  } catch {
    pushToast({ message: 'Failed to toggle status', variant: 'error' });
  }
}

async function handleDelete(bannerId: string): Promise<void> {
  if (!confirm('Are you sure you want to remove this promotional banner?')) return;

  try {
    await $fetch(`/api/admin/banners/${bannerId}`, { method: 'DELETE' });
    pushToast({ message: 'Banner removed', variant: 'success' });
    await refresh();
  } catch {
    pushToast({ message: 'Failed to delete banner', variant: 'error' });
  }
}

async function moveBanner(index: number, direction: 'up' | 'down'): Promise<void> {
  if (!banners.value) return;
  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= banners.value.length) return;

  isReordering.value = true;
  const list = [...banners.value];
  const [moved] = list.splice(index, 1);
  list.splice(targetIndex, 0, moved);
  banners.value = list;

  try {
    await $fetch('/api/admin/banners', {
      method: 'POST',
      body: { bannerIds: list.map((b) => b.id) },
    });
    pushToast({ message: 'Banner order saved', variant: 'success' });
  } catch {
    await refresh();
    pushToast({ message: 'Failed to save order', variant: 'error' });
  } finally {
    isReordering.value = false;
  }
}
</script>

<template>
  <AdminLayout>
    <div class="space-y-6 max-w-6xl mx-auto">
      
      <!-- Top Title Bar -->
      <div class="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-paper-border">
        <div>
          <span class="text-[9px] sm:text-[10px] font-mono uppercase tracking-widest text-gold-600 font-bold block">
            Storefront Merchandising
          </span>
          <h1 class="font-display text-2xl sm:text-3xl font-bold text-forest-950">
            Hero Carousel Banners
          </h1>
          <p class="text-xs text-ink-muted mt-0.5">
            Add full photo banners or custom promotional slides. Everything except the image is optional.
          </p>
        </div>

        <div class="flex items-center gap-2.5">
          <button
            type="button"
            class="px-3 py-2 bg-paper-surface border border-paper-border rounded-xl text-forest-950 text-xs font-semibold flex items-center gap-1.5 hover:bg-paper-cream transition-colors cursor-pointer shadow-2xs"
            @click="() => refresh()"
          >
            <RefreshCw :size="13" :class="{ 'animate-spin': status === 'pending' }" />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            class="bg-forest-950 text-paper hover:bg-forest-900 text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shadow-medium cursor-pointer active:scale-[0.98]"
            @click="openCreateModal"
          >
            <Plus :size="15" class="text-gold-300" />
            <span>Add Banner Slide</span>
          </button>
        </div>
      </div>

      <!-- Banner List Table / Cards -->
      <div class="bg-paper-surface rounded-2xl border border-paper-border shadow-soft overflow-hidden">
        <div v-if="status === 'pending'" class="p-12 text-center text-xs text-ink-muted">
          Loading active banners...
        </div>

        <div v-else-if="!banners?.length" class="p-12 text-center space-y-3">
          <div class="w-12 h-12 bg-paper-cream rounded-full flex items-center justify-center text-forest-900 mx-auto">
            <Images :size="24" />
          </div>
          <h3 class="font-display font-bold text-sm text-forest-950">No Promotional Banners Yet</h3>
          <p class="text-xs text-ink-muted max-w-sm mx-auto">
            Upload custom graphics or photo advertisements. If none exist, your permanent signature brand poster displays cleanly.
          </p>
          <button
            type="button"
            class="bg-forest-950 text-paper text-xs font-bold px-4 py-2 rounded-xl cursor-pointer"
            @click="openCreateModal"
          >
            Create First Banner
          </button>
        </div>

        <div v-else class="divide-y divide-paper-border/60">
          <div
            v-for="(banner, index) in banners"
            :key="banner.id"
            class="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-paper-cream/30 transition-colors"
          >
            <!-- Left: Reorder Arrows & Image Thumbnail -->
            <div class="flex items-center gap-3 w-full sm:w-auto">
              <div class="flex flex-col gap-1 text-ink-muted">
                <button
                  type="button"
                  class="p-1 hover:text-forest-950 disabled:opacity-20 cursor-pointer"
                  :disabled="index === 0 || isReordering"
                  title="Move banner up"
                  @click="moveBanner(index, 'up')"
                >
                  <ArrowUp :size="13" />
                </button>
                <button
                  type="button"
                  class="p-1 hover:text-forest-950 disabled:opacity-20 cursor-pointer"
                  :disabled="index === banners.length - 1 || isReordering"
                  title="Move banner down"
                  @click="moveBanner(index, 'down')"
                >
                  <ArrowDown :size="13" />
                </button>
              </div>

              <!-- Banner Thumbnail -->
              <div class="w-28 sm:w-36 aspect-[21/9] rounded-lg border border-paper-border overflow-hidden bg-forest-950 flex-shrink-0 shadow-xs relative">
                <img :src="banner.image_url" :alt="banner.title || 'Banner'" class="w-full h-full object-cover" />
                <span
                  v-if="banner.badge"
                  class="absolute top-1 left-1 bg-black/70 text-white font-mono text-[8px] font-bold px-1 rounded uppercase"
                >
                  {{ banner.badge }}
                </span>
              </div>

              <!-- Details -->
              <div class="space-y-1 min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <h4 class="text-xs sm:text-sm font-bold text-forest-950 truncate">
                    {{ banner.title || '(Photo Only Banner)' }}
                  </h4>
                  <span
                    class="text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded"
                    :class="banner.is_active ? 'bg-emerald-100 text-emerald-900' : 'bg-slate-100 text-slate-700'"
                  >
                    {{ banner.is_active ? 'Active' : 'Paused' }}
                  </span>
                </div>
                <p v-if="banner.subtitle" class="text-[11px] text-ink-muted line-clamp-1">{{ banner.subtitle }}</p>
                <div class="flex items-center gap-3 text-[10px] text-ink-subtle font-mono">
                  <span v-if="banner.cta_link">Target: <strong>{{ banner.cta_link }}</strong></span>
                  <span v-else class="italic">No target link</span>
                  <span>•</span>
                  <span class="flex items-center gap-1">
                    <MousePointerClick :size="11" /> {{ banner.click_count }} clicks
                  </span>
                </div>
              </div>
            </div>

            <!-- Right: Actions -->
            <div class="flex items-center gap-2 self-end sm:self-center">
              <button
                type="button"
                class="px-2.5 py-1 text-[11px] font-semibold rounded-lg border border-paper-border hover:bg-paper-cream cursor-pointer"
                @click="toggleActive(banner)"
              >
                {{ banner.is_active ? 'Pause' : 'Activate' }}
              </button>
              <button
                type="button"
                class="px-2.5 py-1 text-[11px] font-semibold text-forest-950 bg-paper-cream rounded-lg hover:bg-gold-500/20 cursor-pointer"
                @click="openEditModal(banner)"
              >
                Edit
              </button>
              <button
                type="button"
                class="p-1.5 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                title="Delete banner"
                @click="handleDelete(banner.id)"
              >
                <Trash2 :size="14" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL: Create / Edit Banner Slide -->
    <Teleport to="body">
      <div
        v-if="showModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest-950/70 backdrop-blur-xs"
        @click.self="showModal = false"
      >
        <div class="bg-white rounded-2xl shadow-2xl border border-paper-border max-w-lg w-full p-6 sm:p-7 space-y-5 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between pb-3 border-b border-paper-border">
            <div>
              <h3 class="font-display font-bold text-base text-forest-950">
                {{ editingBannerId ? 'Edit Hero Banner' : 'New Promotional Hero Banner' }}
              </h3>
              <p class="text-[11px] text-ink-muted">Only the image is required. Leave text empty for clean full-bleed photos.</p>
            </div>
            <button type="button" class="text-ink-muted hover:text-ink p-1 cursor-pointer" @click="showModal = false">
              <X :size="16" />
            </button>
          </div>

          <form class="space-y-4" @submit.prevent="handleSave">
            <!-- 1. Image Upload (The only required field) -->
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-forest-950 flex justify-between">
                <span>Desktop Banner Image (1920x600 recommended) *</span>
                <span class="text-[10px] text-gold-600 font-bold uppercase">Required</span>
              </label>
              <div class="flex gap-2 items-center">
                <input
                  v-model="form.image_url"
                  type="url"
                  placeholder="https://..."
                  class="flex-1 px-3 py-2 border border-paper-border rounded-xl text-xs outline-none focus:border-forest-900"
                  required
                />
                <label class="bg-paper-cream border border-paper-border hover:bg-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-forest-950 flex items-center gap-1 cursor-pointer flex-shrink-0">
                  <Upload :size="13" />
                  <span>{{ isUploadingImage ? 'Uploading...' : 'Upload' }}</span>
                  <input
                    type="file"
                    accept="image/*"
                    class="hidden"
                    :disabled="isUploadingImage"
                    @change="handleImageUpload($event, 'image_url')"
                  />
                </label>
              </div>
            </div>

            <!-- Optional Mobile Image -->
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-forest-950">
                Mobile Image (Optional portrait cut, max 640px)
              </label>
              <div class="flex gap-2 items-center">
                <input
                  v-model="form.mobile_image_url"
                  type="url"
                  placeholder="https://..."
                  class="flex-1 px-3 py-2 border border-paper-border rounded-xl text-xs outline-none focus:border-forest-900"
                />
                <label class="bg-paper-cream border border-paper-border hover:bg-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-forest-950 flex items-center gap-1 cursor-pointer flex-shrink-0">
                  <Upload :size="13" />
                  <span>Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    class="hidden"
                    @change="handleImageUpload($event, 'mobile_image_url')"
                  />
                </label>
              </div>
            </div>

            <!-- Optional Text Fields -->
            <div class="space-y-1 pt-2 border-t border-paper-border">
              <label class="text-xs font-semibold text-forest-950">Headline (Optional)</label>
              <input
                v-model="form.title"
                type="text"
                placeholder="Leave blank for an image-only banner"
                class="w-full px-3 py-2 border border-paper-border rounded-xl text-xs font-semibold outline-none focus:border-forest-900"
              />
            </div>

            <div class="space-y-1">
              <label class="text-xs font-semibold text-forest-950">Subheadline (Optional)</label>
              <textarea
                v-model="form.subtitle"
                rows="2"
                placeholder="Leave blank if not needed"
                class="w-full px-3 py-2 border border-paper-border rounded-xl text-xs outline-none focus:border-forest-900 resize-none"
              />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1">
                <label class="text-xs font-semibold text-forest-950">Badge Tag (Optional)</label>
                <input
                  v-model="form.badge"
                  type="text"
                  placeholder="e.g. FLASH SALE"
                  class="w-full px-3 py-2 border border-paper-border rounded-xl text-xs font-mono uppercase outline-none focus:border-forest-900"
                />
              </div>

              <div class="space-y-1">
                <label class="text-xs font-semibold text-forest-950">Background Fallback</label>
                <div class="flex items-center gap-2">
                  <input
                    v-model="form.bg_color"
                    type="color"
                    class="w-8 h-8 rounded border border-paper-border cursor-pointer"
                  />
                  <input
                    v-model="form.bg_color"
                    type="text"
                    class="w-full px-2 py-1.5 border border-paper-border rounded-xl text-xs font-mono outline-none"
                  />
                </div>
              </div>
            </div>

            <!-- Optional Link & Button -->
        <div class="grid grid-cols-2 gap-3 pt-2 border-t border-paper-border">
              <div class="space-y-1">
                <label class="text-xs font-semibold text-forest-950">Button Label (Optional)</label>
                <input
                  v-model="form.cta_label"
                  type="text"
                  placeholder="e.g. Shop Now (or leave empty)"
                  class="w-full px-3 py-2 border border-paper-border rounded-xl text-xs outline-none focus:border-forest-900"
                />
              </div>

              <div class="space-y-1">
                <label class="text-xs font-semibold text-forest-950">Target Link / URL (Optional)</label>
                <input
                  v-model="form.cta_link"
                  type="text"
                  placeholder="e.g. /#deals-week or /book/slug"
                  class="w-full px-3 py-2 border border-paper-border rounded-xl text-xs outline-none focus:border-forest-900"
                />
              </div>
            </div>

            <!-- Scheduling -->
            <div class="grid grid-cols-2 gap-3 pt-2 border-t border-paper-border">
              <div class="space-y-1">
                <label class="text-xs font-semibold text-forest-950">Auto-Start Date (Optional)</label>
                <input
                  v-model="form.starts_at"
                  type="datetime-local"
                  class="w-full px-2.5 py-1.5 border border-paper-border rounded-xl text-xs font-mono outline-none"
                />
              </div>

              <div class="space-y-1">
                <label class="text-xs font-semibold text-forest-950">Auto-Expire Date (Optional)</label>
                <input
                  v-model="form.ends_at"
                  type="datetime-local"
                  class="w-full px-2.5 py-1.5 border border-paper-border rounded-xl text-xs font-mono outline-none"
                />
              </div>
            </div>

            <div class="pt-3 flex justify-end gap-2.5 border-t border-paper-border">
              <button
                type="button"
                class="px-4 py-2 text-xs font-semibold text-ink-muted hover:text-forest-950"
                @click="showModal = false"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="bg-forest-950 text-paper text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-medium cursor-pointer hover:bg-forest-900 disabled:opacity-50"
                :disabled="isSaving || isUploadingImage"
              >
                {{ isSaving ? 'Saving...' : (editingBannerId ? 'Update Banner' : 'Create Banner') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </AdminLayout></template>
   