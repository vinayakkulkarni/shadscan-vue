<script setup lang="ts">
const props = defineProps<{ command: string }>();

const copied = ref(false);
let timer: ReturnType<typeof setTimeout> | undefined;

const copy = async () => {
  try {
    await navigator.clipboard.writeText(props.command);
    copied.value = true;
    clearTimeout(timer);
    timer = setTimeout(() => (copied.value = false), 2000);
  } catch {
    copied.value = false;
  }
};

onBeforeUnmount(() => clearTimeout(timer));
</script>

<template>
  <div class="rule-all flex items-stretch">
    <code class="flex-1 px-4 py-4 text-sm font-medium md:px-6 md:text-base">
      <span aria-hidden="true" class="mr-3 select-none">$</span>{{ command }}
    </code>
    <button
      type="button"
      class="invert-hover rule-l flex items-center gap-2 px-4 py-4 text-xs font-bold tracking-[0.18em] md:px-6"
      @click="copy"
    >
      <Icon :name="copied ? 'lucide:check' : 'lucide:copy'" aria-hidden="true" class="size-4" />
      {{ copied ? 'COPIED' : 'COPY' }}
    </button>
  </div>
</template>
