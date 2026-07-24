import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { discoverProject, runAudit, type AuditRule } from '../src/index.js';
import { formsHaveLabels } from '../src/rules/forms/forms-have-labels.js';
import { noStarterCopy } from '../src/rules/production-polish/no-starter-copy.js';
import { emptyStatePresent } from '../src/rules/states/empty-state-present.js';

const fixturesDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'fixtures',
  'rules',
  'regression',
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

describe('false positives found by scanning real applications', () => {
  it('accepts a populated-branch guard paired with v-else as an empty state', async () => {
    expect((await outcomeOf('empty-inverse', emptyStatePresent)).status).toBe('pass');
  });

  it('does not audit generated shadcn primitives for labels', async () => {
    expect((await outcomeOf('ui-primitive', formsHaveLabels)).status).toBe('pass');
  });

  it('allows example.com inside an input placeholder', async () => {
    expect((await outcomeOf('placeholder-domain', noStarterCopy)).status).toBe('pass');
  });

  it('still flags example.com used as a real destination', async () => {
    const outcome = await outcomeOf('placeholder-domain-href', noStarterCopy);
    expect(outcome.status).toBe('fail');
    expect(outcome.findings[0]!.message).toContain('placeholder domain');
  });

  it('treats SelectTrigger as the labellable control, not the Select root', async () => {
    expect((await outcomeOf('select-root', formsHaveLabels)).status).toBe('pass');
  });
});
