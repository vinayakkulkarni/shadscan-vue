<script setup lang="ts">
const open = ref(false);

const isTypingTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
};

const onKeydown = (event: KeyboardEvent) => {
  if (isTypingTarget(event.target)) {
    return;
  }
  if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
    event.preventDefault();
    open.value = !open.value;
  }
};

onMounted(() => window.addEventListener("keydown", onKeydown));
onBeforeUnmount(() => window.removeEventListener("keydown", onKeydown));
</script>

<template>
  <CommandDialog v-model:open="open">
    <CommandInput placeholder="Type a command or search..." />
    <CommandList>
      <CommandEmpty>No results found.</CommandEmpty>
      <CommandGroup heading="Navigation">
        <CommandItem value="home" @select="navigateTo('/')">Home</CommandItem>
        <CommandItem value="settings" @select="navigateTo('/settings')">Settings</CommandItem>
      </CommandGroup>
    </CommandList>
  </CommandDialog>
</template>
