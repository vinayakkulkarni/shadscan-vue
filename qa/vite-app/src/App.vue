<script setup lang="ts">
import { Menu, Moon, Sun } from "lucide-vue-next";
import { RouterLink, RouterView } from "vue-router";
import { Toaster } from "vue-sonner";
import "vue-sonner/style.css";
import CommandMenu from "@/components/CommandMenu.vue";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/composables/useTheme";

const { mode, toggle } = useTheme();
</script>

<template>
  <div class="min-h-screen bg-background text-foreground">
    <header class="border-b">
      <nav class="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <div class="flex items-center gap-4">
          <!-- QA:satisfies:icon-buttons-have-labels (icon button WITH aria-label) -->
          <Button variant="ghost" size="icon-sm" aria-label="Open navigation menu" type="button">
            <Menu />
          </Button>
          <RouterLink to="/" class="text-sm font-semibold"> Shadscan QA </RouterLink>
          <RouterLink to="/settings" class="text-sm text-muted-foreground"> Settings </RouterLink>
        </div>

        <!-- QA:satisfies:icon-buttons-have-labels + dark-mode toggle -->
        <Button
          variant="outline"
          size="icon-sm"
          type="button"
          :aria-label="mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
          @click="toggle"
        >
          <Moon v-if="mode === 'dark'" />
          <Sun v-else />
        </Button>
      </nav>
    </header>

    <main class="mx-auto max-w-3xl px-4 py-8">
      <RouterView />
    </main>

    <!-- QA:satisfies:toaster-mounted -->
    <Toaster rich-colors position="bottom-right" />

    <!-- QA:satisfies:command-menu-present -->
    <CommandMenu />
  </div>
</template>
