<script setup lang="ts">
import { ref } from 'vue';

const open = ref(false);

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
    e.preventDefault();
    open.value = !open.value;
  }
}

window.addEventListener('keydown', onKeydown);
</script>

<template>
  <main>Command palette open: {{ open }}</main>
</template>
