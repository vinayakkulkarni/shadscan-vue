<script setup lang="ts">
const items = ref<string[]>([]);
</script>
<template>
  <div>
    <ul v-if="items.length > 0">
      <li v-for="item in items" :key="item">{{ item }}</li>
    </ul>
    <p v-else>No projects yet.</p>
  </div>
</template>
