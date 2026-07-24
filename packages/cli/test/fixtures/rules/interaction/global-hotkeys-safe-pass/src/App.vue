<script setup lang="ts">
import { ref } from 'vue';
import { useEventListener } from '@vueuse/core';

const count = ref(0);

useEventListener(window, 'keydown', (e: KeyboardEvent) => {
  if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
    e.preventDefault();
    count.value++;
  }
});
</script>

<template>
  <main>{{ count }}</main>
</template>
