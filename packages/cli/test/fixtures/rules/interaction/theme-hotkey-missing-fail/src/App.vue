<script setup lang="ts">
import { useDark, useToggle } from '@vueuse/core';

const isDark = useDark();
const toggleDark = useToggle(isDark);
</script>

<template>
  <main>
    <button @click="toggleDark()">Toggle theme</button>
  </main>
</template>
