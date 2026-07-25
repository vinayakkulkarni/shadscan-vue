<script setup lang="ts">
usePageSeo({
  title: 'Credits',
  description:
    'shadscan-vue is a Vue and Nuxt port of shadscan by TheOrcDev, built with the original author permission and under the MIT license.',
  ogTitle: 'shadscan-vue — credits',
  ogDescription: 'A Vue and Nuxt port of shadscan by TheOrcDev, with permission.',
  ogSlug: 'credits',
});

const ported = [
  'The rule taxonomy and category model.',
  'The weighted scoring model and A–F grading.',
  'The four-way finding taxonomy: fixes, advisories, passes, not applicable.',
  'The CLI contract: output formats, threshold gating, agent handoff.',
];

const rebuilt = [
  'A Vue SFC engine over @vue/compiler-sfc template ASTs.',
  'Nuxt and Vite adapters, including shadcn-nuxt auto-import provenance.',
  'reka-ui primitive awareness, so generated components are not audited as app code.',
  'Every rule implementation, written against Vue semantics rather than JSX.',
];
</script>

<template>
  <div>
    <section class="rule-b px-5 py-12 md:px-8 md:py-16">
      <p class="text-xs font-bold tracking-[0.25em]">ATTRIBUTION</p>
      <h1
        class="mt-6 text-[clamp(2.5rem,8vw,7rem)] font-bold uppercase leading-[0.88] tracking-[-0.03em]"
      >
        Credits
      </h1>
    </section>

    <section class="bg-accent rule-b px-5 py-12 md:px-8 md:py-16">
      <p class="max-w-5xl text-2xl font-bold leading-tight tracking-tight md:text-5xl">
        shadscan-vue is a Vue and Nuxt port of shadscan by TheOrcDev, built with the original
        author's permission.
      </p>
      <div class="mt-8 flex flex-wrap gap-3">
        <a
          href="https://github.com/TheOrcDev/shadscan"
          class="invert-hover rule-all px-6 py-3 text-xs font-bold tracking-[0.18em]"
        >
          SHADSCAN ON GITHUB
        </a>
        <a
          href="https://github.com/TheOrcDev"
          class="invert-hover rule-all px-6 py-3 text-xs font-bold tracking-[0.18em]"
        >
          THEORCDEV
        </a>
      </div>
    </section>

    <section class="rule-b grid lg:grid-cols-2">
      <div class="lg:rule-r rule-b lg:rule-b-0 px-5 py-10 md:px-8 md:py-14">
        <h2 class="text-xs font-bold tracking-[0.25em]">PORTED FROM SHADSCAN</h2>
        <ul class="mt-6 space-y-3 text-sm leading-relaxed">
          <li v-for="item in ported" :key="item" class="rule-l pl-4">{{ item }}</li>
        </ul>
      </div>

      <div class="px-5 py-10 md:px-8 md:py-14">
        <h2 class="text-xs font-bold tracking-[0.25em]">REBUILT FOR VUE</h2>
        <ul class="mt-6 space-y-3 text-sm leading-relaxed">
          <li v-for="item in rebuilt" :key="item" class="rule-l pl-4">{{ item }}</li>
        </ul>
      </div>
    </section>

    <section class="rule-b px-5 py-10 md:px-8 md:py-14">
      <h2 class="text-xs font-bold tracking-[0.25em]">LICENSE</h2>
      <p class="mt-6 max-w-3xl text-sm leading-relaxed">
        shadscan-vue is MIT licensed, copyright Vinayak Kulkarni. Portions are derived from
        shadscan, MIT licensed, copyright 2026 TheOrcDev. The upstream notice is reproduced in full
        below and ships inside the published package.
      </p>

      <div class="rule-all bg-ink text-bg mt-8 overflow-x-auto">
        <pre class="px-5 py-6 text-xs leading-relaxed md:px-8">
MIT License

Copyright (c) 2026 TheOrcDev

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.</pre>
      </div>
    </section>
  </div>
</template>
