<script setup lang="ts">
import catalog from '~/data/rules.json';

useSeoMeta({
  title: 'Rule catalog',
  description: `All ${catalog.ruleCount} shadscan-vue rules across six weighted categories, with severity, confidence, and point values.`,
  ogTitle: `shadscan-vue — ${catalog.ruleCount} rules`,
  ogDescription: 'Every rule shadscan-vue runs, with severity, confidence, and points.',
  ogImage: '/og.svg',
});

const active = ref<string>('all');

const visible = computed(() =>
  active.value === 'all'
    ? catalog.categories
    : catalog.categories.filter((category) => category.id === active.value),
);
</script>

<template>
  <div>
    <section class="rule-b px-5 py-12 md:px-8 md:py-16">
      <p class="text-xs font-bold tracking-[0.25em]">CATALOG</p>
      <h1
        class="mt-6 text-[clamp(2.5rem,8vw,7rem)] font-bold uppercase leading-[0.88] tracking-[-0.03em]"
      >
        {{ catalog.ruleCount }} rules
      </h1>
      <p class="mt-6 max-w-2xl text-sm leading-relaxed md:text-base">
        Ruleset {{ catalog.rulesetVersion }}. Every rule reports only what it can prove from source.
        A rule that cannot apply returns not applicable and leaves the score untouched.
      </p>
    </section>

    <section class="rule-b">
      <div class="flex flex-wrap">
        <button
          type="button"
          class="invert-hover rule-r rule-b px-5 py-4 text-xs font-bold tracking-[0.18em]"
          :class="active === 'all' ? 'bg-ink text-bg' : ''"
          @click="active = 'all'"
        >
          ALL
        </button>
        <button
          v-for="category in catalog.categories"
          :key="category.id"
          type="button"
          class="invert-hover rule-r rule-b px-5 py-4 text-xs font-bold tracking-[0.18em]"
          :class="active === category.id ? 'bg-ink text-bg' : ''"
          @click="active = category.id"
        >
          {{ category.title.toUpperCase() }}
        </button>
      </div>
    </section>

    <section v-for="category in visible" :key="category.id" class="rule-b">
      <div
        class="rule-b bg-ink text-bg flex flex-wrap items-baseline justify-between gap-4 px-5 py-6 md:px-8"
      >
        <h2 class="text-2xl font-bold uppercase tracking-tight md:text-4xl">
          {{ category.title }}
        </h2>
        <p class="text-xs font-bold tracking-[0.18em]">
          WEIGHT {{ category.weight }} · {{ category.rules.length }} RULES ·
          {{ category.totalPoints }} POINTS
        </p>
      </div>

      <ul>
        <li
          v-for="rule in category.rules"
          :key="rule.id"
          class="rule-b grid gap-3 px-5 py-6 md:grid-cols-[minmax(0,22rem)_1fr] md:gap-8 md:px-8"
        >
          <div>
            <code class="text-base font-bold md:text-lg">{{ rule.id }}</code>
            <p class="mt-2 flex flex-wrap gap-2 text-xs font-bold tracking-[0.14em]">
              <span class="rule-all px-2 py-1">{{ rule.severity.toUpperCase() }}</span>
              <span class="rule-all px-2 py-1">{{ rule.confidence.toUpperCase() }}</span>
              <span class="bg-accent px-2 py-1">{{ rule.points }} PTS</span>
            </p>
          </div>
          <p class="text-sm leading-relaxed">{{ rule.description }}</p>
        </li>
      </ul>
    </section>
  </div>
</template>
