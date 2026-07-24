# Rule catalog

shadscan-vue ships 51 rules across 6 categories (ruleset 0.1.0).

Every rule is deterministic: it reports what it can prove from source. A rule
that cannot apply to a project returns *not applicable* and leaves the score
untouched, and a low-confidence finding is reported as an advisory that never
subtracts points.

| Category | Weight | Rules | Points |
| --- | ---: | ---: | ---: |
| [Foundation](#foundation) | 20 | 9 | 27 |
| [Interaction](#interaction) | 20 | 8 | 23 |
| [States](#states) | 20 | 8 | 28 |
| [Accessibility](#accessibility) | 20 | 10 | 29 |
| [Forms and Data Entry](#forms) | 10 | 7 | 20 |
| [Production Polish](#production-polish) | 10 | 9 | 22 |

## Foundation

<a id="foundation"></a>Weight 20 of 100 · 9 rules

### `shadcn-config-present`

Checks that a components.json file exists at the project root and parses cleanly, so shadcn-vue tooling and alias-aware audits can work.

- Warning · high confidence · 4 points
- Applies to: all adapters

### `theme-provider-configured`

Confirms the app ships light/dark theme management: the Nuxt color-mode module, a @vueuse/core useColorMode/useDark composable, or a manual documentElement dark-class toggle.

- Warning · high confidence · 5 points
- Applies to: all adapters

### `metadata-configured`

Confirms the app declares a document title and description so pages have meaningful metadata for browsers, search, and sharing.

- Warning · high confidence · 3 points
- Applies to: all adapters

### `favicon-present`

Confirms the app ships a favicon: a public/favicon or icon asset, or an explicit icon <link> in index.html or the Nuxt head config.

- Info · high confidence · 2 points
- Applies to: all adapters

### `not-found-route-present`

Confirms unmatched routes are handled: a Nuxt error.vue page, or a Vue Router catch-all route / NotFound view in the router configuration.

- Warning · high confidence · 3 points
- Applies to: all adapters

### `error-boundary-present`

Confirms runtime render errors are caught: a Nuxt error page or <NuxtErrorBoundary>, or a Vue onErrorCaptured hook / app.config.errorHandler in the entry.

- Warning · high confidence · 3 points
- Applies to: all adapters

### `components-aliases-resolve`

When components.json configures import aliases, tsconfig.json or jsconfig.json must declare matching compilerOptions.paths so the aliases resolve at build time.

- Warning · high confidence · 2 points
- Applies to: all adapters

### `theme-provider-mounted-in-shell`

Confirms theme management is actually wired into the app shell (app.vue/layout or App.vue/main.ts), not merely present somewhere in the codebase.

- Warning · high confidence · 3 points
- Applies to: all adapters

### `theme-hydration-safe`

For Nuxt apps, confirms theme state is read in an SSR-safe way: via the color-mode module, or a manual client-side theme read guarded by an inline head script that runs before hydration.

- Warning · high confidence · 2 points
- Applies to: all adapters

## Interaction

<a id="interaction"></a>Weight 20 of 100 · 8 rules

### `theme-hotkey-present`

A keyboard shortcut should toggle the color theme, guarded so it does not fire while the user is typing in an input, textarea, select, or contenteditable element.

- Warning · high confidence · 5 points
- Applies to: all adapters

### `command-menu-present`

A discoverable command palette should be mounted at the app level: the shadcn command module is used and a single template renders the dialog, input, empty state, and command items together.

- Warning · high confidence · 5 points
- Applies to: all adapters

### `command-menu-hotkey-present`

The command palette should be reachable via the conventional Cmd/Ctrl+K shortcut that prevents the default action and toggles the menu open.

- Warning · high confidence · 4 points
- Applies to: all adapters

### `global-hotkeys-are-safe`

Global keydown listeners must be cleaned up on unmount and must not hijack bare printable keys while the user is typing. VueUse listener helpers, which clean up automatically, are treated as safe.

- Warning · medium confidence · 3 points
- Applies to: all adapters

### `mobile-nav-present`

When an app-level navigation shell exists, mobile users need a responsive affordance: a mobile-visibility trigger opening a Sheet/Drawer/Dialog, or a responsive fixed bottom navigation.

- Warning · medium confidence · 3 points
- Applies to: all adapters

### `focus-visible-not-suppressed`

Removing the focus outline without a visible replacement makes keyboard navigation invisible. Every `outline-none`/`outline: none` must be paired with a focus-visible indicator.

- Error · medium confidence · 3 points
- Applies to: all adapters

### `items-belong-to-groups`

Select, dropdown, and command items should be composed inside their content or group wrappers. This advisory highlights items that appear misplaced within a single template.

- Warning · medium confidence · 0 points
- Applies to: all adapters

### `destructive-actions-confirmed`

Destructive controls should be paired with a confirmation or undo affordance so users do not lose data by accident. This advisory flags destructive controls with no correlated confirmation in the same file.

- Warning · low confidence · 0 points
- Applies to: all adapters

## States

<a id="states"></a>Weight 20 of 100 · 8 rules

### `toast-provider-present`

A recognized toast runtime must be installed and a matching provider element (Toaster/SonnerToaster/UNotifications, or a sonner ui-dir component) must be mounted in a template.

- Warning · high confidence · 3 points
- Applies to: all adapters

### `toast-provider-mounted`

A toast provider element must be rendered from an app-shell file (app.vue, App.vue, a layout, or error.vue), not merely present somewhere in the component tree.

- Warning · high confidence · 3 points
- Applies to: all adapters

### `route-loading-boundary-present`

Navigations should surface progress: a <NuxtLoadingIndicator> for Nuxt, or a router progress hook / top-level Suspense fallback for lazy-loaded Vue Router routes.

- Warning · medium confidence · 4 points
- Applies to: all adapters

### `suspense-fallback-useful`

Every <Suspense> element must declare a #fallback template slot containing non-empty content, so users see a real loading affordance while async setup resolves.

- Warning · high confidence · 3 points
- Applies to: all adapters

### `empty-state-present`

Templates that iterate a script-defined collection with v-for must also render an empty branch (a length-guarded v-if/v-else-if/v-else) so an empty list is not a blank screen.

- Warning · medium confidence · 4 points
- Applies to: all adapters

### `error-state-retry-present`

An error surface that only reports failure strands the user. It needs a wired retry, reload, or navigation control.

- Error · high confidence · 4 points
- Applies to: all adapters

### `not-found-recovery-present`

A not-found page should route the user back into the product through navigation, a back action, or search rather than ending the session.

- Warning · high confidence · 3 points
- Applies to: all adapters

### `async-action-pending-state`

A form that submits asynchronously without a pending state gives no feedback and allows duplicate submissions on repeated clicks.

- Warning · medium confidence · 4 points
- Applies to: all adapters

## Accessibility

<a id="accessibility"></a>Weight 20 of 100 · 10 rules

### `html-lang-present`

The document root must declare a meaningful lang attribute so assistive technology can select the right voice and hyphenation.

- Error · high confidence · 2 points
- Applies to: all adapters

### `images-have-alt`

Native <img> elements and Nuxt image components must declare alternative text. Bound :alt values pass; missing or empty static alt fails.

- Error · high confidence · 4 points
- Applies to: all adapters

### `icon-buttons-have-labels`

A button whose entire content is an icon has no accessible name unless one is supplied explicitly, leaving screen reader users with an unlabelled control.

- Error · high confidence · 4 points
- Applies to: all adapters

### `links-have-accessible-names`

A link with no text, no label, and no described image is announced as an anonymous destination and cannot be understood out of context.

- Error · high confidence · 3 points
- Applies to: all adapters

### `nav-landmarks-have-names`

When an app exposes more than one navigation landmark, each needs its own name so screen reader users can tell primary navigation from secondary.

- Warning · high confidence · 2 points
- Applies to: all adapters

### `heading-structure-sane`

Screen reader users navigate by heading level. A page with no level-one heading, or one that skips levels, produces an outline that cannot be scanned reliably.

- Warning · medium confidence · 3 points
- Applies to: all adapters

### `no-positive-tabindex`

A positive tabindex pulls an element out of document order and forces every other focusable element behind it, which breaks keyboard navigation across the page.

- Error · high confidence · 2 points
- Applies to: all adapters

### `iframes-have-title`

An iframe without a title is announced only as "frame", giving no indication of what it contains before a user enters it.

- Error · high confidence · 2 points
- Applies to: all adapters

### `interactive-elements-are-semantic`

A clickable div is invisible to keyboard and assistive technology unless it declares a role, is focusable, and handles keyboard activation.

- Error · medium confidence · 4 points
- Applies to: all adapters

### `no-nested-interactive-controls`

Nesting a control inside another control produces invalid markup with undefined activation behavior and ambiguous announcements in assistive technology.

- Error · high confidence · 3 points
- Applies to: all adapters

## Forms and Data Entry

<a id="forms"></a>Weight 10 of 100 · 7 rules

### `forms-have-labels`

Every data-entry control needs a programmatic label. Placeholder text is not a label and disappears the moment a user starts typing.

- Error · high confidence · 4 points
- Applies to: all adapters

### `field-errors-rendered`

A validation library that never renders its messages fails silently: the form refuses to submit and the user is given no reason why.

- Error · medium confidence · 4 points
- Applies to: all adapters

### `invalid-fields-associated-with-errors`

A visible error message that is not linked to its control never reaches screen reader users, who hear only that the field is required after submission fails.

- Error · medium confidence · 3 points
- Applies to: all adapters

### `form-buttons-have-explicit-type`

A button inside a form defaults to type="submit". Any secondary action without an explicit type silently submits the form when clicked.

- Warning · high confidence · 3 points
- Applies to: all adapters

### `grouped-controls-have-legend`

Radio groups and fieldsets need a group-level name, otherwise each option is announced without the question it answers.

- Warning · medium confidence · 2 points
- Applies to: all adapters

### `personal-data-autocomplete-present`

Autocomplete tokens let browsers and password managers fill known values, which removes the most error-prone typing in any form.

- Warning · medium confidence · 2 points
- Applies to: all adapters

### `validation-wired-to-form`

An installed validation library that no form is connected to provides no protection: submissions bypass the schema entirely.

- Warning · medium confidence · 2 points
- Applies to: all adapters

## Production Polish

<a id="production-polish"></a>Weight 10 of 100 · 9 rules

### `no-starter-copy`

Detects leftover framework starter text, placeholder domains, and lorem ipsum that ships to users when a scaffold is never replaced.

- Warning · high confidence · 3 points
- Applies to: all adapters

### `metadata-title-description-complete`

Every routable page should set its own title and description so search results and browser tabs are not inherited from a generic app-level default.

- Warning · medium confidence · 3 points
- Applies to: all adapters

### `social-preview-present`

Checks for Open Graph or Twitter card metadata so links shared in chat apps and social feeds render a title and image instead of a bare URL.

- Info · high confidence · 2 points
- Applies to: all adapters

### `public-app-seo-files-present`

Checks that robots.txt and a sitemap are served, either as static files or through a framework module that generates them.

- Info · high confidence · 2 points
- Applies to: all adapters

### `responsive-shell-present`

The app shell should change layout across breakpoints instead of rendering one fixed desktop composition on every viewport.

- Warning · medium confidence · 3 points
- Applies to: all adapters

### `mobile-overflow-absent`

Fixed pixel widths wider than a small phone viewport cause horizontal scrolling. Responsive-prefixed utilities are exempt because they only apply above a breakpoint.

- Warning · medium confidence · 3 points
- Applies to: all adapters

### `animations-respect-reduced-motion`

Continuous or large-scale animation should be guarded by a reduced-motion preference so users with vestibular sensitivity are not forced into motion.

- Warning · medium confidence · 2 points
- Applies to: all adapters

### `pointer-target-size-passes`

Interactive controls sized below the WCAG 2.2 minimum target area are hard to hit on touch devices. Only statically-sized controls are evaluated.

- Warning · medium confidence · 2 points
- Applies to: all adapters

### `button-icons-have-data-icon`

Icons rendered inside a labelled control should be hidden from assistive technology so screen readers announce the label once instead of reading icon markup.

- Info · medium confidence · 2 points
- Applies to: all adapters

