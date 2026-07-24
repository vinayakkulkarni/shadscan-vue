<script setup lang="ts">
import { Button } from '@/components/ui/button';

function remove() {
  // deletes immediately, no confirmation
}
</script>

<template>
  <main>
    <Button variant="destructive" @click="remove">Delete</Button>
  </main>
</template>
