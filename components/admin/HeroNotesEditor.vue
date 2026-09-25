<!-- components/admin/HeroNotesEditor.vue -->
<script setup lang="ts">
import { ref, watch, onMounted} from 'vue';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Video,
  Image as ImageIcon,
  RotateCcw,
  Sparkles,
  Save,
  X
} from 'lucide-vue-next';
import { useToast } from '~/composables/useToast';

export interface StoreHeroNotes {
  is_active: boolean;
  title: string;
  content_html: string;
  bg_color?: string;
  text_color?: string;
}

interface Props {
  modelValue: StoreHeroNotes;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<{
  'update:modelValue': [val: StoreHeroNotes];
  save: [val: StoreHeroNotes];
}>();

const { push: pushToast } = useToast();

const editorRef = ref<HTMLDivElement | null>(null);

const localState = ref<StoreHeroNotes>({
  is_active: props.modelValue.is_active,
  title: props.modelValue.title || 'Reader Announcements',
  content_html: props.modelValue.content_html || '',
  bg_color: props.modelValue.bg_color || '#FAF7F0',
  text_color: props.modelValue.text_color || '#141E1A',
});

watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal) {
      localState.value = {
        is_active: newVal.is_active,
        title: newVal.title || 'Reader Announcements',
        content_html: newVal.content_html || '',
        bg_color: newVal.bg_color || '#FAF7F0',
        text_color: newVal.text_color || '#141E1A',
      };
      if (editorRef.value && editorRef.value.innerHTML !== newVal.content_html) {
        editorRef.value.innerHTML = newVal.content_html || '';
      }
    }
  },
  { deep: true }
);

onMounted(() => {
  if (editorRef.value) {
    editorRef.value.innerHTML = localState.value.content_html || '';
  }
});

function handleEditorInput(): void {
  if (!editorRef.value) return;
  localState.value.content_html = editorRef.value.innerHTML;
  emit('update:modelValue', { ...localState.value });
}

function execCmd(command: string, value: string | undefined = undefined): void {
  if (!process.client) return;
  document.execCommand(command, false, value);
  handleEditorInput();
  editorRef.value?.focus();
}

// Modal States for Inserting Link & Video
const showLinkModal = ref(false);
const linkUrl = ref('');
const linkText = ref('');

const showVideoModal = ref(false);
const videoUrl = ref('');

function openLinkModal(): void {
  linkUrl.value = 'https://';
  linkText.value = '';
  showLinkModal.value = true;
}

function insertLink(): void {
  const url = linkUrl.value.trim();
  if (!url || url === 'https://') return;
  
  if (linkText.value.trim()) {
    const html = `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #073B24; font-weight: bold; text-decoration: underline;">${linkText.value.trim()}</a>`;
    execCmd('insertHTML', html);
  } else {
    execCmd('createLink', url);
  }
  showLinkModal.value = false;
}

function openVideoModal(): void {
  videoUrl.value = '';
  showVideoModal.value = true;
}

function insertVideoEmbed(): void {
  const raw = videoUrl.value.trim();
  if (!raw) return;

  let embedUrl = raw;
  // Convert standard YouTube watch link to responsive embed
  const ytMatch = raw.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (ytMatch && ytMatch[1]) {
    embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}`;
  }

  // Convert Vimeo link
  const vimeoMatch = raw.match(/vimeo\.com\/([0-9]+)/);
  if (vimeoMatch && vimeoMatch[1]) {
    embedUrl = `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

  const iframeHtml = `
    <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 12px; margin: 12px 0;">
      <iframe src="${embedUrl}" style="position: absolute; top:0; left: 0; width: 100%; height: 100%; border:0;" allowfullscreen loading="lazy"></iframe>
    </div>
    <p></p>
  `;
  execCmd('insertHTML', iframeHtml);
  showVideoModal.value = false;
  pushToast({ message: 'Video embed inserted!', variant: 'success' });
}

function insertImagePrompt(): void {
  const url = prompt('Enter public image URL (https://...):');
  if (url && url.startsWith('http')) {
    const imgHtml = `<img src="${url.trim()}" alt="Editorial Photo" style="max-width: 100%; border-radius: 10px; margin: 8px 0; border: 1px solid rgba(8,37,27,0.1);" /><p></p>`;
    execCmd('insertHTML', imgHtml);
  }
}

function handleSave(): void {
  handleEditorInput();
  emit('save', { ...localState.value });
}
</script>

<template>
	<div class="space-y-6">
		<!-- Top Configuration Header -->
		<div class="bg-white rounded-2xl border border-paper-border p-5 sm:p-6 shadow-soft space-y-4">
			<div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-paper-border">
				<div>
					<h3 class="font-display font-bold text-base text-forest-950">
						Hero Right-Side Editorial Notes
					</h3>
					<p class="text-xs text-ink-muted">
						Display formatted announcements, bookstore updates, and embedded book media in the hero section.
					</p>
				</div>

				<label
					class="flex items-center gap-2 cursor-pointer select-none px-3.5 py-1.5 rounded-xl bg-paper-cream border border-paper-border">
					<input v-model="localState.is_active" type="checkbox"
						class="rounded border-paper-border text-forest-950 focus:ring-forest-900" />
					<span class="text-xs font-bold text-forest-950">Enable on Storefront</span>
				</label>
			</div>

			<div class="grid sm:grid-cols-3 gap-4">
				<!-- Card Title -->
				<div class="space-y-1 sm:col-span-1">
					<label class="text-xs font-bold text-forest-950">Card Heading *</label>
					<input v-model="localState.title" type="text" placeholder="e.g. Reader Notice / Curators Note"
						class="w-full px-3 py-2 bg-paper-canvas border border-paper-border rounded-xl text-xs font-bold outline-none focus:border-forest-900"
						maxlength="80" />
				</div>

				<!-- Background Color -->
				<div class="space-y-1 sm:col-span-1">
					<label class="text-xs font-bold text-forest-950">Card Background</label>
					<div class="flex items-center gap-2">
						<input v-model="localState.bg_color" type="color"
							class="w-8 h-8 rounded border border-paper-border cursor-pointer p-0.5" />
						<input v-model="localState.bg_color" type="text"
							class="w-full px-2.5 py-2 bg-paper-canvas border border-paper-border rounded-xl text-xs font-mono outline-none" />
					</div>
				</div>

				<!-- Text Tone -->
				<div class="space-y-1 sm:col-span-1">
					<label class="text-xs font-bold text-forest-950">Text Tone</label>
					<div class="flex items-center gap-2">
						<input v-model="localState.text_color" type="color"
							class="w-8 h-8 rounded border border-paper-border cursor-pointer p-0.5" />
						<input v-model="localState.text_color" type="text"
							class="w-full px-2.5 py-2 bg-paper-canvas border border-paper-border rounded-xl text-xs font-mono outline-none" />
					</div>
				</div>
			</div>
		</div>

		<!-- Word Processor WYSIWYG Editor Workspace -->
		<div class="grid lg:grid-cols-12 gap-6 items-start">
			<!-- Left: Editor (7 cols) -->
			<div
				class="lg:col-span-7 bg-white rounded-2xl border border-paper-border shadow-soft overflow-hidden flex flex-col">
				<!-- Word Toolbar -->
				<div
					class="p-2 sm:p-2.5 bg-paper-cream/80 border-b border-paper-border flex flex-wrap items-center gap-1 text-forest-950">
					<!-- Text Styling Group -->
					<div class="flex items-center bg-white border border-paper-border rounded-lg p-0.5 shadow-2xs">
						<button type="button"
							class="p-1.5 hover:bg-slate-100 rounded text-slate-800 hover:text-black cursor-pointer"
							title="Bold (Ctrl+B)" @click="execCmd('bold')">
							<Bold :size="14" />
						</button>
						<button type="button"
							class="p-1.5 hover:bg-slate-100 rounded text-slate-800 hover:text-black cursor-pointer"
							title="Italic (Ctrl+I)" @click="execCmd('italic')">
							<Italic :size="14" />
						</button>
						<button type="button"
							class="p-1.5 hover:bg-slate-100 rounded text-slate-800 hover:text-black cursor-pointer"
							title="Underline (Ctrl+U)" @click="execCmd('underline')">
							<UnderlineIcon :size="14" />
						</button>
						<button type="button"
							class="p-1.5 hover:bg-slate-100 rounded text-slate-800 hover:text-black cursor-pointer"
							title="Strikethrough" @click="execCmd('strikeThrough')">
							<Strikethrough :size="14" />
						</button>
					</div>

					<!-- Headings Group -->
					<div class="flex items-center bg-white border border-paper-border rounded-lg p-0.5 shadow-2xs">
						<button type="button"
							class="p-1.5 hover:bg-slate-100 rounded text-slate-800 hover:text-black cursor-pointer"
							title="Heading 2" @click="execCmd('formatBlock', '<h2>')">
							<Heading2 :size="14" />
						</button>
						<button type="button"
							class="p-1.5 hover:bg-slate-100 rounded text-slate-800 hover:text-black cursor-pointer"
							title="Heading 3" @click="execCmd('formatBlock', '<h3>')">
							<Heading3 :size="14" />
						</button>
						<button type="button"
							class="p-1.5 hover:bg-slate-100 rounded text-slate-800 hover:text-black cursor-pointer"
							title="Paragraph" @click="execCmd('formatBlock', '<p>')">
							<span class="font-bold text-xs px-1">P</span>
						</button>
					</div>

					<!-- Lists & Quotes Group -->
					<div class="flex items-center bg-white border border-paper-border rounded-lg p-0.5 shadow-2xs">
						<button type="button"
							class="p-1.5 hover:bg-slate-100 rounded text-slate-800 hover:text-black cursor-pointer"
							title="Bulleted List" @click="execCmd('insertUnorderedList')">
							<List :size="14" />
						</button>
						<button type="button"
							class="p-1.5 hover:bg-slate-100 rounded text-slate-800 hover:text-black cursor-pointer"
							title="Numbered List" @click="execCmd('insertOrderedList')">
							<ListOrdered :size="14" />
						</button>
						<button type="button"
							class="p-1.5 hover:bg-slate-100 rounded text-slate-800 hover:text-black cursor-pointer"
							title="Blockquote" @click="execCmd('formatBlock', '<blockquote>')">
							<Quote :size="14" />
						</button>
					</div>

					<!-- Alignment Group -->
					<div class="flex items-center bg-white border border-paper-border rounded-lg p-0.5 shadow-2xs">
						<button type="button"
							class="p-1.5 hover:bg-slate-100 rounded text-slate-800 hover:text-black cursor-pointer"
							title="Align Left" @click="execCmd('justifyLeft')">
							<AlignLeft :size="14" />
						</button>
						<button type="button"
							class="p-1.5 hover:bg-slate-100 rounded text-slate-800 hover:text-black cursor-pointer"
							title="Align Center" @click="execCmd('justifyCenter')">
							<AlignCenter :size="14" />
						</button>
						<button type="button"
							class="p-1.5 hover:bg-slate-100 rounded text-slate-800 hover:text-black cursor-pointer"
							title="Align Right" @click="execCmd('justifyRight')">
							<AlignRight :size="14" />
						</button>
					</div>

					<!-- Media Group -->
					<div class="flex items-center bg-white border border-paper-border rounded-lg p-0.5 shadow-2xs">
						<button type="button"
							class="p-1.5 hover:bg-slate-100 rounded text-slate-800 hover:text-black cursor-pointer"
							title="Insert Hyperlink" @click="openLinkModal">
							<LinkIcon :size="14" />
						</button>
						<button type="button"
							class="p-1.5 hover:bg-slate-100 rounded text-slate-800 hover:text-black cursor-pointer"
							title="Embed Video (YouTube / Vimeo)" @click="openVideoModal">
							<Video :size="14" />
						</button>
						<button type="button"
							class="p-1.5 hover:bg-slate-100 rounded text-slate-800 hover:text-black cursor-pointer"
							title="Insert Image URL" @click="insertImagePrompt">
							<ImageIcon :size="14" />
						</button>
					</div>

					<!-- Clear Formatting -->
					<button type="button"
						class="p-1.5 hover:bg-slate-200 rounded text-slate-600 hover:text-black cursor-pointer ml-auto"
						title="Clear Formatting" @click="execCmd('removeFormat')">
						<RotateCcw :size="13" />
					</button>
				</div>

				<!-- Editable Area -->
				<div ref="editorRef" contenteditable="true"
					class="p-5 sm:p-6 min-h-[280px] max-h-[460px] overflow-y-auto outline-none prose prose-sm max-w-none text-slate-900 bg-white"
					@input="handleEditorInput" />

				<!-- Save Button Footer -->
				<div class="p-3 bg-paper-cream/40 border-t border-paper-border flex justify-between items-center">
					<span class="text-[11px] text-ink-muted">
						HTML Output: <strong>{{ localState.content_html.length }}</strong> characters
					</span>

					<button type="button"
						class="bg-forest-950 hover:bg-forest-900 text-paper font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-medium flex items-center gap-2 cursor-pointer disabled:opacity-50 transition-all active:scale-[0.98]"
						:disabled="loading" @click="handleSave">
						<Save :size="14" class="text-gold-300" />
						<span>{{ loading ? 'Saving...' : 'Save Notes' }}</span>
					</button>
				</div>
			</div>

			<!-- Right: Real-time Live Desktop Storefront Preview (5 cols) -->
			<div class="lg:col-span-5 space-y-3 sticky top-24">
				<div class="flex items-center justify-between text-xs font-mono font-bold text-forest-950">
					<span class="flex items-center gap-1.5">
						<Sparkles :size="13" class="text-gold-600" />
						<span>Hero Flank Preview</span>
					</span>
					<span class="text-[10px] uppercase px-2 py-0.5 rounded-full font-bold"
						:class="localState.is_active ? 'bg-emerald-100 text-emerald-900' : 'bg-slate-200 text-slate-700'">
						{{ localState.is_active ? 'Active' : 'Hidden' }}
					</span>
				</div>

				<!-- Rendered Card Simulation -->
				<div class="rounded-2xl p-5 sm:p-6 border border-slate-300 shadow-card space-y-3 overflow-hidden transition-colors"
					:style="{
            backgroundColor: localState.bg_color,
            color: localState.text_color,
          }">
					<div class="flex items-center justify-between pb-2 border-b border-black/10">
						<h4 class="font-display font-bold text-sm uppercase tracking-wide">
							{{ localState.title }}
						</h4>
						<span class="w-2 h-2 rounded-full bg-emerald-600" />
					</div>

					<div v-if="localState.content_html" class="prose prose-sm max-w-none text-xs leading-relaxed"
						v-html="localState.content_html" />
					<div v-else class="text-xs italic opacity-60">
						Empty note preview. Write in the editor on the left to see live content.
					</div>
				</div>
			</div>
		</div>

		<!-- MODAL 1: Insert Link -->
		<Teleport to="body">
			<div v-if="showLinkModal"
				class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest-950/70 backdrop-blur-xs"
				@click.self="showLinkModal = false">
				<div
					class="bg-white rounded-2xl shadow-2xl border border-paper-border max-w-sm w-full p-5 space-y-4 animate-in zoom-in-95">
					<div class="flex justify-between items-center border-b border-paper-border pb-2.5">
						<h4 class="font-display font-bold text-sm text-forest-950">Insert Hyperlink</h4>
						<button type="button" class="text-ink-muted hover:text-black cursor-pointer"
							@click="showLinkModal = false">
							<X :size="16" />
						</button>
					</div>

					<div class="space-y-3 text-xs">
						<div class="space-y-1">
							<label class="font-bold text-forest-950">Link Text (Optional)</label>
							<input v-model="linkText" type="text" placeholder="e.g. View Weekend Deals"
								class="w-full px-3 py-2 border border-paper-border rounded-xl outline-none focus:border-forest-900" />
						</div>

						<div class="space-y-1">
							<label class="font-bold text-forest-950">URL Destination *</label>
							<input v-model="linkUrl" type="text" placeholder="https://... or #flash-sale"
								class="w-full px-3 py-2 border border-paper-border rounded-xl font-mono outline-none focus:border-forest-900" />
						</div>
					</div>

					<div class="flex justify-end gap-2 pt-2 border-t border-paper-border">
						<button type="button" class="px-3 py-1.5 text-xs text-ink-muted hover:text-black cursor-pointer"
							@click="showLinkModal = false">
							Cancel
						</button>
						<button type="button"
							class="px-4 py-1.5 bg-forest-950 text-paper text-xs font-bold rounded-xl hover:bg-forest-900 cursor-pointer"
							@click="insertLink">
							Apply Link
						</button>
					</div>
				</div>
			</div>
		</Teleport>

		<!-- MODAL 2: Embed Video -->
		<Teleport to="body">
			<div v-if="showVideoModal"
				class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest-950/70 backdrop-blur-xs"
				@click.self="showVideoModal = false">
				<div
					class="bg-white rounded-2xl shadow-2xl border border-paper-border max-w-sm w-full p-5 space-y-4 animate-in zoom-in-95">
					<div class="flex justify-between items-center border-b border-paper-border pb-2.5">
						<h4 class="font-display font-bold text-sm text-forest-950">Embed Video / Trailer</h4>
						<button type="button" class="text-ink-muted hover:text-black cursor-pointer"
							@click="showVideoModal = false">
							<X :size="16" />
						</button>
					</div>

					<div class="space-y-3 text-xs">
						<div class="space-y-1">
							<label class="font-bold text-forest-950">Video Link (YouTube / Vimeo) *</label>
							<input v-model="videoUrl" type="url" placeholder="https://www.youtube.com/watch?v=..."
								class="w-full px-3 py-2 border border-paper-border rounded-xl font-mono outline-none focus:border-forest-900" />
							<p class="text-[10px] text-ink-muted leading-relaxed">
								Paste any standard YouTube or Vimeo URL. It will automatically convert to a responsive
								player.
							</p>
						</div>
					</div>

					<div class="flex justify-end gap-2 pt-2 border-t border-paper-border">
						<button type="button" class="px-3 py-1.5 text-xs text-ink-muted hover:text-black cursor-pointer"
							@click="showVideoModal = false">
							Cancel
						</button>
						<button type="button"
							class="px-4 py-1.5 bg-forest-950 text-paper text-xs font-bold rounded-xl hover:bg-forest-900 cursor-pointer"
							@click="insertVideoEmbed">
							Embed Video
						</button>
					</div>
				</div>
			</div>
		</Teleport>
	</div>
</template>