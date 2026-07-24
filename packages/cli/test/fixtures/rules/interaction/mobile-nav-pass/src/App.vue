<script setup lang="ts">
import { ref } from 'vue';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const open = ref(false);
</script>

<template>
  <div>
    <nav class="hidden md:flex">
      <a href="/">Home</a>
      <a href="/docs">Docs</a>
    </nav>
    <Sheet v-model:open="open">
      <SheetTrigger class="md:hidden">Menu</SheetTrigger>
      <SheetContent>
        <a href="/">Home</a>
        <a href="/docs">Docs</a>
      </SheetContent>
    </Sheet>
  </div>
</template>
