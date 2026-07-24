<script setup lang="ts">
const links = [
  { to: '/rules', label: 'RULES' },
  { to: '/docs', label: 'DOCS' },
  { to: '/changelog', label: 'CHANGELOG' },
  { to: '/credits', label: 'CREDITS' },
];
</script>

<template>
  <header class="rule-b">
    <nav aria-label="Primary" class="mx-auto flex max-w-[1600px] items-stretch justify-between">
      <NuxtLink
        to="/"
        class="invert-hover rule-r px-5 py-4 text-sm font-bold tracking-[0.2em] md:px-8"
      >
        SHADSCAN&#8203;-VUE
      </NuxtLink>

      <ul class="flex items-stretch">
        <li v-for="link in links" :key="link.to" class="hidden sm:block">
          <NuxtLink
            :to="link.to"
            class="invert-hover rule-l flex h-full items-center px-4 py-4 text-xs font-medium tracking-[0.18em] md:px-6"
          >
            {{ link.label }}
          </NuxtLink>
        </li>
        <li>
          <a
            href="https://github.com/vinayakkulkarni/shadscan-vue"
            class="invert-hover rule-l flex h-full items-center gap-2 px-4 py-4 text-xs font-medium tracking-[0.18em] md:px-6"
          >
            <Icon name="lucide:github" aria-hidden="true" class="size-4" />
            GITHUB
          </a>
        </li>
      </ul>
    </nav>
  </header>
</template>
