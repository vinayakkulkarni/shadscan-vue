<script setup lang="ts">
import changelog from '~/data/changelog.json';

const version = changelog.releases[0]?.version ?? '0.0.0';

const categories = [
  { label: 'FOUNDATION', score: 84 },
  { label: 'INTERACTION', score: 52 },
  { label: 'STATES', score: 84 },
  { label: 'ACCESSIBILITY', score: 61 },
  { label: 'FORMS', score: 18 },
  { label: 'POLISH', score: 78 },
];

const bar = (score: number) => {
  const filled = Math.round((score / 100) * 20);
  return '█'.repeat(filled) + '░'.repeat(20 - filled);
};
</script>

<template>
  <div class="rule-all bg-ink text-bg w-full min-w-0 overflow-x-auto">
    <pre
      class="px-5 py-6 text-xs leading-relaxed md:px-8 md:text-sm"
    ><span class="font-bold">shadscan-vue v{{ version }}</span>
my-app · nuxt · pnpm

<span class="text-accent font-bold">Score 66/100 · Grade D</span>

<span v-for="category in categories" :key="category.label">{{ category.label.padEnd(15) }}{{ bar(category.score) }} {{ category.score }}
</span>
<span class="font-bold">Findings</span>

  <span class="text-accent-2 font-bold">FAIL</span> images-have-alt (accessibility, error)
    &lt;img&gt; is missing alternative text.
      app/pages/index.vue:23
      fix: Add an alt attribute describing the image.</pre>
  </div>
</template>
