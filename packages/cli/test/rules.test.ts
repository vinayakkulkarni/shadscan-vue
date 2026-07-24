import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { discoverProject, runAudit } from '../src/index.js';
import { htmlLangPresent } from '../src/rules/accessibility/html-lang-present.js';
import { imagesHaveAlt } from '../src/rules/accessibility/images-have-alt.js';
import { shadcnConfigPresent } from '../src/rules/foundation/shadcn-config-present.js';

const fixturesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');

const outcomeOf = async (fixture: string, ruleId: string) => {
  const discovery = await discoverProject(path.join(fixturesDir, fixture));
  const report = await runAudit(discovery, [shadcnConfigPresent, htmlLangPresent, imagesHaveAlt]);
  const outcome = report.outcomes.find((entry) => entry.rule.id === ruleId);
  if (outcome === undefined) {
    throw new Error(`No outcome for ${ruleId}`);
  }
  return outcome;
};

describe('shadcn-config-present', () => {
  it('passes when components.json parses', async () => {
    expect((await outcomeOf('vite-vue-minimal', 'shadcn-config-present')).status).toBe('pass');
  });

  it('fails when components.json is absent', async () => {
    const outcome = await outcomeOf('nuxt-minimal', 'shadcn-config-present');
    expect(outcome.status).toBe('fail');
    expect(outcome.findings[0]!.message).toContain('components.json');
  });
});

describe('html-lang-present', () => {
  it('passes for index.html with lang', async () => {
    expect((await outcomeOf('vite-vue-minimal', 'html-lang-present')).status).toBe('pass');
  });

  it('passes for nuxt.config htmlAttrs lang', async () => {
    expect((await outcomeOf('nuxt-minimal', 'html-lang-present')).status).toBe('pass');
  });
});

describe('images-have-alt', () => {
  it('fails on the missing-alt img with exact evidence line', async () => {
    const outcome = await outcomeOf('vite-vue-minimal', 'images-have-alt');
    expect(outcome.status).toBe('fail');
    expect(outcome.findings).toHaveLength(1);
    const evidence = outcome.findings[0]!.evidence[0]!;
    expect(evidence.path).toBe('src/App.vue');
    // <img src="/logo.png" /> sits on line 8 of the fixture SFC.
    expect(evidence.line).toBe(8);
  });

  it('passes on the clean nuxt fixture', async () => {
    expect((await outcomeOf('nuxt-minimal', 'images-have-alt')).status).toBe('pass');
  });
});
