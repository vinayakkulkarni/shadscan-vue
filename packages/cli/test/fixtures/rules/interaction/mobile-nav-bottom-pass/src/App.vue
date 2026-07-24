<script setup lang="ts">
const title = 'bottom nav app';
</script>

<template>
  <div>
    <nav class="hidden md:flex">
      <a href="/">Home</a>
    </nav>
    <nav class="fixed bottom-0 inset-x-0 flex md:hidden">
      <a href="/">Home</a>
      <a href="/search">Search</a>
      <a href="/profile">Profile</a>
    </nav>
  </div>
</template>
