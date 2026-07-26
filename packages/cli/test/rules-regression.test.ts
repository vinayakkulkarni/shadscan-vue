import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { discoverProject, runAudit, type AuditRule } from '../src/index.js';
import { componentsAliasesResolve } from '../src/rules/foundation/components-aliases-resolve.js';
import { formsHaveLabels } from '../src/rules/forms/forms-have-labels.js';
import { commandMenuHotkeyPresent } from '../src/rules/interaction/command-menu-hotkey-present.js';
import { buttonIconsHaveDataIcon } from '../src/rules/production-polish/button-icons-have-data-icon.js';
import { metadataTitleDescriptionComplete } from '../src/rules/production-polish/metadata-title-description-complete.js';
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

describe('alias resolution through project references', () => {
  it('follows a create-vue references stub to tsconfig.app.json', async () => {
    expect((await outcomeOf('alias-references', componentsAliasesResolve)).status).toBe('pass');
  });

  it('follows a Nuxt references stub to the generated .nuxt config', async () => {
    expect((await outcomeOf('alias-nuxt-generated', componentsAliasesResolve)).status).toBe('pass');
  });

  it('still fails when no referenced config declares a mapping', async () => {
    const outcome = await outcomeOf('alias-uncovered', componentsAliasesResolve);
    expect(outcome.status).toBe('fail');
    expect(outcome.findings[0]!.message).toContain('not covered');
  });
});

describe('alias resolution when generated configs are absent', () => {
  it('reports advisory instead of failing on a fresh checkout', async () => {
    const outcome = await outcomeOf('alias-nuxt-ungenerated', componentsAliasesResolve);
    expect(outcome.status).toBe('advisory');
    expect(outcome.findings[0]!.message).toContain('not been generated yet');
    expect(outcome.impactsScore).toBe(true);
    expect(outcome.score).toBe(componentsAliasesResolve.maxScore);
  });
});

describe('false positives found by dogfooding on production applications', () => {
  it('does not demand an empty state for a collection declared as a non-empty literal', async () => {
    const outcome = await outcomeOf('static-literal-collection', emptyStatePresent);
    expect(outcome.status).toBe('pass');
  });

  it('still demands an empty state for a collection populated at runtime', async () => {
    const outcome = await outcomeOf('dynamic-collection', emptyStatePresent);
    expect(outcome.status).toBe('fail');
  });

  it('does not treat definePageMeta as a metadata declaration', async () => {
    const outcome = await outcomeOf('definepagemeta-only', metadataTitleDescriptionComplete);
    expect(outcome.status).toBe('fail');
    expect(outcome.findings[0]!.message).toContain('does not declare its own metadata');
  });
});

describe('icons already hidden by the icon module', () => {
  it('does not flag a @nuxt/icon component inside a control', async () => {
    const outcome = await outcomeOf('nuxt-icon-decorative', buttonIconsHaveDataIcon);
    expect(outcome.status).toBe('not-applicable');
  });

  it('still flags a raw svg inside a control', async () => {
    const outcome = await outcomeOf('raw-icon-exposed', buttonIconsHaveDataIcon);
    expect(outcome.status).toBe('fail');
  });
});

describe('command-menu hotkey detection across VueUse idioms', () => {
  it('accepts the destructured snake_case useMagicKeys binding', async () => {
    const outcome = await outcomeOf('magic-keys-destructured', commandMenuHotkeyPresent);
    expect(outcome.status).toBe('pass');
  });
});

describe('metadata declared through a project SEO composable', () => {
  it('accepts a page whose metadata comes from a usePageSeo wrapper', async () => {
    const outcome = await outcomeOf('seo-composable-wrapper', metadataTitleDescriptionComplete);
    expect(outcome.status).toBe('pass');
  });
});
