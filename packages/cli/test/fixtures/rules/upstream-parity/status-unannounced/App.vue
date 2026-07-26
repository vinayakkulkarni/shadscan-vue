<script setup lang="ts">
  const pending = ref(false);
</script>
<template><span>{{ pending ? "Saving…" : "Save" }}</span></template>
