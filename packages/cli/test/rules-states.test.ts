import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { discoverProject, runAudit, type AuditRule } from '../src/index.js';
import { asyncActionPendingState } from '../src/rules/states/async-action-pending-state.js';
import { emptyStatePresent } from '../src/rules/states/empty-state-present.js';
import { errorStateRetryPresent } from '../src/rules/states/error-state-retry-present.js';
import { notFoundRecoveryPresent } from '../src/rules/states/not-found-recovery-present.js';
import { routeLoadingBoundaryPresent } from '../src/rules/states/route-loading-boundary-present.js';
import { suspenseFallbackUseful } from '../src/rules/states/suspense-fallback-useful.js';
import { toastProviderMounted } from '../src/rules/states/toast-provider-mounted.js';
import { toastProviderPresent } from '../src/rules/states/toast-provider-present.js';

const fixturesDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'fixtures',
  'rules',
  'states',
);

const outcomeOf = async (fixture: string, rule: AuditRule) => {
  const discovery = await discoverProject(path.join(fixturesDir, fixture));
  const report = await runAudit(discovery, [rule]);
  const outcome = report.outcomes[0];
  if (outcome === undefined) {
    throw new Error(`Rule ${rule.id} did not run for fixture ${fixture}`);
  }
  return outcome;
};

describe('toast-provider-present', () => {
  it('fails when the runtime is installed but nothing is mounted', async () => {
    expect((await outcomeOf('toast-fail', toastProviderPresent)).status).toBe('fail');
  });

  it('passes when a provider element is mounted', async () => {
    expect((await outcomeOf('toast-pass', toastProviderPresent)).status).toBe('pass');
  });
});

describe('toast-provider-mounted', () => {
  it('fails when the provider is mounted outside the app shell', async () => {
    expect((await outcomeOf('toast-notshell', toastProviderMounted)).status).toBe('fail');
  });

  it('passes when mounted from the shell', async () => {
    expect((await outcomeOf('toast-pass', toastProviderMounted)).status).toBe('pass');
  });
});

describe('suspense-fallback-useful', () => {
  it('fails an empty fallback slot', async () => {
    expect((await outcomeOf('suspense-fail', suspenseFallbackUseful)).status).toBe('fail');
  });

  it('passes a fallback with content', async () => {
    expect((await outcomeOf('suspense-pass', suspenseFallbackUseful)).status).toBe('pass');
  });

  it('is not applicable without Suspense', async () => {
    expect((await outcomeOf('toast-pass', suspenseFallbackUseful)).status).toBe('not-applicable');
  });
});

describe('empty-state-present', () => {
  it('fails a list with no empty branch', async () => {
    const outcome = await outcomeOf('empty-fail', emptyStatePresent);
    expect(outcome.status).toBe('fail');
    expect(outcome.findings[0]!.evidence[0]!.path).toBe('src/App.vue');
  });

  it('passes when an empty branch exists', async () => {
    expect((await outcomeOf('empty-pass', emptyStatePresent)).status).toBe('pass');
  });
});

describe('error-state-retry-present', () => {
  it('fails an error page with no wired control', async () => {
    const outcome = await outcomeOf('errorretry-fail', errorStateRetryPresent);
    expect(outcome.status).toBe('fail');
    expect(outcome.findings[0]!.message).toContain('retry');
  });

  it('passes when a recovery handler is wired', async () => {
    expect((await outcomeOf('errorretry-pass', errorStateRetryPresent)).status).toBe('pass');
  });

  it('is not applicable without an error surface', async () => {
    expect((await outcomeOf('toast-pass', errorStateRetryPresent)).status).toBe('not-applicable');
  });
});

describe('not-found-recovery-present', () => {
  it('fails a not-found page with no way back', async () => {
    expect((await outcomeOf('notfound-fail', notFoundRecoveryPresent)).status).toBe('fail');
  });

  it('passes when a link home exists', async () => {
    expect((await outcomeOf('notfound-pass', notFoundRecoveryPresent)).status).toBe('pass');
  });
});

describe('async-action-pending-state', () => {
  it('fails an async submit with no pending feedback', async () => {
    const outcome = await outcomeOf('pending-fail', asyncActionPendingState);
    expect(outcome.status).toBe('fail');
    expect(outcome.findings[0]!.message).toContain('pending feedback');
  });

  it('passes when pending is bound to the submit control', async () => {
    expect((await outcomeOf('pending-pass', asyncActionPendingState)).status).toBe('pass');
  });

  it('is not applicable without forms', async () => {
    expect((await outcomeOf('toast-pass', asyncActionPendingState)).status).toBe('not-applicable');
  });
});

describe('route-loading-boundary-present', () => {
  it('fails a Nuxt app with no loading indicator', async () => {
    expect((await outcomeOf('routeload-nuxt-fail', routeLoadingBoundaryPresent)).status).toBe(
      'fail',
    );
  });

  it('passes when NuxtLoadingIndicator is mounted', async () => {
    expect((await outcomeOf('routeload-nuxt-pass', routeLoadingBoundaryPresent)).status).toBe(
      'pass',
    );
  });
});
