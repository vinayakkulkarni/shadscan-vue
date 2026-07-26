<script setup lang="ts">
  const pending = ref(false);
</script>
<template><span role="status">{{ pending ? "Saving…" : "Save" }}</span></template>
