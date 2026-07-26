<script setup lang="ts">
  import { Trash2 } from 'lucide-vue-next';
</script>

<template>
  <Button size="icon" @click="remove">
    <Trash2 class="h-4 w-4" />
  </Button>
</template>
