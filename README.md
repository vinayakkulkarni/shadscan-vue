# shadscan-vue

> Find the UI fundamentals your shadcn-vue app forgot.

Deterministic checks. Evidence. Agent-ready fixes. Static audit — no AI required.

`shadscan-vue` audits **shadcn-vue** (Vite/Vue 3) and **shadcn-nuxt** (Nuxt 4) apps
for missing UI fundamentals: theme wiring, command menus, route states, accessible
controls, form feedback, metadata, and mobile behavior. It scores your app 0–100
with evidence behind every finding, and never starts your app, edits files, calls
an AI model, or uploads source.

```bash
npx shadscan-vue
```

## Credits

shadscan-vue is a Vue/Nuxt port of [shadscan](https://github.com/TheOrcDev/shadscan)
by [TheOrcDev](https://github.com/TheOrcDev), built with the original author's
permission. The rule taxonomy, scoring model, and product concept originate from
shadscan. See [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md).

## License

[MIT](./LICENSE.md) © Vinayak Kulkarni. Portions derived from shadscan, MIT © 2026 TheOrcDev.
