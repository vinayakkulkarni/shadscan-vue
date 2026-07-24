<script setup lang="ts">
import { ref, watch } from 'vue';
import { useMagicKeys } from '@vueuse/core';

const open = ref(false);
const keys = useMagicKeys();
const cmdK = keys['Meta+K'];

watch(cmdK, (pressed) => {
  if (pressed) {
    open.value = !open.value;
  }
});
</script>

<template>
  <main>Command palette open: {{ open }}</main>
</template>
