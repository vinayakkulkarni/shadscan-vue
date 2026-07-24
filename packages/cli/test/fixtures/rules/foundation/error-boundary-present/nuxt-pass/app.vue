<template>
  <div>
    <NuxtErrorBoundary>
      <NuxtPage />
      <template #error="{ error }">
        <p>{{ error }}</p>
      </template>
    </NuxtErrorBoundary>
  </div>
</template>
