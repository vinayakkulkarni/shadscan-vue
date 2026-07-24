<script setup lang="ts">
import { Select, SelectItem, SelectTrigger } from '@/components/ui/select';
</script>

<template>
  <Select>
    <SelectTrigger>Pick</SelectTrigger>
    <div class="wrapper">
      <SelectItem value="a">A</SelectItem>
    </div>
  </Select>
</template>
