<script setup lang="ts">
import type { NuxtError } from "#app";

defineProps<{ error: NuxtError }>();

const goHome = () => clearError({ redirect: "/" });
</script>

<template>
  <div class="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-4 px-4">
    <h1 class="text-2xl font-bold">
      {{ error.statusCode === 404 ? "Page not found" : "Something broke" }}
    </h1>
    <p class="text-sm text-muted-foreground">{{ error.statusMessage }}</p>
    <div class="flex gap-2">
      <Button type="button" @click="goHome">Back to dashboard</Button>
      <NuxtLink to="/" class="text-sm underline">Go home</NuxtLink>
    </div>
  </div>
</template>
