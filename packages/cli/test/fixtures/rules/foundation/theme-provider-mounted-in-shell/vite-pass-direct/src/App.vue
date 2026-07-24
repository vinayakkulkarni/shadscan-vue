<script setup lang="ts">
import { useColorMode } from '@vueuse/core';

const mode = useColorMode();
</script>

<template>
  <main>{{ mode }}</main>
</template>
