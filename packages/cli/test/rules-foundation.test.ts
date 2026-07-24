import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { AuditRule, RuleOutcome } from '../src/audit.js';
import { discoverProject, runAudit } from '../src/index.js';
import { componentsAliasesResolve } from '../src/rules/foundation/components-aliases-resolve.js';
import { errorBoundaryPresent } from '../src/rules/foundation/error-boundary-present.js';
import { faviconPresent } from '../src/rules/foundation/favicon-present.js';
import { metadataConfigured } from '../src/rules/foundation/metadata-configured.js';
import { notFoundRoutePresent } from '../src/rules/foundation/not-found-route-present.js';
import { themeHydrationSafe } from '../src/rules/foundation/theme-hydration-safe.js';
import { themeProviderConfigured } from '../src/rules/foundation/theme-provider-configured.js';
import { themeProviderMountedInShell } from '../src/rules/foundation/theme-provider-mounted-in-shell.js';

const fixturesDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'fixtures',
  'rules',
  'foundation',
);

const outcomeOf = async (
  rule: AuditRule,
  ruleDir: string,
  fixtureCase: string,
): Promise<RuleOutcome> => {
  const discovery = await discoverProject(path.join(fixturesDir, ruleDir, fixtureCase));
  const report = await runAudit(discovery, [rule]);
  const outcome = report.outcomes.find((entry) => entry.rule.id === rule.id);
  if (outcome === undefined) {
    throw new Error(`No outcome for ${rule.id} in ${ruleDir}/${fixtureCase}`);
  }
  return outcome;
};

describe('theme-provider-configured', () => {
  it('fails when no theme management exists', async () => {
    const outcome = await outcomeOf(themeProviderConfigured, 'theme-provider-configured', 'fail');
    expect(outcome.status).toBe('fail');
    expect(outcome.findings[0]!.message).toBe('No theme provider or theme management was found.');
    expect(outcome.findings[0]!.remediation).toBeDefined();
  });

  it('passes when @nuxtjs/color-mode is a dependency', async () => {
    const outcome = await outcomeOf(
      themeProviderConfigured,
      'theme-provider-configured',
      'pass-colormode',
    );
    expect(outcome.status).toBe('pass');
  });

  it('passes when useColorMode is imported from @vueuse/core', async () => {
    const outcome = await outcomeOf(
      themeProviderConfigured,
      'theme-provider-configured',
      'pass-vueuse',
    );
    expect(outcome.status).toBe('pass');
  });

  it('passes when a manual documentElement dark toggle exists', async () => {
    const outcome = await outcomeOf(
      themeProviderConfigured,
      'theme-provider-configured',
      'pass-manual',
    );
    expect(outcome.status).toBe('pass');
  });
});

describe('metadata-configured', () => {
  it('fails on vite when the html title exists but description is missing', async () => {
    const outcome = await outcomeOf(metadataConfigured, 'metadata-configured', 'vite-fail');
    expect(outcome.status).toBe('fail');
    expect(outcome.findings[0]!.message).toContain('meta description');
    expect(outcome.findings[0]!.remediation).toBeDefined();
  });

  it('passes on vite with title and description', async () => {
    const outcome = await outcomeOf(metadataConfigured, 'metadata-configured', 'vite-pass');
    expect(outcome.status).toBe('pass');
  });

  it('fails on nuxt when no head title exists', async () => {
    const outcome = await outcomeOf(metadataConfigured, 'metadata-configured', 'nuxt-fail');
    expect(outcome.status).toBe('fail');
    expect(outcome.findings[0]!.remediation).toBeDefined();
  });

  it('passes on nuxt with app.head title in config', async () => {
    const outcome = await outcomeOf(metadataConfigured, 'metadata-configured', 'nuxt-pass-config');
    expect(outcome.status).toBe('pass');
  });

  it('passes on nuxt with useSeoMeta title in app.vue', async () => {
    const outcome = await outcomeOf(metadataConfigured, 'metadata-configured', 'nuxt-pass-seometa');
    expect(outcome.status).toBe('pass');
  });
});

describe('favicon-present', () => {
  it('fails when no favicon asset or icon link exists', async () => {
    const outcome = await outcomeOf(faviconPresent, 'favicon-present', 'fail');
    expect(outcome.status).toBe('fail');
    expect(outcome.findings[0]!.remediation).toBeDefined();
  });

  it('passes when public/favicon.ico exists', async () => {
    const outcome = await outcomeOf(faviconPresent, 'favicon-present', 'pass-public');
    expect(outcome.status).toBe('pass');
  });

  it('passes when index.html declares a rel="icon" link', async () => {
    const outcome = await outcomeOf(faviconPresent, 'favicon-present', 'pass-htmllink');
    expect(outcome.status).toBe('pass');
  });

  it('passes when the Nuxt head config declares an icon link', async () => {
    const outcome = await outcomeOf(faviconPresent, 'favicon-present', 'pass-nuxtlink');
    expect(outcome.status).toBe('pass');
  });
});

describe('not-found-route-present', () => {
  it('fails on nuxt when no error.vue exists', async () => {
    const outcome = await outcomeOf(notFoundRoutePresent, 'not-found-route-present', 'nuxt-fail');
    expect(outcome.status).toBe('fail');
    expect(outcome.findings[0]!.remediation).toBeDefined();
  });

  it('passes on nuxt with a root error.vue', async () => {
    const outcome = await outcomeOf(notFoundRoutePresent, 'not-found-route-present', 'nuxt-pass');
    expect(outcome.status).toBe('pass');
  });

  it('fails on vite when the router lacks a catch-all', async () => {
    const outcome = await outcomeOf(notFoundRoutePresent, 'not-found-route-present', 'vite-fail');
    expect(outcome.status).toBe('fail');
    expect(outcome.findings[0]!.remediation).toBeDefined();
  });

  it('passes on vite with a catch-all route and NotFound view', async () => {
    const outcome = await outcomeOf(notFoundRoutePresent, 'not-found-route-present', 'vite-pass');
    expect(outcome.status).toBe('pass');
  });
});

describe('error-boundary-present', () => {
  it('fails on nuxt when no error page or boundary exists', async () => {
    const outcome = await outcomeOf(errorBoundaryPresent, 'error-boundary-present', 'nuxt-fail');
    expect(outcome.status).toBe('fail');
    expect(outcome.findings[0]!.remediation).toBeDefined();
  });

  it('passes on nuxt with a NuxtErrorBoundary', async () => {
    const outcome = await outcomeOf(errorBoundaryPresent, 'error-boundary-present', 'nuxt-pass');
    expect(outcome.status).toBe('pass');
  });

  it('fails on vite when no onErrorCaptured or errorHandler exists', async () => {
    const outcome = await outcomeOf(errorBoundaryPresent, 'error-boundary-present', 'vite-fail');
    expect(outcome.status).toBe('fail');
    expect(outcome.findings[0]!.remediation).toBeDefined();
  });

  it('passes on vite with an onErrorCaptured hook', async () => {
    const outcome = await outcomeOf(
      errorBoundaryPresent,
      'error-boundary-present',
      'vite-pass-hook',
    );
    expect(outcome.status).toBe('pass');
  });

  it('passes on vite with app.config.errorHandler in main.ts', async () => {
    const outcome = await outcomeOf(
      errorBoundaryPresent,
      'error-boundary-present',
      'vite-pass-handler',
    );
    expect(outcome.status).toBe('pass');
  });
});

describe('components-aliases-resolve', () => {
  it('is not applicable when components.json is absent', async () => {
    const outcome = await outcomeOf(componentsAliasesResolve, 'components-aliases-resolve', 'na');
    expect(outcome.status).toBe('not-applicable');
  });

  it('fails when aliases are configured but no tsconfig/jsconfig paths exist', async () => {
    const outcome = await outcomeOf(
      componentsAliasesResolve,
      'components-aliases-resolve',
      'fail-noconfig',
    );
    expect(outcome.status).toBe('fail');
    expect(outcome.findings[0]!.message).toBe(
      'Shadcn aliases are configured, but no tsconfig.json or jsconfig.json path mappings were found.',
    );
  });

  it('fails when a path mapping does not cover an alias prefix', async () => {
    const outcome = await outcomeOf(
      componentsAliasesResolve,
      'components-aliases-resolve',
      'fail-uncovered',
    );
    expect(outcome.status).toBe('fail');
    expect(outcome.findings[0]!.remediation).toBeDefined();
  });

  it('passes when tsconfig paths cover every alias prefix', async () => {
    const outcome = await outcomeOf(componentsAliasesResolve, 'components-aliases-resolve', 'pass');
    expect(outcome.status).toBe('pass');
  });
});

describe('theme-provider-mounted-in-shell', () => {
  it('passes on nuxt when the color-mode module is present', async () => {
    const outcome = await outcomeOf(
      themeProviderMountedInShell,
      'theme-provider-mounted-in-shell',
      'nuxt-pass-module',
    );
    expect(outcome.status).toBe('pass');
  });

  it('fails on nuxt when a theme composable exists but is not wired into the shell', async () => {
    const outcome = await outcomeOf(
      themeProviderMountedInShell,
      'theme-provider-mounted-in-shell',
      'nuxt-fail',
    );
    expect(outcome.status).toBe('fail');
    expect(outcome.findings[0]!.message).toBe('The app shell does not wire up the theme provider.');
  });

  it('passes on nuxt when app.vue imports a component that uses the theme composable', async () => {
    const outcome = await outcomeOf(
      themeProviderMountedInShell,
      'theme-provider-mounted-in-shell',
      'nuxt-pass-onehop',
    );
    expect(outcome.status).toBe('pass');
  });

  it('fails on vite when the theme composable is not referenced from the shell', async () => {
    const outcome = await outcomeOf(
      themeProviderMountedInShell,
      'theme-provider-mounted-in-shell',
      'vite-fail',
    );
    expect(outcome.status).toBe('fail');
    expect(outcome.findings[0]!.remediation).toBeDefined();
  });

  it('passes on vite when App.vue uses the theme composable directly', async () => {
    const outcome = await outcomeOf(
      themeProviderMountedInShell,
      'theme-provider-mounted-in-shell',
      'vite-pass-direct',
    );
    expect(outcome.status).toBe('pass');
  });

  it('passes on vite when main.ts imports a theme helper one hop away', async () => {
    const outcome = await outcomeOf(
      themeProviderMountedInShell,
      'theme-provider-mounted-in-shell',
      'vite-pass-onehop',
    );
    expect(outcome.status).toBe('pass');
  });
});

describe('theme-hydration-safe', () => {
  it('is not applicable on non-nuxt adapters', async () => {
    const outcome = await outcomeOf(themeHydrationSafe, 'theme-hydration-safe', 'vite-na');
    expect(outcome.status).toBe('not-applicable');
  });

  it('passes on nuxt when the color-mode module is used', async () => {
    const outcome = await outcomeOf(themeHydrationSafe, 'theme-hydration-safe', 'nuxt-pass-module');
    expect(outcome.status).toBe('pass');
  });

  it('is not applicable on nuxt with no client-side theme read', async () => {
    const outcome = await outcomeOf(themeHydrationSafe, 'theme-hydration-safe', 'nuxt-na-notheme');
    expect(outcome.status).toBe('not-applicable');
  });

  it('fails on nuxt when a client theme read has no inline head script', async () => {
    const outcome = await outcomeOf(themeHydrationSafe, 'theme-hydration-safe', 'nuxt-fail');
    expect(outcome.status).toBe('fail');
    expect(outcome.findings[0]!.message).toContain('flash of the wrong theme');
    expect(outcome.findings[0]!.remediation).toBeDefined();
  });

  it('passes on nuxt when a manual theme read is guarded by an inline head script', async () => {
    const outcome = await outcomeOf(themeHydrationSafe, 'theme-hydration-safe', 'nuxt-pass-inline');
    expect(outcome.status).toBe('pass');
  });
});
