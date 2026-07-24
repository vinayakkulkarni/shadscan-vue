<script setup lang="ts">
import { ref } from 'vue';
import { CommandDialog, CommandInput, CommandList } from '@/components/ui/command';

const open = ref(false);
</script>

<template>
  <CommandDialog v-model:open="open">
    <CommandInput placeholder="Type a command..." />
    <CommandList>
      <!-- missing CommandEmpty and CommandItem -->
    </CommandList>
  </CommandDialog>
</template>
