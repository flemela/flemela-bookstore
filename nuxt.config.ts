// nuxt.config.ts
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
    adminEmail: process.env.FLEMELA_ADMIN_EMAIL || 'admin@thesunrisebookstore.com',
    public: {
      storeSlug: process.env.NUXT_PUBLIC_STORE_SLUG || 'flemela',
      siteUrl: 'https://www.thesunrisebookstore.com',
      siteName: 'The Sunrise Bookstore',
    },
  },

  app: {
    head: {
      htmlAttrs: {
        lang: 'en-KE',
      },
      title: 'The Sunrise Bookstore — Authentic Books & eBooks in Kenya',
      meta: [
        { charset: 'utf-8' },
        // Viewport optimized for Google Mobile-Friendly Indexing (zoom-accessible)
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#052219' },
        {
          name: 'description',
          content: 'Discover handpicked bestsellers, finance, literature, and self-help books at The Sunrise Bookstore, Diamond Mall, Parklands, Nairobi. Fast doorstep delivery across Kenya and instant eBook downloads.',
        },
        // SEO & Indexing Directives
        { name: 'robots', content: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1' },
        { name: 'googlebot', content: 'index, follow' },
        { name: 'author', content: 'The Sunrise Bookstore' },
        { name: 'publisher', content: 'The Sunrise Bookstore' },
        { name: 'geo.region', content: 'KE-110' },
        { name: 'geo.placename', content: 'Nairobi, Parklands' },
        { name: 'geo.position', content: '-1.2612;36.8167' },
        { name: 'ICBM', content: '-1.2612, 36.8167' },
        // Open Graph Global Defaults
        { property: 'og:site_name', content: 'The Sunrise Bookstore' },
        { property: 'og:type', content: 'website' },
        { property: 'og:locale', content: 'en_KE' },
        { property: 'og:url', content: 'https://www.thesunrisebookstore.com' },
        { property: 'og:title', content: 'The Sunrise Bookstore — Authentic Books & eBooks in Kenya' },
        { property: 'og:description', content: 'Discover handpicked bestsellers, finance, literature, and self-help books at The Sunrise Bookstore, Diamond Mall, Parklands, Nairobi. Order online for swift delivery or instant eBook access.' },
        { property: 'og:image', content: 'https://www.thesunrisebookstore.com/images/hero-cover.jpg' },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { property: 'og:image:alt', content: 'The Sunrise Bookstore Library' },
        // Twitter Card Defaults
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'The Sunrise Bookstore — Authentic Books & eBooks in Kenya' },
        { name: 'twitter:description', content: 'Discover handpicked bestsellers, finance, literature, and self-help books at The Sunrise Bookstore, Diamond Mall, Parklands, Nairobi.' },
        { name: 'twitter:image', content: 'https://www.thesunrisebookstore.com/images/hero-cover.jpg' },
      ],
      link: [
        { rel: 'canonical', href: 'https://www.thesunrisebookstore.com' },
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@500;700&display=swap',
        },
      ],
    },
  },

  typescript: {
    strict: true,
    typeCheck: false,
  },
});