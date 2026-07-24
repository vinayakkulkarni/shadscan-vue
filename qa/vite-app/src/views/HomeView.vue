<script setup lang="ts">
import { ref } from "vue";
import { toast } from "vue-sonner";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// Empty-state demo list (satisfied check: empty-state branch).
const items = ref<string[]>([]);

function handleClickableDiv() {
  toast("Clickable div activated");
}

function deleteEverything() {
  // No confirmation dialog — advisory violation.
  toast("Everything deleted");
}
</script>

<template>
  <section class="space-y-8">
    <div>
      <h1 class="text-2xl font-bold tracking-tight">Home</h1>
      <p class="text-sm text-muted-foreground">
        This view intentionally contains accessibility violations for QA.
      </p>
    </div>

    <!-- QA:violation:images-have-alt (img without alt) -->
    <img src="/favicon.svg" width="48" height="48" />

    <!-- QA:violation:interactive-elements-are-semantic (clickable div, no role/tabindex/keydown) -->
    <div class="cursor-pointer rounded-md border p-3 text-sm" @click="handleClickableDiv">
      Click me (I am a div pretending to be a button)
    </div>

    <!-- QA:violation:icon-buttons-have-labels (icon-only button, no aria-label) -->
    <button type="button" class="rounded-md border p-2">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v6m0 6v6" />
      </svg>
    </button>

    <!-- QA:violation:no-positive-tabindex (tabindex="3") -->
    <a href="#footer" tabindex="3" class="text-sm underline"> Skip to footer </a>

    <!-- QA:violation:focus-visible-not-suppressed (outline-none with no replacement) -->
    <a href="#" class="text-sm underline outline-none"> Link with suppressed focus ring </a>

    <!-- QA:violation:iframes-have-title (iframe without title) -->
    <iframe src="about:blank" width="100%" height="120" class="rounded-md border"></iframe>

    <!-- QA:violation:dialogs-have-accessible-names (DialogContent with NO DialogTitle) -->
    <Dialog>
      <DialogTrigger as-child>
        <Button variant="outline" type="button">Open nameless dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <p class="text-sm">This dialog has no DialogTitle, so it has no accessible name.</p>
      </DialogContent>
    </Dialog>

    <!-- QA:violation:destructive-actions-confirmed (destructive delete, no confirmation) -->
    <Button variant="destructive" type="button" @click="deleteEverything"> Delete account </Button>

    <!-- QA:satisfies:empty-state (list with empty-state branch) -->
    <div class="rounded-md border p-4">
      <h2 class="mb-2 text-sm font-semibold">Your projects</h2>
      <ul v-if="items.length > 0" class="space-y-1">
        <li v-for="item in items" :key="item" class="text-sm">{{ item }}</li>
      </ul>
      <p v-else class="text-sm text-muted-foreground">
        No projects yet. Create your first project to get started.
      </p>
    </div>

    <div id="footer" class="pt-8 text-xs text-muted-foreground">Footer</div>
  </section>
</template>
