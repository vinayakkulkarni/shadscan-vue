<script setup lang="ts">
useSeoMeta({
  title: "Settings",
  description: "Nuxt QA settings view with mixed form patterns.",
});

const nickname = ref("");
const email = ref("");
const plan = ref("free");
</script>

<template>
  <section class="space-y-8">
    <h1 class="text-2xl font-bold tracking-tight">Settings</h1>

    <form class="space-y-4" @submit.prevent>
      <!-- QA:violation:forms-have-labels -->
      <div class="space-y-1">
        <Input v-model="nickname" placeholder="Nickname (no label)" />
      </div>

      <!-- QA:satisfies:forms-have-labels + personal-data-autocomplete-present -->
      <div class="space-y-1">
        <Label for="email">Email</Label>
        <Input id="email" v-model="email" type="email" autocomplete="email" />
      </div>

      <!-- QA:satisfies:grouped-controls-have-legend -->
      <fieldset class="space-y-2 rounded-md border p-3">
        <legend class="px-1 text-sm font-medium">Plan</legend>
        <label class="flex items-center gap-2 text-sm">
          <input v-model="plan" type="radio" name="plan" value="free" />
          Free
        </label>
        <label class="flex items-center gap-2 text-sm">
          <input v-model="plan" type="radio" name="plan" value="pro" />
          Pro
        </label>
      </fieldset>

      <!-- QA:violation:form-buttons-have-explicit-type -->
      <button class="rounded-md border px-3 py-1.5 text-sm">Reset</button>
      <Button type="submit">Save</Button>
    </form>
  </section>
</template>
