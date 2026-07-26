import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { discoverProject, runAudit, type AuditRule } from '../src/index.js';
import { customControlsHaveLabels } from '../src/rules/accessibility/custom-controls-have-labels.js';
import { statusMessagesAnnounced } from '../src/rules/accessibility/status-messages-announced.js';
import { typingTargetGuard } from '../src/rules/interaction/typing-target-guard.js';
import { toastRuntime } from '../src/rules/states/toast-runtime.js';

const fixturesDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'fixtures',
  'rules',
  'upstream-parity',
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

describe('custom-controls-have-labels', () => {
  it('fails a SelectTrigger whose only text is a placeholder', async () => {
    const outcome = await outcomeOf('custom-control-unlabelled', customControlsHaveLabels);
    expect(outcome.status).toBe('fail');
    expect(outcome.findings[0]!.message).toContain('no accessible name');
  });

  it('passes when the control carries an aria-label', async () => {
    expect((await outcomeOf('custom-control-labelled', customControlsHaveLabels)).status).toBe(
      'pass',
    );
  });
});

describe('toast-runtime', () => {
  it('fails when toast() is called with no toast library installed', async () => {
    const outcome = await outcomeOf('toast-no-runtime', toastRuntime);
    expect(outcome.status).toBe('fail');
    expect(outcome.findings[0]!.message).toContain('no toast runtime is installed');
  });

  it('passes when vue-sonner backs the call', async () => {
    expect((await outcomeOf('toast-with-runtime', toastRuntime)).status).toBe('pass');
  });
});

describe('status-messages-announced', () => {
  it('fails a pending message with no live region', async () => {
    const outcome = await outcomeOf('status-unannounced', statusMessagesAnnounced);
    expect(outcome.status).toBe('fail');
  });

  it('passes when the message sits in role=status', async () => {
    expect((await outcomeOf('status-announced', statusMessagesAnnounced)).status).toBe('pass');
  });
});

describe('typing-target-guard', () => {
  it('fails a bare single-letter shortcut with no typing guard', async () => {
    const outcome = await outcomeOf('hotkey-steals-typing', typingTargetGuard);
    expect(outcome.status).toBe('fail');
  });

  it('does not flag a handler that only reacts to Escape', async () => {
    const outcome = await outcomeOf('hotkey-escape-only', typingTargetGuard);
    expect(outcome.status).toBe('not-applicable');
  });
});
