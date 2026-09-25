<!-- components/admin/HeroNotesEditor.vue (Tiptap Version) -->
<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue';
import { useEditor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Youtube from '@tiptap/extension-youtube';
import TextAlign from '@tiptap/extension-text-align';
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
  RotateCcw,
  Sparkles,
  Save,
  X,
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

const localState = ref<StoreHeroNotes>({
  is_active: props.modelValue.is_active,
  title: props.modelValue.title || 'Reader Announcements',
  content_html: props.modelValue.content_html || '',
  bg_color: props.modelValue.bg_color || '#FAF7F0',
  text_color: props.modelValue.text_color || '#141E1A',
});

// Initialize Tiptap Editor
const editor = useEditor({
  content: localState.value.content_html,
  extensions: [
    StarterKit.configure({
      heading: { levels: [2, 3] },
    }),
    Underline,
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: 'text-emerald-900 font-bold underline',
        target: '_blank',
        rel: 'noopener noreferrer',
      },
    }),
    Youtube.configure({
      HTMLAttributes: {
        class: 'w-full aspect-video rounded-xl my-3 shadow-xs',
      },
    }),
    TextAlign.configure({
      types: ['heading', 'paragraph'],
    }),
  ],
  editorProps: {
    attributes: {
      class: 'prose prose-sm max-w-none p-5 sm:p-6 min-h-[280px] max-h-[460px] overflow-y-auto outline-none text-slate-900 bg-white',
    },
  },
  onUpdate: ({ editor }) => {
    localState.value.content_html = editor.getHTML();
    emit('update:modelValue', { ...localState.value });
  },
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
      if (editor.value && editor.value.getHTML() !== newVal.content_html) {
        editor.value.commands.setContent(newVal.content_html || '', { emitUpdate: false });
      }
    }
  },
  { deep: true }
);

onBeforeUnmount(() => {
  editor.value?.destroy();
});

// Modals
const showLinkModal = ref(false);
const linkUrl = ref('');

function openLinkModal(): void {
  const previousUrl = editor.value?.getAttributes('link').href;
  linkUrl.value = previousUrl || 'https://';
  showLinkModal.value = true;
}

function setLink(): void {
  const url = linkUrl.value.trim();
  if (!url || url === 'https://') {
    editor.value?.chain().focus().unsetLink().run();
  } else {
    editor.value?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }
  showLinkModal.value = false;
}

const showVideoModal = ref(false);
const videoUrl = ref('');

function openVideoModal(): void {
  videoUrl.value = '';
  showVideoModal.value = true;
}

function addVideo(): void {
  if (!videoUrl.value.trim()) return;
  editor.value?.commands.setYoutubeVideo({
    src: videoUrl.value.trim(),
    width: 640,
    height: 360,
  });
  showVideoModal.value = false;
  pushToast({ message: 'YouTube video embedded!', variant: 'success' });
}

function handleSave(): void {
  if (editor.value) {
    localState.value.content_html = editor.value.getHTML();
  }
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
				<div class="space-y-1 sm:col-span-1">
					<label class="text-xs font-bold text-forest-950">Card Heading *</label>
					<input v-model="localState.title" type="text" placeholder="e.g. Reader Notice / Curators Note"
						class="w-full px-3 py-2 bg-paper-canvas border border-paper-border rounded-xl text-xs font-bold outline-none focus:border-forest-900"
						maxlength="80" />
				</div>

				<div class="space-y-1 sm:col-span-1">
					<label class="text-xs font-bold text-forest-950">Card Background</label>
					<div class="flex items-center gap-2">
						<input v-model="localState.bg_color" type="color"
							class="w-8 h-8 rounded border border-paper-border cursor-pointer p-0.5" />
						<input v-model="localState.bg_color" type="text"
							class="w-full px-2.5 py-2 bg-paper-canvas border border-paper-border rounded-xl text-xs font-mono outline-none" />
					</div>
				</div>

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

		<!-- Word Processor Workspace -->
		<div class="grid lg:grid-cols-12 gap-6 items-start">
			<!-- Left: Editor (7 cols) -->
			<div
				class="lg:col-span-7 bg-white rounded-2xl border border-paper-border shadow-soft overflow-hidden flex flex-col">
				<!-- Tiptap Word Toolbar -->
				<div v-if="editor"
					class="p-2 sm:p-2.5 bg-paper-cream/80 border-b border-paper-border flex flex-wrap items-center gap-1 text-forest-950">
					<div class="flex items-center bg-white border border-paper-border rounded-lg p-0.5 shadow-2xs">
						<button type="button" class="p-1.5 rounded transition-colors cursor-pointer"
							:class="editor.isActive('bold') ? 'bg-forest-950 text-white' : 'text-slate-800 hover:bg-slate-100'"
							title="Bold (Ctrl+B)" @click="editor.chain().focus().toggleBold().run()">
							<Bold :size="14" />
						</button>
						<button type="button" class="p-1.5 rounded transition-colors cursor-pointer"
							:class="editor.isActive('italic') ? 'bg-forest-950 text-white' : 'text-slate-800 hover:bg-slate-100'"
							title="Italic (Ctrl+I)" @click="editor.chain().focus().toggleItalic().run()">
							<Italic :size="14" />
						</button>
						<button type="button" class="p-1.5 rounded transition-colors cursor-pointer"
							:class="editor.isActive('underline') ? 'bg-forest-950 text-white' : 'text-slate-800 hover:bg-slate-100'"
							title="Underline (Ctrl+U)" @click="editor.chain().focus().toggleUnderline().run()">
							<UnderlineIcon :size="14" />
						</button>
						<button type="button" class="p-1.5 rounded transition-colors cursor-pointer"
							:class="editor.isActive('strike') ? 'bg-forest-950 text-white' : 'text-slate-800 hover:bg-slate-100'"
							title="Strikethrough" @click="editor.chain().focus().toggleStrike().run()">
							<Strikethrough :size="14" />
						</button>
					</div>

					<div class="flex items-center bg-white border border-paper-border rounded-lg p-0.5 shadow-2xs">
						<button type="button" class="p-1.5 rounded transition-colors cursor-pointer"
							:class="editor.isActive('heading', { level: 2 }) ? 'bg-forest-950 text-white' : 'text-slate-800 hover:bg-slate-100'"
							title="Heading 2" @click="editor.chain().focus().toggleHeading({ level: 2 }).run()">
							<Heading2 :size="14" />
						</button>
						<button type="button" class="p-1.5 rounded transition-colors cursor-pointer"
							:class="editor.isActive('heading', { level: 3 }) ? 'bg-forest-950 text-white' : 'text-slate-800 hover:bg-slate-100'"
							title="Heading 3" @click="editor.chain().focus().toggleHeading({ level: 3 }).run()">
							<Heading3 :size="14" />
						</button>
						<button type="button" class="p-1.5 rounded transition-colors cursor-pointer"
							:class="editor.isActive('paragraph') ? 'bg-forest-950 text-white' : 'text-slate-800 hover:bg-slate-100'"
							title="Paragraph" @click="editor.chain().focus().setParagraph().run()">
							<span class="font-bold text-xs px-1">P</span>
						</button>
					</div>

					<div class="flex items-center bg-white border border-paper-border rounded-lg p-0.5 shadow-2xs">
						<button type="button" class="p-1.5 rounded transition-colors cursor-pointer"
							:class="editor.isActive('bulletList') ? 'bg-forest-950 text-white' : 'text-slate-800 hover:bg-slate-100'"
							title="Bullet List" @click="editor.chain().focus().toggleBulletList().run()">
							<List :size="14" />
						</button>
						<button type="button" class="p-1.5 rounded transition-colors cursor-pointer"
							:class="editor.isActive('orderedList') ? 'bg-forest-950 text-white' : 'text-slate-800 hover:bg-slate-100'"
							title="Numbered List" @click="editor.chain().focus().toggleOrderedList().run()">
							<ListOrdered :size="14" />
						</button>
						<button type="button" class="p-1.5 rounded transition-colors cursor-pointer"
							:class="editor.isActive('blockquote') ? 'bg-forest-950 text-white' : 'text-slate-800 hover:bg-slate-100'"
							title="Quote" @click="editor.chain().focus().toggleBlockquote().run()">
							<Quote :size="14" />
						</button>
					</div>

					<div class="flex items-center bg-white border border-paper-border rounded-lg p-0.5 shadow-2xs">
						<button type="button" class="p-1.5 rounded transition-colors cursor-pointer"
							:class="editor.isActive({ textAlign: 'left' }) ? 'bg-forest-950 text-white' : 'text-slate-800 hover:bg-slate-100'"
							title="Align Left" @click="editor.chain().focus().setTextAlign('left').run()">
							<AlignLeft :size="14" />
						</button>
						<button type="button" class="p-1.5 rounded transition-colors cursor-pointer"
							:class="editor.isActive({ textAlign: 'center' }) ? 'bg-forest-950 text-white' : 'text-slate-800 hover:bg-slate-100'"
							title="Align Center" @click="editor.chain().focus().setTextAlign('center').run()">
							<AlignCenter :size="14" />
						</button>
						<button type="button" class="p-1.5 rounded transition-colors cursor-pointer"
							:class="editor.isActive({ textAlign: 'right' }) ? 'bg-forest-950 text-white' : 'text-slate-800 hover:bg-slate-100'"
							title="Align Right" @click="editor.chain().focus().setTextAlign('right').run()">
							<AlignRight :size="14" />
						</button>
					</div>

					<div class="flex items-center bg-white border border-paper-border rounded-lg p-0.5 shadow-2xs">
						<button type="button" class="p-1.5 rounded transition-colors cursor-pointer"
							:class="editor.isActive('link') ? 'bg-forest-950 text-white' : 'text-slate-800 hover:bg-slate-100'"
							title="Hyperlink" @click="openLinkModal">
							<LinkIcon :size="14" />
						</button>
						<button type="button"
							class="p-1.5 hover:bg-slate-100 rounded text-slate-800 hover:text-black cursor-pointer"
							title="Embed YouTube Video" @click="openVideoModal">
							<Video :size="14" />
						</button>
					</div>

					<button type="button"
						class="p-1.5 hover:bg-slate-200 rounded text-slate-600 hover:text-black cursor-pointer ml-auto"
						title="Clear Formatting" @click="editor.chain().focus().unsetAllMarks().clearNodes().run()">
						<RotateCcw :size="13" />
					</button>
				</div>

				<!-- Tiptap Canvas -->
				<ClientOnly>
					<EditorContent :editor="editor" />
				</ClientOnly>

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

			<!-- Right: Real-time Live Storefront Preview (5 cols) -->
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

		<!-- MODAL 1: Hyperlink -->
		<Teleport to="body">
			<div v-if="showLinkModal"
				class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest-950/70 backdrop-blur-xs"
				@click.self="showLinkModal = false">
				<div
					class="bg-white rounded-2xl shadow-2xl border border-paper-border max-w-sm w-full p-5 space-y-4 animate-in zoom-in-95">
					<div class="flex justify-between items-center border-b border-paper-border pb-2.5">
						<h4 class="font-display font-bold text-sm text-forest-950">Set Hyperlink</h4>
						<button type="button" class="text-ink-muted hover:text-black cursor-pointer"
							@click="showLinkModal = false">
							<X :size="16" />
						</button>
					</div>

					<div class="space-y-2 text-xs">
						<label class="font-bold text-forest-950">URL Destination</label>
						<input v-model="linkUrl" type="text" placeholder="https://... or #flash-sale"
							class="w-full px-3 py-2 border border-paper-border rounded-xl font-mono outline-none focus:border-forest-900" />
					</div>

					<div class="flex justify-end gap-2 pt-2 border-t border-paper-border">
						<button type="button" class="px-3 py-1.5 text-xs text-ink-muted hover:text-black"
							@click="showLinkModal = false">
							Cancel
						</button>
						<button type="button" class="px-4 py-1.5 bg-forest-950 text-paper text-xs font-bold rounded-xl"
							@click="setLink">
							Apply
						</button>
					</div>
				</div>
			</div>
		</Teleport>

		<!-- MODAL 2: YouTube Video -->

		<!-- MODAL 2: YouTube Video -->
		<Teleport to="body">
			<div v-if="showVideoModal"
				class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest-950/70 backdrop-blur-xs"
				@click.self="showVideoModal = false">
				<div
					class="bg-white rounded-2xl shadow-2xl border border-paper-border max-w-sm w-full p-5 space-y-4 animate-in zoom-in-95">
					<div class="flex justify-between items-center border-b border-paper-border pb-2.5">
						<h4 class="font-display font-bold text-sm text-forest-950">Embed YouTube Video</h4>
						<button type="button" class="text-ink-muted hover:text-black cursor-pointer"
							@click="showVideoModal = false">
							<X :size="16" />
						</button>
					</div>

					<div class="space-y-2 text-xs">
						<label class="font-bold text-forest-950">YouTube Video URL</label>
						<input v-model="videoUrl" type="url" placeholder="https://www.youtube.com/watch?v=..."
							class="w-full px-3 py-2 border border-paper-border rounded-xl font-mono outline-none focus:border-forest-900" />
					</div>

					<div class="flex justify-end gap-2 pt-2 border-t border-paper-border">
						<button type="button" class="px-3 py-1.5 text-xs text-ink-muted hover:text-black"
							@click="showVideoModal = false">
							Cancel
						</button>
						<button type="button" class="px-4 py-1.5 bg-forest-950 text-paper text-xs font-bold rounded-xl"
							@click="addVideo">
							Embed
						</button>
					</div>
				</div>
			</div>
		</Teleport>
	</div>
</template>