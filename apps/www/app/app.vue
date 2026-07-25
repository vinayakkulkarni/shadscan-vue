<script setup lang="ts">
const { public: config } = useRuntimeConfig();
const siteUrl = config.siteUrl.replace(/\/$/, '');

useSeoMeta({
  titleTemplate: (title) => (title ? `${title} — shadscan-vue` : 'shadscan-vue'),
  ogSiteName: 'shadscan-vue',
  ogType: 'website',
  twitterCard: 'summary_large_image',
});

useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'SoftwareApplication',
            '@id': `${siteUrl}/#software`,
            name: 'shadscan-vue',
            applicationCategory: 'DeveloperApplication',
            operatingSystem: 'Node.js 24 or newer',
            description:
              'Static auditor for shadcn-vue and shadcn-nuxt applications. 52 deterministic rules with file and line evidence on every finding.',
            url: siteUrl,
            downloadUrl: 'https://www.npmjs.com/package/shadscan-vue',
            softwareVersion: '0.1.0',
            license: 'https://opensource.org/licenses/MIT',
            isAccessibleForFree: true,
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
            author: { '@id': `${siteUrl}/#author` },
          },
          {
            '@type': 'Person',
            '@id': `${siteUrl}/#author`,
            name: 'Vinayak Kulkarni',
            url: 'https://vinayakkulkarni.dev',
            sameAs: ['https://github.com/vinayakkulkarni'],
          },
          {
            '@type': 'WebSite',
            '@id': `${siteUrl}/#website`,
            url: siteUrl,
            name: 'shadscan-vue',
            publisher: { '@id': `${siteUrl}/#author` },
          },
        ],
      }),
    },
  ],
});
</script>

<template>
  <div class="min-h-dvh flex flex-col">
    <SiteHeader />
    <main class="flex-1">
      <NuxtPage />
    </main>
    <SiteFooter />
  </div>
</template>
