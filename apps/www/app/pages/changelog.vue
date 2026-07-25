<script setup lang="ts">
usePageSeo({
  title: 'Changelog',
  description: 'Release history for shadscan-vue.',
  ogTitle: 'shadscan-vue — changelog',
  ogDescription: 'Release history for shadscan-vue.',
  ogSlug: 'changelog',
});

const releases = [
  {
    version: '0.1.0',
    date: '2026-07-25',
    summary: 'Initial release. A Vue and Nuxt port of shadscan, with permission.',
    added: [
      'Static audit engine with nuxt, vite-vue, and generic-vue adapters.',
      '52 rules across six weighted categories.',
      'Vue-native analysis over SFC template ASTs and the TypeScript compiler API.',
      'Human, JSON, and agent-prompt output formats.',
      '--fail-under gating that also fails on unassessed scores and partial coverage.',
      'shadscan-vue rules and shadscan-vue setup --pre-commit.',
    ],
    security: [
      'Read-only by design: no app start, no writes, no model calls, no uploads.',
      'Source collection rejects symlinks and enforces file and byte budgets.',
    ],
  },
];
</script>

<template>
  <div>
    <section class="rule-b px-5 py-12 md:px-8 md:py-16">
      <p class="text-xs font-bold tracking-[0.25em]">RELEASES</p>
      <h1
        class="mt-6 text-[clamp(2.5rem,8vw,7rem)] font-bold uppercase leading-[0.88] tracking-[-0.03em]"
      >
        Changelog
      </h1>
    </section>

    <section v-for="release in releases" :key="release.version" class="rule-b">
      <div class="grid lg:grid-cols-[minmax(0,18rem)_1fr]">
        <div class="lg:rule-r rule-b lg:rule-b-0 px-5 py-8 md:px-8">
          <p class="bg-accent inline-block px-3 py-1 text-3xl font-bold md:text-5xl">
            {{ release.version }}
          </p>
          <p class="mt-4 text-xs font-bold tracking-[0.18em]">{{ release.date }}</p>
        </div>

        <div class="px-5 py-8 md:px-8">
          <p class="max-w-3xl text-lg font-bold leading-tight md:text-2xl">
            {{ release.summary }}
          </p>

          <h2 class="mt-8 text-xs font-bold tracking-[0.25em]">ADDED</h2>
          <ul class="mt-4 space-y-2 text-sm leading-relaxed">
            <li v-for="item in release.added" :key="item" class="rule-l pl-4">{{ item }}</li>
          </ul>

          <h2 class="mt-8 text-xs font-bold tracking-[0.25em]">SECURITY</h2>
          <ul class="mt-4 space-y-2 text-sm leading-relaxed">
            <li v-for="item in release.security" :key="item" class="rule-l pl-4">{{ item }}</li>
          </ul>
        </div>
      </div>
    </section>
  </div>
</template>
