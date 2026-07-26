<script setup lang="ts">
import changelog from '~/data/changelog.json';

usePageSeo({
  title: 'Changelog',
  description: 'Release history for shadscan-vue.',
  ogTitle: 'shadscan-vue — changelog',
  ogDescription: 'Release history for shadscan-vue.',
  ogSlug: 'changelog',
});

const releases = changelog.releases;
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
          <div v-for="group in release.groups" :key="group.heading" class="mt-8 first:mt-0">
            <h2 class="text-xs font-bold uppercase tracking-[0.25em]">{{ group.heading }}</h2>
            <ul class="mt-4 space-y-2 text-sm leading-relaxed">
              <li v-for="item in group.items" :key="item.summary" class="rule-l pl-4">
                <span v-if="item.scope" class="font-bold">{{ item.scope }}:</span>
                {{ item.summary }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
