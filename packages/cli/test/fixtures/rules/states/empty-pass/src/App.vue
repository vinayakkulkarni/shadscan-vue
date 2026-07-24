<script setup lang="ts">
const invoices = ref([]);
</script>
<template>
  <div>
    <p v-if="invoices.length === 0">No invoices yet.</p>
    <ul v-else>
      <li v-for="invoice in invoices" :key="invoice.id">{{ invoice.name }}</li>
    </ul>
  </div>
</template>
