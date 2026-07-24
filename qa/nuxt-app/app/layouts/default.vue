<script setup lang="ts">
const colorMode = useColorMode();
const toggleTheme = () => {
  colorMode.preference = colorMode.value === "dark" ? "light" : "dark";
};
</script>

<template>
  <div class="min-h-screen bg-background text-foreground">
    <header class="border-b">
      <nav aria-label="Primary" class="mx-auto flex max-w-3xl items-center gap-4 px-4 py-3 md:px-6">
        <NuxtLink to="/" class="text-sm font-semibold">Shadscan QA</NuxtLink>
        <NuxtLink to="/settings" class="text-sm text-muted-foreground">Settings</NuxtLink>
        <Button
          variant="ghost"
          size="icon"
          type="button"
          aria-label="Toggle color theme"
          class="ml-auto"
          @click="toggleTheme"
        >
          <span aria-hidden="true">*</span>
        </Button>
        <Button variant="ghost" size="icon" type="button" class="md:hidden" aria-label="Open menu">
          <span aria-hidden="true">=</span>
        </Button>
      </nav>
    </header>

    <main class="mx-auto max-w-3xl px-4 py-8 md:px-6">
      <slot />
    </main>

    <footer class="border-t">
      <nav aria-label="Footer" class="mx-auto max-w-3xl px-4 py-6 text-xs">
        <NuxtLink to="/">Home</NuxtLink>
      </nav>
    </footer>

    <CommandMenu />
  </div>
</template>
