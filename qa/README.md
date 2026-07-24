# QA target apps

Two real applications used as end-to-end scan targets for `shadscan-vue`.
They are **not** part of the pnpm workspace: each app carries its own
`pnpm-workspace.yaml` and lockfile so it installs and builds standalone,
exactly like a user's project would.

| App        | Stack                                                         |
| ---------- | ------------------------------------------------------------- |
| `vite-app` | Vue 3 + Vite + Tailwind v4 + shadcn-vue (explicit imports)    |
| `nuxt-app` | Nuxt 4 + shadcn-nuxt + Tailwind v4 (auto-imported components) |

Both apps deliberately contain a mix of violations and satisfied checks, each
marked inline:

```vue
<!-- QA:violation:images-have-alt -->
<!-- QA:satisfies:forms-have-labels -->
```

`EXPECTED.md` records the expected scan outcome for every marked case. It is the
oracle the end-to-end suite asserts against, so a rule regression shows up as a
diff against a real application rather than a synthetic fixture.

## Running a scan

```sh
pnpm --filter shadscan-vue build
node packages/cli/bin/shadscan-vue.mjs qa/vite-app
node packages/cli/bin/shadscan-vue.mjs qa/nuxt-app --json
```

## Third-party content

Files under `*/components/ui/` are unmodified [shadcn-vue](https://www.shadcn-vue.com)
registry output, added with the shadcn-vue CLI and licensed MIT. They are
vendored here only so the scanner has real component code to analyse; they are
not part of the published `shadscan-vue` package.
