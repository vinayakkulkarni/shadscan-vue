<script setup lang="ts">
const invoices = ref([]);
</script>
<template>
  <ul>
    <li v-for="invoice in invoices" :key="invoice.id">{{ invoice.name }}</li>
  </ul>
</template>
