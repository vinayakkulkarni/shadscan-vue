import tailwindcss from '@tailwindcss/vite';

const siteUrl = process.env.NUXT_PUBLIC_SITE_URL ?? 'https://shadscan-vue.geoql.in';

const workerRuntimeFeatures = {
  observability: {
    logs: { enabled: true, invocation_logs: true },
    traces: { enabled: true },
  },
};

export default defineNuxtConfig({
  compatibilityDate: '2026-07-25',
  devtools: { enabled: false },

  modules: [
    '@nuxt/fonts',
    '@nuxt/icon',
    [
      '@nuxtjs/plausible',
      {
        domain: 'shadscan-vue.geoql.in',
        apiHost: 'https://analytics.geoql.in',
        autoOutboundTracking: true,
      },
    ],
    '@openpanel/nuxt',
  ],

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    public: {
      siteUrl,
    },
  },

  openpanel: {
    clientId: process.env.NUXT_PUBLIC_OPENPANEL_CLIENT_ID ?? '',
    apiUrl: 'https://events.geoql.in/api',
    trackScreenViews: true,
    trackOutgoingLinks: true,
    trackAttributes: true,
    // proxy: false — the proxy handler hardcodes api.openpanel.dev and would
    // bypass the self-hosted apiUrl; the direct client POST is correct here.
    proxy: false,
  },

  vite: {
    plugins: [tailwindcss()],
    ssr: {
      // Client-only analytics SDKs. Bundling them into the Nitro server entry
      // trips duplicate-symbol esbuild errors on Linux CI.
      external: ['@openpanel/sdk', '@openpanel/web'],
    },
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

  routeRules: {
    '/**': {
      headers: {
        'Content-Security-Policy':
          "base-uri 'none'; connect-src 'self' https://analytics.geoql.in https://events.geoql.in; font-src 'self' https: data:; form-action 'self'; frame-ancestors 'none'; img-src 'self' data: blob: https:; object-src 'none'; script-src 'self' https://analytics.geoql.in 'unsafe-inline' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; worker-src 'self' blob:; upgrade-insecure-requests",
        'Permissions-Policy':
          'camera=(), display-capture=(), fullscreen=(self), geolocation=(), microphone=()',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'X-Content-Type-Options': 'nosniff',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
        'Cross-Origin-Opener-Policy': 'same-origin',
      },
    },
    // Social crawlers fetch the card cross-origin, so CORP is set per-scope
    // rather than globally: a global same-origin default would be emitted
    // alongside this one and browsers honour the restrictive value.
    '/og/**': {
      headers: {
        'Cross-Origin-Resource-Policy': 'cross-origin',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    },
    '/_nuxt/**': {
      headers: { 'Cross-Origin-Resource-Policy': 'same-origin' },
    },
  },

  nitro: {
    preset: 'cloudflare_module',
    prerender: {
      crawlLinks: true,
      failOnError: false,
      // Emit rules.html instead of rules/index.html so the static layer serves
      // the canonical URL with a 200 rather than a 307 trailing-slash redirect.
      autoSubfolderIndex: false,
      routes: ['/', '/robots.txt', '/sitemap.xml', '/llms.txt', '/llms-full.txt'],
    },
    cloudflare: {
      nodeCompat: true,
      // deployConfig writes the merged config to .output/server/wrangler.json
      // at build time — the single source of truth for the Worker. There is no
      // hand-maintained wrangler.json.
      // Deploy: wrangler deploy --config .output/server/wrangler.json
      deployConfig: true,
      wrangler: {
        name: 'shadscan-vue',
        compatibility_date: '2026-07-25',
        compatibility_flags: ['nodejs_compat'],
        workers_dev: false,
        ...workerRuntimeFeatures,
        routes: [{ pattern: 'shadscan-vue.geoql.in', custom_domain: true }],
      },
    },
  },
});
