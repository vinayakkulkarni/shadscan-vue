# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-07-25

Initial release: a Vue and Nuxt port of [shadscan](https://github.com/TheOrcDev/shadscan)
by [TheOrcDev](https://github.com/TheOrcDev), built with the original author's
permission.

### Added

- Static audit engine for shadcn-vue and shadcn-nuxt applications, with adapter
  detection for `nuxt`, `vite-vue`, and `generic-vue` projects.
- 51 rules across six weighted categories: Foundation, Interaction, States,
  Accessibility, Forms and Data Entry, and Production Polish.
- Vue-native analysis built on `@vue/compiler-sfc` template ASTs and the
  TypeScript compiler API, covering explicit imports and Nuxt auto-imports.
- Scoring model with a 0–100 score, A–F grades, per-category weighting, and a
  four-way finding taxonomy: fixes, advisories, passes, and not applicable.
- Three output formats: a human report, a JSON report (`schemaVersion` 1), and
  a paste-ready agent prompt with the report embedded as delimited untrusted
  data.
- `--fail-under` gating that also fails on unassessed scores and partial source
  coverage, so a skipped scan cannot pass a CI gate.
- `shadscan-vue rules` printing the rule catalog as markdown or JSON.
- `shadscan-vue setup --pre-commit` installing a git hook that creates,
  appends, or no-ops idempotently.
- Deterministic roast copy on interactive terminals, silent in CI and when
  piped.

### Security

- Read-only by design: the scanner never starts the app, writes source files,
  calls a model, or sends source anywhere.
- Source collection rejects symlinks, verifies paths stay inside the project
  root, and enforces file-count and byte budgets, reporting partial coverage
  when a limit truncates a scan.

[0.1.0]: https://github.com/vinayakkulkarni/shadscan-vue/releases/tag/v0.1.0
