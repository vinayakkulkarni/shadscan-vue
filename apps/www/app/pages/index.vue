<script setup lang="ts">
import catalog from '~/data/rules.json';

useSeoMeta({
  title: 'Find the UI fundamentals your shadcn-vue app forgot',
  description:
    'Static auditor for shadcn-vue and shadcn-nuxt apps. 51 deterministic rules, evidence on every finding, agent-ready output. No network, no telemetry.',
  ogTitle: 'shadscan-vue — find the UI fundamentals your shadcn-vue app forgot',
  ogDescription:
    'Static auditor for shadcn-vue and shadcn-nuxt apps. 51 deterministic rules, evidence on every finding.',
  ogImage: '/og.svg',
});

const taxonomy = [
  { term: 'FIXES', copy: 'Provable failures. They cost points.' },
  { term: 'ADVISORIES', copy: 'Lower confidence. They never cost points.' },
  { term: 'PASSES', copy: 'Verified against your source.' },
  { term: 'N/A', copy: 'Excluded from the denominator entirely.' },
];

const steps = [
  {
    n: '01',
    title: 'SCAN',
    copy: 'Parses SFC templates and TypeScript directly. Never starts your app.',
  },
  {
    n: '02',
    title: 'EVIDENCE',
    copy: 'Every finding cites a file and a line. Nothing is asserted without proof.',
  },
  {
    n: '03',
    title: 'HANDOFF',
    copy: 'Emit a prompt an agent can act on, or a JSON report a pipeline can gate.',
  },
];
</script>

<template>
  <div>
    <section class="rule-b grid min-h-[calc(100dvh-3.75rem)] lg:grid-cols-[1.45fr_1fr]">
      <div class="lg:rule-r flex min-w-0 flex-col justify-center px-5 py-12 md:px-8 md:py-16">
        <p class="text-xs font-bold tracking-[0.25em]">STATIC AUDIT · NO AI REQUIRED</p>

        <h1
          class="mt-6 text-[clamp(2.25rem,6.1vw,6.5rem)] font-bold uppercase leading-[0.88] tracking-[-0.04em]"
        >
          Find the<br />
          fundamentals<br />
          <span class="bg-accent mt-2 inline-block px-3 pb-2 leading-[0.88]">you forgot</span>
        </h1>

        <p class="mt-8 max-w-xl text-sm leading-relaxed md:text-base">
          <strong class="font-bold">{{ catalog.ruleCount }} deterministic rules</strong> for
          shadcn-vue and shadcn-nuxt applications. Evidence on every finding. Agent-ready output. It
          never starts your app, edits a file, calls a model, or uploads your source.
        </p>

        <div class="mt-8 max-w-xl">
          <CopyCommand command="npx shadscan-vue" />
        </div>

        <div class="mt-8 flex flex-wrap gap-3">
          <NuxtLink
            to="/rules"
            class="invert-hover rule-all px-6 py-3 text-xs font-bold tracking-[0.18em]"
          >
            BROWSE {{ catalog.ruleCount }} RULES
          </NuxtLink>
          <NuxtLink
            to="/docs"
            class="invert-hover rule-all px-6 py-3 text-xs font-bold tracking-[0.18em]"
          >
            READ THE DOCS
          </NuxtLink>
        </div>
      </div>

      <div class="flex min-w-0 items-center px-5 py-12 md:px-8">
        <ScanDemo />
      </div>
    </section>

    <section class="rule-b">
      <div class="grid sm:grid-cols-2 lg:grid-cols-4">
        <div
          v-for="(item, index) in taxonomy"
          :key="item.term"
          class="rule-b px-5 py-8 last:rule-b-0 sm:last:rule-b-0 md:px-8 lg:rule-b-0"
          :class="index < taxonomy.length - 1 ? 'lg:rule-r' : ''"
        >
          <p class="text-2xl font-bold tracking-tight md:text-3xl">{{ item.term }}</p>
          <p class="mt-3 text-sm leading-relaxed">{{ item.copy }}</p>
        </div>
      </div>
    </section>

    <section class="rule-b">
      <div class="px-5 py-12 md:px-8 md:py-16">
        <h2 class="text-xs font-bold tracking-[0.25em]">WHAT IT CHECKS</h2>
      </div>
      <div class="grid md:grid-cols-2 lg:grid-cols-3">
        <article
          v-for="category in catalog.categories"
          :key="category.id"
          class="rule-t px-5 py-8 md:px-8 lg:odd:rule-r"
        >
          <div class="flex items-baseline justify-between gap-4">
            <h3 class="text-xl font-bold uppercase tracking-tight md:text-2xl">
              {{ category.title }}
            </h3>
            <span class="bg-ink text-bg px-2 py-1 text-xs font-bold">{{ category.weight }}</span>
          </div>
          <p class="mt-3 text-sm">
            {{ category.rules.length }} rules · {{ category.totalPoints }} points
          </p>
          <ul class="mt-4 space-y-1 text-sm">
            <li v-for="rule in category.rules.slice(0, 3)" :key="rule.id">
              <code>{{ rule.id }}</code>
            </li>
          </ul>
        </article>
      </div>
    </section>

    <section class="rule-b bg-ink text-bg">
      <div class="grid md:grid-cols-3">
        <div
          v-for="(step, index) in steps"
          :key="step.n"
          class="px-5 py-10 md:px-8 md:py-14"
          :class="index < steps.length - 1 ? 'md:border-r-3 md:border-bg' : ''"
        >
          <p class="text-accent text-6xl font-bold leading-none md:text-8xl">{{ step.n }}</p>
          <h3 class="mt-6 text-lg font-bold tracking-[0.12em]">{{ step.title }}</h3>
          <p class="mt-3 text-sm leading-relaxed">{{ step.copy }}</p>
        </div>
      </div>
    </section>

    <section class="rule-b">
      <div class="grid lg:grid-cols-[1fr_1.2fr]">
        <div class="lg:rule-r min-w-0 px-5 py-12 md:px-8 md:py-16">
          <h2 class="text-xs font-bold tracking-[0.25em]">SUPPORTED</h2>
          <ul class="mt-6 space-y-4">
            <li class="rule-all px-5 py-4">
              <p class="text-lg font-bold">shadcn-vue</p>
              <p class="mt-1 text-sm">Vue 3 + Vite, explicit imports</p>
            </li>
            <li class="rule-all px-5 py-4">
              <p class="text-lg font-bold">shadcn-nuxt</p>
              <p class="mt-1 text-sm">Nuxt 4, auto-imported components</p>
            </li>
            <li class="rule-all px-5 py-4">
              <p class="text-lg font-bold">reka-ui</p>
              <p class="mt-1 text-sm">Primitive provenance is understood</p>
            </li>
          </ul>
        </div>

        <div class="min-w-0 px-5 py-12 md:px-8 md:py-16">
          <h2 class="text-xs font-bold tracking-[0.25em]">GATE YOUR PIPELINE</h2>
          <div class="rule-all bg-ink text-bg mt-6 overflow-x-auto">
            <pre class="px-5 py-5 text-xs leading-relaxed md:text-sm">
- run: npx shadscan-vue --fail-under 70</pre>
          </div>
          <p class="mt-5 max-w-lg text-sm leading-relaxed">
            The threshold also fails when the score is unassessed or coverage was partial, so a
            silently-skipped scan can never pass a gate.
          </p>
        </div>
      </div>
    </section>

    <section class="bg-accent rule-b">
      <div class="px-5 py-12 md:px-8 md:py-16">
        <p class="text-xs font-bold tracking-[0.25em]">CREDIT WHERE DUE</p>
        <p class="mt-6 max-w-4xl text-2xl font-bold leading-tight tracking-tight md:text-4xl">
          A Vue and Nuxt port of shadscan by TheOrcDev, built with the original author's permission.
        </p>
        <div class="mt-8 flex flex-wrap gap-3">
          <a
            href="https://github.com/TheOrcDev/shadscan"
            class="invert-hover rule-all px-6 py-3 text-xs font-bold tracking-[0.18em]"
          >
            ORIGINAL PROJECT
          </a>
          <NuxtLink
            to="/credits"
            class="invert-hover rule-all px-6 py-3 text-xs font-bold tracking-[0.18em]"
          >
            FULL ATTRIBUTION
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>
