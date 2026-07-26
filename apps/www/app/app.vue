<script setup lang="ts">
import changelog from '~/data/changelog.json';
import catalog from '~/data/rules.json';

const { public: config } = useRuntimeConfig();
const siteUrl = config.siteUrl.replace(/\/$/, '');
const latestVersion = changelog.releases[0]?.version ?? catalog.rulesetVersion;

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
            description: `Static auditor for shadcn-vue and shadcn-nuxt applications. ${catalog.ruleCount} deterministic rules with file and line evidence on every finding.`,
            url: siteUrl,
            downloadUrl: 'https://www.npmjs.com/package/shadscan-vue',
            softwareVersion: latestVersion,
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
