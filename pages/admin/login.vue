<!-- pages/admin/login.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Lock, BookOpen, AlertCircle } from 'lucide-vue-next';
import { useAdminAuth } from '~/composables/useAdminAuth';

const route = useRoute();
const { login, isAuthenticated } = useAdminAuth();

const email = ref('');
const password = ref('');
const isLoading = ref(false);
const errorMessage = ref<string | null>(null);

onMounted(() => {
  if (isAuthenticated.value) {
    const redirectPath = (route.query.redirect as string) || '/admin';
    navigateTo(redirectPath, { replace: true });
  }
});

async function handleSubmit(): Promise<void> {
  if (!email.value.trim() || !password.value) return;

  isLoading.value = true;
  errorMessage.value = null;

  try {
    await login(email.value.trim(), password.value);
    const redirectPath = (route.query.redirect as string) || '/admin';
    await navigateTo(redirectPath, { replace: true });
  } catch (err: any) {
    errorMessage.value = err.data?.statusMessage || err.statusMessage || err.message || 'Invalid admin credentials';
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-paper-cream p-4 text-ink antialiased">
    <div class="w-full max-w-md bg-white rounded-xl shadow-subtle border border-ink-border p-8 space-y-6">
      <div class="text-center space-y-2">
        <div class="w-12 h-12 bg-forest-900 text-gold-300 rounded-lg mx-auto flex items-center justify-center shadow">
          <BookOpen :size="24" />
        </div>
        <h1 class="font-display text-2xl font-bold text-forest-950">Flemela Portal</h1>
        <p class="text-xs text-ink-muted">Single Administrator Control Portal</p>
      </div>

      <form class="space-y-4" @submit.prevent="handleSubmit">
        <div class="space-y-1">
          <label class="text-xs font-semibold text-forest-950">Admin Email</label>
          <input
            v-model="email"
            type="email"
            placeholder="admin@flemela.co.ke"
            class="w-full px-3 py-2 border border-ink-border rounded text-sm outline-none focus:border-forest-900"
            required
            :disabled="isLoading"
          />
        </div>

        <div class="space-y-1">
          <label class="text-xs font-semibold text-forest-950">Master Password</label>
          <input
            v-model="password"
            type="password"
            placeholder="••••••••"
            class="w-full px-3 py-2 border border-ink-border rounded text-sm outline-none focus:border-forest-900"
            required
            :disabled="isLoading"
          />
        </div>

        <div v-if="errorMessage" class="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-center gap-2">
          <AlertCircle :size="14" class="flex-shrink-0" />
          <span>{{ errorMessage }}</span>
        </div>

        <button
          type="submit"
          class="w-full bg-forest-900 text-white font-bold text-xs uppercase py-3 rounded hover:bg-forest-800 transition-colors flex items-center justify-center gap-2 shadow cursor-pointer disabled:opacity-50"
          :disabled="isLoading"
        >
          <span v-if="isLoading" class="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
          <span v-else class="flex items-center gap-1.5">
            <Lock :size="14" /> Sign In to Portal
          </span>
        </button>
      </form>

      <div class="text-center pt-2 border-t border-ink-border text-[11px] text-ink-muted">
        <span>Flemela Bookstore • Production Control Node</span>
      </div>
    </div>
  </div>
</template>