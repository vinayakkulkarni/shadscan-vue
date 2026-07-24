<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

const open = ref(false);
const router = useRouter();

// QA:satisfies:command-menu-has-shortcut
// Global Ctrl/Cmd+K handler with preventDefault + typing guard.
function onKeydown(e: KeyboardEvent) {
  if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
    const target = e.target as HTMLElement | null;
    const tag = target?.tagName?.toLowerCase();
    // Typing guard: ignore the shortcut while typing in a field.
    if (tag === "input" || tag === "textarea" || target?.isContentEditable === true) {
      return;
    }
    e.preventDefault();
    open.value = !open.value;
  }
}

function go(path: string) {
  open.value = false;
  void router.push(path);
}

onMounted(() => document.addEventListener("keydown", onKeydown));
onUnmounted(() => document.removeEventListener("keydown", onKeydown));
</script>

<template>
  <CommandDialog v-model:open="open">
    <CommandInput placeholder="Type a command or search…" />
    <CommandList>
      <CommandEmpty>No results found.</CommandEmpty>
      <CommandGroup heading="Navigation">
        <CommandItem value="home" @select="go('/')">Home</CommandItem>
        <CommandItem value="settings" @select="go('/settings')"> Settings </CommandItem>
      </CommandGroup>
    </CommandList>
  </CommandDialog>
</template>
