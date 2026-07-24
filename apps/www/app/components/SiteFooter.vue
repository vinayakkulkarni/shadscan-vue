<template>
  <footer class="rule-t">
    <div class="mx-auto max-w-[1600px]">
      <div class="grid md:grid-cols-[2fr_1fr_1fr]">
        <div class="rule-b md:rule-b-0 md:rule-r px-5 py-8 md:px-8">
          <p class="text-3xl font-bold leading-none tracking-tight md:text-5xl">
            SHIP THE<br />FUNDAMENTALS.
          </p>
          <p class="mt-4 max-w-md text-sm leading-relaxed">
            A static auditor for shadcn-vue and shadcn-nuxt applications. No network. No telemetry.
            No model calls.
          </p>
        </div>

        <nav aria-label="Project" class="rule-b md:rule-b-0 md:rule-r px-5 py-8 md:px-8">
          <p class="text-xs font-bold tracking-[0.2em]">PROJECT</p>
          <ul class="mt-4 space-y-2 text-sm">
            <li><NuxtLink to="/rules" class="underline underline-offset-4">Rules</NuxtLink></li>
            <li><NuxtLink to="/docs" class="underline underline-offset-4">Docs</NuxtLink></li>
            <li>
              <NuxtLink to="/changelog" class="underline underline-offset-4">Changelog</NuxtLink>
            </li>
            <li>
              <NuxtLink to="/credits" class="underline underline-offset-4">Credits</NuxtLink>
            </li>
          </ul>
        </nav>

        <nav aria-label="External" class="px-5 py-8 md:px-8">
          <p class="text-xs font-bold tracking-[0.2em]">ELSEWHERE</p>
          <ul class="mt-4 space-y-2 text-sm">
            <li>
              <a
                href="https://www.npmjs.com/package/shadscan-vue"
                class="underline underline-offset-4"
                >npm</a
              >
            </li>
            <li>
              <a
                href="https://github.com/vinayakkulkarni/shadscan-vue"
                class="underline underline-offset-4"
                >GitHub</a
              >
            </li>
            <li>
              <a href="https://github.com/TheOrcDev/shadscan" class="underline underline-offset-4"
                >shadscan (original)</a
              >
            </li>
          </ul>
        </nav>
      </div>

      <div
        class="rule-t flex flex-col gap-2 px-5 py-5 text-xs md:flex-row md:justify-between md:px-8"
      >
        <p>MIT © Vinayak Kulkarni</p>
        <p>
          Vue port of
          <a href="https://github.com/TheOrcDev/shadscan" class="underline underline-offset-4"
            >shadscan</a
          >
          by TheOrcDev, with permission.
        </p>
      </div>
    </div>
  </footer>
</template>
