<!-- components/admin/AddCategoryModal.vue -->
<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import { X, FolderPlus, Sparkles, RefreshCw, AlertCircle } from 'lucide-vue-next';
import { useToast } from '~/composables/useToast';

interface Props {
  open: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  created: [category: { id: string; name: string; slug: string }];
}>();

const { push: pushToast } = useToast();

const nameInputRef = ref<HTMLInputElement | null>(null);
const name = ref('');
const description = ref('');
const isFeatured = ref(false);
const sortOrder = ref(0);

const isSubmitting = ref(false);
const errorMessage = ref<string | null>(null);

watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen) {
      name.value = '';
      description.value = '';
      isFeatured.value = false;
      sortOrder.value = 0;
      errorMessage.value = null;

      await nextTick();
      nameInputRef.value?.focus();
    }
  }
);

async function handleSubmit(): Promise<void> {
  const trimmedName = name.value.trim();
  if (!trimmedName) {
    errorMessage.value = 'Category name is required.';
    return;
  }

  isSubmitting.value = true;
  errorMessage.value = null;

  try {
    const res = await $fetch<{
      id: string;
      name: string;
      slug: string;
      description: string | null;
      is_featured: boolean;
      sort_order: number;
    }>('/api/admin/categories', {
      method: 'POST',
      body: {
        name: trimmedName,
        description: description.value.trim() || null,
        is_featured: isFeatured.value,
        sort_order: Number(sortOrder.value) || 0,
      },
    });

    pushToast({
      message: `Category "${res.name}" created and selected!`,
      variant: 'success',
    });

    emit('created', {
      id: res.id,
      name: res.name,
      slug: res.slug,
    });

    emit('close');
  } catch (err: any) {
    errorMessage.value =
      err.data?.statusMessage ||
      err.data?.message ||
      err.statusMessage ||
      'Failed to create category. A category with this name may already exist.';
  } finally {
    isSubmitting.value = false;
  }
}

function handleKeydown(e: KeyboardEvent): void {
  if (e.key === 'Escape' && props.open) {
    emit('close');
  }
}

onMounted(() => {
  if (process.client) {
    window.addEventListener('keydown', handleKeydown);
  }
});

onUnmounted(() => {
  if (process.client) {
    window.removeEventListener('keydown', handleKeydown);
  }
});
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest-950/70 backdrop-blur-xs animate-in fade-in duration-200"
      @click.self="emit('close')"
    >
      <div
        class="bg-white rounded-2xl shadow-2xl border border-ink-border w-full max-w-md p-6 sm:p-7 space-y-5 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-category-heading"
      >
        <!-- Header -->
        <div class="flex items-center justify-between pb-3 border-b border-ink-border">
          <div class="flex items-center gap-2.5">
            <div
              class="w-9 h-9 rounded-xl bg-forest-950/5 text-forest-900 flex items-center justify-center"
            >
              <FolderPlus :size="18" />
            </div>
            <div>
              <h3 id="add-category-heading" class="font-display font-bold text-base text-forest-950">
                Add New Book Category
              </h3>
              <p class="text-[11px] text-ink-muted">
                Create a custom catalog section on the fly without leaving your draft.
              </p>
            </div>
          </div>

          <button
            type="button"
            class="p-1.5 text-ink-muted hover:text-forest-950 rounded-lg hover:bg-black/5 transition-colors cursor-pointer"
            aria-label="Close dialog"
            @click="emit('close')"
          >
            <X :size="16" />
          </button>
        </div>

        <!-- Form -->
        <form class="space-y-4" @submit.prevent="handleSubmit">
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-forest-950">
              Category Name *
            </label>
            <input
              ref="nameInputRef"
              v-model="name"
              type="text"
              placeholder="e.g. African Literature, Graphic Novels, Manga"
              class="w-full px-3.5 py-2.5 bg-paper-canvas border border-ink-border rounded-xl text-xs sm:text-sm outline-none focus:border-forest-900 focus:bg-white focus:ring-2 focus:ring-forest-900/5 transition-all text-forest-950 placeholder:text-ink-subtle"
              required
              maxlength="100"
            />
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-forest-950">
              Description (Optional)
            </label>
            <textarea
              v-model="description"
              rows="2"
              placeholder="Short summary for category browsing..."
              class="w-full px-3.5 py-2 bg-paper-canvas border border-ink-border rounded-xl text-xs outline-none focus:border-forest-900 focus:bg-white transition-all text-forest-950 placeholder:text-ink-subtle resize-none"
              maxlength="500"
            />
          </div>

          <div class="p-3.5 bg-paper-cream/60 border border-ink-border rounded-xl space-y-2.5">
            <label class="flex items-center gap-2 cursor-pointer select-none">
              <input
                v-model="isFeatured"
                type="checkbox"
                class="rounded border-ink-border text-forest-950 focus:ring-forest-900"
              />
              <span class="text-xs font-semibold text-forest-950 flex items-center gap-1.5">
                <Sparkles :size="13" class="text-gold-600" /> Pin to Storefront Navigation Bar
              </span>
            </label>
            <p class="text-[10px] text-ink-muted pl-5">
              Featured categories appear directly in the top header carousel and browse dropdown.
            </p>
          </div>

          <div
            v-if="errorMessage"
            class="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2"
          >
            <AlertCircle :size="14" class="flex-shrink-0 mt-0.5" />
            <span>{{ errorMessage }}</span>
          </div>

          <div class="pt-2 flex justify-end gap-2.5 border-t border-ink-border">
            <button
              type="button"
              class="px-4 py-2 text-xs font-semibold text-ink-muted hover:text-forest-950 rounded-xl transition-colors cursor-pointer"
              :disabled="isSubmitting"
              @click="emit('close')"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="bg-forest-950 hover:bg-forest-900 text-paper text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all shadow-subtle flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-[0.98]"
              :disabled="isSubmitting || !name.trim()"
            >
              <RefreshCw v-if="isSubmitting" :size="13" class="animate-spin" />
              <span>{{ isSubmitting ? 'Creating...' : 'Create & Select' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>