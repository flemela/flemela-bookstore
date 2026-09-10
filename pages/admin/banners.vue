<!-- pages/admin/banners.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue';
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
  Sparkles,
  Save,
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

interface PromoTickerItem {
  id: string;
  text: string;
  link?: string | null;
  is_active: boolean;
  sort_order: number;
}

const { push: pushToast } = useToast();
const { data: banners, refresh, status } = await useFetch<StoreBanner[]>('/api/admin/banners');

// Tab State: Banners vs. Gold Ticker
const activeTab = ref<'banners' | 'ticker'>('ticker');

// Ticker State
const tickerItems = ref<PromoTickerItem[]>([]);
const isSavingTicker = ref(false);

async function loadTicker(): Promise<void> {
  try {
    const data = await $fetch<PromoTickerItem[]>('/api/admin/ticker');
    tickerItems.value = (data || []).sort((a, b) => a.sort_order - b.sort_order);
  } catch {
    tickerItems.value = [];
  }
}

onMounted(() => {
  loadTicker();
});

function addTickerItem(): void {
  if (tickerItems.value.length >= 10) {
    pushToast({ message: 'Maximum of 10 promotional messages allowed', variant: 'error' });
    return;
  }
  tickerItems.value.push({
    id: `ticker-${Date.now()}`,
    text: '',
    link: '#catalog-results',
    is_active: true,
    sort_order: tickerItems.value.length,
  });
}

function removeTickerItem(index: number): void {
  tickerItems.value.splice(index, 1);
}

async function handleSaveTicker(): Promise<void> {
  const invalid = tickerItems.value.some((item) => !item.text.trim());
  if (invalid) {
    pushToast({ message: 'All ticker messages must have text content', variant: 'error' });
    return;
  }

  isSavingTicker.value = true;
  try {
    await $fetch('/api/admin/ticker', {
      method: 'PUT',
      body: tickerItems.value.map((item, idx) => ({
        ...item,
        text: item.text.trim(),
        link: item.link?.trim() || null,
        sort_order: idx,
      })),
    });
    pushToast({ message: 'Promotional gold ticker ribbon updated!', variant: 'success' });
    await loadTicker();
  } catch (err: any) {
    pushToast({
      message: err.data?.statusMessage || err.statusMessage || 'Failed to save ticker',
      variant: 'error',
    });
  } finally {
    isSavingTicker.value = false;
  }
}

// Modal & Banners State
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

const isUploadingDesktop = ref(false);
const isUploadingMobile = ref(false);
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

  if (targetField === 'image_url') isUploadingDesktop.value = true;
  else isUploadingMobile.value = true;

  try {
    const formData = new FormData();
    formData.append('file', file);

    const res = await $fetch<{ url: string }>('/api/admin/banners/upload', {
      method: 'POST',
      body: formData,
    });

    if (res?.url) {
      form.value[targetField] = res.url;
      pushToast({
        message: `${targetField === 'image_url' ? 'Desktop' : 'Mobile'} banner uploaded successfully!`,
        variant: 'success',
      });
    }
  } catch (err: any) {
    const message = err.data?.statusMessage || err.message || 'Image upload failed.';
    pushToast({ message, variant: 'error' });
  } finally {
    if (targetField === 'image_url') isUploadingDesktop.value = false;
    else isUploadingMobile.value = false;
    target.value = '';
  }
}

async function handleSave(): Promise<void> {
  if (!form.value.image_url.trim()) {
    pushToast({ message: 'Desktop banner image is required', variant: 'error' });
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
      pushToast({ message: 'Hero banner updated successfully', variant: 'success' });
    } else {
      await $fetch('/api/admin/banners', {
        method: 'POST',
        body: payload,
      });
      pushToast({ message: 'Hero banner added to carousel', variant: 'success' });
    }

    showModal.value = false;
    await refresh();
  } catch (err: any) {
    pushToast({
      message: err.data?.statusMessage || err.statusMessage || 'Failed to save banner',
      variant: 'error',
    });
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
            Merchandising & Announcements
          </span>
          <h1 class="font-display text-2xl sm:text-3xl font-bold text-forest-950">
            Promotions & Announcements
          </h1>
          <p class="text-xs text-ink-muted mt-0.5">
            Configure the rotating True Gold announcement ribbon and full-width hero carousel banners.
          </p>
        </div>

        <!-- Tab Toggle Bar -->
        <div class="flex items-center gap-2 bg-paper-cream p-1 rounded-xl border border-paper-border">
          <button
            type="button"
            class="px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            :class="activeTab === 'ticker' ? 'bg-[#052219] text-[#FCF6BA] shadow-xs' : 'text-forest-950 hover:bg-white/50'"
            @click="activeTab = 'ticker'"
          >
            <Sparkles :size="13" />
            <span>Gold Ticker Ribbon</span>
          </button>
          <button
            type="button"
            class="px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            :class="activeTab === 'banners' ? 'bg-[#052219] text-[#FCF6BA] shadow-xs' : 'text-forest-950 hover:bg-white/50'"
            @click="activeTab = 'banners'"
          >
            <Images :size="13" />
            <span>Hero Banners</span>
          </button>
        </div>
      </div>

      <!-- ================================================================= -->
      <!-- TAB 1: GOLD TICKER STRIP CONFIGURATION                            -->
      <!-- ================================================================= -->
      <div v-if="activeTab === 'ticker'" class="space-y-6 animate-in fade-in duration-200">
        <!-- Live Gold Gradient Ribbon Preview -->
        <div class="bg-paper-surface p-5 rounded-2xl border border-paper-border shadow-soft space-y-3">
          <div class="flex justify-between items-center text-xs">
            <span class="font-bold text-forest-950 uppercase font-mono tracking-wider">Storefront Live Preview</span>
            <span class="text-[11px] text-ink-muted">Gradient: True Gold (#BF953F to #AA771C)</span>
          </div>

          <div
            class="rounded-xl overflow-hidden py-3 px-4 border border-[#916515] text-[#052219] font-sans font-extrabold text-xs sm:text-sm text-center shadow-xs"
            :style="{
              background: 'linear-gradient(135deg, #BF953F 0%, #FCF6BA 25%, #B38728 50%, #FBF5B7 75%, #AA771C 100%)',
            }"
          >
            <span v-if="tickerItems.find(i => i.is_active)">
              {{ tickerItems.find(i => i.is_active)?.text }}
            </span>
            <span v-else class="italic opacity-80">
              No active ticker message configured. Default fallback will display on storefront.
            </span>
          </div>
        </div>

        <!-- Ticker Messages Editor List -->
        <div class="bg-paper-surface rounded-2xl border border-paper-border shadow-soft p-6 space-y-5">
          <div class="flex justify-between items-center pb-3 border-b border-paper-border">
            <div>
              <h3 class="font-display font-bold text-base text-forest-950">Active Announcement Messages</h3>
              <p class="text-[11px] text-ink-muted">These rotate automatically every 4.5 seconds on the storefront between the Hero and Flash Sale.</p>
            </div>

            <button
              type="button"
              class="px-3.5 py-2 bg-paper-cream hover:bg-forest-950 hover:text-white border border-paper-border rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              @click="addTickerItem"
            >
              <Plus :size="14" />
              <span>Add Message</span>
            </button>
          </div>

          <div v-if="!tickerItems.length" class="text-center py-8 text-xs text-ink-muted space-y-2">
            <p>No custom ticker announcements added yet.</p>
            <button type="button" class="text-forest-900 font-bold underline cursor-pointer" @click="addTickerItem">
              Add first announcement
            </button>
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="(item, idx) in tickerItems"
              :key="item.id"
              class="p-4 bg-paper-canvas/60 border border-paper-border rounded-xl flex flex-col sm:flex-row items-start sm:items-center gap-3"
            >
              <!-- Drag/Sort Index -->
              <span class="w-6 h-6 rounded-full bg-paper-cream text-forest-950 font-mono font-bold text-xs flex items-center justify-center flex-shrink-0 border border-paper-border">
                {{ idx + 1 }}
              </span>

              <!-- Text Input -->
              <div class="flex-1 w-full space-y-1">
                <input
                  v-model="item.text"
                  type="text"
                  placeholder="e.g. ⚡ FREE DELIVERY across Nairobi on orders above KSh 2,500"
                  class="w-full px-3 py-2 bg-white border border-paper-border rounded-xl text-xs font-semibold outline-none focus:border-forest-900 text-forest-950"
                  maxlength="200"
                />
              </div>

              <!-- Action Link Input -->
              <div class="w-full sm:w-56 space-y-1">
                <input
                  v-model="item.link"
                  type="text"
                  placeholder="Link (e.g. #flash-sale)"
                  class="w-full px-3 py-2 bg-white border border-paper-border rounded-xl text-xs font-mono outline-none focus:border-forest-900 text-forest-950"
                />
              </div>

              <!-- Active Toggle & Delete -->
              <div class="flex items-center gap-2 self-end sm:self-center">
                <label class="flex items-center gap-1.5 text-xs font-semibold cursor-pointer select-none">
                  <input
                    v-model="item.is_active"
                    type="checkbox"
                    class="rounded border-paper-border text-forest-950 focus:ring-forest-900"
                  />
                  <span>Active</span>
                </label>

                <button
                  type="button"
                  class="p-1.5 text-ink-muted hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  title="Remove message"
                  @click="removeTickerItem(idx)"
                >
                  <Trash2 :size="15" />
                </button>
              </div>
            </div>
          </div>

          <!-- Save Button -->
          <div class="pt-3 border-t border-paper-border flex justify-end">
            <button
              type="button"
              class="bg-forest-950 hover:bg-forest-900 text-paper font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-xl shadow-medium flex items-center gap-2 cursor-pointer disabled:opacity-50 transition-all active:scale-[0.98]"
              :disabled="isSavingTicker"
              @click="handleSaveTicker"
            >
              <RefreshCw v-if="isSavingTicker" :size="14" class="animate-spin" />
              <Save v-else :size="14" class="text-gold-300" />
              <span>{{ isSavingTicker ? 'Saving...' : 'Save Gold Ticker Ribbon' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ================================================================= -->
      <!-- TAB 2: HERO CAROUSEL BANNERS CONFIGURATION                        -->
      <!-- ================================================================= -->
      <div v-else class="space-y-6 animate-in fade-in duration-200">
        <div class="flex justify-end gap-2.5">
          <button
            type="button"
            class="px-3 py-2 bg-paper-surface border border-paper-border rounded-xl text-forest-950 text-xs font-semibold flex items-center gap-1.5 hover:bg-paper-cream transition-colors cursor-pointer shadow-2xs"
            @click="() => refresh()"
          >
            <RefreshCw :size="13" :class="{ 'animate-spin': status === 'pending' }" />
            <span>Refresh Banners</span>
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

        <!-- Banner List Cards -->
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
              Upload custom 4:1 graphics or photos. If none exist, your signature brand poster displays cleanly.
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

                <div class="w-32 sm:w-40 aspect-[4/1] rounded-lg border border-paper-border overflow-hidden bg-forest-950 flex-shrink-0 shadow-xs relative">
                  <img :src="banner.image_url" :alt="banner.title || 'Banner'" class="w-full h-full object-cover" />
                  <span
                    v-if="banner.badge"
                    class="absolute top-1 left-1 bg-black/70 text-white font-mono text-[7.5px] font-bold px-1 rounded uppercase"
                  >
                    {{ banner.badge }}
                  </span>
                </div>

                <div class="space-y-1 min-w-0 flex-1">
                  <div class="flex items-center gap-2">
                    <h4 class="text-xs sm:text-sm font-bold text-forest-950 truncate">
                      {{ banner.title || '(Image-Only Banner)' }}
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
                    <span>â€¢</span>
                    <span class="flex items-center gap-1">
                      <MousePointerClick :size="11" /> {{ banner.click_count }} clicks
                    </span>
                  </div>
                </div>
              </div>

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
                {{ editingBannerId ? 'Edit Hero Banner' : 'New Hero Banner' }}
              </h3>
              <p class="text-[11px] text-ink-muted">
                Desktop image is the only required field. All text, buttons, and dates are optional.
              </p>
            </div>
            <button type="button" class="text-ink-muted hover:text-ink p-1 cursor-pointer" @click="showModal = false">
              <X :size="16" />
            </button>
          </div>

          <form class="space-y-4" @submit.prevent="handleSave">
            <div class="space-y-1.5">
              <div class="flex justify-between items-baseline">
                <label class="text-xs font-bold text-forest-950">Desktop Image *</label>
                <span class="text-[10px] text-gold-600 font-mono font-bold uppercase tracking-wide">
                  Target: 4:1 (1440Ã—360px)
                </span>
              </div>

              <div class="flex gap-2 items-center">
                <input
                  v-model="form.image_url"
                  type="text"
                  placeholder="https://... (Recommended: ~4:1 ratio â€” e.g. 1440Ã—360px or 1920Ã—480px)"
                  class="flex-1 px-3 py-2 border border-paper-border rounded-xl text-xs outline-none focus:border-forest-900"
                  required
                />
                <label class="bg-paper-cream border border-paper-border hover:bg-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-forest-950 flex items-center gap-1 cursor-pointer flex-shrink-0">
                  <Upload :size="13" />
                  <span>{{ isUploadingDesktop ? 'Uploading...' : 'Upload' }}</span>
                  <input
                    type="file"
                    accept="image/*"
                    class="hidden"
                    :disabled="isUploadingDesktop"
                    @change="handleImageUpload($event, 'image_url')"
                  />
                </label>
              </div>

              <div v-if="form.image_url" class="relative rounded-lg border border-paper-border overflow-hidden aspect-[4/1] bg-forest-950 mt-1.5">
                <img :src="form.image_url" alt="Desktop Preview" class="w-full h-full object-cover" />
                <button
                  type="button"
                  class="absolute top-1 right-1 p-1 bg-black/60 hover:bg-black text-white rounded-full text-[10px] cursor-pointer"
                  title="Remove image"
                  @click="form.image_url = ''"
                >
                  <X :size="12" />
                </button>
              </div>
            </div>
			<div class="space-y-1.5 pt-1">
              <div class="flex justify-between items-baseline">
                <label class="text-xs font-semibold text-forest-950">Mobile Image (Optional)</label>
                <span class="text-[10px] text-ink-muted font-mono font-semibold uppercase tracking-wide">
                  Target: 1.65:1 (390Ã—240px)
                </span>
              </div>

              <div class="flex gap-2 items-center">
                <input
                  v-model="form.mobile_image_url"
                  type="text"
                  placeholder="https://... (Recommended: ~1.65:1 ratio â€” e.g. 390Ã—240px or 640Ã—390px)"
                  class="flex-1 px-3 py-2 border border-paper-border rounded-xl text-xs outline-none focus:border-forest-900"
                />
                <label class="bg-paper-cream border border-paper-border hover:bg-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-forest-950 flex items-center gap-1 cursor-pointer flex-shrink-0">
                  <Upload :size="13" />
                  <span>{{ isUploadingMobile ? 'Uploading...' : 'Upload' }}</span>
                  <input
                    type="file"
                    accept="image/*"
                    class="hidden"
                    :disabled="isUploadingMobile"
                    @change="handleImageUpload($event, 'mobile_image_url')"
                  />
                </label>
              </div>

              <div v-if="form.mobile_image_url" class="relative rounded-lg border border-paper-border overflow-hidden aspect-[1.65/1] max-w-[200px] bg-forest-950 mt-1.5">
                <img :src="form.mobile_image_url" alt="Mobile Preview" class="w-full h-full object-cover" />
                <button
                  type="button"
                  class="absolute top-1 right-1 p-1 bg-black/60 hover:bg-black text-white rounded-full text-[10px] cursor-pointer"
                  title="Remove image"
                  @click="form.mobile_image_url = ''"
                >
                  <X :size="12" />
                </button>
              </div>
            </div>

            <div class="space-y-3 pt-2 border-t border-paper-border">
              <div class="space-y-1">
                <label class="text-xs font-semibold text-forest-950">Headline (Optional)</label>
                <input
                  v-model="form.title"
                  type="text"
                  placeholder="Leave empty for an image-only banner"
                  class="w-full px-3 py-2 border border-paper-border rounded-xl text-xs outline-none focus:border-forest-900"
                />
              </div>

              <div class="space-y-1">
                <label class="text-xs font-semibold text-forest-950">Subheadline (Optional)</label>
                <textarea
                  v-model="form.subtitle"
                  rows="2"
                  placeholder="Leave empty if not needed"
                  class="w-full px-3 py-2 border border-paper-border rounded-xl text-xs outline-none focus:border-forest-900 resize-none"
                />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div class="space-y-1">
                  <label class="text-xs font-semibold text-forest-950">Badge Tag (Optional)</label>
                  <input
                    v-model="form.badge"
                    type="text"
                    placeholder="e.g. FLASH SALE, LIMITED TIME"
                    class="w-full px-3 py-2 border border-paper-border rounded-xl text-xs font-mono uppercase outline-none focus:border-forest-900"
                  />
                </div>

                <div class="space-y-1">
                  <label class="text-xs font-semibold text-forest-950">Background Color</label>
                  <div class="flex items-center gap-2">
                    <input
                      v-model="form.bg_color"
                      type="color"
                      class="w-8 h-8 rounded border border-paper-border cursor-pointer p-0.5"
                    />
                    <input
                      v-model="form.bg_color"
                      type="text"
                      class="w-full px-2 py-1.5 border border-paper-border rounded-xl text-xs font-mono outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3 pt-2 border-t border-paper-border">
              <div class="space-y-1">
                <label class="text-xs font-semibold text-forest-950">Button Label (Optional)</label>
                <input
                  v-model="form.cta_label"
                  type="text"
                  placeholder="e.g. Shop Now"
                  class="w-full px-3 py-2 border border-paper-border rounded-xl text-xs outline-none focus:border-forest-900"
                />
              </div>

              <div class="space-y-1">
                <label class="text-xs font-semibold text-forest-950">Button Link (Optional)</label>
                <input
                  v-model="form.cta_link"
                  type="text"
                  placeholder="e.g. #flash-sale or /book/slug"
                  class="w-full px-3 py-2 border border-paper-border rounded-xl text-xs outline-none focus:border-forest-900"
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3 pt-2 border-t border-paper-border">
              <div class="space-y-1">
                <label class="text-xs font-semibold text-forest-950">Start Date (Optional)</label>
                <input
                  v-model="form.starts_at"
                  type="datetime-local"
                  class="w-full px-2.5 py-1.5 border border-paper-border rounded-xl text-xs font-mono outline-none"
                />
              </div>

              <div class="space-y-1">
                <label class="text-xs font-semibold text-forest-950">Expire Date (Optional)</label>
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
                class="px-4 py-2 text-xs font-semibold text-ink-muted hover:text-forest-950 cursor-pointer"
                @click="showModal = false"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="bg-forest-950 text-paper text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-medium cursor-pointer hover:bg-forest-900 disabled:opacity-50"
                :disabled="isSaving || isUploadingDesktop || isUploadingMobile"
              >
                {{ isSaving ? 'Saving...' : (editingBannerId ? 'Update Banner' : 'Create Banner') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </AdminLayout>
</template>