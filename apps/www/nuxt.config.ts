import tailwindcss from '@tailwindcss/vite';

export default defineNuxtConfig({
  compatibilityDate: '2026-07-25',
  devtools: { enabled: false },

  modules: ['@nuxt/fonts', '@nuxt/icon'],

  css: ['~/assets/css/main.css'],

  vite: {
    plugins: [tailwindcss()],
  },

  icon: {
    provider: 'server',
    serverBundle: 'local',
    clientBundle: { scan: true, sizeLimitKb: 512 },
  },

  fonts: {
    families: [{ name: 'IBM Plex Mono', provider: 'google', weights: [400, 500, 600, 700] }],
  },

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    },
  },

  nitro: {
    prerender: {
      crawlLinks: true,
      routes: ['/'],
    },
  },
});
