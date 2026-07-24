<script setup lang="ts">
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
</script>
<template>
  <Dialog>
    <DialogTrigger>Open</DialogTrigger>
    <DialogContent>
      <DialogTitle>Delete project</DialogTitle>
      <p>This cannot be undone.</p>
    </DialogContent>
  </Dialog>
</template>
