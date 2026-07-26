# shadscan-vue

> Find the UI fundamentals your shadcn-vue app forgot.

Deterministic checks. Evidence. Agent-ready fixes. Static audit — no AI required.

**[shadscan-vue.geoql.in](https://shadscan-vue.geoql.in)** — rule catalog, docs, and changelog.

`shadscan-vue` audits **shadcn-vue** (Vue 3 + Vite) and **shadcn-nuxt** (Nuxt 4)
applications for the fundamentals that are easy to skip and expensive to miss:
theme wiring, command menus, route and error states, accessible controls, form
feedback, metadata, and mobile behavior.

```bash
npx shadscan-vue
```

It never starts your app, never edits files, never calls a model, and never
uploads your source. Every finding cites a file and a line.

## What you get

```
shadscan-vue v0.1.0
my-app · nuxt · pnpm

Score 66/100 · Grade D

Foundation             ████████████████░░░░ 84
Interaction            ██████████░░░░░░░░░░ 52
States                 ████████████████░░░░ 84
Accessibility          ████████████░░░░░░░░ 61
Forms and Data Entry   ███░░░░░░░░░░░░░░░░░ 18
Production Polish      ████████████████░░░░ 78

Findings

  FAIL images-have-alt (accessibility, error)
    <img> is missing alternative text.
      app/pages/index.vue:23
      fix: Add an alt attribute describing the image, or bind :alt to dynamic content.
```

## Scoring

52 rules across six weighted categories:

| Category             | Weight |
| -------------------- | -----: |
| Foundation           |     20 |
| Interaction          |     20 |
| States               |     20 |
| Accessibility        |     20 |
| Forms and Data Entry |     10 |
| Production Polish    |     10 |

Findings fall into four buckets. **Fixes** are provable failures that cost
points. **Advisories** are lower-confidence observations that never subtract
points. **Passes** are verified. **Not applicable** rules leave the score
untouched — a project without forms is not penalised for form rules.

Grades: A ≥ 90, B ≥ 80, C ≥ 70, D ≥ 60, otherwise F.

## Usage

```bash
shadscan-vue [path]                      # audit a project (defaults to .)
shadscan-vue --json                      # machine-readable report
shadscan-vue --prompt                    # paste-ready prompt for an AI agent
shadscan-vue --category accessibility    # run one category
shadscan-vue --fail-under 70             # exit 1 below a threshold
shadscan-vue rules                       # print the rule catalog
shadscan-vue setup --pre-commit          # install a git pre-commit hook
```

Exit codes are `0` (completed) and `1` (threshold not met, or an error).

### Continuous integration

```yaml
- run: npx shadscan-vue --fail-under 70 --no-interactive
```

`--fail-under` also fails when the score is unassessed or when source coverage
was partial, so a silently-skipped scan cannot pass a gate.

There is also a composite action, which writes the score and every failing
rule to the job summary:

```yaml
- uses: vinayakkulkarni/shadscan-vue@v0.2.0
  with:
    fail-under: 70
```

It takes `path`, `version`, `fail-under`, `category`, and `summary`, and
exposes `score`, `grade`, and `findings-count` as outputs. See the
[repository readme](https://github.com/vinayakkulkarni/shadscan-vue#github-action).

### Agent handoff

`--prompt` emits a remediation brief with the machine-readable report embedded
in a delimited block, marked as untrusted data rather than instructions.

## Supported projects

| Adapter       | Detected by                   |
| ------------- | ----------------------------- |
| `nuxt`        | a `nuxt` dependency           |
| `vite-vue`    | `vue` and `vite` dependencies |
| `generic-vue` | a `vue` dependency            |

shadcn components are recognised through `components.json` aliases, through the
`components/ui` convention, and through `shadcn-nuxt` auto-imports.

## Credits

shadscan-vue is a Vue and Nuxt port of [shadscan](https://github.com/TheOrcDev/shadscan)
by [TheOrcDev](https://github.com/TheOrcDev), built with the original author's
permission. The rule taxonomy, scoring model, and product concept originate
there. See [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md).

## License

[MIT](./LICENSE.md) © Vinayak Kulkarni. Portions derived from shadscan, MIT © 2026 TheOrcDev.
