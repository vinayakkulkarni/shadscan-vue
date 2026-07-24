<script setup lang="ts">
import { onMounted, ref } from 'vue';

const theme = ref('light');
onMounted(() => {
  theme.value = localStorage.getItem('theme') ?? 'light';
  document.documentElement.classList.toggle('dark', theme.value === 'dark');
});
</script>

<template>
  <div>
    <NuxtPage />
  </div>
</template>
