<script setup lang="ts">
  const tabs: { label: string }[] = [{ label: "Aurora" }, { label: "Plasma" }];
</script>

<template>
  <div>
    <button v-for="tab in tabs" :key="tab.label">{{ tab.label }}</button>
  </div>
</template>
