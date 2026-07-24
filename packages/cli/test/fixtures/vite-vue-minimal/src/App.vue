<script setup lang="ts">
const title = 'hello';
</script>

<template>
  <main>
    <h1>{{ title }}</h1>
    <img src="/logo.png" />
    <img src="/ok.png" alt="A described logo" />
    <img src="/bound.png" :alt="title" />
  </main>
</template>
