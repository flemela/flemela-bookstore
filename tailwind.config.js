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
        // Modern Editorial Paper Palette
        paper: {
          DEFAULT: '#FBF9F5', // Warm Alabaster Canvas
          canvas: '#FBF9F5',
          cream: '#F4EFE6',  // Linen Accent / Pill background
          surface: '#FFFFFF', // Clean Crisp Elevation
          border: 'rgba(8, 40, 30, 0.08)',
          'border-strong': 'rgba(8, 40, 30, 0.16)',
        },

        // Deep Evergreen Ink
        forest: {
          950: '#062319',
          900: '#08281E',
          800: '#0D382B',
          700: '#145240',
          600: '#1C6953',
        },

        // Burnished Antique Gold
        gold: {
          600: '#A37222',
          500: '#C18B2F',
          400: '#D4A44C',
          300: '#DFC58E',
          200: '#EEDBB5',
          100: '#F8F1E3',
        },

        // Refined Typographic Ink
        ink: {
          DEFAULT: '#141E1A',
          muted: '#5F6964',
          subtle: '#929B96',
          border: 'rgba(20, 30, 26, 0.08)',
          'border-strong': 'rgba(20, 30, 26, 0.16)',
        },

        // Backward-compatible semantic aliases
        'brand-green': '#08281E',
        'brand-green-hover': '#062319',
        'brand-green-dark': '#041710',
        'brand-gold': '#C18B2F',
        'brand-gold-hover': '#A37222',
        'brand-cream': '#F4EFE6',
      },

      fontFamily: {
        sans: ['"IBM Plex Sans"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },

      boxShadow: {
        // Realistic 3D Book Elevation with Spine Crease
        'book': '-2px 0 6px -1px rgba(0, 0, 0, 0.07), 3px 6px 18px -2px rgba(8, 40, 30, 0.08)',
        'book-hover': '-3px 0 10px -1px rgba(0, 0, 0, 0.10), 6px 14px 28px -3px rgba(8, 40, 30, 0.15)',

        // Ambient Surface Shadows
        'soft': '0 2px 10px rgba(8, 40, 30, 0.03)',
        'card': '0 4px 20px rgba(8, 40, 30, 0.05)',
        'subtle': '0 1px 4px rgba(8, 40, 30, 0.04)',
        'medium': '0 8px 24px rgba(8, 40, 30, 0.08)',
        'high': '0 20px 48px rgba(8, 40, 30, 0.12)',
      },

      borderRadius: {
        // Flattens left spine edge, rounds right outer page edge
        'book': '2px 8px 8px 2px',
      },
    },
  },
  plugins: [],
};