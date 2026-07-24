<script setup lang="ts">
const save = () => console.log('save');
</script>
<template>
  <form @submit.prevent="save">
    <input aria-label="Email" />
    <button type="submit">Save</button>
  </form>
</template>
