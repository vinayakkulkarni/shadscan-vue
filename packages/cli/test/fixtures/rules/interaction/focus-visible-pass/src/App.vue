<script setup lang="ts">
const title = 'focus ok';
</script>

<template>
  <main>
    <button class="outline-none focus-visible:ring-2 focus-visible:ring-ring">
      {{ title }}
    </button>
  </main>
</template>
