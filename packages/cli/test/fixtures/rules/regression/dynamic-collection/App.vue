<script setup lang="ts">
  const rows = ref<{ id: string }[]>([]);
  onMounted(async () => { rows.value = await fetchRows(); });
</script>

<template>
  <div>
    <article v-for="row in rows" :key="row.id">{{ row.id }}</article>
  </div>
</template>
