<script setup lang="ts">
import { useForm } from 'vee-validate';
const { handleSubmit } = useForm();
</script>
<template>
  <form @submit="handleSubmit">
    <FormField name="email">
      <FormItem>
        <FormLabel for="email">Email</FormLabel>
        <FormControl><Input id="email" autocomplete="email" /></FormControl>
        <FormMessage />
      </FormItem>
    </FormField>
    <button type="submit">Save</button>
  </form>
</template>
