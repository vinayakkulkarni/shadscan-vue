<script setup lang="ts">
import { toast } from "vue-sonner";

useSeoMeta({
  title: "Home",
  description: "Nuxt QA home view with planted accessibility violations.",
});

const items = ref<string[]>([]);

const handleClickableDiv = () => toast("Clickable div activated");
const deleteEverything = () => toast("Everything deleted");
</script>

<template>
  <section class="space-y-8">
    <div>
      <h1 class="text-2xl font-bold tracking-tight">Home</h1>
      <h2 class="text-sm text-muted-foreground">QA fixtures below</h2>
    </div>

    <!-- QA:violation:images-have-alt -->
    <img src="/favicon.svg" width="48" height="48" />

    <!-- QA:violation:interactive-elements-are-semantic -->
    <div class="cursor-pointer rounded-md border p-3 text-sm" @click="handleClickableDiv">
      Click me (I am a div pretending to be a button)
    </div>

    <!-- QA:violation:icon-buttons-have-labels -->
    <button type="button" class="rounded-md border p-2">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="3" />
      </svg>
    </button>

    <!-- QA:violation:no-positive-tabindex -->
    <a href="#footer" tabindex="3" class="text-sm underline">Skip to footer</a>

    <!-- QA:violation:focus-visible-not-suppressed -->
    <a href="#" class="text-sm underline outline-none">Link with suppressed focus ring</a>

    <!-- QA:violation:iframes-have-title -->
    <iframe src="about:blank" width="100%" height="120" class="rounded-md border" />

    <!-- QA:violation:dialogs-have-accessible-names -->
    <Dialog>
      <DialogTrigger as-child>
        <Button variant="outline" type="button">Open nameless dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <p class="text-sm">This dialog has no DialogTitle.</p>
      </DialogContent>
    </Dialog>

    <!-- QA:violation:destructive-actions-confirmed -->
    <Button variant="destructive" type="button" @click="deleteEverything">Delete account</Button>

    <!-- QA:satisfies:empty-state-present -->
    <div class="rounded-md border p-4">
      <h2 class="mb-2 text-sm font-semibold">Your projects</h2>
      <ul v-if="items.length > 0" class="space-y-1">
        <li v-for="item in items" :key="item" class="text-sm">{{ item }}</li>
      </ul>
      <p v-else class="text-sm text-muted-foreground">No projects yet.</p>
    </div>

    <div id="footer" class="pt-8 text-xs text-muted-foreground">Footer</div>
  </section>
</template>
