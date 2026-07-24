<script setup lang="ts">
import { ref } from 'vue';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';

const open = ref(false);
</script>

<template>
  <CommandDialog v-model:open="open">
    <CommandInput placeholder="Type a command..." />
    <CommandList>
      <CommandEmpty>No results found.</CommandEmpty>
      <CommandGroup heading="Suggestions">
        <CommandItem value="home">Home</CommandItem>
        <CommandItem value="docs">Docs</CommandItem>
      </CommandGroup>
    </CommandList>
  </CommandDialog>
</template>
