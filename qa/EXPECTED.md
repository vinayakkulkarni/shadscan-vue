# Expected scan results

Generated from the built CLI against both QA apps. This file is the oracle for
the end-to-end suite: a diff here means a rule changed behaviour against real
shadcn-vue and shadcn-nuxt code.

Regenerate with `pnpm qa:expected` after an intentional rule change.

## vite-app

- adapter: `vite-vue`
- score: **57/100** (grade F)
- files scanned: 49 (complete coverage)
- ruleset: 0.1.0 · report schema: 1

| Category | Score | Rules |
| --- | ---: | ---: |
| Foundation | 76 | 9 |
| Interaction | 52 | 8 |
| States | 100 | 8 |
| Accessibility | 39 | 11 |
| Forms and Data Entry | 0 | 7 |
| Production Polish | 33 | 9 |

### Failing (19)

| Rule | Category | Evidence |
| --- | --- | --- |
| `not-found-route-present` | foundation | `src/router.ts` |
| `error-boundary-present` | foundation | `src/main.ts` |
| `theme-hotkey-present` | interaction | — |
| `mobile-nav-present` | interaction | `src/App.vue` |
| `focus-visible-not-suppressed` | interaction | `src/views/HomeView.vue:57` |
| `images-have-alt` | accessibility | `src/views/HomeView.vue:30` |
| `icon-buttons-have-labels` | accessibility | `src/views/HomeView.vue:38` |
| `dialogs-have-accessible-names` | accessibility | `src/views/HomeView.vue:67` |
| `no-positive-tabindex` | accessibility | `src/views/HomeView.vue:54` |
| `iframes-have-title` | accessibility | `src/views/HomeView.vue:60` |
| `interactive-elements-are-semantic` | accessibility | `src/views/HomeView.vue:33` |
| `forms-have-labels` | forms | `src/views/SettingsView.vue:48` |
| `form-buttons-have-explicit-type` | forms | `src/views/SettingsView.vue:78` |
| `personal-data-autocomplete-present` | forms | `src/views/SettingsView.vue:48` |
| `metadata-title-description-complete` | production-polish | `src/views/HomeView.vue`, `src/views/SettingsView.vue` |
| `social-preview-present` | production-polish | `index.html` |
| `public-app-seo-files-present` | production-polish | `public/robots.txt`, `public/sitemap.xml` |
| `responsive-shell-present` | production-polish | `src/App.vue` |
| `button-icons-have-data-icon` | production-polish | `src/views/HomeView.vue:39` |

### Advisory (2)

| Rule | Category | Evidence |
| --- | --- | --- |
| `items-belong-to-groups` | interaction | `src/components/ui/select/SelectItem.vue:17` |
| `destructive-actions-confirmed` | interaction | `src/views/HomeView.vue:73` |

### Passing (20)

`shadcn-config-present`, `theme-provider-configured`, `metadata-configured`, `favicon-present`, `components-aliases-resolve`, `theme-provider-mounted-in-shell`, `command-menu-present`, `command-menu-hotkey-present`, `global-hotkeys-are-safe`, `toast-provider-present`, `toast-provider-mounted`, `empty-state-present`, `async-action-pending-state`, `html-lang-present`, `links-have-accessible-names`, `nav-landmarks-have-names`, `heading-structure-sane`, `no-nested-interactive-controls`, `no-starter-copy`, `mobile-overflow-absent`

### Not applicable (11)

`theme-hydration-safe`, `route-loading-boundary-present`, `suspense-fallback-useful`, `error-state-retry-present`, `not-found-recovery-present`, `field-errors-rendered`, `invalid-fields-associated-with-errors`, `grouped-controls-have-legend`, `validation-wired-to-form`, `animations-respect-reduced-motion`, `pointer-target-size-passes`

## nuxt-app

- adapter: `nuxt`
- score: **65/100** (grade D)
- files scanned: 46 (complete coverage)
- ruleset: 0.1.0 · report schema: 1

| Category | Score | Rules |
| --- | ---: | ---: |
| Foundation | 84 | 9 |
| Interaction | 52 | 8 |
| States | 100 | 8 |
| Accessibility | 39 | 11 |
| Forms and Data Entry | 18 | 7 |
| Production Polish | 78 | 9 |

### Failing (15)

| Rule | Category | Evidence |
| --- | --- | --- |
| `shadcn-config-present` | foundation | `components.json` |
| `theme-hotkey-present` | interaction | — |
| `mobile-nav-present` | interaction | `app/layouts/default.vue` |
| `focus-visible-not-suppressed` | interaction | `app/pages/index.vue:41` |
| `images-have-alt` | accessibility | `app/pages/index.vue:23` |
| `icon-buttons-have-labels` | accessibility | `app/pages/index.vue:31` |
| `dialogs-have-accessible-names` | accessibility | `app/pages/index.vue:51` |
| `no-positive-tabindex` | accessibility | `app/pages/index.vue:38` |
| `iframes-have-title` | accessibility | `app/pages/index.vue:44` |
| `interactive-elements-are-semantic` | accessibility | `app/pages/index.vue:26` |
| `forms-have-labels` | forms | `app/pages/settings.vue:19` |
| `form-buttons-have-explicit-type` | forms | `app/pages/settings.vue:42` |
| `personal-data-autocomplete-present` | forms | `app/pages/settings.vue:19` |
| `public-app-seo-files-present` | production-polish | `public/sitemap.xml` |
| `button-icons-have-data-icon` | production-polish | `app/pages/index.vue:32` |

### Advisory (2)

| Rule | Category | Evidence |
| --- | --- | --- |
| `items-belong-to-groups` | interaction | `app/components/ui/select/SelectItem.vue:17` |
| `destructive-actions-confirmed` | interaction | `app/pages/index.vue:57` |

### Passing (28)

`theme-provider-configured`, `metadata-configured`, `favicon-present`, `not-found-route-present`, `error-boundary-present`, `theme-provider-mounted-in-shell`, `theme-hydration-safe`, `command-menu-present`, `command-menu-hotkey-present`, `global-hotkeys-are-safe`, `toast-provider-present`, `toast-provider-mounted`, `route-loading-boundary-present`, `empty-state-present`, `error-state-retry-present`, `not-found-recovery-present`, `async-action-pending-state`, `html-lang-present`, `links-have-accessible-names`, `nav-landmarks-have-names`, `heading-structure-sane`, `no-nested-interactive-controls`, `grouped-controls-have-legend`, `no-starter-copy`, `metadata-title-description-complete`, `social-preview-present`, `responsive-shell-present`, `mobile-overflow-absent`

### Not applicable (7)

`components-aliases-resolve`, `suspense-fallback-useful`, `field-errors-rendered`, `invalid-fields-associated-with-errors`, `validation-wired-to-form`, `animations-respect-reduced-motion`, `pointer-target-size-passes`
