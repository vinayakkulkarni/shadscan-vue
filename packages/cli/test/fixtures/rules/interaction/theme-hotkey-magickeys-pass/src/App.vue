<script setup lang="ts">
import { watch } from 'vue';
import { useMagicKeys, useDark, useToggle } from '@vueuse/core';

const isDark = useDark();
const toggleDark = useToggle(isDark);
const keys = useMagicKeys();
const dKey = keys['d'];

watch(dKey, (pressed) => {
  const active = document.activeElement as HTMLElement | null;
  if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) {
    return;
  }
  if (pressed) {
    toggleDark();
  }
});
</script>

<template>
  <main>
    <button @click="toggleDark()">Toggle theme</button>
  </main>
</template>
