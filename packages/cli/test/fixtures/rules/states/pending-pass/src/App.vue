<script setup lang="ts">
const pending = ref(false);
const onSubmit = async () => {
  pending.value = true;
  await fetch('/api/save', { method: 'POST' });
  pending.value = false;
};
</script>
<template>
  <form @submit.prevent="onSubmit">
    <button type="submit" :disabled="pending">Save</button>
  </form>
</template>
