<script setup lang="ts">
const onSubmit = async () => {
  await fetch('/api/save', { method: 'POST' });
};
</script>
<template>
  <form @submit.prevent="onSubmit">
    <button type="submit">Save</button>
  </form>
</template>
