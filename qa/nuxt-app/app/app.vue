<script setup lang="ts">
useSeoMeta({
  title: "Shadscan QA Nuxt",
  description: "Nuxt QA target app for shadscan-vue with planted violations.",
  ogTitle: "Shadscan QA Nuxt",
  ogDescription: "Nuxt QA target app for shadscan-vue.",
  ogImage: "/og.png",
  twitterCard: "summary_large_image",
});
</script>

<template>
  <div>
    <NuxtLoadingIndicator />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <Toaster />
  </div>
</template>
