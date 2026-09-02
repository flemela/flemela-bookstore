/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './app.vue',
  ],
  theme: {
    extend: {
      colors: {
        // Variable-driven Theme Tokens
        theme: {
          dark: 'var(--theme-dark)',
          forest: 'var(--theme-forest)',
          coral: 'var(--theme-coral)',
          'coral-hover': 'var(--theme-coral-hover)',
          turquoise: 'var(--theme-turquoise)',
          sand: 'var(--theme-sand)',
          canvas: 'var(--theme-canvas)',
          surface: 'var(--theme-surface)',
          cream: 'var(--theme-cream)',
          border: 'var(--theme-border)',
          'border-strong': 'var(--theme-border-strong)',
          ink: 'var(--theme-ink)',
          muted: 'var(--theme-ink-muted)',
          subtle: 'var(--theme-ink-subtle)',
        },

        // Bento Category Card Colors
        bento: {
          fiction: '#387A5B',
          thriller: '#DE9F3F',
          fantasy: '#207F8B',
          nonfiction: '#E75837',
          romance: '#7C67B6',
        },

        // Backward compatibility mappings
        forest: {
          950: 'var(--theme-dark)',
          900: 'var(--theme-forest)',
          800: '#0D382B',
          700: '#145240',
        },
        gold: {
          600: '#A37222',
          500: '#C18B2F',
          400: '#D4A44C',
          300: '#DFC58E',
          100: '#F8F1E3',
        },
        paper: {
          DEFAULT: 'var(--theme-canvas)',
          canvas: 'var(--theme-canvas)',
          cream: 'var(--theme-cream)',
          surface: 'var(--theme-surface)',
          border: 'var(--theme-border)',
        },
        ink: {
          DEFAULT: 'var(--theme-ink)',
          muted: 'var(--theme-ink-muted)',
          subtle: 'var(--theme-ink-subtle)',
        },
      },

      fontFamily: {
        sans: ['"IBM Plex Sans"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },

      boxShadow: {
        'book': '-2px 0 6px -1px rgba(0, 0, 0, 0.08), 3px 6px 18px -2px rgba(8, 37, 27, 0.08)',
        'book-hover': '-3px 0 10px -1px rgba(0, 0, 0, 0.10), 6px 14px 28px -3px rgba(8, 37, 27, 0.15)',
        'soft': '0 2px 10px rgba(8, 37, 27, 0.03)',
        'card': '0 4px 20px rgba(8, 37, 27, 0.05)',
        'subtle': '0 1px 4px rgba(8, 37, 27, 0.04)',
        'medium': '0 8px 24px rgba(8, 37, 27, 0.08)',
      },

      borderRadius: {
        'book': '2px 8px 8px 2px',
      },
    },
  },
  plugins: [],
};