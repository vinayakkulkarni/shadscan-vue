<script setup lang="ts">
usePageSeo({
  title: 'Docs',
  description:
    'Install shadscan-vue, run it locally or in CI, gate a pipeline with --fail-under, and hand findings to an agent.',
  ogTitle: 'shadscan-vue — docs',
  ogDescription: 'Install, run, gate CI, and hand findings to an agent.',
  ogSlug: 'docs',
});

const commands = [
  { command: 'shadscan-vue [path]', copy: 'Audit a project. Defaults to the current directory.' },
  { command: 'shadscan-vue --json', copy: 'Machine-readable report, schema version 1.' },
  { command: 'shadscan-vue --prompt', copy: 'Paste-ready remediation prompt for an agent.' },
  { command: 'shadscan-vue --category forms', copy: 'Run a single category.' },
  { command: 'shadscan-vue --fail-under 70', copy: 'Exit 1 below a threshold.' },
  { command: 'shadscan-vue rules', copy: 'Print the rule catalog as markdown or JSON.' },
  { command: 'shadscan-vue setup --pre-commit', copy: 'Install a git pre-commit hook.' },
];
</script>

<template>
  <div>
    <section class="rule-b px-5 py-12 md:px-8 md:py-16">
      <p class="text-xs font-bold tracking-[0.25em]">DOCUMENTATION</p>
      <h1
        class="mt-6 text-[clamp(2.5rem,8vw,7rem)] font-bold uppercase leading-[0.88] tracking-[-0.03em]"
      >
        Run it
      </h1>
    </section>

    <section class="rule-b grid lg:grid-cols-[1fr_1fr]">
      <div class="lg:rule-r px-5 py-10 md:px-8 md:py-14">
        <h2 class="text-xs font-bold tracking-[0.25em]">INSTALL</h2>
        <div class="mt-6 space-y-4">
          <CopyCommand command="npx shadscan-vue" />
          <CopyCommand command="pnpm dlx shadscan-vue" />
          <CopyCommand command="npm install -D shadscan-vue" />
        </div>
        <p class="mt-6 text-sm leading-relaxed">
          Requires Node 20.19 or newer. No global install is necessary.
        </p>
      </div>

      <div class="px-5 py-10 md:px-8 md:py-14">
        <h2 class="text-xs font-bold tracking-[0.25em]">PRIVACY</h2>
        <ul class="mt-6 space-y-3 text-sm leading-relaxed">
          <li class="rule-all px-4 py-3">Never starts your application.</li>
          <li class="rule-all px-4 py-3">Never writes to your source files.</li>
          <li class="rule-all px-4 py-3">Never calls a model or any network service.</li>
          <li class="rule-all px-4 py-3">Never uploads source. There is no telemetry.</li>
        </ul>
      </div>
    </section>

    <section class="rule-b">
      <div class="rule-b px-5 py-8 md:px-8">
        <h2 class="text-xs font-bold tracking-[0.25em]">COMMANDS</h2>
      </div>
      <ul>
        <li
          v-for="entry in commands"
          :key="entry.command"
          class="rule-b grid gap-2 px-5 py-5 md:grid-cols-[minmax(0,26rem)_1fr] md:gap-8 md:px-8"
        >
          <code class="text-sm font-bold md:text-base">{{ entry.command }}</code>
          <p class="text-sm leading-relaxed">{{ entry.copy }}</p>
        </li>
      </ul>
    </section>

    <section class="rule-b grid lg:grid-cols-2">
      <div class="lg:rule-r min-w-0 px-5 py-10 md:px-8 md:py-14">
        <h2 class="text-xs font-bold tracking-[0.25em]">CONTINUOUS INTEGRATION</h2>
        <div class="rule-all bg-ink text-bg mt-6 overflow-x-auto">
          <pre class="px-5 py-5 text-xs leading-relaxed md:text-sm">
- name: Audit UI fundamentals
  run: npx shadscan-vue --fail-under 70 --no-interactive</pre>
        </div>
        <p class="mt-6 text-sm leading-relaxed">
          Exit codes are 0 when the scan completes within the threshold and 1 otherwise. The
          threshold also fails on an unassessed score or partial source coverage.
        </p>
        <div class="rule-all bg-ink text-bg mt-6 overflow-x-auto">
          <pre class="px-5 py-5 text-xs leading-relaxed md:text-sm">
- uses: vinayakkulkarni/shadscan-vue@v0.2.0
  with:
    fail-under: 70</pre>
        </div>
        <p class="mt-6 text-sm leading-relaxed">
          The action writes the score, the category table, and every failing rule to the job
          summary, then applies the gate last so the summary survives a failing score.
        </p>
      </div>

      <div class="min-w-0 px-5 py-10 md:px-8 md:py-14">
        <h2 class="text-xs font-bold tracking-[0.25em]">AGENT HANDOFF</h2>
        <div class="rule-all bg-ink text-bg mt-6 overflow-x-auto">
          <pre class="px-5 py-5 text-xs leading-relaxed md:text-sm">
npx shadscan-vue --prompt | pbcopy</pre>
        </div>
        <p class="mt-6 text-sm leading-relaxed">
          The prompt embeds the full JSON report inside a delimited block marked as untrusted data
          rather than instructions, so an agent treats findings as input, not commands.
        </p>
      </div>
    </section>
  </div>
</template>
