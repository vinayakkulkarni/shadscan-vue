<script setup lang="ts">
useHead({
  script: [
    {
      innerHTML:
        "const t = localStorage.getItem('theme'); if (t === 'dark') document.documentElement.classList.add('dark');",
      tagPosition: 'head',
    },
  ],
});
</script>

<template>
  <div>
    <NuxtPage />
  </div>
</template>
