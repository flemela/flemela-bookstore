// flemela/nuxt.config.ts
export default defineNuxtConfig({
  compatibilityDate: '2025-01-15',
  devtools: { enabled: false },

  devServer: {
    port: 3333,
    host: '0.0.0.0',
  },

  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
  ],

  css: [
    '~/assets/css/main.css',
  ],

  runtimeConfig: {
    sokoApiBaseUrl: process.env.SOKO_API_BASE_URL || 'http://localhost:3000/api/v1',
    sokoOrgApiKey: process.env.SOKO_ORG_API_KEY || '',
    adminEmail: process.env.FLEMELA_ADMIN_EMAIL || 'admin@flemela.co.ke',
    public: {
      storeSlug: process.env.NUXT_PUBLIC_STORE_SLUG || 'flemela',
    },
  },

  app: {
    head: {
      title: 'Flemela — Books. Knowledge. Transformation.',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1' },
        { name: 'referrer', content: 'no-referrer' }, // <-- ADDS HOTLINK UNBLOCKER
        { name: 'theme-color', content: '#073B24' },
        {
          name: 'description',
          content: 'Discover a wide range of authentic books, eBooks, and literature across all genres.',
        },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap',
        },
      ],
    },
  },

  typescript: {
    strict: true,
    typeCheck: false,
  },
});