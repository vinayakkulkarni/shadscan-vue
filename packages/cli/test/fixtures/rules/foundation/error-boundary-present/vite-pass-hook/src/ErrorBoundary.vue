<script setup lang="ts">
import { onErrorCaptured, ref } from 'vue';

const failed = ref(false);
onErrorCaptured(() => {
  failed.value = true;
  return false;
});
</script>

<template>
  <slot v-if="!failed" />
  <p v-else>Something went wrong.</p>
</template>
