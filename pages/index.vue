<!-- pages/index.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue';
import TopUtilityBar from '~/components/storefront/TopUtilityBar.vue';
import BookstoreHeader from '~/components/storefront/BookstoreHeader.vue';
import HeroBanner from '~/components/storefront/HeroBanner.vue';
import TrustBadgeStrip from '~/components/storefront/TrustBadgeStrip.vue';
import BookCard from '~/components/storefront/BookCard.vue';
import CartDrawer from '~/components/storefront/CartDrawer.vue';
import ToastContainer from '~/components/ui/ToastContainer.vue';
import Skeleton from '~/components/ui/Skeleton.vue';
import Modal from '~/components/ui/Modal.vue';
import { useToast } from '~/composables/useToast';
import { BookOpen, MessageSquare } from 'lucide-vue-next';
import type { Book } from '~/types';

const { data: books, status: fetchStatus } = await useFetch<Book[]>('/api/products');
const { push: pushToast } = useToast();

const activeCategoryFilter = ref<string>('ALL');
const searchQuery = ref<string>('');

const showRequestModal = ref(false);
const requestTitle = ref('');
const requestAuthor = ref('');
const requestContact = ref('');
const isSubmittingRequest = ref(false);

useSeoMeta({
  title: 'Flemela Bookstore — Books that inspire. Knowledge that transforms.',
  description: 'Shop authentic hardcovers and instant Cloudflare R2 eBooks across Business, Philosophy, Psychology, and Literature in Kenya.',
  ogTitle: 'Flemela Bookstore — Books that inspire. Knowledge that transforms.',
  ogDescription: 'Shop authentic hardcovers, paperbacks, and instant eBooks with Lipa Na M-Pesa.',
});

// Inclusive category filter
const filteredBooks = computed(() => {
  if (!books.value) return [];
  let result = [...books.value];

  if (activeCategoryFilter.value !== 'ALL') {
    const filterKey = activeCategoryFilter.value.toLowerCase().trim();
    result = result.filter((b) => {
      const cat = (b.category_name || '').toLowerCase().trim();
      if (cat === filterKey) return true;
      if (cat.includes(filterKey) || filterKey.includes(cat)) return true;
      if (filterKey.includes('fiction') && cat.includes('fiction')) return true;
      if ((filterKey.includes('finance') || filterKey.includes('business')) && (cat.includes('finance') || cat.includes('business') || cat.includes('wealth'))) return true;
      if ((filterKey.includes('religious') || filterKey.includes('christian')) && (cat.includes('religious') || cat.includes('christian') || cat.includes('faith'))) return true;
      if ((filterKey.includes('biograph') || filterKey.includes('memoir')) && (cat.includes('biograph') || cat.includes('memoir'))) return true;
      if (filterKey.includes('self-help') && (cat.includes('self') || cat.includes('psychology'))) return true;
      return false;
    });
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim();
    result = result.filter(
      (b) => b.name.toLowerCase().includes(q) || (b.author && b.author.toLowerCase().includes(q)) || (b.description && b.description.toLowerCase().includes(q))
    );
  }

  return result;
});

function handleSearch(query: string, category: string): void {
  searchQuery.value = query;
  activeCategoryFilter.value = (category && category !== 'All Categories') ? category : 'ALL';
}

function handleCategorySelect(category: string): void {
  activeCategoryFilter.value = category;
}

function handleBookRequestSubmit(): void {
  if (!requestTitle.value.trim() || !requestContact.value.trim()) return;
  isSubmittingRequest.value = true;

  setTimeout(() => {
    isSubmittingRequest.value = false;
    showRequestModal.value = false;
    requestTitle.value = '';
    requestAuthor.value = '';
    requestContact.value = '';
    pushToast({
      message: 'Book request received! Our team will source it and notify you.',
      variant: 'success',
    });
  }, 600);
}
</script>

<template>
  <div class="min-h-screen flex flex-col bg-paper-canvas text-ink antialiased">
    <TopUtilityBar />
    <BookstoreHeader @search="handleSearch" @select-category="handleCategorySelect" />
    <HeroBanner />
    <TrustBadgeStrip />

    <!-- Main Catalog Section -->
    <section id="bestsellers" class="py-10 sm:py-14 px-4 sm:px-6 max-w-6xl mx-auto w-full space-y-6">
      <div class="flex flex-wrap items-end justify-between gap-4 pb-2">
        <div>
          <span class="text-[10px] font-mono font-bold uppercase tracking-widest text-gold-600 block">Curated Collection</span>
          <h2 class="font-display text-2xl sm:text-3xl font-extrabold text-forest-950 tracking-tight">
            Featured Catalog &amp; Editions
          </h2>
          <p class="text-xs sm:text-sm text-ink-muted mt-0.5">
            Discover handpicked print editions and instant digital downloads
          </p>
        </div>

        <button
          type="button"
          class="inline-flex items-center gap-1.5 text-xs font-bold text-forest-950 hover:text-gold-600 transition-colors cursor-pointer"
          @click="showRequestModal = true"
        >
          <MessageSquare :size="14" /> Can't find a title? Request it
        </button>
      </div>

      <!-- Active Filter Pill Bar -->
      <div v-if="activeCategoryFilter !== 'ALL' || searchQuery" class="flex items-center justify-between bg-paper-surface px-4 py-2.5 rounded-xl border border-paper-border shadow-2xs">
        <span class="text-xs text-forest-950 font-medium">
          Filtering by: <strong class="underline text-forest-900 font-bold">{{ activeCategoryFilter }}</strong>
          <template v-if="searchQuery"> (Search: "{{ searchQuery }}")</template>
        </span>
        <button
          type="button"
          class="text-xs text-forest-950 font-bold hover:underline cursor-pointer bg-paper-cream px-2.5 py-1 rounded-md"
          @click="activeCategoryFilter = 'ALL'; searchQuery = '';"
        >
          Reset Filter
        </button>
      </div>

      <!-- Loading Skeletons -->
      <div v-if="fetchStatus === 'pending'" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
        <div v-for="n in 8" :key="n" class="bg-paper-surface rounded-xl border border-paper-border p-3.5 space-y-3">
          <Skeleton height="220px" radius="6px" />
          <Skeleton height="14px" width="80%" />
          <Skeleton height="10px" width="40%" />
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredBooks.length === 0" class="bg-paper-surface rounded-2xl border border-paper-border p-12 text-center space-y-3.5 shadow-soft">
        <BookOpen :size="40" class="mx-auto text-forest-900 opacity-50" />
        <h3 class="font-display text-base font-bold text-forest-950">No titles match your filter</h3>
        <p class="text-xs text-ink-muted max-w-xs mx-auto">
          Try clearing your search query to view all available titles.
        </p>
        <button
          type="button"
          class="bg-forest-950 hover:bg-forest-900 text-paper text-xs font-bold uppercase px-4 py-2 rounded-lg cursor-pointer transition-colors shadow-subtle"
          @click="activeCategoryFilter = 'ALL'; searchQuery = '';"
        >
          View All Titles
        </button>
      </div>

      <!-- Books Grid: 2-col Mobile, 3-col Tablet, 4-col Desktop -->
      <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
        <BookCard
          v-for="book in filteredBooks"
          :key="book.id"
          :book="book"
        />
      </div>
    </section>

    <!-- Custom Orders Section Banner -->
    <section class="py-12 sm:py-14 bg-forest-950 text-paper px-4 sm:px-6">
      <div class="max-w-4xl mx-auto text-center space-y-4">
        <span class="text-[10px] font-mono font-bold uppercase tracking-widest text-gold-300">Procurement &amp; Custom Orders</span>
        <h2 class="font-display text-2xl sm:text-3xl font-extrabold text-paper">Looking for a specific publication?</h2>
        <p class="text-xs sm:text-sm text-paper/80 max-w-lg mx-auto leading-relaxed">
          Our team can procure rare editions, academic textbooks, and international publications for you in digital or physical print format.
        </p>
        <div class="pt-2">
          <button
            type="button"
            class="bg-gold-500 text-forest-950 font-bold text-xs uppercase px-6 py-3 rounded-xl hover:bg-gold-400 transition-colors shadow-medium cursor-pointer active:scale-[0.98]"
            @click="showRequestModal = true"
          >
            Submit Book Request
          </button>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="bg-forest-950 text-paper py-10 px-4 sm:px-6 border-t border-forest-900/80 mt-auto">
      <div class="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
        <div class="space-y-1 text-center sm:text-left">
          <span class="font-display font-bold text-base tracking-tight text-paper block">FLEMELA BOOKSTORE</span>
          <p class="text-paper/70 text-xs">Books that inspire. Knowledge that transforms.</p>
        </div>
        <p class="text-paper/50 text-xs font-mono">&copy; 2026 Flemela Bookstore. All rights reserved.</p>
      </div>
    </footer>

    <!-- Request Modal -->
    <Modal :open="showRequestModal" title="Request a Book / Custom Order" @close="showRequestModal = false">
      <form class="space-y-4" @submit.prevent="handleBookRequestSubmit">
        <p class="text-xs text-ink-muted">
          Tell us the book title, author, and your contact number. We will source it and notify you via WhatsApp.
        </p>

        <div class="space-y-1.5">
          <label class="text-xs font-bold text-forest-950">Book Title *</label>
          <input v-model="requestTitle" type="text" placeholder="e.g. Atomic Habits" class="w-full px-3.5 py-2 border border-paper-border rounded-xl text-xs outline-none focus:border-forest-900" required />
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-bold text-forest-950">Author Name</label>
          <input v-model="requestAuthor" type="text" placeholder="e.g. James Clear" class="w-full px-3.5 py-2 border border-paper-border rounded-xl text-xs outline-none focus:border-forest-900" />
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-bold text-forest-950">WhatsApp Phone Number *</label>
          <input v-model="requestContact" type="tel" placeholder="07XXXXXXXX" class="w-full px-3.5 py-2 border border-paper-border rounded-xl text-xs outline-none focus:border-forest-900 font-mono" required />
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button type="button" class="px-4 py-2 text-xs font-bold hover:bg-slate-100 rounded-lg cursor-pointer" @click="showRequestModal = false">
            Cancel
          </button>
          <button type="submit" class="bg-forest-950 text-paper text-xs font-bold uppercase px-5 py-2 rounded-lg hover:bg-forest-900 cursor-pointer shadow-subtle" :disabled="isSubmittingRequest">
            {{ isSubmittingRequest ? 'Submitting...' : 'Submit Request' }}
          </button>
        </div>
      </form>
    </Modal>

    <CartDrawer />
    <ToastContainer />
  </div>
</template>