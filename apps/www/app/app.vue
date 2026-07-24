<script setup lang="ts">
useSeoMeta({
  titleTemplate: (title) => (title ? `${title} — shadscan-vue` : 'shadscan-vue'),
  ogSiteName: 'shadscan-vue',
  ogType: 'website',
  twitterCard: 'summary_large_image',
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
