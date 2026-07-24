<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'a') {
    doThing();
  }
}

function doThing() {
  // no typing guard, bare printable single key
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown);
});
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown);
});
</script>

<template>
  <main>bare printable</main>
</template>
