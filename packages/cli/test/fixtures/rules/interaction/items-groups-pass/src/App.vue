<script setup lang="ts">
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
</script>

<template>
  <Select>
    <SelectTrigger>
      <SelectValue placeholder="Pick" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="a">A</SelectItem>
      <SelectItem value="b">B</SelectItem>
    </SelectContent>
  </Select>
</template>
