<script setup lang="ts">
  defineProps<{ to: string }>();
</script>

<template>
  <a :href="to">
    <span class="h-4 w-4 rounded-full bg-current" />
  </a>
</template>
