# shadscan-vue

> Find the UI fundamentals your shadcn-vue app forgot.

[![npm](https://img.shields.io/npm/v/shadscan-vue?color=111)](https://www.npmjs.com/package/shadscan-vue)
[![CI](https://github.com/vinayakkulkarni/shadscan-vue/actions/workflows/pipeline.yml/badge.svg)](https://github.com/vinayakkulkarni/shadscan-vue/actions/workflows/pipeline.yml)
[![license](https://img.shields.io/badge/license-MIT-111)](./LICENSE.md)

Deterministic checks. Evidence. Agent-ready fixes. Static audit — no AI required.

`shadscan-vue` audits **shadcn-vue** (Vue 3 + Vite) and **shadcn-nuxt** (Nuxt 4)
applications for the fundamentals that are easy to skip and expensive to miss:
theme wiring, command menus, route and error states, accessible controls, form
feedback, metadata, and mobile behavior.

```bash
npx shadscan-vue
```

It never starts your app, never edits files, never calls a model, and never
uploads your source. Every finding cites a file and a line.

## Why this exists

shadcn gives you excellent components. It does not give you an application.
The gap between "the components render" and "the product is finished" is full
of things nobody remembers until a user finds them: the dialog with no
accessible name, the form field with no label, the list with no empty state,
the icon button that screen readers announce as nothing at all.

shadscan-vue finds that gap and cites it, so it can be closed by a person or
handed to an agent.

## What it checks

52 rules across six weighted categories:

| Category             | Weight | Examples                                                            |
| -------------------- | -----: | ------------------------------------------------------------------- |
| Foundation           |     20 | theme provider, metadata, error boundary, not-found route           |
| Interaction          |     20 | command menu, safe global hotkeys, mobile navigation, focus rings   |
| States               |     20 | empty states, loading boundaries, error recovery, pending actions   |
| Accessibility        |     20 | image alt text, control names, heading outline, semantic controls   |
| Forms and Data Entry |     10 | labels, validation wiring, error association, autocomplete          |
| Production Polish    |     10 | leftover starter copy, social previews, reduced motion, target size |

The full catalog with every rule, its severity, and its point value lives in
[docs/RULES.md](./docs/RULES.md), generated from the live registry.

## Scoring

Findings fall into four buckets:

- **Fixes** — provable failures that cost points.
- **Advisories** — lower-confidence observations that never subtract points.
- **Passes** — verified.
- **Not applicable** — excluded from the denominator entirely, so a project
  without forms is never penalised for form rules.

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

In CI:

```yaml
- run: npx shadscan-vue --fail-under 70 --no-interactive
```

`--fail-under` also fails when the score is unassessed or when source coverage
was partial, so a silently-skipped scan cannot pass a gate.

## Repository layout

| Path             | Purpose                                          |
| ---------------- | ------------------------------------------------ |
| `packages/cli`   | the published `shadscan-vue` package             |
| `qa/vite-app`    | a real shadcn-vue app used as a scan target      |
| `qa/nuxt-app`    | a real shadcn-nuxt app used as a scan target     |
| `qa/EXPECTED.md` | the scan oracle asserted by the end-to-end suite |
| `docs/RULES.md`  | the generated rule catalog                       |

## Development

```bash
pnpm install
pnpm build
pnpm test                 # unit, rule, regression, and end-to-end suites
pnpm run qa:scan          # scan both QA apps with the built CLI
pnpm run qa:expected      # regenerate the scan oracle
pnpm run docs:rules       # regenerate the rule catalog
node scripts/smoke-tarball.ts   # pack, install, and exercise a real install
```

Rules are tested against fixtures and then against the two real applications in
`qa/`. That second layer exists because it works: scanning real shadcn code
caught four false positives that fixtures never would have.

## Credits

shadscan-vue is a Vue and Nuxt port of [shadscan](https://github.com/TheOrcDev/shadscan)
by [TheOrcDev](https://github.com/TheOrcDev), built with the original author's
permission. The rule taxonomy, scoring model, and product concept originate
there; the Vue SFC engine, Nuxt adapters, and reka-ui awareness are new work.
See [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md).

## License

[MIT](./LICENSE.md) © Vinayak Kulkarni. Portions derived from shadscan, MIT © 2026 TheOrcDev.
