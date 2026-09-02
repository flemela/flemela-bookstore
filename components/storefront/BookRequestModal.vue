<!-- components/storefront/BookRequestModal.vue -->
<script setup lang="ts">
import { ref, watch } from 'vue';
import { X, MessageSquare, Send } from 'lucide-vue-next';
import { useToast } from '~/composables/useToast';

interface Props {
  open: boolean;
  initialTitle?: string;
  initialAuthor?: string;
}

const props = withDefaults(defineProps<Props>(), {
  initialTitle: '',
  initialAuthor: '',
});

const emit = defineEmits<{
  close: [];
}>();

const { push: pushToast } = useToast();

const title = ref(props.initialTitle);
const author = ref(props.initialAuthor);
const customerPhone = ref('');
const preferredFormat = ref<'hardcopy' | 'ebook' | 'either'>('either');
const isSubmitting = ref(false);

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    title.value = props.initialTitle || '';
    author.value = props.initialAuthor || '';
  }
});

function handleSubmit(): void {
  if (!title.value.trim() || !customerPhone.value.trim()) return;

  isSubmitting.value = true;

  const lines = [
    `*📚 Flemela Bookstore — Custom Book Request*`,
    `Book Title: ${title.value.trim()}`,
    author.value.trim() ? `Author: ${author.value.trim()}` : null,
    `Preferred Format: ${preferredFormat.value.toUpperCase()}`,
    `Customer Contact: ${customerPhone.value.trim()}`,
  ].filter(Boolean);

  const whatsappUrl = `https://wa.me/254700000000?text=${encodeURIComponent(lines.join('\n'))}`;

  setTimeout(() => {
    isSubmitting.value = false;
    emit('close');
    pushToast({ message: 'Request submitted! Opening WhatsApp...', variant: 'success' });
    if (typeof window !== 'undefined') {
      window.open(whatsappUrl, '_blank');
    }
  }, 400);
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-theme-dark/70 backdrop-blur-xs"
      @click.self="emit('close')"
    >
      <div
        class="bg-theme-surface rounded-2xl shadow-2xl border border-theme-border w-full max-w-lg p-6 sm:p-7 space-y-5 animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        <!-- Header -->
        <div class="flex items-center justify-between pb-3 border-b border-theme-border">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-xl bg-theme-coral/10 text-theme-coral flex items-center justify-center">
              <MessageSquare :size="16" />
            </div>
            <div>
              <h3 class="font-display font-bold text-base sm:text-lg text-theme-ink">Request / Special Order</h3>
              <p class="text-[11px] text-theme-muted">Our team will source this title and notify you on WhatsApp.</p>
            </div>
          </div>
          <button
            type="button"
            class="p-1.5 text-theme-muted hover:text-theme-ink rounded-lg transition-colors cursor-pointer"
            @click="emit('close')"
          >
            <X :size="18" />
          </button>
        </div>

        <!-- Form -->
        <form class="space-y-4" @submit.prevent="handleSubmit">
          <div class="space-y-1">
            <label class="text-xs font-semibold text-theme-ink">Book Title *</label>
            <input
              v-model="title"
              type="text"
              placeholder="e.g. Atomic Habits or Thinking Fast & Slow"
              class="w-full px-3.5 py-2.5 bg-theme-canvas border border-theme-border rounded-xl text-xs sm:text-sm outline-none focus:border-theme-forest transition-all"
              required
            />
          </div>

          <div class="grid sm:grid-cols-2 gap-3">
            <div class="space-y-1">
              <label class="text-xs font-semibold text-theme-ink">Author Name</label>
              <input
                v-model="author"
                type="text"
                placeholder="e.g. James Clear"
                class="w-full px-3.5 py-2.5 bg-theme-canvas border border-theme-border rounded-xl text-xs sm:text-sm outline-none focus:border-theme-forest transition-all"
              />
            </div>

            <div class="space-y-1">
              <label class="text-xs font-semibold text-theme-ink">Your WhatsApp Phone *</label>
              <input
                v-model="customerPhone"
                type="tel"
                placeholder="07XXXXXXXX"
                class="w-full px-3.5 py-2.5 bg-theme-canvas border border-theme-border rounded-xl text-xs sm:text-sm font-mono outline-none focus:border-theme-forest transition-all"
                required
              />
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-theme-ink">Preferred Format</label>
            <div class="grid grid-cols-3 gap-2 text-xs font-medium">
              <label
                class="border rounded-xl p-2.5 text-center cursor-pointer transition-all"
                :class="preferredFormat === 'hardcopy' ? 'border-theme-coral bg-orange-50/60 font-bold text-theme-coral' : 'border-theme-border hover:bg-slate-50'"
              >
                <input type="radio" value="hardcopy" v-model="preferredFormat" class="sr-only" />
                Physical Print
              </label>
              <label
                class="border rounded-xl p-2.5 text-center cursor-pointer transition-all"
                :class="preferredFormat === 'ebook' ? 'border-theme-coral bg-orange-50/60 font-bold text-theme-coral' : 'border-theme-border hover:bg-slate-50'"
              >
                <input type="radio" value="ebook" v-model="preferredFormat" class="sr-only" />
                eBook (PDF/EPUB)
              </label>
              <label
                class="border rounded-xl p-2.5 text-center cursor-pointer transition-all"
                :class="preferredFormat === 'either' ? 'border-theme-coral bg-orange-50/60 font-bold text-theme-coral' : 'border-theme-border hover:bg-slate-50'"
              >
                <input type="radio" value="either" v-model="preferredFormat" class="sr-only" />
                Either / Any
              </label>
            </div>
          </div>

          <div class="pt-2 flex justify-end gap-2.5">
            <button
              type="button"
              class="px-4 py-2 text-xs font-semibold text-theme-muted hover:text-theme-ink rounded-lg"
              @click="emit('close')"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="bg-theme-coral hover:bg-theme-coral-hover text-white text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              :disabled="isSubmitting"
            >
              <Send :size="13" />
              <span>{{ isSubmitting ? 'Submitting...' : 'Send Request via WhatsApp' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>