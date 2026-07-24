<script setup lang="ts">
import { useDark, useToggle } from '@vueuse/core';

const isDark = useDark();
const toggleDark = useToggle(isDark);

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'd') {
    toggleDark();
  }
}

window.addEventListener('keydown', onKeydown);
</script>

<template>
  <main>
    <button @click="toggleDark()">Toggle theme</button>
  </main>
</template>
