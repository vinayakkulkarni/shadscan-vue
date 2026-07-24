<template>
  <Suspense>
    <NuxtPage />
    <template #fallback><SkeletonList /></template>
  </Suspense>
</template>
